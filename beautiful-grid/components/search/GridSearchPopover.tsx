import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../store';
import { BGridSearchOpenReason } from '../../types';

interface Props {
  gridRef: React.RefObject<HTMLDivElement | null>;
}

export const GridSearchPopover = React.forwardRef<HTMLDivElement, Props>(function GridSearchPopover(
  { gridRef },
  ref,
) {
  const { open, query, status, matches, activeIndex, options, page, loadedRowCount } = useAppStore(
    useShallow(s => ({
      open: s.searchOpen,
      query: s.searchQuery,
      status: s.searchStatus,
      matches: s.searchMatches,
      activeIndex: s.activeSearchMatchIndex,
      options: s.searchOptions,
      page: s.page,
      loadedRowCount: s.data.length,
    })),
  );
  const { requestSearchOpen, setSearchQuery, moveSearchMatch } = useAppStore(
    useShallow(s => ({
      requestSearchOpen: s.requestSearchOpen,
      setSearchQuery: s.setSearchQuery,
      moveSearchMatch: s.moveSearchMatch,
    })),
  );
  const inputRef = React.useRef<HTMLInputElement>(null);
  const previousFocusRef = React.useRef<HTMLElement | null>(null);
  const isComposingRef = React.useRef(false);
  const [draftQuery, setDraftQuery] = React.useState(query);
  const searchId = React.useId().replace(/:/g, '');

  React.useEffect(() => {
    if (!open) isComposingRef.current = false;
    if (!isComposingRef.current) setDraftQuery(query);
  }, [open, query]);

  React.useEffect(() => {
    if (!open) return;
    const gridRoot = gridRef.current;
    const input = inputRef.current;
    const activeElement = document.activeElement;
    previousFocusRef.current =
      activeElement instanceof HTMLElement && gridRoot?.contains(activeElement) ? activeElement : null;
    input?.focus({ preventScroll: true });
    input?.select();
    return () => {
      const currentFocus = document.activeElement;
      if (currentFocus !== input && currentFocus !== document.body) return;
      const previousFocus = previousFocusRef.current;
      if (previousFocus?.isConnected && gridRoot?.contains(previousFocus)) {
        previousFocus.focus({ preventScroll: true });
      } else if (gridRoot?.isConnected) {
        gridRoot.focus({ preventScroll: true });
      }
    };
  }, [gridRef, open]);

  if (!open || !options || options.enabled === false) return null;

  const labels = options.labels;
  const icons = options.icons;
  const hasResults = matches.length > 0;
  const activeResult = hasResults ? (activeIndex ?? 0) + 1 : 0;
  const resultContent =
    status === 'searching'
      ? labels?.searching ?? '검색 중…'
      : labels?.formatResultCount
      ? labels.formatResultCount({
          activeResult,
          totalResults: matches.length,
          loadedRowCount,
          paged: !!page,
        })
      : hasResults
      ? `${activeResult} / ${matches.length}`
      : labels?.noResults ?? '결과 없음';

  const close = (reason: BGridSearchOpenReason) => {
    requestSearchOpen(false, reason);
  };

  return (
    <div
      ref={ref}
      id={`bgrid-search-${searchId}`}
      role='search'
      aria-label='DataGrid 검색'
      className='bgrid-search-popover'
    >
      {icons?.search && <span className='bgrid-search-leading-icon'>{icons.search}</span>}
      <input
        ref={inputRef}
        className='bgrid-search-input'
        value={draftQuery}
        aria-label={labels?.inputAriaLabel ?? '그리드 데이터 찾기'}
        placeholder={labels?.placeholder ?? '찾기'}
        autoComplete='off'
        spellCheck={false}
        onCompositionStart={() => {
          isComposingRef.current = true;
        }}
        onCompositionEnd={event => {
          isComposingRef.current = false;
          const nextQuery = event.currentTarget.value;
          setDraftQuery(nextQuery);
          setSearchQuery(nextQuery);
        }}
        onChange={event => {
          const nextQuery = event.currentTarget.value;
          setDraftQuery(nextQuery);
          if (!isComposingRef.current) {
            setSearchQuery(nextQuery);
          }
        }}
        onKeyDown={event => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            close('escape');
            return;
          }
          if (event.key !== 'Enter') return;
          if (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229) return;
          event.preventDefault();
          if (hasResults && status !== 'searching') moveSearchMatch(event.shiftKey ? 'previous' : 'next');
        }}
      />
      <span className='bgrid-search-result-status' role='status' aria-live='polite' aria-atomic='true'>
        {resultContent}
      </span>
      <button
        type='button'
        className='bgrid-search-button'
        aria-label={labels?.previousAriaLabel ?? '이전 검색 결과'}
        title={labels?.previousAriaLabel ?? '이전 검색 결과'}
        disabled={!hasResults || status === 'searching'}
        onClick={() => moveSearchMatch('previous')}
      >
        {icons?.previous ?? '↑'}
      </button>
      <button
        type='button'
        className='bgrid-search-button'
        aria-label={labels?.nextAriaLabel ?? '다음 검색 결과'}
        title={labels?.nextAriaLabel ?? '다음 검색 결과'}
        disabled={!hasResults || status === 'searching'}
        onClick={() => moveSearchMatch('next')}
      >
        {icons?.next ?? '↓'}
      </button>
      <button
        type='button'
        className='bgrid-search-button bgrid-search-close-button'
        aria-label={labels?.closeAriaLabel ?? '검색 닫기'}
        title={labels?.closeAriaLabel ?? '검색 닫기'}
        onClick={() => close('closeButton')}
      >
        {icons?.close ?? '×'}
      </button>
    </div>
  );
});
