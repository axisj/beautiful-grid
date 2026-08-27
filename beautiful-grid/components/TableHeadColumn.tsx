import * as React from 'react';
import { useRef } from 'react';
import { AppModelColumn, BGridSortParam } from '../types';
import { useAppStore } from '../store';
import { getColumnId } from '../utils';
import { CheckboxHeaderControl } from './CheckboxHeaderControl';

type TableHeadToolboxModule = typeof import('./toolbox/TableHeadToolbox');

let tableHeadToolboxModule: Promise<TableHeadToolboxModule> | undefined;

function loadTableHeadToolbox() {
  tableHeadToolboxModule ??= import('./toolbox/TableHeadToolbox');
  return tableHeadToolboxModule;
}

const LazyTableHeadToolbox = React.lazy(() =>
  loadTableHeadToolbox().then(module => ({
    default: module.TableHeadToolbox as React.ComponentType<any>,
  })),
);

interface Props<T> {
  column: AppModelColumn<T>;
  columnIndex?: number;
}

function TableHeadColumn<T>({ column, columnIndex = 0 }: Props<T>) {
  const sort = useAppStore(s => s.sort);
  const sortParams = useAppStore(s => s.sortParams);
  const dataQuery = useAppStore(s => s.dataQuery);
  const activeToolboxColumnId = useAppStore(s => s.activeToolboxColumnId);
  const setActiveToolbox = useAppStore(s => s.setActiveToolbox);
  const globalIcons = useAppStore(s => s.icons);

  const columnId = column.columnId ?? getColumnId(column as any);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const reactId = React.useId().replace(/:/g, '');
  const triggerId = `bgrid-toolbox-btn-${reactId}`;
  const dialogId = `bgrid-toolbox-dialog-${reactId}`;

  const isToolboxEnabled = !!column.toolbox;
  const isToolboxOpen = activeToolboxColumnId === columnId;
  const columnIcons = typeof column.toolbox === 'object' ? column.toolbox.icons : undefined;
  const hasCheckboxHeader = column.editor?.type === 'checkbox' && !!column.editor.header;
  const headerLabel = (
    <>
      {hasCheckboxHeader && <CheckboxHeaderControl column={column} columnIndex={columnIndex} />}
      <span className='bgrid-head-column-label-text'>{column.label}</span>
    </>
  );

  // Check sort status
  const activeSortParam: BGridSortParam | undefined =
    dataQuery?.sortParams.find(s => (s.columnId ?? s.key) === columnId) ??
    (sortParams?.[columnId] || (column.key ? sortParams?.[Array.isArray(column.key) ? column.key.join('.') : column.key] : undefined));

  const isAsc = activeSortParam?.orderBy === 'asc';
  const isDesc = activeSortParam?.orderBy === 'desc';
  const sortIndex =
    activeSortParam && dataQuery && dataQuery.sortParams.length > 1
      ? dataQuery.sortParams.findIndex(s => (s.columnId ?? s.key) === columnId) + 1
      : activeSortParam && sortParams && Object.keys(sortParams).length > 1
      ? Number(activeSortParam.index) + 1
      : null;

  // Check filter status
  const activeFilterParam = dataQuery?.filterParams.find(f => f.columnId === columnId);
  const isFiltered = !!activeFilterParam;

  // Tooltip
  const tooltipParts: string[] = [];
  if (isAsc) tooltipParts.push('오름차순 정렬');
  if (isDesc) tooltipParts.push('내림차순 정렬');
  if (isFiltered) tooltipParts.push('필터 적용됨');
  const tooltip = tooltipParts.length > 0 ? tooltipParts.join(', ') : '컬럼 옵션 열기';

  // Resolve icons with hierarchy (column -> global -> default)
  const sortAscIcon = columnIcons?.sortAsc ?? globalIcons?.sortAsc ?? (
    <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor">
      <path d="M3 11.5L8 4l5 7.5H3z" />
    </svg>
  );

  const sortDescIcon = columnIcons?.sortDesc ?? globalIcons?.sortDesc ?? (
    <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor">
      <path d="M3 4.5L8 12l5-7.5H3z" />
    </svg>
  );

  const filterIcon = columnIcons?.filter ?? globalIcons?.filter ?? (
    <svg viewBox="0 0 16 16" width="12" height="12" fill="currentColor" className="bgrid-filter-icon">
      <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.293V13.5a.5.5 0 0 1-.74.439l-2.5-1.5A.5.5 0 0 1 6.5 12V8.293L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z" />
    </svg>
  );

  const filterBadgeIcon = columnIcons?.filterBadge ?? globalIcons?.filterBadge ?? (
    <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor" className="bgrid-filter-badge-icon">
      <path d="M1.5 1.5A.5.5 0 0 1 2 1h12a.5.5 0 0 1 .5.5v2a.5.5 0 0 1-.128.334L10 8.293V13.5a.5.5 0 0 1-.74.439l-2.5-1.5A.5.5 0 0 1 6.5 12V8.293L1.628 3.834A.5.5 0 0 1 1.5 3.5v-2z" />
    </svg>
  );

  const dropdownIcon = columnIcons?.dropdown ?? globalIcons?.dropdown ?? (
    <svg viewBox="0 0 16 16" width="10" height="10" fill="currentColor" className="bgrid-dropdown-arrow">
      <path d="M3 6l5 5 5-5H3z" />
    </svg>
  );

  if (isToolboxEnabled) {
    return (
      <div className="bgrid-head-cell-wrapper">
        <span className="bgrid-head-column-label bgrid-column-drag-handle">
          {headerLabel}
        </span>

        <button
          ref={buttonRef}
          id={triggerId}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={isToolboxOpen}
          aria-controls={dialogId}
          aria-label={`${String(column.label || columnId)} 컬럼 메뉴`}
          title={tooltip}
          className={`bgrid-toolbox-trigger-btn ${isToolboxOpen ? 'active' : ''} ${
            isFiltered ? 'is-filtered' : ''
          } ${isAsc || isDesc ? 'is-sorted' : ''}`}
          onClick={e => {
            e.preventDefault();
            e.stopPropagation();
            setActiveToolbox(isToolboxOpen ? null : columnId);
          }}
          onMouseDown={e => e.stopPropagation()}
          onPointerEnter={() => void loadTableHeadToolbox()}
          onFocus={() => void loadTableHeadToolbox()}
        >
          {/* Combined / State-based Icons */}
          {isFiltered && (isAsc || isDesc) ? (
            <span className="bgrid-icon-combo">
              {isAsc ? sortAscIcon : sortDescIcon}
              {filterBadgeIcon}
            </span>
          ) : isFiltered ? (
            filterIcon
          ) : isAsc ? (
            sortAscIcon
          ) : isDesc ? (
            sortDescIcon
          ) : (
            dropdownIcon
          )}

          {sortIndex && <span className="bgrid-sort-index-badge">{sortIndex}</span>}
        </button>

        {isToolboxOpen && (
          <React.Suspense fallback={null}>
            <LazyTableHeadToolbox
              anchorEl={buttonRef.current}
              column={column}
              columnId={columnId}
              columnIndex={columnIndex}
              dialogId={dialogId}
              triggerId={triggerId}
              onClose={() => setActiveToolbox(null)}
            />
          </React.Suspense>
        )}
      </div>
    );
  }

  // Legacy sort rendering fallback when toolbox is disabled
  if (sort && !column.sortDisable) {
    return (
      <div className={'bgrid-head-column'}>
        <span className={'bgrid-head-column-label bgrid-column-drag-handle'}>{headerLabel}</span>
        <span className={'bgrid-sorter'} data-sort={activeSortParam?.orderBy} />
        {activeSortParam && sortIndex && (
          <div className={'bgrid-sort-order'}>{sortIndex}</div>
        )}
      </div>
    );
  }

  return (
    <div className={'bgrid-head-column'}>
      <span className={'bgrid-head-column-label bgrid-column-drag-handle'}>{headerLabel}</span>
    </div>
  );
}

export default TableHeadColumn;
