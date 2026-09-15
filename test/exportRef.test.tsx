import { fireEvent, render, waitFor } from '@testing-library/react';
import React, { createRef } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BGrid, BGridColumn, BGridDataItem, BGridRef } from '../beautiful-grid';

interface Item {
  id: number;
  name: string;
  category: string;
  price: number;
}

describe('BGridRef export API', () => {
  const columns: BGridColumn<Item>[] = [
    { id: 'id', key: 'id', label: 'ID', width: 80 },
    { id: 'name', key: 'name', label: 'Name', width: 120 },
    { id: 'category', key: 'category', label: 'Category', width: 100 },
    { id: 'price', key: 'price', label: 'Price', width: 100 },
  ];

  let originalCreateObjectURL: any;
  let originalRevokeObjectURL: any;

  beforeEach(() => {
    originalCreateObjectURL = window.URL.createObjectURL;
    originalRevokeObjectURL = window.URL.revokeObjectURL;
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:mock-url');
    window.URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    window.URL.createObjectURL = originalCreateObjectURL;
    window.URL.revokeObjectURL = originalRevokeObjectURL;
    vi.restoreAllMocks();
  });

  it('exports all 1000 rows even though the DOM is virtualized with only a subset of rows', () => {
    const ref = createRef<BGridRef<Item>>();
    const largeData: BGridDataItem<Item>[] = Array.from({ length: 1000 }, (_, index) => ({
      values: {
        id: index + 1,
        name: `Item ${index + 1}`,
        category: index % 2 === 0 ? 'Electronics' : 'Office',
        price: (index + 1) * 10,
      },
    }));

    const { container } = render(
      <BGrid<Item>
        ref={ref}
        width={600}
        height={300}
        columns={columns}
        data={largeData}
        rowKey='id'
      />,
    );

    expect(ref.current).toBeDefined();

    // Verify virtualization: DOM should not have all 1000 rows
    const domRows = container.querySelectorAll('tbody tr');
    expect(domRows.length).toBeLessThan(100);

    // But getExportData returns all 1000 logical rows!
    const exportResult = ref.current!.getExportData();
    expect(exportResult.rows).toHaveLength(1000);
    expect(exportResult.columns).toHaveLength(4);
    expect(exportResult.rows[0].cells).toEqual([1, 'Item 1', 'Electronics', 10]);
    expect(exportResult.rows[999].cells).toEqual([1000, 'Item 1000', 'Office', 10000]);
  });

  it('exports checked rows via ref', () => {
    const ref = createRef<BGridRef<Item>>();
    const data: BGridDataItem<Item>[] = [
      { values: { id: 1, name: 'Item 1', category: 'A', price: 10 } },
      { values: { id: 2, name: 'Item 2', category: 'B', price: 20 } },
      { values: { id: 3, name: 'Item 3', category: 'C', price: 30 } },
    ];

    render(
      <BGrid<Item>
        ref={ref}
        width={600}
        height={300}
        columns={columns}
        data={data}
        rowKey='id'
        rowChecked={{
          checkedRowKeys: [2],
          onChange: () => {},
        }}
      />,
    );

    const checkedResult = ref.current!.getExportData({ rows: 'checked' });
    expect(checkedResult.rows).toHaveLength(1);
    expect(checkedResult.rows[0].cells).toEqual([2, 'Item 2', 'B', 20]);
  });

  it('exports the latest internally checked rows when selection is uncontrolled', async () => {
    const ref = createRef<BGridRef<Item>>();
    const data: BGridDataItem<Item>[] = [
      { values: { id: 1, name: 'Item 1', category: 'A', price: 10 } },
      { values: { id: 2, name: 'Item 2', category: 'B', price: 20 } },
    ];
    const onChange = vi.fn();

    const { container } = render(
      <BGrid<Item>
        ref={ref}
        width={600}
        height={300}
        columns={columns}
        data={data}
        rowKey='id'
        rowChecked={{ onChange }}
      />,
    );

    const selectors = container.querySelectorAll('[role="checkbox"]');
    fireEvent.click(selectors[1]);
    await waitFor(() => expect(onChange).toHaveBeenCalled());

    const checkedResult = ref.current!.getExportData({ rows: 'checked' });
    expect(checkedResult.rows).toHaveLength(1);
    expect(checkedResult.rows[0].cells).toEqual([1, 'Item 1', 'A', 10]);
  });

  it('exports visible vs all columns when column visibility is configured', () => {
    const ref = createRef<BGridRef<Item>>();
    const data: BGridDataItem<Item>[] = [
      { values: { id: 1, name: 'Item 1', category: 'A', price: 10 } },
    ];

    render(
      <BGrid<Item>
        ref={ref}
        width={600}
        height={300}
        columns={columns}
        data={data}
        rowKey='id'
        columnVisibility={{
          defaultHiddenColumnIds: ['category'],
        }}
      />,
    );

    // Visible columns exclude category
    const visibleExport = ref.current!.getExportData({ columns: 'visible' });
    expect(visibleExport.columns.map(c => c.columnId)).toEqual(['id', 'name', 'price']);

    // All columns include category
    const allExport = ref.current!.getExportData({ columns: 'all' });
    expect(allExport.columns.map(c => c.columnId)).toEqual(['id', 'name', 'category', 'price']);
  });

  it('triggers CSV download when ref.current.exportCsv is called', () => {
    const ref = createRef<BGridRef<Item>>();
    const data: BGridDataItem<Item>[] = [
      { values: { id: 1, name: 'Item 1', category: 'A', price: 10 } },
    ];

    render(
      <BGrid<Item>
        ref={ref}
        width={600}
        height={300}
        columns={columns}
        data={data}
        rowKey='id'
      />,
    );

    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    ref.current!.exportCsv({ fileName: 'items.csv' });

    expect(appendChildSpy).toHaveBeenCalled();
    const anchor = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.tagName.toLowerCase()).toBe('a');
    expect(anchor.getAttribute('download')).toBe('items.csv');
  });

  it('triggers Excel download when ref.current.exportExcel is called', async () => {
    const ref = createRef<BGridRef<Item>>();
    const data: BGridDataItem<Item>[] = [
      { values: { id: 1, name: 'Item 1', category: 'A', price: 10 } },
    ];

    render(
      <BGrid<Item>
        ref={ref}
        width={600}
        height={300}
        columns={columns}
        data={data}
        rowKey='id'
      />,
    );

    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    ref.current!.exportExcel({ fileName: 'items.xlsx' });

    await vi.waitFor(() => {
      expect(appendChildSpy).toHaveBeenCalled();
    });
    const anchor = appendChildSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.tagName.toLowerCase()).toBe('a');
    expect(anchor.getAttribute('download')).toBe('items.xlsx');
  });
});
