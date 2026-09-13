import { BGridDataItem, BGridProps } from '../types';

export interface BGridRowHeightMetrics {
  heights: Float64Array;
  offsets: Float64Array;
  totalHeight: number;
  variable: boolean;
}

export function createRowHeightMetrics<T>(
  data: readonly BGridDataItem<T>[],
  fallbackHeight: number,
  getRowHeight?: BGridProps<T>['getRowHeight'],
): BGridRowHeightMetrics {
  const safeFallback = Number.isFinite(fallbackHeight) && fallbackHeight > 0 ? fallbackHeight : 1;
  if (!getRowHeight) {
    return {
      heights: new Float64Array(0),
      offsets: new Float64Array(0),
      totalHeight: data.length * safeFallback,
      variable: false,
    };
  }
  const heights = new Float64Array(data.length);
  const offsets = new Float64Array(data.length + 1);

  for (let index = 0; index < data.length; index += 1) {
    const requestedHeight = getRowHeight(data[index].values, index);
    const height = Number.isFinite(requestedHeight) && requestedHeight! > 0 ? requestedHeight! : safeFallback;
    heights[index] = height;
    offsets[index + 1] = offsets[index] + height;
  }

  return {
    heights,
    offsets,
    totalHeight: offsets[data.length],
    variable: true,
  };
}

/** Returns the row containing offset, or rowCount when offset is at/after the end. */
export function getRowIndexAtOffset(offsets: ArrayLike<number>, offset: number): number {
  const rowCount = Math.max(offsets.length - 1, 0);
  if (rowCount === 0 || offset >= offsets[rowCount]) return rowCount;
  if (offset <= 0) return 0;

  let low = 0;
  let high = rowCount;
  while (low < high) {
    const middle = Math.floor((low + high + 1) / 2);
    if (offsets[middle] <= offset) low = middle;
    else high = middle - 1;
  }
  return Math.min(low, rowCount - 1);
}

/** Returns the first offset index whose value is greater than or equal to target. */
export function lowerBoundRowOffset(offsets: ArrayLike<number>, target: number): number {
  let low = 0;
  let high = offsets.length;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (offsets[middle] < target) low = middle + 1;
    else high = middle;
  }
  return low;
}
