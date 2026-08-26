import { BGridColumn, BGridDataItem, BGridDataQuery, BGridProcessedRow, BGridProps, BGridSortParam } from '../types';
import { getCellValueByRowKey } from './getCellValue';
import { getColumnId } from './getColumnId';
import { filterRows } from './filterData';

export interface BGridProcessDataQueryParams<T> {
  data: BGridDataItem<T>[];
  columns: BGridColumn<T>[];
  query: BGridDataQuery;
  rowKey?: BGridProps<T>['rowKey'];
  /** Skip BGridProcessedRow metadata when the caller only needs data and index mappings. */
  includeRows?: boolean;
}

export interface BGridProcessDataQueryResult<T> {
  rows: BGridProcessedRow<T>[];
  data: BGridDataItem<T>[];
  sourceIndexByVisibleIndex: number[];
  visibleIndexBySourceIndex: Map<number, number>;
}

function compareValues(aVal: unknown, bVal: unknown): number {
  const isANil = aVal === null || aVal === undefined;
  const isBNil = bVal === null || bVal === undefined;

  // null-last rule: null/undefined are always placed last regardless of direction
  if (isANil && isBNil) return 0;
  if (isANil) return 1;
  if (isBNil) return -1;

  if (typeof aVal === 'number' && typeof bVal === 'number') {
    return aVal - bVal;
  }

  if (aVal instanceof Date && bVal instanceof Date) {
    return aVal.getTime() - bVal.getTime();
  }

  if (typeof aVal === 'boolean' && typeof bVal === 'boolean') {
    return (aVal ? 1 : 0) - (bVal ? 1 : 0);
  }

  return String(aVal).localeCompare(String(bVal));
}

/**
 * Pure data processing pipeline: filter then stable multi-sort.
 */
export function processDataQuery<T>(params: BGridProcessDataQueryParams<T>): BGridProcessDataQueryResult<T> {
  const { data, columns, query, rowKey, includeRows = true } = params;

  if (!data || data.length === 0) {
    return {
      rows: [],
      data: [],
      sourceIndexByVisibleIndex: [],
      visibleIndexBySourceIndex: new Map(),
    };
  }

  // 1. Filter rows
  const filtered = filterRows(data, columns, query.filterParams || []);

  // 2. Prepare column lookup
  const columnMap = new Map<string, BGridColumn<T>>();
  columns.forEach(col => {
    columnMap.set(getColumnId(col), col);
  });

  // 3. Sort rows if sortParams are present
  const activeSortParams: BGridSortParam[] = (query.sortParams || [])
    .filter(s => {
      const id = s.columnId ?? s.key;
      return id && columnMap.has(id);
    })
    .sort((a, b) => (a.index ?? 0) - (b.index ?? 0));

  let sortedRows = filtered;

  if (activeSortParams.length > 0) {
    const sortColumns = activeSortParams.map(sortParam => {
      const columnId = sortParam.columnId ?? sortParam.key!;
      return columnMap.get(columnId)!;
    });
    const sortValues = sortColumns.map(column =>
      filtered.map(entry => getCellValueByRowKey(column.key, entry.item.values)),
    );
    const sortedIndexes = filtered.map((_, index) => index);

    sortedIndexes.sort((aIndex, bIndex) => {
      for (let i = 0; i < activeSortParams.length; i++) {
        const sortParam = activeSortParams[i];
        const column = sortColumns[i];
        const aRaw = sortValues[i][aIndex];
        const bRaw = sortValues[i][bIndex];

        const isANil = aRaw === null || aRaw === undefined;
        const isBNil = bRaw === null || bRaw === undefined;

        let comparison = 0;

        if (isANil || isBNil) {
          // null-last rule: null/undefined always placed at the end regardless of asc/desc
          comparison = isANil && isBNil ? 0 : isANil ? 1 : -1;
        } else if (column.sortComparator) {
          const customResult = column.sortComparator(aRaw, bRaw, {
            column,
            aItem: filtered[aIndex].item,
            bItem: filtered[bIndex].item,
          });
          comparison = sortParam.orderBy === 'desc' ? -customResult : customResult;
        } else {
          const rawComp = compareValues(aRaw, bRaw);
          comparison = sortParam.orderBy === 'desc' ? -rawComp : rawComp;
        }

        if (comparison !== 0) {
          return comparison;
        }
      }

      // Stable tie-breaker: preserve original sourceIndex
      return filtered[aIndex].sourceIndex - filtered[bIndex].sourceIndex;
    });

    sortedRows = sortedIndexes.map(index => filtered[index]);
  }

  // 4. Build output structures
  const rows: BGridProcessedRow<T>[] = [];
  const processedData: BGridDataItem<T>[] = [];
  const sourceIndexByVisibleIndex: number[] = [];
  const visibleIndexBySourceIndex = new Map<number, number>();

  for (let visibleIndex = 0; visibleIndex < sortedRows.length; visibleIndex++) {
    const entry = sortedRows[visibleIndex];
    if (includeRows) {
      const itemRowKey = rowKey ? getCellValueByRowKey(rowKey, entry.item.values) : undefined;
      rows.push({
        item: entry.item,
        sourceIndex: entry.sourceIndex,
        rowKey: itemRowKey,
      });
    }
    processedData.push(entry.item);
    sourceIndexByVisibleIndex.push(entry.sourceIndex);
    visibleIndexBySourceIndex.set(entry.sourceIndex, visibleIndex);
  }

  return {
    rows,
    data: processedData,
    sourceIndexByVisibleIndex,
    visibleIndexBySourceIndex,
  };
}
