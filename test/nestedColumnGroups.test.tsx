import * as React from 'react';
import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BGrid } from '../beautiful-grid';
import type { BGridColumn, BGridColumnGroupNode } from '../beautiful-grid/types';

interface Row {
  a: string;
  b: string;
  c: string;
  d: string;
  e: string;
}

const columns: BGridColumn<Row>[] = ['a', 'b', 'c', 'd', 'e'].map(id => ({
  id,
  key: id,
  label: id.toUpperCase(),
  width: 100,
  toolbox: true,
}));

const columnGroups: BGridColumnGroupNode[] = [
  {
    id: 'business',
    label: 'Business',
    children: [
      'a',
      {
        id: 'sales',
        label: 'Sales',
        children: ['b', { id: 'details', label: 'Details', children: ['c', 'd'] }],
      },
    ],
  },
];

describe('nested column group headers', () => {
  it('applies header classes and styles to leaf and group cells in both header regions', () => {
    const styledColumns = columns.map(column => {
      if (column.id === 'a') {
        return {
          ...column,
          headerClassName: 'header-a',
          headerStyle: { backgroundColor: 'lavender', textAlign: 'right' as const },
        };
      }
      if (column.id === 'd') {
        return {
          ...column,
          headerClassName: 'header-d',
          headerStyle: { backgroundColor: 'honeydew' },
        };
      }
      return column;
    });
    const styledGroups: BGridColumnGroupNode[] = [
      {
        ...columnGroups[0],
        headerAlign: 'left',
        className: 'header-business',
        headerStyle: { backgroundColor: 'aliceblue', textAlign: 'right' },
      },
    ];

    const { container } = render(
      <BGrid<Row>
        width={640}
        height={260}
        headerHeight={88}
        frozenColumnIndex={3}
        columns={styledColumns}
        columnGroups={styledGroups}
        data={[]}
      />,
    );

    const frozenHead = container.querySelector('[role="rfdg-head-frozen"]')!;
    const scrollingHead = container.querySelector('[role="rfdg-head"]')!;
    const frozenGroup = frozenHead.querySelector('[data-group-id="business"]') as HTMLElement;
    const scrollingGroup = scrollingHead.querySelector('[data-group-id="business"]') as HTMLElement;
    const frozenColumn = frozenHead.querySelector(
      '[data-header-cell-type="column"][data-column-index="0"]',
    ) as HTMLElement;
    const scrollingColumn = scrollingHead.querySelector(
      '[data-header-cell-type="column"][data-column-index="3"]',
    ) as HTMLElement;

    expect(frozenGroup).toHaveClass('header-business');
    expect(scrollingGroup).toHaveClass('header-business');
    expect(frozenGroup).toHaveStyle({ backgroundColor: 'aliceblue', textAlign: 'left' });
    expect(scrollingGroup).toHaveStyle({ backgroundColor: 'aliceblue', textAlign: 'left' });
    expect(frozenColumn).toHaveClass('header-a');
    expect(frozenColumn).toHaveStyle({ backgroundColor: 'lavender', textAlign: 'right' });
    expect(scrollingColumn).toHaveClass('header-d');
    expect(scrollingColumn).toHaveStyle({ backgroundColor: 'honeydew' });
  });

  it('renders arbitrary depth and splits groups across the frozen boundary', () => {
    const { container } = render(
      <BGrid<Row>
        width={640}
        height={260}
        headerHeight={88}
        frozenColumnIndex={3}
        columns={columns}
        columnGroups={columnGroups}
        data={[{ values: { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' } }]}
      />,
    );

    const frozenHead = container.querySelector('[role="rfdg-head-frozen"]')!;
    const scrollingHead = container.querySelector('[role="rfdg-head"]')!;
    expect(frozenHead.querySelectorAll(':scope > tr')).toHaveLength(4);
    expect(scrollingHead.querySelectorAll(':scope > tr')).toHaveLength(4);

    expect(frozenHead.querySelector('[data-group-id="business"]')).toHaveAttribute('colspan', '3');
    expect(scrollingHead.querySelector('[data-group-id="business"]')).toHaveAttribute('colspan', '1');
    expect(frozenHead.querySelector('[data-group-id="details"]')).toHaveAttribute('colspan', '1');
    expect(scrollingHead.querySelector('[data-group-id="details"]')).toHaveAttribute('colspan', '1');

    expect(frozenHead.querySelector('.bgrid-head-cell[data-column-index="0"]')).toHaveAttribute('rowspan', '3');
    expect(scrollingHead.querySelector('.bgrid-head-cell[data-column-index="4"]')).toHaveAttribute('rowspan', '4');
    expect(container.querySelectorAll('.bgrid-head-group-cell .bgrid-head-column')).toHaveLength(0);
  });

  it('marks only the leaf column header for the active cell', () => {
    const { container } = render(
      <BGrid<Row>
        width={640}
        height={260}
        headerHeight={88}
        frozenColumnIndex={3}
        columns={columns}
        columnGroups={columnGroups}
        data={[{ values: { a: 'A', b: 'B', c: 'C', d: 'D', e: 'E' } }]}
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 2 } }}
      />,
    );

    const activeHeaders = container.querySelectorAll('[data-bgrid-column-axis-active="true"]');
    expect(activeHeaders).toHaveLength(1);
    expect(activeHeaders[0]).toHaveAttribute('data-header-cell-type', 'column');
    expect(activeHeaders[0]).toHaveAttribute('data-column-index', '2');
    expect(container.querySelector('[data-group-id="business"]')).not.toHaveClass('bgrid-column-axis-active');
    expect(container.querySelector('[data-group-id="sales"]')).not.toHaveClass('bgrid-column-axis-active');
    expect(container.querySelector('[data-group-id="details"]')).not.toHaveClass('bgrid-column-axis-active');
  });

  it('warns and renders flat headers when the tree is invalid', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { container } = render(
      <BGrid<Row>
        width={640}
        height={220}
        columns={columns}
        columnGroups={[{ id: 'invalid', label: 'Invalid', children: ['a', 'missing'] }]}
        data={[]}
      />,
    );

    expect(container.querySelectorAll('[role="rfdg-head"] > tr')).toHaveLength(1);
    expect(warn).toHaveBeenCalledWith(expect.stringContaining('Invalid column group configuration'));
    warn.mockRestore();
  });
});
