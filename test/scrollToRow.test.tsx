import * as React from 'react';
import { act, cleanup, fireEvent, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { BGrid, type BGridRef, type BGridProps } from '../beautiful-grid';

type Row = { id: number };
const columns = [{ id: 'id', key: 'id', label: 'ID', width: 600 }];
const rows = (count: number) => Array.from({ length: count }, (_, id) => ({ values: { id } }));
const defaults: BGridProps<Row> = {
  width: 300,
  height: 232,
  headerHeight: 30,
  itemHeight: 20,
  itemPadding: 0,
  columns,
  status: { visible: false },
  scrollbar: { horizontal: { visible: false } },
};
const logicalTop = (container: HTMLElement) =>
  Number(container.querySelector('.bgrid-scroll-plane')?.getAttribute('data-bgrid-logical-scroll-top'));
afterEach(cleanup);

describe('BGridRef.scrollToRow', () => {
  it.each([
    ['start', 800],
    ['center', 710],
    ['end', 620],
    ['nearest', 620],
  ] as const)('aligns a row with %s and preserves horizontal scroll', (align, expected) => {
    const ref = React.createRef<BGridRef>();
    const { container } = render(<BGrid {...defaults} data={rows(100)} ref={ref} scrollLeft={90} />);
    act(() => ref.current!.scrollToRow(40, { align }));
    expect(logicalTop(container)).toBe(expected);
    expect(container.querySelector('[role="rfdg-scroll-container"]')!.scrollLeft).toBe(90);
    expect(container.querySelector('td[data-row-index="40"]')).toBeInTheDocument();
  });

  it('keeps visible rows in place, moves upward, clamps boundaries and ignores invalid indexes', () => {
    const ref = React.createRef<BGridRef>();
    const { container } = render(<BGrid {...defaults} data={rows(100)} ref={ref} />);
    act(() => ref.current!.scrollToRow(40, { align: 'start' }));
    act(() => ref.current!.scrollToRow(42));
    expect(logicalTop(container)).toBe(800);
    act(() => ref.current!.scrollToRow(10));
    expect(logicalTop(container)).toBe(200);
    for (const rowIndex of [-1, 100, 2.5, NaN, Infinity]) {
      act(() => ref.current!.scrollToRow(rowIndex));
      expect(logicalTop(container)).toBe(200);
    }
    act(() => ref.current!.scrollToRow(99, { align: 'start' }));
    expect(logicalTop(container)).toBe(1800);
    act(() => ref.current!.scrollToRow(0, { align: 'end' }));
    expect(logicalTop(container)).toBe(0);
  });

  it('accounts for frozen rows and does not scroll to a frozen row', () => {
    const ref = React.createRef<BGridRef>();
    const { container } = render(<BGrid {...defaults} data={rows(100)} frozenRowCount={2} ref={ref} />);
    act(() => ref.current!.scrollToRow(40, { align: 'start' }));
    expect(logicalTop(container)).toBe(760);
    act(() => ref.current!.scrollToRow(1));
    expect(logicalTop(container)).toBe(760);
    act(() => ref.current!.scrollToRow(50, { align: 'end' }));
    expect(logicalTop(container)).toBe(820);
  });

  it('supports appending and requesting the new row in the same event, repeatedly', async () => {
    function Example() {
      const ref = React.useRef<BGridRef>(null);
      const [data, setData] = React.useState(() => rows(100));
      return (
        <>
          <button
            onClick={() => {
              setData([...data, { values: { id: data.length } }]);
              ref.current!.scrollToRow(data.length, { align: 'end' });
            }}
          >
            Append
          </button>
          <BGrid {...defaults} data={data} ref={ref} />
        </>
      );
    }
    const { container, getByText } = render(
      <React.StrictMode>
        <Example />
      </React.StrictMode>,
    );
    fireEvent.click(getByText('Append'));
    expect(logicalTop(container)).toBe(1820);
    await act(async () => {
      fireEvent.scroll(container.querySelector('[role="rfdg-scroll-container"]')!);
      await new Promise(resolve => requestAnimationFrame(resolve));
    });
    expect(logicalTop(container)).toBe(1820);
    fireEvent.click(getByText('Append'));
    expect(logicalTop(container)).toBe(1840);
  });

  it('preserves the current position on data growth without a request and clamps after deletion', () => {
    const ref = React.createRef<BGridRef>();
    const { container, rerender } = render(<BGrid {...defaults} data={rows(100)} ref={ref} />);
    act(() => ref.current!.scrollToRow(40, { align: 'start' }));
    rerender(<BGrid {...defaults} data={rows(110)} ref={ref} />);
    expect(logicalTop(container)).toBe(800);
    rerender(<BGrid {...defaults} data={rows(20)} ref={ref} />);
    expect(logicalTop(container)).toBe(200);
    rerender(<BGrid {...defaults} data={[]} ref={ref} />);
    act(() => ref.current!.scrollToRow(0));
    expect(logicalTop(container)).toBe(0);
    rerender(<BGrid {...defaults} data={rows(100)} ref={ref} scrollTop={400} />);
    expect(logicalTop(container)).toBe(400);
  });

  it('uses displayed indexes after client sorting and preserves the active cell', () => {
    const ref = React.createRef<BGridRef>();
    const { container } = render(
      <BGrid
        {...defaults}
        data={rows(100)}
        ref={ref}
        cellNavigationOptions={{ enabled: true, activeCell: { rowIndex: 0, columnIndex: 0 } }}
        dataControl={{
          mode: 'client',
          query: {
            sortParams: [{ key: 'id', orderBy: 'desc' }],
            filterParams: [],
          },
          onChange: () => {},
        }}
      />,
    );
    act(() => ref.current!.scrollToRow(40, { align: 'start' }));
    expect(container.querySelector('td[data-row-index="40"]')).toHaveTextContent('59');
    expect(logicalTop(container)).toBe(800);
    act(() => ref.current!.scrollToRow(0));
    expect(container.querySelector('td[data-row-index="0"]')).toHaveClass('bgrid-cell-active');
  });

  it('scrolls after an internal edit without requiring the parent to replace data', async () => {
    const ref = React.createRef<BGridRef>();
    const { container } = render(
      <BGrid
        {...defaults}
        data={rows(100)}
        ref={ref}
        editable
        columns={[{ ...columns[0], editable: true, editor: { type: 'text' } }]}
        cellNavigationOptions={{ enabled: true }}
      />,
    );
    fireEvent.doubleClick(container.querySelector('td[data-row-index="0"]')!);
    const editor = container.querySelector('[data-bgrid-text-editor-gateway="true"]')!;
    fireEvent.change(editor, { target: { value: 'Edited' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    await waitFor(() => expect(container.querySelector('td[data-row-index="0"]')).toHaveTextContent('Edited'));
    act(() => ref.current!.scrollToRow(40, { align: 'start' }));
    expect(logicalTop(container)).toBe(800);
  });

  it('resets scrolling on a real page change and keeps initial scroll props', () => {
    const data = rows(100);
    const { container, rerender } = render(
      <BGrid {...defaults} data={data} scrollTop={400} page={{ currentPage: 0 }} />,
    );
    expect(logicalTop(container)).toBe(400);
    rerender(<BGrid {...defaults} data={data} scrollTop={400} page={{ currentPage: 1 }} />);
    expect(logicalTop(container)).toBe(0);
  });

  it('reaches the last row of a virtual scroll window and isolates refs between grids', () => {
    const firstRef = React.createRef<BGridRef>();
    const secondRef = React.createRef<BGridRef>();
    const first = render(<BGrid {...defaults} data={rows(60_000)} ref={firstRef} />);
    const second = render(<BGrid {...defaults} data={rows(100)} ref={secondRef} />);
    act(() => firstRef.current!.scrollToRow(59_999, { align: 'end' }));
    expect(logicalTop(first.container)).toBe(1_199_800);
    expect(first.container.querySelector('td[data-row-index="59999"]')).toHaveTextContent('59999');
    expect(logicalTop(second.container)).toBe(0);
    first.unmount();
    expect(firstRef.current).toBeNull();
  });
});
