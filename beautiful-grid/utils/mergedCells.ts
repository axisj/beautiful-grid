import { BGridCellAddress, BGridDataItem, BGridProps } from '../types';
import { getCellValueByRowKey } from './getCellValue';

export interface BGridMergedRowRange {
  startRowIndex: number;
  endRowIndex: number;
}

export interface BGridLogicalCell {
  cell: BGridCellAddress;
  rowRange: BGridMergedRowRange;
  rowIndexes: number[];
  merged: boolean;
}

const mergedRowRangeCache = new WeakMap<BGridDataItem<any>[], Map<string, Map<number, BGridMergedRowRange>>>();

function getMergeCacheKey(mergeBy: string | string[]) {
  return Array.isArray(mergeBy) ? `path:${JSON.stringify(mergeBy)}` : `key:${mergeBy}`;
}

export function getMergedRowRange<T>(
  data: BGridDataItem<T>[],
  mergeBy: string | string[],
  requestedRowIndex: number,
): BGridMergedRowRange {
  if (data.length === 0) return { startRowIndex: 0, endRowIndex: 0 };

  const rowIndex = Math.min(Math.max(requestedRowIndex, 0), data.length - 1);
  const cacheKey = getMergeCacheKey(mergeBy);
  let cacheByColumn = mergedRowRangeCache.get(data);
  if (!cacheByColumn) {
    cacheByColumn = new Map();
    mergedRowRangeCache.set(data, cacheByColumn);
  }

  let rangesByRow = cacheByColumn.get(cacheKey);
  if (!rangesByRow) {
    rangesByRow = new Map();
    cacheByColumn.set(cacheKey, rangesByRow);
  }

  const cachedRange = rangesByRow.get(rowIndex);
  if (cachedRange) return cachedRange;

  const value = getCellValueByRowKey(mergeBy, data[rowIndex].values);
  let startRowIndex = rowIndex;
  let endRowIndex = rowIndex;
  while (startRowIndex > 0 && Object.is(getCellValueByRowKey(mergeBy, data[startRowIndex - 1].values), value)) {
    startRowIndex -= 1;
  }
  while (
    endRowIndex < data.length - 1 &&
    Object.is(getCellValueByRowKey(mergeBy, data[endRowIndex + 1].values), value)
  ) {
    endRowIndex += 1;
  }

  const range = { startRowIndex, endRowIndex };
  for (let index = startRowIndex; index <= endRowIndex; index += 1) {
    rangesByRow.set(index, range);
  }
  return range;
}

export function resolveLogicalCell<T>(
  data: BGridDataItem<T>[],
  cellMergeOptions: BGridProps<T>['cellMergeOptions'],
  requestedCell: BGridCellAddress,
): BGridLogicalCell {
  if (data.length === 0) {
    return {
      cell: requestedCell,
      rowRange: { startRowIndex: requestedCell.rowIndex, endRowIndex: requestedCell.rowIndex },
      rowIndexes: [requestedCell.rowIndex],
      merged: false,
    };
  }

  const rowIndex = Math.min(Math.max(requestedCell.rowIndex, 0), data.length - 1);
  const rule = cellMergeOptions?.columnsMap?.[requestedCell.columnIndex];
  if (!rule) {
    return {
      cell: { rowIndex, columnIndex: requestedCell.columnIndex },
      rowRange: { startRowIndex: rowIndex, endRowIndex: rowIndex },
      rowIndexes: [rowIndex],
      merged: false,
    };
  }

  const rowRange = getMergedRowRange(data, rule.mergeBy, rowIndex);
  const rowIndexes = Array.from(
    { length: rowRange.endRowIndex - rowRange.startRowIndex + 1 },
    (_, index) => rowRange.startRowIndex + index,
  );

  return {
    cell: { rowIndex: rowRange.startRowIndex, columnIndex: requestedCell.columnIndex },
    rowRange,
    rowIndexes,
    merged: rowIndexes.length > 1,
  };
}

export function isRowInLogicalCell(logicalCell: BGridLogicalCell, rowIndex: number) {
  return rowIndex >= logicalCell.rowRange.startRowIndex && rowIndex <= logicalCell.rowRange.endRowIndex;
}
