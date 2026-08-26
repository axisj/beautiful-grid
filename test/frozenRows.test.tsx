import * as React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BGrid } from '../beautiful-grid';
import type { BGridColumn, BGridProps } from '../beautiful-grid/types';

interface Row {
  id: number;
  name: string;
  amount: number;
}

const columns: BGridColumn<Row>[] = [
  { id: 'id', key: 'id', label: 'ID', width: 80 },
  { id: 'name', key: 'name', label: 'Name', width: 140, editable: true, editor: { type: 'text' } },
  { id: 'amount', key: 'amount', label: 'Amount', width: 120 },
];

const data = Array.from({ length: 6 }, (_, index) => ({
  values: { id: index + 1, name: `Row ${index + 1}`, amount: (index + 1) * 100 },
}));

const topSummary: NonNullable<BGridProps<Row>['summary']> = {
  position: 'top',
  columns: [
    {
      columnIndex: 0,
      itemRender: () => 'Top summary',
    },
  ],
};

describe('frozen rows', () => {
  it('polls native scroll position while sticky panels remain free of JavaScript transforms', () => {
    const longData = Array.from({ length: 40 }, (_, index) => ({
      values: { id: index + 1, name: `Row ${index + 1}`, amount: (index + 1) * 100 },
    }));
    const { container, unmount } = render(
      <BGrid<Row>
        width={240}
        height={260}
        columns={columns}
        data={longData}
        frozenColumnIndex={1}
        frozenRowCount={1}
        summary={topSummary}
      />,
    );
    const animationFrames: FrameRequestCallback[] = [];
    const requestAnimationFrameSpy = vi.spyOn(window, 'requestAnimationFrame').mockImplementation(callback => {
      animationFrames.push(callback);
      return animationFrames.length;
    });
    const scrollContainer = container.querySelector<HTMLElement>('[role="rfdg-scroll-container"]')!;

    scrollContainer.scrollTop = 96.5;
    scrollContainer.scrollLeft = 70.25;
    fireEvent.scroll(scrollContainer);

    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(1);
    act(() => animationFrames.shift()!(0));

    expect(scrollContainer).toHaveAttribute('data-bgrid-scroll-plane', 'sticky');
    expect(container.querySelector<HTMLElement>('[role="rfdg-header"]')!.style.transform).toBe('');
    expect(container.querySelector<HTMLElement>('[role="rfdg-summary"]')!.style.transform).toBe('');
    expect(container.querySelector<HTMLElement>('[role="rfdg-frozen-rows-main"]')!.style.transform).toBe('');
    expect(container.querySelector<HTMLElement>('[data-bgrid-quadrant="body-left"]')!.style.transform).toBe('');
    expect(container.querySelector('[role="grid"]')).toHaveAttribute('data-bgrid-scrolling', 'true');
    expect(requestAnimationFrameSpy).toHaveBeenCalledTimes(2);

    scrollContainer.scrollTop = 112.75;
    scrollContainer.scrollLeft = 91.5;
    act(() => animationFrames.shift()!(16.7));

    expect(scrollContainer.scrollTop).toBe(112.75);
    expect(scrollContainer.scrollLeft).toBe(91.5);
    expect(container.querySelector<HTMLElement>('[role="rfdg-header"]')!.style.transform).toBe('');
    expect(container.querySelector<HTMLElement>('[data-bgrid-quadrant="body-left"]')!.style.transform).toBe('');

    requestAnimationFrameSpy.mockRestore();
    unmount();
  });

  it('renders row and column freezing as four non-overlapping quadrants', () => {
    const { container } = render(
      <BGrid<Row>
        width={420}
        height={260}
        columns={columns}
        data={data}
        frozenColumnIndex={1}
        frozenRowCount={2}
      />,
    );

    const topLeft = container.querySelector('[data-bgrid-quadrant="top-left"]')!;
    const topMain = container.querySelector('[data-bgrid-quadrant="top-main"]')!;
    const bodyLeft = container.querySelector('[data-bgrid-quadrant="body-left"]')!;
    const bodyMain = container.querySelector('[data-bgrid-quadrant="body-main"]')!;

    expect(topLeft.querySelectorAll('tr[data-ri]')).toHaveLength(2);
    expect(topMain.querySelectorAll('tr[data-ri]')).toHaveLength(2);
    expect(topLeft.querySelector('tr[data-ri="0"]')).toBeInTheDocument();
    expect(topLeft.querySelector('tr[data-ri="1"]')).toBeInTheDocument();
    expect(topMain.querySelector('td[data-column-index="0"]')).not.toBeInTheDocument();
    expect(topMain.querySelector('td[data-column-index="1"]')).toBeInTheDocument();

    expect(bodyLeft.querySelector('tr[data-ri="0"]')).not.toBeInTheDocument();
    expect(bodyMain.querySelector('tr[data-ri="1"]')).not.toBeInTheDocument();
    expect(bodyLeft.querySelector('tr[data-ri="2"]')).toBeInTheDocument();
    expect(bodyMain.querySelector('tr[data-ri="2"]')).toBeInTheDocument();
  });

  it('continues the frozen column boundary through header, summary, and both row bands', () => {
    const { container } = render(
      <BGrid<Row>
        width={420}
        height={260}
        columns={columns}
        data={data}
        frozenColumnIndex={1}
        frozenRowCount={2}
        summary={topSummary}
        showLineNumber
      />,
    );

    expect(container.querySelector('[role="rfdg-frozen-header"]')).toHaveClass('bgrid-frozen-column-boundary');
    expect(
      container.querySelector(
        '[role="rfdg-frozen-header"] .bgrid-col-resizer[data-bgrid-frozen-boundary="true"]',
      ),
    ).toBeInTheDocument();
    expect(
      container.querySelector('[role="rfdg-header"] .bgrid-col-resizer[data-bgrid-frozen-boundary="true"]'),
    ).not.toBeInTheDocument();
    expect(container.querySelector('[role="grid"]')).toHaveAttribute('data-bgrid-frozen-columns', 'true');
    expect(container.querySelector('[role="rfdg-frozen-summary"]')).toHaveClass('bgrid-frozen-column-boundary');
    expect(container.querySelector('.bgrid-frozen-rows-left')).toHaveClass('bgrid-frozen-column-boundary');
    expect(container.querySelector('[role="rfdg-frozen-scroll-container"]')).toHaveClass(
      'bgrid-frozen-column-boundary',
    );
    expect(container.querySelectorAll('.bgrid-line-number-cell')).not.toHaveLength(0);
    expect(container.querySelector('.bgrid-vertical-scrollbar-gutter')).toBeInTheDocument();
  });

  it('places top summary before the frozen data band and preserves interactions', async () => {
    const onCheckedChange = vi.fn();
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <BGrid<Row>
        width={420}
        height={260}
        columns={columns}
        data={data}
        frozenColumnIndex={1}
        frozenRowCount={2}
        summary={topSummary}
        editable
        rowChecked={{ onChange: onCheckedChange }}
        cellNavigationOptions={{ onActiveCellChange }}
      />,
    );

    const summaryBand = container.querySelector('[role="rfdg-summary-container"]')!;
    const frozenBand = container.querySelector('[data-bgrid-row-band="frozen"]')!;
    expect(summaryBand.compareDocumentPosition(frozenBand) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    const checkbox = frozenBand.querySelector('[role="checkbox"]')!;
    fireEvent.click(checkbox);
    await waitFor(() => expect(onCheckedChange).toHaveBeenCalled());

    const frozenCell = frozenBand.querySelector('td[data-row-index="1"][data-column-index="1"]')!;
    fireEvent.pointerDown(frozenCell, { button: 0 });
    expect(frozenCell).toHaveClass('bgrid-cell-active');
    expect(onActiveCellChange).toHaveBeenCalledWith({ rowIndex: 1, columnIndex: 1 });

    const editorGateway = container.querySelector('[data-bgrid-text-editor-gateway="true"]')!;
    fireEvent.keyDown(editorGateway, { key: 'F2' });
    await waitFor(() => expect(editorGateway).toHaveClass('bgrid-text-editor-active'));
  });

  it('clamps and updates the frozen row count when props change', async () => {
    const { container, rerender } = render(
      <BGrid<Row> width={420} height={260} columns={columns} data={data.slice(0, 2)} frozenRowCount={10} />,
    );

    expect(container.querySelectorAll('[data-bgrid-quadrant="top-main"] tr[data-ri]')).toHaveLength(2);
    expect(container.querySelector('[data-bgrid-row-band="scrollable"] tr[data-ri]')).not.toBeInTheDocument();

    rerender(
      <BGrid<Row> width={420} height={260} columns={columns} data={data.slice(0, 2)} frozenRowCount={1} />,
    );

    await waitFor(() => {
      expect(container.querySelectorAll('[data-bgrid-quadrant="top-main"] tr[data-ri]')).toHaveLength(1);
      expect(container.querySelector('[data-bgrid-quadrant="body-main"] tr[data-ri="1"]')).toBeInTheDocument();
    });
  });

  it('re-merges each visual fragment when a merged range crosses the frozen-row boundary', () => {
    const mergedData = [
      { values: { id: 1, name: 'A', amount: 100 } },
      { values: { id: 2, name: 'A', amount: 200 } },
      { values: { id: 3, name: 'A', amount: 300 } },
      { values: { id: 4, name: 'B', amount: 400 } },
    ];
    const { container } = render(
      <BGrid<Row>
        width={420}
        height={260}
        columns={columns}
        data={mergedData}
        frozenRowCount={1}
        cellMergeOptions={{ columnsMap: { 1: { mergeBy: 'name' } } }}
      />,
    );

    const frozenFragment = container.querySelector(
      '[data-bgrid-quadrant="top-main"] td[data-row-index="0"][data-column-index="1"]',
    );
    const scrollableFragment = container.querySelector(
      '[data-bgrid-quadrant="body-main"] td[data-row-index="1"][data-column-index="1"]',
    );

    expect(frozenFragment).toBeInTheDocument();
    expect(frozenFragment).not.toHaveAttribute('rowspan');
    expect(scrollableFragment).toHaveAttribute('rowspan', '2');
    expect(
      container.querySelector('[data-bgrid-quadrant="body-main"] td[data-row-index="2"][data-column-index="1"]'),
    ).not.toBeInTheDocument();
  });
});
