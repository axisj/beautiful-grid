import { BGridColumn, BGridDataItem } from '../types';
import { getColumnId, getColumnKeyToken } from './getColumnId';

type ResolvedColumnKey<T> = BGridColumn<T> & { keyToken?: string };

function resolveColumnKeyToken<T>(column: ResolvedColumnKey<T>) {
  return column.keyToken ?? getColumnKeyToken(column.key);
}

export function markCellEdited<T>(item: BGridDataItem<T>, column: BGridColumn<T>) {
  const columnId = getColumnId(column);
  if (item.editedColumnIds?.includes(columnId)) return;
  item.editedColumnIds = [...(item.editedColumnIds ?? []), columnId];
}

export function isCellEdited<T>(item: BGridDataItem<T>, column: BGridColumn<T>) {
  return item.editedColumnIds?.includes(getColumnId(column)) ?? false;
}

export function markCellValueChanged<T>(item: BGridDataItem<T>, column: ResolvedColumnKey<T>) {
  const keyToken = resolveColumnKeyToken(column);
  if (item.changedKeys?.includes(keyToken)) return;
  item.changedKeys = [...(item.changedKeys ?? []), keyToken];
}

export function isCellValueChanged<T>(item: BGridDataItem<T>, column: ResolvedColumnKey<T>) {
  return item.changedKeys?.includes(resolveColumnKeyToken(column)) ?? false;
}

export function clearEditedCells<T>(item: BGridDataItem<T>) {
  item.editedColumnIds = undefined;
}

export function clearChangedValues<T>(item: BGridDataItem<T>) {
  item.changedKeys = undefined;
}

export function clearCellChangeState<T>(item: BGridDataItem<T>) {
  clearEditedCells(item);
  clearChangedValues(item);
}
