import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store';
import { BGridDataItemStatus, BGridTextEditorContext } from '../types';
import { getColumnId } from '../utils';

interface Props {
  containerRef: React.RefObject<HTMLDivElement | null>;
}

function isComposing(event: React.KeyboardEvent<HTMLInputElement>) {
  return event.nativeEvent.isComposing || event.keyCode === 229;
}

export function resolveTextEditorVerticalBox(targetHeight: number, rowSpan: number) {
  const normalizedRowSpan = Math.max(rowSpan, 1);
  const height = targetHeight / normalizedRowSpan;

  return {
    height,
    offset: (targetHeight - height) / 2,
  };
}

export function resolveVisibleTextEditorVerticalBox({
  targetTop,
  targetHeight,
  rowSpan,
  viewportTop,
  viewportBottom,
}: {
  targetTop: number;
  targetHeight: number;
  rowSpan: number;
  viewportTop: number;
  viewportBottom: number;
}) {
  const { height, offset } = resolveTextEditorVerticalBox(targetHeight, rowSpan);
  const visibleTop = Math.max(targetTop, viewportTop);
  const visibleBottom = Math.min(targetTop + targetHeight, viewportBottom);

  // Keep the editor at its normal single-row height. When less than one row
  // remains visible, hiding it avoids drawing across the header or footer.
  if (visibleBottom - visibleTop < height) return undefined;

  return {
    height,
    top: Math.min(Math.max(targetTop + offset, visibleTop), visibleBottom - height),
  };
}

export function CellTextEditorGateway({ containerRef }: Props) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const composingRef = React.useRef(false);
  const pendingBlurRef = React.useRef(false);
  const nativeStartRef = React.useRef(false);
  const previousSessionIdRef = React.useRef<number | undefined>(undefined);
  const previousEditSessionIdRef = React.useRef<number | undefined>(undefined);
  const [invalid, setInvalid] = React.useState(false);

  const {
    activeCell,
    cellEditSession,
    columns,
    data,
    editable,
    scrollLeft,
    scrollTop,
    height,
    width,
  } = useAppStore(
    useShallow(s => {
      const interactionSession = s.cellInteractionSession;
      const session = interactionSession?.kind === 'editor' ? interactionSession : undefined;
      const tracksCellPosition = !!session && s.columns[session.cell.columnIndex]?.editor?.type === 'text';

      return {
        activeCell: s.activeCell,
        cellEditSession: session,
        columns: s.columns,
        data: s.data,
        editable: s.editable,
        // Scrolling is high-frequency state. Subscribe to it only while the
        // persistent input is visibly tracking a text-editing cell.
        scrollLeft: tracksCellPosition ? s.scrollLeft : 0,
        scrollTop: tracksCellPosition ? s.scrollTop : 0,
        height: tracksCellPosition ? s.height : 0,
        width: tracksCellPosition ? s.width : 0,
      };
    }),
  );
  const { beginCellEdit, endCellEdit, requestCellCommit } = useAppStore(
    useShallow(s => ({
      beginCellEdit: s.beginCellEdit,
      endCellEdit: s.endCellEdit,
      requestCellCommit: s.requestCellCommit,
    })),
  );

  const cell = cellEditSession?.cell ?? activeCell;
  const item = cell ? data[cell.rowIndex] : undefined;
  const column = cell ? columns[cell.columnIndex] : undefined;
  const textEditor = column?.editor?.type === 'text' ? column.editor : undefined;
  const isTextEditing = !!cellEditSession && !!textEditor;
  const canStartText =
    !!activeCell &&
    !!editable &&
    item?.status !== BGridDataItemStatus.remove &&
    column?.editable !== false &&
    !!textEditor &&
    (textEditor.startOnInput ?? true);

  const getContext = React.useCallback((): BGridTextEditorContext<any> | undefined => {
    if (!cell || !item || !column) return undefined;
    return {
      index: cell.rowIndex,
      columnIndex: cell.columnIndex,
      item,
      values: item.values,
      column,
    };
  }, [cell, column, item]);

  const focusGateway = React.useCallback(() => {
    inputRef.current?.focus({ preventScroll: true });
  }, []);

  React.useLayoutEffect(() => {
    const input = inputRef.current;
    const container = containerRef.current;
    if (!input || !container) return;

    if (!isTextEditing || !cell) {
      input.style.removeProperty('transform');
      input.style.removeProperty('width');
      input.style.removeProperty('height');
      input.style.removeProperty('visibility');
      return;
    }

    const target = container.querySelector(
      `td[data-bgrid-cell="true"][data-row-index="${cellEditSession!.hostCell.rowIndex}"][data-column-index="${
        cellEditSession!.hostCell.columnIndex
      }"]`,
    );
    if (!(target instanceof HTMLElement)) {
      input.style.visibility = 'hidden';
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const bodyViewport = container.querySelector('.bgrid-body-viewport');
    const bodyViewportRect =
      bodyViewport instanceof HTMLElement ? bodyViewport.getBoundingClientRect() : containerRect;
    const editorBox = resolveVisibleTextEditorVerticalBox({
      targetTop: targetRect.top,
      targetHeight: targetRect.height,
      rowSpan: target instanceof HTMLTableCellElement ? target.rowSpan : 1,
      viewportTop: bodyViewportRect.top,
      viewportBottom: bodyViewportRect.bottom,
    });
    if (!editorBox) {
      input.style.visibility = 'hidden';
      return;
    }
    input.style.transform = `translate(${targetRect.left - containerRect.left - container.clientLeft}px, ${
      editorBox.top - containerRect.top - container.clientTop
    }px)`;
    input.style.width = `${targetRect.width}px`;
    input.style.height = `${editorBox.height}px`;
    input.style.visibility = 'visible';
  }, [cell, cellEditSession, containerRef, height, isTextEditing, scrollLeft, scrollTop, width]);

  React.useLayoutEffect(() => {
    const input = inputRef.current;
    const session = cellEditSession;
    if (!input || !session || !textEditor) return;
    if (previousSessionIdRef.current === session.id) return;

    previousSessionIdRef.current = session.id;
    setInvalid(false);
    const context = getContext();
    if (!context) return;

    if (session.mode === 'preserve') {
      input.value = textEditor.formatValue
        ? textEditor.formatValue(session.originalValue, context)
        : session.originalValue == null
        ? ''
        : String(session.originalValue);
      queueMicrotask(() => {
        input.focus({ preventScroll: true });
        input.select();
      });
    } else if (!nativeStartRef.current) {
      input.value = '';
      queueMicrotask(() => input.focus({ preventScroll: true }));
    }
    nativeStartRef.current = false;
  }, [cellEditSession, getContext, textEditor]);

  React.useLayoutEffect(() => {
    if (cellEditSession) {
      previousEditSessionIdRef.current = cellEditSession.id;
    }
  }, [cellEditSession]);

  React.useLayoutEffect(() => {
    const previousSessionId = previousEditSessionIdRef.current;
    if (cellEditSession || previousSessionId === undefined) return;

    previousEditSessionIdRef.current = undefined;
    previousSessionIdRef.current = undefined;
    const container = containerRef.current;
    if (!container) return;
    const frame = requestAnimationFrame(() => {
      const activeElement = document.activeElement;
      if (activeElement && activeElement !== document.body && !container.contains(activeElement)) return;
      focusGateway();
      if (inputRef.current) inputRef.current.value = '';
    });
    return () => cancelAnimationFrame(frame);
  }, [cellEditSession, containerRef, focusGateway]);

  const commit = React.useCallback(
    async (move?: 'next' | 'prev') => {
      const session = cellEditSession;
      const context = getContext();
      const input = inputRef.current;
      if (!session || !context || !input || !textEditor) return;

      let nextValue: unknown;
      try {
        nextValue = textEditor.parseValue ? textEditor.parseValue(input.value, context) : input.value;
      } catch {
        setInvalid(true);
        input.focus({ preventScroll: true });
        return;
      }

      try {
        await requestCellCommit({
          sessionId: session.id,
          source: 'text',
          changes: [{ columnId: getColumnId(context.column), value: nextValue }],
          options: move ? { move } : undefined,
        });
        setInvalid(false);
      } catch {
        setInvalid(true);
        input.focus({ preventScroll: true });
      }
    },
    [cellEditSession, getContext, requestCellCommit, textEditor],
  );

  const cancel = React.useCallback(() => {
    if (!cellEditSession) return;
    endCellEdit(cellEditSession.id);
  }, [cellEditSession, endCellEdit]);

  const startReplace = React.useCallback(() => {
    if (!activeCell || !canStartText || cellEditSession) return;
    nativeStartRef.current = true;
    if (inputRef.current) inputRef.current.value = '';
    beginCellEdit(activeCell, 'replace');
  }, [activeCell, beginCellEdit, canStartText, cellEditSession]);

  const inputProps = textEditor?.inputProps;
  const context = getContext();
  const ariaLabel = textEditor
    ? typeof textEditor.ariaLabel === 'function'
      ? context
        ? textEditor.ariaLabel(context)
        : '셀 텍스트 편집'
      : textEditor.ariaLabel ?? `행 ${cell!.rowIndex + 1}, 열 ${cell!.columnIndex + 1} 텍스트 편집`
    : 'DataGrid 키보드 탐색';

  return (
    <input
      ref={inputRef}
      data-bgrid-text-editor-gateway='true'
      className={isTextEditing ? 'bgrid-text-editor-gateway bgrid-text-editor-active' : 'bgrid-text-editor-gateway'}
      aria-label={ariaLabel}
      aria-invalid={invalid || undefined}
      readOnly={!canStartText && !isTextEditing}
      {...inputProps}
      onBeforeInput={() => startReplace()}
      onInput={() => startReplace()}
      onCompositionStart={() => {
        composingRef.current = true;
        startReplace();
      }}
      onCompositionEnd={() => {
        composingRef.current = false;
        if (pendingBlurRef.current) {
          pendingBlurRef.current = false;
          void commit();
        }
      }}
      onKeyDown={event => {
        if (!cellEditSession || !isTextEditing) return;
        event.stopPropagation();
        if (event.key === 'Escape' || event.key === 'Esc') {
          event.preventDefault();
          cancel();
          return;
        }
        if (event.key === 'Enter') {
          if (composingRef.current || isComposing(event)) return;
          event.preventDefault();
          void commit();
          return;
        }
        if (event.key === 'Tab') {
          if (composingRef.current || isComposing(event)) return;
          event.preventDefault();
          void commit(event.shiftKey ? 'prev' : 'next');
        }
      }}
      onBlur={event => {
        if (!cellEditSession || !isTextEditing) return;
        if (composingRef.current) {
          pendingBlurRef.current = true;
          return;
        }
        if (textEditor?.commitOnBlur === false) {
          cancel();
        } else {
          void commit();
        }
      }}
      onFocus={() => {
        if (!cellEditSession && inputRef.current) inputRef.current.value = '';
      }}
    />
  );
}
