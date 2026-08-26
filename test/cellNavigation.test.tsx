import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';
import { BGrid } from '../beautiful-grid';
import { BGridColumn } from '../beautiful-grid/types';

describe('Active Cell & Keyboard Navigation', () => {
  const sampleData = [
    { values: { id: 1, name: 'Alpha', category: 'A', score: 90 } },
    { values: { id: 2, name: 'Beta', category: 'A', score: 80 } },
    { values: { id: 3, name: 'Gamma', category: 'B', score: 70 } },
    { values: { id: 4, name: 'Delta', category: 'B', score: 85 } },
    { values: { id: 5, name: 'Epsilon', category: 'C', score: 95 } },
  ];

  const columns: BGridColumn<any>[] = [
    { key: 'id', label: 'ID', width: 60 },
    { key: 'name', label: 'Name', width: 100, editable: true },
    { key: 'category', label: 'Category', width: 100 },
    { key: 'score', label: 'Score', width: 80, editable: true },
  ];

  it('activates cell on click and applies .bgrid-cell-active and data-bgrid-cell-active', () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        cellNavigationOptions={{
          onActiveCellChange,
        }}
      />,
    );

    // Find cell at row 1, col 2 (category: 'A')
    const targetCell = container.querySelector('td[data-row-index="1"][data-column-index="2"]');
    expect(targetCell).not.toBeNull();

    fireEvent.pointerDown(targetCell!, { button: 0 });

    expect(targetCell?.classList.contains('bgrid-cell-active')).toBe(true);
    expect(targetCell?.classList.contains('bgrid-cell-active-multi-selection')).toBe(false);
    expect(targetCell?.getAttribute('data-bgrid-cell-active')).toBe('true');
    expect(onActiveCellChange).toHaveBeenCalledWith({ rowIndex: 1, columnIndex: 2 });
  });

  it('highlights the active cell column header and line number', () => {
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        showLineNumber
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 1, columnIndex: 2 } }}
      />,
    );

    const activeHeader = container.querySelector(
      'td[data-header-cell-type="column"][data-column-index="2"]',
    );
    const inactiveHeader = container.querySelector(
      'td[data-header-cell-type="column"][data-column-index="1"]',
    );
    const activeLineNumber = container.querySelector('td.bgrid-line-number-cell[data-row-index="1"]');
    const inactiveLineNumber = container.querySelector('td.bgrid-line-number-cell[data-row-index="0"]');

    expect(activeHeader?.classList).toContain('bgrid-column-axis-active');
    expect(activeHeader?.getAttribute('data-bgrid-column-axis-active')).toBe('true');
    expect(inactiveHeader?.classList).not.toContain('bgrid-column-axis-active');
    expect(activeLineNumber?.classList).toContain('bgrid-row-axis-active');
    expect(activeLineNumber?.getAttribute('data-bgrid-row-axis-active')).toBe('true');
    expect(inactiveLineNumber?.classList).not.toContain('bgrid-row-axis-active');
  });

  it('moves active cell with Arrow keys and clamps at boundaries', () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 0, columnIndex: 0 },
          onActiveCellChange,
        }}
      />,
    );

    const gridContainer = container.querySelector('[role="grid"]')!;
    expect(gridContainer).not.toBeNull();
    gridContainer.focus();

    // ArrowDown -> row 1, col 0
    fireEvent.keyDown(gridContainer, { key: 'ArrowDown' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 1, columnIndex: 0 });

    // ArrowRight -> row 1, col 1
    fireEvent.keyDown(gridContainer, { key: 'ArrowRight' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 1, columnIndex: 1 });

    // ArrowUp -> row 0, col 1
    fireEvent.keyDown(gridContainer, { key: 'ArrowUp' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 0, columnIndex: 1 });

    // ArrowUp at top boundary -> remains at row 0, col 1
    fireEvent.keyDown(gridContainer, { key: 'ArrowUp' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 0, columnIndex: 1 });

    // ArrowLeft -> row 0, col 0
    fireEvent.keyDown(gridContainer, { key: 'ArrowLeft' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 0, columnIndex: 0 });

    // ArrowLeft at left boundary -> remains at row 0, col 0
    fireEvent.keyDown(gridContainer, { key: 'ArrowLeft' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 0, columnIndex: 0 });
  });

  it('keeps one keydown listener while the active cell changes repeatedly', () => {
    const addEventListenerSpy = vi.spyOn(document, 'addEventListener');
    const { container, unmount } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 0 } }}
      />,
    );

    try {
      const gridContainer = container.querySelector('[role="grid"]')!;
      gridContainer.focus();
      const keydownListenerCount = addEventListenerSpy.mock.calls.filter(([type]) => type === 'keydown').length;

      fireEvent.keyDown(gridContainer, { key: 'ArrowDown' });
      fireEvent.keyDown(gridContainer, { key: 'ArrowRight' });
      fireEvent.keyDown(gridContainer, { key: 'ArrowDown' });

      expect(addEventListenerSpy.mock.calls.filter(([type]) => type === 'keydown')).toHaveLength(
        keydownListenerCount,
      );
    } finally {
      unmount();
      addEventListenerSpy.mockRestore();
    }
  });

  it('accelerates a held Arrow key with frame-synchronized repeats and stops on keyup', () => {
    let frameId = 0;
    const frames = new Map<number, FrameRequestCallback>();
    const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      frameId += 1;
      frames.set(frameId, callback);
      return frameId;
    });
    const cancelAnimationFrameSpy = vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(id => {
      frames.delete(id);
    });
    const onActiveCellChange = vi.fn();
    const { container, unmount } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 0, columnIndex: 0 },
          onActiveCellChange,
          keyRepeat: { interval: 16 },
        }}
      />,
    );

    try {
      const gridContainer = container.querySelector('[role="grid"]')!;
      gridContainer.focus();
      fireEvent.keyDown(gridContainer, { key: 'ArrowDown' });
      fireEvent.keyDown(gridContainer, { key: 'ArrowDown', repeat: true });
      expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 2, columnIndex: 0 });

      const [repeatFrameId, repeatFrame] = Array.from(frames.entries())[0];
      frames.delete(repeatFrameId);
      act(() => repeatFrame(performance.now() + 17));
      expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 3, columnIndex: 0 });

      fireEvent.keyUp(gridContainer, { key: 'ArrowDown' });
      expect(frames).toHaveLength(0);
    } finally {
      unmount();
      requestAnimationFrameSpy.mockRestore();
      cancelAnimationFrameSpy.mockRestore();
    }
  });

  it('can retain native Arrow key repeat timing', () => {
    const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame');
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 0, columnIndex: 0 },
          onActiveCellChange,
          keyRepeat: { enabled: false },
        }}
      />,
    );
    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();

    fireEvent.keyDown(gridContainer, { key: 'ArrowDown' });
    fireEvent.keyDown(gridContainer, { key: 'ArrowDown', repeat: true });

    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 2, columnIndex: 0 });
    expect(requestAnimationFrameSpy).not.toHaveBeenCalled();
    requestAnimationFrameSpy.mockRestore();
  });

  it.each([
    ['without frozen columns', 0],
    ['with frozen columns', 3],
  ])('does not re-render visible cell content during repeated navigation %s', (_, frozenColumnIndex) => {
    const itemRender = vi.fn(({ value }: { value: unknown }) => String(value));
    const performanceColumns: BGridColumn<Record<string, number>>[] = Array.from(
      { length: 8 },
      (__, columnIndex) => ({
        id: `column-${columnIndex}`,
        key: `column${columnIndex}`,
        label: `Column ${columnIndex}`,
        width: 90,
        itemRender,
      }),
    );
    const performanceData = Array.from({ length: 500 }, (__, rowIndex) => ({
      values: Object.fromEntries(
        performanceColumns.map((column, columnIndex) => [String(column.key), rowIndex * 10 + columnIndex]),
      ),
    }));
    const { container } = render(
      <BGrid
        width={720}
        height={500}
        columns={performanceColumns}
        data={performanceData}
        frozenColumnIndex={frozenColumnIndex}
        showLineNumber
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 0, columnIndex: 4 },
          keyRepeat: { enabled: false },
        }}
      />,
    );
    const initialRenderCount = itemRender.mock.calls.length;
    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();

    for (let index = 0; index < 10; index += 1) {
      fireEvent.keyDown(gridContainer, { key: 'ArrowDown', repeat: index > 0 });
    }

    expect(itemRender).toHaveBeenCalledTimes(initialRenderCount);
    expect(container.querySelector('td.bgrid-cell-active[data-column-index="4"]')).toHaveAttribute(
      'data-bgrid-logical-row-index',
      '10',
    );
  });

  it.each([
    ['without frozen columns', 0],
    ['with frozen columns', 3],
  ])('batches virtual row rendering while repeated navigation scrolls %s', (_, frozenColumnIndex) => {
    const itemRender = vi.fn(({ value }: { value: unknown }) => String(value));
    const performanceColumns: BGridColumn<Record<string, number>>[] = Array.from(
      { length: 8 },
      (__, columnIndex) => ({
        id: `scroll-column-${columnIndex}`,
        key: `column${columnIndex}`,
        label: `Column ${columnIndex}`,
        width: 90,
        itemRender,
      }),
    );
    const performanceData = Array.from({ length: 500 }, (__, rowIndex) => ({
      values: Object.fromEntries(
        performanceColumns.map((column, columnIndex) => [String(column.key), rowIndex * 10 + columnIndex]),
      ),
    }));
    const { container } = render(
      <BGrid
        width={720}
        height={500}
        columns={performanceColumns}
        data={performanceData}
        frozenColumnIndex={frozenColumnIndex}
        showLineNumber
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 0, columnIndex: 4 },
          keyRepeat: { enabled: false },
        }}
      />,
    );
    const scrollContainer = container.querySelector<HTMLElement>('[role="rfdg-scroll-container"]')!;
    Object.defineProperties(scrollContainer, {
      clientHeight: { configurable: true, value: 116 },
      scrollHeight: { configurable: true, value: performanceData.length * 29 },
      clientWidth: { configurable: true, value: 720 },
      scrollWidth: { configurable: true, value: 720 },
    });
    const initialRenderCount = itemRender.mock.calls.length;
    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();

    for (let index = 0; index < 24; index += 1) {
      fireEvent.keyDown(gridContainer, { key: 'ArrowDown', repeat: index > 0 });
    }

    const navigationRenderCount = itemRender.mock.calls.length - initialRenderCount;
    expect(navigationRenderCount).toBeLessThan(initialRenderCount * 5);
    expect(container.querySelector('td.bgrid-cell-active[data-column-index="4"]')).toHaveAttribute(
      'data-bgrid-logical-row-index',
      '24',
    );
  });

  it('supports wrap: true navigation at boundaries', () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 0, columnIndex: 0 },
          wrap: true,
          onActiveCellChange,
        }}
      />,
    );

    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();

    // ArrowUp at row 0 -> wraps to last row (4)
    fireEvent.keyDown(gridContainer, { key: 'ArrowUp' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 4, columnIndex: 0 });

    // ArrowLeft at col 0 -> wraps to last col (3)
    fireEvent.keyDown(gridContainer, { key: 'ArrowLeft' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 4, columnIndex: 3 });

    // ArrowDown at row 4 -> wraps to row 0
    fireEvent.keyDown(gridContainer, { key: 'ArrowDown' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 0, columnIndex: 3 });

    // ArrowRight at col 3 -> wraps to col 0
    fireEvent.keyDown(gridContainer, { key: 'ArrowRight' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 0, columnIndex: 0 });
  });

  it('handles Ctrl/Cmd + Arrow, Home, End, and Ctrl/Cmd + Home/End', () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 2, columnIndex: 1 },
          onActiveCellChange,
        }}
      />,
    );

    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();

    // Home -> col 0 of current row (row 2, col 0)
    fireEvent.keyDown(gridContainer, { key: 'Home' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 2, columnIndex: 0 });

    // End -> last col of current row (row 2, col 3)
    fireEvent.keyDown(gridContainer, { key: 'End' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 2, columnIndex: 3 });

    // Ctrl + ArrowUp -> row 0, current col (row 0, col 3)
    fireEvent.keyDown(gridContainer, { key: 'ArrowUp', ctrlKey: true });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 0, columnIndex: 3 });

    // Ctrl + ArrowDown -> row 4, current col (row 4, col 3)
    fireEvent.keyDown(gridContainer, { key: 'ArrowDown', ctrlKey: true });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 4, columnIndex: 3 });

    // Ctrl + Home -> (0, 0)
    fireEvent.keyDown(gridContainer, { key: 'Home', ctrlKey: true });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 0, columnIndex: 0 });

    // Ctrl + End -> (4, 3)
    fireEvent.keyDown(gridContainer, { key: 'End', ctrlKey: true });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 4, columnIndex: 3 });
  });

  it('extends selection range with Shift + Arrow keys', () => {
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 1, columnIndex: 1 },
        }}
      />,
    );

    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();

    // Shift + ArrowDown
    fireEvent.keyDown(gridContainer, { key: 'ArrowDown', shiftKey: true });

    // The range (1,1) to (2,1) is rendered as one overlay rectangle.
    const cell21 = container.querySelector('td[data-row-index="2"][data-column-index="1"]');
    const selection = container.querySelector<HTMLElement>('[data-bgrid-selection-fragment="true"]');
    expect(selection).toHaveStyle({
      left: '60px',
      top: '29px',
      width: '100px',
      height: '58px',
    });

    // Active cell is now (2, 1)
    expect(cell21?.classList.contains('bgrid-cell-active')).toBe(true);
    expect(cell21?.classList.contains('bgrid-cell-active-multi-selection')).toBe(true);
    expect(cell21?.getAttribute('data-bgrid-cell-active-multi-selection')).toBe('true');
  });

  it('highlights every row and column axis covered by a selection range', () => {
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        showLineNumber
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 1, columnIndex: 1 } }}
      />,
    );

    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();
    fireEvent.keyDown(gridContainer, { key: 'ArrowDown', shiftKey: true });
    fireEvent.keyDown(gridContainer, { key: 'ArrowRight', shiftKey: true });

    expect(
      container.querySelector('td[data-header-cell-type="column"][data-column-index="1"]')?.classList,
    ).toContain('bgrid-column-axis-active');
    expect(
      container.querySelector('td[data-header-cell-type="column"][data-column-index="2"]')?.classList,
    ).toContain('bgrid-column-axis-active');
    expect(
      container.querySelector('td[data-header-cell-type="column"][data-column-index="0"]')?.classList,
    ).not.toContain('bgrid-column-axis-active');
    expect(container.querySelector('td.bgrid-line-number-cell[data-row-index="1"]')?.classList).toContain(
      'bgrid-row-axis-active',
    );
    expect(container.querySelector('td.bgrid-line-number-cell[data-row-index="2"]')?.classList).toContain(
      'bgrid-row-axis-active',
    );
    expect(container.querySelector('td.bgrid-line-number-cell[data-row-index="0"]')?.classList).not.toContain(
      'bgrid-row-axis-active',
    );
  });

  it('selects complete rows by clicking and dragging line numbers', () => {
    const { container } = render(
      <BGrid width={500} height={300} columns={columns} data={sampleData} showLineNumber />,
    );

    const secondLineNumber = container.querySelector('td.bgrid-line-number-cell[data-row-index="1"]')!;
    const fourthLineNumber = container.querySelector('td.bgrid-line-number-cell[data-row-index="3"]')!;

    fireEvent.pointerDown(secondLineNumber, { button: 0, clientX: 10, clientY: 45 });
    fireEvent.pointerOver(fourthLineNumber, { clientX: 10, clientY: 103 });
    fireEvent.pointerUp(document);

    const selection = container.querySelector<HTMLElement>('[data-bgrid-selection-fragment="true"]');
    expect(selection).toHaveStyle({
      left: '0px',
      top: '29px',
      width: '340px',
      height: '87px',
    });
    expect(secondLineNumber).toHaveAttribute('data-bgrid-row-axis-active', 'true');
    expect(fourthLineNumber).toHaveAttribute('data-bgrid-row-axis-active', 'true');
    expect(container.querySelector('[data-bgrid-column-axis-active="true"]')).not.toBeInTheDocument();
  });

  it('selects a complete column when the header has no sorting action', () => {
    const { container } = render(
      <BGrid width={500} height={300} columns={columns} data={sampleData} showLineNumber />,
    );

    const nameHeader = container.querySelector(
      'td[data-header-cell-type="column"][data-column-index="1"]',
    )!;
    fireEvent.pointerDown(nameHeader, { button: 0 });
    fireEvent.pointerUp(document);

    const selection = container.querySelector<HTMLElement>('[data-bgrid-selection-fragment="true"]');
    expect(selection).toHaveStyle({
      left: '60px',
      top: '0px',
      width: '100px',
      height: '145px',
    });
    expect(nameHeader).toHaveAttribute('data-bgrid-column-axis-active', 'true');
    expect(container.querySelector('[data-bgrid-row-axis-active="true"]')).not.toBeInTheDocument();
  });

  it('keeps sortable header clicks dedicated to sorting', () => {
    const onSortChange = vi.fn();
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        sort={{ sortParams: [], onChange: onSortChange }}
      />,
    );

    const nameHeader = container.querySelector(
      'td[data-header-cell-type="column"][data-column-index="1"]',
    )!;
    fireEvent.pointerDown(nameHeader, { button: 0 });
    fireEvent.click(nameHeader);

    expect(onSortChange).toHaveBeenCalledWith([
      expect.objectContaining({ key: 'name', orderBy: 'asc' }),
    ]);
    expect(container.querySelector('[data-bgrid-selection-fragment="true"]')).not.toBeInTheDocument();
  });

  it('navigates with Tab and Shift + Tab', () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 0, columnIndex: 2 },
          onActiveCellChange,
        }}
      />,
    );

    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();

    // Tab -> col 3
    fireEvent.keyDown(gridContainer, { key: 'Tab' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 0, columnIndex: 3 });

    // Tab -> wraps to next row (row 1, col 0)
    fireEvent.keyDown(gridContainer, { key: 'Tab' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 1, columnIndex: 0 });

    // Shift + Tab -> wraps back to prev row (row 0, col 3)
    fireEvent.keyDown(gridContainer, { key: 'Tab', shiftKey: true });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 0, columnIndex: 3 });
  });

  it('handles F2 and Enter to start editing editable cells, and Escape to cancel', () => {
    const onClick = vi.fn();
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        editable={true}
        onClick={onClick}
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 0, columnIndex: 1 }, // name is editable
          editOnEnter: true,
        }}
      />,
    );

    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();

    // Enter starts editing
    fireEvent.keyDown(gridContainer, { key: 'Enter' });
    expect(onClick).not.toHaveBeenCalled();

    // Cell should be in edit mode (contains input or edit container)
    const cell01 = container.querySelector('td[data-row-index="0"][data-column-index="1"]');
    expect(cell01).not.toBeNull();

    // Escape cancels editing and retains active cell
    fireEvent.keyDown(gridContainer, { key: 'Escape' });
    expect(cell01?.classList.contains('bgrid-cell-active')).toBe(true);

    // F2 also starts editing
    fireEvent.keyDown(gridContainer, { key: 'F2' });
    // Escape again
    fireEvent.keyDown(gridContainer, { key: 'Escape' });
    expect(cell01?.classList.contains('bgrid-cell-active')).toBe(true);
  });

  it('activates a non-editable cell with Enter or Space without moving focus', () => {
    const onClick = vi.fn();
    const onActiveCellChange = vi.fn();
    const nonEditableColumns: BGridColumn<any>[] = [
      { ...columns[0], editable: false },
      ...columns.slice(1),
    ];
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={nonEditableColumns}
        data={sampleData}
        editable
        onClick={onClick}
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 1, columnIndex: 0 },
          onActiveCellChange,
        }}
      />,
    );

    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();

    fireEvent.keyDown(gridContainer, { key: 'Enter' });
    fireEvent.keyDown(gridContainer, { key: ' ' });

    expect(onClick).toHaveBeenCalledTimes(2);
    expect(onClick).toHaveBeenLastCalledWith(
      expect.objectContaining({
        index: 1,
        columnIndex: 0,
        item: sampleData[1].values,
        column: expect.objectContaining({ key: 'id' }),
      }),
    );
    expect(onActiveCellChange).not.toHaveBeenCalled();
    expect(container.querySelector('td[data-row-index="1"][data-column-index="0"]')?.classList).toContain(
      'bgrid-cell-active',
    );
  });

  it('activates an editable cell with Enter when editOnEnter is disabled', () => {
    const onClick = vi.fn();
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        editable
        onClick={onClick}
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 0, columnIndex: 1 },
          editOnEnter: false,
        }}
      />,
    );

    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();
    fireEvent.keyDown(gridContainer, { key: 'Enter' });

    expect(onClick).toHaveBeenCalledOnce();
    expect(onClick).toHaveBeenCalledWith(
      expect.objectContaining({ index: 0, columnIndex: 1, item: sampleData[0].values }),
    );
  });

  it('does not intercept keyboard events when interactive element (input) is focused', () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <div>
        <input data-testid="search-input" />
        <BGrid
          width={500}
          height={300}
          columns={columns}
          data={sampleData}
          cellNavigationOptions={{
            defaultActiveCell: { rowIndex: 0, columnIndex: 0 },
            onActiveCellChange,
          }}
        />
      </div>,
    );

    const searchInput = screen.getByTestId('search-input');
    searchInput.focus();

    // Typing ArrowDown inside search input should not move grid active cell
    fireEvent.keyDown(searchInput, { key: 'ArrowDown' });
    expect(onActiveCellChange).not.toHaveBeenCalled();
  });

  it('moves the active cell without creating a selection when cell selection is disabled', () => {
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        cellSelectionOptions={{ enabled: false }}
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 0 } }}
      />,
    );

    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();
    fireEvent.keyDown(gridContainer, { key: 'ArrowRight' });

    const activeCell = container.querySelector('td[data-row-index="0"][data-column-index="1"]');
    expect(activeCell?.classList).toContain('bgrid-cell-active');
    expect(container.querySelector('[data-bgrid-selection-fragment="true"]')).not.toBeInTheDocument();
    expect(container.querySelector('[data-bgrid-active-fragment="true"]')).toHaveAttribute('data-active-ring', 'true');
  });

  it('preserves the source row while moving horizontally through a merged cell', () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData} // row 0 and 1 have category 'A', row 2 and 3 have category 'B'
        cellMergeOptions={{
          columnsMap: {
            2: { mergeBy: 'category' }, // merge category column
          },
        }}
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 0, columnIndex: 0 },
          onActiveCellChange,
        }}
      />,
    );

    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();

    // Move to row 1, col 0
    fireEvent.keyDown(gridContainer, { key: 'ArrowDown' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 1, columnIndex: 0 });

    // Move right to col 2 (merged column) -> rendering uses the top anchor row.
    fireEvent.keyDown(gridContainer, { key: 'ArrowRight' });
    fireEvent.keyDown(gridContainer, { key: 'ArrowRight' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 0, columnIndex: 2 });
    expect(container.querySelector('[data-bgrid-selection-fragment="true"]')).toHaveStyle({ height: '58px' });
    expect(container.querySelector('[data-bgrid-active-fragment="true"]')).toHaveStyle({ height: '58px' });

    // Leaving the merged cell restores the row used to enter it.
    fireEvent.keyDown(gridContainer, { key: 'ArrowRight' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 1, columnIndex: 3 });
  });

  it('preserves the source row through a merged cell with controlled activeCell state', () => {
    const onActiveCellChange = vi.fn();

    function ControlledGrid() {
      const [activeCell, setActiveCell] = React.useState({ rowIndex: 1, columnIndex: 1 });

      return (
        <BGrid
          width={500}
          height={300}
          columns={columns}
          data={sampleData}
          cellMergeOptions={{ columnsMap: { 2: { mergeBy: 'category' } } }}
          cellNavigationOptions={{
            activeCell,
            onActiveCellChange: cell => {
              onActiveCellChange(cell);
              if (cell) setActiveCell(cell);
            },
          }}
        />
      );
    }

    const { container } = render(<ControlledGrid />);
    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();

    fireEvent.keyDown(gridContainer, { key: 'ArrowRight' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 0, columnIndex: 2 });

    fireEvent.keyDown(gridContainer, { key: 'ArrowRight' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 1, columnIndex: 3 });
    expect(container.querySelector('td[data-row-index="1"][data-column-index="3"]')).toHaveClass(
      'bgrid-cell-active',
    );
  });

  it('still treats a merged cell as one row group for vertical movement', () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        cellMergeOptions={{ columnsMap: { 2: { mergeBy: 'category' } } }}
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 3, columnIndex: 1 },
          onActiveCellChange,
        }}
      />,
    );

    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();

    fireEvent.keyDown(gridContainer, { key: 'ArrowRight' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 2, columnIndex: 2 });

    fireEvent.keyDown(gridContainer, { key: 'ArrowUp' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 0, columnIndex: 2 });
  });

  it('moves between merged row groups without getting stuck inside the current group', () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        cellMergeOptions={{ columnsMap: { 2: { mergeBy: 'category' } } }}
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 0, columnIndex: 2 },
          onActiveCellChange,
        }}
      />,
    );

    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();

    fireEvent.keyDown(gridContainer, { key: 'ArrowDown' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 2, columnIndex: 2 });

    fireEvent.keyDown(gridContainer, { key: 'ArrowDown' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 4, columnIndex: 2 });

    fireEvent.keyDown(gridContainer, { key: 'ArrowUp' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 2, columnIndex: 2 });
  });

  it('draws the selection perimeter around the full merged row span', () => {
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        variant='vertical-bordered'
        cellMergeOptions={{ columnsMap: { 2: { mergeBy: 'category' } } }}
      />,
    );

    const startCell = container.querySelector('td[data-row-index="0"][data-column-index="1"]')!;
    const endCell = container.querySelector('td[data-row-index="1"][data-column-index="3"]')!;

    fireEvent.pointerDown(startCell, { button: 0 });
    fireEvent.pointerOver(endCell);
    fireEvent.pointerUp(endCell);

    const mergedCell = container.querySelector(
      'td[data-row-index="0"][data-column-index="2"]',
    ) as HTMLTableCellElement;
    expect(mergedCell.rowSpan).toBe(2);
    expect(mergedCell).not.toHaveClass('bgrid-cell-selected');
    const selection = container.querySelector<HTMLElement>('[data-bgrid-selection-fragment="true"]');
    expect(selection).toHaveStyle({
      left: '60px',
      top: '0px',
      width: '280px',
      height: '58px',
    });
    expect(selection).toHaveAttribute('data-edge-top', 'true');
    expect(selection).toHaveAttribute('data-edge-right', 'true');
    expect(selection).toHaveAttribute('data-edge-bottom', 'true');
    expect(selection).toHaveAttribute('data-edge-left', 'true');
  });

  it('works with frozen columns without breaking horizontal navigation', () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        frozenColumnIndex={1} // col 0 is frozen
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 0, columnIndex: 0 },
          onActiveCellChange,
        }}
      />,
    );

    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();

    // Active cell in frozen column (col 0)
    const frozenCell = container.querySelector('[role="rfdg-body-frozen"] td[data-row-index="0"][data-column-index="0"]');
    expect(frozenCell?.classList.contains('bgrid-cell-active')).toBe(true);
    expect(
      container.querySelector(
        '[role="rfdg-head-frozen"] td[data-header-cell-type="column"][data-column-index="0"]',
      )?.classList,
    ).toContain('bgrid-column-axis-active');

    // ArrowRight into scrollable body (col 1)
    fireEvent.keyDown(gridContainer, { key: 'ArrowRight' });
    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 0, columnIndex: 1 });

    const scrollableCell = container.querySelector('td[data-row-index="0"][data-column-index="1"]');
    expect(scrollableCell?.classList.contains('bgrid-cell-active')).toBe(true);
    expect(
      container.querySelector(
        '[role="rfdg-head"] td[data-header-cell-type="column"][data-column-index="1"]',
      )?.classList,
    ).toContain('bgrid-column-axis-active');
  });

  it('moves the final column fully clear of the custom vertical scrollbar gutter', () => {
    const { container, rerender } = render(
      <BGrid
        width={200}
        height={300}
        columns={columns}
        data={sampleData}
        frozenColumnIndex={1}
        scrollbar={{ variant: 'modern' }}
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 2 } }}
      />,
    );
    const scrollContainer = container.querySelector<HTMLElement>('[role="rfdg-scroll-container"]')!;
    Object.defineProperties(scrollContainer, {
      clientWidth: { configurable: true, value: 200 },
      scrollWidth: { configurable: true, value: 364 },
      scrollLeft: { configurable: true, writable: true, value: 0 },
    });

    // Changing width re-runs the scrollbar measurement after the DOM metrics
    // above have been installed. The 364px plane is 340px of columns plus the
    // modern scrollbar's 24px gutter.
    rerender(
      <BGrid
        width={201}
        height={300}
        columns={columns}
        data={sampleData}
        frozenColumnIndex={1}
        scrollbar={{ variant: 'modern' }}
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 2 } }}
      />,
    );

    const gridContainer = container.querySelector<HTMLElement>('[role="grid"]')!;
    gridContainer.focus();
    fireEvent.keyDown(gridContainer, { key: 'ArrowRight' });

    expect(scrollContainer.scrollLeft).toBe(164);
    expect(container.querySelector('td[data-row-index="0"][data-column-index="3"]')).toHaveClass(
      'bgrid-cell-active',
    );
  });

  it('supports controlled activeCell prop', () => {
    const onActiveCellChange = vi.fn();
    const { container, rerender } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        cellNavigationOptions={{
          activeCell: { rowIndex: 2, columnIndex: 3 },
          onActiveCellChange,
        }}
      />,
    );

    const cell23 = container.querySelector('td[data-row-index="2"][data-column-index="3"]');
    expect(cell23?.classList.contains('bgrid-cell-active')).toBe(true);
    expect(onActiveCellChange).not.toHaveBeenCalled();

    // Update activeCell prop externally
    rerender(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        cellNavigationOptions={{
          activeCell: { rowIndex: 4, columnIndex: 1 },
          onActiveCellChange,
        }}
      />,
    );

    const cell41 = container.querySelector('td[data-row-index="4"][data-column-index="1"]');
    expect(cell41?.classList.contains('bgrid-cell-active')).toBe(true);
    expect(onActiveCellChange).not.toHaveBeenCalled();
  });

  it('clamps a controlled active cell when row or column bounds shrink', () => {
    const onActiveCellChange = vi.fn();
    const { container, rerender } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        cellNavigationOptions={{
          activeCell: { rowIndex: 99, columnIndex: 99 },
          onActiveCellChange,
        }}
      />,
    );

    expect(container.querySelector('td[data-row-index="4"][data-column-index="3"]')?.classList).toContain(
      'bgrid-cell-active',
    );

    rerender(
      <BGrid
        width={500}
        height={300}
        columns={columns.slice(0, 2)}
        data={sampleData.slice(0, 2)}
        cellNavigationOptions={{
          activeCell: { rowIndex: 99, columnIndex: 99 },
          onActiveCellChange,
        }}
      />,
    );

    expect(container.querySelector('td[data-row-index="1"][data-column-index="1"]')?.classList).toContain(
      'bgrid-cell-active',
    );
    expect(onActiveCellChange).not.toHaveBeenCalled();
  });

  it('does not change the rendered active cell until a controlled parent updates activeCell', () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <BGrid
        width={500}
        height={300}
        columns={columns}
        data={sampleData}
        cellNavigationOptions={{
          activeCell: { rowIndex: 0, columnIndex: 0 },
          onActiveCellChange,
        }}
      />,
    );

    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();
    fireEvent.keyDown(gridContainer, { key: 'ArrowRight' });

    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 0, columnIndex: 1 });
    expect(container.querySelector('td[data-row-index="0"][data-column-index="0"]')?.classList).toContain('bgrid-cell-active');
    expect(container.querySelector('td[data-row-index="0"][data-column-index="1"]')?.classList).not.toContain('bgrid-cell-active');
  });
});
