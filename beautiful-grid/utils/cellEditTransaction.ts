import {
  AppModelColumn,
  BGridCellValueChange,
  BGridColumn,
  BGridDataItem,
  BGridDataItemStatus,
} from '../types';
import { getCellValueByRowKey } from './getCellValue';
import { getColumnId } from './getColumnId';
import { markCellEdited, markCellValueChanged } from './cellEditState';

export interface BGridResolvedCellValueChange<T> {
  column: AppModelColumn<T>;
  change: BGridCellValueChange<T>;
}

export interface BGridAppliedRowChanges<T> {
  item: BGridDataItem<T>;
  changes: BGridCellValueChange<T>[];
  columns: AppModelColumn<T>[];
}

function keysEqual(left: BGridColumn<any>['key'], right: BGridColumn<any>['key']) {
  if (Array.isArray(left) || Array.isArray(right)) {
    return Array.isArray(left) && Array.isArray(right) && left.length === right.length && left.every((v, i) => v === right[i]);
  }
  return left === right;
}

export function resolveCellValueChanges<T>(
  changes: readonly BGridCellValueChange<T>[],
  columns: AppModelColumn<T>[],
): BGridResolvedCellValueChange<T>[] {
  if (changes.length === 0) throw new Error('[BGrid] commit() requires at least one cell change.');

  const normalized = new Map<string, BGridResolvedCellValueChange<T>>();
  changes.forEach(change => {
    const matches = columns.filter(column =>
      change.columnId !== undefined
        ? column.columnId === change.columnId || getColumnId(column) === change.columnId
        : keysEqual(column.key, change.key),
    );

    if (matches.length !== 1) {
      const target = change.columnId ?? JSON.stringify(change.key);
      throw new Error(
        matches.length === 0
          ? `[BGrid] Unknown cell change target: ${target}`
          : `[BGrid] Ambiguous cell change target: ${target}`,
      );
    }

    const column = matches[0];
    const columnId = column.columnId ?? getColumnId(column);
    normalized.delete(columnId);
    normalized.set(columnId, { column, change });
  });

  return Array.from(normalized.values());
}

function cloneContainer(value: unknown): Record<PropertyKey, any> {
  if (Array.isArray(value)) return [...value];
  if (value && typeof value === 'object') return { ...(value as Record<PropertyKey, any>) };
  return {};
}

export function setCellValueImmutable<T>(values: T, key: BGridColumn<T>['key'], value: unknown): T {
  if (!Array.isArray(key)) {
    const nextValues = cloneContainer(values);
    nextValues[key] = value;
    return nextValues as T;
  }
  if (key.length === 0) throw new Error('[BGrid] Empty column key paths cannot be edited.');

  const nextValues = cloneContainer(values);
  let nextTarget = nextValues;
  let currentTarget: any = values;
  key.forEach((pathKey, index) => {
    if (index === key.length - 1) {
      nextTarget[pathKey] = value;
      return;
    }
    const nextChild = cloneContainer(currentTarget?.[pathKey]);
    nextTarget[pathKey] = nextChild;
    nextTarget = nextChild;
    currentTarget = currentTarget?.[pathKey];
  });
  return nextValues as T;
}

export function createNextValues<T>(
  values: T,
  changes: readonly BGridResolvedCellValueChange<T>[],
): T {
  return changes.reduce((nextValues, { column, change }) => {
    return setCellValueImmutable(nextValues, column.key, change.value);
  }, values);
}

export function applyChangesToItem<T>(
  item: BGridDataItem<T>,
  changes: readonly BGridResolvedCellValueChange<T>[],
): BGridAppliedRowChanges<T> {
  let nextValues = item.values;
  const actualChanges: BGridCellValueChange<T>[] = [];
  const actualColumns: AppModelColumn<T>[] = [];

  changes.forEach(({ column, change }) => {
    const currentValue = getCellValueByRowKey(column.key, nextValues);
    if (Object.is(currentValue, change.value)) return;
    nextValues = setCellValueImmutable(nextValues, column.key, change.value);
    actualChanges.push(change);
    actualColumns.push(column);
  });

  if (actualChanges.length === 0) {
    return { item, changes: [], columns: [] };
  }

  const nextItem: BGridDataItem<T> = {
    ...item,
    values: nextValues,
    editedColumnIds: item.editedColumnIds ? [...item.editedColumnIds] : undefined,
    changedKeys: item.changedKeys ? [...item.changedKeys] : undefined,
  };
  actualColumns.forEach(column => {
    markCellEdited(nextItem, column);
    markCellValueChanged(nextItem, column);
  });
  if (nextItem.status !== BGridDataItemStatus.new && nextItem.status !== BGridDataItemStatus.remove) {
    nextItem.status = BGridDataItemStatus.edit;
  }

  return { item: nextItem, changes: actualChanges, columns: actualColumns };
}
