import { BGridDataQuery, BGridFilterParam, BGridSortParam } from '../types';

/**
 * Checks if a filter parameter has a valid, non-empty condition.
 */
export function isFilterParamActive(filter: BGridFilterParam | undefined | null): filter is BGridFilterParam {
  if (!filter) return false;

  switch (filter.type) {
    case 'values':
      return Array.isArray(filter.values) && filter.values.length > 0;
    case 'text':
      return typeof filter.value === 'string' && filter.value.trim().length > 0;
    case 'number':
      if (filter.operator === 'between') {
        return (
          typeof filter.min === 'number' &&
          !Number.isNaN(filter.min) &&
          typeof filter.max === 'number' &&
          !Number.isNaN(filter.max)
        );
      }
      return typeof filter.value === 'number' && !Number.isNaN(filter.value);
    default:
      return false;
  }
}

/**
 * Normalizes a text filter by trimming whitespace.
 */
export function normalizeFilterParam(filter: BGridFilterParam): BGridFilterParam | null {
  if (filter.type === 'text') {
    const trimmed = filter.value.trim();
    if (!trimmed) return null;
    return {
      ...filter,
      value: trimmed,
    };
  }

  if (!isFilterParamActive(filter)) {
    return null;
  }

  return { ...filter };
}

/**
 * Creates an immutable updated query while keeping sort and filter params sanitized.
 */
export function updateDataQuery(
  current: BGridDataQuery,
  updater: (draft: { sortParams: BGridSortParam[]; filterParams: BGridFilterParam[] }) => void,
): BGridDataQuery {
  const nextSortParams = current.sortParams.map(s => ({ ...s }));
  const nextFilterParams = current.filterParams.map(f => ({ ...f }));

  const draft = {
    sortParams: nextSortParams,
    filterParams: nextFilterParams,
  };

  updater(draft);

  // Normalize sort indices
  draft.sortParams.forEach((s, idx) => {
    s.index = idx;
  });

  // Filter out invalid or duplicate filters (keep the latest for each columnId)
  const filterMap = new Map<string, BGridFilterParam>();
  draft.filterParams.forEach(f => {
    const normalized = normalizeFilterParam(f);
    if (normalized) {
      filterMap.set(normalized.columnId, normalized);
    }
  });

  return {
    sortParams: draft.sortParams,
    filterParams: Array.from(filterMap.values()),
  };
}

/**
 * Sets or clears column sort on the query.
 */
export function applySortToQuery(
  query: BGridDataQuery,
  columnId: string,
  key: string | string[] | undefined,
  order: 'asc' | 'desc' | null,
  multiSort = false,
): BGridDataQuery {
  const keyStr = Array.isArray(key) ? key.join('.') : key;

  return updateDataQuery(query, draft => {
    if (!order) {
      // Clear sort for this columnId
      draft.sortParams = draft.sortParams.filter(s => (s.columnId ?? s.key) !== columnId);
      return;
    }

    if (!multiSort) {
      // Single sort replaces all existing sorts
      draft.sortParams = [
        {
          columnId,
          key: keyStr,
          index: 0,
          orderBy: order,
        },
      ];
      return;
    }

    // Multi sort: update existing or append
    const existingIdx = draft.sortParams.findIndex(s => (s.columnId ?? s.key) === columnId);
    if (existingIdx > -1) {
      draft.sortParams[existingIdx].orderBy = order;
      draft.sortParams[existingIdx].columnId = columnId;
      if (keyStr) draft.sortParams[existingIdx].key = keyStr;
    } else {
      draft.sortParams.push({
        columnId,
        key: keyStr,
        index: draft.sortParams.length,
        orderBy: order,
      });
    }
  });
}

/**
 * Sets or updates column filter on the query.
 */
export function applyFilterToQuery(query: BGridDataQuery, filter: BGridFilterParam): BGridDataQuery {
  return updateDataQuery(query, draft => {
    const normalized = normalizeFilterParam(filter);
    draft.filterParams = draft.filterParams.filter(f => f.columnId !== filter.columnId);
    if (normalized) {
      draft.filterParams.push(normalized);
    }
  });
}

/**
 * Clears column filter from the query.
 */
export function clearFilterFromQuery(query: BGridDataQuery, columnId: string): BGridDataQuery {
  return updateDataQuery(query, draft => {
    draft.filterParams = draft.filterParams.filter(f => f.columnId !== columnId);
  });
}
