import * as React from 'react';
import type { BGridColumn, BGridDataItem } from '../types';
import { getColumnId } from '../utils';
import { useMasterDetailContext } from './MasterDetailContext';

interface Props<T> {
  column: BGridColumn<T>;
  item: BGridDataItem<T>;
  sourceIndex: number;
  children: React.ReactNode;
}

export function MasterDetailCell<T>({ column, item, sourceIndex, children }: Props<T>) {
  const masterDetail = useMasterDetailContext();
  if (!masterDetail || getColumnId(column) !== masterDetail.expandColumnId) {
    return <>{children}</>;
  }

  const rowKey = masterDetail.getRowKey(item.values);
  if (rowKey === undefined || rowKey === null) {
    return <>{children}</>;
  }

  const isExpandable = masterDetail.hasDetail(item, sourceIndex);
  const expanded = masterDetail.expandedKeysSet.has(rowKey);
  const toggleId = masterDetail.getToggleElementId(rowKey);
  const detailId = masterDetail.getDetailElementId(rowKey);

  return (
    <span className='bgrid-master-detail-cell'>
      {isExpandable ? (
        <button
          type='button'
          id={toggleId}
          className='bgrid-master-detail-toggle'
          aria-expanded={expanded}
          aria-controls={expanded ? detailId : undefined}
          aria-label={expanded ? masterDetail.collapseAriaLabel : masterDetail.expandAriaLabel}
          disabled={masterDetail.disabled}
          onClick={event => {
            event.stopPropagation();
            masterDetail.toggle(rowKey, item, sourceIndex);
          }}
          onKeyDown={event => {
            // Prevent master grid cell navigation from capturing Space or Enter on the toggle button
            if (event.key === ' ' || event.key === 'Enter') {
              event.stopPropagation();
            }
          }}
        >
          <span className='bgrid-master-detail-icon' aria-hidden='true'>
            {expanded ? masterDetail.icons?.expanded ?? '⌄' : masterDetail.icons?.collapsed ?? '›'}
          </span>
        </button>
      ) : (
        <span className='bgrid-master-detail-toggle-spacer' aria-hidden='true' />
      )}
      <span className='bgrid-master-detail-cell-content'>{children}</span>
    </span>
  );
}

export interface MasterDetailRowProps<T> {
  item: BGridDataItem<T>;
  sourceIndex: number;
  visibleIndex: number;
  detailHeight: number;
  isLeftRegion: boolean;
  viewportWidth: number;
  colSpan: number;
  frozenColumnsWidth?: number;
}

export function MasterDetailRow<T>({
  item,
  sourceIndex,
  visibleIndex,
  detailHeight,
  isLeftRegion,
  viewportWidth,
  colSpan,
  frozenColumnsWidth,
}: MasterDetailRowProps<T>) {
  const masterDetail = useMasterDetailContext();
  if (!masterDetail) return null;

  const rowKey = masterDetail.getRowKey(item.values);
  if (rowKey === undefined || rowKey === null || !masterDetail.expandedKeysSet.has(rowKey)) {
    return null;
  }

  const toggleId = masterDetail.getToggleElementId(rowKey);
  const detailId = masterDetail.getDetailElementId(rowKey);

  if (isLeftRegion) {
    return (
      <tr
        className='bgrid-detail-frozen-row'
        aria-hidden='true'
        data-detail-ri={visibleIndex}
        style={{
          height: detailHeight,
          ['--bgrid-item-cell-height' as string]: `${detailHeight}px`,
        }}
      >
        <td
          colSpan={colSpan}
          style={{
            height: detailHeight,
            maxHeight: 'none',
            padding: 0,
            margin: 0,
          }}
        />
      </tr>
    );
  }

  return (
    <tr
      className='bgrid-detail-row'
      data-bgrid-detail-owner='true'
      data-detail-ri={visibleIndex}
      style={{
        height: detailHeight,
        ['--bgrid-item-cell-height' as string]: `${detailHeight}px`,
      }}
    >
      <td
        colSpan={colSpan}
        className='bgrid-detail-cell'
        style={{
          height: detailHeight,
          maxHeight: 'none',
          padding: 0,
          margin: 0,
          verticalAlign: 'top',
        }}
      >
        <DetailPanelContent
          item={item}
          rowKey={rowKey}
          sourceIndex={sourceIndex}
          visibleIndex={visibleIndex}
          detailHeight={detailHeight}
          viewportWidth={viewportWidth}
          frozenColumnsWidth={frozenColumnsWidth}
          toggleId={toggleId}
          detailId={detailId}
          detailRender={masterDetail.detailRender}
          collapse={() => masterDetail.collapse(rowKey)}
        />
      </td>
      <td data-none='true' />
    </tr>
  );
}

function DetailPanelContent<T>({
  item,
  rowKey,
  sourceIndex,
  visibleIndex,
  detailHeight,
  viewportWidth,
  frozenColumnsWidth,
  toggleId,
  detailId,
  detailRender,
  collapse,
}: {
  item: BGridDataItem<T>;
  rowKey: React.Key;
  sourceIndex: number;
  visibleIndex: number;
  detailHeight: number;
  viewportWidth: number;
  frozenColumnsWidth?: number;
  toggleId: string;
  detailId: string;
  detailRender: (props: any) => React.ReactNode;
  collapse: () => void;
}) {
  const panelRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const panel = panelRef.current;
    return () => {
      const active = document.activeElement;
      if (active && panel && panel.contains(active)) {
        const toggle = document.getElementById(toggleId);
        toggle?.focus();
      }
    };
  }, [toggleId]);

  const contentHeight = Math.max(detailHeight - 1, 0);

  return (
    <div
      ref={panelRef}
      id={detailId}
      role='region'
      aria-labelledby={toggleId}
      className='bgrid-master-detail-panel'
      data-bgrid-detail-owner='true'
      data-visible-index={visibleIndex}
      data-source-index={sourceIndex}
      style={{
        position: 'sticky',
        left: frozenColumnsWidth ?? 0,
        width: viewportWidth > 0 ? viewportWidth : undefined,
        maxWidth: '100%',
        height: contentHeight,
        minHeight: contentHeight,
        maxHeight: contentHeight,
        boxSizing: 'border-box',
        overflow: 'auto',
      }}
      onPointerDown={e => {
        e.stopPropagation();
      }}
      onContextMenu={e => {
        e.stopPropagation();
      }}
    >
      {detailRender({
        item,
        rowKey,
        sourceIndex,
        visibleIndex,
        expanded: true,
        collapse,
      })}
    </div>
  );
}
