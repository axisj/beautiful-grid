import { getRowIndexAtOffset, lowerBoundRowOffset } from './rowHeightMetrics';

export interface VisibleScrollableRowRangeParams {
  scrollTop: number;
  viewportHeight: number;
  rowHeight: number;
  frozenRowCount: number;
  totalRowCount: number;
  overscan?: number;
  leadingOverscan?: number;
  windowSize?: number;
  /** Cumulative row offsets (length = totalRowCount + 1). Enables variable-height binary search. */
  rowOffsets?: ArrayLike<number>;
}

export interface VisibleScrollableRowRange {
  startRowIndex: number;
  endRowIndex: number;
  paddingTop: number;
  scrollContentHeight: number;
}

/**
 * Maps the scrollable body's physical scroll offset to logical data row indexes.
 * The returned end index is exclusive.
 */
export function getVisibleScrollableRowRange({
  scrollTop,
  viewportHeight,
  rowHeight,
  frozenRowCount,
  totalRowCount,
  overscan = 1,
  leadingOverscan = 0,
  windowSize = 1,
  rowOffsets,
}: VisibleScrollableRowRangeParams): VisibleScrollableRowRange {
  const safeRowHeight = Math.max(rowHeight, 1);
  const safeTotal = Math.max(Math.floor(totalRowCount), 0);
  const safeFrozen = Math.min(Math.max(Math.floor(frozenRowCount), 0), safeTotal);
  const scrollableRowCount = Math.max(safeTotal - safeFrozen, 0);
  const frozenOffset = rowOffsets?.[safeFrozen] ?? safeFrozen * safeRowHeight;
  const totalOffset = rowOffsets?.[safeTotal] ?? safeTotal * safeRowHeight;
  const logicalStart = frozenOffset + Math.max(scrollTop, 0);
  const relativeStart = rowOffsets
    ? Math.min(Math.max(getRowIndexAtOffset(rowOffsets, logicalStart) - safeFrozen, 0), scrollableRowCount)
    : Math.min(Math.max(Math.floor(Math.max(scrollTop, 0) / safeRowHeight), 0), scrollableRowCount);
  const safeWindowSize = Math.max(Math.floor(windowSize), 1);
  const windowStart = Math.floor(relativeStart / safeWindowSize) * safeWindowSize;
  const renderStart = Math.max(windowStart - Math.max(Math.floor(leadingOverscan), 0), 0);
  const trailingOverscan = Math.max(Math.floor(overscan), 0);
  const visibleEnd = rowOffsets
    ? Math.min(lowerBoundRowOffset(rowOffsets, logicalStart + Math.max(viewportHeight, 0)), safeTotal)
    : safeFrozen + windowStart + Math.max(Math.ceil(Math.max(viewportHeight, 0) / safeRowHeight), 0);
  const endRowIndex = rowOffsets
    ? Math.min(Math.max(visibleEnd + trailingOverscan + safeWindowSize - 1, safeFrozen + 1), safeTotal)
    : Math.min(
        safeFrozen +
          windowStart +
          Math.max(Math.ceil(Math.max(viewportHeight, 0) / safeRowHeight) + trailingOverscan, 0) +
          safeWindowSize -
          1,
        safeTotal,
      );

  return {
    startRowIndex: safeFrozen + renderStart,
    endRowIndex,
    paddingTop: rowOffsets
      ? (rowOffsets[safeFrozen + renderStart] ?? frozenOffset) - frozenOffset
      : renderStart * safeRowHeight,
    scrollContentHeight: Math.max(totalOffset - frozenOffset, 0),
  };
}
