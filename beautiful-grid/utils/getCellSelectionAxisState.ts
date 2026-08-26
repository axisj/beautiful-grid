import { BGridCellAddress, BGridCellSelectionRange } from '../types';

export interface BGridCellSelectionAxisState {
  rowIndexes: Set<number>;
  columnIndexes: Set<number>;
}

/**
 * Collects the row and column indexes represented by the active cell and every
 * selection range. The returned sets are shared by the header and line-number
 * renderers so frozen and scrollable regions use identical selection semantics.
 */
export function getCellSelectionAxisState(
  activeCell: BGridCellAddress | undefined,
  ranges: BGridCellSelectionRange[],
): BGridCellSelectionAxisState {
  const rowIndexes = new Set<number>();
  const columnIndexes = new Set<number>();

  if (activeCell) {
    rowIndexes.add(activeCell.rowIndex);
    columnIndexes.add(activeCell.columnIndex);
  }

  ranges.forEach(range => {
    const startRowIndex = Math.min(range.startRowIndex, range.endRowIndex);
    const endRowIndex = Math.max(range.startRowIndex, range.endRowIndex);
    const startColumnIndex = Math.min(range.startColumnIndex, range.endColumnIndex);
    const endColumnIndex = Math.max(range.startColumnIndex, range.endColumnIndex);

    for (let rowIndex = startRowIndex; rowIndex <= endRowIndex; rowIndex += 1) {
      rowIndexes.add(rowIndex);
    }
    for (let columnIndex = startColumnIndex; columnIndex <= endColumnIndex; columnIndex += 1) {
      columnIndexes.add(columnIndex);
    }
  });

  return { rowIndexes, columnIndexes };
}

export function isColumnAxisRangeActive(
  columnIndexes: Set<number>,
  startColumnIndex: number,
  columnSpan = 1,
) {
  const endColumnIndex = startColumnIndex + Math.max(columnSpan, 1) - 1;
  for (let columnIndex = startColumnIndex; columnIndex <= endColumnIndex; columnIndex += 1) {
    if (columnIndexes.has(columnIndex)) return true;
  }
  return false;
}
