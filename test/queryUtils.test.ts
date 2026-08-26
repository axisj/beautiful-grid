import { describe, expect, it, vi } from 'vitest';
import {
  applyFilterToQuery,
  applySortToQuery,
  clearFilterFromQuery,
  findDuplicateColumnIds,
  getColumnId,
  isFilterParamActive,
  matchColumnFilter,
  processDataQuery,
  updateDataQuery,
} from '../beautiful-grid/utils';
import { BGridColumn, BGridDataItem, BGridDataQuery, BGridFilterParam } from '../beautiful-grid/types';

describe('queryUtils & pure data processing', () => {
  describe('getColumnId & findDuplicateColumnIds', () => {
    it('generates consistent id for string and array keys', () => {
      const colString: BGridColumn<any> = { key: 'name', label: 'Name', width: 100 };
      const colArray: BGridColumn<any> = { key: ['user', 'address', 'city'], label: 'City', width: 100 };
      const colExplicit: BGridColumn<any> = { id: 'custom_id', key: 'name', label: 'Name', width: 100 };

      expect(getColumnId(colString)).toBe('key:string:name');
      expect(getColumnId(colArray)).toBe('key:array:["user","address","city"]');
      expect(getColumnId(colExplicit)).toBe('custom_id');
    });

    it('detects duplicate column ids', () => {
      const columns: BGridColumn<any>[] = [
        { key: 'name', label: 'Name 1', width: 100 },
        { key: 'name', label: 'Name 2', width: 100 },
        { key: 'age', label: 'Age', width: 100 },
      ];

      const duplicates = findDuplicateColumnIds(columns);
      expect(duplicates.size).toBe(1);
      expect(duplicates.has('key:string:name')).toBe(true);
    });

    it('limits duplicate detection to ids that would enable a toolbox', () => {
      const columns: BGridColumn<any>[] = [
        { id: 'shared', key: 'name', label: 'Name', width: 100, toolbox: true },
        { id: 'shared', key: 'age', label: 'Age', width: 100 },
        { id: 'plain', key: 'first', label: 'First', width: 100 },
        { id: 'plain', key: 'second', label: 'Second', width: 100 },
      ];

      expect(findDuplicateColumnIds(columns, true)).toEqual(new Set(['shared']));
    });
  });

  describe('updateDataQuery', () => {
    it('maintains immutability of query objects and arrays', () => {
      const initial: BGridDataQuery = {
        sortParams: [{ columnId: 'key:string:name', key: 'name', index: 0, orderBy: 'asc' }],
        filterParams: [{ columnId: 'key:string:age', key: 'age', type: 'number', operator: 'gte', value: 20 }],
      };

      const updated = applySortToQuery(initial, 'key:string:age', 'age', 'desc', false);

      expect(updated).not.toBe(initial);
      expect(updated.sortParams).not.toBe(initial.sortParams);
      expect(initial.sortParams.length).toBe(1);
      expect(initial.sortParams[0].columnId).toBe('key:string:name');
      expect(updated.sortParams.length).toBe(1);
      expect(updated.sortParams[0].columnId).toBe('key:string:age');
      expect(updated.sortParams[0].orderBy).toBe('desc');
    });

    it('handles single sort replacing previous sorts and multi sort preserving index', () => {
      let query: BGridDataQuery = { sortParams: [], filterParams: [] };

      // Single sort
      query = applySortToQuery(query, 'col1', 'col1', 'asc', false);
      expect(query.sortParams.length).toBe(1);
      expect(query.sortParams[0]).toEqual({ columnId: 'col1', key: 'col1', index: 0, orderBy: 'asc' });

      query = applySortToQuery(query, 'col2', 'col2', 'desc', false);
      expect(query.sortParams.length).toBe(1);
      expect(query.sortParams[0]).toEqual({ columnId: 'col2', key: 'col2', index: 0, orderBy: 'desc' });

      // Multi sort
      query = applySortToQuery(query, 'col1', 'col1', 'asc', true);
      expect(query.sortParams.length).toBe(2);
      expect(query.sortParams[0].index).toBe(0);
      expect(query.sortParams[1].index).toBe(1);

      // Clear sort on col2
      query = applySortToQuery(query, 'col2', 'col2', null, true);
      expect(query.sortParams.length).toBe(1);
      expect(query.sortParams[0].columnId).toBe('col1');
      expect(query.sortParams[0].index).toBe(0);
    });

    it('applies and clears filter params per columnId while maintaining other filters', () => {
      let query: BGridDataQuery = { sortParams: [], filterParams: [] };

      query = applyFilterToQuery(query, {
        columnId: 'col1',
        key: 'col1',
        type: 'text',
        operator: 'contains',
        value: 'hello',
      });

      query = applyFilterToQuery(query, {
        columnId: 'col2',
        key: 'col2',
        type: 'values',
        values: ['A', 'B'],
      });

      expect(query.filterParams.length).toBe(2);

      // Update col1
      query = applyFilterToQuery(query, {
        columnId: 'col1',
        key: 'col1',
        type: 'text',
        operator: 'equals',
        value: 'world',
      });
      expect(query.filterParams.length).toBe(2);
      expect(query.filterParams.find(f => f.columnId === 'col1')?.type).toBe('text');

      // Clear col1
      query = clearFilterFromQuery(query, 'col1');
      expect(query.filterParams.length).toBe(1);
      expect(query.filterParams[0].columnId).toBe('col2');
    });

    it('sanitizes empty text and invalid filters', () => {
      let query: BGridDataQuery = { sortParams: [], filterParams: [] };

      query = applyFilterToQuery(query, {
        columnId: 'col1',
        key: 'col1',
        type: 'text',
        operator: 'contains',
        value: '   ', // whitespace only
      });
      expect(query.filterParams.length).toBe(0);

      query = applyFilterToQuery(query, {
        columnId: 'col2',
        key: 'col2',
        type: 'values',
        values: [],
      });
      expect(query.filterParams.length).toBe(0);
    });
  });

  describe('filterData rules', () => {
    const mockCol = (key: string | string[], filter?: any): BGridColumn<any> => ({
      key,
      label: String(key),
      width: 100,
      filter,
    });

    it('matches text filter with caseSensitive option and null/undefined handling', () => {
      const colCaseInsensitive = mockCol('name');
      const colCaseSensitive = mockCol('name', { caseSensitive: true });

      const row1: BGridDataItem<any> = { values: { name: 'Korea' } };
      const row2: BGridDataItem<any> = { values: { name: null } };
      const row3: BGridDataItem<any> = { values: { name: undefined } };

      const filterContains: BGridFilterParam = {
        columnId: 'name',
        key: 'name',
        type: 'text',
        operator: 'contains',
        value: 'kor',
      };

      expect(matchColumnFilter(row1, colCaseInsensitive, filterContains)).toBe(true);
      expect(matchColumnFilter(row1, colCaseSensitive, filterContains)).toBe(false);
      expect(matchColumnFilter(row2, colCaseInsensitive, filterContains)).toBe(false);
      expect(matchColumnFilter(row3, colCaseInsensitive, filterContains)).toBe(false);

      const filterEqualsEmpty: BGridFilterParam = {
        columnId: 'name',
        key: 'name',
        type: 'text',
        operator: 'equals',
        value: 'korea',
      };
      expect(matchColumnFilter(row1, colCaseInsensitive, filterEqualsEmpty)).toBe(true);
    });

    it('matches number filter with operators and between', () => {
      const col = mockCol('age');
      const rowValid: BGridDataItem<any> = { values: { age: 25 } };
      const rowStringNum: BGridDataItem<any> = { values: { age: ' 30 ' } };
      const rowInvalid: BGridDataItem<any> = { values: { age: 'abc' } };
      const rowNil: BGridDataItem<any> = { values: { age: null } };

      expect(
        matchColumnFilter(rowValid, col, {
          columnId: 'age',
          key: 'age',
          type: 'number',
          operator: 'gt',
          value: 20,
        }),
      ).toBe(true);

      expect(
        matchColumnFilter(rowStringNum, col, {
          columnId: 'age',
          key: 'age',
          type: 'number',
          operator: 'gte',
          value: 30,
        }),
      ).toBe(true);

      expect(
        matchColumnFilter(rowInvalid, col, {
          columnId: 'age',
          key: 'age',
          type: 'number',
          operator: 'gt',
          value: 10,
        }),
      ).toBe(false);

      expect(
        matchColumnFilter(rowNil, col, {
          columnId: 'age',
          key: 'age',
          type: 'number',
          operator: 'lt',
          value: 100,
        }),
      ).toBe(false);

      // between
      expect(
        matchColumnFilter(rowValid, col, {
          columnId: 'age',
          key: 'age',
          type: 'number',
          operator: 'between',
          min: 20,
          max: 30,
        }),
      ).toBe(true);

      expect(
        matchColumnFilter(rowValid, col, {
          columnId: 'age',
          key: 'age',
          type: 'number',
          operator: 'between',
          min: 30,
          max: 40,
        }),
      ).toBe(false);
    });

    it('matches values filter with undefined/null normalization', () => {
      const col = mockCol('status');
      const row1: BGridDataItem<any> = { values: { status: 'active' } };
      const row2: BGridDataItem<any> = { values: { status: null } };
      const row3: BGridDataItem<any> = { values: { status: undefined } };

      const filterActive: BGridFilterParam = {
        columnId: 'status',
        key: 'status',
        type: 'values',
        values: ['active', 'pending'],
      };

      const filterNil: BGridFilterParam = {
        columnId: 'status',
        key: 'status',
        type: 'values',
        values: [null],
      };

      expect(matchColumnFilter(row1, col, filterActive)).toBe(true);
      expect(matchColumnFilter(row2, col, filterActive)).toBe(false);
      expect(matchColumnFilter(row2, col, filterNil)).toBe(true);
      expect(matchColumnFilter(row3, col, filterNil)).toBe(true); // undefined normalized to null
    });

    it('matches Date values through their public ISO-string representation', () => {
      const col = mockCol('createdAt');
      const createdAt = new Date('2026-08-17T03:00:00.000Z');
      const row: BGridDataItem<any> = { values: { createdAt } };
      const filter: BGridFilterParam = {
        columnId: 'createdAt',
        key: 'createdAt',
        type: 'values',
        values: ['2026-08-17T03:00:00.000Z'],
      };

      expect(matchColumnFilter(row, col, filter)).toBe(true);
    });

    it('handles custom predicate safely with error logging', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const colWithError = mockCol('data', {
        predicate: () => {
          throw new Error('Custom predicate failure');
        },
      });

      const row: BGridDataItem<any> = { values: { data: 'test' } };
      const filter: BGridFilterParam = { columnId: 'data', key: 'data', type: 'values', values: ['test'] };

      expect(matchColumnFilter(row, colWithError, filter)).toBe(false);
      expect(warnSpy).toHaveBeenCalled();
      warnSpy.mockRestore();
    });
  });

  describe('processDataQuery pipeline', () => {
    const columns: BGridColumn<any>[] = [
      { key: 'name', label: 'Name', width: 100 },
      { key: 'score', label: 'Score', width: 100 },
      { key: ['meta', 'group'], label: 'Group', width: 100 },
    ];

    const data: BGridDataItem<any>[] = [
      { values: { id: 1, name: 'Charlie', score: 80, meta: { group: 'A' } } },
      { values: { id: 2, name: 'Alice', score: 95, meta: { group: 'B' } } },
      { values: { id: 3, name: 'Bob', score: null, meta: { group: 'A' } } },
      { values: { id: 4, name: 'David', score: 80, meta: { group: 'B' } } },
      { values: { id: 5, name: 'Eve', score: 95, meta: { group: 'A' } } },
    ];

    it('filters rows across multiple columns (AND) and maps source indices accurately', () => {
      const query: BGridDataQuery = {
        sortParams: [],
        filterParams: [
          {
            columnId: 'key:array:["meta","group"]',
            key: ['meta', 'group'],
            type: 'values',
            values: ['A'],
          },
          {
            columnId: 'key:string:score',
            key: 'score',
            type: 'number',
            operator: 'gte',
            value: 80,
          },
        ],
      };

      const result = processDataQuery({
        data,
        columns,
        query,
        rowKey: 'id',
      });

      // Filtered rows: Charlie (idx 0), Eve (idx 4)
      expect(result.rows.length).toBe(2);
      expect(result.rows[0].sourceIndex).toBe(0);
      expect(result.rows[0].item.values.name).toBe('Charlie');
      expect(result.rows[0].rowKey).toBe(1);

      expect(result.rows[1].sourceIndex).toBe(4);
      expect(result.rows[1].item.values.name).toBe('Eve');
      expect(result.rows[1].rowKey).toBe(5);

      expect(result.sourceIndexByVisibleIndex).toEqual([0, 4]);
      expect(result.visibleIndexBySourceIndex.get(0)).toBe(0);
      expect(result.visibleIndexBySourceIndex.get(4)).toBe(1);
      expect(result.visibleIndexBySourceIndex.get(1)).toBeUndefined();
    });

    it('performs stable multi-sort with null-last preserved in descending order', () => {
      const query: BGridDataQuery = {
        sortParams: [
          {
            columnId: 'key:string:score',
            key: 'score',
            index: 0,
            orderBy: 'desc',
          },
          {
            columnId: 'key:string:name',
            key: 'name',
            index: 1,
            orderBy: 'asc',
          },
        ],
        filterParams: [],
      };

      const result = processDataQuery({
        data,
        columns,
        query,
        rowKey: 'id',
      });

      // Expected sorted order:
      // Score 95: Alice (idx 1), Eve (idx 4) -> Eve (idx 4, name 'Eve') vs Alice (idx 1, name 'Alice') -> Alice, Eve
      // Score 80: Charlie (idx 0), David (idx 3) -> Charlie, David
      // Score null: Bob (idx 2) - null-last at bottom!
      const names = result.rows.map(r => r.item.values.name);
      expect(names).toEqual(['Alice', 'Eve', 'Charlie', 'David', 'Bob']);

      // Check Bob with null score is strictly at last index
      expect(result.rows[4].item.values.name).toBe('Bob');
    });

    it('respects sortComparator with desc direction and null-last policy', () => {
      const customColumns: BGridColumn<any>[] = [
        {
          key: 'score',
          label: 'Score',
          width: 100,
          sortComparator: (a, b) => {
            // Custom comparator comparing absolute differences from 85
            const diffA = Math.abs(Number(a) - 85);
            const diffB = Math.abs(Number(b) - 85);
            return diffA - diffB;
          },
        },
        { key: 'name', label: 'Name', width: 100 },
      ];

      // Ascending custom sort
      const ascQuery: BGridDataQuery = {
        sortParams: [{ columnId: 'key:string:score', key: 'score', index: 0, orderBy: 'asc' }],
        filterParams: [],
      };
      const ascResult = processDataQuery({
        data,
        columns: customColumns,
        query: ascQuery,
        rowKey: 'id',
      });
      // Charlie(80->diff 5), David(80->diff 5), Alice(95->diff 10), Eve(95->diff 10), Bob(null->last)
      expect(ascResult.rows.map(r => r.item.values.score)).toEqual([80, 80, 95, 95, null]);

      // Descending custom sort
      const descQuery: BGridDataQuery = {
        sortParams: [{ columnId: 'key:string:score', key: 'score', index: 0, orderBy: 'desc' }],
        filterParams: [],
      };
      const descResult = processDataQuery({
        data,
        columns: customColumns,
        query: descQuery,
        rowKey: 'id',
      });
      // Descending reverses non-null elements while keeping null at the end!
      expect(descResult.rows.map(r => r.item.values.score)).toEqual([95, 95, 80, 80, null]);
    });

    it('extracts each sort key once and can skip unused processed-row metadata', () => {
      let sortValueReads = 0;
      const largeData = Array.from(
        { length: 100 },
        (_, index): BGridDataItem<any> => ({
          values: {
            id: index,
            get score() {
              sortValueReads += 1;
              return (index * 37) % 100;
            },
          },
        }),
      );

      const result = processDataQuery({
        data: largeData,
        columns: [{ key: 'score', label: 'Score', width: 100 }],
        query: {
          sortParams: [{ columnId: 'key:string:score', key: 'score', index: 0, orderBy: 'asc' }],
          filterParams: [],
        },
        rowKey: 'id',
        includeRows: false,
      });

      expect(sortValueReads).toBe(largeData.length);
      expect(result.rows).toEqual([]);
      expect(result.data[0].values.score).toBe(0);
      expect(result.sourceIndexByVisibleIndex).toHaveLength(largeData.length);
      expect(result.visibleIndexBySourceIndex.size).toBe(largeData.length);
    });

    it('preserves input data immutability', () => {
      const copyData = JSON.parse(JSON.stringify(data));
      const query: BGridDataQuery = {
        sortParams: [{ columnId: 'key:string:score', key: 'score', index: 0, orderBy: 'asc' }],
        filterParams: [{ columnId: 'key:string:name', key: 'name', type: 'text', operator: 'contains', value: 'a' }],
      };

      processDataQuery({
        data,
        columns,
        query,
        rowKey: 'id',
      });

      expect(data).toEqual(copyData);
    });
  });
});
