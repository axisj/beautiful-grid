import { AppModelColumn, BGridCellAddress } from '../types';

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function clampCellAddress(
  address: BGridCellAddress,
  rowCount: number,
  columnCount: number,
): BGridCellAddress {
  const maxRow = Math.max(0, rowCount - 1);
  const maxCol = Math.max(0, columnCount - 1);

  return {
    rowIndex: rowCount <= 0 ? 0 : clamp(address.rowIndex, 0, maxRow),
    columnIndex: columnCount <= 0 ? 0 : clamp(address.columnIndex, 0, maxCol),
  };
}

export function getColumnLeft(
  columnIndex: number,
  columns: AppModelColumn<any>[],
): number {
  if (!columns || columnIndex <= 0 || columnIndex >= columns.length) {
    return 0;
  }

  const col = columns[columnIndex];
  if (typeof col?.left === 'number' && col.left >= 0) {
    return col.left;
  }

  let left = 0;
  for (let i = 0; i < columnIndex; i++) {
    left += columns[i]?.width ?? 100;
  }
  return left;
}

export function getColumnRight(
  columnIndex: number,
  columns: AppModelColumn<any>[],
): number {
  if (!columns || columnIndex < 0 || columnIndex >= columns.length) {
    return 0;
  }
  const left = getColumnLeft(columnIndex, columns);
  const width = columns[columnIndex]?.width ?? 100;
  return left + width;
}

export function getRowTop(rowIndex: number, rowHeight: number): number {
  if (rowIndex <= 0 || rowHeight <= 0) return 0;
  return rowIndex * rowHeight;
}

export function getRowBottom(rowIndex: number, rowHeight: number): number {
  if (rowIndex < 0 || rowHeight <= 0) return 0;
  return (rowIndex + 1) * rowHeight;
}

export interface EnsureCellVisibleParams {
  cell: BGridCellAddress;
  scrollContainer: HTMLElement | null;
  frozenColumnCount?: number;
  frozenRowCount?: number;
  columns: AppModelColumn<any>[];
  rowHeight: number;
  verticalScrollState?: {
    scrollTop: number;
    scrollHeight: number;
  };
  viewportInsets?: {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
  };
}

export interface EnsureCellVisibleResult {
  scrollTop: number;
  scrollLeft: number;
  didScroll: boolean;
  didScrollTop: boolean;
  didScrollLeft: boolean;
}

export function ensureCellVisible({
  cell,
  scrollContainer,
  frozenColumnCount = 0,
  frozenRowCount = 0,
  columns,
  rowHeight,
  verticalScrollState,
  viewportInsets,
}: EnsureCellVisibleParams): EnsureCellVisibleResult {
  const currentScrollTop = verticalScrollState?.scrollTop ?? scrollContainer?.scrollTop ?? 0;
  const currentScrollLeft = scrollContainer?.scrollLeft ?? 0;

  let nextScrollTop = currentScrollTop;
  let nextScrollLeft = currentScrollLeft;

  // Vertical scroll calculation
  if (cell.rowIndex >= frozenRowCount && scrollContainer && rowHeight > 0) {
    const targetRowIndex = cell.rowIndex - frozenRowCount;
    const rowTop = getRowTop(targetRowIndex, rowHeight);
    const rowBottom = getRowBottom(targetRowIndex, rowHeight);
    const clientHeight = scrollContainer.clientHeight;
    const scrollHeight = verticalScrollState?.scrollHeight ?? scrollContainer.scrollHeight;
    const maxScrollTop = Math.max(0, scrollHeight - clientHeight);

    if (clientHeight > 0) {
      const topInset = clamp(viewportInsets?.top ?? 0, 0, clientHeight);
      const bottomInset = clamp(viewportInsets?.bottom ?? 0, 0, Math.max(clientHeight - topInset, 0));
      const viewportTop = currentScrollTop + topInset;
      const viewportBottom = currentScrollTop + clientHeight - bottomInset;

      if (rowTop < viewportTop) {
        nextScrollTop = rowTop - topInset;
      } else if (rowBottom > viewportBottom) {
        nextScrollTop = rowBottom - clientHeight + bottomInset;
      }
      nextScrollTop = clamp(nextScrollTop, 0, maxScrollTop);
    }
  }

  // Horizontal scroll calculation
  if (cell.columnIndex >= frozenColumnCount && scrollContainer && columns && columns.length > 0) {
    const colLeft = getColumnLeft(cell.columnIndex, columns);
    const colRight = getColumnRight(cell.columnIndex, columns);
    const colWidth = colRight - colLeft;
    const clientWidth = scrollContainer.clientWidth;
    const scrollWidth = scrollContainer.scrollWidth;
    const maxScrollLeft = Math.max(0, scrollWidth - clientWidth);

    if (clientWidth > 0) {
      const leftInset = clamp(viewportInsets?.left ?? 0, 0, clientWidth);
      const rightInset = clamp(viewportInsets?.right ?? 0, 0, Math.max(clientWidth - leftInset, 0));
      const viewportLeft = currentScrollLeft + leftInset;
      const viewportRight = currentScrollLeft + clientWidth - rightInset;
      const visibleWidth = Math.max(clientWidth - leftInset - rightInset, 0);

      if (colWidth >= visibleWidth || colLeft < viewportLeft) {
        nextScrollLeft = colLeft - leftInset;
      } else if (colRight > viewportRight) {
        nextScrollLeft = colRight - clientWidth + rightInset;
      }
      nextScrollLeft = clamp(nextScrollLeft, 0, maxScrollLeft);
    }
  }

  const didScrollTop = nextScrollTop !== currentScrollTop;
  const didScrollLeft = nextScrollLeft !== currentScrollLeft;
  const didScroll = didScrollTop || didScrollLeft;

  if (scrollContainer) {
    if (didScrollTop && !verticalScrollState) {
      scrollContainer.scrollTop = nextScrollTop;
    }
    if (didScrollLeft) {
      scrollContainer.scrollLeft = nextScrollLeft;
    }
  }

  return {
    scrollTop: nextScrollTop,
    scrollLeft: nextScrollLeft,
    didScroll,
    didScrollTop,
    didScrollLeft,
  };
}
