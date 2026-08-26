import * as React from 'react';
import Table from './components/Table';
import { AppModelColumn, BGridDataControl, BGridDataQuery, BGridProps, BGridSortParam, CheckedAll } from './types';
import {
  createPivotData,
  buildHeaderMatrix,
  findDuplicateColumnIds,
  getCellValueByRowKey,
  getColumnId,
  getColumnKeyToken,
  getFrozenColumnsWidth,
  processDataQuery,
  resolveStatusOptions,
  resolvePaginationViewOptions,
  resolveScrollbarOptions,
  shouldRenderBottomBar,
} from './utils';
import { AppStoreInitialState, AppStoreProvider } from './store';

export function BGrid<T = Record<string, any>>({
  width,
  height,
  headerHeight = 30,
  footerHeight,
  summaryHeight = 30,
  itemHeight = 15,
  itemPadding = 7,
  columns,
  columnsGroup,
  columnGroups,
  onChangeColumns,
  frozenColumnIndex = 0,
  frozenRowCount = 0,
  data = [],
  page,
  scrollbar,
  status,
  pagination,
  bottomBarHeight,
  scrollTop = 0,
  scrollLeft = 0,
  className,
  style,
  rowChecked,
  sort,
  onClick,
  loading = false,
  spinning,
  rowKey,
  selectedRowKey,
  editable,
  onChangeData,
  showLineNumber,
  msg,
  getRowClassName,
  editTrigger = 'dblclick',
  cellMergeOptions,
  cellSelectionOptions,
  cellNavigationOptions,
  variant,
  summary,
  columnSortable,
  reorder,
  pivot,
  dataControl,
  icons,
  searchOptions,
  contextMenuOptions,
}: BGridProps<T>) {
  const warnedSearchControlledRef = React.useRef({ open: false, query: false, pivotContextMenu: false });
  const pivotData = React.useMemo(() => {
    return createPivotData({
      data,
      pivot,
    });
  }, [data, pivot]);
  const pivotEnabled = !!pivotData;
  const resolvedColumns = pivotData?.columns ?? columns;
  const resolvedColumnGroups = React.useMemo(
    () => (pivotEnabled ? [] : columnGroups ?? []),
    [columnGroups, pivotEnabled],
  );
  const resolvedColumnsGroup = React.useMemo(
    () => pivotData?.columnsGroup ?? (resolvedColumnGroups.length ? [] : columnsGroup ?? []),
    [columnsGroup, pivotData?.columnsGroup, resolvedColumnGroups.length],
  );
  const resolvedData = pivotData?.data ?? data;
  const resolvedPage = pivotEnabled ? undefined : page;
  const resolvedFrozenColumnIndex = pivotEnabled ? 0 : frozenColumnIndex;
  const resolvedRowChecked = pivotEnabled ? undefined : rowChecked;
  const resolvedSort = pivotEnabled ? undefined : sort;
  const resolvedOnClick = pivotEnabled ? undefined : onClick;
  const resolvedOnChangeColumns = pivotEnabled ? undefined : onChangeColumns;
  const resolvedOnChangeData = pivotEnabled ? undefined : onChangeData;
  const resolvedRowKey = pivotEnabled ? undefined : rowKey;
  const resolvedSelectedRowKey = pivotEnabled ? undefined : selectedRowKey;
  const resolvedEditable = pivotEnabled ? false : editable;
  const resolvedShowLineNumber = pivotEnabled ? false : showLineNumber;
  const resolvedGetRowClassName = pivotEnabled ? undefined : getRowClassName;
  const resolvedCellMergeOptions = pivotEnabled ? undefined : cellMergeOptions;
  const resolvedCellSelectionOptions = cellSelectionOptions;
  const resolvedSummary = pivotEnabled ? undefined : summary;
  const resolvedColumnSortable = pivotEnabled ? false : columnSortable;
  const resolvedDataControl = pivotEnabled ? undefined : dataControl;
  const resolvedSearchOptions = pivotEnabled ? undefined : searchOptions;
  const resolvedContextMenuOptions = pivotEnabled ? undefined : contextMenuOptions;
  const hasActiveClientQuery =
    resolvedDataControl?.mode === 'client' &&
    (resolvedDataControl.query.sortParams.length > 0 || resolvedDataControl.query.filterParams.length > 0);
  const resolvedReorder = React.useMemo(
    () =>
      pivotEnabled
        ? undefined
        : (hasActiveClientQuery || frozenRowCount > 0) && reorder
        ? { ...reorder, enabled: false }
        : reorder,
    [frozenRowCount, hasActiveClientQuery, pivotEnabled, reorder],
  );

  // Development warnings
  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      if (resolvedDataControl && resolvedSort) {
        console.warn('[BGrid] Both dataControl and sort props were provided. dataControl will take precedence.');
      }
      if (resolvedDataControl?.mode === 'client' && resolvedPage) {
        console.warn(
          '[BGrid] dataControl in "client" mode is used alongside external "page". Filtering is applied only to the current page.',
        );
      }
      if (hasActiveClientQuery && reorder?.enabled) {
        console.warn('[BGrid] Row reordering is disabled while a client-side sort or filter is active.');
      }
      if (!pivotEnabled && frozenRowCount > 0 && reorder?.enabled) {
        console.warn('[BGrid] Row reordering is disabled while frozen rows are active.');
      }
      if ((columnGroups?.length ?? 0) > 0 && (columnsGroup?.length ?? 0) > 0) {
        console.warn('[BGrid] Both columnGroups and columnsGroup were provided. columnGroups takes precedence.');
      }
      if (pivotEnabled && frozenRowCount > 0) {
        console.warn('[BGrid] frozenRowCount is disabled while pivot mode is active.');
      }
      if (pivotEnabled && searchOptions && searchOptions.enabled !== false) {
        console.warn('[BGrid] searchOptions is disabled while pivot mode is active.');
      }
      if (pivotEnabled && contextMenuOptions && !warnedSearchControlledRef.current.pivotContextMenu) {
        warnedSearchControlledRef.current.pivotContextMenu = true;
        console.warn('[BGrid] contextMenuOptions is disabled while pivot mode is active.');
      }
      if (
        searchOptions?.open !== undefined &&
        !searchOptions.onOpenChange &&
        !warnedSearchControlledRef.current.open
      ) {
        warnedSearchControlledRef.current.open = true;
        console.warn('[BGrid] Controlled searchOptions.open requires onOpenChange to respond to user actions.');
      }
      if (
        searchOptions?.query !== undefined &&
        !searchOptions.onQueryChange &&
        !warnedSearchControlledRef.current.query
      ) {
        warnedSearchControlledRef.current.query = true;
        console.warn('[BGrid] Controlled searchOptions.query requires onQueryChange to respond to user input.');
      }
    }
  }, [
    columnGroups?.length,
    columnsGroup?.length,
    frozenRowCount,
    hasActiveClientQuery,
    pivotEnabled,
    reorder?.enabled,
    resolvedDataControl,
    resolvedPage,
    resolvedSort,
    contextMenuOptions,
    searchOptions,
  ]);

  const duplicateToolboxColumnIds = React.useMemo(
    () => findDuplicateColumnIds(resolvedColumns as any, true),
    [resolvedColumns],
  );
  const warnedDuplicateIdsRef = React.useRef(new Set<string>());

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    const newDuplicateIds = Array.from(duplicateToolboxColumnIds).filter(id => !warnedDuplicateIdsRef.current.has(id));
    if (newDuplicateIds.length === 0) return;

    newDuplicateIds.forEach(id => warnedDuplicateIdsRef.current.add(id));
    console.warn(
      `[BGrid] Duplicate column IDs detected: ${newDuplicateIds.join(
        ', ',
      )}. Toolbox is disabled for those columns; specify an explicit unique 'id'.`,
    );
  }, [duplicateToolboxColumnIds]);

  const computedColumns: AppModelColumn<T>[] = React.useMemo(() => {
    let left = 0;
    let prevWidth = 0;

    return [
      ...resolvedColumns.slice(0, resolvedFrozenColumnIndex).map(column => {
        const columnId = getColumnId(column as any);
        return {
          ...column,
          columnId,
          keyToken: getColumnKeyToken(column.key),
          toolbox: duplicateToolboxColumnIds.has(columnId) ? false : column.toolbox,
          left: -1,
          width: column.width ?? 100,
        };
      }),
      ...resolvedColumns.slice(resolvedFrozenColumnIndex).map(column => {
        left += prevWidth;
        prevWidth = column.width ?? 100;
        const columnId = getColumnId(column as any);
        return {
          ...column,
          columnId,
          keyToken: getColumnKeyToken(column.key),
          toolbox: duplicateToolboxColumnIds.has(columnId) ? false : column.toolbox,
          left,
          width: column.width ?? 100,
        };
      }),
    ] as AppModelColumn<T>[];
  }, [duplicateToolboxColumnIds, resolvedColumns, resolvedFrozenColumnIndex]);

  const headerMatrixDiagnostics = React.useMemo(
    () =>
      buildHeaderMatrix({
        columns: computedColumns,
        columnsGroup: resolvedColumnsGroup,
        columnGroups: resolvedColumnGroups,
      }),
    [computedColumns, resolvedColumnGroups, resolvedColumnsGroup],
  );

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;
    if (headerMatrixDiagnostics.errors.length) {
      console.warn(
        `[BGrid] Invalid column group configuration (${headerMatrixDiagnostics.errors.join(
          ', ',
        )}). The header falls back to a flat layout.`,
      );
    }
    const minimumHeaderHeight = headerMatrixDiagnostics.rowCount * 22;
    if (resolvedColumnGroups.length > 0 && headerHeight < minimumHeaderHeight) {
      console.warn(
        `[BGrid] headerHeight ${headerHeight}px is smaller than the recommended ${minimumHeaderHeight}px for ${headerMatrixDiagnostics.rowCount} header rows.`,
      );
    }
  }, [headerHeight, headerMatrixDiagnostics, resolvedColumnGroups.length]);

  const unknownQueryColumnIds = React.useMemo(() => {
    if (!resolvedDataControl) return [] as string[];

    const knownIds = new Set(computedColumns.map(column => column.columnId));
    return Array.from(
      new Set(
        [
          ...resolvedDataControl.query.sortParams.map(param => param.columnId ?? param.key),
          ...resolvedDataControl.query.filterParams.map(param => param.columnId),
        ].filter((id): id is string => !!id && !knownIds.has(id)),
      ),
    );
  }, [computedColumns, resolvedDataControl]);
  const warnedUnknownQueryIdsRef = React.useRef(new Set<string>());

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    const newUnknownIds = unknownQueryColumnIds.filter(id => !warnedUnknownQueryIdsRef.current.has(id));
    if (newUnknownIds.length === 0) return;

    newUnknownIds.forEach(id => warnedUnknownQueryIdsRef.current.add(id));
    console.warn(
      `[BGrid] Query references unknown column IDs: ${newUnknownIds.join(
        ', ',
      )}. Those sort/filter entries are ignored.`,
    );
  }, [unknownQueryColumnIds]);

  const resolvedDataQuery: BGridDataQuery = React.useMemo(() => {
    if (resolvedDataControl) {
      return resolvedDataControl.query;
    }

    if (resolvedSort) {
      return {
        sortParams: resolvedSort.sortParams.map((s, idx) => ({
          ...s,
          index: idx,
          columnId:
            s.columnId ??
            (s.key ? (Array.isArray(s.key) ? `key:array:${JSON.stringify(s.key)}` : `key:string:${s.key}`) : undefined),
        })),
        filterParams: [],
      };
    }

    return {
      sortParams: [],
      filterParams: [],
    };
  }, [resolvedDataControl, resolvedSort]);

  // Process data in client mode
  const processedResult = React.useMemo(() => {
    if (resolvedDataControl?.mode === 'client') {
      return processDataQuery({
        data: resolvedData as any,
        columns: computedColumns,
        query: resolvedDataQuery,
        rowKey: resolvedRowKey,
        includeRows: false,
      });
    }

    const sourceIndexByVisibleIndex = resolvedData.map((_, i) => i);
    const visibleIndexBySourceIndex = new Map(resolvedData.map((_, i) => [i, i]));

    return {
      rows: [],
      data: resolvedData as any,
      sourceIndexByVisibleIndex,
      visibleIndexBySourceIndex,
    };
  }, [computedColumns, resolvedData, resolvedDataControl?.mode, resolvedDataQuery, resolvedRowKey]);

  const displayData = processedResult.data;
  const resolvedFrozenRowCount = pivotEnabled
    ? 0
    : Math.min(Math.max(Math.floor(frozenRowCount), 0), displayData.length);

  const checkedIndexesMap: Map<number, any> = React.useMemo(() => {
    if (resolvedRowChecked?.checkedRowKeys && resolvedRowKey) {
      const map: Map<number, any> = new Map();
      resolvedRowChecked.checkedRowKeys.forEach(key => {
        const fIndex = resolvedData?.findIndex((item, index, obj) => {
          return getCellValueByRowKey(resolvedRowKey, item.values) === key;
        });
        if (fIndex > -1) {
          map.set(fIndex, true);
        }
      });
      return map;
    }
    if (resolvedRowChecked?.checkedIndexes) {
      return new Map(resolvedRowChecked?.checkedIndexes.map(id => [id, true]));
    }
    return new Map();
  }, [resolvedData, resolvedRowChecked?.checkedIndexes, resolvedRowChecked?.checkedRowKeys, resolvedRowKey]);

  const sortParams = React.useMemo(() => {
    if (resolvedDataControl) {
      return resolvedDataControl.query.sortParams.reduce((acc, cur, currentIndex) => {
        const key = cur.columnId ?? cur.key;
        if (key) acc[key] = { ...cur, index: currentIndex };
        return acc;
      }, {} as Record<string, BGridSortParam>);
    }

    if (resolvedSort) {
      return resolvedSort.sortParams.reduce((acc, cur, currentIndex) => {
        if (cur.key) acc[cur.key] = { ...cur, index: currentIndex };
        return acc;
      }, {} as Record<string, BGridSortParam>);
    }

    return {};
  }, [resolvedDataControl, resolvedSort]);

  const resolvedStatus = React.useMemo(() => resolveStatusOptions(status), [status]);
  const resolvedPagination = React.useMemo(() => resolvePaginationViewOptions(pagination), [pagination]);
  const resolvedScrollbar = React.useMemo(() => resolveScrollbarOptions(scrollbar), [scrollbar]);
  const resolvedBottomBarHeight = bottomBarHeight ?? footerHeight ?? 30;

  const initialShowBottomBar = React.useMemo(
    () =>
      shouldRenderBottomBar({
        hasPage: !!resolvedPage,
        scrollbar: resolvedScrollbar,
        status: resolvedStatus,
        pagination: resolvedPagination,
      }),
    [resolvedPage, resolvedScrollbar, resolvedStatus, resolvedPagination],
  );

  React.useEffect(() => {
    if (process.env.NODE_ENV !== 'production' && bottomBarHeight !== undefined && footerHeight !== undefined) {
      console.warn(
        '[BGrid] Both bottomBarHeight and footerHeight were provided. bottomBarHeight takes precedence.',
      );
    }
  }, [bottomBarHeight, footerHeight]);

  const initialStoreState: AppStoreInitialState<T> = React.useMemo(() => {
    const initialWidth = width !== undefined ? Math.max(width, 100) : 0;
    const initialHeight = height !== undefined ? Math.max(height, 100) : 0;
    const containerBorderWidth = 1;
    const contentBodyHeight =
      initialHeight > 0
        ? Math.max(
            initialHeight -
              headerHeight -
              (initialShowBottomBar ? resolvedBottomBarHeight : 0) -
              (resolvedSummary ? summaryHeight : 0) -
              containerBorderWidth * 2,
            0,
          )
        : 0;
    const displayItemCount = contentBodyHeight > 0 ? Math.ceil(contentBodyHeight / (itemHeight + itemPadding * 2)) : 0;
    const visibleCheckedCount = processedResult.sourceIndexByVisibleIndex.reduce(
      (count, sourceIndex) => count + (checkedIndexesMap.has(sourceIndex) ? 1 : 0),
      0,
    );
    const checkedAll: CheckedAll =
      displayData.length === 0
        ? false
        : visibleCheckedCount === displayData.length
        ? true
        : visibleCheckedCount > 0
        ? 'indeterminate'
        : false;

    return {
      width: initialWidth,
      height: initialHeight,
      headerHeight,
      footerHeight,
      bottomBarHeight: resolvedBottomBarHeight,
      scrollbar: resolvedScrollbar,
      status: resolvedStatus,
      pagination: resolvedPagination,
      summaryHeight,
      itemHeight,
      itemPadding,
      frozenColumnIndex: resolvedFrozenColumnIndex,
      frozenRowCount: resolvedFrozenRowCount,
      frozenRowsHeight: resolvedFrozenRowCount * (itemHeight + itemPadding * 2),
      frozenColumnsWidth: getFrozenColumnsWidth({
        showLineNumber: resolvedShowLineNumber,
        rowChecked: resolvedRowChecked,
        itemHeight,
        frozenColumnIndex: resolvedFrozenColumnIndex,
        columns: computedColumns,
        dataLength: displayData.length,
        reorderable: resolvedReorder?.enabled ?? false,
      }),
      columns: computedColumns,
      columnsGroup: resolvedColumnsGroup,
      columnGroups: resolvedColumnGroups,
      data: displayData as any,
      sourceData: resolvedData as any,
      sourceIndexByVisibleIndex: processedResult.sourceIndexByVisibleIndex,
      visibleIndexBySourceIndex: processedResult.visibleIndexBySourceIndex,
      contentBodyHeight,
      displayItemCount,
      checkedIndexesMap,
      checkedAll,
      rowChecked: resolvedRowChecked,
      sort: resolvedSort,
      sortParams,
      dataQuery: resolvedDataQuery,
      dataControl: resolvedDataControl,
      icons,
      searchOptions: resolvedSearchOptions,
      contextMenuOptions: resolvedContextMenuOptions,
      page: resolvedPage,
      displayPaginationLength: resolvedPage ? resolvedPage.displayPaginationLength ?? 5 : 0,
      loading,
      spinning,
      scrollTop,
      scrollLeft,
      rowKey: resolvedRowKey,
      selectedRowKey: resolvedSelectedRowKey,
      editable: resolvedEditable,
      editTrigger,
      showLineNumber: resolvedShowLineNumber,
      msg,
      getRowClassName: resolvedGetRowClassName,
      cellMergeOptions: resolvedCellMergeOptions,
      cellNavigationOptions,
      variant,
      summary: resolvedSummary,
      columnSortable: resolvedColumnSortable,
      reorder: resolvedReorder,
      className,
      style,
      onClick: resolvedOnClick,
      onChangeColumns: resolvedOnChangeColumns,
      onChangeData: resolvedOnChangeData,
    };
  }, [
    cellNavigationOptions,
    width,
    height,
    headerHeight,
    footerHeight,
    resolvedBottomBarHeight,
    resolvedScrollbar,
    resolvedStatus,
    resolvedPagination,
    summaryHeight,
    itemHeight,
    itemPadding,
    resolvedPage,
    resolvedSummary,
    checkedIndexesMap,
    displayData,
    resolvedData,
    processedResult.sourceIndexByVisibleIndex,
    processedResult.visibleIndexBySourceIndex,
    resolvedFrozenColumnIndex,
    resolvedFrozenRowCount,
    resolvedShowLineNumber,
    resolvedRowChecked,
    computedColumns,
    resolvedReorder,
    resolvedColumnsGroup,
    resolvedColumnGroups,
    resolvedSort,
    sortParams,
    resolvedDataQuery,
    resolvedDataControl,
    icons,
    resolvedSearchOptions,
    resolvedContextMenuOptions,
    loading,
    spinning,
    scrollTop,
    scrollLeft,
    resolvedRowKey,
    resolvedSelectedRowKey,
    resolvedEditable,
    editTrigger,
    msg,
    resolvedGetRowClassName,
    resolvedCellMergeOptions,
    variant,
    resolvedColumnSortable,
    className,
    style,
    resolvedOnClick,
    resolvedOnChangeColumns,
    resolvedOnChangeData,
    initialShowBottomBar,
  ]);

  return (
    <AppStoreProvider initialState={initialStoreState}>
      <Table
        {...{
          columns: computedColumns,
          columnsGroup: resolvedColumnsGroup,
          columnGroups: resolvedColumnGroups,
          onChangeColumns: resolvedOnChangeColumns,
          width,
          height,
          className,
          style,
          loading,
          spinning,
          scrollLeft,
          scrollTop,
          headerHeight,
          footerHeight,
          bottomBarHeight: resolvedBottomBarHeight,
          scrollbar: resolvedScrollbar,
          status: resolvedStatus,
          pagination: resolvedPagination,
          summaryHeight,
          itemHeight,
          itemPadding,
          frozenColumnIndex: resolvedFrozenColumnIndex,
          frozenRowCount: resolvedFrozenRowCount,
          rowChecked: resolvedRowChecked,
          checkedIndexesMap,
          sort: resolvedSort,
          sortParams,
          dataQuery: resolvedDataQuery,
          dataControl: resolvedDataControl,
          icons,
          searchOptions: resolvedSearchOptions,
          contextMenuOptions: resolvedContextMenuOptions,
          page: resolvedPage,
          data: displayData as any,
          sourceData: resolvedData as any,
          sourceIndexByVisibleIndex: processedResult.sourceIndexByVisibleIndex,
          visibleIndexBySourceIndex: processedResult.visibleIndexBySourceIndex,
          onClick: resolvedOnClick,
          rowKey: resolvedRowKey,
          selectedRowKey: resolvedSelectedRowKey,
          editable: resolvedEditable,
          editTrigger,
          onChangeData: resolvedOnChangeData,
          showLineNumber: resolvedShowLineNumber,
          msg,
          getRowClassName: resolvedGetRowClassName,
          cellMergeOptions: resolvedCellMergeOptions,
          cellSelectionOptions: resolvedCellSelectionOptions,
          cellNavigationOptions,
          variant,
          summary: resolvedSummary,
          columnSortable: resolvedColumnSortable,
          reorder: resolvedReorder,
        }}
      />
    </AppStoreProvider>
  );
}
