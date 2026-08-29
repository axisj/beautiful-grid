import * as React from 'react';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BGrid } from '../beautiful-grid';
import { defineEditorPlugin } from '../beautiful-grid/editors/defineEditorPlugin';
import type { BGridColumn } from '../beautiful-grid/types';

interface Row {
  id: number;
  value: string;
}

function createRow(overrides: Partial<Row> = {}) {
  return {
    values: {
      id: 1,
      value: 'foo',
      ...overrides,
    },
  };
}

describe('PluginCellEditor', () => {
  it('mounts plugin and commits', async () => {
    const onChangeData = vi.fn();
    const testPlugin = defineEditorPlugin<Row>({
      id: 'test-plugin',
      component: ({ commit, cancel, move }) => (
        <div data-testid="test-plugin">
          <button onClick={() => void commit([{ key: 'value', value: 'bar' }])}>Commit</button>
          <button onClick={() => cancel()}>Cancel</button>
          <button onClick={() => move('next')}>Move</button>
        </div>
      )
    });

    const columns: BGridColumn<Row>[] = [
      { key: 'id', label: 'ID', width: 120 },
      { key: 'value', label: 'Value', width: 120, editable: true, editor: testPlugin },
    ];
    
    const { container, getByText, getByTestId } = render(
      <BGrid<Row> width={240} height={160} columns={columns} data={[createRow()]} editable onChangeData={onChangeData} />
    );

    const cell = container.querySelector('td[data-row-index="0"][data-column-index="1"]')!;
    fireEvent.doubleClick(cell);
    
    expect(getByTestId('test-plugin')).toBeInTheDocument();

    await act(async () => {
      fireEvent.click(getByText('Commit'));
    });
    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeData.mock.calls[0][2].value).toBe('bar');
  });

  it('cancels on cancel call', async () => {
    const onChangeData = vi.fn();
    const testPlugin = defineEditorPlugin<Row>({
      id: 'test-plugin',
      component: ({ cancel }) => (
        <button onClick={() => cancel()}>Cancel</button>
      )
    });

    const columns: BGridColumn<Row>[] = [
      { key: 'value', label: 'Value', width: 120, editable: true, editor: testPlugin },
    ];
    
    const { container, getByText } = render(
      <BGrid<Row> width={240} height={160} columns={columns} data={[createRow()]} editable onChangeData={onChangeData} />
    );

    const cell = container.querySelector('td[data-row-index="0"][data-column-index="0"]')!;
    fireEvent.doubleClick(cell);

    await act(async () => {
      fireEvent.click(getByText('Cancel'));
    });
    expect(container.querySelector('.bgrid-plugin-editor-host')).toBeNull();
  });

  it('moves focus on move call', async () => {
    const testPlugin = defineEditorPlugin<Row>({
      id: 'test-plugin',
      component: ({ move }) => (
        <button onClick={() => move('next')}>Move Next</button>
      )
    });

    const columns: BGridColumn<Row>[] = [
      { key: 'id', label: 'ID', width: 120, editable: true, editor: { type: 'text' } },
      { key: 'value', label: 'Value', width: 120, editable: true, editor: testPlugin },
    ];
    
    const { container, getByText } = render(
      <BGrid<Row> width={240} height={160} columns={columns} data={[createRow()]} editable />
    );

    const cell = container.querySelector('td[data-row-index="0"][data-column-index="1"]')!;
    fireEvent.doubleClick(cell);

    await act(async () => {
      fireEvent.click(getByText('Move Next'));
    });
    expect(container.querySelector('.bgrid-plugin-editor-host')).toBeNull();
  });

  it('cancels when pointerdown happens outside', async () => {
    const testPlugin = defineEditorPlugin<Row>({
      id: 'test-plugin',
      component: () => <div data-testid="plugin-content" />
    });

    const columns: BGridColumn<Row>[] = [
      { key: 'value', label: 'Value', width: 120, editable: true, editor: testPlugin },
    ];
    
    const { container, getByTestId } = render(
      <BGrid<Row> width={240} height={160} columns={columns} data={[createRow()]} editable />
    );

    const cell = container.querySelector('td[data-row-index="0"][data-column-index="0"]')!;
    fireEvent.doubleClick(cell);
    expect(getByTestId('plugin-content')).toBeInTheDocument();

    await act(async () => {
      fireEvent.pointerDown(document.body);
    });
    expect(container.querySelector('.bgrid-plugin-editor-host')).toBeNull();
  });

  it('does not cancel when pointerdown happens inside', async () => {
    const testPlugin = defineEditorPlugin<Row>({
      id: 'test-plugin',
      component: () => <div data-testid="plugin-content" />
    });

    const columns: BGridColumn<Row>[] = [
      { key: 'value', label: 'Value', width: 120, editable: true, editor: testPlugin },
    ];
    
    const { container, getByTestId } = render(
      <BGrid<Row> width={240} height={160} columns={columns} data={[createRow()]} editable />
    );

    const cell = container.querySelector('td[data-row-index="0"][data-column-index="0"]')!;
    fireEvent.doubleClick(cell);

    const pluginContent = getByTestId('plugin-content');
    await act(async () => {
      fireEvent.pointerDown(pluginContent);
    });
    expect(container.querySelector('.bgrid-plugin-editor-host')).not.toBeNull();
  });

  it('handles error boundary fallback', async () => {
    const ThrowPlugin = defineEditorPlugin<Row>({
      id: 'throw-plugin',
      component: () => {
        throw new Error('Plugin crash');
      }
    });

    const columns: BGridColumn<Row>[] = [
      { key: 'value', label: 'Value', width: 120, editable: true, editor: ThrowPlugin },
    ];

    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const { container } = render(
      <BGrid<Row> width={240} height={160} columns={columns} data={[createRow()]} editable />
    );

    const cell = container.querySelector('td[data-row-index="0"][data-column-index="0"]')!;
    await act(async () => {
      fireEvent.doubleClick(cell);
    });
    
    expect(container.querySelector('.bgrid-plugin-editor-host')).toBeNull();

    consoleError.mockRestore();
    consoleWarn.mockRestore();
  });
});
