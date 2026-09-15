import { describe, it, expect } from 'vitest';
import {
  createGridExportData,
  resolveExportColumns,
} from '../beautiful-grid/utils/exportData';
import { BGridColumn, BGridDataItem } from '../beautiful-grid/types';
import { createPivotData } from '../beautiful-grid/utils/createPivotData';

interface TestRow {
  id: string;
  name: string;
  category: string;
  amount: number;
  meta?: {
    tag?: string;
    details?: {
      code: string;
    };
  };
}

describe('exportData utility', () => {
  const baseColumns: BGridColumn<TestRow>[] = [
    { id: 'id', key: 'id', label: 'ID', width: 80 },
    { id: 'name', key: 'name', label: 'Name', width: 120 },
    { id: 'category', key: 'category', label: 'Category', width: 100 },
    { id: 'amount', key: 'amount', label: 'Amount', width: 100 },
  ];

  const baseData: BGridDataItem<TestRow>[] = [
    { values: { id: '1', name: 'Alice', category: 'A', amount: 100 } },
    { values: { id: '2', name: 'Bob', category: 'B', amount: 200 } },
    { values: { id: '3', name: 'Charlie', category: 'A', amount: 300 } },
  ];

  it('exports displayed rows with default options (visible columns and displayed rows)', () => {
    const result = createGridExportData({
      columns: baseColumns,
      data: baseData,
      sourceData: baseData,
      rowKey: 'id',
    });

    expect(result.columns.map(c => c.header)).toEqual(['ID', 'Name', 'Category', 'Amount']);
    expect(result.rows).toHaveLength(3);
    expect(result.rows[0].cells).toEqual(['1', 'Alice', 'A', 100]);
    expect(result.rows[0].visibleIndex).toBe(0);
    expect(result.rows[0].sourceIndex).toBe(0);
    expect(result.rows[0].rowKey).toBe('1');
    expect(result.rows[2].cells).toEqual(['3', 'Charlie', 'A', 300]);
  });

  it('supports nested dot-path keys in columns', () => {
    const columnsWithNested: BGridColumn<TestRow>[] = [
      { id: 'id', key: 'id', label: 'ID', width: 80 },
      { id: 'tag', key: ['meta', 'tag'], label: 'Tag', width: 100 },
      { id: 'code', key: ['meta', 'details', 'code'], label: 'Code', width: 100 },
    ];
    const dataWithNested: BGridDataItem<TestRow>[] = [
      {
        values: {
          id: '1',
          name: 'Alice',
          category: 'A',
          amount: 100,
          meta: { tag: 'VIP', details: { code: 'VIP-01' } },
        },
      },
    ];

    const result = createGridExportData({
      columns: columnsWithNested,
      data: dataWithNested,
      sourceData: dataWithNested,
      rowKey: 'id',
    });

    expect(result.rows[0].cells).toEqual(['1', 'VIP', 'VIP-01']);
  });

  it('resolves exportHeader via function, string, label string, or columnId fallback', () => {
    const columns: BGridColumn<TestRow>[] = [
      { id: 'c1', key: 'id', label: 'Default Label', width: 100 },
      { id: 'c2', key: 'name', label: 'Ignored', exportHeader: 'Custom Header', width: 100 },
      {
        id: 'c3',
        key: 'amount',
        label: 'Ignored',
        exportHeader: col => `Fn Header (${col.id})`,
        width: 100,
      },
      { id: 'c4', key: 'category', label: null as any, width: 100 },
    ];

    const result = resolveExportColumns(columns);
    expect(result.map(c => c.header)).toEqual([
      'Default Label',
      'Custom Header',
      'Fn Header (c3)',
      'c4',
    ]);
  });

  it('transforms cell value using column.getExportValue', () => {
    const columns: BGridColumn<TestRow>[] = [
      { id: 'id', key: 'id', label: 'ID', width: 80 },
      {
        id: 'amount',
        key: 'amount',
        label: 'Amount',
        width: 100,
        getExportValue: ({ value, item, sourceIndex, visibleIndex }) =>
          `$${Number(value).toFixed(2)} (row ${visibleIndex}:${sourceIndex})`,
      },
    ];

    const result = createGridExportData({
      columns,
      data: baseData,
      sourceData: baseData,
      sourceIndexByVisibleIndex: [2, 0, 1], // rearranged
    });

    expect(result.rows[0].cells[1]).toBe('$100.00 (row 0:2)');
  });

  it('excludes columns with exportable: false across visible, all, and explicit column scopes', () => {
    const columnsWithNonExportable: BGridColumn<TestRow>[] = [
      { id: 'id', key: 'id', label: 'ID', width: 80 },
      { id: 'actions', key: 'id', label: 'Actions', exportable: false, width: 80 },
      { id: 'name', key: 'name', label: 'Name', width: 120 },
    ];

    const visibleRes = createGridExportData({
      columns: columnsWithNonExportable,
      data: baseData,
      options: { columns: 'visible' },
    });
    expect(visibleRes.columns.map(c => c.columnId)).toEqual(['id', 'name']);

    const allRes = createGridExportData({
      columns: columnsWithNonExportable,
      sourceColumns: columnsWithNonExportable,
      data: baseData,
      options: { columns: 'all' },
    });
    expect(allRes.columns.map(c => c.columnId)).toEqual(['id', 'name']);

    const explicitRes = createGridExportData({
      columns: columnsWithNonExportable,
      sourceColumns: columnsWithNonExportable,
      data: baseData,
      options: { columns: ['id', 'actions', 'name'] },
    });
    expect(explicitRes.columns.map(c => c.columnId)).toEqual(['id', 'name']);
  });

  it('respects specific column IDs in exact order and ignores non-existent IDs', () => {
    const result = createGridExportData({
      columns: baseColumns,
      sourceColumns: baseColumns,
      data: baseData,
      options: { columns: ['amount', 'nonExistent', 'id'] },
    });

    expect(result.columns.map(c => c.columnId)).toEqual(['amount', 'id']);
    expect(result.rows[0].cells).toEqual([100, '1']);
  });

  it('supports columns: all to include hidden columns from sourceColumns', () => {
    const visibleColumns = [baseColumns[0], baseColumns[1]]; // id, name
    const sourceColumns = baseColumns; // id, name, category, amount

    const result = createGridExportData({
      columns: visibleColumns,
      sourceColumns,
      data: baseData,
      options: { columns: 'all' },
    });

    expect(result.columns.map(c => c.columnId)).toEqual(['id', 'name', 'category', 'amount']);
    expect(result.rows[0].cells).toEqual(['1', 'Alice', 'A', 100]);
  });

  it('exports checked rows in sourceData order, including rows filtered out from display', () => {
    // sourceData has 3 rows: indices 0, 1, 2
    // displayData only has row 1 (filtered)
    const displayData = [baseData[1]];
    const checkedIndexesMap = new Map<number, any>([
      [0, true],
      [2, true],
    ]);

    const result = createGridExportData({
      columns: baseColumns,
      data: displayData,
      sourceData: baseData,
      checkedIndexesMap,
      sourceIndexByVisibleIndex: [1],
      visibleIndexBySourceIndex: new Map([[1, 0]]),
      options: { rows: 'checked' },
    });

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].sourceIndex).toBe(0);
    expect(result.rows[0].cells[1]).toBe('Alice');
    expect(result.rows[0].visibleIndex).toBeUndefined(); // filtered out
    expect(result.rows[1].sourceIndex).toBe(2);
    expect(result.rows[1].cells[1]).toBe('Charlie');
  });

  it('exports all loaded sourceData rows when rows: source is specified', () => {
    const displayData = [baseData[0]]; // filtered
    const result = createGridExportData({
      columns: baseColumns,
      data: displayData,
      sourceData: baseData,
      options: { rows: 'source' },
    });

    expect(result.rows).toHaveLength(3);
    expect(result.rows.map(r => r.sourceIndex)).toEqual([0, 1, 2]);
  });

  it('reflects client-side filter results when rows: displayed', () => {
    // Only rows matching category 'A'
    const filteredDisplayData = [baseData[0], baseData[2]];
    const sourceIndexByVisibleIndex = [0, 2];

    const result = createGridExportData({
      columns: baseColumns,
      data: filteredDisplayData,
      sourceData: baseData,
      sourceIndexByVisibleIndex,
      options: { rows: 'displayed' },
    });

    expect(result.rows).toHaveLength(2);
    expect(result.rows[0].cells[1]).toBe('Alice');
    expect(result.rows[0].sourceIndex).toBe(0);
    expect(result.rows[1].cells[1]).toBe('Charlie');
    expect(result.rows[1].sourceIndex).toBe(2);
  });

  it('reflects sort order in displayed rows', () => {
    // Sorted by name descending: Charlie (source 2), Bob (source 1), Alice (source 0)
    const sortedDisplayData = [baseData[2], baseData[1], baseData[0]];
    const sourceIndexByVisibleIndex = [2, 1, 0];

    const result = createGridExportData({
      columns: baseColumns,
      data: sortedDisplayData,
      sourceData: baseData,
      sourceIndexByVisibleIndex,
      options: { rows: 'displayed' },
    });

    expect(result.rows.map(r => r.cells[1])).toEqual(['Charlie', 'Bob', 'Alice']);
    expect(result.rows.map(r => r.sourceIndex)).toEqual([2, 1, 0]);
  });

  it('exports only expanded visible rows in tree projection for displayed rows, and full loaded source for source rows', () => {
    // Tree: root with 2 children, 1 collapsed
    const treeSourceData: BGridDataItem<any>[] = [
      { values: { id: 'root', name: 'Root' } },
      { values: { id: 'c1', name: 'Child 1' } },
      { values: { id: 'c2', name: 'Child 2' } },
    ];
    // In display, c2 is collapsed
    const treeDisplayData = [treeSourceData[0], treeSourceData[1]];
    const sourceIndexByVisibleIndex = [0, 1];

    const displayedRes = createGridExportData({
      columns: [{ id: 'name', key: 'name', label: 'Name', width: 100 }],
      data: treeDisplayData,
      sourceData: treeSourceData,
      sourceIndexByVisibleIndex,
      options: { rows: 'displayed' },
    });
    expect(displayedRes.rows).toHaveLength(2);
    expect(displayedRes.rows.map(r => r.cells[0])).toEqual(['Root', 'Child 1']);

    const sourceRes = createGridExportData({
      columns: [{ id: 'name', key: 'name', label: 'Name', width: 100 }],
      data: treeDisplayData,
      sourceData: treeSourceData,
      options: { rows: 'source' },
    });
    expect(sourceRes.rows).toHaveLength(3);
    expect(sourceRes.rows.map(r => r.cells[0])).toEqual(['Root', 'Child 1', 'Child 2']);
  });

  it('exports generated pivot columns and display data when pivot mode is active', () => {
    const rawData = [
      { values: { region: 'East', product: 'Apple', sales: 10 } },
      { values: { region: 'East', product: 'Banana', sales: 20 } },
      { values: { region: 'West', product: 'Apple', sales: 30 } },
    ];

    const pivotResult = createPivotData({
      data: rawData,
      pivot: {
        rows: [{ key: 'region', label: 'Region' }],
        columns: [{ key: 'product', label: 'Product' }],
        values: [{ key: 'sales', label: 'Sales', aggregator: 'sum' }],
      },
    });

    expect(pivotResult).toBeDefined();
    if (!pivotResult) return;

    // In pivot, resolvedColumns == pivot columns, which is passed as both columns and sourceColumns
    const result = createGridExportData({
      columns: pivotResult.columns,
      sourceColumns: pivotResult.columns,
      data: pivotResult.data,
      options: { rows: 'displayed', columns: 'all' },
    });

    expect(result.columns.length).toBeGreaterThanOrEqual(2);
    expect(result.rows.length).toBe(2); // East, West
  });
});
