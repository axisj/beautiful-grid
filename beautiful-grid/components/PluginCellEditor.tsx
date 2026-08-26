import * as React from 'react';
import { BGridCellEditSession, BGridColumn, BGridDataItem, BGridEditorPluginProps } from '../types';
import { useAppStore } from '../store';
import { EditorPortalContext, syncEditorPortalTheme } from './EditorPortalRoot';

interface Props<T> {
  session: BGridCellEditSession;
  index: number;
  columnIndex: number;
  column: BGridColumn<T>;
  item: BGridDataItem<T>;
  value: unknown;
  handleCancel?: () => void;
}

class PluginEditorBoundary extends React.Component<
  { children: React.ReactNode; pluginId: string; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error: unknown) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[BGrid] Editor plugin "${this.props.pluginId}" failed.`, error);
    }
    this.props.onError();
  }

  render() {
    return this.state.failed ? null : this.props.children;
  }
}

export function PluginCellEditor<T>({
  session,
  index,
  columnIndex,
  column,
  item,
  value,
  handleCancel,
}: Props<T>) {
  const editor = column.editor;
  const settledRef = React.useRef(false);
  const commitPendingRef = React.useRef(false);
  const hostRef = React.useRef<HTMLDivElement>(null);
  const editorPortal = React.useContext(EditorPortalContext);
  const isCellEditSessionActive = useAppStore(s => s.isCellEditSessionActive);
  const moveActiveCell = useAppStore(s => s.moveActiveCell);
  const requestCellCommit = useAppStore(s => s.requestCellCommit);

  const finishOnce = React.useCallback(
    (callback: () => void | Promise<void>) => {
      if (settledRef.current || !isCellEditSessionActive(session.id)) return Promise.resolve();
      settledRef.current = true;
      return Promise.resolve(callback());
    },
    [isCellEditSessionActive, session.id],
  );

  const getPortalContainer = React.useCallback(() => {
    const gridRoot =
      editorPortal?.gridRef.current ?? hostRef.current?.closest<HTMLElement>('.bgrid-root') ?? null;
    const portalRoot = editorPortal?.portalRef.current ?? null;
    if (gridRoot && portalRoot) syncEditorPortalTheme(gridRoot, portalRoot);
    return portalRoot ?? document.body;
  }, [editorPortal]);

  React.useEffect(() => {
    if (editor?.type !== 'plugin') return;

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Node) || hostRef.current?.contains(target)) return;

      const portalContainer = getPortalContainer();
      if (portalContainer !== document.body && portalContainer.contains(target)) return;
      if (commitPendingRef.current) return;

      void finishOnce(() => handleCancel?.());
    };

    document.addEventListener('pointerdown', handlePointerDown, true);
    return () => document.removeEventListener('pointerdown', handlePointerDown, true);
  }, [editor?.type, finishOnce, getPortalContainer, handleCancel]);

  if (editor?.type !== 'plugin') return null;

  const pluginProps: BGridEditorPluginProps<T> = {
    sessionId: session.id,
    index,
    columnIndex,
    column,
    item,
    values: item.values,
    value,
    mode: session.mode,
    activation: session.activation,
    commit: async (changes, options) => {
      if (settledRef.current || commitPendingRef.current || !isCellEditSessionActive(session.id)) return;
      commitPendingRef.current = true;
      try {
        await requestCellCommit({
          sessionId: session.id,
          source: 'plugin',
          changes,
          options,
        });
        settledRef.current = true;
      } catch (error) {
        commitPendingRef.current = false;
        throw error;
      }
    },
    cancel: () => {
      if (commitPendingRef.current) return;
      void finishOnce(() => handleCancel?.());
    },
    move: direction => {
      if (commitPendingRef.current) return;
      void finishOnce(async () => {
        await handleCancel?.();
        moveActiveCell(direction, { extendSelection: false });
      });
    },
    getPortalContainer,
  };

  const EditorComponent = editor.component;
  return (
    <div ref={hostRef} className='bgrid-plugin-editor-host'>
      <PluginEditorBoundary pluginId={editor.id} onError={() => pluginProps.cancel()}>
        <EditorComponent {...pluginProps} />
      </PluginEditorBoundary>
    </div>
  );
}
