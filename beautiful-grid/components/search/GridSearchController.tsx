import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../../store';
import { dedupeSearchMatches, findGridSearchMatches } from '../../utils/gridSearch';

const SYNCHRONOUS_CELL_LIMIT = 50_000;
const CELLS_PER_CHUNK = 5_000;

export function GridSearchController() {
  const { searchOpen, searchQuery, searchOptions, data, columns, sourceIndexByVisibleIndex, rowKey, cellMergeOptions } =
    useAppStore(
      useShallow(s => ({
        searchOpen: s.searchOpen,
        searchQuery: s.searchQuery,
        searchOptions: s.searchOptions,
        data: s.data,
        columns: s.columns,
        sourceIndexByVisibleIndex: s.sourceIndexByVisibleIndex,
        rowKey: s.rowKey,
        cellMergeOptions: s.cellMergeOptions,
      })),
    );
  const { clearSearchResults, setSearchResults, setSearchStatus } = useAppStore(
    useShallow(s => ({
      clearSearchResults: s.clearSearchResults,
      setSearchResults: s.setSearchResults,
      setSearchStatus: s.setSearchStatus,
    })),
  );
  const warnedColumnsRef = React.useRef(new Set<string>());
  const previousQueryRef = React.useRef(searchQuery);

  React.useEffect(() => {
    const queryChanged = previousQueryRef.current !== searchQuery;
    previousQueryRef.current = searchQuery;

    if (!searchOpen || !searchOptions || searchOptions.enabled === false || searchQuery.length === 0) {
      clearSearchResults();
      return;
    }

    if (queryChanged) clearSearchResults();
    setSearchStatus('searching');

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const onGetSearchTextError = (columnId: string, error: unknown) => {
      if (process.env.NODE_ENV === 'production' || warnedColumnsRef.current.has(columnId)) return;
      warnedColumnsRef.current.add(columnId);
      console.warn(
        `[BGrid] getSearchText failed for column "${columnId}". The raw cell value was used instead.`,
        error,
      );
    };
    const common = {
      data,
      columns,
      sourceIndexByVisibleIndex,
      rowKey,
      cellMergeOptions,
      searchOptions,
      query: searchQuery,
      onGetSearchTextError,
    };
    const totalCells = data.length * columns.length;

    if (totalCells <= SYNCHRONOUS_CELL_LIMIT) {
      timer = setTimeout(() => {
        if (cancelled) return;
        setSearchResults(findGridSearchMatches(common));
      }, 0);
    } else {
      const rowsPerChunk = Math.max(1, Math.floor(CELLS_PER_CHUNK / Math.max(columns.length, 1)));
      const collected = [] as ReturnType<typeof findGridSearchMatches>;
      let startRowIndex = 0;
      const runChunk = () => {
        if (cancelled) return;
        const endRowIndex = Math.min(startRowIndex + rowsPerChunk, data.length);
        collected.push(...findGridSearchMatches({ ...common, startRowIndex, endRowIndex }));
        startRowIndex = endRowIndex;
        if (startRowIndex < data.length) {
          timer = setTimeout(runChunk, 0);
          return;
        }
        setSearchResults(dedupeSearchMatches(collected));
      };
      timer = setTimeout(runChunk, 0);
    }

    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [
    cellMergeOptions,
    clearSearchResults,
    columns,
    data,
    rowKey,
    searchOpen,
    searchOptions,
    searchQuery,
    setSearchResults,
    setSearchStatus,
    sourceIndexByVisibleIndex,
  ]);

  return null;
}
