import type { Key } from 'react';
import type { BGridDataItem, BGridTreeRowMeta } from '../types';
import { getCellValueByRowKey } from './getCellValue';

export type BGridTreeDiagnostic = 'missingRowKey' | 'duplicateRowKey' | 'cycle';

export interface BGridTreeProjection<T> {
  valid: boolean;
  data: BGridDataItem<T>[];
  sourceIndexByVisibleIndex: number[];
  visibleIndexBySourceIndex: Map<number, number>;
  metaByRowKey: Map<Key, BGridTreeRowMeta>;
  metaBySourceIndex: Map<number, BGridTreeRowMeta>;
  diagnostics: BGridTreeDiagnostic[];
}

interface TreeStackEntry {
  sourceIndex: number;
  depth: number;
  visible: boolean;
  siblingIndex: number;
  siblingCount: number;
}

function flatFallback<T>(data: BGridDataItem<T>[], diagnostics: BGridTreeDiagnostic[]): BGridTreeProjection<T> {
  const sourceIndexByVisibleIndex = data.map((_, index) => index);
  return {
    valid: false,
    data,
    sourceIndexByVisibleIndex,
    visibleIndexBySourceIndex: new Map(sourceIndexByVisibleIndex.map(index => [index, index])),
    metaByRowKey: new Map(),
    metaBySourceIndex: new Map(),
    diagnostics: Array.from(new Set(diagnostics)),
  };
}

/** Projects flat parent-key data into visible pre-order rows without mutating the input. */
export function projectTreeData<T>(params: {
  data: BGridDataItem<T>[];
  rowKey: Key | Key[];
  parentRowKey: Key | Key[];
  expandedRowKeys: readonly Key[];
  includedSourceIndexes?: readonly number[];
  orderedSourceIndexes?: readonly number[];
}): BGridTreeProjection<T> {
  const { data, rowKey, parentRowKey, expandedRowKeys, includedSourceIndexes, orderedSourceIndexes } = params;
  if (data.length === 0) {
    return {
      valid: true,
      data: [],
      sourceIndexByVisibleIndex: [],
      visibleIndexBySourceIndex: new Map(),
      metaByRowKey: new Map(),
      metaBySourceIndex: new Map(),
      diagnostics: [],
    };
  }

  const diagnostics: BGridTreeDiagnostic[] = [];
  const keys: Key[] = new Array(data.length);
  const indexByKey = new Map<Key, number>();

  data.forEach((item, sourceIndex) => {
    const key = getCellValueByRowKey(rowKey, item.values) as Key | null | undefined;
    if (key === undefined || key === null) {
      diagnostics.push('missingRowKey');
      return;
    }
    keys[sourceIndex] = key;
    if (indexByKey.has(key)) diagnostics.push('duplicateRowKey');
    else indexByKey.set(key, sourceIndex);
  });

  if (diagnostics.length > 0) return flatFallback(data, diagnostics);

  const parentIndexes: Array<number | undefined> = new Array(data.length);
  const childrenByParentIndex = new Map<number, number[]>();
  const roots: number[] = [];

  data.forEach((item, sourceIndex) => {
    const parentKey = getCellValueByRowKey(parentRowKey, item.values) as Key | null | undefined;
    const parentIndex = parentKey === undefined || parentKey === null ? undefined : indexByKey.get(parentKey);
    if (parentIndex === undefined) {
      roots.push(sourceIndex);
      return;
    }
    parentIndexes[sourceIndex] = parentIndex;
    const children = childrenByParentIndex.get(parentIndex) ?? [];
    children.push(sourceIndex);
    childrenByParentIndex.set(parentIndex, children);
  });

  // Every node has at most one parent, so iterative parent walking detects all cycles in O(N).
  const visitState = new Uint8Array(data.length);
  for (let start = 0; start < data.length; start++) {
    if (visitState[start] !== 0) continue;
    const path: number[] = [];
    let current: number | undefined = start;
    while (current !== undefined && visitState[current] === 0) {
      visitState[current] = 1;
      path.push(current);
      current = parentIndexes[current];
    }
    if (current !== undefined && visitState[current] === 1) diagnostics.push('cycle');
    path.forEach(index => {
      visitState[index] = 2;
    });
  }

  if (diagnostics.length > 0) return flatFallback(data, diagnostics);

  const orderRank = new Map<number, number>();
  orderedSourceIndexes?.forEach((sourceIndex, rank) => orderRank.set(sourceIndex, rank));
  const compareSourceOrder = (left: number, right: number) =>
    (orderRank.get(left) ?? Number.MAX_SAFE_INTEGER) - (orderRank.get(right) ?? Number.MAX_SAFE_INTEGER) ||
    left - right;
  roots.sort(compareSourceOrder);
  childrenByParentIndex.forEach(children => children.sort(compareSourceOrder));

  const included = includedSourceIndexes ? new Set(includedSourceIndexes) : undefined;
  const forcedExpanded = new Set<number>();
  if (included) {
    for (const matchedIndex of includedSourceIndexes ?? []) {
      let current = parentIndexes[matchedIndex];
      while (current !== undefined) {
        included.add(current);
        forcedExpanded.add(current);
        current = parentIndexes[current];
      }
    }
  }

  const expanded = new Set(expandedRowKeys);
  const visibleData: BGridDataItem<T>[] = [];
  const sourceIndexByVisibleIndex: number[] = [];
  const visibleIndexBySourceIndex = new Map<number, number>();
  const metaByRowKey = new Map<Key, BGridTreeRowMeta>();
  const metaBySourceIndex = new Map<number, BGridTreeRowMeta>();
  const stack: TreeStackEntry[] = roots
    .slice()
    .reverse()
    .map((sourceIndex, reverseIndex) => ({
      sourceIndex,
      depth: 0,
      visible: true,
      siblingIndex: roots.length - reverseIndex - 1,
      siblingCount: roots.length,
    }));

  while (stack.length > 0) {
    const entry = stack.pop()!;
    const { sourceIndex, depth } = entry;
    const key = keys[sourceIndex];
    const parentSourceIndex = parentIndexes[sourceIndex];
    const children = childrenByParentIndex.get(sourceIndex) ?? [];
    const isIncluded = !included || included.has(sourceIndex);
    const isExpanded = expanded.has(key);
    const effectiveExpanded = isExpanded || forcedExpanded.has(sourceIndex);
    const meta: BGridTreeRowMeta = {
      rowKey: key,
      parentRowKey: parentSourceIndex === undefined ? undefined : keys[parentSourceIndex],
      depth,
      hasChildren: children.length > 0,
      expanded: isExpanded,
      sourceIndex,
      parentSourceIndex,
      siblingIndex: entry.siblingIndex,
      siblingCount: entry.siblingCount,
    };
    metaByRowKey.set(key, meta);
    metaBySourceIndex.set(sourceIndex, meta);

    const visible = entry.visible && isIncluded;
    if (visible) {
      visibleIndexBySourceIndex.set(sourceIndex, visibleData.length);
      visibleData.push(data[sourceIndex]);
      sourceIndexByVisibleIndex.push(sourceIndex);
    }

    // Collapsed subtrees do not need row metadata until they become visible. Skipping
    // them keeps folding work proportional to the visible hierarchy, not all input rows.
    if (!visible || !effectiveExpanded) continue;

    for (let childIndex = children.length - 1; childIndex >= 0; childIndex--) {
      stack.push({
        sourceIndex: children[childIndex],
        depth: depth + 1,
        visible: true,
        siblingIndex: childIndex,
        siblingCount: children.length,
      });
    }
  }

  return {
    valid: true,
    data: visibleData,
    sourceIndexByVisibleIndex,
    visibleIndexBySourceIndex,
    metaByRowKey,
    metaBySourceIndex,
    diagnostics: [],
  };
}

export function getTreeRowPath(metaBySourceIndex: ReadonlyMap<number, BGridTreeRowMeta>, sourceIndex: number): Key[] {
  const path: Key[] = [];
  let current = metaBySourceIndex.get(sourceIndex);
  while (current) {
    path.push(current.rowKey);
    current = current.parentSourceIndex === undefined ? undefined : metaBySourceIndex.get(current.parentSourceIndex);
  }
  return path.reverse();
}
