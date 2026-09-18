import * as React from 'react';
import { BGridDataItem, BGridProps } from '../types';

export interface MasterDetailHeightOptions<T> {
  expandedKeysSet: ReadonlySet<React.Key>;
  getRowKey: (values: unknown, index: number) => React.Key | undefined;
  getDetailHeight: (item: BGridDataItem<T>, sourceIndex: number) => number;
  hasDetail?: (item: BGridDataItem<T>, sourceIndex: number) => boolean;
  sourceIndexByVisibleIndex?: readonly number[];
}

export interface BGridRowHeightMetrics {
  /** Master row heights (for <tr> and cell rendering). */
  heights: Float64Array;
  /** Layout offsets including detail heights (for virtual scrolling, paddingTop, selection overlays, total height). */
  offsets: Float64Array;
  /** Total layout height including all rows and expanded details. */
  totalHeight: number;
  /** Whether layout heights are variable. */
  variable: boolean;
  /** Detail panel heights for each visible row (0 if row has no detail or is not expanded). */
  detailHeights?: Float64Array;
}

export function createRowHeightMetrics<T>(
  data: readonly BGridDataItem<T>[],
  fallbackHeight: number,
  getRowHeight?: BGridProps<T>['getRowHeight'],
  masterDetail?: MasterDetailHeightOptions<T>,
): BGridRowHeightMetrics {
  const safeFallback = Number.isFinite(fallbackHeight) && fallbackHeight > 0 ? fallbackHeight : 1;
  const hasMasterDetail = Boolean(masterDetail && masterDetail.expandedKeysSet.size > 0);

  if (!getRowHeight && !hasMasterDetail) {
    return {
      heights: new Float64Array(0),
      offsets: new Float64Array(0),
      totalHeight: data.length * safeFallback,
      variable: false,
    };
  }

  const heights = new Float64Array(data.length);
  const offsets = new Float64Array(data.length + 1);
  const detailHeights = hasMasterDetail ? new Float64Array(data.length) : undefined;

  for (let index = 0; index < data.length; index += 1) {
    const item = data[index];
    const sourceIndex = masterDetail?.sourceIndexByVisibleIndex?.[index] ?? index;

    let masterHeight = safeFallback;
    if (getRowHeight) {
      try {
        const requestedHeight = getRowHeight(item.values, index);
        masterHeight = Number.isFinite(requestedHeight) && requestedHeight! > 0 ? requestedHeight! : safeFallback;
      } catch {
        masterHeight = safeFallback;
      }
    }
    heights[index] = masterHeight;

    let detailHeight = 0;
    if (hasMasterDetail && masterDetail) {
      const rowKey = masterDetail.getRowKey(item.values, index);
      if (rowKey !== undefined && rowKey !== null && masterDetail.expandedKeysSet.has(rowKey)) {
        let isExpandable = true;
        if (masterDetail.hasDetail) {
          try {
            isExpandable = masterDetail.hasDetail(item, sourceIndex);
          } catch {
            isExpandable = false;
          }
        }
        if (isExpandable) {
          try {
            const requestedDetailHeight = masterDetail.getDetailHeight(item, sourceIndex);
            detailHeight =
              Number.isFinite(requestedDetailHeight) && requestedDetailHeight > 0 ? requestedDetailHeight : 200;
          } catch {
            detailHeight = 200;
          }
        }
      }
      detailHeights![index] = detailHeight;
    }

    const layoutHeight = masterHeight + detailHeight;
    offsets[index + 1] = offsets[index] + layoutHeight;
  }

  return {
    heights,
    offsets,
    totalHeight: offsets[data.length],
    variable: true,
    detailHeights,
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
