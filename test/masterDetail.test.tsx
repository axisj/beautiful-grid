import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BGrid } from '../beautiful-grid/BGrid';

const columns = [
  { id: 'orderId', key: 'orderId', label: 'Order ID', width: 120 },
  { id: 'customer', key: 'customer', label: 'Customer', width: 160 },
];

const data = [
  { values: { orderId: 'ORD-1', customer: 'Alice', items: [{ name: 'Item 1', qty: 2 }] } },
  { values: { orderId: 'ORD-2', customer: 'Bob', items: [] } },
  { values: { orderId: 'ORD-3', customer: 'Charlie', items: [{ name: 'Item 2', qty: 1 }] } },
];

describe('BGrid master-detail', () => {
  it('supports uncontrolled expansion with accessible toggle buttons', () => {
    render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={data}
        rowKey='orderId'
        masterDetail={{
          detailRender: ({ item }) => (
            <div data-testid={`detail-${item.values.orderId}`}>
              Detail for {item.values.customer}
            </div>
          ),
          detailRowHeight: 150,
          expandColumnId: 'orderId',
        }}
      />,
    );

    // Details should be collapsed initially
    expect(screen.queryByTestId('detail-ORD-1')).not.toBeInTheDocument();

    const expandButtons = screen.getAllByRole('button', { name: 'Expand row' });
    expect(expandButtons.length).toBe(3);

    // First toggle button
    const firstToggle = expandButtons[0];
    expect(firstToggle).toHaveAttribute('aria-expanded', 'false');

    // Expand ORD-1
    fireEvent.click(firstToggle);
    expect(firstToggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByTestId('detail-ORD-1')).toBeInTheDocument();
    expect(screen.getByText('Detail for Alice')).toBeInTheDocument();

    // Verify detail region attributes
    const detailRegion = screen.getByTestId('detail-ORD-1').closest('.bgrid-master-detail-panel')!;
    expect(detailRegion).toHaveAttribute('role', 'region');
    expect(detailRegion).toHaveAttribute('aria-labelledby', firstToggle.id);
    expect(firstToggle).toHaveAttribute('aria-controls', detailRegion.id);

    // Collapse ORD-1
    fireEvent.click(firstToggle);
    expect(firstToggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByTestId('detail-ORD-1')).not.toBeInTheDocument();
  });

  it('supports controlled expansion and collapse callback', () => {
    const onExpandedRowKeysChange = vi.fn();
    let currentCollapse: (() => void) | undefined;

    const { rerender } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={data}
        rowKey='orderId'
        masterDetail={{
          expandedRowKeys: ['ORD-1'],
          onExpandedRowKeysChange,
          detailRender: ({ item, collapse }) => {
            currentCollapse = collapse;
            return (
              <div data-testid={`detail-${item.values.orderId}`}>
                <button onClick={collapse}>Close Detail</button>
              </div>
            );
          },
        }}
      />,
    );

    expect(screen.getByTestId('detail-ORD-1')).toBeInTheDocument();

    // Click toggle button to collapse
    const collapseToggle = screen.getByRole('button', { name: 'Collapse row' });
    fireEvent.click(collapseToggle);

    expect(onExpandedRowKeysChange).toHaveBeenCalledWith([], {
      rowKey: 'ORD-1',
      expanded: false,
      item: data[0],
      sourceIndex: 0,
    });

    // Parent updates controlled props to empty
    rerender(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={data}
        rowKey='orderId'
        masterDetail={{
          expandedRowKeys: [],
          onExpandedRowKeysChange,
          detailRender: () => null,
        }}
      />,
    );

    expect(screen.queryByTestId('detail-ORD-1')).not.toBeInTheDocument();
  });

  it('supports accordion single expand mode', () => {
    const onChange = vi.fn();
    render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={data}
        rowKey='orderId'
        masterDetail={{
          expandMode: 'single',
          defaultExpandedRowKeys: ['ORD-1'],
          onExpandedRowKeysChange: onChange,
          detailRender: ({ item }) => <div>Detail for {item.values.orderId}</div>,
        }}
      />,
    );

    expect(screen.getByText('Detail for ORD-1')).toBeInTheDocument();

    // Expand second row
    const expandButtons = screen.getAllByRole('button', { name: 'Expand row' });
    fireEvent.click(expandButtons[0]); // ORD-2's expand button

    expect(onChange).toHaveBeenCalledWith(['ORD-2'], {
      rowKey: 'ORD-2',
      expanded: true,
      item: data[1],
      sourceIndex: 1,
    });

    // In single mode, ORD-1 is closed and ORD-2 is open
    expect(screen.queryByText('Detail for ORD-1')).not.toBeInTheDocument();
    expect(screen.getByText('Detail for ORD-2')).toBeInTheDocument();
  });

  it('skips rows without detail when resolving controlled single mode keys', () => {
    const renderGrid = (firstHasDetail: boolean) => (
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={data}
        rowKey='orderId'
        masterDetail={{
          expandMode: 'single',
          expandedRowKeys: ['ORD-1', 'ORD-3'],
          hasDetail: item => item.values.orderId !== 'ORD-1' || firstHasDetail,
          detailRender: ({ item }) => <div data-testid={`detail-${item.values.orderId}`} />,
        }}
      />
    );

    const { rerender } = render(renderGrid(true));
    expect(screen.getByTestId('detail-ORD-1')).toBeInTheDocument();
    expect(screen.queryByTestId('detail-ORD-3')).not.toBeInTheDocument();

    rerender(renderGrid(false));
    expect(screen.queryByTestId('detail-ORD-1')).not.toBeInTheDocument();
    expect(screen.getByTestId('detail-ORD-3')).toBeInTheDocument();
  });

  it('keeps toggle and region IDs distinct for row keys with similar characters', () => {
    const keyedData = ['a.b', 'a/b', '1', 1].map(orderId => ({ values: { orderId, customer: String(orderId) } }));
    const { container } = render(
      <BGrid
        width={500}
        height={400}
        columns={columns}
        data={keyedData}
        rowKey='orderId'
        masterDetail={{
          defaultExpandedRowKeys: ['a.b', 'a/b', '1', 1],
          detailRender: ({ rowKey }) => <div>{String(rowKey)}</div>,
        }}
      />,
    );

    const toggles = Array.from(container.querySelectorAll<HTMLButtonElement>('.bgrid-master-detail-toggle'));
    expect(toggles).toHaveLength(4);
    expect(new Set(toggles.map(toggle => toggle.id)).size).toBe(4);
    const regions = Array.from(container.querySelectorAll<HTMLElement>('.bgrid-master-detail-panel'));
    expect(regions).toHaveLength(4);
    expect(new Set(regions.map(region => region.id)).size).toBe(4);
    for (const toggle of toggles) {
      const region = regions.find(candidate => candidate.id === toggle.getAttribute('aria-controls'));
      expect(region).toHaveAttribute('aria-labelledby', toggle.id);
    }
  });

  it('respects hasDetail and renders spacer for non-expandable rows', () => {
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={data}
        rowKey='orderId'
        masterDetail={{
          hasDetail: item => item.values.items.length > 0,
          detailRender: ({ item }) => <div>{item.values.orderId}</div>,
        }}
      />,
    );

    // ORD-1 and ORD-3 have items, ORD-2 has empty items
    const rows = container.querySelectorAll('.bgrid-body-row');
    expect(rows.length).toBe(3);

    // Row 0 has a toggle button
    expect(rows[0].querySelector('.bgrid-master-detail-toggle')).not.toBeNull();
    // Row 1 has a spacer instead of a button
    expect(rows[1].querySelector('.bgrid-master-detail-toggle')).toBeNull();
    expect(rows[1].querySelector('.bgrid-master-detail-toggle-spacer')).not.toBeNull();
    // Row 2 has a toggle button
    expect(rows[2].querySelector('.bgrid-master-detail-toggle')).not.toBeNull();
  });

  it('renders nested BGrid and isolates interactions from the parent grid', () => {
    const itemColumns = [
      { id: 'name', key: 'name', label: 'Item Name', width: 120 },
      { id: 'qty', key: 'qty', label: 'Quantity', width: 80 },
    ];

    const { container } = render(
      <BGrid
        width={600}
        height={400}
        columns={columns}
        data={data}
        rowKey='orderId'
        masterDetail={{
          defaultExpandedRowKeys: ['ORD-1'],
          detailRowHeight: 180,
          detailRender: ({ item }) => (
            <div data-testid='nested-container'>
              <input data-testid='detail-input' placeholder='Notes' />
              <BGrid
                width={400}
                height={120}
                columns={itemColumns}
                data={item.values.items.map((it: any) => ({ values: it }))}
                rowKey='name'
              />
            </div>
          ),
        }}
      />,
    );

    expect(screen.getByTestId('nested-container')).toBeInTheDocument();

    const input = screen.getByTestId('detail-input');
    input.focus();

    // Typing and arrow keys inside detail input shouldn't affect master grid
    fireEvent.keyDown(input, { key: 'ArrowDown', code: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Escape', code: 'Escape' });

    // Pointer down inside nested detail should not start parent cell selection
    fireEvent.pointerDown(input);

    const masterTable = container.querySelector('.bgrid-root')!;
    expect(masterTable).not.toHaveClass('bgrid-cell-selecting');
  });

  it('warns in development when rowKey is missing or feature conflicts occur', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    render(
      <BGrid
        width={400}
        height={200}
        columns={columns}
        data={data}
        // rowKey is intentionally missing
        masterDetail={{
          detailRender: () => null,
        }}
      />,
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[BGrid] masterDetail requires rowKey. Falling back to flat rows.'),
    );

    warnSpy.mockRestore();
  });

  it('renders semantic detail row in tbody and matching frozen spacer row when frozen columns exist', () => {
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={data}
        rowKey='orderId'
        frozenColumnIndex={1}
        masterDetail={{
          defaultExpandedRowKeys: ['ORD-1'],
          detailRowHeight: 120,
          detailRender: ({ item }) => <div>Detail for {item.values.customer}</div>,
        }}
      />,
    );

    const detailRow = container.querySelector('tr.bgrid-detail-row');
    expect(detailRow).not.toBeNull();
    expect(detailRow).not.toHaveAttribute('data-ri');
    expect(detailRow).toHaveAttribute('data-detail-ri', '0');
    const detailCell = detailRow?.querySelector('td.bgrid-detail-cell');
    expect(detailCell).not.toBeNull();
    expect(detailCell).toHaveAttribute('colspan', String(columns.length - 1));
    expect(detailRow?.querySelector('td[data-none="true"]')).not.toBeNull();

    const frozenDetailRow = container.querySelector('tr.bgrid-detail-frozen-row');
    expect(frozenDetailRow).not.toBeNull();
    expect(frozenDetailRow).not.toHaveAttribute('data-ri');
    expect(frozenDetailRow).toHaveAttribute('data-detail-ri', '0');
    expect(frozenDetailRow).toHaveAttribute('aria-hidden', 'true');
    expect(frozenDetailRow).toHaveStyle({ height: '120px' });
    const frozenDetailCell = frozenDetailRow?.querySelector('td');
    expect(frozenDetailCell).not.toBeNull();
    expect(frozenDetailCell).toHaveAttribute('colspan', '1');
  });

  it('does not propagate master row hover to detail row and limits panel width', () => {
    const { container } = render(
      <BGrid
        width={600}
        height={300}
        columns={columns}
        data={data}
        rowKey='orderId'
        masterDetail={{
          defaultExpandedRowKeys: ['ORD-1'],
          detailRowHeight: 100,
          detailRender: () => <div data-testid='detail-content'>Detail Content</div>,
        }}
      />,
    );

    const masterRow = container.querySelector('tr.bgrid-body-row[data-ri="0"]');
    const detailRow = container.querySelector('tr.bgrid-detail-row');
    expect(masterRow).not.toBeNull();
    expect(detailRow).not.toBeNull();

    // Trigger pointer over on master row
    fireEvent.pointerOver(masterRow!);
    expect(masterRow).toHaveClass('bgrid-row-hover');
    expect(detailRow).not.toHaveClass('bgrid-row-hover');

    const panel = container.querySelector('.bgrid-master-detail-panel');
    expect(panel).not.toBeNull();
    expect(panel).toHaveStyle({ maxWidth: '100%' });
  });

  it('isolates events, hover, and active cell state between master grid and nested child grid', () => {
    const nestedColumns = [
      { id: 'name', key: 'name', label: 'Item Name', width: 100 },
      { id: 'qty', key: 'qty', label: 'Qty', width: 60 },
    ];
    const { container } = render(
      <BGrid
        width={600}
        height={400}
        columns={columns}
        data={data}
        rowKey='orderId'
        masterDetail={{
          defaultExpandedRowKeys: ['ORD-1'],
          detailRowHeight: 160,
          detailRender: ({ item }) => (
            <BGrid
              width={400}
              height={140}
              columns={nestedColumns}
              data={item.values.items.map((it: any) => ({ values: it }))}
              rowKey='name'
            />
          ),
        }}
      />,
    );

    // Find master grid and nested grid
    const grids = container.querySelectorAll('[role="grid"]');
    expect(grids.length).toBe(2);
    const masterGrid = grids[0];
    const nestedGrid = grids[1];

    // Find cell in nested grid and click it
    const nestedCell = nestedGrid.querySelector('td[data-bgrid-cell="true"]');
    expect(nestedCell).not.toBeNull();
    fireEvent.pointerDown(nestedCell!, { button: 0 });

    // Nested cell should become active in nested grid
    expect(nestedCell).toHaveClass('bgrid-cell-active');

    // Master grid should not have active cell
    const masterActiveCells = Array.from(masterGrid.querySelectorAll('.bgrid-cell-active')).filter(
      cell => cell.closest('[role="grid"]') === masterGrid,
    );
    expect(masterActiveCells.length).toBe(0);

    // Hover on master row 0
    const masterRow0 = masterGrid.querySelector('tr.bgrid-body-row[data-ri="0"]');
    expect(masterRow0).not.toBeNull();
    fireEvent.pointerOver(masterRow0!);

    // Nested row 0 must not receive bgrid-row-hover
    const nestedRow0 = nestedGrid.querySelector('tr[data-ri="0"]');
    expect(nestedRow0).not.toBeNull();
    expect(nestedRow0).not.toHaveClass('bgrid-row-hover');
  });

  it('allows master row focus and arrow key navigation when a child grid is expanded', () => {
    const nestedColumns = [
      { id: 'name', key: 'name', label: 'Item Name', width: 100 },
      { id: 'qty', key: 'qty', label: 'Qty', width: 60 },
    ];
    const { container } = render(
      <BGrid
        width={600}
        height={400}
        columns={columns}
        data={data}
        rowKey='orderId'
        masterDetail={{
          defaultExpandedRowKeys: ['ORD-1'],
          detailRowHeight: 160,
          detailRender: ({ item }) => (
            <BGrid
              width={400}
              height={140}
              columns={nestedColumns}
              data={item.values.items.map((it: any) => ({ values: it }))}
              rowKey='name'
            />
          ),
        }}
      />,
    );

    const grids = container.querySelectorAll('[role="grid"]');
    const masterGrid = grids[0];
    const nestedGrid = grids[1];

    // Master grid has its own gateway
    const masterGateways = Array.from(
      masterGrid.querySelectorAll<HTMLInputElement>('[data-bgrid-text-editor-gateway="true"]'),
    ).filter(el => el.closest('[role="grid"]') === masterGrid);
    expect(masterGateways.length).toBe(1);
    const masterGateway = masterGateways[0];

    // Find master cell row 0, col 0 (ORD-1) and pointerDown
    const masterCellRow0 = Array.from(
      masterGrid.querySelectorAll<HTMLElement>('td[data-bgrid-cell="true"][data-row-index="0"][data-column-index="0"]'),
    ).find(td => td.closest('[role="grid"]') === masterGrid)!;
    expect(masterCellRow0).toBeDefined();

    fireEvent.pointerDown(masterCellRow0, { button: 0 });

    // Master container focus event should focus masterGateway, not nestedGateway
    fireEvent.focus(masterGrid);
    expect(document.activeElement).toBe(masterGateway);

    // Master row 0 col 0 is active
    expect(masterCellRow0).toHaveClass('bgrid-cell-active');

    // Press ArrowDown on masterGateway
    fireEvent.keyDown(masterGateway, { key: 'ArrowDown', code: 'ArrowDown' });

    // Active cell should move to row 1 col 0
    const masterCellRow1 = Array.from(
      masterGrid.querySelectorAll<HTMLElement>('td[data-bgrid-cell="true"][data-row-index="1"][data-column-index="0"]'),
    ).find(td => td.closest('[role="grid"]') === masterGrid)!;
    expect(masterCellRow1).toHaveClass('bgrid-cell-active');
    expect(masterCellRow0).not.toHaveClass('bgrid-cell-active');

    // Press ArrowRight on masterGateway
    fireEvent.keyDown(masterGateway, { key: 'ArrowRight', code: 'ArrowRight' });

    // Active cell should move to row 1 col 1
    const masterCellRow1Col1 = Array.from(
      masterGrid.querySelectorAll<HTMLElement>('td[data-bgrid-cell="true"][data-row-index="1"][data-column-index="1"]'),
    ).find(td => td.closest('[role="grid"]') === masterGrid)!;
    expect(masterCellRow1Col1).toHaveClass('bgrid-cell-active');
  });

  it('offsets sticky detail panel left position by frozenColumnsWidth when showLineNumber or frozen columns exist', () => {
    const { container } = render(
      <BGrid
        width={800}
        height={400}
        columns={columns}
        data={data}
        rowKey='orderId'
        showLineNumber
        masterDetail={{
          defaultExpandedRowKeys: ['ORD-1'],
          detailRender: () => <div data-testid='detail-content'>Order Items</div>,
        }}
      />,
    );

    const panel = container.querySelector('.bgrid-master-detail-panel') as HTMLElement;
    expect(panel).toBeTruthy();
    // With showLineNumber=true, getLineNumberWidth returns line number column width
    // Panel should have sticky positioning with left offset matching frozenColumnsWidth (> 0)
    expect(panel.style.position).toBe('sticky');
    expect(parseInt(panel.style.left, 10)).toBeGreaterThan(0);
  });
});
