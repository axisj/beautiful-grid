import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { BGrid } from '../beautiful-grid';
import type { BGridColumn, BGridItemRenderProps } from '../beautiful-grid/types';

interface Row {
  first: string;
  second: string;
}

function InlineEditor({ value, editable, index, columnIndex, handleSave, handleCancel }: BGridItemRenderProps<Row>) {
  const [nextValue, setNextValue] = React.useState(String(value));

  if (!editable) return <>{value}</>;

  return (
    <input
      aria-label={`editor-${index}-${columnIndex}`}
      autoFocus
      value={nextValue}
      onChange={event => setNextValue(event.target.value)}
      onKeyDown={event => {
        if (event.key === 'Enter') handleSave?.(nextValue, event.shiftKey ? 'prev' : 'next', 'current');
        if (event.key === 'Escape') handleCancel?.();
      }}
    />
  );
}

describe('inline editing with cell navigation', () => {
  const columns: BGridColumn<Row>[] = [
    { key: 'first', label: 'First', width: 120, itemRender: InlineEditor },
    { key: 'second', label: 'Second', width: 120, itemRender: InlineEditor },
  ];
  const data = [{ values: { first: 'A', second: 'B' } }];

  it('saves Enter edits, advances the editor, and moves the active cell with it', async () => {
    const onChangeData = vi.fn();
    const { container, getByLabelText } = render(
      <BGrid<Row>
        width={300}
        height={150}
        columns={columns}
        data={data}
        editable
        onChangeData={onChangeData}
      />,
    );

    const firstCell = container.querySelector('td[data-row-index="0"][data-column-index="0"]')!;
    fireEvent.pointerDown(firstCell, { button: 0 });
    fireEvent.dblClick(firstCell);

    const firstEditor = getByLabelText('editor-0-0');
    fireEvent.change(firstEditor, { target: { value: 'updated' } });
    fireEvent.keyDown(firstEditor, { key: 'Enter' });

    await waitFor(() => expect(onChangeData).toHaveBeenCalled());
    expect(onChangeData.mock.calls[0][2]).toMatchObject({ first: 'updated' });
    expect(getByLabelText('editor-0-1')).toBeTruthy();
    expect(container.querySelector('td[data-row-index="0"][data-column-index="1"]')?.classList).toContain('bgrid-cell-active');
  });

  it('wraps reverse editor movement at the first column without creating an invalid edit index', async () => {
    const { container, getByLabelText } = render(
      <BGrid<Row>
        width={300}
        height={150}
        columns={columns}
        data={data}
        editable
      />,
    );

    const firstCell = container.querySelector('td[data-row-index="0"][data-column-index="0"]')!;
    fireEvent.pointerDown(firstCell, { button: 0 });
    fireEvent.dblClick(firstCell);

    const firstEditor = getByLabelText('editor-0-0');
    fireEvent.keyDown(firstEditor, { key: 'Enter', shiftKey: true });

    await waitFor(() => expect(getByLabelText('editor-0-1')).toBeTruthy());
    expect(container.querySelector('td[data-row-index="0"][data-column-index="1"]')?.classList).toContain('bgrid-cell-active');
  });

  it('starts a legacy global editable inline editor with F2', async () => {
    const { container, getByLabelText } = render(
      <BGrid<Row>
        width={300}
        height={150}
        columns={columns}
        data={data}
        editable
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 0 } }}
      />,
    );

    const gridContainer = container.querySelector('[role="grid"]')!;
    gridContainer.focus();
    fireEvent.keyDown(gridContainer, { key: 'F2' });

    await waitFor(() => expect(getByLabelText('editor-0-0')).toBeTruthy());
  });
});
