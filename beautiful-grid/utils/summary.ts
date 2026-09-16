import { BGridColumn, BGridSummaryColumn, BGridSummaryOptions, BGridSummaryRow } from '../types';

export const DEFAULT_SUMMARY_ROW_HEIGHT = 30;

export function normalizeSummaryRows<T>(summary?: BGridSummaryOptions<T>): BGridSummaryRow<T>[] {
  if (!summary) return [];
  if (summary.rows?.length) {
    return summary.rows.map((row, idx) =>
      Array.isArray(row) ? { id: idx, columns: row } : { ...row, id: row.id ?? idx },
    );
  }
  return summary.columns?.length ? [{ id: 0, columns: summary.columns }] : [];
}

export function computeSummaryHeight<T>(options: {
  summary?: BGridSummaryOptions<T>;
  summaryHeight?: number;
  summaryRowHeight?: number;
}): number {
  const { summary, summaryHeight, summaryRowHeight = DEFAULT_SUMMARY_ROW_HEIGHT } = options;
  if (!summary) return 0;
  const rows = normalizeSummaryRows(summary);
  if (!rows.length) return 0;
  return summaryHeight !== undefined
    ? summaryHeight
    : rows.reduce((acc, row) => acc + (row.height ?? summaryRowHeight), 0);
}

export function buildSummaryRowCells<T>(
  columns: BGridColumn<T>[],
  summaryColumns?: BGridSummaryColumn<T>[],
  startIndex = 0,
): ({ column: BGridColumn<T>; columnIndex: number; summaryColumn?: BGridSummaryColumn<T> } | null)[] {
  let ignoreCnt = 0;
  return columns.map((column, i) => {
    const columnIndex = startIndex + i;
    const summaryColumn = summaryColumns?.find(sc => sc.columnIndex === columnIndex);
    if (summaryColumn && (summaryColumn.colSpan ?? 1) > 1) {
      ignoreCnt = (summaryColumn.colSpan ?? 1) - 1;
    } else if (ignoreCnt > 0) {
      ignoreCnt--;
      return null;
    }
    return { column, columnIndex, summaryColumn };
  });
}
