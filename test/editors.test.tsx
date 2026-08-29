import * as React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest';
import { BGrid } from '../beautiful-grid';
import { createSelectEditorPlugin } from '../beautiful-grid/editors/createSelectEditorPlugin';
import { createDateEditorPlugin } from '../beautiful-grid/editors/createDateEditorPlugin';
import type { BGridColumn } from '../beautiful-grid/types';

interface Row {
  id: number;
  status: string;
  date: string;
}

function createRow(overrides: Partial<Row> = {}) {
  return {
    values: {
      id: 1,
      status: 'pending',
      date: '2026-08-29',
      ...overrides,
    },
  };
}

describe('editor plugins', () => {
  beforeAll(() => {
    HTMLSelectElement.prototype.showPicker = vi.fn();
    HTMLInputElement.prototype.showPicker = vi.fn();
  });
  afterAll(() => {
    delete (HTMLSelectElement.prototype as any).showPicker;
    delete (HTMLInputElement.prototype as any).showPicker;
  });

  it('select editor plugin interactions', async () => {
    const onChangeData = vi.fn();
    const selectEditor = createSelectEditorPlugin<Row>({
      id: 'status-select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'done', label: 'Done' },
        { value: 'disabled', label: 'Disabled', disabled: true },
      ],
      placeholder: 'Select status',
    });

    const columns: BGridColumn<Row>[] = [
      { key: 'status', label: 'Status', width: 120, editable: true, editor: selectEditor },
    ];
    
    const { container } = render(
      <BGrid<Row> width={240} height={160} columns={columns} data={[createRow()]} editable onChangeData={onChangeData} />
    );

    const cell = container.querySelector('td[data-row-index="0"][data-column-index="0"]')!;
    await act(async () => { fireEvent.doubleClick(cell); });

    const select = container.querySelector('select') as HTMLSelectElement;
    expect(select).toBeInTheDocument();
    expect(HTMLSelectElement.prototype.showPicker).toHaveBeenCalled();

    // Select 'done'
    await act(async () => { fireEvent.change(select, { target: { value: '1' } }); });
    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeData.mock.calls[0][2].status).toBe('done');
  });

  it('select editor keyboard interactions', async () => {
    const onChangeData = vi.fn();
    const selectEditor = createSelectEditorPlugin<Row>({
      id: 'status-select',
      options: [
        { value: 'pending', label: 'Pending' },
        { value: 'done', label: 'Done' },
      ],
    });

    const columns: BGridColumn<Row>[] = [
      { key: 'id', label: 'ID', width: 120 },
      { key: 'status', label: 'Status', width: 120, editable: true, editor: selectEditor },
    ];
    
    const { container } = render(
      <BGrid<Row> width={240} height={160} columns={columns} data={[createRow()]} editable onChangeData={onChangeData} />
    );

    const cell = container.querySelector('td[data-row-index="0"][data-column-index="1"]')!;
    await act(async () => { fireEvent.doubleClick(cell); });
    
    let select = container.querySelector('select') as HTMLSelectElement;
    
    // Esc cancels
    await act(async () => { fireEvent.keyDown(select, { key: 'Escape' }); });
    expect(container.querySelector('select')).toBeNull(); // Editor closes

    await act(async () => { fireEvent.doubleClick(cell); });
    select = container.querySelector('select') as HTMLSelectElement;
    
    // change first
    await act(async () => { fireEvent.change(select, { target: { value: '1' } }); });
    
    // Tab commits
    await act(async () => { fireEvent.keyDown(select, { key: 'Tab' }); });
    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeData.mock.calls[0][2].status).toBe('done');
    
    // Test empty value
    await act(async () => { fireEvent.doubleClick(cell); });
    select = container.querySelector('select') as HTMLSelectElement;
    select.value = '';
    await act(async () => { fireEvent.keyDown(select, { key: 'Enter' }); });
    // Empty value cancels
    expect(container.querySelector('select')).toBeNull(); 
  });

  it('date editor plugin interactions', async () => {
    const onChangeData = vi.fn();
    const dateEditor = createDateEditorPlugin<Row>({
      id: 'date-input',
    });

    const columns: BGridColumn<Row>[] = [
      { key: 'date', label: 'Date', width: 120, editable: true, editor: dateEditor, editorIcon: { render: '📅' } },
    ];
    
    const { container } = render(
      <BGrid<Row> width={240} height={160} columns={columns} data={[createRow()]} editable onChangeData={onChangeData} cellSelectionOptions={{ enabled: true }} />
    );

    const cell = container.querySelector('td[data-row-index="0"][data-column-index="0"]')!;
    await act(async () => { fireEvent.pointerDown(cell, { button: 0 }); });
    
    const icon = container.querySelector('.bgrid-editor-icon') as HTMLButtonElement;
    expect(icon).toBeInTheDocument();
    await act(async () => { fireEvent.click(icon); });

    const input = container.querySelector('input[type="date"]') as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(HTMLInputElement.prototype.showPicker).toHaveBeenCalled();

    // change date
    await act(async () => { fireEvent.change(input, { target: { value: '2026-09-01' } }); });
    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeData.mock.calls[0][2].date).toBe('2026-09-01');
  });

  it('date editor keyboard interactions', async () => {
    const onChangeData = vi.fn();
    const dateEditor = createDateEditorPlugin<Row>({
      id: 'date-input',
    });

    const columns: BGridColumn<Row>[] = [
      { key: 'id', label: 'ID', width: 120 },
      { key: 'date', label: 'Date', width: 120, editable: true, editor: dateEditor },
    ];
    
    const { container } = render(
      <BGrid<Row> width={240} height={160} columns={columns} data={[createRow()]} editable onChangeData={onChangeData} />
    );

    const cell = container.querySelector('td[data-row-index="0"][data-column-index="1"]')!;
    await act(async () => { fireEvent.doubleClick(cell); });
    
    let input = container.querySelector('input[type="date"]') as HTMLInputElement;
    
    // Esc cancels
    await act(async () => { fireEvent.keyDown(input, { key: 'Escape' }); });
    expect(container.querySelector('input[type="date"]')).toBeNull();

    await act(async () => { fireEvent.doubleClick(cell); });
    input = container.querySelector('input[type="date"]') as HTMLInputElement;
    
    // Tab commits
    await act(async () => { fireEvent.change(input, { target: { value: '2026-09-01' } }); });
    await act(async () => { fireEvent.keyDown(input, { key: 'Tab', shiftKey: true }); });
    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeData.mock.calls[0][2].date).toBe('2026-09-01');
    
    // Enter commits
    await act(async () => { fireEvent.doubleClick(cell); });
    input = container.querySelector('input[type="date"]') as HTMLInputElement;
    await act(async () => { fireEvent.change(input, { target: { value: '2026-09-02' } }); });
    await act(async () => { fireEvent.keyDown(input, { key: 'Enter' }); });
    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(2));
    expect(onChangeData.mock.calls[1][2].date).toBe('2026-09-02');
  });
});
