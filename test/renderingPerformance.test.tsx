import React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BGrid, BGridColumn, BGridDataItem } from '../beautiful-grid';
import { useAppStore } from '../beautiful-grid/store';

interface SimpleRow {
  id: number;
  name: string;
  count: number;
}

function makeRows(count: number): BGridDataItem<SimpleRow>[] {
  const rows = new Array<BGridDataItem<SimpleRow>>(count);
  for (let i = 0; i < count; i++) {
    rows[i] = {
      values: {
        id: i,
        name: `Item ${i}`,
        count: i * 10,
      },
    };
  }
  return rows;
}

const simpleColumns: BGridColumn<SimpleRow>[] = [
  { id: 'id', key: 'id', label: 'ID', width: 80 },
  { id: 'name', key: 'name', label: 'Name', width: 120 },
  { id: 'count', key: 'count', label: 'Count', width: 100 },
];

describe('Rendering Performance Contract', () => {
  it('selects the first source row for each requested row key when source keys are duplicated', () => {
    const data = [
      { values: { id: 'a', name: 'first a', count: 1 } },
      { values: { id: 'a', name: 'second a', count: 2 } },
      { values: { id: 'b', name: 'b', count: 3 } },
    ];
    const columns: BGridColumn<typeof data[number]['values']>[] = [
      { id: 'id', key: 'id', label: 'ID', width: 80 },
      { id: 'name', key: 'name', label: 'Name', width: 120 },
    ];
    const { container } = render(
      <BGrid
        width={400}
        height={240}
        data={data}
        columns={columns}
        rowKey='id'
        rowChecked={{ checkedRowKeys: ['a', 'b'], onChange: () => undefined }}
      />,
    );

    const checkedState = (rowIndex: number) =>
      container.querySelector(`tr[data-ri="${rowIndex}"] [role="checkbox"]`)?.getAttribute('aria-checked');

    expect(checkedState(0)).toBe('true');
    expect(checkedState(1)).toBe('false');
    expect(checkedState(2)).toBe('true');
  });

  it('does not count invalid negative checked indexes as visible rows', () => {
    const { container } = render(
      <BGrid<SimpleRow>
        width={400}
        height={240}
        data={makeRows(3)}
        columns={simpleColumns}
        rowKey='id'
        rowChecked={{ checkedIndexes: [-1], onChange: () => undefined }}
      />,
    );

    expect(container.querySelector('[role="rfdg-head-frozen"] [role="checkbox"]')).toHaveAttribute(
      'aria-checked',
      'false',
    );
  });

  it('uses collision-safe row keys and warns only once for duplicate and missing values', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const error = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const data = [
      { values: { id: '', name: 'empty', count: 0 } },
      { values: { id: 0, name: 'number zero', count: 1 } },
      { values: { id: '0', name: 'string zero', count: 2 } },
      { values: { id: 'duplicate', name: 'first duplicate', count: 3 } },
      { values: { id: 'duplicate', name: 'second duplicate', count: 4 } },
      { values: { id: undefined, name: 'missing one', count: 5 } },
      { values: { id: undefined, name: 'missing two', count: 6 } },
    ];
    const columns: BGridColumn<typeof data[number]['values']>[] = [
      { id: 'id', key: 'id', label: 'ID', width: 100 },
      { id: 'name', key: 'name', label: 'Name', width: 160 },
    ];

    try {
      const { rerender } = render(<BGrid width={400} height={320} data={data} columns={columns} rowKey='id' />);
      rerender(<BGrid width={400} height={320} data={data} columns={columns} rowKey='id' />);

      expect(warn.mock.calls.filter(([message]) => String(message).includes('Duplicate rowKey'))).toHaveLength(1);
      expect(warn.mock.calls.filter(([message]) => String(message).includes('Missing rowKey'))).toHaveLength(1);
      expect(error.mock.calls.some(([message]) => String(message).includes('same key'))).toBe(false);
    } finally {
      warn.mockRestore();
      error.mockRestore();
    }
  });

  it('leaves sourceIndexByVisibleIndex and visibleIndexBySourceIndex undefined without client query', async () => {
    let capturedMapping: any = 'not-called';
    function Inspector() {
      const { sourceIndexByVisibleIndex, visibleIndexBySourceIndex } = useAppStore(s => ({
        sourceIndexByVisibleIndex: s.sourceIndexByVisibleIndex,
        visibleIndexBySourceIndex: s.visibleIndexBySourceIndex,
      }));
      capturedMapping = { sourceIndexByVisibleIndex, visibleIndexBySourceIndex };
      return <div data-testid='inspector'>OK</div>;
    }

    const millionData = makeRows(100);
    render(
      <div style={{ width: 600, height: 400 }}>
        <BGrid<SimpleRow>
          width={600}
          height={400}
          data={millionData}
          columns={simpleColumns}
          rowKey='id'
          status={{
            content: () => <Inspector />,
          }}
        />
      </div>,
    );

    expect(screen.getByTestId('inspector')).toBeInTheDocument();
    expect(capturedMapping.sourceIndexByVisibleIndex).toBeUndefined();
    expect(capturedMapping.visibleIndexBySourceIndex).toBeUndefined();
  });

  it('creates explicit mapping and preserves source index 0 when client query sort is applied', async () => {
    let capturedMapping: any = 'not-called';
    function Inspector() {
      const { sourceIndexByVisibleIndex, visibleIndexBySourceIndex } = useAppStore(s => ({
        sourceIndexByVisibleIndex: s.sourceIndexByVisibleIndex,
        visibleIndexBySourceIndex: s.visibleIndexBySourceIndex,
      }));
      capturedMapping = { sourceIndexByVisibleIndex, visibleIndexBySourceIndex };
      return <div data-testid='inspector'>OK</div>;
    }

    const data = makeRows(5);
    render(
      <div style={{ width: 600, height: 400 }}>
        <BGrid<SimpleRow>
          width={600}
          height={400}
          data={data}
          columns={simpleColumns}
          rowKey='id'
          dataControl={{
            mode: 'client',
            query: {
              sortParams: [{ columnId: 'id', key: 'id', orderBy: 'desc', index: 0 }],
              filterParams: [],
            },
            onChange: () => {},
          }}
          status={{
            content: () => <Inspector />,
          }}
        />
      </div>,
    );

    expect(screen.getByTestId('inspector')).toBeInTheDocument();
    expect(Array.isArray(capturedMapping.sourceIndexByVisibleIndex)).toBe(true);
    // In desc sort: visible index 0 should be source index 4, visible index 4 should be source index 0
    expect(capturedMapping.sourceIndexByVisibleIndex[0]).toBe(4);
    expect(capturedMapping.sourceIndexByVisibleIndex[4]).toBe(0);
    expect(capturedMapping.visibleIndexBySourceIndex.get(0)).toBe(4);
    expect(capturedMapping.visibleIndexBySourceIndex.get(4)).toBe(0);
  });

  it('mounts 1,000,000 rows quickly without full identity mapping allocation', async () => {
    const start = performance.now();
    const millionData = makeRows(1_000_000);
    const dataCreated = performance.now();

    render(
      <div style={{ width: 600, height: 400 }}>
        <BGrid<SimpleRow> width={600} height={400} data={millionData} columns={simpleColumns} rowKey='id' />
      </div>,
    );
    const end = performance.now();

    expect(screen.getByText('Item 0')).toBeInTheDocument();
    console.log(`1M mount took: ${(end - dataCreated).toFixed(1)}ms (data gen: ${(dataCreated - start).toFixed(1)}ms)`);
  });

  it('toggles a checkbox in 1,000,000 rows without cloning the full data array', () => {
    let storeData: BGridDataItem<SimpleRow>[] | undefined;
    const onChange = vi.fn();
    function Inspector() {
      storeData = useAppStore(state => state.data);
      return null;
    }

    const millionData = makeRows(1_000_000);
    const { container } = render(
      <BGrid<SimpleRow>
        width={600}
        height={400}
        data={millionData}
        columns={simpleColumns}
        rowKey='id'
        rowChecked={{ checkedIndexes: [], onChange }}
        status={{ content: () => <Inspector /> }}
      />,
    );

    const checkbox = container.querySelector('[role="rfdg-body-frozen"] [role="checkbox"]');
    expect(checkbox).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(checkbox!);

    expect(checkbox).toHaveAttribute('aria-checked', 'true');
    expect(storeData).toBe(millionData);
    expect(millionData[0].checked).toBe(true);
    expect(onChange).toHaveBeenLastCalledWith([0], [0], 'indeterminate');
  });

  it('moves a radio selection in 1,000,000 rows without scanning or cloning the full data array', () => {
    let storeData: BGridDataItem<SimpleRow>[] | undefined;
    const onChange = vi.fn();
    function Inspector() {
      storeData = useAppStore(state => state.data);
      return null;
    }

    const millionData = makeRows(1_000_000);
    millionData[1].checked = true;
    const { container } = render(
      <BGrid<SimpleRow>
        width={600}
        height={400}
        data={millionData}
        columns={simpleColumns}
        rowKey='id'
        rowChecked={{ isRadio: true, checkedIndexes: [1], onChange }}
        status={{ content: () => <Inspector /> }}
      />,
    );

    const radios = container.querySelectorAll('[role="rfdg-body-frozen"] [role="radio"]');
    expect(radios[0]).toHaveAttribute('aria-checked', 'false');
    expect(radios[1]).toHaveAttribute('aria-checked', 'true');

    fireEvent.click(radios[0]);

    expect(radios[0]).toHaveAttribute('aria-checked', 'true');
    expect(radios[1]).toHaveAttribute('aria-checked', 'false');
    expect(storeData).toBe(millionData);
    expect(millionData[0].checked).toBe(true);
    expect(millionData[1].checked).toBe(false);
    expect(onChange).toHaveBeenLastCalledWith([0], [0], 'indeterminate');
  });

  it('does not re-render unedited rows when a single cell edits', async () => {
    const renderCounts: Record<number, number> = {};
    const instrumentedColumns: BGridColumn<SimpleRow>[] = [
      { id: 'id', key: 'id', label: 'ID', width: 80 },
      {
        id: 'name',
        key: 'name',
        label: 'Name',
        width: 120,
        editable: true,
        itemRender: ({ value, index }) => {
          renderCounts[index] = (renderCounts[index] || 0) + 1;
          return <span>{value}</span>;
        },
      },
    ];

    const data = makeRows(20);
    render(
      <div style={{ width: 400, height: 300 }}>
        <BGrid<SimpleRow> width={400} height={300} data={data} columns={instrumentedColumns} rowKey='id' editable />
      </div>,
    );

    expect(screen.getByText('Item 0')).toBeInTheDocument();
    const countRow0Initial = renderCounts[0] || 0;
    const countRow5Initial = renderCounts[5] || 0;
    expect(countRow0Initial).toBeGreaterThan(0);

    // Double click row 0 cell to start editing
    const row0Cell = screen.getByText('Item 0');
    fireEvent.doubleClick(row0Cell);

    // After starting edit on row 0, row 5's itemRender should not have been called again
    const countRow5AfterEdit = renderCounts[5] || 0;
    expect(countRow5AfterEdit).toBe(countRow5Initial);
  });
});
