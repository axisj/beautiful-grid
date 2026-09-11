import type { BGridMessages, BGridToolboxMessages } from 'beautiful-grid';

export const isEn = typeof document !== 'undefined' && document.documentElement.lang === 'en';
export function t<T>(ko: T, en: T): T {
  return isEn ? en : ko;
}

export const englishToolboxMessages: BGridToolboxMessages = {
  sort: 'Sort',
  sortAscending: 'Sort ascending',
  sortDescending: 'Sort descending',
  clearSort: 'Clear sort',
  filterApplied: 'Filter applied',
  openColumnOptions: 'Open column options',
  filter: 'Filter',
  textFilter: 'Text filter',
  valueFilter: 'Value filter',
  numberFilter: 'Number filter',
  contains: 'Contains',
  equals: 'Equals',
  notEquals: 'Does not equal',
  numberEquals: 'Equals (=)',
  numberNotEquals: 'Not equals (≠)',
  greaterThan: 'Greater than (>)',
  greaterThanOrEqual: 'Greater than or equal (≥)',
  lessThan: 'Less than (<)',
  lessThanOrEqual: 'Less than or equal (≤)',
  between: 'Between',
  searchPlaceholder: 'Search...',
  textPlaceholder: 'Enter search text...',
  numberPlaceholder: 'Enter number...',
  minimumPlaceholder: 'Minimum',
  maximumPlaceholder: 'Maximum',
  invalidRange: 'Minimum cannot exceed maximum.',
  clear: 'Clear',
  apply: 'Apply',
  emptyValue: '(Blank)',
  selectAll: '(Select all)',
  noValues: 'No available values.',
  noResults: 'No results found.',
  extraMenu: 'Extra menu',
  columns: 'Columns',
  hiddenColumns: 'Hidden columns',
  showAllColumns: 'Show all',
  hideThisColumn: 'Hide this column',
  lastVisibleColumn: 'At least one column must remain visible.',
  hiddenColumnCount: count => `${count} hidden ${count === 1 ? 'column' : 'columns'}`,
  moreValues: count => `+${count} more ${count === 1 ? 'item' : 'items'}. Use search.`,
};

export const englishMessages: BGridMessages = {
  emptyList: 'No data to display.',
  toolbox: englishToolboxMessages,
};

export const exampleMsg: BGridMessages | undefined = isEn ? englishMessages : undefined;
