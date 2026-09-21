import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { BGrid, BGridColumn } from '../beautiful-grid';

describe('BGrid live column resize', () => {
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

  it('updates the visible column width while a pointer drag is still active', async () => {
    function ControlledGrid() {
      const [controlledColumns, setControlledColumns] = useState(columns);

      return (
        <BGrid<Row>
          width={400}
          height={140}
          columns={controlledColumns}
          data={data}
          onChangeColumns={(_columnIndex, { columns }) => {
            setControlledColumns(columns);
          }}
        />
      );
    }

    const { container } = render(<ControlledGrid />);
    const headerCell = container.querySelector(
      "[role='rfdg-head'] [data-column-index='1']",
    ) as HTMLTableCellElement | null;
    const resizeHandle = headerCell?.querySelector('.bgrid-col-resizer-handle') as HTMLDivElement | null;
    const bodyCol = container.querySelector("[role='rfdg-body']")?.closest('table')?.querySelectorAll('col')[1];

    expect(headerCell).toBeTruthy();
    expect(resizeHandle).toBeTruthy();
    expect(bodyCol).toBeTruthy();
    expect(bodyCol?.getAttribute('width')).toBe('100');
    setElementRect(headerCell as HTMLTableCellElement, {
      left: 100,
      top: 0,
      right: 200,
      bottom: 28,
      width: 100,
      height: 28,
    });

    act(() => {
      fireEvent.pointerDown(resizeHandle as HTMLDivElement, { pointerId: 15, clientX: 200, clientY: 14 });
      window.dispatchEvent(createPointerEvent('pointermove', 15, 280, 14));
    });

    await waitFor(() => {
      expect(bodyCol?.getAttribute('width')).toBe('181');
    });

    act(() => {
      window.dispatchEvent(createPointerEvent('pointerup', 15, 280, 14));
    });
  });

  it('uses the grid styles and an integer measured width for BestFit', async () => {
    const { container } = render(
      <BGrid<Row>
        width={300}
        height={140}
        columns={[{ key: 'name', label: 'Name', width: 30 }]}
        data={[{ values: { name: 'one' } }, { values: { name: 'two' } }]}
      />,
    );
    const headerCell = container.querySelector(
      "[role='rfdg-head'] [data-column-index='0']",
    ) as HTMLTableCellElement;
    const resizeHandle = headerCell.querySelector('.bgrid-col-resizer-handle') as HTMLDivElement;
    const bodyCol = container.querySelector("[role='rfdg-body']")?.closest('table')?.querySelector('col');
    const grid = container.querySelector("[role='grid']") as HTMLDivElement;
    const originalAppend = grid.append.bind(grid);
    let measurementTarget: HTMLDivElement | undefined;
    let measurementParent: Element | null = null;
    const append = vi.spyOn(grid, 'append').mockImplementation((...nodes: (Node | string)[]) => {
      measurementTarget = nodes.find(
        node => node instanceof HTMLDivElement && node.querySelector('table'),
      ) as HTMLDivElement | undefined;
      if (measurementTarget) measurementParent = grid;
      return originalAppend(...nodes);
    });
    const offsetWidth = vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockImplementation(function () {
      return this.classList.contains('bgrid-head-cell') ? 35 : 0;
    });

    try {
      fireEvent.doubleClick(resizeHandle);

      await waitFor(() => {
        expect(bodyCol).toHaveAttribute('width', '36');
      });

      const measurementTables = measurementTarget?.querySelectorAll('table');

      expect(measurementParent).toBe(container.querySelector("[role='grid']"));
      expect(measurementTables).toHaveLength(2);
      measurementTables?.forEach(table => {
        expect(table).toHaveClass('bgrid-head-table', 'bgrid-body-table');
        expect(table.style.tableLayout).toBe('auto');
        expect(table.style.width).toBe('max-content');
      });
    } finally {
      append.mockRestore();
      offsetWidth.mockRestore();
    }
  });

  it('preserves the full header label when BestFit measures a short Korean title', async () => {
    const { container } = render(
      <BGrid<Row>
        width={300}
        height={140}
        columns={[{ key: 'name', label: '이름', width: 30 }]}
        data={[{ values: { name: 'one' } }]}
      />,
    );
    const headerCell = container.querySelector(
      "[role='rfdg-head'] [data-column-index='0']",
    ) as HTMLTableCellElement;
    const resizeHandle = headerCell.querySelector('.bgrid-col-resizer-handle') as HTMLDivElement;
    const grid = container.querySelector("[role='grid']") as HTMLDivElement;
    const originalAppend = grid.append.bind(grid);
    let measurementTarget: HTMLDivElement | undefined;
    const append = vi.spyOn(grid, 'append').mockImplementation((...nodes: (Node | string)[]) => {
      measurementTarget = nodes.find(
        node => node instanceof HTMLDivElement && node.querySelector('table'),
      ) as HTMLDivElement | undefined;
      return originalAppend(...nodes);
    });

    try {
      fireEvent.doubleClick(resizeHandle);

      await waitFor(() => expect(measurementTarget).toBeDefined());

      measurementTarget?.querySelectorAll<HTMLElement>(
        '.bgrid-head-column, .bgrid-head-column-label, .bgrid-head-column-label-text',
      ).forEach(element => {
        expect(element.style.minWidth).toBe('max-content');
        expect(element.style.width).toBe('max-content');
        expect(element.style.overflow).toBe('visible');
        expect(element.style.textOverflow).toBe('clip');
      });
    } finally {
      append.mockRestore();
    }
  });

  it('recalculates horizontal scrollbar metrics when a column width changes', async () => {
    function ControlledGrid() {
      const [controlledColumns, setControlledColumns] = useState(columns);

      return (
        <BGrid<Row>
          width={400}
          height={140}
          columns={controlledColumns}
          data={data}
          scrollbar={{ variant: 'modern' }}
          onChangeColumns={(_columnIndex, { columns }) => {
            setControlledColumns(columns);
          }}
        />
      );
    }

    const { container } = render(<ControlledGrid />);
    const scrollContainer = container.querySelector("[role='rfdg-scroll-container']") as HTMLDivElement | null;
    const headerCell = container.querySelector(
      "[role='rfdg-head'] [data-column-index='1']",
    ) as HTMLTableCellElement | null;
    const resizeHandle = headerCell?.querySelector('.bgrid-col-resizer-handle') as HTMLDivElement | null;

    expect(scrollContainer).toBeTruthy();
    expect(headerCell).toBeTruthy();
    expect(resizeHandle).toBeTruthy();

    Object.defineProperties(scrollContainer as HTMLDivElement, {
      clientWidth: { configurable: true, get: () => 200 },
      clientHeight: { configurable: true, get: () => 100 },
      scrollHeight: { configurable: true, get: () => 100 },
    });

    setElementRect(headerCell as HTMLTableCellElement, {
      left: 100,
      top: 0,
      right: 200,
      bottom: 28,
      width: 100,
      height: 28,
    });

    act(() => {
      fireEvent.pointerDown(resizeHandle as HTMLDivElement, { pointerId: 16, clientX: 200, clientY: 14 });
      window.dispatchEvent(createPointerEvent('pointermove', 16, 280, 14));
    });

    await waitFor(() => {
      expect(container.querySelector('.bgrid-custom-scrollbar-horizontal [role="scrollbar"]')).toHaveAttribute(
        'aria-valuemax',
        '181',
      );
    });

    act(() => {
      window.dispatchEvent(createPointerEvent('pointerup', 16, 280, 14));
    });
  });

  it('cancels an active cell editor when column resize handle is pressed', async () => {
    const editableColumns: BGridColumn<Row>[] = [
      { key: 'id', label: 'ID', width: 100 },
      { key: 'name', label: 'Name', width: 100, editable: true, editor: { type: 'text' } },
    ];

    const { container } = render(
      <BGrid<Row>
        width={300}
        height={160}
        columns={editableColumns}
        data={data}
        editable
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 1 } }}
      />,
    );

    const cell = container.querySelector('td[data-row-index="0"][data-column-index="1"]') as HTMLElement;
    fireEvent.doubleClick(cell);

    const gateway = container.querySelector('[data-bgrid-text-editor-gateway="true"]') as HTMLInputElement;
    await waitFor(() => expect(gateway).toHaveClass('bgrid-text-editor-active'));

    const resizeHandle = container.querySelector(
      "[role='rfdg-head'] [data-column-index='1'] .bgrid-col-resizer-handle",
    ) as HTMLDivElement;
    expect(resizeHandle).toBeTruthy();

    fireEvent.pointerDown(resizeHandle, { pointerId: 17, clientX: 200, clientY: 14 });

    await waitFor(() => {
      expect(gateway).not.toHaveClass('bgrid-text-editor-active');
    });
  });
});
