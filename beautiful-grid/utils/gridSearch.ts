import type * as React from 'react';
import {
  AppModelColumn,
  BGridDataItem,
  BGridProps,
  BGridSearchCellParams,
  BGridSearchMatch,
  BGridSearchOptions,
} from '../types';
import { getCellValueByRowKey } from './getCellValue';
import { resolveLogicalCell } from './mergedCells';

export function normalizeSearchText(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value.normalize('NFC');
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') {
    return String(value).normalize('NFC');
  }
  if (value instanceof Date) {
    try {
      return value.toISOString().normalize('NFC');
    } catch {
      return String(value).normalize('NFC');
    }
  }

  try {
    const stringified = JSON.stringify(value);
    return (stringified ?? String(value)).normalize('NFC');
  } catch {
    try {
      return String(value).normalize('NFC');
    } catch {
      return '';
    }
  }
}

function getRowKey<T>(rowKey: React.Key | React.Key[] | undefined, item: BGridDataItem<T>) {
  return rowKey ? getCellValueByRowKey(rowKey, item.values) : undefined;
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return !!value && (typeof value === 'object' || typeof value === 'function') && 'then' in value;
}

export interface FindGridSearchMatchesParams<T> {
  data: BGridDataItem<T>[];
  columns: AppModelColumn<T>[];
  sourceIndexByVisibleIndex: number[];
  rowKey?: React.Key | React.Key[];
  cellMergeOptions?: BGridProps<T>['cellMergeOptions'];
  searchOptions?: BGridSearchOptions<T>;
  query: string;
  startRowIndex?: number;
  endRowIndex?: number;
  onGetSearchTextError?: (columnId: string, error: unknown) => void;
}

export function findGridSearchMatches<T>({
  data,
  columns,
  sourceIndexByVisibleIndex,
  rowKey,
  cellMergeOptions,
  searchOptions,
  query,
  startRowIndex = 0,
  endRowIndex = data.length,
  onGetSearchTextError,
}: FindGridSearchMatchesParams<T>): BGridSearchMatch[] {
  const normalizedQuery = normalizeSearchText(query).toLowerCase();
  if (normalizedQuery.length === 0 || data.length === 0 || columns.length === 0) return [];

  const matches: BGridSearchMatch[] = [];
  const seenLogicalCells = new Set<string>();
  const safeStart = Math.max(0, Math.floor(startRowIndex));
  const safeEnd = Math.min(data.length, Math.max(safeStart, Math.floor(endRowIndex)));

  for (let visibleIndex = safeStart; visibleIndex < safeEnd; visibleIndex += 1) {
    for (let columnIndex = 0; columnIndex < columns.length; columnIndex += 1) {
      const column = columns[columnIndex];
      if (!column || column.searchable === false) continue;

      const logical = resolveLogicalCell(data, cellMergeOptions, { rowIndex: visibleIndex, columnIndex });
      const logicalToken = `${logical.cell.rowIndex}:${logical.cell.columnIndex}`;
      if (seenLogicalCells.has(logicalToken)) continue;
      seenLogicalCells.add(logicalToken);

      const canonicalVisibleIndex = logical.cell.rowIndex;
      const item = data[canonicalVisibleIndex];
      if (!item) continue;

      const sourceIndex = sourceIndexByVisibleIndex[canonicalVisibleIndex] ?? canonicalVisibleIndex;
      const value = getCellValueByRowKey(column.key, item.values);
      const params: BGridSearchCellParams<T> = {
        cell: logical.cell,
        visibleIndex: canonicalVisibleIndex,
        sourceIndex,
        rowKey: getRowKey(rowKey, item),
        columnIndex,
        columnId: column.columnId,
        column,
        item,
        values: item.values,
        value,
      };

      let searchableValue: unknown = value;
      const getSearchText = column.getSearchText ?? searchOptions?.getSearchText;
      if (getSearchText) {
        try {
          const resolved = getSearchText(params);
          if (isPromiseLike(resolved)) {
            throw new TypeError('getSearchText must return synchronously.');
          }
          searchableValue = resolved;
        } catch (error) {
          onGetSearchTextError?.(column.columnId, error);
          searchableValue = value;
        }
      }

      if (!normalizeSearchText(searchableValue).toLowerCase().includes(normalizedQuery)) continue;

      matches.push({
        cell: logical.cell,
        visibleIndex: canonicalVisibleIndex,
        sourceIndex,
        rowKey: params.rowKey,
        columnIndex,
        columnId: column.columnId,
      });
    }
  }

  return matches;
}

export function dedupeSearchMatches(matches: BGridSearchMatch[]) {
  const seen = new Set<string>();
  return matches.filter(match => {
    const token = `${match.cell.rowIndex}:${match.cell.columnIndex}`;
    if (seen.has(token)) return false;
    seen.add(token);
    return true;
  });
}

export function findMatchingSearchResultIndex(
  matches: BGridSearchMatch[],
  previous?: BGridSearchMatch,
  previousIndex?: number,
): number | undefined {
  if (matches.length === 0) return undefined;
  if (!previous) return 0;

  const rowKeyMatch =
    previous.rowKey !== undefined
      ? matches.findIndex(match => Object.is(match.rowKey, previous.rowKey) && match.columnId === previous.columnId)
      : -1;
  if (rowKeyMatch >= 0) return rowKeyMatch;

  const sourceMatch = matches.findIndex(
    match => match.sourceIndex === previous.sourceIndex && match.columnId === previous.columnId,
  );
  if (sourceMatch >= 0) return sourceMatch;
  return Math.min(Math.max(previousIndex ?? 0, 0), matches.length - 1);
}
