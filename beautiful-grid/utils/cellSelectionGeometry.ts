import { AppModelColumn, BGridCellSelectionRange } from '../types';

export type BGridSelectionQuadrant = 'top-left' | 'top-main' | 'body-left' | 'body-main';

export interface BGridSelectionFragmentEdges {
  top: boolean;
  right: boolean;
  bottom: boolean;
  left: boolean;
}

export interface BGridSelectionFragment {
  rangeIndex: number;
  quadrant: BGridSelectionQuadrant;
  left: number;
  top: number;
  width: number;
  height: number;
  edges: BGridSelectionFragmentEdges;
}

export interface BGridSelectionGeometryParams {
  ranges: readonly BGridCellSelectionRange[];
  columns: readonly AppModelColumn<any>[];
  rowCount: number;
  rowHeight: number;
  frozenColumnCount: number;
  frozenRowCount: number;
  frozenColumnsWidth: number;
}

interface IndexSegment {
  start: number;
  end: number;
}

export function getCellSelectionFragments({
  ranges,
  columns,
  rowCount,
  rowHeight,
  frozenColumnCount,
  frozenRowCount,
  frozenColumnsWidth,
}: BGridSelectionGeometryParams): BGridSelectionFragment[] {
  const safeRowCount = Math.max(0, Math.floor(rowCount));
  const safeColumnCount = columns.length;
  const safeRowHeight = Math.max(1, rowHeight);
  const safeFrozenColumnCount = clampInteger(frozenColumnCount, 0, safeColumnCount);
  const safeFrozenRowCount = clampInteger(frozenRowCount, 0, safeRowCount);
  const frozenDataWidth = getColumnsWidth(columns, 0, safeFrozenColumnCount - 1);
  const frozenDataOffset = Math.max(0, frozenColumnsWidth - frozenDataWidth);

  if (safeRowCount === 0 || safeColumnCount === 0) return [];

  return ranges.flatMap((range, rangeIndex) => {
    const normalized = normalizeCellSelectionRange(range);
    const selectedRows = intersectIndexSegment(
      { start: normalized.startRowIndex, end: normalized.endRowIndex },
      { start: 0, end: safeRowCount - 1 },
    );
    const selectedColumns = intersectIndexSegment(
      { start: normalized.startColumnIndex, end: normalized.endColumnIndex },
      { start: 0, end: safeColumnCount - 1 },
    );

    if (!selectedRows || !selectedColumns) return [];

    const topRows = intersectIndexSegment(selectedRows, { start: 0, end: safeFrozenRowCount - 1 });
    const bodyRows = intersectIndexSegment(selectedRows, {
      start: safeFrozenRowCount,
      end: safeRowCount - 1,
    });
    const leftColumns = intersectIndexSegment(selectedColumns, {
      start: 0,
      end: safeFrozenColumnCount - 1,
    });
    const mainColumns = intersectIndexSegment(selectedColumns, {
      start: safeFrozenColumnCount,
      end: safeColumnCount - 1,
    });
    const fragments: BGridSelectionFragment[] = [];

    if (topRows && leftColumns) {
      fragments.push(
        createFragment({
          rangeIndex,
          quadrant: 'top-left',
          rows: topRows,
          columns: leftColumns,
          selectedRows,
          selectedColumns,
          rowHeight: safeRowHeight,
          left: frozenDataOffset + getColumnsWidth(columns, 0, leftColumns.start - 1),
          width: getColumnsWidth(columns, leftColumns.start, leftColumns.end),
          top: topRows.start * safeRowHeight,
        }),
      );
    }

    if (topRows && mainColumns) {
      fragments.push(
        createFragment({
          rangeIndex,
          quadrant: 'top-main',
          rows: topRows,
          columns: mainColumns,
          selectedRows,
          selectedColumns,
          rowHeight: safeRowHeight,
          left: getMainColumnLeft(columns, mainColumns.start, safeFrozenColumnCount),
          width: getMainColumnRight(columns, mainColumns.end, safeFrozenColumnCount) -
            getMainColumnLeft(columns, mainColumns.start, safeFrozenColumnCount),
          top: topRows.start * safeRowHeight,
        }),
      );
    }

    if (bodyRows && leftColumns) {
      fragments.push(
        createFragment({
          rangeIndex,
          quadrant: 'body-left',
          rows: bodyRows,
          columns: leftColumns,
          selectedRows,
          selectedColumns,
          rowHeight: safeRowHeight,
          left: frozenDataOffset + getColumnsWidth(columns, 0, leftColumns.start - 1),
          width: getColumnsWidth(columns, leftColumns.start, leftColumns.end),
          top: (bodyRows.start - safeFrozenRowCount) * safeRowHeight,
        }),
      );
    }

    if (bodyRows && mainColumns) {
      fragments.push(
        createFragment({
          rangeIndex,
          quadrant: 'body-main',
          rows: bodyRows,
          columns: mainColumns,
          selectedRows,
          selectedColumns,
          rowHeight: safeRowHeight,
          left: getMainColumnLeft(columns, mainColumns.start, safeFrozenColumnCount),
          width: getMainColumnRight(columns, mainColumns.end, safeFrozenColumnCount) -
            getMainColumnLeft(columns, mainColumns.start, safeFrozenColumnCount),
          top: (bodyRows.start - safeFrozenRowCount) * safeRowHeight,
        }),
      );
    }

    return fragments;
  });
}

export function clipCellSelectionFragment(
  fragment: BGridSelectionFragment,
  viewport: { left: number; top: number; width: number; height: number },
): BGridSelectionFragment | undefined {
  const viewportRight = viewport.left + Math.max(0, viewport.width);
  const viewportBottom = viewport.top + Math.max(0, viewport.height);
  const fragmentRight = fragment.left + fragment.width;
  const fragmentBottom = fragment.top + fragment.height;
  const left = Math.max(fragment.left, viewport.left);
  const top = Math.max(fragment.top, viewport.top);
  const right = Math.min(fragmentRight, viewportRight);
  const bottom = Math.min(fragmentBottom, viewportBottom);

  if (left >= right || top >= bottom) return undefined;

  return {
    ...fragment,
    left,
    top,
    width: right - left,
    height: bottom - top,
    edges: {
      top: fragment.edges.top && top === fragment.top,
      right: fragment.edges.right && right === fragmentRight,
      bottom: fragment.edges.bottom && bottom === fragmentBottom,
      left: fragment.edges.left && left === fragment.left,
    },
  };
}

export function normalizeCellSelectionRange(range: BGridCellSelectionRange): BGridCellSelectionRange {
  return {
    startRowIndex: Math.min(range.startRowIndex, range.endRowIndex),
    startColumnIndex: Math.min(range.startColumnIndex, range.endColumnIndex),
    endRowIndex: Math.max(range.startRowIndex, range.endRowIndex),
    endColumnIndex: Math.max(range.startColumnIndex, range.endColumnIndex),
  };
}

function createFragment({
  rangeIndex,
  quadrant,
  rows,
  columns,
  selectedRows,
  selectedColumns,
  rowHeight,
  left,
  top,
  width,
}: {
  rangeIndex: number;
  quadrant: BGridSelectionQuadrant;
  rows: IndexSegment;
  columns: IndexSegment;
  selectedRows: IndexSegment;
  selectedColumns: IndexSegment;
  rowHeight: number;
  left: number;
  top: number;
  width: number;
}): BGridSelectionFragment {
  return {
    rangeIndex,
    quadrant,
    left,
    top,
    width,
    height: (rows.end - rows.start + 1) * rowHeight,
    edges: {
      top: rows.start === selectedRows.start,
      right: columns.end === selectedColumns.end,
      bottom: rows.end === selectedRows.end,
      left: columns.start === selectedColumns.start,
    },
  };
}

function intersectIndexSegment(left: IndexSegment, right: IndexSegment): IndexSegment | undefined {
  const start = Math.max(left.start, right.start);
  const end = Math.min(left.end, right.end);
  return start <= end ? { start, end } : undefined;
}

function getColumnsWidth(columns: readonly AppModelColumn<any>[], start: number, end: number) {
  if (start > end) return 0;
  let width = 0;
  for (let index = Math.max(0, start); index <= Math.min(end, columns.length - 1); index += 1) {
    width += columns[index]?.width ?? 100;
  }
  return width;
}

function getMainColumnLeft(
  columns: readonly AppModelColumn<any>[],
  columnIndex: number,
  frozenColumnCount: number,
) {
  const column = columns[columnIndex];
  if (column && column.left >= 0) return column.left;
  return getColumnsWidth(columns, frozenColumnCount, columnIndex - 1);
}

function getMainColumnRight(
  columns: readonly AppModelColumn<any>[],
  columnIndex: number,
  frozenColumnCount: number,
) {
  return getMainColumnLeft(columns, columnIndex, frozenColumnCount) + (columns[columnIndex]?.width ?? 100);
}

function clampInteger(value: number, min: number, max: number) {
  return Math.min(Math.max(Math.floor(value), min), max);
}
