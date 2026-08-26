import { BGridColumn } from '../types';

/**
 * Returns a stable identifier for the data field referenced by a column.
 * Unlike getColumnId, explicit column ids do not affect this token, so columns
 * that render the same key share the same value-change identity.
 */
export function getColumnKeyToken<T>(key: BGridColumn<T>['key']): string {
  return Array.isArray(key) ? `key:array:${JSON.stringify(key)}` : `key:string:${key}`;
}

/**
 * Returns a stable unique column identifier.
 * If column.id is explicitly provided, it is returned as is.
 * Otherwise, column.key is serialized in a conflict-free manner.
 */
export function getColumnId<T>(column: BGridColumn<T>): string {
  if (column.id) return column.id;
  return getColumnKeyToken(column.key);
}

/**
 * Checks for duplicate column IDs in development mode.
 * If onlyToolbox is true, only returns duplicates among toolbox-enabled columns.
 * Returns a Set of duplicated IDs if any.
 */
export function findDuplicateColumnIds<T>(columns: BGridColumn<T>[], onlyToolbox = false): Set<string> {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  if (onlyToolbox) {
    const idCounts = new Map<string, number>();
    columns.forEach(col => {
      const id = getColumnId(col);
      idCounts.set(id, (idCounts.get(id) ?? 0) + 1);
    });

    columns.forEach(col => {
      const isToolbox = col.toolbox !== undefined && col.toolbox !== false;
      const id = getColumnId(col);
      if (isToolbox && (idCounts.get(id) ?? 0) > 1) {
        duplicates.add(id);
      }
    });

    return duplicates;
  }

  columns.forEach(col => {
    const id = getColumnId(col);
    if (seen.has(id)) {
      duplicates.add(id);
    } else {
      seen.add(id);
    }
  });

  return duplicates;
}
