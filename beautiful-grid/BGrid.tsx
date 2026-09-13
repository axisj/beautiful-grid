import * as React from 'react';
import Table from './components/Table';
import {
  AppModelColumn,
  BGridColumn,
  BGridColumnVisibilityChangeEvent,
  BGridColumnVisibilityState,
  BGridColumnWithOptionalWidth,
  BGridDataControl,
  BGridDataQuery,
  BGridProps,
  BGridSortParam,
  CheckedAll,
} from './types';
import {
  createPivotData,
  createRowHeightMetrics,
  buildHeaderMatrix,
  countVisibleCheckedIndexes,
  findDuplicateColumnIds,
  getCellValueByRowKey,
  getColumnId,
  getColumnKeyToken,
  getFrozenColumnsWidth,
  processDataQuery,
  projectColumnVisibility,
  resolveStatusOptions,
  resolvePaginationViewOptions,
  resolveScrollbarOptions,
  shouldRenderBottomBar,
} from './utils';
import { AppStoreInitialState, AppStoreProvider } from './store';

function computeModelColumns<T>(
  columns: BGridColumnWithOptionalWidth<T>[],
  frozenColumnIndex: number,
  duplicateToolboxColumnIds: Set<string>,
): AppModelColumn<T>[] {
  let left = 0;
  let previousWidth = 0;

  return columns.map((column, columnIndex) => {
    const columnId = getColumnId(column as BGridColumn<T>);
    if (columnIndex >= frozenColumnIndex) {
      left += previousWidth;
      previousWidth = column.width ?? 100;
    }
    return {
      ...column,
      columnId,
      keyToken: getColumnKeyToken(column.key),
      toolbox: duplicateToolboxColumnIds.has(columnId) ? false : column.toolbox,
      left: columnIndex < frozenColumnIndex ? -1 : left,
      width: column.width ?? 100,
    } as AppModelColumn<T>;
  });
}

export function BGrid<T = Record<string, any>>({
  ref,
  width,
  height,
  headerHeight = 30,
  footerHeight,
  summaryHeight = 30,
  itemHeight = 15,
  itemPadding = 7,
  getRowHeight,
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
  disabled,
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
  columnVisibility,
  searchOptions,
  contextMenuOptions,
}: BGridProps<T>) {
  const warnedSearchControlledRef = React.useRef({
    open: false,
    query: false,
    pivotContextMenu: false,
    columnVisibility: false,
  });
  const pivotData = React.useMemo(() => {
    return createPivotData({
      data,
      pivot,
    });
  }, [data, pivot]);
  const pivotEnabled = !!pivotData;
  const resolvedColumns = (pivotData?.columns ?? columns) as BGridColumnWithOptionalWidth<T>[];
  const visibilityOptions = typeof columnVisibility === 'object' ? columnVisibility : undefined;
  const visibilityEnabled =
    columnVisibility === true || (visibilityOptions !== undefined && visibilityOptions.enabled !== false);
  const [uncontrolledHiddenColumnIds, setUncontrolledHiddenColumnIds] = React.useState<string[]>(() =>
    Array.from(new Set(visibilityOptions?.defaultHiddenColumnIds ?? [])),
  );
  const hiddenColumnIds = React.useMemo(() => {
    if (!visibilityEnabled) return [];
    const requestedIds = Array.from(new Set(visibilityOptions?.hiddenColumnIds ?? uncontrolledHiddenColumnIds));
    if (
      resolvedColumns.length > 0 &&
      resolvedColumns.every(column => requestedIds.includes(getColumnId(column as BGridColumn<T>)))
    ) {
      const firstColumnId = getColumnId(resolvedColumns[0] as BGridColumn<T>);
      return requestedIds.filter(columnId => columnId !== firstColumnId);
    }
    return requestedIds;
  }, [resolvedColumns, uncontrolledHiddenColumnIds, visibilityEnabled, visibilityOptions?.hiddenColumnIds]);
  const hiddenColumnIdSet = React.useMemo(() => new Set(hiddenColumnIds), [hiddenColumnIds]);
  const resolvedColumnGroups = React.useMemo(
    () => (pivotEnabled ? [] : columnGroups ?? []),
    [columnGroups, pivotEnabled],
  );
  const resolvedColumnsGroup = React.useMemo(
    () => pivotData?.columnsGroup ?? (resolvedColumnGroups.length ? [] : columnsGroup ?? []),
    [columnsGroup, pivotData?.columnsGroup, resolvedColumnGroups.length],
  );
  const visibilityProjection = React.useMemo(
    () =>
      projectColumnVisibility<T>({
        columns: resolvedColumns,
        hiddenColumnIds: hiddenColumnIdSet,
        frozenColumnIndex: pivotEnabled ? 0 : frozenColumnIndex,
        columnsGroup: resolvedColumnsGroup,
        columnGroups: resolvedColumnGroups,
        cellMergeOptions: pivotEnabled ? undefined : cellMergeOptions,
        summary: pivotEnabled ? undefined : summary,
      }),
    [
      cellMergeOptions,
      frozenColumnIndex,
      hiddenColumnIdSet,
      pivotEnabled,
      resolvedColumnGroups,
      resolvedColumns,
      resolvedColumnsGroup,
      summary,
    ],
  );
  const resolvedData = pivotData?.data ?? data;
  const resolvedPage = pivotEnabled ? undefined : page;
  const resolvedFrozenColumnIndex = visibilityProjection.frozenColumnIndex;
  const resolvedRowChecked = pivotEnabled ? undefined : rowChecked;
  const resolvedSort = pivotEnabled ? undefined : sort;
  const resolvedDisabled = !!disabled;
  const resolvedOnClick = pivotEnabled || resolvedDisabled ? undefined : onClick;
  const baseOnChangeColumns = pivotEnabled ? undefined : onChangeColumns;
  const resolvedOnChangeData = pivotEnabled ? undefined : onChangeData;
  const resolvedRowKey = pivotEnabled ? undefined : rowKey;
  const resolvedSelectedRowKey = pivotEnabled ? undefined : selectedRowKey;
  const resolvedEditable = pivotEnabled || resolvedDisabled ? false : editable;
  const resolvedShowLineNumber = pivotEnabled ? false : showLineNumber;
  const resolvedGetRowClassName = pivotEnabled ? undefined : getRowClassName;
  const resolvedCellMergeOptions = visibilityProjection.cellMergeOptions;
  const resolvedCellSelectionOptions = resolvedDisabled
    ? { ...cellSelectionOptions, enabled: false }
    : cellSelectionOptions;
  const resolvedSummary = visibilityProjection.summary;
  const hasHiddenColumns = visibilityProjection.columns.length < resolvedColumns.length;
  const resolvedColumnSortable = pivotEnabled || hasHiddenColumns || resolvedDisabled ? false : columnSortable;
  const resolvedDataControl = pivotEnabled ? undefined : dataControl;
  const resolvedSearchOptions = pivotEnabled || resolvedDisabled ? undefined : searchOptions;
  const resolvedContextMenuOptions = pivotEnabled || resolvedDisabled ? undefined : contextMenuOptions;
  const hasActiveClientQuery =
    resolvedDataControl?.mode === 'client' &&
    (resolvedDataControl.query.sortParams.length > 0 || resolvedDataControl.query.filterParams.length > 0);
  const resolvedReorder = React.useMemo(
    () =>
      pivotEnabled || resolvedDisabled
        ? undefined
        : (hasActiveClientQuery || frozenRowCount > 0) && reorder
        ? { ...reorder, enabled: false }
        : reorder,
    [frozenRowCount, hasActiveClientQuery, pivotEnabled, reorder, resolvedDisabled],
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
      if (hasHiddenColumns && columnSortable) {
        console.warn('[BGrid] Column reordering is disabled while columns are hidden.');
      }
      if (
        visibilityOptions?.hiddenColumnIds !== undefined &&
        !visibilityOptions.onChange &&
        !warnedSearchControlledRef.current.columnVisibility
      ) {
        warnedSearchControlledRef.current.columnVisibility = true;
        console.warn(
          '[BGrid] Controlled columnVisibility.hiddenColumnIds requires onChange to respond to user actions.',
        );
      }
      if (searchOptions?.open !== undefined && !searchOptions.onOpenChange && !warnedSearchControlledRef.current.open) {
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
    columnSortable,
    hasHiddenColumns,
    visibilityOptions?.hiddenColumnIds,
    visibilityOptions?.onChange,
  ]);

  const duplicateToolboxColumnIds = React.useMemo(() => {
    const duplicates = findDuplicateColumnIds(resolvedColumns as any, true);
    if (visibilityEnabled) {
      findDuplicateColumnIds(resolvedColumns as any).forEach(columnId => duplicates.add(columnId));
    }
    return duplicates;
  }, [resolvedColumns, visibilityEnabled]);
  const warnedDuplicateIdsRef = React.useRef(new Set<string>());

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    const newDuplicateIds = Array.from(duplicateToolboxColumnIds).filter(id => !warnedDuplicateIdsRef.current.has(id));
    if (newDuplicateIds.length === 0) return;

    newDuplicateIds.forEach(id => warnedDuplicateIdsRef.current.add(id));
    console.warn(
      `[BGrid] Duplicate column IDs detected: ${newDuplicateIds.join(', ')}. Toolbox${
        visibilityEnabled ? ' and column visibility are' : ' is'
      } disabled for those columns; specify an explicit unique 'id'.`,
    );
  }, [duplicateToolboxColumnIds, visibilityEnabled]);

  const requestColumnVisibilityChange = React.useCallback(
    (nextHiddenColumnIds: string[], event: BGridColumnVisibilityChangeEvent<T>) => {
      const uniqueIds = Array.from(new Set(nextHiddenColumnIds));
      if (event.type === 'hide') {
        const visibleCount = resolvedColumns.reduce(
          (count, column) => count + (uniqueIds.includes(getColumnId(column as any)) ? 0 : 1),
          0,
        );
        if (visibleCount === 0) return;
      }
      if (visibilityOptions?.hiddenColumnIds === undefined) {
        setUncontrolledHiddenColumnIds(uniqueIds);
      }
      visibilityOptions?.onChange?.(uniqueIds, event);
    },
    [resolvedColumns, visibilityOptions],
  );

  const columnVisibilityState: BGridColumnVisibilityState<T> | undefined = React.useMemo(
    () =>
      visibilityEnabled
        ? {
            items: resolvedColumns.map(column => {
              const columnId = getColumnId(column as any);
              return {
                column: column as BGridColumn<T>,
                columnId,
                hidden: hiddenColumnIdSet.has(columnId),
                hideable: column.hideable !== false && !duplicateToolboxColumnIds.has(columnId),
              };
            }),
            hiddenColumnIds,
            onChange: requestColumnVisibilityChange,
          }
        : undefined,
    [
      duplicateToolboxColumnIds,
      hiddenColumnIdSet,
      hiddenColumnIds,
      requestColumnVisibilityChange,
      resolvedColumns,
      visibilityEnabled,
    ],
  );

  const computedColumns: AppModelColumn<T>[] = React.useMemo(() => {
    return computeModelColumns(visibilityProjection.columns, resolvedFrozenColumnIndex, duplicateToolboxColumnIds);
  }, [duplicateToolboxColumnIds, resolvedFrozenColumnIndex, visibilityProjection.columns]);

  const queryColumns: AppModelColumn<T>[] = React.useMemo(
    () => computeModelColumns(resolvedColumns, pivotEnabled ? 0 : frozenColumnIndex, duplicateToolboxColumnIds),
    [duplicateToolboxColumnIds, frozenColumnIndex, pivotEnabled, resolvedColumns],
  );

  const projectedOnChangeColumns = React.useCallback<NonNullable<BGridProps<T>['onChangeColumns']>>(
    (visibleColumnIndex, info) => {
      if (!baseOnChangeColumns) return;
      if (!hasHiddenColumns) {
        baseOnChangeColumns(visibleColumnIndex, info);
        return;
      }

      const nextColumns = [...resolvedColumns] as BGridColumn<T>[];
      visibilityProjection.visibleOriginalIndexes.forEach((originalIndex, visibleIndex) => {
        const updatedColumn = info.columns[visibleIndex];
        if (updatedColumn) nextColumns[originalIndex] = updatedColumn;
      });
      baseOnChangeColumns(
        visibleColumnIndex === null ? null : visibilityProjection.visibleOriginalIndexes[visibleColumnIndex] ?? null,
        {
          ...info,
          columns: nextColumns,
          columnsGroup: resolvedColumnsGroup,
          columnGroups: resolvedColumnGroups,
        },
      );
    },
    [
      baseOnChangeColumns,
      hasHiddenColumns,
      resolvedColumnGroups,
      resolvedColumns,
      resolvedColumnsGroup,
      visibilityProjection.visibleOriginalIndexes,
    ],
  );
  const resolvedOnChangeColumns = baseOnChangeColumns ? projectedOnChangeColumns : undefined;

  const headerMatrixDiagnostics = React.useMemo(
    () =>
      buildHeaderMatrix({
        columns: computedColumns,
        columnsGroup: visibilityProjection.columnsGroup,
        columnGroups: visibilityProjection.columnGroups,
      }),
    [computedColumns, visibilityProjection.columnGroups, visibilityProjection.columnsGroup],
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

    const knownIds = new Set(queryColumns.map(column => column.columnId));
    return Array.from(
      new Set(
        [
          ...resolvedDataControl.query.sortParams.map(param => param.columnId ?? param.key),
          ...resolvedDataControl.query.filterParams.map(param => param.columnId),
        ].filter((id): id is string => !!id && !knownIds.has(id)),
      ),
    );
  }, [queryColumns, resolvedDataControl]);
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
        columns: queryColumns,
        query: resolvedDataQuery,
        rowKey: resolvedRowKey,
        includeRows: false,
      });
    }

    return {
      rows: [],
      data: resolvedData as any,
      sourceIndexByVisibleIndex: undefined,
      visibleIndexBySourceIndex: undefined,
    };
  }, [queryColumns, resolvedData, resolvedDataControl?.mode, resolvedDataQuery, resolvedRowKey]);

  const displayData = processedResult.data;
  const rowHeightMetrics = React.useMemo(
    () => createRowHeightMetrics(displayData, itemHeight + itemPadding * 2, getRowHeight),
    [displayData, getRowHeight, itemHeight, itemPadding],
  );
  const resolvedFrozenRowCount = pivotEnabled
    ? 0
    : Math.min(Math.max(Math.floor(frozenRowCount), 0), displayData.length);

  const checkedIndexesMap: Map<number, any> = React.useMemo(() => {
    if (resolvedRowChecked?.checkedRowKeys && resolvedRowKey) {
      const remainingKeys = new Set(resolvedRowChecked.checkedRowKeys);
      const map: Map<number, any> = new Map();
      if (remainingKeys.size > 0 && resolvedData) {
        for (let i = 0; i < resolvedData.length; i++) {
          const itemKey = getCellValueByRowKey(resolvedRowKey, resolvedData[i].values);
          if (remainingKeys.has(itemKey)) {
            map.set(i, true);
            remainingKeys.delete(itemKey);
            if (remainingKeys.size === 0) break;
          }
        }
      }
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
      console.warn('[BGrid] Both bottomBarHeight and footerHeight were provided. bottomBarHeight takes precedence.');
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
    const visibleCheckedCount = countVisibleCheckedIndexes(
      displayData.length,
      checkedIndexesMap,
      processedResult.sourceIndexByVisibleIndex,
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
      frozenRowsHeight:
        rowHeightMetrics.offsets[resolvedFrozenRowCount] ?? resolvedFrozenRowCount * (itemHeight + itemPadding * 2),
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
      columnsGroup: visibilityProjection.columnsGroup,
      columnGroups: visibilityProjection.columnGroups,
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
      columnVisibilityState,
      searchOptions: resolvedSearchOptions,
      contextMenuOptions: resolvedContextMenuOptions,
      page: resolvedPage,
      displayPaginationLength: resolvedPage ? resolvedPage.displayPaginationLength ?? 5 : 0,
      loading,
      disabled: resolvedDisabled,
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
    rowHeightMetrics,
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
    visibilityProjection.columnsGroup,
    visibilityProjection.columnGroups,
    resolvedSort,
    sortParams,
    resolvedDataQuery,
    resolvedDataControl,
    icons,
    columnVisibilityState,
    resolvedSearchOptions,
    resolvedContextMenuOptions,
    loading,
    resolvedDisabled,
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
        ref={ref}
        {...{
          columns: computedColumns,
          columnsGroup: visibilityProjection.columnsGroup,
          columnGroups: visibilityProjection.columnGroups,
          onChangeColumns: resolvedOnChangeColumns,
          width,
          height,
          className,
          style,
          loading,
          disabled: resolvedDisabled,
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
          rowHeightMetrics,
          frozenColumnIndex: resolvedFrozenColumnIndex,
          frozenRowCount: resolvedFrozenRowCount,
          rowChecked: resolvedRowChecked,
          checkedIndexesMap,
          sort: resolvedSort,
          sortParams,
          dataQuery: resolvedDataQuery,
          dataControl: resolvedDataControl,
          icons,
          columnVisibilityState,
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
