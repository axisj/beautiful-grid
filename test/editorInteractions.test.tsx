import * as React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BGrid } from '../beautiful-grid';
import { defineEditorPlugin } from '../beautiful-grid/editors';
import type { BGridColumn } from '../beautiful-grid/types';

interface Row {
  id: number;
  group: string;
  name: string;
  quantity: number;
  amount: number;
  status: string;
}

function createRow(overrides: Partial<Row> = {}) {
  return {
    values: {
      id: 1,
      group: 'A',
      name: 'Alpha',
      quantity: 1,
      amount: 100,
      status: 'ready',
      ...overrides,
    },
  };
}

describe('cell editor interactions', () => {
  it('lets a column override the grid edit trigger', async () => {
    const columns: BGridColumn<Row>[] = [
      {
        key: 'name',
        label: 'Name',
        width: 140,
        editable: true,
        editTrigger: 'click',
        editor: { type: 'text' },
      },
      {
        key: 'status',
        label: 'Status',
        width: 120,
        editable: true,
        editor: { type: 'text' },
      },
    ];
    const { container } = render(
      <BGrid<Row>
        width={320}
        height={170}
        columns={columns}
        data={[createRow()]}
        editable
        editTrigger='dblclick'
      />,
    );
    const nameCell = container.querySelector('td[data-row-index="0"][data-column-index="0"]')!;
    const statusCell = container.querySelector('td[data-row-index="0"][data-column-index="1"]')!;
    const gateway = container.querySelector('[data-bgrid-text-editor-gateway="true"]')!;

    fireEvent.click(nameCell);
    await waitFor(() => expect(gateway).toHaveClass('bgrid-text-editor-active'));
    fireEvent.keyDown(gateway, { key: 'Escape' });

    fireEvent.click(statusCell);
    expect(gateway).not.toHaveClass('bgrid-text-editor-active');
    fireEvent.doubleClick(statusCell);
    await waitFor(() => expect(gateway).toHaveClass('bgrid-text-editor-active'));
  });

  it('uses onChangeValue to atomically update related cells without mutating input data', async () => {
    const data = [createRow()];
    const onChangeData = vi.fn();
    const onChangeValue = vi.fn(async ({ changes, nextValues, commit }) => {
      await commit([...changes, { key: 'amount', value: nextValues.quantity * 100 }]);
    });
    const columns: BGridColumn<Row>[] = [
      {
        key: 'quantity',
        label: 'Quantity',
        width: 120,
        editable: true,
        editTrigger: 'click',
        editor: { type: 'text', parseValue: text => Number(text) },
        onChangeValue,
      },
      { key: 'amount', label: 'Amount', width: 120 },
    ];
    const { container } = render(
      <BGrid<Row>
        width={320}
        height={170}
        columns={columns}
        data={data}
        editable
        onChangeData={onChangeData}
      />,
    );
    const quantityCell = container.querySelector('td[data-row-index="0"][data-column-index="0"]')!;
    fireEvent.click(quantityCell);
    const gateway = container.querySelector('[data-bgrid-text-editor-gateway="true"]') as HTMLInputElement;
    fireEvent.input(gateway, { target: { value: '3' } });
    fireEvent.keyDown(gateway, { key: 'Enter' });

    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeValue).toHaveBeenCalledTimes(1);
    expect(onChangeData.mock.calls[0][1]).toBeNull();
    expect(onChangeData.mock.calls[0][2]).toMatchObject({ quantity: 3, amount: 300 });
    expect(onChangeData.mock.calls[0][4]).toMatchObject({ source: 'text' });
    expect(data[0].values).toMatchObject({ quantity: 1, amount: 100 });
  });

  it('shows an editor icon while idle and opens the existing editor when no callback is configured', async () => {
    const plugin = defineEditorPlugin<Row>({
      id: 'status-editor',
      component: ({ column, commit }) => (
        <button
          type='button'
          onClick={() => void commit([{ key: column.key, value: 'done' }])}
        >
          상태 완료
        </button>
      ),
    });
    const columns: BGridColumn<Row>[] = [
      {
        key: 'name',
        label: '이름',
        width: 120,
        editable: false,
      },
      {
        key: 'status',
        label: '상태',
        width: 140,
        editable: true,
        editor: plugin,
        editorIcon: {
          render: '⌄',
          ariaLabel: '상태 선택',
        },
      },
    ];
    const { container, getByRole } = render(
      <BGrid<Row>
        width={300}
        height={160}
        columns={columns}
        data={[createRow()]}
        editable
        cellSelectionOptions={{ enabled: true }}
      />,
    );

    const previousCell = container.querySelector('td[data-row-index="0"][data-column-index="0"]')!;
    fireEvent.pointerDown(previousCell, { button: 0 });
    expect(container.querySelectorAll('[data-bgrid-selection-fragment="true"]')).toHaveLength(1);

    const icon = getByRole('button', { name: '상태 선택' });
    expect(icon.querySelector('.bgrid-editor-icon-content')).toHaveTextContent('⌄');
    fireEvent.click(icon);
    await waitFor(() => expect(container.querySelector('.bgrid-plugin-editor-host')).toBeInTheDocument());
    expect(container.querySelectorAll('[data-bgrid-selection-fragment="true"]')).toHaveLength(0);
    expect(container.querySelector('td[data-row-index="0"][data-column-index="1"]')).toHaveClass(
      'bgrid-cell-active',
      'bgrid-cell-editing',
    );
  });

  it('does not let an outside pointer cancel a pending async plugin commit', async () => {
    let releaseValidation: (() => void) | undefined;
    const validation = new Promise<void>(resolve => {
      releaseValidation = resolve;
    });
    const onChangeData = vi.fn();
    const plugin = defineEditorPlugin<Row>({
      id: 'async-status-editor',
      component: ({ column, commit }) => (
        <button type='button' onClick={() => void commit([{ key: column.key, value: 'done' }])}>
          비동기 저장
        </button>
      ),
    });
    const columns: BGridColumn<Row>[] = [
      {
        key: 'status',
        label: 'Status',
        width: 140,
        editable: true,
        editor: plugin,
        onChangeValue: async ({ changes, commit }) => {
          await validation;
          await commit(changes);
        },
      },
    ];
    const { container, getByRole } = render(
      <BGrid<Row>
        width={240}
        height={160}
        columns={columns}
        data={[createRow()]}
        editable
        onChangeData={onChangeData}
      />,
    );

    fireEvent.doubleClick(container.querySelector('td[data-row-index="0"][data-column-index="0"]')!);
    fireEvent.click(getByRole('button', { name: '비동기 저장' }));
    fireEvent.pointerDown(document.body);
    expect(container.querySelector('.bgrid-plugin-editor-host')).toBeInTheDocument();

    await act(async () => releaseValidation?.());
    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeData.mock.calls[0][2].status).toBe('done');
  });

  it('preserves an active editor for equivalent column rerenders and cancels it when editing is disabled', async () => {
    const data = [createRow()];
    const createColumns = (): BGridColumn<Row>[] => [
      { id: 'name', key: 'name', label: 'Name', width: 140, editable: true, editor: { type: 'text' } },
    ];
    const { container, rerender } = render(
      <BGrid<Row> width={240} height={160} columns={createColumns()} data={data} editable />,
    );
    const cell = container.querySelector('td[data-row-index="0"][data-column-index="0"]')!;
    const gateway = container.querySelector('[data-bgrid-text-editor-gateway="true"]')!;

    fireEvent.doubleClick(cell);
    await waitFor(() => expect(gateway).toHaveClass('bgrid-text-editor-active'));
    await waitFor(() => expect(gateway).toHaveFocus());

    rerender(<BGrid<Row> width={240} height={160} columns={createColumns()} data={data} editable />);
    await waitFor(() => expect(gateway).toHaveClass('bgrid-text-editor-active'));

    rerender(<BGrid<Row> width={240} height={160} columns={createColumns()} data={data} editable={false} />);
    await waitFor(() => expect(gateway).not.toHaveClass('bgrid-text-editor-active'));
  });

  it('runs a lookup icon callback and routes its changes through onChangeValue', async () => {
    let selectLookup: (() => Promise<void>) | undefined;
    const onChangeData = vi.fn();
    const columns: BGridColumn<Row>[] = [
      {
        key: 'name',
        label: '고객',
        width: 160,
        editable: true,
        editor: { type: 'text' },
        onChangeValue: ({ changes, commit }) =>
          commit([...changes, { key: 'status', value: 'selected' }]),
        editorIcon: {
          render: '⌕',
          ariaLabel: '고객 조회',
          onClick: ({ commit }) => {
            selectLookup = () => commit([{ key: 'name', value: 'Lookup customer' }]);
          },
        },
      },
      { key: 'status', label: 'Status', width: 120 },
    ];
    const { getByRole } = render(
      <BGrid<Row>
        width={340}
        height={170}
        columns={columns}
        data={[createRow()]}
        editable
        onChangeData={onChangeData}
      />,
    );

    fireEvent.click(getByRole('button', { name: '고객 조회' }));
    expect(selectLookup).toBeDefined();
    await act(async () => {
      await selectLookup?.();
    });

    expect(onChangeData).toHaveBeenCalledTimes(1);
    expect(onChangeData.mock.calls[0][2]).toMatchObject({
      name: 'Lookup customer',
      status: 'selected',
    });
    expect(onChangeData.mock.calls[0][4]).toMatchObject({ source: 'editorIcon' });
  });

  it('runs an editor icon cleanup once when external data replaces the active session', async () => {
    const cleanup = vi.fn();
    let cancelLookup: (() => void) | undefined;
    const columns: BGridColumn<Row>[] = [
      {
        key: 'name',
        label: '고객',
        width: 160,
        editable: true,
        editorIcon: {
          render: '⌕',
          ariaLabel: '고객 조회',
          onClick: ({ cancel }) => {
            cancelLookup = cancel;
            return cleanup;
          },
        },
      },
    ];
    const { getByRole, rerender } = render(
      <BGrid<Row> width={260} height={170} columns={columns} data={[createRow()]} editable />,
    );

    fireEvent.click(getByRole('button', { name: '고객 조회' }));
    await waitFor(() => expect(cancelLookup).toBeDefined());

    rerender(
      <BGrid<Row>
        width={260}
        height={170}
        columns={columns}
        data={[createRow({ id: 2, name: 'Replacement' })]}
        editable
      />,
    );
    await waitFor(() => expect(cleanup).toHaveBeenCalledTimes(1));
    cancelLookup?.();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('commits a sorted visible row back to its source index', async () => {
    const onChangeData = vi.fn();
    const data = [createRow({ id: 1, name: 'Alpha' }), createRow({ id: 2, name: 'Beta' })];
    const columns: BGridColumn<Row>[] = [
      {
        id: 'name',
        key: 'name',
        label: 'Name',
        width: 160,
        editable: true,
        editTrigger: 'click',
        editor: { type: 'text' },
      },
    ];
    const { container } = render(
      <BGrid<Row>
        width={260}
        height={190}
        columns={columns}
        data={data}
        editable
        dataControl={{
          mode: 'client',
          multiSort: false,
          query: {
            sortParams: [{ columnId: 'name', key: 'name', orderBy: 'desc' }],
            filterParams: [],
          },
          onChange: vi.fn(),
        }}
        onChangeData={onChangeData}
      />,
    );

    const firstVisibleCell = container.querySelector('td[data-row-index="0"][data-column-index="0"]')!;
    expect(firstVisibleCell).toHaveTextContent('Beta');
    fireEvent.click(firstVisibleCell);
    const gateway = container.querySelector('[data-bgrid-text-editor-gateway="true"]') as HTMLInputElement;
    fireEvent.input(gateway, { target: { value: 'Beta updated' } });
    fireEvent.keyDown(gateway, { key: 'Enter' });

    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeData.mock.calls[0][0]).toBe(1);
    expect(onChangeData.mock.calls[0][2]).toMatchObject({ id: 2, name: 'Beta updated' });
  });

  it('treats frozen fragments as one logical merged editor and updates every backing row', async () => {
    const data = [
      createRow({ id: 1, group: 'A', name: 'Anchor' }),
      createRow({ id: 2, group: 'A', name: 'Hidden value 1' }),
      createRow({ id: 3, group: 'A', name: 'Hidden value 2' }),
      createRow({ id: 4, group: 'B', name: 'Other' }),
    ];
    const onChangeData = vi.fn();
    const columns: BGridColumn<Row>[] = [
      { key: 'id', label: 'ID', width: 70 },
      {
        key: 'name',
        label: 'Name',
        width: 150,
        editable: true,
        editor: { type: 'text' },
        editorIcon: { render: '✎', ariaLabel: '병합 이름 편집' },
      },
    ];
    const { container } = render(
      <BGrid<Row>
        width={320}
        height={230}
        columns={columns}
        data={data}
        frozenColumnIndex={1}
        frozenRowCount={2}
        cellMergeOptions={{ columnsMap: { 1: { mergeBy: 'group' } } }}
        editable
        onChangeData={onChangeData}
      />,
    );

    const fragments = [
      container.querySelector(
        '[data-bgrid-quadrant="top-main"] td[data-row-index="0"][data-column-index="1"]',
      ) as HTMLElement,
      container.querySelector(
        '[data-bgrid-quadrant="body-main"] td[data-row-index="2"][data-column-index="1"]',
      ) as HTMLElement,
    ];
    expect(
      fragments.map(fragment => fragment.querySelector('.bgrid-cell-value')?.textContent?.trim()),
    ).toEqual(['Anchor', 'Anchor']);
    expect(fragments[0]).toHaveAttribute('rowspan', '2');
    expect(fragments[1]).not.toHaveAttribute('rowspan');

    fireEvent.pointerDown(fragments[1], { button: 0 });
    expect(fragments.every(fragment => fragment.classList.contains('bgrid-cell-active'))).toBe(true);
    expect(container.querySelectorAll('[data-bgrid-selection-fragment="true"]')).toHaveLength(2);
    expect(
      fragments.map(fragment => fragment.querySelector<HTMLButtonElement>('.bgrid-editor-icon')?.tabIndex),
    ).toEqual([0, -1]);
    fireEvent.doubleClick(fragments[1]);

    const gateway = container.querySelector('[data-bgrid-text-editor-gateway="true"]') as HTMLInputElement;
    await waitFor(() => expect(gateway).toHaveClass('bgrid-text-editor-active'));
    expect(gateway.value).toBe('Anchor');
    fireEvent.input(gateway, { target: { value: 'Merged update' } });
    fireEvent.keyDown(gateway, { key: 'Enter' });

    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(3));
    expect(onChangeData.mock.calls.map(call => call[0])).toEqual([0, 1, 2]);
    expect(onChangeData.mock.calls.every(call => call[2].name === 'Merged update')).toBe(true);
    expect(onChangeData.mock.calls[0][4]).toMatchObject({
      transaction: {
        merged: true,
        canonicalCell: { rowIndex: 0, columnIndex: 1 },
        visibleIndexes: [0, 1, 2],
      },
    });
    expect(data.map(item => item.values.name)).toEqual(['Anchor', 'Hidden value 1', 'Hidden value 2', 'Other']);
  });

  it('expands a drag target fragment to the full logical merged cell', () => {
    const data = [
      createRow({ id: 1, group: 'A', name: 'Anchor' }),
      createRow({ id: 2, group: 'A', name: 'Hidden value 1' }),
      createRow({ id: 3, group: 'A', name: 'Hidden value 2' }),
      createRow({ id: 4, group: 'B', name: 'Other' }),
    ];
    const columns: BGridColumn<Row>[] = [
      { key: 'id', label: 'ID', width: 70 },
      { key: 'name', label: 'Name', width: 150 },
    ];
    const { container } = render(
      <BGrid<Row>
        width={320}
        height={230}
        columns={columns}
        data={data}
        frozenRowCount={2}
        cellMergeOptions={{ columnsMap: { 1: { mergeBy: 'group' } } }}
      />,
    );
    const other = container.querySelector('td[data-row-index="3"][data-column-index="1"]')!;
    const targetFragment = container.querySelector(
      '[data-bgrid-quadrant="body-main"] td[data-row-index="2"][data-column-index="1"]',
    )!;

    fireEvent.pointerDown(other, { button: 0 });
    fireEvent.pointerOver(targetFragment);

    const selectionFragments = container.querySelectorAll<HTMLElement>('[data-bgrid-selection-fragment="true"]');
    expect(selectionFragments).toHaveLength(2);
    expect(selectionFragments[0]).toHaveAttribute('data-edge-top', 'true');
    expect(selectionFragments[0]).not.toHaveAttribute('data-edge-bottom');
    expect(selectionFragments[1]).not.toHaveAttribute('data-edge-top');
    expect(selectionFragments[1]).toHaveAttribute('data-edge-bottom', 'true');
  });
});
