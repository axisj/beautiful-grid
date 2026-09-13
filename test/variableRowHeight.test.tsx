import * as React from 'react';
import { act, cleanup, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BGrid, type BGridProps, type BGridRef } from '../beautiful-grid';
import { createRowHeightMetrics, getRowIndexAtOffset, getVisibleScrollableRowRange } from '../beautiful-grid/utils';

type Row = { id: number; height?: number };
const columns = [{ id: 'id', key: 'id', label: 'ID', width: 300 }];
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

afterEach(cleanup);

describe('variable row height', () => {
  it('caches every displayed height once and uses cumulative offsets for scrolling and rendering', () => {
    const data = rows(100);
    const ref = React.createRef<BGridRef>();
    const getRowHeight = vi.fn((row: Row) => (row.id % 10 === 0 ? 40 : 20));
    const { container } = render(<BGrid {...defaults} data={data} getRowHeight={getRowHeight} ref={ref} />);

    expect(getRowHeight).toHaveBeenCalledTimes(100);
    expect(container.querySelector('.bgrid-scroll-plane')).toHaveAttribute('data-bgrid-logical-height', '2200');
    expect(container.querySelector('tr[data-ri="0"]')).toHaveStyle({ '--bgrid-item-cell-height': '40px' });

    act(() => ref.current!.scrollToRow(40, { align: 'start' }));

    expect(container.querySelector('.bgrid-scroll-plane')).toHaveAttribute('data-bgrid-logical-scroll-top', '880');
    expect(container.querySelector('td[data-row-index="40"]')).toBeInTheDocument();
    expect(container.querySelector('tr[data-ri="40"]')).toHaveStyle({ '--bgrid-item-cell-height': '40px' });
    expect(getRowHeight).toHaveBeenCalledTimes(100);
  });

  it('rebuilds the cache when data changes and falls back for invalid callback values', () => {
    const first = Array.from({ length: 20 }, (_, id) => ({ values: { id, height: id === 0 ? 35 : 0 } }));
    const getRowHeight = vi.fn((row: Row) => row.height ?? Number.NaN);
    const { container, rerender } = render(<BGrid {...defaults} data={first} getRowHeight={getRowHeight} />);

    expect(container.querySelector('.bgrid-scroll-plane')).toHaveAttribute('data-bgrid-logical-height', '415');
    expect(container.querySelector('tr[data-ri="0"]')).toHaveStyle({ '--bgrid-item-cell-height': '35px' });
    expect(container.querySelector('tr[data-ri="1"]')).toHaveStyle({ '--bgrid-item-cell-height': '20px' });

    rerender(<BGrid {...defaults} data={[...first, { values: { id: 20, height: 45 } }]} getRowHeight={getRowHeight} />);
    expect(container.querySelector('.bgrid-scroll-plane')).toHaveAttribute('data-bgrid-logical-height', '460');
    expect(getRowHeight).toHaveBeenCalledTimes(41);
  });

  it('uses binary-search offsets for large datasets and frozen-row windows', () => {
    const data = rows(100_000);
    const getRowHeight = vi.fn((row: Row) => (row.id % 2 === 0 ? 24 : 36));
    const metrics = createRowHeightMetrics(data, 20, getRowHeight);
    const target = 75_000;

    expect(getRowHeight).toHaveBeenCalledTimes(data.length);
    expect(getRowIndexAtOffset(metrics.offsets, metrics.offsets[target])).toBe(target);
    expect(getRowIndexAtOffset(metrics.offsets, metrics.offsets[target + 1] - 1)).toBe(target);

    const range = getVisibleScrollableRowRange({
      scrollTop: metrics.offsets[target] - metrics.offsets[3],
      viewportHeight: 200,
      rowHeight: 20,
      frozenRowCount: 3,
      totalRowCount: data.length,
      rowOffsets: metrics.offsets,
      overscan: 0,
      windowSize: 1,
    });
    expect(range.startRowIndex).toBe(target);
    expect(range.paddingTop).toBe(metrics.offsets[target] - metrics.offsets[3]);
    expect(range.scrollContentHeight).toBe(metrics.totalHeight - metrics.offsets[3]);
  });

  it('preserves fixed-height behavior when getRowHeight is omitted', () => {
    const ref = React.createRef<BGridRef>();
    const { container } = render(<BGrid {...defaults} data={rows(100)} ref={ref} />);
    act(() => ref.current!.scrollToRow(40, { align: 'start' }));
    expect(container.querySelector('.bgrid-scroll-plane')).toHaveAttribute('data-bgrid-logical-scroll-top', '800');
    expect(container.querySelector('tr[data-ri="40"]')).toHaveStyle({ '--bgrid-item-cell-height': '20px' });
  });

  it('uses cumulative heights for frozen rows and selection overlays', () => {
    const ref = React.createRef<BGridRef>();
    const { container } = render(
      <BGrid
        {...defaults}
        data={rows(20)}
        ref={ref}
        frozenRowCount={2}
        getRowHeight={row => (row.id === 0 ? 40 : row.id === 1 ? 30 : 20)}
        cellNavigationOptions={{ activeCell: { rowIndex: 1, columnIndex: 0 } }}
      />,
    );

    expect(container.querySelector('.bgrid-frozen-rows-layer')).toHaveStyle({ height: '70px' });
    expect(container.querySelector('[data-bgrid-active-fragment="true"]')).toHaveStyle({
      top: '40px',
      height: '30px',
    });
    act(() => ref.current!.scrollToRow(10, { align: 'start' }));
    expect(container.querySelector('.bgrid-scroll-plane')).toHaveAttribute('data-bgrid-logical-scroll-top', '160');
  });
});
