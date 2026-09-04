export interface VisibleScrollableRowRangeParams {
  scrollTop: number;
  viewportHeight: number;
  rowHeight: number;
  frozenRowCount: number;
  totalRowCount: number;
  overscan?: number;
  leadingOverscan?: number;
  windowSize?: number;
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
}: VisibleScrollableRowRangeParams): VisibleScrollableRowRange {
  const safeRowHeight = Math.max(rowHeight, 1);
  const safeTotal = Math.max(Math.floor(totalRowCount), 0);
  const safeFrozen = Math.min(Math.max(Math.floor(frozenRowCount), 0), safeTotal);
  const scrollableRowCount = Math.max(safeTotal - safeFrozen, 0);
  const relativeStart = Math.min(
    Math.max(Math.floor(Math.max(scrollTop, 0) / safeRowHeight), 0),
    scrollableRowCount,
  );
  const safeWindowSize = Math.max(Math.floor(windowSize), 1);
  const windowStart = Math.floor(relativeStart / safeWindowSize) * safeWindowSize;
  const renderStart = Math.max(windowStart - Math.max(Math.floor(leadingOverscan), 0), 0);
  const visibleCount = Math.max(
    Math.ceil(Math.max(viewportHeight, 0) / safeRowHeight) + Math.max(Math.floor(overscan), 0),
    0,
  );

  return {
    startRowIndex: safeFrozen + renderStart,
    endRowIndex: Math.min(safeFrozen + windowStart + visibleCount + safeWindowSize - 1, safeTotal),
    paddingTop: renderStart * safeRowHeight,
    scrollContentHeight: scrollableRowCount * safeRowHeight,
  };
}
