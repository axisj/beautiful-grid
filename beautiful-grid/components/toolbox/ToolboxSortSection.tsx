import * as React from 'react';
import { AppModelColumn, BGridSortParam } from '../../types';
import { useAppStore } from '../../store';

interface Props<T> {
  column: AppModelColumn<T>;
  columnId: string;
}

export function ToolboxSortSection<T>({ column, columnId }: Props<T>) {
  const dataQuery = useAppStore(s => s.dataQuery);
  const sortParams = useAppStore(s => s.sortParams);
  const setColumnSort = useAppStore(s => s.setColumnSort);
  const globalIcons = useAppStore(s => s.icons);

  const columnIcons = typeof column.toolbox === 'object' ? column.toolbox.icons : undefined;

  const activeSortParam: BGridSortParam | undefined =
    dataQuery?.sortParams.find(s => (s.columnId ?? s.key) === columnId) ??
    (sortParams?.[columnId] || (column.key ? sortParams?.[Array.isArray(column.key) ? column.key.join('.') : column.key] : undefined));

  const isAsc = activeSortParam?.orderBy === 'asc';
  const isDesc = activeSortParam?.orderBy === 'desc';

  const sortAscIcon = columnIcons?.sortAsc ?? globalIcons?.sortAsc ?? (
    <svg className="bgrid-toolbox-icon" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
      <path d="M3 11.5L8 4l5 7.5H3z" />
    </svg>
  );

  const sortDescIcon = columnIcons?.sortDesc ?? globalIcons?.sortDesc ?? (
    <svg className="bgrid-toolbox-icon" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
      <path d="M3 4.5L8 12l5-7.5H3z" />
    </svg>
  );

  const sortClearIcon = columnIcons?.sortClear ?? globalIcons?.sortClear ?? (
    <svg className="bgrid-toolbox-icon" viewBox="0 0 16 16" width="14" height="14" fill="currentColor">
      <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z" />
    </svg>
  );

  return (
    <div className="bgrid-toolbox-section bgrid-toolbox-sort-section">
      <div className="bgrid-toolbox-section-title">정렬</div>
      <div className="bgrid-toolbox-menu-list">
        <button
          type="button"
          className={`bgrid-toolbox-menu-item ${isAsc ? 'active' : ''}`}
          onClick={() => setColumnSort(columnId, 'asc')}
        >
          <span className="bgrid-toolbox-icon-wrapper">{sortAscIcon}</span>
          <span>오름차순 정렬</span>
        </button>

        <button
          type="button"
          className={`bgrid-toolbox-menu-item ${isDesc ? 'active' : ''}`}
          onClick={() => setColumnSort(columnId, 'desc')}
        >
          <span className="bgrid-toolbox-icon-wrapper">{sortDescIcon}</span>
          <span>내림차순 정렬</span>
        </button>

        {activeSortParam && (
          <button
            type="button"
            className="bgrid-toolbox-menu-item bgrid-toolbox-menu-item-clear"
            onClick={() => setColumnSort(columnId, null)}
          >
            <span className="bgrid-toolbox-icon-wrapper">{sortClearIcon}</span>
            <span>정렬 초기화</span>
          </button>
        )}
      </div>
    </div>
  );
}
