import { cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BGrid, BGridColumn, BGridDataItem } from '../beautiful-grid';

interface Row {
  id: number;
  group?: string;
  name: string;
}

const columns: BGridColumn<Row>[] = [
  { key: 'id', label: 'ID', width: 80 },
  { key: 'name', label: 'Name', width: 140, editable: true },
];

const data: BGridDataItem<Row>[] = [
  { values: { id: 1, group: 'a', name: 'one' } },
  { values: { id: 2, group: 'a', name: 'two' } },
  { values: { id: 3, group: 'b', name: 'three' } },
  { values: { id: 4, group: 'b', name: 'four' } },
];

function preparePointerGeometry(container: HTMLElement) {
  const scrollContainer = container.querySelector("[role='rfdg-scroll-container']") as HTMLDivElement;
  Object.defineProperty(scrollContainer, 'scrollTop', { configurable: true, writable: true, value: 0 });
  Object.defineProperty(scrollContainer, 'scrollHeight', { configurable: true, value: 400 });
  Object.defineProperty(scrollContainer, 'clientHeight', { configurable: true, value: 160 });
  scrollContainer.getBoundingClientRect = () =>
    ({ top: 0, bottom: 160, left: 0, right: 360, width: 360, height: 160, x: 0, y: 0, toJSON: () => ({}) }) as DOMRect;
  return scrollContainer;
}

function getHandle(container: HTMLElement, rowIndex: number) {
  return container.querySelector<HTMLButtonElement>(
    `.bgrid-row-reorder-handle[data-row-reorder-index='${rowIndex}']`,
  ) as HTMLButtonElement;
}

function getVisibleIds(container: HTMLElement) {
  return Array.from(container.querySelectorAll("tbody[role='rfdg-body'] tr.bgrid-body-row")).map(row =>
    Number(row.querySelector('td[data-column-index="0"]')?.textContent),
  );
}

afterEach(cleanup);

describe('BGrid row reorder interactions', () => {
  it('moves both body quadrants before committing the row data once', async () => {
    const onReorder = vi.fn();
    const { container } = render(
      <BGrid<Row>
        width={360}
        height={180}
        columns={columns}
        data={data}
        showLineNumber
        reorder={{ enabled: true, onReorder }}
      />,
    );
    preparePointerGeometry(container);
    const handle = getHandle(container, 0);

    fireEvent.pointerDown(handle, { button: 0, pointerId: 11, clientY: 15 });
    fireEvent.pointerMove(handle, { pointerId: 11, clientY: 82 });

    await waitFor(() => {
      expect(container.querySelector("[role='grid']")).toHaveAttribute('data-bgrid-row-reordering', 'true');
      const shiftedRows = container.querySelectorAll("tr[data-ri='1'][data-bgrid-row-reorder-role='shift']");
      expect(shiftedRows).toHaveLength(2);
      const leftOffset = (shiftedRows[0] as HTMLElement).style.getPropertyValue('--bgrid-row-reorder-offset-y');
      const mainOffset = (shiftedRows[1] as HTMLElement).style.getPropertyValue('--bgrid-row-reorder-offset-y');
      expect(Number.parseFloat(leftOffset)).toBeLessThan(0);
      expect(mainOffset).toBe(leftOffset);
    });
    expect(onReorder).not.toHaveBeenCalled();
    expect(getVisibleIds(container).slice(0, 4)).toEqual([1, 2, 3, 4]);

    fireEvent.pointerUp(window, { pointerId: 11, clientY: 82 });

    await waitFor(() => expect(onReorder).toHaveBeenCalledTimes(1));
    expect(onReorder.mock.calls[0][0].map((item: BGridDataItem<Row>) => item.values.id)).toEqual([2, 3, 1, 4]);
    expect(container.querySelector("[role='grid']")).not.toHaveAttribute('data-bgrid-row-reordering');
  });

  it('supports keyboard pickup, movement, drop, and focus restoration', async () => {
    const onReorder = vi.fn();
    const { container } = render(
      <BGrid<Row>
        width={360}
        height={180}
        columns={columns}
        data={data}
        showLineNumber
        reorder={{ enabled: true, onReorder }}
      />,
    );
    const handle = getHandle(container, 0);
    handle.focus();

    fireEvent.keyDown(handle, { key: ' ' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });

    expect(onReorder).not.toHaveBeenCalled();
    expect(container.querySelector("tr[data-ri='2'][data-bgrid-row-reorder-role='target']")).toBeInTheDocument();
    fireEvent.keyDown(handle, { key: 'Enter' });

    await waitFor(() => expect(onReorder).toHaveBeenCalledTimes(1));
    expect(onReorder.mock.calls[0][0].map((item: BGridDataItem<Row>) => item.values.id)).toEqual([2, 3, 1, 4]);
    await waitFor(() => expect(getHandle(container, 2)).toHaveFocus());
  });

  it('returns to the original order when keyboard movement is cancelled', async () => {
    const onReorder = vi.fn();
    const { container } = render(
      <BGrid<Row>
        width={360}
        height={180}
        columns={columns}
        data={data}
        showLineNumber
        reorder={{ enabled: true, onReorder }}
      />,
    );
    const handle = getHandle(container, 0);
    handle.focus();

    fireEvent.keyDown(handle, { key: 'Enter' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    fireEvent.keyDown(handle, { key: 'Escape' });

    await waitFor(() =>
      expect(container.querySelector("[role='grid']")).not.toHaveAttribute('data-bgrid-row-reordering'),
    );
    expect(onReorder).not.toHaveBeenCalled();
    expect(getVisibleIds(container).slice(0, 4)).toEqual([1, 2, 3, 4]);
    expect(handle).toHaveFocus();
  });

  it('rolls the data and motion state back when onReorder returns false', async () => {
    const onReorder = vi.fn(() => false);
    const { container } = render(
      <BGrid<Row>
        width={360}
        height={180}
        columns={columns}
        data={data}
        showLineNumber
        reorder={{ enabled: true, onReorder }}
      />,
    );
    const handle = getHandle(container, 0);

    fireEvent.keyDown(handle, { key: 'Enter' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    fireEvent.keyDown(handle, { key: 'Enter' });

    await waitFor(() => expect(onReorder).toHaveBeenCalledTimes(1));
    expect(getVisibleIds(container).slice(0, 4)).toEqual([1, 2, 3, 4]);
    expect(container.querySelector("[role='grid']")).not.toHaveAttribute('data-bgrid-row-reordering');
  });

  it('keeps checked and active state attached to the moved data item', async () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <BGrid<Row>
        width={360}
        height={180}
        columns={columns}
        data={data}
        rowKey='id'
        rowChecked={{ checkedRowKeys: [1], onChange: vi.fn() }}
        cellNavigationOptions={{
          enabled: true,
          defaultActiveCell: { rowIndex: 0, columnIndex: 0 },
          onActiveCellChange,
        }}
        showLineNumber
        reorder={{ enabled: true, onReorder: vi.fn() }}
      />,
    );
    const handle = getHandle(container, 0);

    fireEvent.keyDown(handle, { key: 'Enter' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    fireEvent.keyDown(handle, { key: 'ArrowDown' });
    fireEvent.keyDown(handle, { key: 'Enter' });

    await waitFor(() =>
      expect(onActiveCellChange).toHaveBeenCalledWith({ rowIndex: 2, columnIndex: 0 }),
    );
    const movedRowCheckbox = container.querySelector("tr[data-ri='2'] [role='checkbox']");
    expect(movedRowCheckbox).toHaveAttribute('aria-checked', 'true');
    expect(container.querySelector("td[data-row-index='2'][data-column-index='0']")).toHaveAttribute(
      'data-bgrid-cell-active',
      'true',
    );
  });

  it('cancels an in-flight pointer session when external data changes', async () => {
    const onReorder = vi.fn();
    const renderGrid = (rows: BGridDataItem<Row>[]) => (
      <BGrid<Row>
        width={360}
        height={180}
        columns={columns}
        data={rows}
        showLineNumber
        reorder={{ enabled: true, onReorder }}
      />
    );
    const { container, rerender } = render(renderGrid(data));
    preparePointerGeometry(container);
    const handle = getHandle(container, 0);

    fireEvent.pointerDown(handle, { button: 0, pointerId: 13, clientY: 15 });
    fireEvent.pointerMove(handle, { pointerId: 13, clientY: 50 });
    await waitFor(() =>
      expect(container.querySelector("[role='grid']")).toHaveAttribute('data-bgrid-row-reordering', 'true'),
    );

    rerender(renderGrid(data.map(item => ({ ...item }))));

    await waitFor(() =>
      expect(container.querySelector("[role='grid']")).not.toHaveAttribute('data-bgrid-row-reordering'),
    );
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('uses a non-transforming preview fallback when merged rows are present', async () => {
    const { container } = render(
      <BGrid<Row>
        width={360}
        height={180}
        columns={columns}
        data={data}
        showLineNumber
        cellMergeOptions={{ columnsMap: { 0: { mergeBy: 'group' } } }}
        reorder={{ enabled: true, onReorder: vi.fn() }}
      />,
    );
    preparePointerGeometry(container);
    const handle = getHandle(container, 0);

    fireEvent.pointerDown(handle, { button: 0, pointerId: 15, clientY: 15 });
    fireEvent.pointerMove(handle, { pointerId: 15, clientY: 50 });

    await waitFor(() => {
      expect(container.querySelector("[role='grid']")).toHaveAttribute(
        'data-bgrid-row-reorder-fallback',
        'true',
      );
      expect(container.querySelector('.bgrid-row-reorder-preview')).toBeInTheDocument();
    });

    fireEvent.pointerCancel(window, { pointerId: 15 });
    await waitFor(() => expect(container.querySelector('.bgrid-row-reorder-preview')).not.toBeInTheDocument());
  });

  it('does not arm row reorder while a cell editor owns the interaction', async () => {
    const { container } = render(
      <BGrid<Row>
        width={360}
        height={180}
        columns={columns}
        data={data}
        editable
        showLineNumber
        reorder={{ enabled: true, onReorder: vi.fn() }}
      />,
    );
    const editableCell = container.querySelector("td[data-row-index='0'][data-column-index='1']") as HTMLElement;
    fireEvent.doubleClick(editableCell);

    await waitFor(() => expect(getHandle(container, 0)).toBeDisabled());
    fireEvent.keyDown(getHandle(container, 0), { key: 'Enter' });
    expect(container.querySelector("[role='grid']")).not.toHaveAttribute('data-bgrid-row-reordering');
  });
});
