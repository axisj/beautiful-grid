import * as React from 'react';
import { AppModelColumn } from '../../types';
import { useAppStore } from '../../store';

interface Props<T> {
  column: AppModelColumn<T>;
  columnId: string;
  mode: 'menu' | 'hidden';
  onModeChange: (mode: 'menu' | 'hidden') => void;
  close: () => void;
}

function accessibleLabel(label: React.ReactNode, fallback: string) {
  return typeof label === 'string' || typeof label === 'number' ? String(label) : fallback;
}

export function ToolboxColumnVisibilitySection<T>({
  column,
  columnId,
  mode,
  onModeChange,
  close,
}: Props<T>) {
  const visibility = useAppStore(s => s.columnVisibilityState);
  const globalIcons = useAppStore(s => s.icons);
  const columnIcons = typeof column.toolbox === 'object' ? column.toolbox.icons : undefined;
  const hiddenItems = visibility?.items.filter(item => item.hidden) ?? [];

  React.useEffect(() => {
    if (mode === 'hidden' && hiddenItems.length === 0) onModeChange('menu');
  }, [hiddenItems.length, mode, onModeChange]);

  if (!visibility) return null;

  const visibleCount = visibility.items.length - hiddenItems.length;
  const currentItem = visibility.items.find(item => item.columnId === columnId);
  const canHideCurrent = !!currentItem?.hideable && visibleCount > 1;

  const hideIcon = columnIcons?.hideColumn ?? globalIcons?.hideColumn ?? (
    <svg className='bgrid-toolbox-icon' viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' strokeWidth='1.4'>
      <path d='M2 2l12 12' />
      <path d='M6.2 4.1A6.8 6.8 0 0 1 8 3.8c3.4 0 5.6 3.2 5.6 3.2a9 9 0 0 1-1.8 2.1M9.5 9.4A2.1 2.1 0 0 1 6.6 6.5M4.2 5.1A9.4 9.4 0 0 0 2.4 7S4.6 10.2 8 10.2c.5 0 1-.1 1.4-.2' />
    </svg>
  );
  const showIcon = columnIcons?.showColumn ?? globalIcons?.showColumn ?? (
    <svg className='bgrid-toolbox-icon' viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' strokeWidth='1.4'>
      <path d='M2.2 8s2.2-3.4 5.8-3.4S13.8 8 13.8 8s-2.2 3.4-5.8 3.4S2.2 8 2.2 8z' />
      <circle cx='8' cy='8' r='1.7' />
    </svg>
  );
  const columnsIcon = columnIcons?.columns ?? globalIcons?.columns ?? (
    <svg className='bgrid-toolbox-icon' viewBox='0 0 16 16' width='14' height='14' fill='none' stroke='currentColor' strokeWidth='1.4'>
      <rect x='2.2' y='2.5' width='11.6' height='11' rx='1' />
      <path d='M6 2.5v11M10 2.5v11' />
    </svg>
  );

  if (mode === 'hidden') {
    return (
      <div className='bgrid-toolbox-section bgrid-toolbox-visibility-section'>
        <div className='bgrid-toolbox-visibility-header'>
          <button
            type='button'
            className='bgrid-toolbox-icon-button'
            aria-label='컬럼 메뉴로 돌아가기'
            onClick={() => onModeChange('menu')}
          >
            <span aria-hidden='true'>‹</span>
          </button>
          <span className='bgrid-toolbox-visibility-title'>숨긴 컬럼</span>
        </div>
        <div className='bgrid-toolbox-hidden-list'>
          {hiddenItems.map(item => {
            const label = accessibleLabel(item.column.label, item.columnId);
            return (
              <button
                key={item.columnId}
                type='button'
                className='bgrid-toolbox-menu-item'
                aria-label={`${label} 컬럼 표시`}
                onClick={() => {
                  visibility.onChange(
                    visibility.hiddenColumnIds.filter(id => id !== item.columnId),
                    { type: 'show', columnId: item.columnId, column: item.column },
                  );
                }}
              >
                <span className='bgrid-toolbox-icon-wrapper'>{showIcon}</span>
                <span className='bgrid-toolbox-menu-label'>{item.column.label}</span>
              </button>
            );
          })}
        </div>
        <button
          type='button'
          className='bgrid-toolbox-menu-item bgrid-toolbox-show-all'
          onClick={() => {
            visibility.onChange([], { type: 'showAll' });
            close();
          }}
        >
          <span className='bgrid-toolbox-icon-wrapper'>{columnsIcon}</span>
          <span>모두 표시</span>
        </button>
      </div>
    );
  }

  return (
    <div className='bgrid-toolbox-section bgrid-toolbox-visibility-section'>
      <div className='bgrid-toolbox-section-title'>컬럼</div>
      <div className='bgrid-toolbox-menu-list'>
        <button
          type='button'
          className='bgrid-toolbox-menu-item'
          disabled={!canHideCurrent}
          aria-label={`${accessibleLabel(column.label, columnId)} 컬럼 숨기기`}
          title={!canHideCurrent && visibleCount <= 1 ? '최소 한 개의 컬럼은 표시해야 합니다.' : undefined}
          onClick={() => {
            if (!canHideCurrent) return;
            visibility.onChange(
              [...visibility.hiddenColumnIds, columnId],
              { type: 'hide', columnId, column: currentItem?.column },
            );
            close();
          }}
        >
          <span className='bgrid-toolbox-icon-wrapper'>{hideIcon}</span>
          <span>이 컬럼 숨기기</span>
        </button>
        {hiddenItems.length > 0 && (
          <button
            type='button'
            className='bgrid-toolbox-menu-item'
            aria-label={`숨긴 컬럼 ${hiddenItems.length}개 관리`}
            onClick={() => onModeChange('hidden')}
          >
            <span className='bgrid-toolbox-icon-wrapper'>{columnsIcon}</span>
            <span className='bgrid-toolbox-menu-label'>숨긴 컬럼 {hiddenItems.length}개</span>
            <span className='bgrid-toolbox-menu-chevron' aria-hidden='true'>›</span>
          </button>
        )}
      </div>
    </div>
  );
}
