import { describe, expect, it, vi } from 'vitest';
import { AppModelColumn, BGridDataItem } from '../beautiful-grid/types';
import {
  dedupeSearchMatches,
  findGridSearchMatches,
  findMatchingSearchResultIndex,
  normalizeSearchText,
} from '../beautiful-grid/utils/gridSearch';

interface Row {
  id: number;
  name: string;
  nested: { label: string };
  createdAt?: Date;
}

const columns: AppModelColumn<Row>[] = [
  { id: 'name', columnId: 'name', key: 'name', label: 'Name', width: 120, left: 0 },
  { id: 'nested', columnId: 'nested', key: ['nested', 'label'], label: 'Nested', width: 120, left: 120 },
  { id: 'created', columnId: 'created', key: 'createdAt', label: 'Created', width: 120, left: 240 },
];

const data: BGridDataItem<Row>[] = [
  { values: { id: 1, name: 'Apple', nested: { label: '서울' }, createdAt: new Date('2026-08-22T00:00:00Z') } },
  { values: { id: 2, name: 'Banana', nested: { label: '부산' } } },
];

describe('grid search utilities', () => {
  it('normalizes primitive, date and object values safely', () => {
    expect(normalizeSearchText(undefined)).toBe('');
    expect(normalizeSearchText(123)).toBe('123');
    expect(normalizeSearchText(new Date('2026-08-22T00:00:00Z'))).toBe('2026-08-22T00:00:00.000Z');
    expect(normalizeSearchText(new Date('invalid'))).toBe('Invalid Date');
    expect(normalizeSearchText({ ok: true })).toBe('{"ok":true}');
    const circular: any = {};
    circular.self = circular;
    expect(normalizeSearchText(circular)).toBe('[object Object]');
  });

  it('searches all loaded rows in row-major order with nested keys and source indexes', () => {
    expect(
      findGridSearchMatches({
        data,
        columns,
        sourceIndexByVisibleIndex: [7, 3],
        rowKey: 'id',
        query: '서',
      }),
    ).toEqual([
      expect.objectContaining({
        cell: { rowIndex: 0, columnIndex: 1 },
        visibleIndex: 0,
        sourceIndex: 7,
        rowKey: 1,
        columnId: 'nested',
      }),
    ]);

    expect(
      findGridSearchMatches({
        data,
        columns,
        sourceIndexByVisibleIndex: [7, 3],
        query: '2026-08-22',
      }),
    ).toHaveLength(1);
  });

  it('uses column search getters before grid getters and falls back after errors', () => {
    const onError = vi.fn();
    const customColumns: AppModelColumn<Row>[] = [
      {
        ...columns[0],
        getSearchText: ({ value }) => `column:${value}`,
      },
      {
        ...columns[1],
        getSearchText: () => {
          throw new Error('bad getter');
        },
      },
    ];

    expect(
      findGridSearchMatches({
        data,
        columns: customColumns,
        sourceIndexByVisibleIndex: [0, 1],
        query: 'column:apple',
        searchOptions: { getSearchText: () => 'grid-value' },
        onGetSearchTextError: onError,
      }),
    ).toHaveLength(1);

    expect(
      findGridSearchMatches({
        data,
        columns: customColumns,
        sourceIndexByVisibleIndex: [0, 1],
        query: '서울',
        onGetSearchTextError: onError,
      }),
    ).toHaveLength(1);
    expect(onError).toHaveBeenCalledWith('nested', expect.any(Error));
  });

  it('skips non-searchable columns and deduplicates merged logical cells', () => {
    const mergedData: BGridDataItem<Row>[] = [
      { values: { id: 1, name: 'Same', nested: { label: 'A' } } },
      { values: { id: 2, name: 'Same', nested: { label: 'B' } } },
    ];
    const mergedColumns = [{ ...columns[0] }, { ...columns[1], searchable: false }];
    const matches = findGridSearchMatches({
      data: mergedData,
      columns: mergedColumns,
      sourceIndexByVisibleIndex: [0, 1],
      query: 'same',
      cellMergeOptions: { columnsMap: { 0: { mergeBy: 'name' } } },
    });
    expect(matches).toHaveLength(1);
    expect(matches[0].cell).toEqual({ rowIndex: 0, columnIndex: 0 });
  });

  it('deduplicates chunk results and preserves the active result by identity', () => {
    const first = {
      cell: { rowIndex: 0, columnIndex: 0 },
      visibleIndex: 0,
      sourceIndex: 4,
      rowKey: 'row-4',
      columnIndex: 0,
      columnId: 'name',
    };
    const second = {
      ...first,
      cell: { rowIndex: 1, columnIndex: 0 },
      visibleIndex: 1,
      sourceIndex: 5,
      rowKey: 'row-5',
    };
    expect(dedupeSearchMatches([first, first, second])).toEqual([first, second]);
    expect(findMatchingSearchResultIndex([second, first], first)).toBe(1);
    expect(findMatchingSearchResultIndex([first], { ...second, sourceIndex: 99, rowKey: 'missing' }, 4)).toBe(0);
  });
});
