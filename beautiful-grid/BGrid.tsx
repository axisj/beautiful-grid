import * as React from 'react';
import Table from './components/Table';
import {
  AppModelColumn,
  BGridColumn,
  BGridColumnVisibilityChangeEvent,
  BGridColumnVisibilityState,
  BGridColumnWithOptionalWidth,
  BGridDataItem,
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
  getTreeRowPath,
  processDataQuery,
  projectTreeData,
  projectColumnVisibility,
  resolveStatusOptions,
  resolvePaginationViewOptions,
  resolveScrollbarOptions,
  computeSummaryHeight,
  DEFAULT_SUMMARY_ROW_HEIGHT,
  shouldRenderBottomBar,
} from './utils';
import { AppStoreInitialState, AppStoreProvider } from './store';
import { TreeContext, type BGridTreeContextValue } from './components/TreeContext';
import { MasterDetailContext, type BGridMasterDetailContextValue } from './components/MasterDetailContext';

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

function encodeMasterDetailRowKey(rowKey: React.Key): string {
  const codePoints = Array.from(String(rowKey), character => character.codePointAt(0)!.toString(16));
  return `${typeof rowKey}-${codePoints.join('-')}`;
}

export function BGrid<T = Record<string, any>>({
  ref,
  width,
  height,
  headerHeight = 30,
  footerHeight,
  summaryHeight: explicitSummaryHeight,
  summaryRowHeight = DEFAULT_SUMMARY_ROW_HEIGHT,
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
  tree,
  masterDetail,
}: BGridProps<T>) {
  const [uncontrolledExpandedRowKeys, setUncontrolledExpandedRowKeys] = React.useState<React.Key[]>(() => [
    ...(tree?.defaultExpandedRowKeys ?? []),
  ]);
  const expandedRowKeys = tree?.expandedRowKeys ?? uncontrolledExpandedRowKeys;

  const [uncontrolledMasterDetailExpandedKeys, setUncontrolledMasterDetailExpandedKeys] = React.useState<readonly React.Key[]>(
    () => masterDetail?.defaultExpandedRowKeys ?? [],
  );
  const masterDetailExpandedKeys =
    masterDetail?.expandedRowKeys !== undefined
      ? masterDetail.expandedRowKeys
      : uncontrolledMasterDetailExpandedKeys;
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
  const baseOnChangeData = pivotEnabled ? undefined : onChangeData;
  const resolvedRowKey = pivotEnabled ? undefined : rowKey;
  const resolvedSelectedRowKey = pivotEnabled ? undefined : selectedRowKey;
  const resolvedEditable = pivotEnabled || resolvedDisabled ? false : editable;
  const resolvedShowLineNumber = pivotEnabled ? false : showLineNumber;
  const resolvedGetRowClassName = pivotEnabled ? undefined : getRowClassName;
  const requestedTreeEnabled = !!tree && tree.enabled !== false;
  const treeEnabled = requestedTreeEnabled && !pivotEnabled && resolvedRowKey !== undefined;
  const requestedMasterDetailEnabled = !!masterDetail && masterDetail.enabled !== false;
  const masterDetailEnabled =
    requestedMasterDetailEnabled &&
    !pivotEnabled &&
    !treeEnabled &&
    resolvedRowKey !== undefined &&
    frozenRowCount <= 0;
  const resolvedCellMergeOptions =
    treeEnabled || masterDetailEnabled ? undefined : visibilityProjection.cellMergeOptions;
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
      pivotEnabled || resolvedDisabled || treeEnabled || masterDetailEnabled
        ? undefined
        : (hasActiveClientQuery || frozenRowCount > 0) && reorder
        ? { ...reorder, enabled: false }
        : reorder,
    [frozenRowCount, hasActiveClientQuery, masterDetailEnabled, pivotEnabled, reorder, resolvedDisabled, treeEnabled],
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
      if (requestedTreeEnabled && rowKey === undefined) {
        console.warn('[BGrid] tree requires rowKey. Falling back to flat rows.');
      }
      if (pivotEnabled && requestedTreeEnabled) {
        console.warn('[BGrid] tree is disabled while pivot mode is active.');
      }
      if (treeEnabled && cellMergeOptions) {
        console.warn('[BGrid] cellMergeOptions is disabled while tree mode is active.');
      }
      if (treeEnabled && reorder?.enabled) {
        console.warn('[BGrid] Row reordering is disabled while tree mode is active.');
      }
      if (requestedMasterDetailEnabled && rowKey === undefined) {
        console.warn('[BGrid] masterDetail requires rowKey. Falling back to flat rows.');
      }
      if (pivotEnabled && requestedMasterDetailEnabled) {
        console.warn('[BGrid] masterDetail is disabled while pivot mode is active.');
      }
      if (treeEnabled && requestedMasterDetailEnabled) {
        console.warn('[BGrid] masterDetail is disabled while tree mode is active.');
      }
      if (masterDetailEnabled && cellMergeOptions) {
        console.warn('[BGrid] cellMergeOptions is disabled while masterDetail mode is active.');
      }
      if (masterDetailEnabled && reorder?.enabled) {
        console.warn('[BGrid] Row reordering is disabled while masterDetail mode is active.');
      }
      if (requestedMasterDetailEnabled && frozenRowCount > 0) {
        console.warn('[BGrid] masterDetail is disabled when frozenRowCount > 0.');
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
    cellMergeOptions,
    masterDetailEnabled,
    requestedMasterDetailEnabled,
    requestedTreeEnabled,
    rowKey,
    treeEnabled,
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

  const resolvedTreeColumnId = React.useMemo(() => {
    if (!treeEnabled || visibilityProjection.columns.length === 0) return undefined;
    const requestedId = tree?.treeColumnId;
    return requestedId &&
      visibilityProjection.columns.some(column => getColumnId(column as BGridColumn<T>) === requestedId)
      ? requestedId
      : getColumnId(visibilityProjection.columns[0] as BGridColumn<T>);
  }, [tree?.treeColumnId, treeEnabled, visibilityProjection.columns]);

  const resolvedExpandColumnId = React.useMemo(() => {
    if (!masterDetailEnabled || visibilityProjection.columns.length === 0) return undefined;
    const requestedId = masterDetail?.expandColumnId;
    return requestedId &&
      visibilityProjection.columns.some(column => getColumnId(column as BGridColumn<T>) === requestedId)
      ? requestedId
      : getColumnId(visibilityProjection.columns[0] as BGridColumn<T>);
  }, [masterDetail?.expandColumnId, masterDetailEnabled, visibilityProjection.columns]);

  const computedColumns: AppModelColumn<T>[] = React.useMemo(() => {
    let columns = computeModelColumns(
      visibilityProjection.columns,
      resolvedFrozenColumnIndex,
      duplicateToolboxColumnIds,
    );
    if (resolvedTreeColumnId) {
      columns = columns.map(column => (column.columnId === resolvedTreeColumnId ? { ...column, treeCell: true } : column));
    }
    if (resolvedExpandColumnId) {
      columns = columns.map(column =>
        column.columnId === resolvedExpandColumnId ? { ...column, masterDetailCell: true } : column,
      );
    }
    return columns;
  }, [
    duplicateToolboxColumnIds,
    resolvedExpandColumnId,
    resolvedFrozenColumnIndex,
    resolvedTreeColumnId,
    visibilityProjection.columns,
  ]);

  const warnedTreeColumnIdRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (
      process.env.NODE_ENV === 'production' ||
      !treeEnabled ||
      !tree?.treeColumnId ||
      tree.treeColumnId === resolvedTreeColumnId ||
      warnedTreeColumnIdRef.current === tree.treeColumnId
    ) {
      return;
    }
    warnedTreeColumnIdRef.current = tree.treeColumnId;
    console.warn(
      `[BGrid] tree.treeColumnId "${tree.treeColumnId}" is not visible. Falling back to the first visible column.`,
    );
  }, [resolvedTreeColumnId, tree?.treeColumnId, treeEnabled]);

  const warnedExpandColumnIdRef = React.useRef<string | undefined>(undefined);
  React.useEffect(() => {
    if (
      process.env.NODE_ENV === 'production' ||
      !masterDetailEnabled ||
      !masterDetail?.expandColumnId ||
      masterDetail.expandColumnId === resolvedExpandColumnId ||
      warnedExpandColumnIdRef.current === masterDetail.expandColumnId
    ) {
      return;
    }
    warnedExpandColumnIdRef.current = masterDetail.expandColumnId;
    console.warn(
      `[BGrid] masterDetail.expandColumnId "${masterDetail.expandColumnId}" is not visible. Falling back to the first visible column.`,
    );
  }, [masterDetail?.expandColumnId, masterDetailEnabled, resolvedExpandColumnId]);

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

  // Apply the existing client query first. Tree mode uses its result as sibling order
  // and as the direct-match set, then restores the hierarchy during projection.
  const queryProcessedResult = React.useMemo(() => {
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

  const treeProjection = React.useMemo(() => {
    if (!treeEnabled || !tree || resolvedRowKey === undefined) return undefined;
    const clientQuery = resolvedDataControl?.mode === 'client';
    return projectTreeData({
      data: resolvedData as any,
      rowKey: resolvedRowKey,
      parentRowKey: tree.parentRowKey,
      expandedRowKeys,
      includedSourceIndexes:
        clientQuery && resolvedDataQuery.filterParams.length > 0
          ? queryProcessedResult.sourceIndexByVisibleIndex
          : undefined,
      orderedSourceIndexes:
        clientQuery && resolvedDataQuery.sortParams.length > 0
          ? queryProcessedResult.sourceIndexByVisibleIndex
          : undefined,
    });
  }, [
    expandedRowKeys,
    queryProcessedResult.sourceIndexByVisibleIndex,
    resolvedData,
    resolvedDataControl?.mode,
    resolvedDataQuery.filterParams.length,
    resolvedDataQuery.sortParams.length,
    resolvedRowKey,
    tree,
    treeEnabled,
  ]);

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production' || !treeProjection || treeProjection.valid) return;
    console.warn(`[BGrid] Invalid tree data (${treeProjection.diagnostics.join(', ')}). Falling back to flat rows.`);
  }, [treeProjection]);

  const resolvedTreeProjection = treeProjection?.valid ? treeProjection : undefined;
  const processedResult = resolvedTreeProjection
    ? {
        rows: [],
        data: resolvedTreeProjection.data,
        sourceIndexByVisibleIndex: resolvedTreeProjection.sourceIndexByVisibleIndex,
        visibleIndexBySourceIndex: resolvedTreeProjection.visibleIndexBySourceIndex,
      }
    : queryProcessedResult;

  const displayData = processedResult.data;

  const resolvedOnChangeData = React.useMemo<BGridProps<T>['onChangeData']>(() => {
    if (!baseOnChangeData) return undefined;
    if (!resolvedTreeProjection) return baseOnChangeData;
    return (index, columnIndex, item, column, meta) => {
      const treeMeta = resolvedTreeProjection.metaBySourceIndex.get(index);
      if (!meta || !treeMeta) {
        baseOnChangeData(index, columnIndex, item, column, meta);
        return;
      }
      baseOnChangeData(index, columnIndex, item, column, {
        ...meta,
        tree: {
          rowKey: treeMeta.rowKey,
          parentRowKey: treeMeta.parentRowKey,
          sourceIndex: treeMeta.sourceIndex,
          depth: treeMeta.depth,
          path: getTreeRowPath(resolvedTreeProjection.metaBySourceIndex, index),
        },
      });
    };
  }, [baseOnChangeData, resolvedTreeProjection]);

  const toggleTreeRow = React.useCallback(
    (meta: Parameters<BGridTreeContextValue['toggle']>[0]) => {
      if (resolvedDisabled || !tree || !meta.hasChildren) return;
      const nextExpanded = meta.expanded
        ? expandedRowKeys.filter(key => !Object.is(key, meta.rowKey))
        : expandedRowKeys.some(key => Object.is(key, meta.rowKey))
        ? [...expandedRowKeys]
        : [...expandedRowKeys, meta.rowKey];
      if (tree.expandedRowKeys === undefined) setUncontrolledExpandedRowKeys(nextExpanded);
      const item = resolvedData[meta.sourceIndex] as BGridDataItem<T> | undefined;
      if (item) {
        tree.onExpandedRowKeysChange?.(nextExpanded, {
          rowKey: meta.rowKey,
          expanded: !meta.expanded,
          item,
          sourceIndex: meta.sourceIndex,
        });
      }
    },
    [expandedRowKeys, resolvedData, resolvedDisabled, tree],
  );

  const treeContextValue = React.useMemo<BGridTreeContextValue | undefined>(() => {
    if (!resolvedTreeProjection || !resolvedTreeColumnId || resolvedRowKey === undefined || !tree) return undefined;
    const indentSize = Number.isFinite(tree.indentSize) && (tree.indentSize ?? -1) >= 0 ? tree.indentSize! : 16;
    return {
      treeColumnId: resolvedTreeColumnId,
      indentSize,
      icons: tree.icons,
      expandAriaLabel: tree.expandAriaLabel ?? 'Expand row',
      collapseAriaLabel: tree.collapseAriaLabel ?? 'Collapse row',
      disabled: resolvedDisabled,
      metaByRowKey: resolvedTreeProjection.metaByRowKey,
      metaBySourceIndex: resolvedTreeProjection.metaBySourceIndex,
      getRowKey: values => {
        const key = getCellValueByRowKey(resolvedRowKey, values);
        return key === undefined || key === null ? undefined : (key as React.Key);
      },
      toggle: toggleTreeRow,
    };
  }, [resolvedDisabled, resolvedRowKey, resolvedTreeColumnId, resolvedTreeProjection, toggleTreeRow, tree]);

  const rawGridId = React.useId();
  const gridInstanceId = React.useMemo(() => rawGridId.replace(/[^a-zA-Z0-9_-]/g, '_'), [rawGridId]);

  const masterDetailRowKeysMeta = React.useMemo(() => {
    if (!masterDetailEnabled || resolvedRowKey === undefined) return undefined;
    const validKeys = new Set<React.Key>();
    const rowsByKey = new Map<React.Key, { item: BGridDataItem<T>; sourceIndex: number }>();
    const duplicateKeys = new Set<React.Key>();
    const missingKeyIndexes: number[] = [];

    for (let i = 0; i < resolvedData.length; i++) {
      const key = getCellValueByRowKey(resolvedRowKey, resolvedData[i].values);
      if (key === undefined || key === null) {
        missingKeyIndexes.push(i);
      } else {
        const k = key as React.Key;
        if (validKeys.has(k)) {
          duplicateKeys.add(k);
        } else {
          validKeys.add(k);
          rowsByKey.set(k, { item: resolvedData[i] as BGridDataItem<T>, sourceIndex: i });
        }
      }
    }
    return { validKeys, rowsByKey, duplicateKeys, missingKeyIndexes };
  }, [masterDetailEnabled, resolvedData, resolvedRowKey]);

  React.useEffect(() => {
    if (process.env.NODE_ENV === 'production' || !masterDetailRowKeysMeta) return;
    if (masterDetailRowKeysMeta.missingKeyIndexes.length > 0) {
      console.warn(
        `[BGrid] masterDetail found ${masterDetailRowKeysMeta.missingKeyIndexes.length} rows with missing or null rowKey at indexes: [${masterDetailRowKeysMeta.missingKeyIndexes.slice(0, 5).join(', ')}${masterDetailRowKeysMeta.missingKeyIndexes.length > 5 ? ', ...' : ''}]. These rows cannot be expanded.`,
      );
    }
    if (masterDetailRowKeysMeta.duplicateKeys.size > 0) {
      console.warn(
        `[BGrid] masterDetail found duplicate rowKey values: [${Array.from(masterDetailRowKeysMeta.duplicateKeys).slice(0, 5).join(', ')}]. These rows cannot be expanded.`,
      );
    }
  }, [masterDetailRowKeysMeta]);

  const expandMode = masterDetail?.expandMode ?? 'multiple';
  const masterDetailHasDetail = masterDetail?.hasDetail;
  const effectiveMasterDetailExpandedKeysSet = React.useMemo(() => {
    if (!masterDetailEnabled || !masterDetailRowKeysMeta) return new Set<React.Key>();
    const set = new Set<React.Key>();
    for (const key of masterDetailExpandedKeys) {
      if (masterDetailRowKeysMeta.duplicateKeys.has(key)) continue;
      const row = masterDetailRowKeysMeta.rowsByKey.get(key);
      if (!row) continue;
      if (masterDetailHasDetail) {
        try {
          if (!masterDetailHasDetail(row.item, row.sourceIndex)) continue;
        } catch {
          continue;
        }
      }
      set.add(key);
      if (expandMode === 'single') break;
    }
    return set;
  }, [expandMode, masterDetailHasDetail, masterDetailEnabled, masterDetailExpandedKeys, masterDetailRowKeysMeta]);

  const toggleMasterDetailRow = React.useCallback(
    (rowKey: React.Key, item: BGridDataItem<T>, sourceIndex: number) => {
      if (resolvedDisabled || !masterDetailEnabled || !masterDetail) return;
      const isExpanded = effectiveMasterDetailExpandedKeysSet.has(rowKey);
      let nextKeys: React.Key[];
      if (expandMode === 'single') {
        nextKeys = isExpanded ? [] : [rowKey];
      } else {
        if (isExpanded) {
          nextKeys = masterDetailExpandedKeys.filter(k => !Object.is(k, rowKey));
        } else {
          const exists = masterDetailExpandedKeys.some(k => Object.is(k, rowKey));
          nextKeys = exists ? [...masterDetailExpandedKeys] : [...masterDetailExpandedKeys, rowKey];
        }
      }
      if (masterDetail.expandedRowKeys === undefined) {
        setUncontrolledMasterDetailExpandedKeys(nextKeys);
      }
      masterDetail.onExpandedRowKeysChange?.(nextKeys, {
        rowKey,
        expanded: !isExpanded,
        item,
        sourceIndex,
      });
    },
    [
      effectiveMasterDetailExpandedKeysSet,
      expandMode,
      masterDetail,
      masterDetailEnabled,
      masterDetailExpandedKeys,
      resolvedDisabled,
    ],
  );

  const collapseMasterDetailRow = React.useCallback(
    (rowKey: React.Key) => {
      if (resolvedDisabled || !masterDetailEnabled || !masterDetail) return;
      if (!effectiveMasterDetailExpandedKeysSet.has(rowKey)) return;
      let nextKeys: React.Key[];
      if (expandMode === 'single') {
        nextKeys = [];
      } else {
        nextKeys = masterDetailExpandedKeys.filter(k => !Object.is(k, rowKey));
      }
      if (masterDetail.expandedRowKeys === undefined) {
        setUncontrolledMasterDetailExpandedKeys(nextKeys);
      }
      const sourceIndex = resolvedData.findIndex(
        d => Object.is(getCellValueByRowKey(resolvedRowKey!, d.values), rowKey),
      );
      const item = resolvedData[sourceIndex] as BGridDataItem<T> | undefined;
      if (item) {
        masterDetail.onExpandedRowKeysChange?.(nextKeys, {
          rowKey,
          expanded: false,
          item,
          sourceIndex: sourceIndex >= 0 ? sourceIndex : 0,
        });
      }
    },
    [
      effectiveMasterDetailExpandedKeysSet,
      expandMode,
      masterDetail,
      masterDetailEnabled,
      masterDetailExpandedKeys,
      resolvedData,
      resolvedDisabled,
      resolvedRowKey,
    ],
  );

  const getToggleElementId = React.useCallback(
    (rowKey: React.Key) => `${gridInstanceId}-detail-toggle-${encodeMasterDetailRowKey(rowKey)}`,
    [gridInstanceId],
  );

  const getDetailElementId = React.useCallback(
    (rowKey: React.Key) => `${gridInstanceId}-detail-region-${encodeMasterDetailRowKey(rowKey)}`,
    [gridInstanceId],
  );

  const masterDetailContextValue = React.useMemo<BGridMasterDetailContextValue | undefined>(() => {
    if (!masterDetailEnabled || !resolvedExpandColumnId || resolvedRowKey === undefined || !masterDetail) {
      return undefined;
    }
    return {
      gridId: gridInstanceId,
      expandColumnId: resolvedExpandColumnId,
      icons: masterDetail.icons,
      expandAriaLabel: masterDetail.expandAriaLabel ?? 'Expand row',
      collapseAriaLabel: masterDetail.collapseAriaLabel ?? 'Collapse row',
      disabled: resolvedDisabled,
      expandedKeysSet: effectiveMasterDetailExpandedKeysSet,
      getRowKey: values => {
        const key = getCellValueByRowKey(resolvedRowKey, values);
        return key === undefined || key === null ? undefined : (key as React.Key);
      },
      hasDetail: (item, sourceIndex) => {
        const rowKey = getCellValueByRowKey(resolvedRowKey, item.values);
        if (rowKey === undefined || rowKey === null) return false;
        if (masterDetailRowKeysMeta?.duplicateKeys.has(rowKey as React.Key)) return false;
        if (masterDetail.hasDetail) {
          try {
            return masterDetail.hasDetail(item, sourceIndex);
          } catch {
            return false;
          }
        }
        return true;
      },
      detailRender: masterDetail.detailRender,
      toggle: toggleMasterDetailRow,
      collapse: collapseMasterDetailRow,
      getToggleElementId,
      getDetailElementId,
    };
  }, [
    collapseMasterDetailRow,
    effectiveMasterDetailExpandedKeysSet,
    getDetailElementId,
    getToggleElementId,
    gridInstanceId,
    masterDetail,
    masterDetailEnabled,
    masterDetailRowKeysMeta?.duplicateKeys,
    resolvedDisabled,
    resolvedExpandColumnId,
    resolvedRowKey,
    toggleMasterDetailRow,
  ]);

  const rowHeightMetrics = React.useMemo(() => {
    const fallbackHeight = itemHeight + itemPadding * 2;
    if (!masterDetailEnabled || !masterDetail) {
      return createRowHeightMetrics(displayData, fallbackHeight, getRowHeight);
    }
    return createRowHeightMetrics(displayData, fallbackHeight, getRowHeight, {
      expandedKeysSet: effectiveMasterDetailExpandedKeysSet,
      getRowKey: values => {
        const key = getCellValueByRowKey(resolvedRowKey!, values);
        return key === undefined || key === null ? undefined : (key as React.Key);
      },
      getDetailHeight: (item, sourceIndex) => {
        if (typeof masterDetail.detailRowHeight === 'function') {
          try {
            return masterDetail.detailRowHeight(item, sourceIndex);
          } catch {
            return 200;
          }
        }
        return typeof masterDetail.detailRowHeight === 'number' && masterDetail.detailRowHeight > 0
          ? masterDetail.detailRowHeight
          : 200;
      },
      hasDetail: (item, sourceIndex) => {
        const rowKey = getCellValueByRowKey(resolvedRowKey!, item.values);
        if (rowKey === undefined || rowKey === null) return false;
        if (masterDetailRowKeysMeta?.duplicateKeys.has(rowKey as React.Key)) return false;
        if (masterDetail.hasDetail) {
          try {
            return masterDetail.hasDetail(item, sourceIndex);
          } catch {
            return false;
          }
        }
        return true;
      },
      sourceIndexByVisibleIndex: processedResult.sourceIndexByVisibleIndex,
    });
  }, [
    displayData,
    effectiveMasterDetailExpandedKeysSet,
    getRowHeight,
    itemHeight,
    itemPadding,
    masterDetail,
    masterDetailEnabled,
    masterDetailRowKeysMeta?.duplicateKeys,
    processedResult.sourceIndexByVisibleIndex,
    resolvedRowKey,
  ]);
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

  const resolvedSummaryHeight = React.useMemo(
    () =>
      computeSummaryHeight({
        summary: resolvedSummary,
        summaryHeight: explicitSummaryHeight,
        summaryRowHeight,
      }),
    [resolvedSummary, explicitSummaryHeight, summaryRowHeight],
  );

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
              (resolvedSummary ? resolvedSummaryHeight : 0) -
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
      summaryHeight: resolvedSummaryHeight,
      summaryRowHeight,
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
    resolvedSummaryHeight,
    summaryRowHeight,
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
      <TreeContext.Provider value={treeContextValue}>
        <MasterDetailContext.Provider value={masterDetailContextValue}>
          <Table
            ref={ref}
            {...{
              sourceColumns: resolvedColumns as BGridColumn<T>[],
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
              summaryHeight: resolvedSummaryHeight,
              summaryRowHeight,
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
              treeEnabled: !!treeContextValue,
            }}
          />
        </MasterDetailContext.Provider>
      </TreeContext.Provider>
    </AppStoreProvider>
  );
}
