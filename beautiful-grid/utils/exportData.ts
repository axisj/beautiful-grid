import React from 'react';
import {
  BGridColumn,
  BGridDataItem,
  BGridExportColumn,
  BGridExportColumnScope,
  BGridExportData,
  BGridExportDataOptions,
  BGridExportRow,
  BGridExportRowScope,
} from '../types';
import { getColumnId } from './getColumnId';
import { getCellValueByRowKey } from './getCellValue';

export function resolveExportColumns<T>(
  columns: readonly BGridColumn<T>[],
  sourceColumns?: readonly BGridColumn<T>[],
  scope: BGridExportColumnScope = 'visible',
): BGridExportColumn<T>[] {
  let selectedColumns: BGridColumn<T>[];

  if (Array.isArray(scope)) {
    const candidatePool = sourceColumns && sourceColumns.length > 0 ? sourceColumns : columns;
    const columnMap = new Map<string, BGridColumn<T>>();
    for (const col of candidatePool) {
      columnMap.set(getColumnId(col), col);
    }
    selectedColumns = [];
    for (const id of scope) {
      const col = columnMap.get(id);
      if (col) {
        selectedColumns.push(col);
      }
    }
  } else if (scope === 'all') {
    selectedColumns = sourceColumns && sourceColumns.length > 0 ? [...sourceColumns] : [...columns];
  } else {
    // 'visible'
    selectedColumns = [...columns];
  }

  const exportableColumns = selectedColumns.filter(col => col.exportable !== false);

  return exportableColumns.map((column, columnIndex) => {
    const columnId = getColumnId(column);
    let header: string;
    if (typeof column.exportHeader === 'function') {
      header = column.exportHeader(column);
    } else if (typeof column.exportHeader === 'string') {
      header = column.exportHeader;
    } else if (typeof column.label === 'string' || typeof column.label === 'number') {
      header = String(column.label);
    } else {
      header = columnId;
    }

    return {
      columnId,
      header,
      column,
      columnIndex,
    };
  });
}

export interface CreateGridExportDataParams<T> {
  options?: BGridExportDataOptions;
  columns: readonly BGridColumn<T>[];
  sourceColumns?: readonly BGridColumn<T>[];
  data: readonly BGridDataItem<T>[];
  sourceData?: readonly BGridDataItem<T>[];
  sourceIndexByVisibleIndex?: readonly number[];
  visibleIndexBySourceIndex?: ReadonlyMap<number, number>;
  checkedIndexesMap?: ReadonlyMap<number, unknown>;
  rowKey?: React.Key | React.Key[];
}

export function resolveExportRows<T>(
  exportColumns: readonly BGridExportColumn<T>[],
  params: CreateGridExportDataParams<T>,
): BGridExportRow<T>[] {
  const rowScope: BGridExportRowScope = params.options?.rows ?? 'displayed';
  const rows: BGridExportRow<T>[] = [];
  const sourcePool = params.sourceData && params.sourceData.length > 0 ? params.sourceData : params.data;

  const buildCells = (
    item: BGridDataItem<T>,
    values: T,
    sourceIndex: number,
    visibleIndex?: number,
  ) => {
    const cells: unknown[] = [];
    for (const expCol of exportColumns) {
      const rawValue = getCellValueByRowKey(expCol.column.key, values);
      if (expCol.column.getExportValue) {
        cells.push(
          expCol.column.getExportValue({
            column: expCol.column,
            columnId: expCol.columnId,
            visibleIndex,
            sourceIndex,
            item,
            values,
            value: rawValue,
          }),
        );
      } else {
        cells.push(rawValue);
      }
    }
    return cells;
  };

  const resolveRowKey = (item: BGridDataItem<T>, values: T) => {
    let rowKey: React.Key | undefined;
    if (params.rowKey !== undefined && values) {
      const rawKey = getCellValueByRowKey(params.rowKey, values);
      if (rawKey !== undefined && rawKey !== null) {
        rowKey = rawKey as React.Key;
      }
    }
    if (rowKey === undefined && (item as any)?.key !== undefined) {
      rowKey = (item as any).key;
    }
    return rowKey;
  };

  if (rowScope === 'displayed') {
    const displayData = params.data;
    for (let visibleIndex = 0; visibleIndex < displayData.length; visibleIndex++) {
      const item = displayData[visibleIndex] ?? ({ values: {} as T } as BGridDataItem<T>);
      const sourceIndex = params.sourceIndexByVisibleIndex?.[visibleIndex] ?? visibleIndex;
      const values = item.values ?? ({} as T);
      const rowKey = resolveRowKey(item, values);
      const cells = buildCells(item, values, sourceIndex, visibleIndex);

      rows.push({
        visibleIndex,
        sourceIndex,
        rowKey,
        item,
        values,
        cells,
      });
    }
  } else if (rowScope === 'checked') {
    const checkedMap = params.checkedIndexesMap;
    for (let sourceIndex = 0; sourceIndex < sourcePool.length; sourceIndex++) {
      if (!checkedMap?.has(sourceIndex)) continue;

      const item = sourcePool[sourceIndex] ?? ({ values: {} as T } as BGridDataItem<T>);
      const visibleIndex = params.visibleIndexBySourceIndex?.get(sourceIndex);
      const values = item.values ?? ({} as T);
      const rowKey = resolveRowKey(item, values);
      const cells = buildCells(item, values, sourceIndex, visibleIndex);

      rows.push({
        visibleIndex,
        sourceIndex,
        rowKey,
        item,
        values,
        cells,
      });
    }
  } else {
    // 'source'
    for (let sourceIndex = 0; sourceIndex < sourcePool.length; sourceIndex++) {
      const item = sourcePool[sourceIndex] ?? ({ values: {} as T } as BGridDataItem<T>);
      const visibleIndex = params.visibleIndexBySourceIndex?.get(sourceIndex);
      const values = item.values ?? ({} as T);
      const rowKey = resolveRowKey(item, values);
      const cells = buildCells(item, values, sourceIndex, visibleIndex);

      rows.push({
        visibleIndex,
        sourceIndex,
        rowKey,
        item,
        values,
        cells,
      });
    }
  }

  return rows;
}

export function createGridExportData<T>(
  params: CreateGridExportDataParams<T>,
): BGridExportData<T> {
  const columnScope: BGridExportColumnScope = params.options?.columns ?? 'visible';
  const columns = resolveExportColumns(params.columns, params.sourceColumns, columnScope);
  const rows = resolveExportRows(columns, params);

  return {
    columns,
    rows,
  };
}
