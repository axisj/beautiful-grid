import * as React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BGrid } from '../beautiful-grid';
import type { BGridColumn, BGridColumnVisibilityChangeEvent } from '../beautiful-grid/types';
import { projectColumnVisibility } from '../beautiful-grid/utils/columnVisibility';

const data = [
  { values: { id: 1, name: 'Alice', team: 'Platform', amount: 100 } },
  { values: { id: 2, name: 'Bob', team: 'Product', amount: 200 } },
];

const columns: BGridColumn<(typeof data)[number]['values']>[] = [
  { id: 'id', key: 'id', label: 'ID', width: 70 },
  { id: 'name', key: 'name', label: 'Name', width: 120 },
  { id: 'team', key: 'team', label: 'Team', width: 120 },
  { id: 'amount', key: 'amount', label: 'Amount', width: 100 },
];

async function openColumnMenu(name: string) {
  const trigger = screen.getByRole('button', { name: `${name} 컬럼 메뉴` });
  fireEvent.pointerEnter(trigger);
  fireEvent.click(trigger);
  await screen.findByRole('dialog');
}

function renderedColumnLabels(container: HTMLElement) {
  return Array.from(container.querySelectorAll<HTMLElement>('[data-header-cell-type="column"]'))
    .map(cell => cell.textContent?.trim())
    .filter(Boolean);
}

describe('column visibility', () => {
  it('hides a column and restores it from another column menu', async () => {
    const { container } = render(
      <BGrid width={520} height={260} data={data} columns={columns} columnVisibility />,
    );

    await openColumnMenu('Team');
    fireEvent.click(screen.getByRole('button', { name: 'Team 컬럼 숨기기' }));

    await waitFor(() => expect(renderedColumnLabels(container)).not.toContain('Team'));
    expect(screen.queryByRole('button', { name: 'Team 컬럼 메뉴' })).not.toBeInTheDocument();

    await openColumnMenu('Name');
    fireEvent.click(screen.getByRole('button', { name: '숨긴 컬럼 1개 관리' }));
    fireEvent.click(screen.getByRole('button', { name: 'Team 컬럼 표시' }));

    await waitFor(() => expect(renderedColumnLabels(container)).toContain('Team'));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Name 컬럼 숨기기' })).toBeVisible());
  });

  it('shows every hidden column and prevents hiding the final visible column', async () => {
    const { container } = render(
      <BGrid width={520} height={260} data={data} columns={columns.slice(0, 3)} columnVisibility />,
    );

    await openColumnMenu('ID');
    fireEvent.click(screen.getByRole('button', { name: 'ID 컬럼 숨기기' }));
    await waitFor(() => expect(renderedColumnLabels(container)).not.toContain('ID'));

    await openColumnMenu('Name');
    fireEvent.click(screen.getByRole('button', { name: 'Name 컬럼 숨기기' }));
    await waitFor(() => expect(renderedColumnLabels(container)).toEqual(['Team']));

    await openColumnMenu('Team');
    expect(screen.getByRole('button', { name: 'Team 컬럼 숨기기' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: '숨긴 컬럼 2개 관리' }));
    fireEvent.click(screen.getByRole('button', { name: '모두 표시' }));

    await waitFor(() => expect(renderedColumnLabels(container)).toEqual(['ID', 'Name', 'Team']));
  });

  it('reports controlled visibility changes and keeps hidden-column filters active', async () => {
    const onChange = vi.fn<(
      hiddenColumnIds: string[],
      event: BGridColumnVisibilityChangeEvent<(typeof data)[number]['values']>,
    ) => void>();
    const query = {
      sortParams: [],
      filterParams: [{ columnId: 'team', type: 'values' as const, values: ['Product'] }],
    };
    const renderGrid = (hiddenColumnIds: string[]) => (
      <BGrid
        width={520}
        height={260}
        data={data}
        columns={columns}
        columnVisibility={{ hiddenColumnIds, onChange }}
        dataControl={{ mode: 'client', query, onChange: vi.fn() }}
      />
    );
    const { container, rerender } = render(renderGrid(['team']));

    expect(renderedColumnLabels(container)).not.toContain('Team');
    expect(container).toHaveTextContent('Bob');
    expect(container).not.toHaveTextContent('Alice');

    await openColumnMenu('Name');
    fireEvent.click(screen.getByRole('button', { name: '숨긴 컬럼 1개 관리' }));
    fireEvent.click(screen.getByRole('button', { name: 'Team 컬럼 표시' }));
    expect(onChange).toHaveBeenCalledWith([], expect.objectContaining({ type: 'show', columnId: 'team' }));
    expect(renderedColumnLabels(container)).not.toContain('Team');

    rerender(renderGrid([]));
    await waitFor(() => expect(renderedColumnLabels(container)).toContain('Team'));
  });

  it('projects frozen, grouped, merged, and summary column indexes', () => {
    const projection = projectColumnVisibility({
      columns,
      hiddenColumnIds: new Set(['name', 'team']),
      frozenColumnIndex: 3,
      columnsGroup: [
        { label: 'Identity', groupStartIndex: 0, groupEndIndex: 2 },
        { label: 'Metrics', groupStartIndex: 3, groupEndIndex: 3 },
      ],
      columnGroups: [
        {
          id: 'root',
          label: 'Root',
          children: ['id', { id: 'details', label: 'Details', children: ['name', 'team', 'amount'] }],
        },
      ],
      cellMergeOptions: {
        columnsMap: {
          1: { mergeBy: 'name' },
          3: { mergeBy: 'amount' },
        },
      },
      summary: {
        position: 'bottom',
        columns: [
          { columnIndex: 0, colSpan: 3 },
          { columnIndex: 3 },
        ],
      },
    });

    expect(projection.columns.map(column => column.id)).toEqual(['id', 'amount']);
    expect(projection.visibleOriginalIndexes).toEqual([0, 3]);
    expect(projection.frozenColumnIndex).toBe(1);
    expect(projection.columnsGroup).toEqual([
      expect.objectContaining({ groupStartIndex: 0, groupEndIndex: 0 }),
      expect.objectContaining({ groupStartIndex: 1, groupEndIndex: 1 }),
    ]);
    expect(projection.columnGroups[0].children).toEqual([
      'id',
      expect.objectContaining({ id: 'details', children: ['amount'] }),
    ]);
    expect(projection.cellMergeOptions?.columnsMap).toEqual({ 1: { mergeBy: 'amount' } });
    expect(projection.summary?.columns).toEqual([
      expect.objectContaining({ columnIndex: 0, colSpan: 1 }),
      expect.objectContaining({ columnIndex: 1, colSpan: 1 }),
    ]);
  });

  it('keeps one column visible when every ID is requested as hidden', () => {
    const { container } = render(
      <BGrid
        width={360}
        height={220}
        data={data}
        columns={columns.slice(0, 2)}
        columnVisibility={{ hiddenColumnIds: ['id', 'name'], onChange: vi.fn() }}
      />,
    );

    expect(renderedColumnLabels(container)).toEqual(['ID']);
  });
});
