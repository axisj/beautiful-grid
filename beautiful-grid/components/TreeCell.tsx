import * as React from 'react';
import type { BGridColumn, BGridDataItem } from '../types';
import { useAppStoreApi } from '../store';
import { getColumnId } from '../utils';
import { useTreeContext } from './TreeContext';

interface Props<T> {
  column: BGridColumn<T>;
  item: BGridDataItem<T>;
  children: React.ReactNode;
}

export function TreeCell<T>({ column, item, children }: Props<T>) {
  const tree = useTreeContext();
  const store = useAppStoreApi();
  if (!tree || getColumnId(column) !== tree.treeColumnId) return <>{children}</>;

  const key = tree.getRowKey(item.values);
  const meta = key === undefined ? undefined : tree.metaByRowKey.get(key);
  if (!meta) return <>{children}</>;

  return (
    <span
      className='bgrid-tree-cell'
      style={
        {
          '--bgrid-tree-depth': meta.depth,
          '--bgrid-tree-indent-size': `${tree.indentSize}px`,
        } as React.CSSProperties
      }
    >
      {meta.hasChildren ? (
        <button
          type='button'
          className='bgrid-tree-toggle'
          aria-expanded={meta.expanded}
          aria-label={meta.expanded ? tree.collapseAriaLabel : tree.expandAriaLabel}
          disabled={tree.disabled}
          onClick={event => {
            event.stopPropagation();
            if (meta.expanded) {
              const state = store.getState();
              const activeCell = state.activeCell;
              const activeSourceIndex =
                activeCell === undefined
                  ? undefined
                  : state.sourceIndexByVisibleIndex?.[activeCell.rowIndex] ?? activeCell.rowIndex;
              let activeMeta =
                activeSourceIndex === undefined ? undefined : tree.metaBySourceIndex.get(activeSourceIndex);
              let activeIsDescendant = false;
              while (activeMeta?.parentSourceIndex !== undefined) {
                if (activeMeta.parentSourceIndex === meta.sourceIndex) {
                  activeIsDescendant = true;
                  break;
                }
                activeMeta = tree.metaBySourceIndex.get(activeMeta.parentSourceIndex);
              }
              state.clearCellSelection();
              if (activeCell && activeIsDescendant) {
                state.endCellEdit();
                state.setActiveCell({
                  rowIndex: state.visibleIndexBySourceIndex?.get(meta.sourceIndex) ?? 0,
                  columnIndex: activeCell.columnIndex,
                });
              }
            }
            tree.toggle(meta);
          }}
        >
          <span className='bgrid-tree-icon' aria-hidden='true'>
            {meta.expanded ? tree.icons?.expanded ?? '⌄' : tree.icons?.collapsed ?? '›'}
          </span>
        </button>
      ) : (
        <span className='bgrid-tree-toggle-spacer' aria-hidden='true'>
          <span className='bgrid-tree-icon'>{tree.icons?.leaf}</span>
        </span>
      )}
      <span className='bgrid-tree-cell-content'>{children}</span>
    </span>
  );
}
