import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BGrid } from '../beautiful-grid';
import { BGridColumn, BGridDataControl, BGridDataQuery } from '../beautiful-grid/types';

describe('Header Toolbox & DataControl Integration', () => {
  const sampleData = [
    { values: { id: 1, name: 'Apple', category: 'Fruit', price: 1000 } },
    { values: { id: 2, name: 'Banana', category: 'Fruit', price: 2000 } },
    { values: { id: 3, name: 'Carrot', category: 'Vegetable', price: 1500 } },
    { values: { id: 4, name: 'Donut', category: 'Snack', price: 3000 } },
  ];

  const columns: BGridColumn<any>[] = [
    {
      id: 'col_id',
      key: 'id',
      label: 'ID',
      width: 80,
      toolbox: true,
      filter: { type: 'number' },
    },
    {
      id: 'col_name',
      key: 'name',
      label: 'Name',
      width: 120,
      toolbox: true,
      filter: { type: 'text' },
    },
    {
      id: 'col_category',
      key: 'category',
      label: 'Category',
      width: 120,
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'col_price',
      key: 'price',
      label: 'Price',
      width: 100,
      toolbox: true,
      filter: { type: 'number' },
    },
  ];

  async function openToolbox(button: HTMLElement) {
    fireEvent.pointerEnter(button);
    fireEvent.click(button);
    return screen.findByRole('dialog');
  }

  it('renders toolbox trigger button on header columns with toolbox: true', () => {
    const dataControl: BGridDataControl = {
      mode: 'client',
      query: { sortParams: [], filterParams: [] },
      onChange: vi.fn(),
    };

    render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        dataControl={dataControl}
      />,
    );

    const buttons = screen.getAllByTitle('컬럼 옵션 열기');
    expect(buttons.length).toBe(4);
  });

  it('opens toolbox popover on trigger button click and allows text filtering', async () => {
    let currentQuery: BGridDataQuery = { sortParams: [], filterParams: [] };
    const onChange = vi.fn((nextQuery: BGridDataQuery) => {
      currentQuery = nextQuery;
    });

    const { rerender } = render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        dataControl={{
          mode: 'client',
          query: currentQuery,
          onChange,
        }}
      />,
    );

    // Click 'Name' column toolbox button
    const buttons = screen.getAllByTitle('컬럼 옵션 열기');
    const dialog = await openToolbox(buttons[1]); // Name column

    // Popover should appear with role="dialog"
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('텍스트 필터')).toBeInTheDocument();

    // Type 'apple' into text filter input
    const input = screen.getByPlaceholderText('검색어 입력...');
    fireEvent.change(input, { target: { value: 'Apple' } });

    // Click '적용'
    const applyBtn = screen.getByRole('button', { name: '적용' });
    fireEvent.click(applyBtn);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(currentQuery.filterParams).toHaveLength(1);
    expect(currentQuery.filterParams[0]).toEqual({
      columnId: 'col_name',
      key: 'name',
      type: 'text',
      operator: 'contains',
      value: 'Apple',
    });

    // Re-render with updated query
    rerender(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        dataControl={{
          mode: 'client',
          query: currentQuery,
          onChange,
        }}
      />,
    );

    // Only Apple should be visible
    expect(screen.getByText('Apple')).toBeInTheDocument();
    expect(screen.queryByText('Banana')).not.toBeInTheDocument();
  });

  it('preserves sourceIndex in onClick and rowChecked.onChange when filtered and sorted', async () => {
    const handleClick = vi.fn();
    const handleCheckedChange = vi.fn();

    // Filter: only Fruit (Apple id:1 -> sourceIndex 0, Banana id:2 -> sourceIndex 1)
    // Sort: Name descending -> [Banana (sourceIndex 1), Apple (sourceIndex 0)]
    const query: BGridDataQuery = {
      sortParams: [{ columnId: 'col_name', key: 'name', orderBy: 'desc' }],
      filterParams: [
        { columnId: 'col_category', key: 'category', type: 'values', values: ['Fruit'] },
      ],
    };

    render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        dataControl={{
          mode: 'client',
          query,
          onChange: vi.fn(),
        }}
        rowKey="id"
        rowChecked={{
          checkedIndexes: [],
          onChange: handleCheckedChange,
        }}
        onClick={handleClick}
      />,
    );

    // First visible row should be Banana
    const bananaCell = screen.getByText('Banana');
    expect(bananaCell).toBeInTheDocument();

    // Click on Banana cell
    fireEvent.click(bananaCell);

    // Banana's sourceIndex is 1 in sampleData
    expect(handleClick).toHaveBeenCalledWith(
      expect.objectContaining({
        index: 1, // sourceIndex, not visibleIndex 0!
        item: expect.objectContaining({ name: 'Banana', id: 2 }),
      }),
    );
  });

  it('closes popover on Escape key press', async () => {
    render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        dataControl={{
          mode: 'client',
          query: { sortParams: [], filterParams: [] },
          onChange: vi.fn(),
        }}
      />,
    );

    const buttons = screen.getAllByTitle('컬럼 옵션 열기');
    expect(await openToolbox(buttons[0])).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('correctly calculates checkedAll based on visible rows intersection when filtered', () => {
    const handleCheckedChange = vi.fn();

    // Filter: only Fruit (Apple id:1 -> sourceIndex 0, Banana id:2 -> sourceIndex 1)
    // sampleData has 4 items total.
    // Checked items: Carrot (sourceIndex 2) and Donut (sourceIndex 3)
    // Both checked items are HIDDEN by filter!
    // Visible items (Apple, Banana) are NOT checked.
    // Therefore checkedAll MUST be false, NOT indeterminate or true!
    const query: BGridDataQuery = {
      sortParams: [],
      filterParams: [
        { columnId: 'col_category', key: 'category', type: 'values', values: ['Fruit'] },
      ],
    };

    const { rerender } = render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        dataControl={{
          mode: 'client',
          query,
          onChange: vi.fn(),
        }}
        rowKey="id"
        rowChecked={{
          checkedIndexes: [2, 3], // Carrot, Donut (hidden)
          onChange: handleCheckedChange,
        }}
      />,
    );

    // The header checkbox should NOT be checked or indeterminate (visible checked count is 0)
    const headerCheckboxes = screen.getAllByRole('checkbox');
    const headerCheckbox = headerCheckboxes[0]; // first checkbox in the table (header)
    expect(headerCheckbox.getAttribute('aria-checked')).toBe('false');
    expect(headerCheckbox.classList.contains('bgrid-row-selector--checked')).toBe(false);
    expect(headerCheckbox.classList.contains('bgrid-row-selector--indeterminate')).toBe(false);

    // Now check Apple (sourceIndex 0) -> visibleCheckedCount becomes 1 out of 2 visible rows -> indeterminate!
    rerender(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        dataControl={{
          mode: 'client',
          query,
          onChange: vi.fn(),
        }}
        rowKey="id"
        rowChecked={{
          checkedIndexes: [0, 2, 3], // Apple (visible) + Carrot, Donut (hidden)
          onChange: handleCheckedChange,
        }}
      />,
    );

    // Visible 1 of 2 is checked -> header checkbox should be indeterminate (aria-checked="mixed")
    const updatedHeaderCheckbox = screen.getAllByRole('checkbox')[0];
    expect(updatedHeaderCheckbox.getAttribute('aria-checked')).toBe('mixed');
    expect(updatedHeaderCheckbox.classList.contains('bgrid-row-selector--indeterminate')).toBe(true);
  });

  it('disables apply button on invalid number filter draft (min > max or empty)', async () => {
    render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        dataControl={{
          mode: 'client',
          query: { sortParams: [], filterParams: [] },
          onChange: vi.fn(),
        }}
      />,
    );

    // Open Price column number filter
    const buttons = screen.getAllByTitle('컬럼 옵션 열기');
    await openToolbox(buttons[3]); // Price column

    // Switch operator to between
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'between' } });

    const minInput = screen.getByPlaceholderText('최소값');
    const maxInput = screen.getByPlaceholderText('최대값');

    // Invalid range: min 3000 > max 1000
    fireEvent.change(minInput, { target: { value: '3000' } });
    fireEvent.change(maxInput, { target: { value: '1000' } });

    expect(screen.getByText('최소값이 최대값보다 클 수 없습니다.')).toBeInTheDocument();

    const applyBtn = screen.getByRole('button', { name: '적용' });
    expect(applyBtn).toBeDisabled();
  });

  it('applies a number filter on Enter, consumes the key event, and keeps the popover closed', async () => {
    let currentQuery: BGridDataQuery = { sortParams: [], filterParams: [] };
    const onChange = vi.fn((nextQuery: BGridDataQuery) => {
      currentQuery = nextQuery;
    });

    render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        dataControl={{ mode: 'client', query: currentQuery, onChange }}
      />,
    );

    const idToolboxButton = screen.getAllByTitle('컬럼 옵션 열기')[0];
    await openToolbox(idToolboxButton);

    const input = screen.getByPlaceholderText('숫자 입력...');
    fireEvent.change(input, { target: { value: '2' } });

    expect(fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' })).toBe(false);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(currentQuery.filterParams).toEqual([
      {
        columnId: 'col_id',
        key: 'id',
        type: 'number',
        operator: 'gte',
        value: 2,
      },
    ]);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(idToolboxButton).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes popover when external query changes', async () => {
    let currentQuery: BGridDataQuery = { sortParams: [], filterParams: [] };

    const { container, rerender } = render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        dataControl={{
          mode: 'client',
          query: currentQuery,
          onChange: vi.fn(),
        }}
      />,
    );

    const buttons = screen.getAllByTitle('컬럼 옵션 열기');
    expect(await openToolbox(buttons[0])).toBeInTheDocument();

    const scrollContainer = container.querySelector("[role='rfdg-scroll-container']") as HTMLDivElement;
    scrollContainer.scrollTop = 80;

    // External query updates
    currentQuery = {
      sortParams: [{ columnId: 'col_name', key: 'name', orderBy: 'asc' }],
      filterParams: [],
    };

    rerender(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        dataControl={{
          mode: 'client',
          query: currentQuery,
          onChange: vi.fn(),
        }}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(scrollContainer.scrollTop).toBe(0);
  });

  it('toggles column sort when header label is clicked in dataControl mode', () => {
    let currentQuery: BGridDataQuery = { sortParams: [], filterParams: [] };
    const onChange = vi.fn((nextQuery: BGridDataQuery) => {
      currentQuery = nextQuery;
    });

    render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        dataControl={{
          mode: 'client',
          query: currentQuery,
          onChange,
        }}
      />,
    );

    // Click on 'Name' header label text (not the toolbox trigger button)
    const nameLabel = screen.getByText('Name');
    fireEvent.click(nameLabel);

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(currentQuery.sortParams[0]).toEqual(
      expect.objectContaining({
        columnId: 'col_name',
        orderBy: 'asc',
      }),
    );
  });

  it('keeps legacy sort params immutable while deriving sort indexes', () => {
    const sortParam = { key: 'name', orderBy: 'asc' as const };
    const original = { ...sortParam };

    render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns.map(column => ({ ...column, toolbox: false }))}
        sort={{ sortParams: [sortParam], onChange: vi.fn() }}
      />,
    );

    expect(sortParam).toEqual(original);
    expect(sortParam).not.toHaveProperty('index');
  });

  it('disables duplicate-id toolboxes and warns only once per grid', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const duplicateColumns: BGridColumn<any>[] = [
      { id: 'duplicate', key: 'name', label: 'Name', width: 120, toolbox: true },
      { id: 'duplicate', key: 'category', label: 'Category', width: 120, toolbox: true },
    ];
    const dataControl: BGridDataControl = {
      mode: 'client',
      query: { sortParams: [], filterParams: [] },
      onChange: vi.fn(),
    };

    const { rerender } = render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={duplicateColumns}
        dataControl={dataControl}
      />,
    );

    expect(screen.queryAllByTitle('컬럼 옵션 열기')).toHaveLength(0);
    await waitFor(() => expect(warn).toHaveBeenCalledTimes(1));

    rerender(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={[...duplicateColumns]}
        dataControl={dataControl}
      />,
    );

    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('warns once when dataControl references an unknown column id', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const query: BGridDataQuery = {
      sortParams: [{ columnId: 'missing', orderBy: 'asc' }],
      filterParams: [],
    };

    const { rerender } = render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        dataControl={{ mode: 'client', query, onChange: vi.fn() }}
      />,
    );

    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        '[BGrid] Query references unknown column IDs: missing. Those sort/filter entries are ignored.',
      ),
    );

    rerender(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={[...columns]}
        dataControl={{ mode: 'client', query, onChange: vi.fn() }}
      />,
    );
    expect(warn).toHaveBeenCalledTimes(1);
    warn.mockRestore();
  });

  it('uses manual mode by default for configured values filters', async () => {
    const manualColumns: BGridColumn<any>[] = [
      {
        id: 'category',
        key: 'category',
        label: 'Category',
        width: 140,
        toolbox: { filter: true },
        filter: { type: 'values', values: ['Server-only'] },
      },
    ];

    render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={manualColumns}
        dataControl={{
          query: { sortParams: [], filterParams: [] },
          onChange: vi.fn(),
        }}
      />,
    );

    const dialog = await openToolbox(screen.getByTitle('컬럼 옵션 열기'));
    expect(dialog).toHaveTextContent('Server-only');
    expect(dialog).not.toHaveTextContent('Fruit');
    expect(dialog).not.toHaveTextContent('정렬');
  });

  it('disables row reordering while a client query is active', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const { container } = render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        showLineNumber
        reorder={{ enabled: true, onReorder: vi.fn() }}
        dataControl={{
          mode: 'client',
          query: {
            sortParams: [{ columnId: 'col_name', key: 'name', orderBy: 'asc' }],
            filterParams: [],
          },
          onChange: vi.fn(),
        }}
      />,
    );

    expect(container.querySelector('.drag-handle')).not.toBeInTheDocument();
    await waitFor(() =>
      expect(warn).toHaveBeenCalledWith(
        '[BGrid] Row reordering is disabled while a client-side sort or filter is active.',
      ),
    );
    warn.mockRestore();
  });

  it('creates unique toolbox aria ids across grid instances', async () => {
    render(
      <>
        <BGrid
          width={600}
          height={300}
          data={sampleData}
          columns={columns}
          dataControl={{ mode: 'client', query: { sortParams: [], filterParams: [] }, onChange: vi.fn() }}
        />
        <BGrid
          width={600}
          height={300}
          data={sampleData}
          columns={columns}
          dataControl={{ mode: 'client', query: { sortParams: [], filterParams: [] }, onChange: vi.fn() }}
        />
      </>,
    );

    const buttons = screen.getAllByTitle('컬럼 옵션 열기');
    const buttonIds = buttons.map(button => button.id);
    const dialogIds = buttons.map(button => button.getAttribute('aria-controls'));
    expect(new Set(buttonIds).size).toBe(buttonIds.length);
    expect(new Set(dialogIds).size).toBe(dialogIds.length);

    expect(await openToolbox(buttons[0])).toHaveAttribute('id', dialogIds[0]);
  });

  it('opens the correct toolbox in grouped frozen and regular headers', async () => {
    render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        columnsGroup={[{ label: 'Product', groupStartIndex: 0, groupEndIndex: 1 }]}
        frozenColumnIndex={1}
        dataControl={{ mode: 'client', query: { sortParams: [], filterParams: [] }, onChange: vi.fn() }}
      />,
    );

    const buttons = screen.getAllByTitle('컬럼 옵션 열기');
    expect(buttons).toHaveLength(4);

    expect(await openToolbox(buttons[0])).toHaveAttribute('aria-labelledby', buttons[0].id);
    fireEvent.keyDown(document, { key: 'Escape' });

    expect(await openToolbox(buttons[1])).toHaveAttribute('aria-labelledby', buttons[1].id);
  });

  it('removes global toolbox listeners when the popover unmounts', async () => {
    const removeDocumentListener = vi.spyOn(document, 'removeEventListener');
    const removeWindowListener = vi.spyOn(window, 'removeEventListener');
    const observe = vi.fn();
    const disconnect = vi.fn();
    vi.stubGlobal(
      'ResizeObserver',
      vi.fn(function ResizeObserverMock() {
        return { observe, disconnect };
      }),
    );

    const { unmount } = render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        dataControl={{ mode: 'client', query: { sortParams: [], filterParams: [] }, onChange: vi.fn() }}
      />,
    );

    await openToolbox(screen.getAllByTitle('컬럼 옵션 열기')[0]);
    unmount();

    expect(removeDocumentListener).toHaveBeenCalledWith('keydown', expect.any(Function), true);
    expect(removeDocumentListener).toHaveBeenCalledWith('mousedown', expect.any(Function), true);
    expect(removeWindowListener).toHaveBeenCalledWith('resize', expect.any(Function));
    expect(removeWindowListener).toHaveBeenCalledWith('scroll', expect.any(Function), true);
    expect(observe).toHaveBeenCalledTimes(4);
    expect(disconnect).toHaveBeenCalledTimes(2);

    removeDocumentListener.mockRestore();
    removeWindowListener.mockRestore();
    vi.unstubAllGlobals();
  });

  it('toggles a row checkbox with the keyboard', async () => {
    const onChange = vi.fn();

    render(
      <BGrid
        width={600}
        height={300}
        data={sampleData}
        columns={columns}
        rowKey="id"
        rowChecked={{ checkedIndexes: [], onChange }}
      />,
    );

    const rowCheckbox = screen.getAllByRole('checkbox')[1];
    fireEvent.keyDown(rowCheckbox, { key: ' ' });

    await waitFor(() =>
      expect(onChange).toHaveBeenCalledWith([0], [1], 'indeterminate'),
    );
  });
});
