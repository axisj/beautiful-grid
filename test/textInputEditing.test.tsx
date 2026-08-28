import * as React from 'react';
import { createPortal } from 'react-dom';
import { act, fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BGrid, BGridDataItemStatus } from '../beautiful-grid';
import {
  resolveTextEditorVerticalBox,
  resolveVisibleTextEditorVerticalBox,
} from '../beautiful-grid/components/CellTextEditorGateway';
import { createDateEditorPlugin, createSelectEditorPlugin, defineEditorPlugin } from '../beautiful-grid/editors';
import type { BGridColumn, BGridEditorPluginProps } from '../beautiful-grid/types';

interface Row {
  name: string;
  status: string;
}

function createData() {
  return [{ values: { name: '기존 이름', status: 'ready' } }];
}

describe('built-in text and plugin cell editors', () => {
  it('fills the full height of a merged cell with the text editor box', () => {
    expect(resolveTextEditorVerticalBox(90, 3)).toEqual({ height: 90, offset: 0 });
    expect(resolveTextEditorVerticalBox(30, 1)).toEqual({ height: 30, offset: 0 });
  });

  it('keeps the merged-cell editor inside the visible body viewport while filling visible height', () => {
    expect(
      resolveVisibleTextEditorVerticalBox({
        targetTop: 100,
        targetHeight: 90,
        rowSpan: 3,
        viewportTop: 100,
        viewportBottom: 400,
      }),
    ).toEqual({ height: 90, top: 100 });
    expect(
      resolveVisibleTextEditorVerticalBox({
        targetTop: 100,
        targetHeight: 90,
        rowSpan: 3,
        viewportTop: 145,
        viewportBottom: 400,
      }),
    ).toEqual({ height: 45, top: 145 });
    expect(
      resolveVisibleTextEditorVerticalBox({
        targetTop: 100,
        targetHeight: 90,
        rowSpan: 3,
        viewportTop: 190,
        viewportBottom: 400,
      }),
    ).toBeUndefined();
  });

  it('uses double-click as the default pointer event for entering edit mode', async () => {
    const columns: BGridColumn<Row>[] = [
      { key: 'name', label: 'Name', width: 140, editable: true, editor: { type: 'text' } },
    ];
    const { container } = render(
      <BGrid<Row> width={220} height={160} columns={columns} data={createData()} editable />,
    );
    const cell = container.querySelector('td[data-row-index="0"][data-column-index="0"]') as HTMLElement;
    const gateway = container.querySelector('[data-bgrid-text-editor-gateway="true"]');

    fireEvent.click(cell);
    expect(gateway).not.toHaveClass('bgrid-text-editor-active');

    fireEvent.doubleClick(cell);
    await waitFor(() => expect(gateway).toHaveClass('bgrid-text-editor-active'));
    expect(cell).toHaveClass('bgrid-cell-editing-text');
    expect(cell).toHaveAttribute('data-bgrid-editor-type', 'text');
  });

  it('preserves the value with F2, commits it, and returns keyboard focus to the same gateway', async () => {
    const onChangeData = vi.fn();
    const columns: BGridColumn<Row>[] = [
      { key: 'name', label: 'Name', width: 140, editable: true, editor: { type: 'text' } },
      { key: 'status', label: 'Status', width: 120, editable: false },
    ];
    const { container, getByLabelText } = render(
      <BGrid<Row>
        width={320}
        height={180}
        columns={columns}
        data={createData()}
        editable
        onChangeData={onChangeData}
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 0 } }}
      />,
    );

    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    grid.focus();
    const gateway = getByLabelText('행 1, 열 1 텍스트 편집') as HTMLInputElement;

    fireEvent.keyDown(gateway, { key: 'F2' });
    await waitFor(() => expect(gateway).toHaveClass('bgrid-text-editor-active'));
    expect(gateway.value).toBe('기존 이름');

    fireEvent.input(gateway, { target: { value: '변경 이름' } });
    fireEvent.keyDown(gateway, { key: 'Enter' });

    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeData.mock.calls[0][2]).toMatchObject({ name: '변경 이름' });
    expect(onChangeData.mock.calls[0][4]?.dataItem).toMatchObject({
      status: BGridDataItemStatus.edit,
      editedColumnIds: ['key:string:name'],
      changedKeys: ['key:string:name'],
      values: { name: '변경 이름' },
    });
    const editedCell = container.querySelector('td[data-row-index="0"][data-column-index="0"]');
    expect(editedCell).toHaveClass('bgrid-cell-edited');
    expect(editedCell).toHaveAttribute('data-bgrid-cell-edited', 'true');
    expect(container.querySelector('[data-bgrid-text-editor-gateway="true"]')).toBe(gateway);
    expect(gateway).not.toHaveClass('bgrid-text-editor-active');
    expect(document.activeElement).toBe(gateway);

    fireEvent.keyDown(gateway, { key: 'ArrowRight' });
    expect(container.querySelector('td[data-row-index="0"][data-column-index="1"]')).toHaveClass('bgrid-cell-active');
  });

  it('tracks the edited column separately from every column sharing the changed data key', async () => {
    const onChangeData = vi.fn();
    const columns: BGridColumn<Row>[] = [
      {
        id: 'name-editor',
        key: 'name',
        label: 'Editable name',
        width: 140,
        editable: true,
        editor: { type: 'text' },
      },
      {
        id: 'name-mirror',
        key: 'name',
        label: 'Mirrored name',
        width: 140,
        editable: false,
      },
    ];
    const { container, getByLabelText } = render(
      <BGrid<Row>
        width={340}
        height={160}
        columns={columns}
        data={createData()}
        editable
        onChangeData={onChangeData}
      />,
    );

    const editedCell = container.querySelector('td[data-row-index="0"][data-column-index="0"]') as HTMLElement;
    fireEvent.doubleClick(editedCell);
    const editor = getByLabelText('행 1, 열 1 텍스트 편집') as HTMLInputElement;
    fireEvent.input(editor, { target: { value: '공유 변경값' } });
    fireEvent.keyDown(editor, { key: 'Enter' });

    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeData.mock.calls[0][4]?.dataItem).toMatchObject({
      editedColumnIds: ['name-editor'],
      changedKeys: ['key:string:name'],
    });

    const mirroredCell = container.querySelector('td[data-row-index="0"][data-column-index="1"]');
    expect(editedCell).toHaveClass('bgrid-cell-edited', 'bgrid-cell-value-changed');
    expect(editedCell).toHaveAttribute('data-bgrid-cell-edited', 'true');
    expect(editedCell).toHaveAttribute('data-bgrid-cell-value-changed', 'true');
    expect(mirroredCell).not.toHaveClass('bgrid-cell-edited');
    expect(mirroredCell).toHaveClass('bgrid-cell-value-changed');
    expect(mirroredCell).toHaveAttribute('data-bgrid-cell-value-changed', 'true');
    expect(mirroredCell).toHaveTextContent('공유 변경값');
  });

  it('commits and closes the text editor when focus moves to another grid cell', async () => {
    const onChangeData = vi.fn();
    const columns: BGridColumn<Row>[] = [
      { key: 'name', label: 'Name', width: 140, editable: true, editor: { type: 'text' } },
      { key: 'status', label: 'Status', width: 120, editable: false },
    ];
    const data = [
      { values: { name: '첫 번째', status: 'ready' } },
      { values: { name: '두 번째', status: 'ready' } },
    ];
    const { container, getByLabelText } = render(
      <BGrid<Row>
        width={320}
        height={180}
        columns={columns}
        data={data}
        editable
        onChangeData={onChangeData}
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 0 } }}
      />,
    );

    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    grid.focus();
    const gateway = getByLabelText('행 1, 열 1 텍스트 편집') as HTMLInputElement;
    fireEvent.keyDown(gateway, { key: 'F2' });
    fireEvent.input(gateway, { target: { value: '포커스 아웃 저장' } });

    const nextCell = container.querySelector('td[data-row-index="1"][data-column-index="0"]') as HTMLElement;
    fireEvent.pointerDown(nextCell, { button: 0 });

    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeData.mock.calls[0][2]).toMatchObject({ name: '포커스 아웃 저장' });
    expect(gateway).not.toHaveClass('bgrid-text-editor-active');
    expect(nextCell).toHaveClass('bgrid-cell-active');
  });

  it('keeps one native input through an IME composition and saves the completed Korean text', async () => {
    const onChangeData = vi.fn();
    const columns: BGridColumn<Row>[] = [
      { key: 'name', label: 'Name', width: 160, editable: true, editor: { type: 'text' } },
    ];
    const { container, getByLabelText } = render(
      <BGrid<Row>
        width={240}
        height={160}
        columns={columns}
        data={createData()}
        editable
        onChangeData={onChangeData}
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 0 } }}
      />,
    );

    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    grid.focus();
    const gateway = getByLabelText('행 1, 열 1 텍스트 편집') as HTMLInputElement;

    fireEvent.compositionStart(gateway, { data: '' });
    fireEvent.input(gateway, { target: { value: '장' }, inputType: 'insertCompositionText' });
    fireEvent.compositionUpdate(gateway, { data: '장기' });
    fireEvent.input(gateway, { target: { value: '장기' }, inputType: 'insertCompositionText' });
    fireEvent.compositionEnd(gateway, { data: '장기영' });
    fireEvent.input(gateway, { target: { value: '장기영' }, inputType: 'insertFromComposition' });

    expect(container.querySelector('[data-bgrid-text-editor-gateway="true"]')).toBe(gateway);
    fireEvent.keyDown(gateway, { key: 'Enter' });

    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeData.mock.calls[0][2]).toMatchObject({ name: '장기영' });
  });

  it('keeps the text editor open and marks it invalid when parsing fails', async () => {
    const columns: BGridColumn<Row>[] = [
      {
        key: 'name',
        label: 'Name',
        width: 160,
        editable: true,
        editor: {
          type: 'text',
          parseValue: () => {
            throw new Error('invalid');
          },
        },
      },
    ];
    const { container, getByLabelText } = render(
      <BGrid<Row>
        width={240}
        height={160}
        columns={columns}
        data={createData()}
        editable
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 0 } }}
      />,
    );

    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    grid.focus();
    const gateway = getByLabelText('행 1, 열 1 텍스트 편집') as HTMLInputElement;
    fireEvent.keyDown(gateway, { key: 'Enter' });
    fireEvent.input(gateway, { target: { value: 'invalid' } });
    fireEvent.keyDown(gateway, { key: 'Enter' });

    await waitFor(() => expect(gateway).toHaveAttribute('aria-invalid', 'true'));
    expect(gateway).toHaveClass('bgrid-text-editor-active');
  });

  it('honors only the first terminal plugin callback and restores grid keyboard focus', async () => {
    const onChangeData = vi.fn();
    const plugin = defineEditorPlugin<Row>({
      id: 'test-status',
      component: ({ column, commit, cancel }) => (
        <button
          type='button'
          onClick={() => {
            void commit([{ key: column.key, value: 'done' }]);
            cancel();
          }}
        >
          완료
        </button>
      ),
    });
    const columns: BGridColumn<Row>[] = [{ key: 'status', label: 'Status', width: 120, editable: true, editor: plugin }];
    const { container, getByRole } = render(
      <BGrid<Row>
        width={220}
        height={160}
        columns={columns}
        data={createData()}
        editable
        onChangeData={onChangeData}
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 0 } }}
      />,
    );

    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    grid.focus();
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter' });
    fireEvent.click(getByRole('button', { name: '완료' }));

    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeData.mock.calls[0][2]).toMatchObject({ status: 'done' });
    expect(container.querySelector('td[data-row-index="0"][data-column-index="0"]')).toHaveClass(
      'bgrid-cell-edited',
    );
    expect(document.activeElement).toHaveAttribute('data-bgrid-text-editor-gateway', 'true');
  });

  it('connects the prebuilt select plugin directly to a column', async () => {
    const onChangeData = vi.fn();
    const statusEditor = createSelectEditorPlugin<Row>({
      id: 'status-select',
      options: [
        { value: 'ready', label: '준비' },
        { value: 'done', label: '완료' },
      ],
    });
    const columns: BGridColumn<Row>[] = [
      { key: 'status', label: 'Status', width: 120, editable: true, editor: statusEditor },
    ];
    const { container, getByLabelText } = render(
      <BGrid<Row>
        width={220}
        height={160}
        columns={columns}
        data={createData()}
        editable
        onChangeData={onChangeData}
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 0 } }}
      />,
    );

    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    grid.focus();
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter' });
    const editingCell = container.querySelector('td[data-bgrid-cell-editing="true"]');
    expect(editingCell).toHaveClass('bgrid-cell-editing');
    expect(editingCell).not.toHaveClass('bgrid-cell-editing-text');
    expect(editingCell).toHaveAttribute('data-bgrid-editor-type', 'plugin');
    expect(editingCell?.querySelector('.bgrid-plugin-editor-host')).toBeInTheDocument();
    fireEvent.change(getByLabelText('셀 선택 편집'), { target: { value: '1' } });

    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeData.mock.calls[0][2]).toMatchObject({ status: 'done' });
  });

  it('opens the native select picker as soon as the editor mounts', async () => {
    const originalShowPicker = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'showPicker');
    const showPicker = vi.fn();
    Object.defineProperty(HTMLSelectElement.prototype, 'showPicker', {
      configurable: true,
      value: showPicker,
    });

    try {
      const statusEditor = createSelectEditorPlugin<Row>({
        id: 'auto-open-status-select',
        options: [
          { value: 'ready', label: '준비' },
          { value: 'done', label: '완료' },
        ],
      });
      const columns: BGridColumn<Row>[] = [
        {
          key: 'status',
          label: 'Status',
          width: 120,
          editable: true,
          editTrigger: 'click',
          editor: statusEditor,
        },
      ];
      const { container, getByLabelText } = render(
        <BGrid<Row> width={220} height={160} columns={columns} data={createData()} editable />,
      );

      const cell = container.querySelector('td[data-row-index="0"][data-column-index="0"]')!;
      fireEvent.pointerDown(cell, { button: 0 });
      fireEvent.click(cell);

      await waitFor(() => expect(showPicker).toHaveBeenCalledTimes(1));
      expect(getByLabelText('셀 선택 편집')).toHaveFocus();
      expect(container.querySelector('.bgrid-native-select-editor-shell')).toBeInTheDocument();
      expect(container.querySelector('.bgrid-native-select-editor-icon svg')).toBeInTheDocument();
      expect(container.querySelectorAll('[data-bgrid-selection-fragment="true"]')).toHaveLength(0);
    } finally {
      if (originalShowPicker) {
        Object.defineProperty(HTMLSelectElement.prototype, 'showPicker', originalShowPicker);
      } else {
        delete (HTMLSelectElement.prototype as { showPicker?: () => void }).showPicker;
      }
    }
  });

  it('focuses the native date input without auto-opening a picker and keeps the custom icon', async () => {
    const originalShowPicker = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'showPicker');
    const showPicker = vi.fn();
    Object.defineProperty(HTMLInputElement.prototype, 'showPicker', {
      configurable: true,
      value: showPicker,
    });

    try {
      const dateEditor = createDateEditorPlugin<Row>({ id: 'native-date' });
      const columns: BGridColumn<Row>[] = [
        {
          key: 'status',
          label: 'Date',
          width: 120,
          editable: true,
          editTrigger: 'click',
          editor: dateEditor,
        },
      ];
      const { container, getByLabelText } = render(
        <BGrid<Row>
          width={220}
          height={160}
          columns={columns}
          data={[{ values: { name: '기존 이름', status: '2026-08-28' } }]}
          editable
        />,
      );

      const cell = container.querySelector('td[data-row-index="0"][data-column-index="0"]')!;
      fireEvent.pointerDown(cell, { button: 0 });
      fireEvent.click(cell);

      const input = getByLabelText('셀 날짜 편집') as HTMLInputElement;
      await waitFor(() => expect(input).toHaveFocus());
      expect(showPicker).not.toHaveBeenCalled();
      expect(input.value).toBe('2026-08-28');
      expect(container.querySelector('.bgrid-native-date-editor-icon svg')).toBeInTheDocument();
      expect(container.querySelectorAll('[data-bgrid-selection-fragment="true"]')).toHaveLength(0);
    } finally {
      if (originalShowPicker) {
        Object.defineProperty(HTMLInputElement.prototype, 'showPicker', originalShowPicker);
      } else {
        delete (HTMLInputElement.prototype as { showPicker?: () => void }).showPicker;
      }
    }
  });

  it('opens the native date picker when editing starts from the editor icon', async () => {
    const originalShowPicker = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'showPicker');
    const showPicker = vi.fn();
    Object.defineProperty(HTMLInputElement.prototype, 'showPicker', {
      configurable: true,
      value: showPicker,
    });

    try {
      const dateEditor = createDateEditorPlugin<Row>({ id: 'icon-date' });
      const columns: BGridColumn<Row>[] = [
        {
          key: 'status',
          label: 'Date',
          width: 120,
          editable: true,
          editTrigger: 'click',
          editor: dateEditor,
          editorIcon: { render: 'calendar', ariaLabel: '날짜 달력 열기', visibility: 'always' },
        },
      ];
      const { container, getByLabelText } = render(
        <BGrid<Row>
          width={220}
          height={160}
          columns={columns}
          data={[{ values: { name: '기존 이름', status: '2026-08-28' } }]}
          editable
        />,
      );

      fireEvent.pointerDown(getByLabelText('날짜 달력 열기'), { button: 0 });
      fireEvent.click(getByLabelText('날짜 달력 열기'));

      await waitFor(() => expect(showPicker).toHaveBeenCalledTimes(1));
      expect(getByLabelText('셀 날짜 편집')).toHaveFocus();
      expect(container.querySelectorAll('[data-bgrid-selection-fragment="true"]')).toHaveLength(0);
    } finally {
      if (originalShowPicker) {
        Object.defineProperty(HTMLInputElement.prototype, 'showPicker', originalShowPicker);
      } else {
        delete (HTMLInputElement.prototype as { showPicker?: () => void }).showPicker;
      }
    }
  });

  it('cancels an open plugin editor when the user points outside its host and portal', async () => {
    const plugin = defineEditorPlugin<Row>({
      id: 'outside-dismiss',
      component: ({ cancel }) => (
        <button type='button' onClick={cancel}>
          열림
        </button>
      ),
    });
    const columns: BGridColumn<Row>[] = [{ key: 'status', label: 'Status', width: 120, editable: true, editor: plugin }];
    const { container } = render(
      <BGrid<Row>
        width={220}
        height={160}
        columns={columns}
        data={createData()}
        editable
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 0 } }}
      />,
    );

    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    grid.focus();
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter' });
    expect(container.querySelector('.bgrid-plugin-editor-host')).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(container.querySelector('.bgrid-plugin-editor-host')).not.toBeInTheDocument());
  });

  it('renders plugin popups in an unclipped body portal while preserving Grid theme and outside clicks', async () => {
    const plugin = defineEditorPlugin<Row>({
      id: 'floating-portal',
      component: ({ cancel, getPortalContainer }) => (
        <>
          <button type='button' onClick={cancel}>
            에디터 열림
          </button>
          {createPortal(<button type='button'>picker popup</button>, getPortalContainer())}
        </>
      ),
    });
    const columns: BGridColumn<Row>[] = [
      { key: 'status', label: 'Status', width: 120, editable: true, editor: plugin },
    ];
    const { container, unmount } = render(
      <BGrid<Row>
        width={220}
        height={160}
        columns={columns}
        data={createData()}
        editable
        style={{ ['--bgrid-font-size' as string]: '15px' }}
      />,
    );

    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    await waitFor(() =>
      expect(document.body.querySelector('[data-bgrid-editor-portal-root="true"]')).toBeInTheDocument(),
    );
    const portalRoot = document.body.querySelector('[data-bgrid-editor-portal-root="true"]') as HTMLElement;

    fireEvent.doubleClick(container.querySelector('td[data-row-index="0"][data-column-index="0"]')!);

    await waitFor(() => expect(portalRoot.querySelector('button')).toBeInTheDocument());
    const popup = portalRoot.querySelector('button') as HTMLButtonElement;

    expect(portalRoot.parentElement).toBe(document.body);
    expect(grid).not.toContainElement(portalRoot);
    expect(portalRoot.style.getPropertyValue('--bgrid-font-size')).toBe('15px');
    expect(popup).toHaveTextContent('picker popup');

    fireEvent.pointerDown(popup);
    expect(container.querySelector('.bgrid-plugin-editor-host')).toBeInTheDocument();

    fireEvent.pointerDown(document.body);
    await waitFor(() => expect(container.querySelector('.bgrid-plugin-editor-host')).not.toBeInTheDocument());

    unmount();
    expect(document.body).not.toContainElement(portalRoot);
  });

  it('uses the line-number cells to expose inserted, updated, and deleted row states', () => {
    const columns: BGridColumn<Row>[] = [{ key: 'name', label: 'Name', width: 140 }];
    const data = [
      { values: { name: '추가', status: 'ready' }, status: BGridDataItemStatus.new },
      { values: { name: '수정', status: 'ready' }, status: BGridDataItemStatus.edit },
      { values: { name: '삭제', status: 'ready' }, status: BGridDataItemStatus.remove },
      { values: { name: '기본', status: 'ready' } },
    ];
    const { container } = render(
      <BGrid<Row> width={260} height={220} columns={columns} data={data} showLineNumber />,
    );

    const lineNumbers = Array.from(container.querySelectorAll('.bgrid-line-number-cell'));
    expect(lineNumbers.map(cell => cell.textContent?.trim())).toEqual(['I', 'U', 'D', '4']);
    expect(lineNumbers.slice(0, 3).map(cell => cell.getAttribute('data-bgrid-row-status'))).toEqual(['I', 'U', 'D']);
  });

  it('ignores a plugin callback after its edit session has already ended', async () => {
    const onChangeData = vi.fn();
    const sessions = new Map<number, Pick<BGridEditorPluginProps<Row>, 'commit' | 'cancel'>>();
    const plugin = defineEditorPlugin<Row>({
      id: 'async-status',
      component: ({ sessionId, commit, cancel }) => {
        sessions.set(sessionId, { commit, cancel });
        return (
          <button type='button' onClick={cancel}>
            취소
          </button>
        );
      },
    });
    const columns: BGridColumn<Row>[] = [{ key: 'status', label: 'Status', width: 120, editable: true, editor: plugin }];
    const { container } = render(
      <BGrid<Row>
        width={220}
        height={160}
        columns={columns}
        data={createData()}
        editable
        onChangeData={onChangeData}
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 0 } }}
      />,
    );

    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    grid.focus();
    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter' });
    const firstSession = sessions.values().next().value;
    expect(firstSession).toBeDefined();
    await act(async () => {
      firstSession?.cancel();
    });
    await waitFor(() => expect(container.querySelector('.bgrid-plugin-editor-host')).not.toBeInTheDocument());

    await act(async () => {
      await firstSession?.commit([{ key: 'status', value: 'stale' }]);
    });
    expect(onChangeData).not.toHaveBeenCalled();

    fireEvent.keyDown(document.activeElement as HTMLElement, { key: 'Enter' });
    const latestSession = Array.from(sessions.values()).at(-1);
    await act(async () => {
      await latestSession?.commit([{ key: 'status', value: 'done' }]);
    });
    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeData.mock.calls[0][2]).toMatchObject({ status: 'done' });
  });

  it('sizes the text editor gateway to the merged cell height and sets column alignment', async () => {
    interface MergedRow {
      group: string;
      name: string;
    }
    const data = [
      { values: { group: 'G1', name: 'Alpha' } },
      { values: { group: 'G1', name: 'Alpha' } },
      { values: { group: 'G1', name: 'Alpha' } },
    ];
    const columns: BGridColumn<MergedRow>[] = [
      {
        key: 'name',
        label: 'Name',
        width: 160,
        align: 'center',
        editable: true,
        editor: { type: 'text' },
      },
    ];

    const { container, getByLabelText } = render(
      <BGrid<MergedRow>
        width={300}
        height={200}
        columns={columns}
        data={data}
        editable
        cellMergeOptions={{ columnsMap: { 0: { mergeBy: 'group' } } }}
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 0 } }}
      />,
    );

    const mergedCell = container.querySelector('td[data-row-index="0"][data-column-index="0"]') as HTMLTableCellElement;
    expect(mergedCell).toHaveAttribute('rowspan', '3');

    // Mock getBoundingClientRect for JSDOM
    vi.spyOn(mergedCell, 'getBoundingClientRect').mockReturnValue({
      top: 50,
      left: 10,
      width: 160,
      height: 90,
      bottom: 140,
      right: 170,
      x: 10,
      y: 50,
      toJSON: () => {},
    });

    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    grid.focus();
    const gateway = getByLabelText('행 1, 열 1 텍스트 편집') as HTMLInputElement;

    fireEvent.keyDown(gateway, { key: 'F2' });
    await waitFor(() => expect(gateway).toHaveClass('bgrid-text-editor-active'));

    expect(gateway.style.width).toBe('160px');
    expect(gateway.style.height).toBe('90px');
    expect(gateway.style.textAlign).toBe('center');
  });
});

