import * as React from 'react';
import { BGridCellAddress, BGridColumn, BGridDataItem, BGridEditorIconParams } from '../types';
import { useAppStore } from '../store';

interface Props<T> {
  hostCell: BGridCellAddress;
  index: number;
  columnIndex: number;
  column: BGridColumn<T>;
  item: BGridDataItem<T>;
  value: unknown;
  editing: boolean;
}

export function CellEditorIcon<T>({
  hostCell,
  index,
  columnIndex,
  column,
  item,
  value,
  editing,
}: Props<T>) {
  const config = column.editorIcon;
  const active = useAppStore(
    state => state.activeCell?.rowIndex === index && state.activeCell?.columnIndex === columnIndex,
  );
  const interactionSession = useAppStore(s => s.cellInteractionSession);
  const beginCellEdit = useAppStore(s => s.beginCellEdit);
  const beginEditorIconInteraction = useAppStore(s => s.beginEditorIconInteraction);
  const cancelCellInteraction = useAppStore(s => s.cancelCellInteraction);
  const handleGridClick = useAppStore(s => s.handleClick);
  const requestCellCommit = useAppStore(s => s.requestCellCommit);
  const isCellInteractionSessionActive = useAppStore(s => s.isCellInteractionSessionActive);
  const callbackSessionIdRef = React.useRef<number | undefined>(undefined);
  const cleanupRef = React.useRef<(() => void) | undefined>(undefined);

  const runCleanup = React.useCallback(() => {
    const cleanup = cleanupRef.current;
    cleanupRef.current = undefined;
    if (!cleanup) return;
    try {
      cleanup();
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[BGrid] editorIcon cleanup failed.', error);
      }
    }
  }, []);

  React.useEffect(() => {
    const sessionId = callbackSessionIdRef.current;
    if (sessionId === undefined || interactionSession?.id === sessionId) return;
    callbackSessionIdRef.current = undefined;
    runCleanup();
  }, [interactionSession?.id, runCleanup]);

  React.useEffect(
    () => () => {
      const sessionId = callbackSessionIdRef.current;
      if (sessionId !== undefined) cancelCellInteraction(sessionId);
      runCleanup();
    },
    [cancelCellInteraction, runCleanup],
  );

  if (!config) return null;

  const params: BGridEditorIconParams<T> = {
    column,
    index,
    columnIndex,
    item,
    values: item.values,
    value,
    active,
  };
  const ariaLabel =
    typeof config.ariaLabel === 'function'
      ? config.ariaLabel(params)
      : config.ariaLabel ?? (typeof column.label === 'string' ? `${column.label} 편집` : '셀 편집');
  const isOwnIconSession =
    interactionSession?.kind === 'editorIcon' &&
    interactionSession.cell.rowIndex === index &&
    interactionSession.cell.columnIndex === columnIndex;
  const hiddenWhileEditing = editing && !config.onClick;

  const activate = async () => {
    handleGridClick(index, columnIndex);
    if (!config.onClick) {
      beginCellEdit(hostCell, 'preserve', 'editorIcon');
      return;
    }

    const session = beginEditorIconInteraction(hostCell);
    if (!session) return;
    callbackSessionIdRef.current = session.id;

    let terminal = false;
    const cancel = () => {
      if (terminal) return;
      terminal = true;
      cancelCellInteraction(session.id);
    };
    try {
      const cleanup = await config.onClick({
        ...params,
        commit: (changes, options) => {
          if (terminal) return Promise.resolve();
          terminal = true;
          return requestCellCommit({
            sessionId: session.id,
            source: 'editorIcon',
            changes,
            options,
          });
        },
        cancel,
      });
      if (typeof cleanup === 'function') {
        if (isCellInteractionSessionActive(session.id)) cleanupRef.current = cleanup;
        else cleanup();
      }
    } catch (error) {
      cancel();
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[BGrid] editorIcon onClick failed.', error);
      }
    }
  };

  return (
    <button
      type='button'
      className='bgrid-editor-icon'
      data-visibility={config.visibility ?? 'always'}
      data-active={active ? 'true' : undefined}
      data-busy={isOwnIconSession ? 'true' : undefined}
      aria-label={ariaLabel}
      aria-busy={isOwnIconSession || undefined}
      tabIndex={active && hostCell.rowIndex === index ? 0 : -1}
      hidden={hiddenWhileEditing || isOwnIconSession}
      onPointerDown={event => {
        event.preventDefault();
        event.stopPropagation();
      }}
      onClick={event => {
        event.stopPropagation();
        void activate();
      }}
    >
      <span className='bgrid-editor-icon-content' aria-hidden='true'>
        {typeof config.render === 'function' ? config.render(params) : config.render}
      </span>
    </button>
  );
}
