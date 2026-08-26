import { BGridColumn, BGridDataItem, BGridFilterParam } from '../types';
import { getCellValueByRowKey } from './getCellValue';
import { getColumnId } from './getColumnId';

/**
 * Normalizes a raw cell value for values-based filtering.
 * undefined is normalized to null and Date is serialized to an ISO string so
 * values-filter candidates and row comparisons share the public primitive type.
 */
export function normalizeValueForFilter(value: unknown): unknown {
  if (value === undefined) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value.toISOString();
  }
  return value;
}

/**
 * Checks if a value is a valid numeric value or non-empty numeric string.
 */
function parseNumericValue(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const num = Number(trimmed);
    return Number.isNaN(num) ? null : num;
  }
  return null;
}

/**
 * Evaluates whether a single row matches the filter condition for a column.
 */
export function matchColumnFilter<T>(
  item: BGridDataItem<T>,
  column: BGridColumn<T>,
  filter: BGridFilterParam,
): boolean {
  const filterConfig = column.filter !== false ? column.filter : undefined;

  // 15. Custom predicate
  if (filterConfig?.predicate) {
    try {
      const rawValue = filterConfig.getValue
        ? filterConfig.getValue(item)
        : getCellValueByRowKey(column.key, item.values);
      return filterConfig.predicate({
        item,
        value: rawValue,
        filter,
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[BGrid] Custom filter predicate threw an error on column ${getColumnId(column)}:`, err);
      }
      return false;
    }
  }

  // Read value from column.key
  const rawValue = filterConfig?.getValue
    ? filterConfig.getValue(item)
    : getCellValueByRowKey(column.key, item.values);

  // 14. Object / array values without custom predicate or getValue are not matched by default
  if (rawValue !== null && typeof rawValue === 'object' && !(rawValue instanceof Date)) {
    if (!filterConfig?.getValue) {
      return false;
    }
  }

  switch (filter.type) {
    case 'values': {
      // 2. Multiple values in 'values' are joined by OR
      // 3. Empty values array is treated as no filter
      if (!Array.isArray(filter.values) || filter.values.length === 0) {
        return true;
      }

      // 13. Normalize undefined to null and use Set for SameValueZero lookup
      const normalizedCellVal = normalizeValueForFilter(rawValue);
      const filterValuesSet = new Set(filter.values.map(v => normalizeValueForFilter(v)));
      return filterValuesSet.has(normalizedCellVal as any);
    }

    case 'text': {
      // 4. Empty text filter is treated as no filter
      const filterVal = filter.value ? filter.value.trim() : '';
      if (!filterVal) return true;

      // 9. null and undefined are normalized to empty string for text comparison
      const caseSensitive = filterConfig?.caseSensitive ?? false;
      const cellString = rawValue === null || rawValue === undefined ? '' : String(rawValue);

      const targetText = caseSensitive ? cellString : cellString.toLowerCase();
      const queryText = caseSensitive ? filterVal : filterVal.toLowerCase();

      switch (filter.operator) {
        case 'contains':
          // 7. contains is String(cellValue).includes(filterValue)
          return targetText.includes(queryText);
        case 'equals':
          // 8. equals is full normalized string equality
          return targetText === queryText;
        case 'notEquals':
          return targetText !== queryText;
        default:
          return true;
      }
    }

    case 'number': {
      // 10. Number filter accepts number and non-empty numeric strings
      // 11. Empty string, null, undefined, NaN are not matched
      const numericCellVal = parseNumericValue(rawValue);
      if (numericCellVal === null) return false;

      if (filter.operator === 'between') {
        // 12. between is min <= value && value <= max
        if (typeof filter.min !== 'number' || typeof filter.max !== 'number') return true;
        if (Number.isNaN(filter.min) || Number.isNaN(filter.max)) return true;
        return numericCellVal >= filter.min && numericCellVal <= filter.max;
      }

      const targetVal = filter.value;
      if (typeof targetVal !== 'number' || Number.isNaN(targetVal)) return true;

      switch (filter.operator) {
        case 'equals':
          return numericCellVal === targetVal;
        case 'notEquals':
          return numericCellVal !== targetVal;
        case 'gt':
          return numericCellVal > targetVal;
        case 'gte':
          return numericCellVal >= targetVal;
        case 'lt':
          return numericCellVal < targetVal;
        case 'lte':
          return numericCellVal <= targetVal;
        default:
          return true;
      }
    }

    default:
      return true;
  }
}

/**
 * Filters rows against all active filter parameters (AND combination).
 */
export function filterRows<T>(
  data: BGridDataItem<T>[],
  columns: BGridColumn<T>[],
  filterParams: BGridFilterParam[],
): { item: BGridDataItem<T>; sourceIndex: number }[] {
  if (!filterParams || filterParams.length === 0) {
    return data.map((item, sourceIndex) => ({ item, sourceIndex }));
  }

  const columnMap = new Map<string, BGridColumn<T>>();
  columns.forEach(col => {
    columnMap.set(getColumnId(col), col);
  });

  const activeFilters = filterParams.filter(f => {
    const col = columnMap.get(f.columnId);
    return !!col;
  });

  if (activeFilters.length === 0) {
    return data.map((item, sourceIndex) => ({ item, sourceIndex }));
  }

  const result: { item: BGridDataItem<T>; sourceIndex: number }[] = [];

  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    let matchesAll = true;

    for (let j = 0; j < activeFilters.length; j++) {
      const filter = activeFilters[j];
      const column = columnMap.get(filter.columnId)!;

      if (!matchColumnFilter(item, column, filter)) {
        matchesAll = false;
        break;
      }
    }

    if (matchesAll) {
      result.push({ item, sourceIndex: i });
    }
  }

  return result;
}
