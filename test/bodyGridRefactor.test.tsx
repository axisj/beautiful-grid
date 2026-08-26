import * as React from 'react';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BGrid } from '../beautiful-grid';
import type { BGridColumn } from '../beautiful-grid/types';

interface Row {
  id: number;
  group: string;
  name: string;
}

const columns: BGridColumn<Row>[] = [
  { id: 'id', key: 'id', label: 'ID', width: 70 },
  { id: 'group', key: 'group', label: 'Group', width: 100 },
  { id: 'name', key: 'name', label: 'Name', width: 140, editable: true },
];

const data = [
  { values: { id: 1, group: 'A', name: 'Alpha' } },
  { values: { id: 2, group: 'A', name: 'Beta' } },
  { values: { id: 3, group: 'B', name: 'Gamma' } },
];

describe('shared body grid renderer', () => {
  it('keeps row state and row headers aligned across left and main regions', () => {
    const { container } = render(
      <BGrid<Row>
        width={420}
        height={240}
        columns={columns}
        data={data}
        frozenColumnIndex={1}
        showLineNumber
        rowChecked={{ onChange: vi.fn() }}
        getRowClassName={index => (index === 1 ? 'custom-row' : undefined)}
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 1, columnIndex: 0 } }}
      />,
    );

    const leftBody = container.querySelector('[role="rfdg-body-frozen"]')!;
    const mainBody = container.querySelector('[role="rfdg-body"]')!;
    expect(leftBody.querySelectorAll('tr[data-ri]')).toHaveLength(3);
    expect(mainBody.querySelectorAll('tr[data-ri]')).toHaveLength(3);
    expect(leftBody.querySelector('tr[data-ri="1"]')).toHaveClass('custom-row');
    expect(mainBody.querySelector('tr[data-ri="1"]')).toHaveClass('custom-row');
    expect(leftBody.querySelectorAll('.bgrid-line-number-cell')).toHaveLength(3);
    expect(leftBody.querySelectorAll('[role="checkbox"]')).toHaveLength(3);
    expect(mainBody.querySelector('.bgrid-line-number-cell')).not.toBeInTheDocument();
    expect(leftBody.querySelector('td[data-row-index="1"][data-column-index="0"]')).toHaveClass('bgrid-cell-active');
  });

  it('preserves merged cells, selection, and activation in both regions', () => {
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <BGrid<Row>
        width={420}
        height={240}
        columns={columns}
        data={data}
        frozenColumnIndex={1}
        cellMergeOptions={{
          columnsMap: {
            0: { mergeBy: 'group' },
            1: { mergeBy: 'group' },
          },
        }}
        cellNavigationOptions={{ onActiveCellChange }}
      />,
    );

    const leftMerged = container.querySelector(
      '[role="rfdg-body-frozen"] td[data-row-index="0"][data-column-index="0"]',
    );
    const mainMerged = container.querySelector('[role="rfdg-body"] td[data-row-index="0"][data-column-index="1"]');
    expect(leftMerged).toHaveAttribute('rowspan', '2');
    expect(mainMerged).toHaveAttribute('rowspan', '2');

    const mainCell = container.querySelector(
      '[role="rfdg-body"] td[data-row-index="2"][data-column-index="2"]',
    )!;
    fireEvent.pointerDown(mainCell, { button: 0 });
    expect(mainCell).toHaveClass('bgrid-cell-active');
    expect(mainCell).not.toHaveClass('bgrid-cell-selected');
    expect(
      container.querySelector('[data-bgrid-selection-quadrant="body-main"] [data-bgrid-selection-fragment="true"]'),
    ).toHaveStyle({ left: '100px', top: '58px', width: '140px', height: '29px' });
    expect(onActiveCellChange).toHaveBeenCalledWith({ rowIndex: 2, columnIndex: 2 });
  });

  it('renders every merged column when multiple columns share the same data key', () => {
    const sharedKeyColumns: BGridColumn<Row>[] = [
      { id: 'id', key: 'id', label: 'ID', width: 70 },
      { id: 'name-a', key: 'name', label: 'Name A', width: 120 },
      { id: 'name-b', key: 'name', label: 'Name B', width: 120 },
    ];
    const onActiveCellChange = vi.fn();
    const { container } = render(
      <BGrid<Row>
        width={420}
        height={240}
        columns={sharedKeyColumns}
        data={data}
        cellMergeOptions={{
          columnsMap: {
            1: { mergeBy: 'group' },
            2: { mergeBy: 'group' },
          },
        }}
        cellNavigationOptions={{
          defaultActiveCell: { rowIndex: 1, columnIndex: 0 },
          onActiveCellChange,
        }}
      />,
    );

    const firstMergedColumn = container.querySelectorAll('td[data-column-index="1"][data-row-index]');
    const secondMergedColumn = container.querySelectorAll('td[data-column-index="2"][data-row-index]');
    expect(firstMergedColumn).toHaveLength(2);
    expect(secondMergedColumn).toHaveLength(2);
    expect(firstMergedColumn[0]).toHaveAttribute('rowspan', '2');
    expect(secondMergedColumn[0]).toHaveAttribute('rowspan', '2');

    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();
    fireEvent.keyDown(gridContainer, { key: 'ArrowRight' });
    fireEvent.keyDown(gridContainer, { key: 'ArrowRight' });

    expect(onActiveCellChange).toHaveBeenLastCalledWith({ rowIndex: 0, columnIndex: 2 });
    expect(container.querySelectorAll('td.bgrid-cell-active[data-column-index="2"]')).toHaveLength(1);
    expect(container.querySelector('td.bgrid-cell-active[data-column-index="2"]')).toHaveAttribute('rowspan', '2');
  });
});
