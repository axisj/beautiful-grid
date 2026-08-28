import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Key, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BGrid, BGridColumn, BGridDataItemStatus, BGridProps, createPivotData } from '../beautiful-grid';
import Nav from '../components/Nav';

describe('Home', () => {
  it('renders a heading', async () => {
    render(<Nav currentPath={'/'} onNavigate={() => {}} />);

    expect(screen.getByRole('heading', { level: 1, name: 'beautiful-grid' })).toBeInTheDocument();
  });
});

describe('BGrid row selection', () => {
  interface Row {
    id?: number;
    name: string;
  }

  const columns: BGridColumn<Row>[] = [
    { key: 'id', label: 'ID', width: 100 },
    { key: 'name', label: 'Name', width: 100 },
  ];

  const data = [{ values: { id: 1, name: 'one' } }, { values: { id: 2, name: 'two' } }];

  it('clears active row styling when selectedRowKey becomes undefined', async () => {
    const { container, rerender } = render(
      <BGrid<Row> width={300} height={120} columns={columns} data={data} rowKey={'id'} selectedRowKey={1} />,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('tr.bgrid-row-active')).toHaveLength(1);
    });

    rerender(<BGrid<Row> width={300} height={120} columns={columns} data={data} rowKey={'id'} />);

    await waitFor(() => {
      expect(container.querySelectorAll('tr.bgrid-row-active')).toHaveLength(0);
    });
  });

  it('preserves scroll when a controlled radio selection recreates an equivalent empty filter query', async () => {
    const rows = Array.from({ length: 24 }, (_, index) => ({
      values: { id: index + 1, name: `row-${index + 1}` },
    }));

    function ControlledRadioGrid() {
      const [checkedRowKeys, setCheckedRowKeys] = useState<Key[]>([]);

      return (
        <BGrid<Row>
          width={300}
          height={160}
          columns={columns}
          data={rows}
          rowKey='id'
          rowChecked={{
            isRadio: true,
            checkedRowKeys,
            onChange: (_indexes, keys) => setCheckedRowKeys(keys),
          }}
          sort={{ sortParams: [], onChange: () => undefined }}
          showLineNumber
        />
      );
    }

    const { container } = render(<ControlledRadioGrid />);
    const cellA4 = container.querySelector(
      'td[data-bgrid-cell="true"][data-row-index="3"][data-column-index="0"]',
    ) as HTMLTableCellElement;
    const scrollContainer = container.querySelector("[role='rfdg-scroll-container']") as HTMLDivElement;

    fireEvent.pointerDown(cellA4, { button: 0 });
    scrollContainer.scrollTop = 250;
    fireEvent.scroll(scrollContainer);

    const row13Radio = await waitFor(() => {
      const radio = container.querySelector('tr[data-ri="12"] [role="radio"]');
      expect(radio).toBeInTheDocument();
      return radio as HTMLElement;
    });

    fireEvent.click(row13Radio);

    await waitFor(() => {
      expect(row13Radio).toHaveAttribute('aria-checked', 'true');
      expect(scrollContainer.scrollTop).toBe(250);
    });
  });
});

describe('BGrid empty state row', () => {
  it('uses the configured item height and padding', async () => {
    const emptyMessage = 'No rows available';
    render(
      <BGrid<{ id: number }>
        width={300}
        height={120}
        columns={[{ key: 'id', label: 'ID', width: 100 }]}
        data={[]}
        itemHeight={30}
        itemPadding={8}
        msg={{ emptyList: emptyMessage }}
      />,
    );

    const emptyRow = (await screen.findByText(emptyMessage)).closest('tr');

    expect(emptyRow).not.toBeNull();
    expect(emptyRow?.style.getPropertyValue('--bgrid-item-line-height')).toBe('30px');
    expect(emptyRow?.style.getPropertyValue('--bgrid-item-cell-height')).toBe('46px');
  });
});

describe('BGrid column resize', () => {
  interface Row {
    id: number;
    name: string;
    status: string;
  }

  const columns: BGridColumn<Row>[] = [
    { key: 'id', label: 'ID', width: 100 },
    { key: 'name', label: 'Name', width: 100 },
    { key: 'status', label: 'Status', width: 100 },
  ];

  const data = [
    { values: { id: 1, name: 'one', status: 'ready' } },
    { values: { id: 2, name: 'two', status: 'done' } },
  ];

  function createPointerEvent(type: string, pointerId: number, clientX: number, clientY = 0) {
    const event = new Event(type) as PointerEvent;

    Object.defineProperties(event, {
      pointerId: { value: pointerId },
      clientX: { value: clientX },
      clientY: { value: clientY },
      pageX: { value: clientX },
      pageY: { value: clientY },
    });

    return event;
  }

  function createMouseEvent(type: string, clientX: number, clientY = 0) {
    const event = new Event(type) as MouseEvent;

    Object.defineProperties(event, {
      clientX: { value: clientX },
      clientY: { value: clientY },
      pageX: { value: clientX },
      pageY: { value: clientY },
    });

    return event;
  }

  function setElementRect(element: Element, rect: Partial<DOMRect>) {
    element.getBoundingClientRect = vi.fn(() => ({
      x: rect.left ?? 0,
      y: rect.top ?? 0,
      left: rect.left ?? 0,
      top: rect.top ?? 0,
      right: rect.right ?? 0,
      bottom: rect.bottom ?? 0,
      width: rect.width ?? (rect.right ?? 0) - (rect.left ?? 0),
      height: rect.height ?? (rect.bottom ?? 0) - (rect.top ?? 0),
      toJSON: () => ({}),
    })) as any;
  }

  it('calls onChangeColumns while a pointer drag is still active', async () => {
    const onChangeColumns = vi.fn();
    const { container } = render(
      <BGrid<Row>
        width={400}
        height={140}
        columns={columns}
        data={data}
        onChangeColumns={onChangeColumns}
      />,
    );
    const headerCell = container.querySelector(
      "[role='rfdg-head'] [data-column-index='1']",
    ) as HTMLTableCellElement | null;
    const resizeHandle = headerCell?.querySelector('.bgrid-col-resizer-handle') as HTMLDivElement | null;

    expect(headerCell).toBeTruthy();
    expect(resizeHandle).toBeTruthy();
    setElementRect(headerCell as HTMLTableCellElement, {
      left: 100,
      top: 0,
      right: 200,
      bottom: 28,
      width: 100,
      height: 28,
    });

    act(() => {
      fireEvent.pointerDown(resizeHandle as HTMLDivElement, { pointerId: 13, clientX: 200, clientY: 14 });
      window.dispatchEvent(createPointerEvent('pointermove', 13, 260, 14));
    });

    await waitFor(() => {
      expect(onChangeColumns).toHaveBeenCalledWith(
        1,
        expect.objectContaining({
          width: 161,
        }),
      );
    });

    act(() => {
      window.dispatchEvent(createPointerEvent('pointerup', 13, 260, 14));
    });
  });

  it('calls onChangeColumns with the resized width after a pointer drag', async () => {
    const onChangeColumns = vi.fn();
    const { container } = render(
      <BGrid<Row>
        width={400}
        height={140}
        columns={columns}
        data={data}
        onChangeColumns={onChangeColumns}
      />,
    );
    const headerCell = container.querySelector(
      "[role='rfdg-head'] [data-column-index='1']",
    ) as HTMLTableCellElement | null;
    const resizeHandle = headerCell?.querySelector('.bgrid-col-resizer-handle') as HTMLDivElement | null;

    expect(headerCell).toBeTruthy();
    expect(resizeHandle).toBeTruthy();
    setElementRect(headerCell as HTMLTableCellElement, {
      left: 100,
      top: 0,
      right: 200,
      bottom: 28,
      width: 100,
      height: 28,
    });

    act(() => {
      fireEvent.pointerDown(resizeHandle as HTMLDivElement, { pointerId: 7, clientX: 200, clientY: 14 });
      window.dispatchEvent(createPointerEvent('pointermove', 7, 260, 14));
      window.dispatchEvent(createPointerEvent('pointerup', 7, 260, 14));
    });

    await waitFor(() => {
      expect(onChangeColumns).toHaveBeenCalled();
    });
    expect(onChangeColumns).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({
        width: 161,
      }),
    );
  });

  it('uses the final pointerup position when a pointer drag has no move event', async () => {
    const onChangeColumns = vi.fn();
    const { container } = render(
      <BGrid<Row>
        width={400}
        height={140}
        columns={columns}
        data={data}
        onChangeColumns={onChangeColumns}
      />,
    );
    const headerCell = container.querySelector(
      "[role='rfdg-head'] [data-column-index='1']",
    ) as HTMLTableCellElement | null;
    const resizeHandle = headerCell?.querySelector('.bgrid-col-resizer-handle') as HTMLDivElement | null;

    expect(headerCell).toBeTruthy();
    expect(resizeHandle).toBeTruthy();
    setElementRect(headerCell as HTMLTableCellElement, {
      left: 100,
      top: 0,
      right: 200,
      bottom: 28,
      width: 100,
      height: 28,
    });

    act(() => {
      fireEvent.pointerDown(resizeHandle as HTMLDivElement, { pointerId: 9, clientX: 200, clientY: 14 });
      window.dispatchEvent(createPointerEvent('pointerup', 9, 360, 14));
    });

    await waitFor(() => {
      expect(onChangeColumns).toHaveBeenCalled();
    });
    expect(onChangeColumns).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({
        width: 261,
      }),
    );
  });

  it('keeps resizing after pointer drag crosses owner window mouseleave', async () => {
    const onChangeColumns = vi.fn();
    const { container } = render(
      <BGrid<Row>
        width={400}
        height={140}
        columns={columns}
        data={data}
        onChangeColumns={onChangeColumns}
      />,
    );
    const headerCell = container.querySelector(
      "[role='rfdg-head'] [data-column-index='1']",
    ) as HTMLTableCellElement | null;
    const resizeHandle = headerCell?.querySelector('.bgrid-col-resizer-handle') as HTMLDivElement | null;

    expect(headerCell).toBeTruthy();
    expect(resizeHandle).toBeTruthy();
    setElementRect(headerCell as HTMLTableCellElement, {
      left: 100,
      top: 0,
      right: 200,
      bottom: 28,
      width: 100,
      height: 28,
    });

    act(() => {
      fireEvent.pointerDown(resizeHandle as HTMLDivElement, { pointerId: 11, clientX: 200, clientY: 14 });
      window.dispatchEvent(createMouseEvent('mouseleave', 200, 14));
      window.dispatchEvent(createPointerEvent('pointermove', 11, 280, 14));
      window.dispatchEvent(createPointerEvent('pointerup', 11, 280, 14));
    });

    await waitFor(() => {
      expect(onChangeColumns).toHaveBeenCalled();
    });
    expect(onChangeColumns).toHaveBeenLastCalledWith(
      1,
      expect.objectContaining({
        width: 181,
      }),
    );
  });
});

describe('BGrid default cell rendering', () => {
  interface Row {
    multiLang: Record<string, string>;
    tags: string[];
    createdAt: Date;
    customNode: JSX.Element;
    emptyValue: null;
  }

  const columns: BGridColumn<Row>[] = [
    { key: 'multiLang', label: 'Multi language', width: 140 },
    { key: 'tags', label: 'Tags', width: 120 },
    { key: 'createdAt', label: 'Created at', width: 180 },
    { key: 'customNode', label: 'Custom node', width: 120 },
    { key: 'emptyValue', label: 'Empty', width: 80 },
  ];

  const data = [
    {
      values: {
        multiLang: { ko: '한국어', en: 'English' },
        tags: ['admin', 'system'],
        createdAt: new Date('2026-06-04T00:00:00.000Z'),
        customNode: <strong>inline node</strong>,
        emptyValue: null,
      },
    },
  ];

  function getCell(container: HTMLElement, columnIndex: number) {
    const cell = container.querySelector(
      `[data-row-index="0"][data-column-index="${columnIndex}"]`,
    ) as HTMLTableCellElement | null;

    expect(cell).toBeTruthy();
    return cell as HTMLTableCellElement;
  }

  it('formats non-primitive values safely when itemRender is not provided', async () => {
    const { container } = render(<BGrid<Row> width={760} height={120} columns={columns} data={data} />);

    await waitFor(() => {
      expect(container.querySelector("[role='rfdg-body']")).toBeInTheDocument();
    });

    expect(getCell(container, 0)).toHaveTextContent('{"ko":"한국어","en":"English"}');
    expect(getCell(container, 1)).toHaveTextContent('["admin","system"]');
    expect(getCell(container, 2)).toHaveTextContent('2026-06-04T00:00:00.000Z');
    expect(getCell(container, 3)).toHaveTextContent('inline node');
    expect(getCell(container, 4).textContent).toBe('');
  });

  it('falls back to safe text when itemRender returns a non-renderable object', async () => {
    const columnsWithUnsafeRenderer: BGridColumn<Row>[] = [
      {
        key: 'multiLang',
        label: 'Unsafe itemRender',
        width: 180,
        itemRender: ({ value }) => value as any,
      },
    ];

    const { container } = render(
      <BGrid<Row> width={360} height={120} columns={columnsWithUnsafeRenderer} data={data} />,
    );

    await waitFor(() => {
      expect(container.querySelector("[role='rfdg-body']")).toBeInTheDocument();
    });

    expect(getCell(container, 0)).toHaveTextContent('{"ko":"한국어","en":"English"}');
  });

  it('renders React nodes returned from itemRender', async () => {
    const columnsWithNodeRenderer: BGridColumn<Row>[] = [
      {
        key: 'tags',
        label: 'Single node',
        width: 140,
        itemRender: ({ value }) => <span data-testid="single-node">{value[0]}</span>,
      },
      {
        key: 'tags',
        label: 'Node array',
        width: 180,
        itemRender: ({ value }) => [
          <strong key="first">{value[0]}</strong>,
          <span key="separator"> / </span>,
          <em key="second">{value[1]}</em>,
        ],
      },
    ];

    const { container } = render(
      <BGrid<Row> width={360} height={120} columns={columnsWithNodeRenderer} data={data} />,
    );

    await waitFor(() => {
      expect(container.querySelector("[role='rfdg-body']")).toBeInTheDocument();
    });

    expect(screen.getByTestId('single-node')).toHaveTextContent('admin');
    expect(getCell(container, 1)).toHaveTextContent('admin / system');
  });

  it('does not throw for circular values and renders a safe fallback string', async () => {
    const circular: Record<string, any> = { label: 'circular' };
    circular.self = circular;

    const circularData = [
      {
        values: {
          multiLang: circular,
          tags: ['admin', 'system'],
          createdAt: new Date('2026-06-04T00:00:00.000Z'),
          customNode: <strong>inline node</strong>,
          emptyValue: null,
        },
      },
    ];

    const { container } = render(<BGrid<Row> width={760} height={120} columns={columns} data={circularData} />);

    await waitFor(() => {
      expect(container.querySelector("[role='rfdg-body']")).toBeInTheDocument();
    });

    expect(getCell(container, 0)).toHaveTextContent('[object Object]');
  });
});

describe('BGrid pivot', () => {
  interface Row {
    region: string;
    quarter: string;
    sales: number;
  }

  const columns: BGridColumn<Row>[] = [
    { key: 'region', label: 'Region', width: 100 },
    { key: 'quarter', label: 'Quarter', width: 100 },
    { key: 'sales', label: 'Sales', width: 100 },
  ];

  const data = [
    { values: { region: 'North', quarter: 'Q1', sales: 10 } },
    { values: { region: 'North', quarter: 'Q1', sales: 15 } },
    { values: { region: 'North', quarter: 'Q2', sales: 7 } },
    { values: { region: 'South', quarter: 'Q1', sales: 3 } },
  ];

  const pivot: NonNullable<BGridProps<Row>['pivot']> = {
    rows: [{ key: 'region', label: 'Region', headerStyle: { backgroundColor: 'aliceblue' } }],
    columns: [{ key: 'quarter', label: 'Quarter' }],
    values: [
      {
        key: 'sales',
        label: 'Sales',
        aggregate: 'sum' as const,
        headerStyle: { color: 'darkgreen' },
        itemRender: ({ value, columnValues, sourceItems }) => (
          <strong>
            {columnValues[0]}:${value} total ({sourceItems.length})
          </strong>
        ),
      },
    ],
    emptyValue: 0,
  };

  it('creates pivoted columns, groups, and aggregated row values', () => {
    const result = createPivotData<Row>({ data, pivot });

    expect(result?.columns.map(column => column.label)).toEqual(['Region', 'Sales', 'Sales']);
    expect(result?.columns[0].headerStyle).toEqual({ backgroundColor: 'aliceblue' });
    expect(result?.columns[1].headerStyle).toEqual({ color: 'darkgreen' });
    expect(result?.columnsGroup.map(group => group.label)).toEqual(['Q1', 'Q2']);
    expect(result?.data[0].values).toMatchObject({
      __bgrid_pivot_row_0: 'North',
      __bgrid_pivot_value_0_0: 25,
      __bgrid_pivot_value_1_0: 7,
    });
    expect(result?.data[1].values).toMatchObject({
      __bgrid_pivot_row_0: 'South',
      __bgrid_pivot_value_0_0: 3,
      __bgrid_pivot_value_1_0: 0,
    });
  });

  it('renders pivot output without frozen, row selection, and sort UI', async () => {
    const { container } = render(
      <BGrid<Row>
        width={360}
        height={160}
        columns={columns}
        data={data}
        pivot={pivot}
        frozenColumnIndex={1}
        showLineNumber
        rowChecked={{ onChange: vi.fn() }}
        sort={{ sortParams: [{ key: 'region', orderBy: 'asc' }], onChange: vi.fn() }}
        columnSortable
        cellSelectionOptions={{ enabled: false }}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector("[role='rfdg-body']")).toBeInTheDocument();
    });

    expect(container.querySelector("[role='rfdg-frozen-header']")).not.toBeInTheDocument();
    expect(container.querySelector("[role='rfdg-frozen-scroll-container']")).not.toBeInTheDocument();
    expect(container.querySelector('.bgrid-row-selector')).not.toBeInTheDocument();
    expect(container.querySelector('.bgrid-sorter')).not.toBeInTheDocument();
    const pivotCell = container.querySelector('td[data-bgrid-cell="true"]') as HTMLTableCellElement;
    fireEvent.pointerDown(pivotCell, { button: 0 });
    fireEvent.pointerUp(pivotCell);
    expect(container.querySelector('[data-bgrid-selection-fragment="true"]')).not.toBeInTheDocument();
    expect(container).toHaveTextContent('North');
    expect(container).toHaveTextContent('Q1:$25 total (2)');
  });
});


describe('BGrid frozen helper column borders', () => {
  interface Row {
    id: number;
    name: string;
  }

  const columns: BGridColumn<Row>[] = [
    { key: 'id', label: 'ID', width: 100 },
    { key: 'name', label: 'Name', width: 100 },
  ];

  const data = [{ values: { id: 1, name: 'one' } }, { values: { id: 2, name: 'two' } }];

  const summary = {
    position: 'top' as const,
    columns: [
      {
        columnIndex: 0,
        itemRender: () => <span>Summary</span>,
      },
    ],
  };

  function getFirstCells(container: HTMLElement, selector: string, minCellCount = 2) {
    const row = container.querySelector(selector);
    expect(row).toBeTruthy();

    const cells = Array.from((row as HTMLTableRowElement).children) as HTMLTableCellElement[];
    expect(cells.length).toBeGreaterThanOrEqual(minCellCount);
    return cells;
  }

  it('renders a trailing summary cell so the horizontal border fills the remaining grid width', async () => {
    const { container } = render(
      <BGrid<Row> width={600} height={180} columns={columns} data={data} summary={summary} />,
    );

    await waitFor(() => {
      expect(container.querySelector("[role='rfdg-summary'] td[data-none]")).toBeInTheDocument();
    });

    const summaryRow = container.querySelector("[role='rfdg-summary'] tr") as HTMLTableRowElement;
    expect(summaryRow.lastElementChild).toHaveAttribute('data-none');
  });

  it('renders the helper boundary only after the checkbox when line number and row checkbox are both shown', async () => {
    const { container } = render(
      <BGrid<Row>
        width={320}
        height={180}
        columns={columns}
        data={data}
        frozenColumnIndex={1}
        showLineNumber
        rowChecked={{ onChange: vi.fn() }}
        summary={summary}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector("[role='rfdg-head-frozen']")).toBeInTheDocument();
      expect(container.querySelector("[role='rfdg-body-frozen']")).toBeInTheDocument();
      expect(container.querySelector("[role='rfdg-summay-frozen']")).toBeInTheDocument();
    });

    const [headLineNumberCell, headCheckboxCell] = getFirstCells(container, "[role='rfdg-head-frozen'] tr");
    expect(headLineNumberCell).toHaveClass('rfdg-tr-line-number');
    expect(headLineNumberCell).not.toHaveClass('bgrid-head-right-border');
    expect(headCheckboxCell).toHaveClass('bgrid-head-right-border');

    const [bodyLineNumberCell, bodyCheckboxCell] = getFirstCells(container, "[role='rfdg-body-frozen'] tr");
    expect(bodyLineNumberCell.className).not.toContain('border-r');
    expect(bodyLineNumberCell).not.toHaveClass('bordered');
    expect(bodyCheckboxCell).toHaveClass('bordered');

    const [summaryLineNumberCell, summaryCheckboxCell] = getFirstCells(container, "[role='rfdg-summay-frozen'] tr");
    expect(summaryLineNumberCell).not.toHaveClass('bordered');
    expect(summaryCheckboxCell).toHaveClass('bordered');
  });

  it('uses the line-number cell as the helper boundary when row checkbox is hidden', async () => {
    const { container } = render(
      <BGrid<Row>
        width={320}
        height={180}
        columns={columns}
        data={data}
        frozenColumnIndex={1}
        showLineNumber
        summary={summary}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector("[role='rfdg-head-frozen']")).toBeInTheDocument();
      expect(container.querySelector("[role='rfdg-body-frozen']")).toBeInTheDocument();
      expect(container.querySelector("[role='rfdg-summay-frozen']")).toBeInTheDocument();
    });

    const [headLineNumberCell] = getFirstCells(container, "[role='rfdg-head-frozen'] tr");
    expect(headLineNumberCell).toHaveClass('rfdg-tr-line-number');
    expect(headLineNumberCell).toHaveClass('bgrid-head-right-border');

    const [bodyLineNumberCell] = getFirstCells(container, "[role='rfdg-body-frozen'] tr");
    expect(bodyLineNumberCell).toHaveClass('bordered');
    expect(bodyLineNumberCell).not.toHaveClass('border-solid');
    expect(bodyLineNumberCell.className).not.toContain('border-r');

    const [summaryLineNumberCell] = getFirstCells(container, "[role='rfdg-summay-frozen'] tr");
    expect(summaryLineNumberCell).toHaveClass('bordered');
  });

  it('keeps the frozen line-number width aligned when reorder drag handles are enabled', async () => {
    const reorderData = Array.from({ length: 100 }, (_, idx) => ({ values: { id: idx + 1, name: `row-${idx + 1}` } }));

    const { container } = render(
      <BGrid<Row>
        width={320}
        height={180}
        columns={columns}
        data={reorderData}
        showLineNumber
        reorder={{ enabled: true, onReorder: vi.fn() }}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector("[role='rfdg-head-frozen']")).toBeInTheDocument();
      expect(container.querySelector("[role='rfdg-body-frozen']")).toBeInTheDocument();
    });

    const frozenHeaderLineNumberCol = container.querySelector(
      "[role='rfdg-frozen-header'] colgroup col",
    ) as HTMLTableColElement | null;
    const frozenBodyLineNumberCol = container.querySelector(
      "[role='rfdg-frozen-scroll-container'] colgroup col",
    ) as HTMLTableColElement | null;

    expect(frozenHeaderLineNumberCol).toHaveAttribute('width', '57');
    expect(frozenBodyLineNumberCol).toHaveAttribute('width', '57');

    const [bodyLineNumberCell] = getFirstCells(container, "[role='rfdg-body-frozen'] tr", 1);
    expect(bodyLineNumberCell.className).not.toContain('border-r');
    expect(container.querySelector("[role='rfdg-frozen-scroll-container']")).toHaveClass('bgrid-frozen-body-boundary');
  });

  it('lets vertical-bordered cell-merge grids own the line-number border style', async () => {
    const mergeData = Array.from({ length: 5 }, (_, idx) => ({
      values: { id: idx + 1, name: 'merged' },
    }));

    const { container } = render(
      <BGrid<Row>
        width={320}
        height={180}
        columns={columns}
        data={mergeData}
        frozenColumnIndex={1}
        showLineNumber
        variant={'vertical-bordered'}
        cellMergeOptions={{ columnsMap: { 0: { mergeBy: 'name' } } }}
      />,
    );

    await waitFor(() => {
      expect(container.querySelector("[role='rfdg-body-frozen']")).toBeInTheDocument();
    });

    const [bodyLineNumberCell, mergedCell] = getFirstCells(container, "[role='rfdg-body-frozen'] tr");
    expect(bodyLineNumberCell.className).not.toContain('border-r');
    expect(mergedCell).toHaveClass('merged');
    expect(mergedCell.rowSpan).toBe(5);
  });
});

describe('BGrid cell selection', () => {
  interface Row {
    id: number;
    name: string;
    status: string;
  }

  const columns: BGridColumn<Row>[] = [
    { key: 'id', label: 'ID', width: 100 },
    { key: 'name', label: 'Name', width: 100 },
    { key: 'status', label: 'Status', width: 100 },
  ];

  const data = [
    { values: { id: 1, name: 'one', status: 'ready' } },
    { values: { id: 2, name: 'two', status: 'done' } },
  ];

  function getCell(container: HTMLElement, rowIndex: number, columnIndex: number) {
    const cell = container.querySelector(
      `[data-row-index="${rowIndex}"][data-column-index="${columnIndex}"]`,
    ) as HTMLTableCellElement | null;

    expect(cell).toBeTruthy();
    return cell as HTMLTableCellElement;
  }

  function getSelectionFragments(container: HTMLElement) {
    return container.querySelectorAll<HTMLElement>('[data-bgrid-selection-fragment="true"]');
  }

  function dragSelect(
    fromCell: HTMLTableCellElement,
    toCell: HTMLTableCellElement,
    options: { shiftKey?: boolean; metaKey?: boolean; ctrlKey?: boolean } = {},
  ) {
    fireEvent.pointerDown(fromCell, { button: 0, ...options });
    if (fromCell !== toCell) {
      fireEvent.pointerOver(toCell);
    }
    fireEvent.pointerUp(toCell);
  }

  let originalClipboard: Clipboard | undefined;

  function mockClipboard(writeText = vi.fn().mockResolvedValue(undefined)) {
    if (originalClipboard === undefined) {
      originalClipboard = navigator.clipboard;
    }
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    });
    return writeText;
  }

  afterEach(() => {
    if (originalClipboard !== undefined) {
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: originalClipboard,
      });
      originalClipboard = undefined;
    }
  });

  function setElementRect(element: Element, rect: Partial<DOMRect>) {
    element.getBoundingClientRect = vi.fn(() => ({
      x: rect.left ?? 0,
      y: rect.top ?? 0,
      left: rect.left ?? 0,
      top: rect.top ?? 0,
      right: rect.right ?? 0,
      bottom: rect.bottom ?? 0,
      width: rect.width ?? (rect.right ?? 0) - (rect.left ?? 0),
      height: rect.height ?? (rect.bottom ?? 0) - (rect.top ?? 0),
      toJSON: () => ({}),
    })) as any;
  }

  function setScrollMetrics(
    scrollContainer: HTMLDivElement,
    metrics: { clientHeight: number; scrollHeight: number; clientWidth: number; scrollWidth: number },
  ) {
    Object.defineProperty(scrollContainer, 'clientHeight', {
      configurable: true,
      value: metrics.clientHeight,
    });
    Object.defineProperty(scrollContainer, 'scrollHeight', {
      configurable: true,
      value: metrics.scrollHeight,
    });
    Object.defineProperty(scrollContainer, 'clientWidth', {
      configurable: true,
      value: metrics.clientWidth,
    });
    Object.defineProperty(scrollContainer, 'scrollWidth', {
      configurable: true,
      value: metrics.scrollWidth,
    });
    Object.defineProperty(scrollContainer, 'scrollTop', {
      configurable: true,
      writable: true,
      value: 0,
    });
    Object.defineProperty(scrollContainer, 'scrollLeft', {
      configurable: true,
      writable: true,
      value: 0,
    });
  }

  it('can disable cell selection', () => {
    const writeText = mockClipboard();
    const { container } = render(
      <BGrid<Row>
        width={400}
        height={140}
        columns={columns}
        data={data}
        cellSelectionOptions={{ enabled: false }}
      />,
    );

    dragSelect(getCell(container, 0, 0), getCell(container, 1, 1));
    fireEvent.keyDown(document, { key: 'a', ctrlKey: true });
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true });

    expect(getSelectionFragments(container)).toHaveLength(0);
    expect(writeText).not.toHaveBeenCalled();
  });

  it('clears an existing selection when cell selection is disabled', async () => {
    const { container, rerender } = render(
      <BGrid<Row> width={400} height={140} columns={columns} data={data} />,
    );

    dragSelect(getCell(container, 0, 0), getCell(container, 1, 1));
    await waitFor(() => {
      expect(getSelectionFragments(container)).toHaveLength(1);
    });

    rerender(
      <BGrid<Row>
        width={400}
        height={140}
        columns={columns}
        data={data}
        cellSelectionOptions={{ enabled: false }}
      />,
    );

    await waitFor(() => {
      expect(getSelectionFragments(container)).toHaveLength(0);
    });
  });

  it('focuses the grid without scrolling the page when cell selection starts', () => {
    const { container } = render(<BGrid<Row> width={400} height={140} columns={columns} data={data} />);
    const grid = container.querySelector("[role='grid']") as HTMLDivElement;
    const focus = vi.spyOn(grid, 'focus');

    dragSelect(getCell(container, 0, 0), getCell(container, 0, 0));

    expect(focus).toHaveBeenCalledWith({ preventScroll: true });
  });

  it('selects a dragged cell range and replaces it when another cell is selected', async () => {
    const { container } = render(<BGrid<Row> width={400} height={140} columns={columns} data={data} />);

    const firstCell = getCell(container, 0, 0);
    const lastCell = getCell(container, 1, 1);
    const otherCell = getCell(container, 0, 2);

    dragSelect(firstCell, lastCell);

    await waitFor(() => {
      expect(getSelectionFragments(container)).toHaveLength(1);
    });

    dragSelect(otherCell, otherCell);

    await waitFor(() => {
      expect(getSelectionFragments(container)).toHaveLength(1);
      expect(getSelectionFragments(container)[0]).toHaveStyle({
        left: '200px',
        top: '0px',
        width: '100px',
        height: '29px',
      });
    });
  });

  it('clears selected cells when Escape is pressed', async () => {
    const { container } = render(<BGrid<Row> width={400} height={140} columns={columns} data={data} />);

    dragSelect(getCell(container, 0, 0), getCell(container, 1, 1));

    await waitFor(() => {
      expect(getSelectionFragments(container)).toHaveLength(1);
    });

    fireEvent.keyDown(document, { key: 'Escape' });

    await waitFor(() => {
      expect(getSelectionFragments(container)).toHaveLength(0);
    });
  });

  it('clears selected cells when the user clicks outside the grid', async () => {
    const { container } = render(<BGrid<Row> width={400} height={140} columns={columns} data={data} />);

    dragSelect(getCell(container, 0, 0), getCell(container, 1, 1));

    await waitFor(() => {
      expect(getSelectionFragments(container)).toHaveLength(1);
    });

    fireEvent.pointerDown(document.body, { button: 0 });

    await waitFor(() => {
      expect(getSelectionFragments(container)).toHaveLength(0);
    });
  });

  it('keeps selected cells when the user clicks inside the grid but outside a cell', async () => {
    const { container } = render(<BGrid<Row> width={400} height={140} columns={columns} data={data} />);
    const scrollContainer = container.querySelector("[role='rfdg-scroll-container']") as HTMLDivElement;

    dragSelect(getCell(container, 0, 0), getCell(container, 1, 1));

    await waitFor(() => {
      expect(getSelectionFragments(container)).toHaveLength(1);
    });

    fireEvent.pointerDown(scrollContainer, { button: 0 });

    expect(getSelectionFragments(container)).toHaveLength(1);
  });

  it('keeps selected cells when a scrollbar pointer event is reported from inside the grid bounds', async () => {
    const { container } = render(<BGrid<Row> width={400} height={140} columns={columns} data={data} />);
    const grid = container.querySelector("[role='grid']") as HTMLDivElement;

    dragSelect(getCell(container, 0, 0), getCell(container, 1, 1));

    await waitFor(() => {
      expect(getSelectionFragments(container)).toHaveLength(1);
    });

    setElementRect(grid, { left: 10, top: 10, right: 410, bottom: 150, width: 400, height: 140 });
    fireEvent.pointerDown(document.body, { button: 0, clientX: 405, clientY: 80 });

    expect(getSelectionFragments(container)).toHaveLength(1);
  });

  it('can keep selected cells when Escape and outside-click clearing are disabled', async () => {
    const { container } = render(
      <BGrid<Row>
        width={400}
        height={140}
        columns={columns}
        data={data}
        cellSelectionOptions={{ clearOnEscape: false, clearOnOutsideClick: false }}
      />,
    );

    dragSelect(getCell(container, 0, 0), getCell(container, 1, 1));

    await waitFor(() => {
      expect(getSelectionFragments(container)).toHaveLength(1);
    });

    fireEvent.keyDown(document, { key: 'Escape' });
    fireEvent.pointerDown(document.body, { button: 0 });

    expect(getSelectionFragments(container)).toHaveLength(1);
  });

  it('copies selected cell text with tab and carriage-return separators', async () => {
    const writeText = mockClipboard();

    const { container } = render(<BGrid<Row> width={400} height={140} columns={columns} data={data} />);

    const firstCell = getCell(container, 0, 0);
    const lastCell = getCell(container, 1, 1);

    dragSelect(firstCell, lastCell);
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true });

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('1\tone\r2\ttwo');
    });
  });

  it('falls back to execCommand when navigator clipboard write fails', async () => {
    const writeText = mockClipboard(vi.fn().mockRejectedValue(new Error('clipboard blocked')));
    const originalExecCommand = document.execCommand;
    const execCommand = vi.fn().mockReturnValue(true);
    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: execCommand,
    });

    const { container } = render(<BGrid<Row> width={400} height={140} columns={columns} data={data} />);

    dragSelect(getCell(container, 0, 0), getCell(container, 0, 1));
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true });

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('1\tone');
      expect(execCommand).toHaveBeenCalledWith('copy');
    });

    Object.defineProperty(document, 'execCommand', {
      configurable: true,
      value: originalExecCommand,
    });
  });

  it('writes selected cell text into native copy events', async () => {
    const { container } = render(<BGrid<Row> width={400} height={140} columns={columns} data={data} />);
    const clipboardData = {
      setData: vi.fn(),
    };

    dragSelect(getCell(container, 0, 0), getCell(container, 1, 1));
    (container.querySelector('[role="grid"]') as HTMLElement).focus();
    fireEvent.copy(document, { clipboardData });

    await waitFor(() => {
      expect(clipboardData.setData).toHaveBeenCalledWith('text/plain', '1\tone\r2\ttwo');
    });
  });

  it('pastes tabular clipboard text from the active cell and reports every changed cell', async () => {
    const pasteData = [
      { values: { id: 1, name: 'one', status: 'ready' } },
      { values: { id: 2, name: 'two', status: 'done' } },
    ];
    const onChangeData = vi.fn();
    const { container } = render(
      <BGrid<Row>
        width={400}
        height={140}
        columns={columns}
        data={pasteData}
        editable
        onChangeData={onChangeData}
      />,
    );

    dragSelect(getCell(container, 0, 1), getCell(container, 0, 1));
    fireEvent.paste(document, {
      clipboardData: { getData: vi.fn().mockReturnValue('alpha\topen\r\nbeta\tclosed\r\n') },
    });

    await waitFor(() => {
      expect(getCell(container, 0, 1)).toHaveTextContent('alpha');
      expect(getCell(container, 0, 2)).toHaveTextContent('open');
      expect(getCell(container, 1, 1)).toHaveTextContent('beta');
      expect(getCell(container, 1, 2)).toHaveTextContent('closed');
      expect(getSelectionFragments(container)).toHaveLength(1);
      expect(container.querySelectorAll('td.bgrid-cell-edited')).toHaveLength(4);
    });
    expect(pasteData[0].status).toBe(BGridDataItemStatus.edit);
    expect(pasteData[1].status).toBe(BGridDataItemStatus.edit);
    expect(onChangeData).toHaveBeenCalledTimes(4);
    expect(onChangeData).toHaveBeenLastCalledWith(1, 2, pasteData[1].values, expect.objectContaining({ key: 'status' }));
  });

  it('skips read-only columns and removed rows while preserving new row status during paste', async () => {
    const pasteColumns: BGridColumn<Row>[] = [
      { key: 'id', label: 'ID', width: 100, editable: false },
      {
        key: 'name',
        label: 'Name',
        width: 100,
        editor: { type: 'text', parseValue: text => text.toUpperCase() },
      },
    ];
    const pasteData = [
      { values: { id: 1, name: 'one', status: 'ready' } },
      { values: { id: 2, name: 'two', status: 'done' }, status: BGridDataItemStatus.remove },
      { values: { id: 3, name: 'three', status: 'ready' }, status: BGridDataItemStatus.new },
    ];
    const onChangeData = vi.fn();
    const { container } = render(
      <BGrid<Row>
        width={300}
        height={180}
        columns={pasteColumns}
        data={pasteData}
        editable
        onChangeData={onChangeData}
      />,
    );

    dragSelect(getCell(container, 0, 0), getCell(container, 0, 0));
    fireEvent.paste(document, {
      clipboardData: { getData: vi.fn().mockReturnValue('99\talpha\n88\tbeta\n77\tgamma') },
    });

    await waitFor(() => {
      expect(getCell(container, 0, 1)).toHaveTextContent('ALPHA');
      expect(getCell(container, 1, 1)).toHaveTextContent('two');
      expect(getCell(container, 2, 1)).toHaveTextContent('GAMMA');
    });
    expect(pasteData.map(item => item.values.id)).toEqual([1, 2, 3]);
    expect(pasteData.map(item => item.status)).toEqual([
      BGridDataItemStatus.edit,
      BGridDataItemStatus.remove,
      BGridDataItemStatus.new,
    ]);
    expect(onChangeData).toHaveBeenCalledTimes(2);
    expect(getCell(container, 0, 0)).not.toHaveClass('bgrid-cell-edited');
    expect(getCell(container, 0, 1)).toHaveClass('bgrid-cell-edited');
    expect(getCell(container, 1, 1)).not.toHaveClass('bgrid-cell-edited');
    expect(getCell(container, 2, 1)).toHaveClass('bgrid-cell-edited');
  });

  it('creates missing trailing rows while pasting when createRowOnPaste is provided', async () => {
    const appendColumns: BGridColumn<Row>[] = [
      {
        key: 'id',
        label: 'ID',
        width: 100,
        editor: { type: 'text', parseValue: text => Number(text) },
      },
      { key: 'name', label: 'Name', width: 100 },
    ];
    const appendData = [{ values: { id: 1, name: 'one', status: 'ready' } }];
    const createRowOnPaste = vi.fn(() => ({
      values: { id: 0, name: '', status: 'new' },
    }));
    const onChangeData = vi.fn();
    const { container } = render(
      <BGrid<Row>
        width={300}
        height={180}
        columns={appendColumns}
        data={appendData}
        editable
        onChangeData={onChangeData}
        cellSelectionOptions={{ createRowOnPaste }}
      />,
    );

    dragSelect(getCell(container, 0, 0), getCell(container, 0, 0));
    fireEvent.paste(document, {
      clipboardData: { getData: vi.fn().mockReturnValue('10\talpha\n20\tbeta\n30\tgamma') },
    });

    await waitFor(() => {
      expect(getCell(container, 2, 0)).toHaveTextContent('30');
      expect(getCell(container, 2, 1)).toHaveTextContent('gamma');
      expect(getSelectionFragments(container)).toHaveLength(1);
    });
    expect(createRowOnPaste).toHaveBeenCalledTimes(2);
    expect(createRowOnPaste).toHaveBeenNthCalledWith(1, expect.objectContaining({ rowIndex: 1 }));
    expect(createRowOnPaste).toHaveBeenNthCalledWith(2, expect.objectContaining({ rowIndex: 2 }));
    expect(onChangeData.mock.calls.filter(([, columnIndex]) => columnIndex === null)).toHaveLength(2);
    expect(onChangeData.mock.calls.filter(([, columnIndex]) => columnIndex !== null)).toHaveLength(6);
  });

  it('uses absolute column indexes when selection starts in the frozen body', async () => {
    const { container } = render(
      <BGrid<Row> width={400} height={140} columns={columns} data={data} frozenColumnIndex={1} />,
    );

    const frozenCell = getCell(container, 0, 0);
    const normalCell = getCell(container, 1, 2);

    dragSelect(frozenCell, normalCell);

    await waitFor(() => {
      expect(getSelectionFragments(container)).toHaveLength(2);
    });
  });

  it('extends the latest selection range with shift', async () => {
    const { container } = render(<BGrid<Row> width={400} height={140} columns={columns} data={data} />);

    const firstCell = getCell(container, 0, 0);
    const lastCell = getCell(container, 1, 2);

    dragSelect(firstCell, firstCell);
    dragSelect(lastCell, lastCell, { shiftKey: true });

    await waitFor(() => {
      expect(getSelectionFragments(container)).toHaveLength(1);
    });
  });

  it('adds a new selection range with meta or ctrl', async () => {
    const { container } = render(<BGrid<Row> width={400} height={140} columns={columns} data={data} />);

    const firstCell = getCell(container, 0, 0);
    const otherCell = getCell(container, 1, 2);

    dragSelect(firstCell, firstCell);
    dragSelect(otherCell, otherCell, { metaKey: true });

    await waitFor(() => {
      expect(getSelectionFragments(container)).toHaveLength(2);
      expect(
        Array.from(getSelectionFragments(container)).map(fragment => fragment.dataset.bgridSelectionRangeIndex),
      ).toEqual(['0', '1']);
    });
  });

  it('copies sparse multi-range selections in row and column order', async () => {
    const writeText = mockClipboard();
    const { container } = render(<BGrid<Row> width={400} height={140} columns={columns} data={data} />);

    dragSelect(getCell(container, 0, 2), getCell(container, 0, 2));
    dragSelect(getCell(container, 1, 0), getCell(container, 1, 1), { ctrlKey: true });
    fireEvent.keyDown(document, { key: 'c', metaKey: true });

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('ready\r2\ttwo');
    });
  });

  it('uses column getClipboardText before falling back to key value', async () => {
    const writeText = mockClipboard();
    const clipboardColumns: BGridColumn<Row>[] = [
      {
        key: 'name',
        label: 'Name',
        width: 120,
        itemRender: ({ values }) => <strong>{values.status}</strong>,
        getClipboardText: ({ values }) => `copy:${values.id}:${values.name}`,
      },
      { key: 'status', label: 'Status', width: 120 },
    ];

    const { container } = render(<BGrid<Row> width={320} height={140} columns={clipboardColumns} data={data} />);

    dragSelect(getCell(container, 0, 0), getCell(container, 0, 1));
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true });

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('copy:1:one\tready');
    });
  });

  it('auto-scrolls vertically and expands selection while dragging beyond the body edge', async () => {
    const writeText = mockClipboard();
    const largeData = Array.from({ length: 40 }, (_, idx) => ({
      values: { id: idx + 1, name: `row-${idx + 1}`, status: 'ready' },
    }));
    const { container } = render(
      <BGrid<Row> width={360} height={140} columns={columns} data={largeData} itemHeight={10} itemPadding={0} />,
    );
    const scrollContainer = container.querySelector("[role='rfdg-scroll-container']") as HTMLDivElement;
    const bodyContainer = scrollContainer.parentElement as HTMLDivElement;

    setScrollMetrics(scrollContainer, {
      clientHeight: 80,
      scrollHeight: 440,
      clientWidth: 260,
      scrollWidth: 300,
    });
    setElementRect(bodyContainer, { left: 0, top: 0, right: 360, bottom: 80, width: 360, height: 80 });
    setElementRect(scrollContainer, { left: 0, top: 0, right: 260, bottom: 80, width: 260, height: 80 });

    fireEvent.pointerDown(getCell(container, 0, 0), { button: 0, clientX: 50, clientY: 20 });
    fireEvent.pointerMove(document, { clientX: 50, clientY: 120 });

    await waitFor(() => {
      expect(scrollContainer.scrollTop).toBeGreaterThan(0);
    });

    fireEvent.pointerUp(document);
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true });

    await waitFor(() => {
      expect(writeText.mock.calls[0][0].split('\r').length).toBeGreaterThan(1);
    });
  });

  it('auto-scrolls horizontally and expands selection while dragging beyond the right edge', async () => {
    const writeText = mockClipboard();
    const wideColumns: BGridColumn<Row>[] = [
      { key: 'id', label: 'ID', width: 100 },
      { key: 'name', label: 'Name', width: 100 },
      { key: 'status', label: 'Status', width: 100 },
    ];
    const { container } = render(<BGrid<Row> width={180} height={140} columns={wideColumns} data={data} />);
    const scrollContainer = container.querySelector("[role='rfdg-scroll-container']") as HTMLDivElement;
    const bodyContainer = scrollContainer.parentElement as HTMLDivElement;

    setScrollMetrics(scrollContainer, {
      clientHeight: 80,
      scrollHeight: 80,
      clientWidth: 120,
      scrollWidth: 300,
    });
    setElementRect(bodyContainer, { left: 0, top: 0, right: 180, bottom: 80, width: 180, height: 80 });
    setElementRect(scrollContainer, { left: 0, top: 0, right: 120, bottom: 80, width: 120, height: 80 });

    fireEvent.pointerDown(getCell(container, 0, 0), { button: 0, clientX: 50, clientY: 20 });
    fireEvent.pointerMove(document, { clientX: 160, clientY: 20 });

    await waitFor(() => {
      expect(scrollContainer.scrollLeft).toBeGreaterThan(0);
    });

    fireEvent.pointerUp(document);
    fireEvent.keyDown(document, { key: 'c', metaKey: true });

    await waitFor(() => {
      expect(writeText.mock.calls[0][0].split('\t').length).toBeGreaterThan(1);
    });
  });

  it('auto-scrolls vertically from a frozen cell without losing the frozen column index', async () => {
    const writeText = mockClipboard();
    const largeData = Array.from({ length: 40 }, (_, idx) => ({
      values: { id: idx + 1, name: `row-${idx + 1}`, status: 'ready' },
    }));
    const { container } = render(
      <BGrid<Row>
        width={360}
        height={140}
        columns={columns}
        data={largeData}
        frozenColumnIndex={1}
        itemHeight={10}
        itemPadding={0}
      />,
    );
    const scrollContainer = container.querySelector("[role='rfdg-scroll-container']") as HTMLDivElement;
    const bodyContainer = scrollContainer.parentElement as HTMLDivElement;

    setScrollMetrics(scrollContainer, {
      clientHeight: 80,
      scrollHeight: 440,
      clientWidth: 260,
      scrollWidth: 300,
    });
    setElementRect(bodyContainer, { left: 0, top: 0, right: 360, bottom: 80, width: 360, height: 80 });
    setElementRect(scrollContainer, { left: 100, top: 0, right: 360, bottom: 80, width: 260, height: 80 });

    fireEvent.pointerDown(getCell(container, 0, 0), { button: 0, clientX: 50, clientY: 20 });
    fireEvent.pointerMove(document, { clientX: 50, clientY: 120 });

    await waitFor(() => {
      expect(scrollContainer.scrollTop).toBeGreaterThan(0);
    });

    fireEvent.pointerUp(document);
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true });

    await waitFor(() => {
      const copiedRows = writeText.mock.calls[0][0].split('\r');
      expect(copiedRows.length).toBeGreaterThan(1);
      expect(copiedRows[0]).toBe('1');
      expect(copiedRows[1]).toBe('2');
    });
  });

  it('extends from a frozen cell into normal columns while horizontally auto-scrolling', async () => {
    const writeText = mockClipboard();
    const { container } = render(
      <BGrid<Row> width={260} height={140} columns={columns} data={data} frozenColumnIndex={1} />,
    );
    const scrollContainer = container.querySelector("[role='rfdg-scroll-container']") as HTMLDivElement;
    const bodyContainer = scrollContainer.parentElement as HTMLDivElement;

    setScrollMetrics(scrollContainer, {
      clientHeight: 80,
      scrollHeight: 80,
      clientWidth: 160,
      scrollWidth: 300,
    });
    setElementRect(bodyContainer, { left: 0, top: 0, right: 260, bottom: 80, width: 260, height: 80 });
    setElementRect(scrollContainer, { left: 100, top: 0, right: 260, bottom: 80, width: 160, height: 80 });

    fireEvent.pointerDown(getCell(container, 0, 0), { button: 0, clientX: 50, clientY: 20 });
    fireEvent.pointerMove(document, { clientX: 280, clientY: 20 });

    await waitFor(() => {
      expect(scrollContainer.scrollLeft).toBeGreaterThan(0);
    });

    fireEvent.pointerUp(document);
    fireEvent.keyDown(document, { key: 'c', metaKey: true });

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('1\tone\tready');
    });
  });

  it('includes the full row span when selecting a merged cell', async () => {
    const writeText = mockClipboard();

    const mergeData = [
      { values: { id: 1, name: 'group-a', status: 'ready' } },
      { values: { id: 2, name: 'group-a', status: 'done' } },
      { values: { id: 3, name: 'group-b', status: 'ready' } },
    ];

    const { container } = render(
      <BGrid<Row>
        width={400}
        height={160}
        columns={columns}
        data={mergeData}
        cellMergeOptions={{ columnsMap: { 0: { mergeBy: 'name' } } }}
      />,
    );

    const mergedCell = getCell(container, 0, 0);

    expect(mergedCell.rowSpan).toBe(2);

    dragSelect(mergedCell, mergedCell);
    fireEvent.keyDown(document, { key: 'c', metaKey: true });

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('1\r2');
    });
  });

  it('expands selection across a merged cell when dragging upward', async () => {
    const writeText = mockClipboard();
    const mergeData = [
      { values: { id: 1, name: 'group-a', status: 'ready' } },
      { values: { id: 2, name: 'group-a', status: 'done' } },
      { values: { id: 3, name: 'group-b', status: 'closed' } },
    ];

    const { container } = render(
      <BGrid<Row>
        width={400}
        height={160}
        columns={columns}
        data={mergeData}
        cellMergeOptions={{ columnsMap: { 0: { mergeBy: 'name' } } }}
      />,
    );

    dragSelect(getCell(container, 2, 0), getCell(container, 0, 0));
    fireEvent.keyDown(document, { key: 'c', ctrlKey: true });

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith('1\r2\r3');
    });
  });
});

describe('BGrid CSS Architecture & Style Contracts', () => {
  interface Row {
    id: number;
    name: string;
  }

  const columns: BGridColumn<Row>[] = [
    { id: 'id', key: 'id', label: 'ID', width: 80, toolbox: true },
    { id: 'name', key: 'name', label: 'Name', width: 120, toolbox: true },
  ];

  const data = [
    { values: { id: 1, name: 'one' } },
    { values: { id: 2, name: 'two' } },
    { values: { id: 3, name: 'three' } },
  ];

  it('renders root and inner structural elements with bgrid-* class names', () => {
    const { container } = render(
      <BGrid<Row>
        width={400}
        height={200}
        columns={columns}
        data={data}
        showLineNumber
        frozenColumnIndex={1}
        page={{ currentPage: 1, pageSize: 10, totalElements: 3, totalPages: 1 }}
      />,
    );

    const root = container.querySelector("[role='grid']");
    expect(root).toHaveClass('bgrid-root');

    const headerContainer = container.querySelector('.bgrid-header-container');
    expect(headerContainer).toBeInTheDocument();

    const bodyContainer = container.querySelector('.bgrid-body-container');
    expect(bodyContainer).toBeInTheDocument();

    const scrollContainer = container.querySelector('.bgrid-scroll-container');
    expect(scrollContainer).toBeInTheDocument();

    const frozenBoundary = container.querySelector('.bgrid-frozen-body-boundary');
    expect(frozenBoundary).toBeInTheDocument();

    const bodyTables = container.querySelectorAll('.bgrid-body-table');
    expect(bodyTables.length).toBeGreaterThanOrEqual(1);

    const footer = container.querySelector('.bgrid-footer-container');
    expect(footer).toBeInTheDocument();

    const footerContent = container.querySelector('.bgrid-footer-content');
    expect(footerContent).toBeInTheDocument();

    const pagination = container.querySelector('.bgrid-pagination');
    expect(pagination).toBeInTheDocument();
  });

  it('renders active and odd row states with semantic attributes and classes', () => {
    const { container } = render(
      <BGrid<Row>
        width={400}
        height={200}
        columns={columns}
        data={data}
        rowKey={'id'}
        selectedRowKey={1}
      />,
    );

    const rows = container.querySelectorAll('.bgrid-body-row');
    expect(rows.length).toBeGreaterThan(0);

    // Selected row (id: 1)
    const activeRow = container.querySelector('.bgrid-body-row.bgrid-row-active');
    expect(activeRow).toBeInTheDocument();

    // Odd rows have data-odd="true"
    const oddRows = container.querySelectorAll('.bgrid-body-row[data-odd="true"]');
    expect(oddRows.length).toBeGreaterThan(0);
  });

  it('renders loading overlay with data-active and data-size attributes', () => {
    const { container, rerender } = render(
      <BGrid<Row>
        width={400}
        height={200}
        columns={columns}
        data={data}
        loading={true}
      />,
    );

    const overlay = container.querySelector('.bgrid-loading-overlay');
    expect(overlay).toBeInTheDocument();
    expect(overlay).toHaveAttribute('data-active', 'true');

    const spinnerBox = container.querySelector('.bgrid-loading-spinner-box');
    expect(spinnerBox).toHaveAttribute('data-size', 'normal');

    rerender(
      <BGrid<Row>
        width={400}
        height={200}
        columns={columns}
        data={data}
        loading={false}
      />,
    );

    const inactiveOverlay = container.querySelector('.bgrid-loading-overlay');
    expect(inactiveOverlay).toHaveAttribute('data-active', 'false');
  });

  it('renders pagination active state correctly', () => {
    const { container } = render(
      <BGrid<Row>
        width={400}
        height={200}
        columns={columns}
        data={data}
        page={{ currentPage: 2, pageSize: 1, totalElements: 3, totalPages: 3 }}
      />,
    );

    const activePage = container.querySelector('.bgrid-page-no[data-active="true"]');
    expect(activePage).toBeInTheDocument();
    expect(activePage?.textContent).toBe('2');
  });

  it('renders toolbox elements and popover with semantic classes and inherits grid CSS variables', async () => {
    const { container } = render(
      <div
        style={{
          ['--bgrid-primary-color' as string]: '#ff0000',
          ['--bgrid-body-bg' as string]: '#112233',
          ['--bgrid-toolbox-control-bg' as string]: '#223344',
          ['--bgrid-toolbox-muted-color' as string]: '#aabbcc',
        }}
      >
        <BGrid<Row>
          width={400}
          height={200}
          columns={columns}
          data={data}
        />
      </div>,
    );

    const wrapper = container.querySelector('.bgrid-head-cell-wrapper');
    expect(wrapper).toBeInTheDocument();

    const triggerBtn = container.querySelector('.bgrid-toolbox-trigger-btn') as HTMLButtonElement;
    expect(triggerBtn).toBeInTheDocument();

    fireEvent.pointerEnter(triggerBtn);
    fireEvent.click(triggerBtn);

    const popover = await waitFor(() => {
      const element = document.body.querySelector('.bgrid-toolbox-popover') as HTMLDivElement | null;
      expect(element).toBeInTheDocument();
      return element;
    });
    expect(popover).toBeInTheDocument();
    expect(popover?.style.getPropertyValue('--bgrid-primary-color')).toBe('#ff0000');
    expect(popover?.style.getPropertyValue('--bgrid-body-bg')).toBe('#112233');
    expect(popover?.style.getPropertyValue('--bgrid-toolbox-control-bg')).toBe('#223344');
    expect(popover?.style.getPropertyValue('--bgrid-toolbox-muted-color')).toBe('#aabbcc');

    // Verify that the popover container and inner elements inherit the theme variables in portal
    const searchInput = popover?.querySelector('.bgrid-toolbox-search-input') as HTMLInputElement | null;
    if (searchInput) {
      expect(popover).toContainElement(searchInput);
    }

    fireEvent.keyDown(document, { key: 'Escape' });
  });

  it('passes theme variables from each respective grid to its opened popover', async () => {
    const { container } = render(
      <div>
        <div id="grid-a" style={{ ['--bgrid-primary-color' as string]: '#111111', ['--bgrid-body-bg' as string]: '#fafafa' }}>
          <BGrid<Row>
            width={400}
            height={150}
            columns={[{ id: 'col_a', key: 'id', label: 'ID A', width: 100, toolbox: true }]}
            data={data}
          />
        </div>
        <div id="grid-b" style={{ ['--bgrid-primary-color' as string]: '#222222', ['--bgrid-body-bg' as string]: '#121212' }}>
          <BGrid<Row>
            width={400}
            height={150}
            columns={[{ id: 'col_b', key: 'id', label: 'ID B', width: 100, toolbox: true }]}
            data={data}
          />
        </div>
      </div>,
    );

    const triggerA = container.querySelector('#grid-a .bgrid-toolbox-trigger-btn') as HTMLButtonElement;
    fireEvent.pointerEnter(triggerA);
    fireEvent.click(triggerA);

    let popover = await waitFor(() => {
      const element = document.body.querySelector('.bgrid-toolbox-popover') as HTMLDivElement | null;
      expect(element).toBeInTheDocument();
      return element;
    });
    expect(popover?.style.getPropertyValue('--bgrid-primary-color')).toBe('#111111');
    expect(popover?.style.getPropertyValue('--bgrid-body-bg')).toBe('#fafafa');

    fireEvent.keyDown(document, { key: 'Escape' });

    const triggerB = container.querySelector('#grid-b .bgrid-toolbox-trigger-btn') as HTMLButtonElement;
    fireEvent.pointerEnter(triggerB);
    fireEvent.click(triggerB);

    popover = await waitFor(() => {
      const element = document.body.querySelector('.bgrid-toolbox-popover') as HTMLDivElement | null;
      expect(element).toBeInTheDocument();
      return element;
    });
    expect(popover?.style.getPropertyValue('--bgrid-primary-color')).toBe('#222222');
    expect(popover?.style.getPropertyValue('--bgrid-body-bg')).toBe('#121212');

    fireEvent.keyDown(document, { key: 'Escape' });
  });

  describe('Bottom Bar rendering', () => {
    it('reserves the custom vertical scrollbar gutter outside the column content width', () => {
      const { container, rerender } = render(
        <BGrid<Row>
          width={400}
          height={200}
          columns={columns}
          data={data}
          scrollbar={{ variant: 'modern' }}
        />,
      );

      const scrollPlane = container.querySelector('.bgrid-scroll-plane') as HTMLElement;
      expect(scrollPlane.style.minWidth).toBe(
        'max(100%, calc(200px + var(--bgrid-scrollbar-modern-gutter-size)))',
      );

      rerender(
        <BGrid<Row>
          width={400}
          height={200}
          columns={columns}
          data={data}
          scrollbar={{ variant: 'native' }}
        />,
      );

      expect(scrollPlane.style.minWidth).toBe('400px');
    });

    it('does not warn when only the preferred bottomBarHeight prop is provided', () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

      render(<BGrid<Row> width={400} height={200} columns={columns} data={data} bottomBarHeight={40} />);

      expect(warn).not.toHaveBeenCalledWith(
        '[BGrid] Both bottomBarHeight and footerHeight were provided. bottomBarHeight takes precedence.',
      );
      warn.mockRestore();
    });

    it('leaves bottomBarHeight below the root-level custom vertical scrollbar', () => {
      const { container } = render(
        <BGrid<Row>
          width={400}
          height={200}
          columns={columns}
          data={data}
          scrollbar={{ variant: 'classic' }}
          status={{ visible: false }}
          pagination={{ visible: false }}
          bottomBarHeight={40}
        />,
      );

      const bodyContainer = container.querySelector('.bgrid-body-container') as HTMLElement;
      expect(bodyContainer.style.height).toBe('128px');

      const root = container.querySelector("[role='grid']") as HTMLElement;
      const verticalScrollbarArea = container.querySelector('.bgrid-vertical-scrollbar-area') as HTMLElement;
      const verticalScrollbarGutter = container.querySelector('.bgrid-vertical-scrollbar-gutter') as HTMLElement;
      expect(verticalScrollbarArea.parentElement).toBe(root);
      expect(verticalScrollbarGutter.parentElement).toBe(root);
      expect(verticalScrollbarArea.style.top).toBe('0px');
      expect(verticalScrollbarArea.style.bottom).toBe('40px');

      expect(root).toHaveAttribute('data-vertical-scrollbar', 'visible');
    });

    it('hides bottom bar if status and pagination are invisible and native scrollbar is used', () => {
      const { container } = render(
        <BGrid<Row>
          width={400}
          height={200}
          columns={columns}
          data={data}
          scrollbar={{ variant: 'native' }}
          status={{ visible: false }}
          pagination={{ visible: false }}
          bottomBarHeight={40}
        />,
      );

      const bodyContainer = container.querySelector('.bgrid-body-container') as HTMLElement;
      expect(bodyContainer.style.height).toBe('168px');

      const root = container.querySelector("[role='grid']") as HTMLElement;
      expect(root).toHaveAttribute('data-vertical-scrollbar', 'hidden');
    });

    it('renders bottom bar elements in order: paging, status, horizontal scrollbar', () => {
      const { container } = render(
        <BGrid<Row>
          width={400}
          height={200}
          columns={columns}
          data={data}
          page={{
            currentPage: 0,
            pageSize: 10,
            totalElements: 100,
            onChange: () => {},
          }}
          status={{ visible: true }}
          scrollbar={{
            variant: 'classic',
          }}
        />,
      );

      const footerContent = container.querySelector('.bgrid-footer-content') as HTMLElement;
      expect(footerContent).toBeTruthy();

      const children = Array.from(footerContent.children);
      expect(children.length).toBe(3);
      expect(children[0]).toHaveClass('bgrid-footer-paging');
      expect(children[1]).toHaveClass('bgrid-footer-status');
      expect(children[2]).toHaveClass('bgrid-horizontal-scrollbar-area-bottom');
      expect(children[2].querySelector('.bgrid-custom-scrollbar-horizontal')).toBeTruthy();
    });
  });
});
