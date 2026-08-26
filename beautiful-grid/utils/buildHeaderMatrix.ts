import type { AlignDirection, AppModelColumn, BGridColumnGroup, BGridColumnGroupNode } from '../types';
import type { CSSProperties, ReactNode } from 'react';

export interface HeaderCellDescriptor<T> {
  key: string;
  type: 'group' | 'column';
  columnIndex?: number;
  startColumnIndex: number;
  endColumnIndex: number;
  rowSpan: number;
  colSpan: number;
  depth: number;
  label: ReactNode;
  headerAlign?: AlignDirection;
  className?: string;
  headerStyle?: CSSProperties;
  groupId?: string;
  parentGroupId?: string;
  column?: AppModelColumn<T>;
}

export interface BuildHeaderMatrixOptions<T> {
  columns: AppModelColumn<T>[];
  columnGroups?: BGridColumnGroupNode[];
  columnsGroup?: BGridColumnGroup[];
  startColumnIndex?: number;
  endColumnIndex?: number;
}

export interface HeaderMatrix<T> {
  rows: HeaderCellDescriptor<T>[][];
  rowCount: number;
  errors: string[];
}

interface InternalLeaf {
  type: 'column';
  columnIndex: number;
  depth: number;
  parentGroupId?: string;
}

interface InternalGroup {
  type: 'group';
  node: BGridColumnGroupNode;
  depth: number;
  parentGroupId?: string;
  children: Array<InternalGroup | InternalLeaf>;
  columnIndexes: number[];
}

export function buildHeaderMatrix<T>({
  columns,
  columnGroups,
  columnsGroup,
  startColumnIndex = 0,
  endColumnIndex = columns.length,
}: BuildHeaderMatrixOptions<T>): HeaderMatrix<T> {
  const regionStart = Math.max(0, Math.min(startColumnIndex, columns.length));
  const regionEnd = Math.max(regionStart, Math.min(endColumnIndex, columns.length));

  if (columnGroups?.length) {
    const treeMatrix = buildTreeMatrix(columns, columnGroups);
    return clipMatrix(treeMatrix, regionStart, regionEnd);
  }

  if (columnsGroup?.length) {
    const legacyMatrix = buildLegacyMatrix(columns, columnsGroup);
    return clipMatrix(legacyMatrix, regionStart, regionEnd);
  }

  return clipMatrix(buildFlatMatrix(columns), regionStart, regionEnd);
}

function buildTreeMatrix<T>(columns: AppModelColumn<T>[], groups: BGridColumnGroupNode[]): HeaderMatrix<T> {
  const errors: string[] = [];
  const columnIndexById = new Map<string, number>();
  columns.forEach((column, columnIndex) => {
    if (columnIndexById.has(column.columnId)) {
      errors.push(`duplicate-column-id:${column.columnId}`);
    } else {
      columnIndexById.set(column.columnId, columnIndex);
    }
  });

  const usedColumnIds = new Set<string>();
  const usedGroupIds = new Set<string>();

  const visitGroup = (node: BGridColumnGroupNode, depth: number, parentGroupId?: string): InternalGroup | undefined => {
    if (usedGroupIds.has(node.id)) errors.push(`duplicate-group-id:${node.id}`);
    usedGroupIds.add(node.id);

    if (!node.children.length) {
      errors.push(`empty-group:${node.id}`);
      return undefined;
    }

    const children: Array<InternalGroup | InternalLeaf> = [];
    const columnIndexes: number[] = [];

    node.children.forEach(child => {
      if (typeof child === 'string') {
        const columnIndex = columnIndexById.get(child);
        if (columnIndex === undefined) {
          errors.push(`unknown-column-id:${child}`);
          return;
        }
        if (usedColumnIds.has(child)) {
          errors.push(`duplicate-column-reference:${child}`);
          return;
        }
        usedColumnIds.add(child);
        children.push({
          type: 'column',
          columnIndex,
          depth: depth + 1,
          parentGroupId: node.id,
        });
        columnIndexes.push(columnIndex);
        return;
      }

      const group = visitGroup(child, depth + 1, node.id);
      if (!group) return;
      children.push(group);
      columnIndexes.push(...group.columnIndexes);
    });

    if (!columnIndexes.length) {
      errors.push(`group-without-valid-columns:${node.id}`);
    } else if (!isStrictlyIncreasing(columnIndexes)) {
      errors.push(`column-order-mismatch:${node.id}`);
    } else if (!isContiguous(columnIndexes)) {
      errors.push(`non-contiguous-group:${node.id}`);
    }

    return {
      type: 'group',
      node,
      depth,
      parentGroupId,
      children,
      columnIndexes,
    };
  };

  const roots = groups.map(group => visitGroup(group, 0)).filter((group): group is InternalGroup => !!group);
  const rootColumnIndexes = roots.flatMap(group => group.columnIndexes);
  if (!isStrictlyIncreasing(rootColumnIndexes)) errors.push('root-column-order-mismatch');

  if (errors.length) return { ...buildFlatMatrix(columns), errors: Array.from(new Set(errors)) };

  let deepestLeafDepth = 0;
  const updateDepth = (entry: InternalGroup | InternalLeaf) => {
    if (entry.type === 'column') {
      deepestLeafDepth = Math.max(deepestLeafDepth, entry.depth);
      return;
    }
    entry.children.forEach(updateDepth);
  };
  roots.forEach(updateDepth);
  const rowCount = deepestLeafDepth + 1;
  const rows = Array.from({ length: rowCount }, () => [] as HeaderCellDescriptor<T>[]);
  const groupedColumns = new Set<number>();

  const appendEntry = (entry: InternalGroup | InternalLeaf) => {
    if (entry.type === 'column') {
      groupedColumns.add(entry.columnIndex);
      rows[entry.depth].push(
        createColumnDescriptor(columns, entry.columnIndex, entry.depth, rowCount, entry.parentGroupId),
      );
      return;
    }

    const startColumnIndex = entry.columnIndexes[0];
    const endColumnIndex = entry.columnIndexes[entry.columnIndexes.length - 1];
    rows[entry.depth].push({
      key: `group:${entry.node.id}:${entry.depth}:${startColumnIndex}`,
      type: 'group',
      startColumnIndex,
      endColumnIndex,
      rowSpan: 1,
      colSpan: endColumnIndex - startColumnIndex + 1,
      depth: entry.depth,
      label: entry.node.label,
      headerAlign: entry.node.headerAlign,
      className: entry.node.className,
      headerStyle: entry.node.headerStyle,
      groupId: entry.node.id,
      parentGroupId: entry.parentGroupId,
    });
    entry.children.forEach(appendEntry);
  };

  roots.forEach(appendEntry);
  columns.forEach((_, columnIndex) => {
    if (!groupedColumns.has(columnIndex)) {
      rows[0].push(createColumnDescriptor(columns, columnIndex, 0, rowCount));
    }
  });
  rows.forEach(row => row.sort((a, b) => a.startColumnIndex - b.startColumnIndex));

  return { rows, rowCount, errors: [] };
}

function buildLegacyMatrix<T>(columns: AppModelColumn<T>[], groups: BGridColumnGroup[]): HeaderMatrix<T> {
  const errors: string[] = [];
  const ownerByColumn = new Map<number, number>();

  groups.forEach((group, groupIndex) => {
    const start = group.groupStartIndex;
    const end = group.groupEndIndex;
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end < start || end >= columns.length) {
      errors.push(`invalid-legacy-range:${groupIndex}`);
      return;
    }
    for (let columnIndex = start; columnIndex <= end; columnIndex += 1) {
      if (ownerByColumn.has(columnIndex)) errors.push(`overlapping-legacy-range:${columnIndex}`);
      ownerByColumn.set(columnIndex, groupIndex);
    }
  });

  if (errors.length) return { ...buildFlatMatrix(columns), errors: Array.from(new Set(errors)) };

  const rows: HeaderCellDescriptor<T>[][] = [[], []];
  groups.forEach((group, groupIndex) => {
    const groupId = `legacy:${groupIndex}`;
    rows[0].push({
      key: groupId,
      type: 'group',
      startColumnIndex: group.groupStartIndex,
      endColumnIndex: group.groupEndIndex,
      rowSpan: 1,
      colSpan: group.groupEndIndex - group.groupStartIndex + 1,
      depth: 0,
      label: group.label,
      headerAlign: group.headerAlign ?? group.align,
      groupId,
    });
  });

  columns.forEach((_, columnIndex) => {
    const groupIndex = ownerByColumn.get(columnIndex);
    if (groupIndex === undefined) {
      rows[0].push(createColumnDescriptor(columns, columnIndex, 0, 2));
    } else {
      rows[1].push(createColumnDescriptor(columns, columnIndex, 1, 2, `legacy:${groupIndex}`));
    }
  });
  rows.forEach(row => row.sort((a, b) => a.startColumnIndex - b.startColumnIndex));
  return { rows, rowCount: 2, errors: [] };
}

function buildFlatMatrix<T>(columns: AppModelColumn<T>[]): HeaderMatrix<T> {
  return {
    rows: [columns.map((_, columnIndex) => createColumnDescriptor(columns, columnIndex, 0, 1))],
    rowCount: 1,
    errors: [],
  };
}

function createColumnDescriptor<T>(
  columns: AppModelColumn<T>[],
  columnIndex: number,
  depth: number,
  rowCount: number,
  parentGroupId?: string,
): HeaderCellDescriptor<T> {
  const column = columns[columnIndex];
  return {
    key: `column:${column.columnId}:${columnIndex}`,
    type: 'column',
    columnIndex,
    startColumnIndex: columnIndex,
    endColumnIndex: columnIndex,
    rowSpan: rowCount - depth,
    colSpan: 1,
    depth,
    label: column.label,
    headerAlign: column.headerAlign,
    className: column.headerClassName,
    headerStyle: column.headerStyle,
    parentGroupId,
    column,
  };
}

function clipMatrix<T>(matrix: HeaderMatrix<T>, start: number, end: number): HeaderMatrix<T> {
  return {
    ...matrix,
    rows: matrix.rows.map(row =>
      row
        .filter(cell => cell.endColumnIndex >= start && cell.startColumnIndex < end)
        .map(cell => {
          if (cell.type === 'column') return cell;
          const clippedStart = Math.max(cell.startColumnIndex, start);
          const clippedEnd = Math.min(cell.endColumnIndex, end - 1);
          return {
            ...cell,
            key: `${cell.key}:region:${start}-${end}`,
            startColumnIndex: clippedStart,
            endColumnIndex: clippedEnd,
            colSpan: clippedEnd - clippedStart + 1,
          };
        }),
    ),
  };
}

function isStrictlyIncreasing(values: number[]) {
  return values.every((value, index) => index === 0 || value > values[index - 1]);
}

function isContiguous(values: number[]) {
  return values.every((value, index) => index === 0 || value === values[index - 1] + 1);
}
