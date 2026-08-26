import * as React from 'react';
import {
  BGridColumnGroup,
  BGridColumnWithOptionalWidth,
  BGridDataItem,
  BGridPivotField,
  BGridPivotOptions,
  BGridPivotValue,
} from '../types';
import { getCellValueByRowKey } from './getCellValue';

interface CreatePivotDataParams<T> {
  data: BGridDataItem<T>[];
  pivot?: BGridPivotOptions<T>;
}

export interface PivotDataResult {
  data: BGridDataItem<Record<string, any>>[];
  columns: BGridColumnWithOptionalWidth<Record<string, any>>[];
  columnsGroup: BGridColumnGroup[];
}

interface PivotBucket<T> {
  rowValues: any[];
  values: Record<string, any>;
  sourceItems: BGridDataItem<T>[];
  cells: Map<string, Map<number, { values: any[]; items: BGridDataItem<T>[] }>>;
}

interface PivotCellContext<T> {
  sourceItems: BGridDataItem<T>[];
  rowValues: any[];
  columnValues: any[];
  pivotValue: BGridPivotValue<T>;
  aggregate?: BGridPivotValue<T>['aggregate'];
}

export function createPivotData<T>({ data, pivot }: CreatePivotDataParams<T>): PivotDataResult | undefined {
  if (!pivot || pivot.enabled === false || pivot.rows.length === 0 || pivot.values.length === 0) {
    return undefined;
  }

  const columnFields = pivot.columns;
  const separator = pivot.columnLabelSeparator ?? ' / ';
  const rowBuckets = new Map<string, PivotBucket<T>>();
  const columnBuckets = new Map<string, { values: any[]; label: React.ReactNode }>();

  data.forEach(item => {
    const rowValues = pivot.rows.map(field => getFieldValue(field, item.values));
    const rowBucketKey = createTupleKey(rowValues);
    const columnValues = columnFields.map(field => getFieldValue(field, item.values));
    const columnBucketKey = createTupleKey(columnValues);

    if (!rowBuckets.has(rowBucketKey)) {
      rowBuckets.set(rowBucketKey, {
        rowValues,
        values: createRowFieldValues(pivot.rows, rowValues),
        sourceItems: [],
        cells: new Map(),
      });
    }

    if (columnFields.length > 0 && !columnBuckets.has(columnBucketKey)) {
      columnBuckets.set(columnBucketKey, {
        values: columnValues,
        label: columnValues.map(formatPivotValue).join(separator),
      });
    }

    const rowBucket = rowBuckets.get(rowBucketKey);
    if (!rowBucket) return;

    rowBucket.sourceItems.push(item);
    pivot.values.forEach((value, valueIndex) => {
      const cellByValue = rowBucket.cells.get(columnBucketKey) ?? new Map();
      const cell = cellByValue.get(valueIndex) ?? { values: [], items: [] };
      cell.values.push(getFieldValue(value, item.values));
      cell.items.push(item);
      cellByValue.set(valueIndex, cell);
      rowBucket.cells.set(columnBucketKey, cellByValue);
    });
  });

  if (columnFields.length === 0) {
    columnBuckets.set('__bgrid_pivot_total__', {
      values: [],
      label: '',
    });
  }

  const rowColumns = pivot.rows.map((field, index): BGridColumnWithOptionalWidth<Record<string, any>> => {
    const key = getPivotRowKey(index);
    return {
      key,
      label: field.label ?? getFieldLabel(field),
      width: field.width ?? 140,
      align: field.align,
      headerAlign: field.headerAlign,
      className: field.className,
      headerClassName: field.headerClassName,
      headerStyle: field.headerStyle,
    };
  });

  const valueColumns: BGridColumnWithOptionalWidth<Record<string, any>>[] = [];
  const columnsGroup: BGridColumnGroup[] = [];
  const columnBucketEntries = Array.from(columnBuckets.values());

  columnBucketEntries.forEach((columnBucket, columnBucketIndex) => {
    const groupStartIndex = rowColumns.length + valueColumns.length;

    pivot.values.forEach((value, valueIndex) => {
      const key = getPivotValueKey(columnBucketIndex, valueIndex);
      valueColumns.push({
        key,
        label:
          columnFields.length > 0
            ? value.label ?? getFieldLabel(value)
            : getUngroupedValueLabel(value, columnBucket.label),
        width: value.width ?? 120,
        align: value.align ?? 'right',
        headerAlign: value.headerAlign ?? 'center',
        className: value.className,
        headerClassName: value.headerClassName,
        headerStyle: value.headerStyle,
        itemRender: value.itemRender
          ? props => {
              const context = getPivotCellContext<T>(props.item, key);
              return (
                value.itemRender?.({
                  ...props,
                  ...context,
                }) ?? null
              );
            }
          : undefined,
        getClipboardText: value.getClipboardText
          ? props => {
              const context = getPivotCellContext<T>(props.item, key);
              return value.getClipboardText?.({
                ...props,
                ...context,
              });
            }
          : undefined,
      });
    });

    if (columnFields.length > 0) {
      columnsGroup.push({
        label: columnBucket.label,
        groupStartIndex,
        groupEndIndex: groupStartIndex + pivot.values.length - 1,
        align: 'center',
        headerAlign: 'center',
      });
    }
  });

  const pivotData = Array.from(rowBuckets.values()).map(rowBucket => {
    const values: Record<string, any> = { ...rowBucket.values };
    const cells: Record<string, PivotCellContext<T>> = {};

    columnBucketEntries.forEach((columnBucket, columnBucketIndex) => {
      const columnBucketKey = createTupleKey(columnBucket.values);
      const cellByValue = rowBucket.cells.get(columnBucketKey);

      pivot.values.forEach((value, valueIndex) => {
        const key = getPivotValueKey(columnBucketIndex, valueIndex);
        const cell = cellByValue?.get(valueIndex);
        values[key] = cell
          ? aggregatePivotValue({
              value,
              values: cell.values,
              items: cell.items,
              rowValues: rowBucket.rowValues,
              columnValues: columnBucket.values,
            })
          : pivot.emptyValue ?? '';
        cells[key] = {
          sourceItems: cell?.items ?? [],
          rowValues: rowBucket.rowValues,
          columnValues: columnBucket.values,
          pivotValue: value,
          aggregate: value.aggregate,
        };
      });
    });

    return {
      values,
      meta: {
        pivot: {
          sourceItems: rowBucket.sourceItems,
          rowValues: rowBucket.rowValues,
          cells,
        },
      },
    };
  });

  return {
    data: pivotData,
    columns: [...rowColumns, ...valueColumns],
    columnsGroup,
  };
}

function getPivotCellContext<T>(item: BGridDataItem<Record<string, any>>, key: string): PivotCellContext<T> {
  const context = item.meta?.pivot?.cells?.[key] as PivotCellContext<T> | undefined;
  return (
    context ?? {
      sourceItems: [],
      rowValues: [],
      columnValues: [],
      pivotValue: { key },
    }
  );
}

function createRowFieldValues(fields: BGridPivotField[], values: any[]) {
  return fields.reduce((acc, field, index) => {
    acc[getPivotRowKey(index)] = values[index];
    return acc;
  }, {} as Record<string, any>);
}

function aggregatePivotValue<T>({
  value,
  values,
  items,
  rowValues,
  columnValues,
}: {
  value: BGridPivotValue<T>;
  values: any[];
  items: BGridDataItem<T>[];
  rowValues: any[];
  columnValues: any[];
}) {
  const aggregate = value.aggregate ?? 'sum';

  if (typeof aggregate === 'function') {
    return aggregate({
      values,
      items,
      rowValues,
      columnValues,
      value,
    });
  }

  const numericValues = values.map(toNumber).filter(value => value !== undefined) as number[];

  if (aggregate === 'count') return values.length;
  if (aggregate === 'first') return values[0] ?? '';
  if (numericValues.length === 0) return '';
  if (aggregate === 'avg') return numericValues.reduce((acc, cur) => acc + cur, 0) / numericValues.length;
  if (aggregate === 'min') return Math.min(...numericValues);
  if (aggregate === 'max') return Math.max(...numericValues);

  return numericValues.reduce((acc, cur) => acc + cur, 0);
}

function getFieldValue<T>(field: BGridPivotField, values: T) {
  return getCellValueByRowKey(field.key, values);
}

function getFieldLabel(field: BGridPivotField) {
  if (Array.isArray(field.key)) return field.key.join('.');
  return field.key;
}

function getUngroupedValueLabel(value: BGridPivotValue<any>, fallback: React.ReactNode) {
  return value.label ?? fallback ?? getFieldLabel(value);
}

function getPivotRowKey(index: number) {
  return `__bgrid_pivot_row_${index}`;
}

function getPivotValueKey(columnBucketIndex: number, valueIndex: number) {
  return `__bgrid_pivot_value_${columnBucketIndex}_${valueIndex}`;
}

function createTupleKey(values: any[]) {
  return JSON.stringify(values.map(value => (value === undefined ? null : value)));
}

function formatPivotValue(value: any) {
  if (value === undefined || value === null || value === '') return '(blank)';
  return String(value);
}

function toNumber(value: any) {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined;
  if (value === null || value === undefined || value === '') return undefined;

  const nextValue = Number(value);
  return Number.isFinite(nextValue) ? nextValue : undefined;
}
