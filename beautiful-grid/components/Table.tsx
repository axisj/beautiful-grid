import * as React from 'react';
import { Key, useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store';
import {
  BGridCellAddress,
  BGridCellMoveDirection,
  BGridCellNavigationOptions,
  BGridCellSelectionRange,
  BGridContextMenuItem,
  BGridContextMenuTarget,
  AppModelColumn,
  BGridColumnGroup,
  BGridColumnGroupNode,
  BGridDataControl,
  BGridDataItem,
  BGridDataItemStatus,
  BGridDataQuery,
  BGridPage,
  BGridProps,
  BGridRowChecked,
  BGridSortInfo,
  BGridSortParam,
  BGridResolvedScrollbarOptions,
  BGridResolvedStatusOptions,
  BGridResolvedPaginationViewOptions,
} from '../types';
import {
  getCellValueByRowKey,
  getFrozenColumnsWidth,
  getVisibleScrollableRowRange,
  isCheckboxValueChecked,
  markCellEdited,
  markCellValueChanged,
  resolveLogicalCell,
  shouldRenderBottomBar,
} from '../utils';
import { clamp, ensureCellVisible } from '../utils/coordinate';
import Loading from './Loading';
import TableBody from './TableBody';
import TableBodyFrozen from './TableBodyFrozen';
import TableFooter from './TableFooter';
import { useScrollbarMetrics, CustomScrollbar } from './scrollbar';
import TableHead from './TableHead';
import TableHeadFrozen from './TableHeadFrozen';
import { TableSummary } from './TableSummary';
import { TableSummaryFrozen } from './TableSummaryFronzen';
import { CellTextEditorGateway } from './CellTextEditorGateway';
import { EditorPortalContext, EditorPortalRoot } from './EditorPortalRoot';
import { useRowReorderController } from '../utils/useRowReorderController';
import { getCellSelectionFragments, normalizeCellSelectionRange } from '../utils/cellSelectionGeometry';
import { CellSelectionOverlay } from './selection';
import { CellNavigationDomSync } from './CellNavigationDomSync';

const DEFAULT_MAX_CLIPBOARD_CELLS = 100_000;
const DEFAULT_MAX_CLIPBOARD_TEXT_LENGTH = 8 * 1024 * 1024;
const KEYBOARD_NAVIGATION_ROW_WINDOW_SIZE = 8;
const DEFAULT_KEYBOARD_NAVIGATION_REPEAT_INTERVAL = 16;
const SCROLL_IDLE_DELAY = 120;

const LazyGridOptionalSurfaces = React.lazy(() =>
  import('./GridOptionalSurfaces').then(module => ({
    default: module.GridOptionalSurfaces,
  })),
);

interface Props<T> {
  width?: number;
  height?: number;
  headerHeight?: number;
  footerHeight?: number;
  bottomBarHeight?: number;
  scrollbar?: BGridResolvedScrollbarOptions;
  status?: BGridResolvedStatusOptions;
  pagination?: BGridResolvedPaginationViewOptions;
  summaryHeight?: number;
  itemHeight?: number;
  itemPadding?: number;
  frozenColumnIndex?: number;
  frozenRowCount?: number;

  columns: AppModelColumn<T>[];
  columnsGroup: BGridColumnGroup[];
  columnGroups: BGridColumnGroupNode[];
  onChangeColumns?: BGridProps<T>['onChangeColumns'];
  data?: BGridDataItem<T>[];
  onChangeData?: BGridProps<T>['onChangeData'];

  page?: BGridPage;
  onLoadMore?: BGridProps<T>['onLoadMore'];

  loading?: boolean;
  spinning?: boolean;
  scrollTop?: number;
  scrollLeft?: number;

  rowChecked?: BGridRowChecked<T>;
  checkedIndexesMap: Map<number, any>;
  sort?: BGridSortInfo;
  sortParams?: Record<string, BGridSortParam>;
  dataQuery?: BGridDataQuery;
  dataControl?: BGridDataControl;
  icons?: BGridProps<T>['icons'];
  searchOptions?: BGridProps<T>['searchOptions'];
  contextMenuOptions?: BGridProps<T>['contextMenuOptions'];
  sourceData?: BGridDataItem<T>[];
  sourceIndexByVisibleIndex?: number[];
  visibleIndexBySourceIndex?: Map<number, number>;
  onClick?: BGridProps<T>['onClick'];

  msg?: BGridProps<T>['msg'];

  rowKey?: Key | Key[];
  selectedRowKey?: Key | Key[];
  editable?: boolean;
  editTrigger: BGridProps<T>['editTrigger'];
  showLineNumber?: boolean;

  getRowClassName?: BGridProps<T>['getRowClassName'];
  cellMergeOptions?: BGridProps<T>['cellMergeOptions'];
  cellSelectionOptions?: BGridProps<T>['cellSelectionOptions'];
  cellNavigationOptions?: BGridCellNavigationOptions;
  variant?: BGridProps<T>['variant'];
  summary?: BGridProps<T>['summary'];
  columnSortable?: BGridProps<T>['columnSortable'];
  reorder?: BGridProps<T>['reorder'];
  className?: BGridProps<T>['className'];
  style?: BGridProps<T>['style'];
}

function Table<T>(props: Props<T>) {
  const { cellSelectionOptions, onChangeData, sourceIndexByVisibleIndex } = props;
  const cellSelectionEnabled = cellSelectionOptions?.enabled ?? true;

  // [Selector Group 1] Layout & Dimensions - 레이아웃 차원
  const { width, height, containerBorderWidth, className, style, itemHeight, itemPadding } = useAppStore(
    useShallow(s => ({
      width: s.width,
      height: s.height,
      containerBorderWidth: s.containerBorderWidth,
      className: s.className,
      style: s.style,
      itemHeight: s.itemHeight,
      itemPadding: s.itemPadding,
    })),
  );

  // [Selector Group 2] Header, Footer, Summary - 헤더/푸터/요약
  const { headerHeight, footerHeight, bottomBarHeight, summaryHeight } = useAppStore(
    useShallow(s => ({
      headerHeight: s.headerHeight,
      footerHeight: s.footerHeight,
      bottomBarHeight: s.bottomBarHeight,
      summaryHeight: s.summaryHeight,
    })),
  );

  // [Selector Group 3] Scroll State - 스크롤 상태
  const { scrollLeft, scrollTop } = useAppStore(
    useShallow(s => ({
      scrollLeft: s.scrollLeft,
      scrollTop: s.scrollTop,
    })),
  );

  // [Selector Group 4] Content, Columns, Data - 컨텐츠 관련
  const { contentBodyHeight, columns, data, frozenColumnsWidth, frozenRowCount, frozenRowsHeight } = useAppStore(
    useShallow(s => ({
      contentBodyHeight: s.contentBodyHeight,
      columns: s.columns,
      data: s.data,
      frozenColumnsWidth: s.frozenColumnsWidth,
      frozenRowCount: s.frozenRowCount,
      frozenRowsHeight: s.frozenRowsHeight,
    })),
  );

  // [Selector Group 4-1] Cell selection & navigation - 셀 선택 및 내비게이션
  const {
    cellSelectionRange,
    cellSelectionRanges,
    activeCell,
    activeCellHost,
    cellNavigationOptions,
    editItemIndex,
    editable,
    handleClick,
  } = useAppStore(
    useShallow(s => ({
      cellSelectionRange: s.cellSelectionRange,
      cellSelectionRanges: s.cellSelectionRanges,
      activeCell: s.activeCell,
      activeCellHost: s.activeCellHost,
      cellNavigationOptions: s.cellNavigationOptions,
      editItemIndex: s.editItemIndex,
      editable: s.editable,
      handleClick: s.handleClick,
    })),
  );

  // [Selector Group 5] State - 상태
  const { rowChecked, page, loading, spinning, showLineNumber, summary, scrollbar, status, pagination } = useAppStore(
    useShallow(s => ({
      rowChecked: s.rowChecked,
      page: s.page,
      loading: s.loading,
      spinning: s.spinning,
      showLineNumber: s.showLineNumber,
      summary: s.summary,
      scrollbar: s.scrollbar,
      status: s.status,
      pagination: s.pagination,
    })),
  );

  const {
    searchOpen,
    searchOptions,
    contextMenuOptions,
    activeSearchMatchIndex,
    searchMatches,
    storeSourceIndexByVisibleIndex,
    storeRowKey,
    cellInteractionSession,
  } = useAppStore(
    useShallow(s => ({
      searchOpen: s.searchOpen,
      searchOptions: s.searchOptions,
      contextMenuOptions: s.contextMenuOptions,
      activeSearchMatchIndex: s.activeSearchMatchIndex,
      searchMatches: s.searchMatches,
      storeSourceIndexByVisibleIndex: s.sourceIndexByVisibleIndex,
      storeRowKey: s.rowKey,
      cellInteractionSession: s.cellInteractionSession,
    })),
  );

  // [Selector Group 6] State Setters - 차원 설정자
  const {
    setHeight,
    setWidth,
    setContentBodyHeight,
    setDisplayItemCount,
    setHeaderHeight,
    setFooterHeight,
    setBottomBarHeight,
    setSummaryHeight,
    setItemHeight,
    setItemPadding,
    setLoading,
    setSpinning,
  } = useAppStore(
    useShallow(s => ({
      setHeight: s.setHeight,
      setWidth: s.setWidth,
      setContentBodyHeight: s.setContentBodyHeight,
      setDisplayItemCount: s.setDisplayItemCount,
      setHeaderHeight: s.setHeaderHeight,
      setFooterHeight: s.setFooterHeight,
      setBottomBarHeight: s.setBottomBarHeight,
      setSummaryHeight: s.setSummaryHeight,
      setItemHeight: s.setItemHeight,
      setItemPadding: s.setItemPadding,
      setLoading: s.setLoading,
      setSpinning: s.setSpinning,
    })),
  );

  // [Selector Group 7] Data & Column Setters - 데이터/열 설정자
  const {
    setData,
    setSourceData,
    setProcessedData,
    setColumns,
    setColumnsGroup,
    setColumnGroups,
    setFrozenColumnsWidth,
    setFrozenColumnIndex,
    setFrozenRowCount,
    setFrozenRowsHeight,
  } = useAppStore(
    useShallow(s => ({
      setData: s.setData,
      setSourceData: s.setSourceData,
      setProcessedData: s.setProcessedData,
      setColumns: s.setColumns,
      setColumnsGroup: s.setColumnsGroup,
      setColumnGroups: s.setColumnGroups,
      setFrozenColumnsWidth: s.setFrozenColumnsWidth,
      setFrozenColumnIndex: s.setFrozenColumnIndex,
      setFrozenRowCount: s.setFrozenRowCount,
      setFrozenRowsHeight: s.setFrozenRowsHeight,
    })),
  );

  // [Selector Group 8] Row & Sort Setters - 행/정렬 설정자
  const {
    setRowChecked,
    setCheckedIndexesMap,
    setSort,
    setSortParams,
    setDataQuery,
    setDataControl,
    setIcons,
    setActiveToolbox,
    setRowKey,
    setFocusedRowKey,
    setEditItem,
    setSearchOptions,
    setContextMenuOptions,
    requestSearchOpen,
    openContextMenu,
    commitCheckboxCell,
  } = useAppStore(
    useShallow(s => ({
      setRowChecked: s.setRowChecked,
      setCheckedIndexesMap: s.setCheckedIndexesMap,
      setSort: s.setSort,
      setSortParams: s.setSortParams,
      setDataQuery: s.setDataQuery,
      setDataControl: s.setDataControl,
      setIcons: s.setIcons,
      setActiveToolbox: s.setActiveToolbox,
      setRowKey: s.setRowKey,
      setFocusedRowKey: s.setSelectedRowKey,
      setEditItem: s.setEditItem,
      setSearchOptions: s.setSearchOptions,
      setContextMenuOptions: s.setContextMenuOptions,
      requestSearchOpen: s.requestSearchOpen,
      openContextMenu: s.openContextMenu,
      commitCheckboxCell: s.commitCheckboxCell,
    })),
  );

  // [Selector Group 9] Pagination & Display Setters - 페이지/표시 설정자
  const {
    setPage,
    setDisplayPaginationLength,
    setShowLineNumber,
    setMsg,
    setRowClassName,
    setCellMergeOptions,
    setVariant,
    setSummary,
    setColumnSortable,
    setReorder,
    setClassName,
    setStyle,
    setScrollbar,
    setStatus,
    setPagination,
  } = useAppStore(
    useShallow(s => ({
      setPage: s.setPage,
      setDisplayPaginationLength: s.setDisplayPaginationLength,
      setShowLineNumber: s.setShowLineNumber,
      setMsg: s.setMsg,
      setRowClassName: s.setRowClassName,
      setCellMergeOptions: s.setCellMergeOptions,
      setVariant: s.setVariant,
      setSummary: s.setSummary,
      setColumnSortable: s.setColumnSortable,
      setReorder: s.setReorder,
      setClassName: s.setClassName,
      setStyle: s.setStyle,
      setScrollbar: s.setScrollbar,
      setStatus: s.setStatus,
      setPagination: s.setPagination,
    })),
  );

  // [Selector Group 10] Edit & Event Setters - 편집/이벤트 설정자
  const {
    setEditable,
    setEditTrigger,
    setOnClick,
    setOnChangeColumns,
    setOnChangeData,
    setOnLoadMore,
    setScroll,
    setInitialized,
  } = useAppStore(
    useShallow(s => ({
      setEditable: s.setEditable,
      setEditTrigger: s.setEditTrigger,
      setOnClick: s.setOnClick,
      setOnChangeColumns: s.setOnChangeColumns,
      setOnChangeData: s.setOnChangeData,
      setOnLoadMore: s.setOnLoadMore,
      setScroll: s.setScroll,
      setInitialized: s.setInitialized,
    })),
  );

  const {
    setCellSelectionRanges,
    setCellSelecting,
    clearCellSelection,
    setActiveCell,
    moveActiveCell,
    setCellNavigationOptions,
    syncActiveCellToBounds,
  } = useAppStore(
    useShallow(s => ({
      setCellSelectionRanges: s.setCellSelectionRanges,
      setCellSelecting: s.setCellSelecting,
      clearCellSelection: s.clearCellSelection,
      setActiveCell: s.setActiveCell,
      moveActiveCell: s.moveActiveCell,
      setCellNavigationOptions: s.setCellNavigationOptions,
      syncActiveCellToBounds: s.syncActiveCellToBounds,
    })),
  );

  const trHeight = itemHeight + itemPadding * 2;
  const scrollableBodyHeight = Math.max(contentBodyHeight - frozenRowsHeight, 0);
  const mainViewportWidth = Math.max(width - (frozenColumnsWidth ?? 0), 0);
  const hasMultiCellSelection = React.useMemo(
    () =>
      cellSelectionRanges.length > 1 ||
      cellSelectionRanges.some(range => {
        const normalized = normalizeCellSelectionRange(range);
        return (
          normalized.startRowIndex !== normalized.endRowIndex ||
          normalized.startColumnIndex !== normalized.endColumnIndex
        );
      }),
    [cellSelectionRanges],
  );
  const activeLogicalCell = React.useMemo(
    () => (activeCell ? resolveLogicalCell(data, props.cellMergeOptions, activeCell) : undefined),
    [activeCell, data, props.cellMergeOptions],
  );
  const activeCellSelected = React.useMemo(() => {
    if (!activeLogicalCell) return false;
    return cellSelectionRanges.some(range => {
      const normalized = normalizeCellSelectionRange(range);
      return (
        activeLogicalCell.cell.rowIndex >= normalized.startRowIndex &&
        activeLogicalCell.cell.rowIndex <= normalized.endRowIndex &&
        activeLogicalCell.cell.columnIndex >= normalized.startColumnIndex &&
        activeLogicalCell.cell.columnIndex <= normalized.endColumnIndex
      );
    });
  }, [activeLogicalCell, cellSelectionRanges]);
  const activeCellRanges = React.useMemo<BGridCellSelectionRange[]>(
    () => {
      if (!activeLogicalCell) return [];

      let startRowIndex = activeLogicalCell.rowRange.startRowIndex;
      let endRowIndex = activeLogicalCell.rowRange.endRowIndex;
      const hostCell = cellInteractionSession?.hostCell ?? activeCellHost;

      // A merged cell crossing the frozen-row boundary is rendered as two
      // physical cells. During editing, draw focus only around the fragment
      // that owns the editor while keeping the logical edit scope unchanged.
      if (
        hostCell &&
        activeLogicalCell.rowRange.startRowIndex < frozenRowCount &&
        activeLogicalCell.rowRange.endRowIndex >= frozenRowCount
      ) {
        if (hostCell.rowIndex < frozenRowCount) {
          endRowIndex = frozenRowCount - 1;
        } else {
          startRowIndex = frozenRowCount;
        }
      }

      return [
        {
          startRowIndex,
          endRowIndex,
          startColumnIndex: activeLogicalCell.cell.columnIndex,
          endColumnIndex: activeLogicalCell.cell.columnIndex,
        },
      ];
    },
    [activeCellHost, activeLogicalCell, cellInteractionSession?.hostCell, frozenRowCount],
  );
  const selectionFragments = React.useMemo(
    () =>
      getCellSelectionFragments({
        ranges: cellSelectionRanges,
        columns,
        rowCount: data.length,
        rowHeight: trHeight,
        frozenColumnCount: props.frozenColumnIndex ?? 0,
        frozenRowCount,
        frozenColumnsWidth: frozenColumnsWidth ?? 0,
      }),
    [
      cellSelectionRanges,
      columns,
      data.length,
      frozenColumnsWidth,
      frozenRowCount,
      props.frozenColumnIndex,
      trHeight,
    ],
  );
  const activeFragments = React.useMemo(
    () =>
      getCellSelectionFragments({
        ranges: activeCellRanges,
        columns,
        rowCount: data.length,
        rowHeight: trHeight,
        frozenColumnCount: props.frozenColumnIndex ?? 0,
        frozenRowCount,
        frozenColumnsWidth: frozenColumnsWidth ?? 0,
      }),
    [
      activeCellRanges,
      columns,
      data.length,
      frozenColumnsWidth,
      frozenRowCount,
      props.frozenColumnIndex,
      trHeight,
    ],
  );
  const activeOverlayFill = activeCellSelected;
  const activeOverlayRing = !!activeCell && !hasMultiCellSelection;
  const renderSelectionOverlay = (quadrant: React.ComponentProps<typeof CellSelectionOverlay>['quadrant']) => {
    const topQuadrant = quadrant === 'top-left' || quadrant === 'top-main';
    const leftQuadrant = quadrant === 'top-left' || quadrant === 'body-left';
    return (
      <CellSelectionOverlay
        quadrant={quadrant}
        selectionFragments={selectionFragments}
        activeFragments={activeFragments}
        activeFill={activeOverlayFill}
        activeRing={activeOverlayRing}
        viewport={{
          left: leftQuadrant ? 0 : scrollLeft,
          top: topQuadrant ? 0 : scrollTop,
          width: leftQuadrant ? frozenColumnsWidth ?? 0 : mainViewportWidth,
          height: topQuadrant ? frozenRowsHeight : scrollableBodyHeight,
        }}
      />
    );
  };
  const visibleScrollableRows = React.useMemo(
    () =>
      getVisibleScrollableRowRange({
        scrollTop,
        viewportHeight: scrollableBodyHeight,
        rowHeight: trHeight,
        frozenRowCount,
        totalRowCount: data.length,
        windowSize: props.reorder?.enabled ? 1 : KEYBOARD_NAVIGATION_ROW_WINDOW_SIZE,
      }),
    [data.length, frozenRowCount, props.reorder?.enabled, scrollTop, scrollableBodyHeight, trHeight],
  );
  const frozenRowRange = React.useMemo(
    () => ({ startRowIndex: 0, endRowIndex: frozenRowCount }),
    [frozenRowCount],
  );
  const scrollableRowRange = React.useMemo(
    () => ({
      startRowIndex: visibleScrollableRows.startRowIndex,
      endRowIndex: visibleScrollableRows.endRowIndex,
    }),
    [visibleScrollableRows.endRowIndex, visibleScrollableRows.startRowIndex],
  );
  const frozenScrollableBodyStyle = React.useMemo<React.CSSProperties>(
    () => ({ top: visibleScrollableRows.paddingTop }),
    [visibleScrollableRows.paddingTop],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const searchPopoverRef = useRef<HTMLDivElement>(null);
  const warnedContextMenuIdsRef = useRef(new Set<string>());
  const warnedContextMenuFactoryRef = useRef(false);
  const editorPortalRef = useRef<HTMLDivElement>(null);
  const editorPortalContext = React.useMemo(
    () => ({ gridRef: containerRef, portalRef: editorPortalRef }),
    [],
  );
  const bodyContainerRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const rowReorderController = useRowReorderController<T>({
    containerRef,
    bodyContainerRef,
    scrollContainerRef,
    rowHeight: trHeight,
  });
  const searchSurfaceEnabled = !!searchOptions && searchOptions.enabled !== false;
  const contextMenuSurfaceEnabled =
    (!!contextMenuOptions && contextMenuOptions.enabled !== false) ||
    (searchSurfaceEnabled && searchOptions.contextMenu !== false);
  const openCellContextMenu = React.useCallback(
    (cell: BGridCellAddress, clientX: number, clientY: number, keyboard: boolean) => {
      const logical = resolveLogicalCell(data, props.cellMergeOptions, cell);
      const visibleIndex = logical.cell.rowIndex;
      const columnIndex = logical.cell.columnIndex;
      const item = data[visibleIndex];
      const column = columns[columnIndex];
      if (!item || !column) return false;

      if (!keyboard) {
        const navigationEnabled = cellNavigationOptions?.enabled ?? true;
        containerRef.current?.focus({ preventScroll: true });
        if (navigationEnabled || cellSelectionEnabled) {
          setActiveCell(logical.cell, cell);
        }
        if (cellSelectionEnabled) {
          setCellSelectionRanges([
            {
              startRowIndex: logical.cell.rowIndex,
              startColumnIndex: logical.cell.columnIndex,
              endRowIndex: logical.rowIndexes[logical.rowIndexes.length - 1] ?? logical.cell.rowIndex,
              endColumnIndex: logical.cell.columnIndex,
            },
          ]);
        }
      }

      const sourceIndex = storeSourceIndexByVisibleIndex[visibleIndex] ?? visibleIndex;
      const target: BGridContextMenuTarget<T> = {
        cell: logical.cell,
        visibleIndex,
        sourceIndex,
        rowKey: storeRowKey ? getCellValueByRowKey(storeRowKey, item.values) : undefined,
        columnIndex,
        columnId: column.columnId,
        column,
        item,
        values: item.values,
        value: getCellValueByRowKey(column.key, item.values),
      };

      const customItemsEnabled = !!contextMenuOptions && contextMenuOptions.enabled !== false;
      let customItems: readonly BGridContextMenuItem<T>[] = [];
      if (customItemsEnabled && contextMenuOptions?.items) {
        try {
          customItems = contextMenuOptions.items(target);
        } catch (error) {
          if (process.env.NODE_ENV !== 'production' && !warnedContextMenuFactoryRef.current) {
            warnedContextMenuFactoryRef.current = true;
            console.warn('[BGrid] contextMenuOptions.items failed. Built-in items remain available.', error);
          }
        }
      }

      const builtInSearchEnabled = !!searchOptions && searchOptions.enabled !== false && searchOptions.contextMenu !== false;
      const combined: BGridContextMenuItem<T>[] = [];
      if (builtInSearchEnabled) {
        combined.push({
          id: 'bgrid-search',
          label: searchOptions.labels?.contextMenuItem ?? '검색',
          icon: searchOptions.icons?.search,
          shortcut: 'Ctrl/⌘ F',
          onSelect: () => requestSearchOpen(true, 'contextMenu'),
        });
      }
      if (builtInSearchEnabled && customItems.length > 0) {
        combined.push({ type: 'separator', id: 'bgrid-search-separator' });
      }
      combined.push(...customItems);

      const normalized = normalizeContextMenuItems(combined, duplicateId => {
        if (process.env.NODE_ENV === 'production' || warnedContextMenuIdsRef.current.has(duplicateId)) return;
        warnedContextMenuIdsRef.current.add(duplicateId);
        console.warn(`[BGrid] Duplicate context menu item id "${duplicateId}" was ignored.`);
      });
      if (!normalized.some(menuItem => menuItem.type !== 'separator' && !menuItem.disabled)) return false;

      openContextMenu({ target, items: normalized, clientX, clientY, keyboard });
      return true;
    },
    [
      cellNavigationOptions?.enabled,
      cellSelectionEnabled,
      columns,
      contextMenuOptions,
      data,
      openContextMenu,
      props.cellMergeOptions,
      requestSearchOpen,
      searchOptions,
      setActiveCell,
      setCellSelectionRanges,
      storeRowKey,
      storeSourceIndexByVisibleIndex,
    ],
  );
  const scrollableColumnsWidth = React.useMemo(
    () =>
      columns
        .slice(props.frozenColumnIndex ?? 0)
        .reduce((totalWidth, column) => totalWidth + (column.width ?? 100), 0),
    [columns, props.frozenColumnIndex],
  );

  const stickyTopHeight = headerHeight + (summary?.position === 'top' ? summaryHeight : 0);
  const stickyBottomHeight = summary?.position === 'bottom' ? summaryHeight : 0;
  const stickyFixedHeight = stickyTopHeight + stickyBottomHeight;
  const scrollViewportHeight = contentBodyHeight + stickyFixedHeight;
  const scrollPlaneHeight = stickyFixedHeight + frozenRowsHeight + visibleScrollableRows.scrollContentHeight;
  const scrollPlaneContentWidth = (frozenColumnsWidth ?? 0) + scrollableColumnsWidth;
  const scrollPlaneWidth = Math.max(width, scrollPlaneContentWidth);
  const customVerticalScrollbarGutter =
    scrollbar.vertical.visible && scrollbar.variant === 'classic'
      ? 'var(--bgrid-scrollbar-classic-gutter-size)'
      : scrollbar.vertical.visible && scrollbar.variant === 'modern'
        ? 'var(--bgrid-scrollbar-modern-gutter-size)'
        : undefined;
  const scrollPlaneMinWidth: React.CSSProperties['minWidth'] = customVerticalScrollbarGutter
    ? `max(100%, calc(${scrollPlaneContentWidth}px + ${customVerticalScrollbarGutter}))`
    : scrollPlaneWidth;

  const scrollbarMetrics = useScrollbarMetrics(
    scrollContainerRef,
    [data.length, itemHeight, itemPadding, contentBodyHeight, width],
    scrollPlaneContentWidth,
    stickyFixedHeight,
  );
  const measuredVerticalScrollbarGutter =
    customVerticalScrollbarGutter && scrollbarMetrics.horizontal.hasOverflow
      ? Math.max(scrollbarMetrics.horizontal.contentSize - scrollPlaneContentWidth, 0)
      : 0;
  const keyboardViewportInsets = {
    right: (frozenColumnsWidth ?? 0) + measuredVerticalScrollbarGutter,
    bottom: stickyFixedHeight + frozenRowsHeight,
  };

  const showBottomBar = shouldRenderBottomBar({
    hasPage: !!page,
    hasHorizontalOverflow: scrollbarMetrics.horizontal.hasOverflow,
    scrollbar,
    status,
    pagination,
  });

  const handleScrollLeftChange = useCallback((offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollLeft = offset;
    }
  }, []);

  const handleScrollTopChange = useCallback((offset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = offset;
    }
  }, []);

  const latestScrollRef = useRef({ top: scrollTop, left: scrollLeft });
  const latestCommittedScrollRef = useRef({ top: scrollTop, left: scrollLeft });
  const scrollRafRef = useRef<number | null>(null);
  const scrollIdleTimerRef = useRef<number | null>(null);
  const selectionAutoScrollRafRef = useRef<number | null>(null);
  const latestPointerRef = useRef<{ clientX: number; clientY: number } | null>(null);
  const hoveredRowIndexesRef = useRef<number[]>([]);
  const cellSelectionDragRef = useRef<CellSelectionDragState | null>(null);
  const axisSelectionDragRef = useRef<AxisSelectionDragState | null>(null);
  const selectionMetricsRef = useRef({
    columns,
    dataLength: data.length,
    frozenColumnIndex: props.frozenColumnIndex ?? 0,
    frozenRowCount,
    frozenColumnsWidth: frozenColumnsWidth ?? 0,
    frozenRowsHeight,
    trHeight,
  });

  useEffect(() => {
    selectionMetricsRef.current = {
      columns,
      dataLength: data.length,
      frozenColumnIndex: props.frozenColumnIndex ?? 0,
      frozenRowCount,
      frozenColumnsWidth: frozenColumnsWidth ?? 0,
      frozenRowsHeight,
      trHeight,
    };
  }, [columns, data.length, props.frozenColumnIndex, frozenColumnsWidth, frozenRowCount, frozenRowsHeight, trHeight]);

  const markScrollActive = useCallback(() => {
    containerRef.current?.setAttribute('data-bgrid-scrolling', 'true');
    if (scrollIdleTimerRef.current !== null) window.clearTimeout(scrollIdleTimerRef.current);
    scrollIdleTimerRef.current = window.setTimeout(() => {
      scrollIdleTimerRef.current = null;
      containerRef.current?.removeAttribute('data-bgrid-scrolling');
    }, SCROLL_IDLE_DELAY);
  }, []);

  const scheduleScrollFrame = useCallback(() => {
    if (scrollRafRef.current !== null) return;

    const pollNativeScrollPosition = () => {
      scrollRafRef.current = null;
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      const { scrollTop, scrollLeft } = scrollContainer;
      latestScrollRef.current = { top: scrollTop, left: scrollLeft };

      const { top: committedTop, left: committedLeft } = latestCommittedScrollRef.current;
      if (committedTop !== scrollTop || committedLeft !== scrollLeft) {
        latestCommittedScrollRef.current = { top: scrollTop, left: scrollLeft };
        setScroll(scrollTop, scrollLeft);
      }

      if (containerRef.current?.hasAttribute('data-bgrid-scrolling')) {
        scrollRafRef.current = requestAnimationFrame(pollNativeScrollPosition);
      }
    };

    scrollRafRef.current = requestAnimationFrame(pollNativeScrollPosition);
  }, [setScroll]);

  const onScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollLeft } = scrollContainerRef.current;
      latestScrollRef.current = { top: scrollTop, left: scrollLeft };
      markScrollActive();
      scheduleScrollFrame();
    }
  }, [markScrollActive, scheduleScrollFrame]);

  const onWheel: (this: HTMLDivElement, ev: HTMLElementEventMap['wheel']) => any = useCallback(evt => {
    const scrollContainer = scrollContainerRef.current;
    if (!scrollContainer) return;

    const delta = { x: 0, y: 0 };

    if ((evt as any).detail) {
      delta.y = (evt as any).detail * 10;
    } else if (typeof evt.deltaY === 'undefined') {
      delta.y = -(evt as any).wheelDelta;
      delta.x = 0;
    } else {
      delta.y = evt.deltaY;
      delta.x = evt.deltaX;
    }

    if (evt.deltaMode === 1) {
      delta.y = delta.y * 16;
      delta.x = delta.x * 16;
    } else if (evt.deltaMode === 2) {
      delta.y = delta.y * scrollContainer.clientHeight;
      delta.x = delta.x * scrollContainer.clientWidth;
    }

    const maxScrollTop = Math.max(scrollContainer.scrollHeight - scrollContainer.clientHeight, 0);
    const maxScrollLeft = Math.max(scrollContainer.scrollWidth - scrollContainer.clientWidth, 0);

    const nextScrollTop = Math.min(maxScrollTop, Math.max(0, scrollContainer.scrollTop + delta.y));
    const nextScrollLeft = Math.min(maxScrollLeft, Math.max(0, scrollContainer.scrollLeft + delta.x));

    const didScrollTop = nextScrollTop !== scrollContainer.scrollTop;
    const didScrollLeft = nextScrollLeft !== scrollContainer.scrollLeft;

    if (!didScrollTop && !didScrollLeft) {
      return;
    }

    evt.preventDefault();
    if (didScrollTop) scrollContainer.scrollTop = nextScrollTop;
    if (didScrollLeft) scrollContainer.scrollLeft = nextScrollLeft;
  }, []);

  const resetScrollPosition = useCallback((type: 'all' | 'top' | 'left') => {
    if (type === 'all' || type === 'left') scrollContainerRef.current?.scrollTo({ left: 0 });
    if (type === 'all' || type === 'top') scrollContainerRef.current?.scrollTo({ top: 0 });
  }, []);

  const commitScroll = useCallback(
    (top: number, left: number) => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) return;

      if (scrollContainer.scrollTop !== top) scrollContainer.scrollTop = top;
      if (scrollContainer.scrollLeft !== left) scrollContainer.scrollLeft = left;
      latestScrollRef.current = { top, left };
      latestCommittedScrollRef.current = { top, left };
      setScroll(top, left);
    },
    [setScroll],
  );

  useEffect(() => {
    if (!searchOpen || activeSearchMatchIndex === undefined) return;
    const match = searchMatches[activeSearchMatchIndex];
    const scrollContainer = scrollContainerRef.current;
    if (!match || !scrollContainer) return;

    const scrollRect = scrollContainer.getBoundingClientRect();
    const searchRect = searchPopoverRef.current?.getBoundingClientRect();
    const viewportInsets = searchRect
      ? {
          top: Math.max(0, Math.min(scrollContainer.clientHeight, searchRect.bottom - scrollRect.top + 8)),
          right: Math.max(0, Math.min(scrollContainer.clientWidth, scrollRect.right - searchRect.left + 8)),
          bottom: Math.max(
            0,
            Math.min(scrollContainer.clientHeight, stickyFixedHeight + frozenRowsHeight),
          ),
        }
      : undefined;
    const result = ensureCellVisible({
      cell: match.cell,
      scrollContainer,
      frozenColumnCount: props.frozenColumnIndex ?? 0,
      frozenRowCount,
      columns,
      rowHeight: trHeight,
      viewportInsets,
    });
    if (result.didScroll) commitScroll(result.scrollTop, result.scrollLeft);
  }, [
    activeSearchMatchIndex,
    columns,
    commitScroll,
    frozenRowCount,
    props.frozenColumnIndex,
    searchMatches,
    searchOpen,
    stickyFixedHeight,
    frozenRowsHeight,
    trHeight,
  ]);

  const clearHoveredRow = useCallback(() => {
    if (!containerRef.current || hoveredRowIndexesRef.current.length === 0) return;

    hoveredRowIndexesRef.current.forEach(hoveredIndex => {
      containerRef.current?.querySelectorAll(`tr[data-ri="${hoveredIndex}"]`).forEach(el => {
        el.classList.remove('bgrid-row-hover');
      });
    });
    hoveredRowIndexesRef.current = [];
  }, []);

  const setHoveredRows = useCallback(
    (rowIndexes: number[]) => {
      if (!containerRef.current) return;

      const prev = hoveredRowIndexesRef.current;
      if (prev.length === rowIndexes.length && prev.every((value, index) => value === rowIndexes[index])) {
        return;
      }

      clearHoveredRow();

      rowIndexes.forEach(rowIndex => {
        containerRef.current?.querySelectorAll(`tr[data-ri="${rowIndex}"]`).forEach(el => {
          el.classList.add('bgrid-row-hover');
        });
      });
      hoveredRowIndexesRef.current = rowIndexes;
    },
    [clearHoveredRow],
  );

  const toLogicalCellPosition = useCallback(
    (cellPosition: CellPosition): CellPosition => {
      const logicalCell = resolveLogicalCell(data, props.cellMergeOptions, cellPosition);
      return {
        ...logicalCell.cell,
        rowSpan: logicalCell.rowIndexes.length,
      };
    },
    [data, props.cellMergeOptions],
  );

  const updateAxisSelectionByTarget = useCallback(
    (target: HTMLElement | null) => {
      const dragState = axisSelectionDragRef.current;
      if (!dragState) return false;

      const axisTarget = getAxisSelectionTarget(target, containerRef.current);
      if (!axisTarget || axisTarget.axis !== dragState.axis) return false;

      setCellSelectionRanges(
        updateAxisSelectionDragRange(
          dragState,
          getAxisSelectionRange({
            axis: dragState.axis,
            startIndex: dragState.startIndex,
            endIndex:
              axisTarget.startIndex < dragState.startIndex ? axisTarget.startIndex : axisTarget.endIndex,
            rowCount: data.length,
            columnCount: columns.length,
          }),
        ),
      );
      return true;
    },
    [columns.length, data.length, setCellSelectionRanges],
  );

  const onBodyPointerOverCapture = useCallback(
    (evt: React.PointerEvent<HTMLDivElement>) => {
      const target = evt.target as HTMLElement | null;
      updateAxisSelectionByTarget(target);
      const physicalCellPosition = getCellPosition(target, containerRef.current);
      const cellPosition = physicalCellPosition ? toLogicalCellPosition(physicalCellPosition) : undefined;
      if (cellSelectionEnabled && cellSelectionDragRef.current && cellPosition) {
        setCellSelectionRanges(
          updateSelectionDragRange(
            cellSelectionDragRef.current,
            getRangeFromDrag(cellSelectionDragRef.current, cellPosition),
          ),
        );
      }

      const tr = target?.closest('tr[data-ri]');
      if (!tr || !containerRef.current?.contains(tr)) {
        clearHoveredRow();
        return;
      }

      const rowIndex = Number(tr.getAttribute('data-ri'));
      if (Number.isNaN(rowIndex)) {
        clearHoveredRow();
        return;
      }

      const rowIndexes = cellPosition
        ? Array.from({ length: cellPosition.rowSpan }, (_, index) => cellPosition.rowIndex + index)
        : [rowIndex];

      setHoveredRows(rowIndexes);
    },
    [
      cellSelectionEnabled,
      clearHoveredRow,
      setCellSelectionRanges,
      setHoveredRows,
      toLogicalCellPosition,
      updateAxisSelectionByTarget,
    ],
  );

  const onBodyPointerDownCapture = useCallback(
    (evt: React.PointerEvent<HTMLDivElement>) => {
      const navEnabled = cellNavigationOptions?.enabled ?? true;
      if (!cellSelectionEnabled && !navEnabled) return;
      if (evt.button !== 0 || isInteractiveTarget(evt.target)) return;

      const axisTarget = cellSelectionEnabled
        ? getAxisSelectionTarget(evt.target as HTMLElement | null, containerRef.current)
        : undefined;
      if (axisTarget && data.length > 0 && columns.length > 0) {
        evt.preventDefault();
        containerRef.current?.focus({ preventScroll: true });

        const isAdditiveSelection = evt.metaKey || evt.ctrlKey;
        const isRangeExtension = evt.shiftKey && (cellSelectionRange || activeCell);
        const activeRangeStart =
          axisTarget.axis === 'row'
            ? cellSelectionRange?.startRowIndex ?? activeCell?.rowIndex
            : cellSelectionRange?.startColumnIndex ?? activeCell?.columnIndex;
        const startIndex = isRangeExtension ? activeRangeStart ?? axisTarget.startIndex : axisTarget.startIndex;
        const endIndex = axisTarget.startIndex < startIndex ? axisTarget.startIndex : axisTarget.endIndex;
        const baseRanges = isAdditiveSelection
          ? cellSelectionRanges
          : isRangeExtension
          ? cellSelectionRanges.slice(0, -1)
          : [];
        const activeRange = getAxisSelectionRange({
          axis: axisTarget.axis,
          startIndex,
          endIndex,
          rowCount: data.length,
          columnCount: columns.length,
        });

        cellSelectionDragRef.current = null;
        axisSelectionDragRef.current = {
          axis: axisTarget.axis,
          startIndex,
          baseRanges,
          activeRangeIndex: baseRanges.length,
        };
        setActiveCell(
          axisTarget.axis === 'row'
            ? { rowIndex: axisTarget.startIndex, columnIndex: 0 }
            : { rowIndex: 0, columnIndex: axisTarget.startIndex },
        );
        setCellSelecting(true);
        setCellSelectionRanges([...baseRanges, activeRange]);
        return;
      }

      const physicalCellPosition = getCellPosition(evt.target as HTMLElement | null, containerRef.current);
      if (!physicalCellPosition) {
        return;
      }
      const cellPosition = toLogicalCellPosition(physicalCellPosition);

      evt.preventDefault();
      containerRef.current?.focus({ preventScroll: true });

      const clickedCell: BGridCellAddress = {
        rowIndex: cellPosition.rowIndex,
        columnIndex: cellPosition.columnIndex,
      };
      setActiveCell(clickedCell, {
        rowIndex: physicalCellPosition.rowIndex,
        columnIndex: physicalCellPosition.columnIndex,
      });

      if (cellSelectionEnabled) {
        const isAdditiveSelection = evt.metaKey || evt.ctrlKey;
        const isRangeExtension = evt.shiftKey && (cellSelectionRange || activeCell);
        const startRowIndex = isRangeExtension
          ? cellSelectionRange?.startRowIndex ?? activeCell?.rowIndex ?? cellPosition.rowIndex
          : cellPosition.rowIndex;
        const startColumnIndex = isRangeExtension
          ? cellSelectionRange?.startColumnIndex ?? activeCell?.columnIndex ?? cellPosition.columnIndex
          : cellPosition.columnIndex;
        const startRowSpan = isRangeExtension
          ? Math.abs(cellPosition.rowIndex - startRowIndex) + 1
          : cellPosition.rowSpan;
        const activeRange: BGridCellSelectionRange = {
          startRowIndex,
          startColumnIndex,
          endRowIndex: getSelectionEndRowIndex(startRowIndex, cellPosition),
          endColumnIndex: cellPosition.columnIndex,
        };
        const baseRanges = isAdditiveSelection
          ? cellSelectionRanges
          : isRangeExtension
          ? cellSelectionRanges.slice(0, -1)
          : [];

        cellSelectionDragRef.current = {
          startRowIndex,
          startColumnIndex,
          startRowSpan,
          baseRanges,
          activeRangeIndex: baseRanges.length,
        };
        latestPointerRef.current = { clientX: evt.clientX, clientY: evt.clientY };
        setCellSelecting(true);
        setCellSelectionRanges([...baseRanges, activeRange]);
      }
    },
    [
      activeCell,
      cellNavigationOptions?.enabled,
      cellSelectionEnabled,
      cellSelectionRange,
      cellSelectionRanges,
      columns.length,
      data.length,
      setActiveCell,
      setCellSelecting,
      setCellSelectionRanges,
      toLogicalCellPosition,
    ],
  );

  const endCellSelectionDrag = useCallback(() => {
    if (!cellSelectionDragRef.current && !axisSelectionDragRef.current) return;
    cellSelectionDragRef.current = null;
    axisSelectionDragRef.current = null;
    latestPointerRef.current = null;
    if (selectionAutoScrollRafRef.current !== null) {
      cancelAnimationFrame(selectionAutoScrollRafRef.current);
      selectionAutoScrollRafRef.current = null;
    }
    setCellSelecting(false);
  }, [setCellSelecting]);

  const updateSelectionByPointer = useCallback(
    (clientX: number, clientY: number) => {
      const dragState = cellSelectionDragRef.current;
      if (!dragState) return;

      const target = (document.elementFromPoint?.(clientX, clientY) ?? null) as HTMLElement | null;
      const cellPosition =
        getCellPosition(target, containerRef.current) ??
        getCellPositionFromPointer({
          clientX,
          clientY,
          bodyContainer: bodyContainerRef.current,
          scrollContainer: scrollContainerRef.current,
          metrics: selectionMetricsRef.current,
        });

      if (!cellPosition) return;

      const logicalCellPosition = toLogicalCellPosition(cellPosition);
      setCellSelectionRanges(updateSelectionDragRange(dragState, getRangeFromDrag(dragState, logicalCellPosition)));
    },
    [setCellSelectionRanges, toLogicalCellPosition],
  );

  const runSelectionAutoScroll = useCallback(() => {
    selectionAutoScrollRafRef.current = null;

    const dragState = cellSelectionDragRef.current;
    const pointer = latestPointerRef.current;
    const scrollContainer = scrollContainerRef.current;
    const bodyContainer = bodyContainerRef.current;
    if (!dragState || !pointer || !scrollContainer || !bodyContainer) return;

    const delta = getSelectionAutoScrollDelta(pointer.clientX, pointer.clientY, bodyContainer, scrollContainer);
    const maxScrollTop = Math.max(scrollContainer.scrollHeight - scrollContainer.clientHeight, 0);
    const maxScrollLeft = Math.max(scrollContainer.scrollWidth - scrollContainer.clientWidth, 0);
    const nextScrollTop = clamp(scrollContainer.scrollTop + delta.y, 0, maxScrollTop);
    const nextScrollLeft = clamp(scrollContainer.scrollLeft + delta.x, 0, maxScrollLeft);

    if (nextScrollTop !== scrollContainer.scrollTop || nextScrollLeft !== scrollContainer.scrollLeft) {
      commitScroll(nextScrollTop, nextScrollLeft);
    }

    updateSelectionByPointer(pointer.clientX, pointer.clientY);

    if (cellSelectionDragRef.current && (delta.x !== 0 || delta.y !== 0)) {
      selectionAutoScrollRafRef.current = requestAnimationFrame(runSelectionAutoScroll);
    }
  }, [commitScroll, updateSelectionByPointer]);

  const selectAllCells = useCallback(() => {
    if (!cellSelectionEnabled) return false;
    if (data.length === 0 || columns.length === 0) return false;

    endCellSelectionDrag();
    setCellSelectionRanges([
      {
        startRowIndex: 0,
        startColumnIndex: 0,
        endRowIndex: data.length - 1,
        endColumnIndex: columns.length - 1,
      },
    ]);

    return true;
  }, [cellSelectionEnabled, columns.length, data.length, endCellSelectionDrag, setCellSelectionRanges]);

  const copySelectedCells = useCallback(
    async (evt?: ClipboardEvent) => {
      if (!cellSelectionEnabled) return;
      if (cellSelectionRanges.length === 0) return;

      const maxClipboardCells = cellSelectionOptions?.maxClipboardCells ?? DEFAULT_MAX_CLIPBOARD_CELLS;
      const maxClipboardTextLength =
        cellSelectionOptions?.maxClipboardTextLength ?? DEFAULT_MAX_CLIPBOARD_TEXT_LENGTH;
      const onCopyError = cellSelectionOptions?.onCopyError;
      const selectedCellCount = getSelectionCellCount(cellSelectionRanges, data.length, columns.length);
      const notifyCopyError = (params: {
        reason: 'maxClipboardCells' | 'maxClipboardTextLength' | 'clipboardWriteFailed';
        actual?: number;
        limit?: number;
        error?: unknown;
      }) => {
        warnClipboardLimitExceeded(params.reason, params.actual, params.limit);
        onCopyError?.({
          reason: params.reason,
          actual: params.actual,
          limit: params.limit,
          selectedCellCount,
          maxClipboardCells,
          maxClipboardTextLength,
          error: params.error,
        });
      };

      if (selectedCellCount === 0 || selectedCellCount > maxClipboardCells) {
        if (selectedCellCount > maxClipboardCells) {
          notifyCopyError({
            reason: 'maxClipboardCells',
            actual: selectedCellCount,
            limit: maxClipboardCells,
          });
        }
        return;
      }

      const selectedCells = getSelectedCellMap(cellSelectionRanges, data.length, columns.length);
      const rows: string[] = [];
      let textLength = 0;
      let copiedRowCount = 0;

      for (const ri of Array.from(selectedCells.keys()).sort((a, b) => a - b)) {
        const item = data[ri];
        if (!item) continue;

        const values: string[] = [];
        const columnIndexes = Array.from(selectedCells.get(ri) ?? []).sort((a, b) => a - b);
        columnIndexes.forEach(ci => {
          const column = columns[ci];
          if (!column) return;
          const value = getCellValueByRowKey(column.key, item.values);
          const clipboardValue = column.getClipboardText
            ? column.getClipboardText({
                column,
                index: ri,
                columnIndex: ci,
                item,
                values: item.values,
                value,
              })
            : value;
          values.push(toClipboardText(clipboardValue));
        });

        const rowText = values.join('\t');
        const nextTextLength = textLength + rowText.length + (copiedRowCount > 0 ? 1 : 0);
        if (nextTextLength > maxClipboardTextLength) {
          notifyCopyError({
            reason: 'maxClipboardTextLength',
            actual: nextTextLength,
            limit: maxClipboardTextLength,
          });
          return;
        }

        rows.push(rowText);
        textLength = nextTextLength;
        copiedRowCount += 1;
      }

      const text = rows.join('\r');
      if (!text) return;

      if (evt?.clipboardData) {
        evt.clipboardData.setData('text/plain', text);
        return;
      }

      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          return;
        } catch (error) {
          if (copyTextFallback(text)) {
            return;
          }

          notifyCopyError({
            reason: 'clipboardWriteFailed',
            actual: text.length,
            error,
          });
        }
        return;
      }

      copyTextFallback(text);
    },
    [
      cellSelectionEnabled,
      cellSelectionRanges,
      columns,
      data,
      cellSelectionOptions?.maxClipboardCells,
      cellSelectionOptions?.maxClipboardTextLength,
      cellSelectionOptions?.onCopyError,
    ],
  );

  const pasteClipboardText = useCallback(
    (text: string) => {
      if (!cellSelectionEnabled || !editable || !activeCell || data.length === 0 || columns.length === 0) {
        return false;
      }

      const maxClipboardCells = cellSelectionOptions?.maxClipboardCells ?? DEFAULT_MAX_CLIPBOARD_CELLS;
      const maxClipboardTextLength =
        cellSelectionOptions?.maxClipboardTextLength ?? DEFAULT_MAX_CLIPBOARD_TEXT_LENGTH;
      const matrix = parseClipboardText(text);
      const clipboardCellCount = matrix.reduce((count, row) => count + row.length, 0);
      const onPasteError = cellSelectionOptions?.onPasteError;
      const notifyPasteError = (params: {
        reason: 'maxClipboardCells' | 'maxClipboardTextLength' | 'parseValueFailed' | 'createRowFailed';
        actual?: number;
        limit?: number;
        rowIndex?: number;
        columnIndex?: number;
        error?: unknown;
      }) => {
        warnClipboardPasteFailed(params.reason, params.actual, params.limit);
        onPasteError?.({
          ...params,
          clipboardTextLength: text.length,
          clipboardCellCount,
          maxClipboardCells,
          maxClipboardTextLength,
        });
      };

      if (text.length > maxClipboardTextLength) {
        notifyPasteError({
          reason: 'maxClipboardTextLength',
          actual: text.length,
          limit: maxClipboardTextLength,
        });
        return true;
      }
      if (clipboardCellCount > maxClipboardCells) {
        notifyPasteError({
          reason: 'maxClipboardCells',
          actual: clipboardCellCount,
          limit: maxClipboardCells,
        });
        return true;
      }

      const startRowIndex = activeCell.rowIndex;
      const startColumnIndex = activeCell.columnIndex;
      const nextData = [...data];
      const appendedRows: Array<{ rowIndex: number; item: BGridDataItem<T> }> = [];
      const changes: Array<{ rowIndex: number; columnIndex: number; item: BGridDataItem<T> }> = [];
      const createRowOnPaste = cellSelectionOptions?.createRowOnPaste;

      if (createRowOnPaste) {
        const requiredRowCount = startRowIndex + matrix.length;
        while (nextData.length < requiredRowCount) {
          const rowIndex = nextData.length;
          const clipboardRow = matrix[rowIndex - startRowIndex];
          if (!clipboardRow) break;

          let createdItem: BGridDataItem<T> | undefined;
          try {
            createdItem = createRowOnPaste({ rowIndex, clipboardRow: [...clipboardRow], columns });
          } catch (error) {
            notifyPasteError({ reason: 'createRowFailed', rowIndex, error });
            break;
          }
          if (!createdItem) break;

          const newItem = { ...createdItem, status: BGridDataItemStatus.new };
          nextData.push(newItem);
          appendedRows.push({ rowIndex, item: newItem });
        }
      }

      matrix.forEach((clipboardRow, rowOffset) => {
        const rowIndex = startRowIndex + rowOffset;
        const item = nextData[rowIndex];
        if (!item || item.status === BGridDataItemStatus.remove) return;

        clipboardRow.forEach((clipboardValue, columnOffset) => {
          const columnIndex = startColumnIndex + columnOffset;
          const column = columns[columnIndex];
          if (!column || column.editable === false) return;

          let nextValue: unknown = clipboardValue;
          if (column.editor?.type === 'text' && column.editor.parseValue) {
            try {
              nextValue = column.editor.parseValue(clipboardValue, {
                index: rowIndex,
                columnIndex,
                item,
                values: item.values,
                column,
              });
            } catch (error) {
              notifyPasteError({
                reason: 'parseValueFailed',
                rowIndex,
                columnIndex,
                error,
              });
              return;
            }
          }

          const currentValue = getCellValueByRowKey(column.key, item.values);
          if (Object.is(currentValue, nextValue)) return;

          setCellValueByRowKey(column.key, item.values, nextValue);
          markCellEdited(item, column);
          markCellValueChanged(item, column);
          if (item.status !== BGridDataItemStatus.new) {
            item.status = BGridDataItemStatus.edit;
          }
          changes.push({ rowIndex, columnIndex, item });
        });
      });

      const pastedRowCount = Math.min(matrix.length, Math.max(nextData.length - startRowIndex, 0));
      const pastedColumnCount = Math.min(
        matrix.reduce((max, row) => Math.max(max, row.length), 0),
        Math.max(columns.length - startColumnIndex, 0),
      );
      if (pastedRowCount > 0 && pastedColumnCount > 0) {
        setCellSelectionRanges([
          {
            startRowIndex,
            startColumnIndex,
            endRowIndex: startRowIndex + pastedRowCount - 1,
            endColumnIndex: startColumnIndex + pastedColumnCount - 1,
          },
        ]);
      }

      if (changes.length > 0 || appendedRows.length > 0) {
        setData(nextData);
        appendedRows.forEach(({ rowIndex, item }) => {
          onChangeData?.(rowIndex, null, item.values, null);
        });
        changes.forEach(({ rowIndex, columnIndex, item }) => {
          const sourceIndex = sourceIndexByVisibleIndex?.[rowIndex] ?? rowIndex;
          onChangeData?.(sourceIndex, columnIndex, item.values, columns[columnIndex]);
        });
      }

      return true;
    },
    [
      activeCell,
      cellSelectionEnabled,
      columns,
      data,
      editable,
      cellSelectionOptions?.maxClipboardCells,
      cellSelectionOptions?.maxClipboardTextLength,
      cellSelectionOptions?.onPasteError,
      cellSelectionOptions?.createRowOnPaste,
      onChangeData,
      sourceIndexByVisibleIndex,
      setCellSelectionRanges,
      setData,
    ],
  );

  const onBodyPointerLeave = useCallback(() => {
    clearHoveredRow();
  }, [clearHoveredRow]);

  // [Group 1] Layout dimensions
  useEffect(() => {
    if (props.width !== undefined) setWidth(Math.max(props.width, 100));
    if (props.headerHeight !== undefined) setHeaderHeight(Math.max(props.headerHeight, 22));
    if (props.footerHeight !== undefined) setFooterHeight(props.footerHeight);
    if (props.summaryHeight !== undefined) setSummaryHeight(props.summaryHeight);
    if (props.itemHeight !== undefined) setItemHeight(props.itemHeight);
    if (props.itemPadding !== undefined) setItemPadding(props.itemPadding);
  }, [
    props.width,
    props.headerHeight,
    props.footerHeight,
    props.summaryHeight,
    props.itemHeight,
    props.itemPadding,
    setWidth,
    setHeaderHeight,
    setFooterHeight,
    setSummaryHeight,
    setItemHeight,
    setItemPadding,
  ]);

  useEffect(() => {
    if (props.bottomBarHeight !== undefined) setBottomBarHeight(props.bottomBarHeight);
  }, [props.bottomBarHeight, setBottomBarHeight]);

  useEffect(() => {
    if (props.scrollbar !== undefined) setScrollbar(props.scrollbar);
  }, [props.scrollbar, setScrollbar]);

  useEffect(() => {
    if (props.status !== undefined) setStatus(props.status);
  }, [props.status, setStatus]);

  useEffect(() => {
    if (props.pagination !== undefined) setPagination(props.pagination);
  }, [props.pagination, setPagination]);

  // [Group 2] Content body height (depends on layout dimensions → separate effect)
  useEffect(() => {
    if (props.height !== undefined) {
      const propsHeight = Math.max(props.height, 100);
      setHeight(propsHeight);
      const contentBodyHeight = Math.max(
        propsHeight -
          headerHeight -
          (showBottomBar ? bottomBarHeight : 0) -
          (summary ? summaryHeight : 0) -
          containerBorderWidth * 2,
        0,
      );
      const displayItemCount =
        contentBodyHeight > 0 ? Math.ceil(contentBodyHeight / (itemHeight + itemPadding * 2)) : 0;
      setContentBodyHeight(contentBodyHeight);
      setDisplayItemCount(displayItemCount);
    }
  }, [
    props.height,
    height,
    headerHeight,
    showBottomBar,
    bottomBarHeight,
    containerBorderWidth,
    itemHeight,
    itemPadding,
    summary,
    summaryHeight,
    setHeight,
    setContentBodyHeight,
    setDisplayItemCount,
  ]);

  // [Group 3] Loading / spinner states
  useEffect(() => {
    if (props.loading !== undefined) setLoading(props.loading);
    if (props.spinning !== undefined) setSpinning(props.spinning);
  }, [props.loading, props.spinning, setLoading, setSpinning]);

  // [Group 4] Frozen columns
  useEffect(() => {
    const frozenColumnsWidth = getFrozenColumnsWidth({
      showLineNumber,
      rowChecked,
      itemHeight,
      frozenColumnIndex: props.frozenColumnIndex ?? 0,
      columns,
      dataLength: data.length,
      reorderable: props.reorder?.enabled ?? false,
    });
    setFrozenColumnsWidth(frozenColumnsWidth);
    setFrozenColumnIndex(props.frozenColumnIndex ?? 0);
  }, [
    props.frozenColumnIndex,
    props.reorder?.enabled,
    showLineNumber,
    rowChecked,
    itemHeight,
    columns,
    data.length,
    setFrozenColumnsWidth,
    setFrozenColumnIndex,
  ]);

  // [Group 4-1] Frozen rows. A top summary remains a separate band above this body area.
  useEffect(() => {
    const rowCount = props.data?.length ?? data.length;
    const nextFrozenRowCount = Math.min(Math.max(Math.floor(props.frozenRowCount ?? 0), 0), rowCount);
    setFrozenRowCount(nextFrozenRowCount);
    setFrozenRowsHeight(nextFrozenRowCount * trHeight);
  }, [data.length, props.data?.length, props.frozenRowCount, setFrozenRowCount, setFrozenRowsHeight, trHeight]);

  // [Group 5] Data & columns
  useEffect(() => {
    if (
      props.data !== undefined &&
      props.sourceData !== undefined &&
      props.sourceIndexByVisibleIndex !== undefined &&
      props.visibleIndexBySourceIndex !== undefined
    ) {
      setProcessedData({
        data: props.data,
        sourceData: props.sourceData,
        sourceIndexByVisibleIndex: props.sourceIndexByVisibleIndex,
        visibleIndexBySourceIndex: props.visibleIndexBySourceIndex,
      });
    } else if (props.data !== undefined) {
      setData(props.data);
      if (props.sourceData !== undefined) {
        setSourceData(props.sourceData);
      }
    }
  }, [
    props.data,
    props.sourceData,
    props.sourceIndexByVisibleIndex,
    props.visibleIndexBySourceIndex,
    setData,
    setProcessedData,
    setSourceData,
  ]);

  useEffect(() => {
    if (props.columns !== undefined) setColumns(props.columns);
    if (props.columnsGroup !== undefined) setColumnsGroup(props.columnsGroup);
    if (props.columnGroups !== undefined) setColumnGroups(props.columnGroups);
  }, [props.columnGroups, props.columns, props.columnsGroup, setColumnGroups, setColumns, setColumnsGroup]);

  // [Group 6] Row check, sort & query state
  useEffect(() => {
    if (props.checkedIndexesMap !== undefined) setCheckedIndexesMap(props.checkedIndexesMap);
  }, [props.checkedIndexesMap, setCheckedIndexesMap]);

  useEffect(() => {
    setRowChecked(props.rowChecked);
    setSort(props.sort);
    setSortParams(props.sortParams);
    setDataControl(props.dataControl);
    setIcons(props.icons);
    setSearchOptions(props.searchOptions);
    setContextMenuOptions(props.contextMenuOptions);
  }, [
    props.rowChecked,
    props.sort,
    props.sortParams,
    props.dataControl,
    props.icons,
    props.searchOptions,
    props.contextMenuOptions,
    setRowChecked,
    setSort,
    setSortParams,
    setDataControl,
    setIcons,
    setSearchOptions,
    setContextMenuOptions,
  ]);

  const prevDataQueryRef = useRef(props.dataQuery);

  useEffect(() => {
    if (props.dataQuery !== undefined) {
      setDataQuery(props.dataQuery);
      const dataQueryChanged = !areDataQueriesEqual(prevDataQueryRef.current, props.dataQuery);

      if (dataQueryChanged) {
        setActiveToolbox(null);
        clearCellSelection();
        setEditItem(-1, -1);
        commitScroll(0, scrollContainerRef.current?.scrollLeft ?? 0);
      }
      prevDataQueryRef.current = props.dataQuery;
    }
  }, [clearCellSelection, commitScroll, props.dataQuery, setActiveToolbox, setDataQuery, setEditItem]);

  // [Group 7] Pagination
  useEffect(() => {
    if (props.page !== undefined) {
      setPage({ ...props.page });
      setDisplayPaginationLength(props.page?.displayPaginationLength ?? 5);
    }
  }, [
    props.page,
    props.page?.currentPage,
    props.page?.loading,
    props.page?.pageSize,
    props.page?.totalPages,
    props.page?.totalElements,
    props.page?.onChange,
    props.page?.displayPaginationLength,
    setPage,
    setDisplayPaginationLength,
  ]);

  useEffect(() => {
    resetScrollPosition('top');
  }, [resetScrollPosition, props.page?.currentPage]);

  // [Group 8] Row key & selection
  useEffect(() => {
    setRowKey(props.rowKey);
    setFocusedRowKey(props.selectedRowKey);
  }, [props.rowKey, props.selectedRowKey, setRowKey, setFocusedRowKey]);

  // [Group 9] Edit options
  useEffect(() => {
    if (props.editable !== undefined) setEditable(props.editable);
    if (props.editTrigger !== undefined) setEditTrigger(props.editTrigger);
  }, [props.editable, props.editTrigger, setEditable, setEditTrigger]);

  // [Group 10] Event callbacks
  useEffect(() => {
    setOnClick(props.onClick);
    setOnChangeColumns(props.onChangeColumns);
    setOnChangeData(props.onChangeData);
    setOnLoadMore(props.onLoadMore);
  }, [
    props.onClick,
    props.onChangeColumns,
    props.onChangeData,
    props.onLoadMore,
    setOnClick,
    setOnChangeColumns,
    setOnChangeData,
    setOnLoadMore,
  ]);

  // [Group 11] Display / rendering options
  useEffect(() => {
    setShowLineNumber(props.showLineNumber);
    setMsg(props.msg);
    setRowClassName(props.getRowClassName);
    setCellMergeOptions(props.cellMergeOptions);
    setVariant(props.variant);
    setSummary(props.summary);
    setColumnSortable(props.columnSortable);
    setReorder(props.reorder);
    setClassName(props.className);
    setStyle(props.style);
  }, [
    props.showLineNumber,
    props.msg,
    props.getRowClassName,
    props.cellMergeOptions,
    props.variant,
    props.summary,
    props.columnSortable,
    props.reorder,
    props.className,
    props.style,
    setShowLineNumber,
    setMsg,
    setRowClassName,
    setCellMergeOptions,
    setVariant,
    setSummary,
    setColumnSortable,
    setReorder,
    setClassName,
    setStyle,
  ]);

  // [Group 11-1] Cell Navigation Options
  useEffect(() => {
    setCellNavigationOptions(props.cellNavigationOptions);
  }, [props.cellNavigationOptions, setCellNavigationOptions]);

  useEffect(() => {
    syncActiveCellToBounds();
  }, [
    columns.length,
    data.length,
    props.cellNavigationOptions?.activeCell?.columnIndex,
    props.cellNavigationOptions?.activeCell?.rowIndex,
    props.cellNavigationOptions?.defaultActiveCell?.columnIndex,
    props.cellNavigationOptions?.defaultActiveCell?.rowIndex,
    syncActiveCellToBounds,
  ]);

  // setInitialized + DOM event bindings
  useEffect(() => {
    setInitialized(true);

    const containerRefCurrent = containerRef.current;
    const scrollContainerRefCurrent = scrollContainerRef?.current;
    if (scrollContainerRefCurrent) {
      scrollContainerRefCurrent.removeEventListener('scroll', onScroll);
      scrollContainerRefCurrent.addEventListener('scroll', onScroll, { passive: true, capture: true });
      scrollContainerRefCurrent.removeEventListener('wheel', onWheel);
      scrollContainerRefCurrent.addEventListener('wheel', onWheel, { passive: false, capture: true });
    }

    return () => {
      if (scrollRafRef.current !== null) {
        cancelAnimationFrame(scrollRafRef.current);
        scrollRafRef.current = null;
      }
      if (scrollIdleTimerRef.current !== null) {
        window.clearTimeout(scrollIdleTimerRef.current);
        scrollIdleTimerRef.current = null;
      }
      containerRefCurrent?.removeAttribute('data-bgrid-scrolling');
      scrollContainerRefCurrent?.removeEventListener('scroll', onScroll);
      scrollContainerRefCurrent?.removeEventListener('wheel', onWheel);
    };
  }, [onScroll, onWheel, setInitialized]);

  React.useLayoutEffect(() => {
    if (!scrollContainerRef.current) return;
    if (props.scrollLeft !== undefined) {
      scrollContainerRef.current.scrollLeft = props.scrollLeft;
    }
    if (props.scrollTop !== undefined) {
      scrollContainerRef.current.scrollTop = props.scrollTop;
    }
  }, [props.scrollLeft, props.scrollTop]);

  useEffect(() => {
    latestCommittedScrollRef.current = { top: scrollTop, left: scrollLeft };
  }, [scrollTop, scrollLeft]);

  useEffect(() => {
    return () => {
      clearHoveredRow();
    };
  }, [clearHoveredRow]);

  useEffect(() => {
    if (!cellSelectionEnabled) return;

    const handlePointerUp = () => {
      endCellSelectionDrag();
    };
    const handlePointerMove = (evt: PointerEvent) => {
      if (axisSelectionDragRef.current) {
        const target = (document.elementFromPoint?.(evt.clientX, evt.clientY) ?? null) as HTMLElement | null;
        updateAxisSelectionByTarget(target);
        return;
      }
      if (!cellSelectionDragRef.current) return;

      latestPointerRef.current = { clientX: evt.clientX, clientY: evt.clientY };
      updateSelectionByPointer(evt.clientX, evt.clientY);

      if (selectionAutoScrollRafRef.current === null) {
        selectionAutoScrollRafRef.current = requestAnimationFrame(runSelectionAutoScroll);
      }
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
    document.addEventListener('pointercancel', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
      document.removeEventListener('pointercancel', handlePointerUp);
    };
  }, [
    cellSelectionEnabled,
    endCellSelectionDrag,
    runSelectionAutoScroll,
    updateAxisSelectionByTarget,
    updateSelectionByPointer,
  ]);

  useEffect(() => {
    if (cellSelectionEnabled) return;

    endCellSelectionDrag();
    clearCellSelection();
  }, [cellSelectionEnabled, clearCellSelection, endCellSelectionDrag]);

  const clearCellSelectionOnEscape = props.cellSelectionOptions?.clearOnEscape ?? true;
  const clearCellSelectionOnOutsideClick = props.cellSelectionOptions?.clearOnOutsideClick ?? true;

  const keyboardRuntimeRef = useRef({
    activeCell,
    cellInteractionSession,
    cellNavigationOptions,
    cellSelectionEnabled,
    clearCellSelection,
    clearCellSelectionOnEscape,
    clearCellSelectionOnOutsideClick,
    columns,
    commitCheckboxCell,
    commitScroll,
    copySelectedCells,
    dataLength: data.length,
    data,
    editable,
    editItemIndex,
    endCellSelectionDrag,
    frozenColumnIndex: props.frozenColumnIndex ?? 0,
    frozenRowCount,
    height,
    handleClick,
    moveActiveCell,
    openCellContextMenu,
    pasteClipboardText,
    selectAllCells,
    setEditItem,
    requestSearchOpen,
    searchOpen,
    searchOptions,
    trHeight,
    viewportInsets: keyboardViewportInsets,
  });
  keyboardRuntimeRef.current = {
    activeCell,
    cellInteractionSession,
    cellNavigationOptions,
    cellSelectionEnabled,
    clearCellSelection,
    clearCellSelectionOnEscape,
    clearCellSelectionOnOutsideClick,
    columns,
    commitCheckboxCell,
    commitScroll,
    copySelectedCells,
    dataLength: data.length,
    data,
    editable,
    editItemIndex,
    endCellSelectionDrag,
    frozenColumnIndex: props.frozenColumnIndex ?? 0,
    frozenRowCount,
    height,
    handleClick,
    moveActiveCell,
    openCellContextMenu,
    pasteClipboardText,
    selectAllCells,
    setEditItem,
    requestSearchOpen,
    searchOpen,
    searchOptions,
    trHeight,
    viewportInsets: keyboardViewportInsets,
  };

  useEffect(() => {
    let repeatingArrowKey: string | undefined;
    let repeatingArrowShiftKey = false;
    let arrowRepeatFrame: number | undefined;
    let lastArrowRepeatTime = 0;

    const stopArrowRepeat = () => {
      repeatingArrowKey = undefined;
      if (arrowRepeatFrame !== undefined) {
        cancelAnimationFrame(arrowRepeatFrame);
        arrowRepeatFrame = undefined;
      }
    };

    const moveWithArrowKey = (key: string, extendSelection: boolean, toBoundary = false) => {
      const {
        activeCell,
        cellInteractionSession,
        cellNavigationOptions,
        cellSelectionEnabled,
        columns,
        commitScroll,
        dataLength,
        frozenColumnIndex,
        frozenRowCount,
        moveActiveCell,
        trHeight,
        viewportInsets,
      } = keyboardRuntimeRef.current;
      const container = containerRef.current;
      const activeElement = document.activeElement;
      if (
        !container ||
        (activeElement !== container && !container.contains(activeElement)) ||
        cellInteractionSession ||
        cellNavigationOptions?.enabled === false ||
        dataLength === 0 ||
        columns.length === 0
      ) {
        return false;
      }

      const directionByKey: Record<string, BGridCellMoveDirection> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
      };
      const direction = directionByKey[key];
      if (!direction) return false;

      const nextCell = moveActiveCell(direction, {
        extendSelection,
        toBoundary,
        selectionEnabled: cellSelectionEnabled,
      });
      if (!nextCell) return false;

      const result = ensureCellVisible({
        cell: nextCell,
        scrollContainer: scrollContainerRef.current,
        frozenColumnCount: frozenColumnIndex,
        frozenRowCount,
        columns,
        rowHeight: trHeight,
        viewportInsets,
      });
      if (result.didScroll) {
        commitScroll(result.scrollTop, result.scrollLeft);
      }

      return activeCell?.rowIndex !== nextCell.rowIndex || activeCell?.columnIndex !== nextCell.columnIndex;
    };

    const runArrowRepeatFrame = (time: number) => {
      if (!repeatingArrowKey) return;
      const configuredInterval = keyboardRuntimeRef.current.cellNavigationOptions?.keyRepeat?.interval;
      const repeatInterval = Math.max(
        8,
        Number.isFinite(configuredInterval) ? configuredInterval! : DEFAULT_KEYBOARD_NAVIGATION_REPEAT_INTERVAL,
      );
      if (time - lastArrowRepeatTime >= repeatInterval) {
        lastArrowRepeatTime = time;
        if (!moveWithArrowKey(repeatingArrowKey, repeatingArrowShiftKey)) {
          stopArrowRepeat();
          return;
        }
      }
      arrowRepeatFrame = requestAnimationFrame(runArrowRepeatFrame);
    };

    const startArrowRepeat = (key: string, extendSelection: boolean) => {
      if (repeatingArrowKey === key && repeatingArrowShiftKey === extendSelection) return;
      stopArrowRepeat();
      repeatingArrowKey = key;
      repeatingArrowShiftKey = extendSelection;
      lastArrowRepeatTime = performance.now();
      arrowRepeatFrame = requestAnimationFrame(runArrowRepeatFrame);
    };

    const handleKeyDown = (evt: KeyboardEvent) => {
      const {
        activeCell,
        cellInteractionSession,
        cellNavigationOptions,
        cellSelectionEnabled,
        clearCellSelection,
        clearCellSelectionOnEscape,
        columns,
        commitCheckboxCell,
        commitScroll,
        copySelectedCells,
        data,
        dataLength,
        editable,
        editItemIndex,
        endCellSelectionDrag,
        frozenColumnIndex,
        frozenRowCount,
        height,
        handleClick,
        moveActiveCell,
        openCellContextMenu,
        selectAllCells,
        setEditItem,
        requestSearchOpen,
        searchOpen,
        searchOptions,
        trHeight,
        viewportInsets,
      } = keyboardRuntimeRef.current;
      const container = containerRef.current;
      const activeElement = document.activeElement;
      if (!container || (activeElement !== container && !container.contains(activeElement))) return;

      const isCtrlOrMeta = evt.ctrlKey || evt.metaKey;
      const isFindShortcut = isCtrlOrMeta && evt.key.toLowerCase() === 'f';
      if (isFindShortcut && searchOptions && searchOptions.enabled !== false && searchOptions.shortcut !== false) {
        const targetInsideSearch =
          evt.target instanceof HTMLElement && !!evt.target.closest('.bgrid-search-popover');
        if (!cellInteractionSession && (targetInsideSearch || !isInteractiveTarget(evt.target))) {
          evt.preventDefault();
          evt.stopPropagation();
          requestSearchOpen(true, 'shortcut');
          setTimeout(() => {
            const input = container.querySelector<HTMLInputElement>('.bgrid-search-input');
            input?.focus({ preventScroll: true });
            input?.select();
          }, searchOpen ? 0 : 1);
          return;
        }
      }

      if (isInteractiveTarget(evt.target)) return;

      const isShift = evt.shiftKey;

      if (!cellInteractionSession && activeCell && (evt.key === 'ContextMenu' || (isShift && evt.key === 'F10'))) {
        const targetCell = container.querySelector<HTMLElement>(
          `td[data-bgrid-cell="true"][data-row-index="${activeCell.rowIndex}"][data-column-index="${activeCell.columnIndex}"]`,
        );
        const rect = targetCell?.getBoundingClientRect();
        if (rect && openCellContextMenu(activeCell, rect.left + 8, rect.top + Math.min(rect.height, 20), true)) {
          evt.preventDefault();
          evt.stopPropagation();
          return;
        }
      }

      // Escape key
      if (evt.key === 'Escape' || evt.key === 'Esc') {
        if (editItemIndex !== undefined && editItemIndex >= 0) {
          evt.preventDefault();
          setEditItem(-1, -1);
          return;
        }
        if (clearCellSelectionOnEscape) {
          evt.preventDefault();
          endCellSelectionDrag();
          clearCellSelection();
          return;
        }
      }

      // Ctrl/Cmd + A, Ctrl/Cmd + C
      if (isCtrlOrMeta) {
        const key = evt.key.toLowerCase();
        if (key === 'a') {
          if (!selectAllCells()) return;
          evt.preventDefault();
          return;
        }
        if (key === 'c') {
          evt.preventDefault();
          void copySelectedCells();
          return;
        }
      }

      // Cell Navigation
      const navEnabled = cellNavigationOptions?.enabled ?? true;
      if (navEnabled && dataLength > 0 && columns.length > 0) {
        const curCell = activeCell ?? { rowIndex: 0, columnIndex: 0 };
        const toggleActiveCheckbox = () => {
          const column = columns[curCell.columnIndex];
          const config = column?.editor?.type === 'checkbox' ? column.editor : undefined;
          const item = data[curCell.rowIndex];
          if (!config || !item) return false;
          const checked = isCheckboxValueChecked(config, getCellValueByRowKey(column.key, item.values));
          void commitCheckboxCell(curCell.rowIndex, curCell.columnIndex, !checked);
          return true;
        };

        // F2: Start editing
        if (evt.key === 'F2') {
          const col = columns[curCell.columnIndex];
          if (editable && col?.editable !== false) {
            evt.preventDefault();
            if (toggleActiveCheckbox()) return;
            setEditItem(curCell.rowIndex, curCell.columnIndex);
            return;
          }
        }

        // Enter edits an editable cell; otherwise it activates the cell.
        if (evt.key === 'Enter') {
          const col = columns[curCell.columnIndex];
          const editOnEnter = cellNavigationOptions?.editOnEnter ?? true;

          if (
            editOnEnter &&
            editable &&
            col?.editable !== false &&
            (editItemIndex === undefined || editItemIndex < 0)
          ) {
            evt.preventDefault();
            if (toggleActiveCheckbox()) return;
            setEditItem(curCell.rowIndex, curCell.columnIndex);
            return;
          }

          evt.preventDefault();
          handleClick(curCell.rowIndex, curCell.columnIndex);
          return;
        }

        // Space toggles a checkbox editor or activates any other current cell.
        if (evt.key === ' ' || evt.key === 'Spacebar') {
          evt.preventDefault();
          if (editable && toggleActiveCheckbox()) return;
          handleClick(curCell.rowIndex, curCell.columnIndex);
          return;
        }

        // Tab / Shift+Tab
        if (evt.key === 'Tab') {
          evt.preventDefault();
          const nextCell = moveActiveCell(isShift ? 'prev' : 'next', {
            extendSelection: false,
            selectionEnabled: cellSelectionEnabled,
          });
          if (nextCell) {
            const result = ensureCellVisible({
              cell: nextCell,
              scrollContainer: scrollContainerRef.current,
              frozenColumnCount: frozenColumnIndex,
              frozenRowCount,
              columns,
              rowHeight: trHeight,
              viewportInsets,
            });
            if (result.didScroll) {
              commitScroll(result.scrollTop, result.scrollLeft);
            }
          }
          return;
        }

        // Arrow keys
        if (evt.key === 'ArrowUp' || evt.key === 'ArrowDown' || evt.key === 'ArrowLeft' || evt.key === 'ArrowRight') {
          evt.preventDefault();
          const customRepeatEnabled = cellNavigationOptions?.keyRepeat?.enabled ?? true;
          if (evt.repeat && customRepeatEnabled && !isCtrlOrMeta) {
            if (!repeatingArrowKey) {
              moveWithArrowKey(evt.key, isShift);
              startArrowRepeat(evt.key, isShift);
            } else if (repeatingArrowKey === evt.key) {
              repeatingArrowShiftKey = isShift;
            }
            return;
          }
          stopArrowRepeat();
          moveWithArrowKey(evt.key, isShift, isCtrlOrMeta);
          return;
        }

        // Home / End
        if (evt.key === 'Home' || evt.key === 'End') {
          evt.preventDefault();
          const direction: BGridCellMoveDirection = evt.key === 'Home' ? 'home' : 'end';
          const nextCell = moveActiveCell(direction, {
            extendSelection: isShift,
            toBoundary: isCtrlOrMeta,
            selectionEnabled: cellSelectionEnabled,
          });
          if (nextCell) {
            const result = ensureCellVisible({
              cell: nextCell,
              scrollContainer: scrollContainerRef.current,
              frozenColumnCount: frozenColumnIndex,
              frozenRowCount,
              columns,
              rowHeight: trHeight,
              viewportInsets,
            });
            if (result.didScroll) {
              commitScroll(result.scrollTop, result.scrollLeft);
            }
          }
          return;
        }

        // PageUp / PageDown
        if (evt.key === 'PageUp' || evt.key === 'PageDown') {
          evt.preventDefault();
          const direction: BGridCellMoveDirection = evt.key === 'PageUp' ? 'pageUp' : 'pageDown';
          const visibleBodyHeight = Math.max(
            0,
            (scrollContainerRef.current?.clientHeight || height) - viewportInsets.bottom,
          );
          const pageSize = Math.max(1, Math.floor(visibleBodyHeight / trHeight));
          const nextCell = moveActiveCell(direction, {
            extendSelection: isShift,
            pageSize,
            selectionEnabled: cellSelectionEnabled,
          });
          if (nextCell) {
            const result = ensureCellVisible({
              cell: nextCell,
              scrollContainer: scrollContainerRef.current,
              frozenColumnCount: frozenColumnIndex,
              frozenRowCount,
              columns,
              rowHeight: trHeight,
              viewportInsets,
            });
            if (result.didScroll) {
              commitScroll(result.scrollTop, result.scrollLeft);
            }
          }
          return;
        }
      }
    };

    const handleKeyUp = (evt: KeyboardEvent) => {
      if (evt.key === repeatingArrowKey) stopArrowRepeat();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') stopArrowRepeat();
    };

    const handleCopy = (evt: ClipboardEvent) => {
      const container = containerRef.current;
      const activeElement = document.activeElement;
      if (!container || (activeElement !== container && !container.contains(activeElement))) return;

      if (isInteractiveTarget(evt.target)) return;

      evt.preventDefault();
      void keyboardRuntimeRef.current.copySelectedCells(evt);
    };

    const handlePaste = (evt: ClipboardEvent) => {
      const container = containerRef.current;
      const activeElement = document.activeElement;
      if (!container || (activeElement !== container && !container.contains(activeElement))) return;
      if (keyboardRuntimeRef.current.editItemIndex !== undefined && keyboardRuntimeRef.current.editItemIndex >= 0) {
        return;
      }
      if (isInteractiveTarget(evt.target)) return;

      const text = evt.clipboardData?.getData('text/plain');
      if (text === undefined) return;
      if (keyboardRuntimeRef.current.pasteClipboardText(text)) {
        evt.preventDefault();
      }
    };

    const handlePointerDown = (evt: PointerEvent) => {
      const { clearCellSelection, clearCellSelectionOnOutsideClick, endCellSelectionDrag } = keyboardRuntimeRef.current;
      if (!clearCellSelectionOnOutsideClick) return;

      const container = containerRef.current;
      const target = evt.target;
      if (
        !container ||
        (target instanceof Node && container.contains(target)) ||
        isPointInsideElement(container, evt.clientX, evt.clientY)
      ) {
        return;
      }

      endCellSelectionDrag();
      clearCellSelection();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('pointerdown', handlePointerDown, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', stopArrowRepeat);

    return () => {
      stopArrowRepeat();
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('pointerdown', handlePointerDown, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', stopArrowRepeat);
    };
  }, []);

  return (
    <EditorPortalContext.Provider value={editorPortalContext}>
      <Container
      ref={containerRef}
      role={'grid'}
      style={{ ...style, width, height, borderWidth: `${containerBorderWidth}px` }}
      className={className}
      tabIndex={0}
      onFocus={event => {
        if (event.target !== event.currentTarget) return;
        const gateway = event.currentTarget.querySelector('[data-bgrid-text-editor-gateway="true"]');
        if (gateway instanceof HTMLInputElement) {
          gateway.focus({ preventScroll: true });
        }
      }}
      data-scroll-variant={scrollbar.variant}
      data-vertical-scrollbar={scrollbar.variant !== 'native' && scrollbar.vertical.visible ? 'visible' : 'hidden'}
      data-bgrid-cell-selection-enabled={cellSelectionEnabled ? 'true' : 'false'}
      data-bgrid-frozen-columns={(props.frozenColumnIndex ?? 0) > 0 ? 'true' : 'false'}
    >
      {scrollbar.variant !== 'native' && scrollbar.vertical.visible && (
        <div className='bgrid-vertical-scrollbar-gutter' aria-hidden='true' />
      )}
      {scrollbar.variant !== 'native' && scrollbar.vertical.visible && (
        <div
          className='bgrid-vertical-scrollbar-area'
          style={{
            top: 0,
            bottom: showBottomBar ? bottomBarHeight : 0,
          }}
        >
          <CustomScrollbar
            orientation='vertical'
            variant={scrollbar.variant}
            metrics={scrollbarMetrics.vertical}
            scrollOffset={scrollTop}
            onScrollChange={handleScrollTopChange}
          />
        </div>
      )}
      <ScrollContainer
        ref={scrollContainerRef}
        role={'rfdg-scroll-container'}
        data-bgrid-scroll-plane='sticky'
        style={{ height: scrollViewportHeight }}
        onPointerDownCapture={onBodyPointerDownCapture}
        onPointerOverCapture={onBodyPointerOverCapture}
        onPointerLeave={onBodyPointerLeave}
        onContextMenuCapture={event => {
          if (isInteractiveTarget(event.target)) return;
          const cell = getCellPosition(event.target as HTMLElement, containerRef.current);
          if (!cell) return;
          if (openCellContextMenu(cell, event.clientX, event.clientY, false)) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        <ScrollPlane style={{ height: scrollPlaneHeight, minWidth: scrollPlaneMinWidth }}>
          <HeaderContainer style={{ height: headerHeight, top: 0 }} role={'rfdg-header-container'}>
            {(frozenColumnsWidth ?? 0) > 0 && (
              <FrozenHeader
                style={{ width: frozenColumnsWidth }}
                role={'rfdg-frozen-header'}
              >
                <TableHeadFrozen container={containerRef} />
              </FrozenHeader>
            )}
            <Header
              style={{ left: frozenColumnsWidth }}
              role={'rfdg-header'}
            >
              <TableHead container={containerRef} />
            </Header>
          </HeaderContainer>

          {summary && summary.position === 'top' && (
            <SummaryContainer
              position={'top'}
              style={{ height: summaryHeight, top: headerHeight }}
              role={'rfdg-summary-container'}
            >
              {(frozenColumnsWidth ?? 0) > 0 && (
                <FrozenSummary
                  style={{ width: frozenColumnsWidth }}
                  role={'rfdg-frozen-summary'}
                >
                  <TableSummaryFrozen position={'top'} />
                </FrozenSummary>
              )}
              <Summary style={{ left: frozenColumnsWidth }} role={'rfdg-summary'}>
                <TableSummary position={'top'} />
              </Summary>
            </SummaryContainer>
          )}

          <div
            className='bgrid-body-scroll-content'
            style={{ height: frozenRowsHeight + visibleScrollableRows.scrollContentHeight }}
          >
            {frozenRowCount > 0 && (
              <div
                className='bgrid-frozen-rows-layer'
                style={{ height: frozenRowsHeight, top: stickyTopHeight }}
                data-bgrid-row-band='frozen'
              >
                {(frozenColumnsWidth ?? 0) > 0 && (
                  <div
                    className='bgrid-frozen-rows-left bgrid-frozen-column-boundary'
                    style={{ width: frozenColumnsWidth }}
                    role='rfdg-frozen-rows-left'
                  >
                    <TableBodyFrozen
                      scrollContainerRef={scrollContainerRef}
                      rowRange={frozenRowRange}
                      role='rfdg-body-top-frozen'
                      quadrant='top-left'
                      allowRowReorder={false}
                    />
                    {renderSelectionOverlay('top-left')}
                  </div>
                )}
                <div
                  className='bgrid-frozen-rows-main'
                  style={{ left: frozenColumnsWidth }}
                  role='rfdg-frozen-rows-main'
                >
                  <TableBody
                    scrollContainerRef={scrollContainerRef}
                    rowRange={frozenRowRange}
                    role='rfdg-body-top'
                    quadrant='top-main'
                    allowRowReorder={false}
                  />
                  {renderSelectionOverlay('top-main')}
                </div>
              </div>
            )}

            <div
              className='bgrid-scrollable-rows-layer'
              style={{ height: visibleScrollableRows.scrollContentHeight }}
              data-bgrid-row-band='scrollable'
            >
              {(frozenColumnsWidth ?? 0) > 0 && (
                <FrozenScrollContent
                  style={{
                    width: frozenColumnsWidth,
                    height: visibleScrollableRows.scrollContentHeight,
                  }}
                  role={'rfdg-frozen-scroll-container'}
                >
                  <TableBodyFrozen
                    scrollContainerRef={scrollContainerRef}
                    rowRange={scrollableRowRange}
                    style={frozenScrollableBodyStyle}
                    quadrant='body-left'
                    onRowReorderPointerDown={rowReorderController.onPointerDown}
                    onRowReorderKeyDown={rowReorderController.onKeyDown}
                  />
                  {renderSelectionOverlay('body-left')}
                </FrozenScrollContent>
              )}
              <ScrollContent
                style={{
                  left: frozenColumnsWidth,
                  paddingTop: visibleScrollableRows.paddingTop,
                  height: visibleScrollableRows.scrollContentHeight,
                }}
              >
                <TableBody
                  scrollContainerRef={scrollContainerRef}
                  rowRange={scrollableRowRange}
                  quadrant='body-main'
                />
                {renderSelectionOverlay('body-main')}
              </ScrollContent>
            </div>
          </div>

          {summary && summary.position === 'bottom' && (
            <SummaryContainer
              position={'bottom'}
              style={{ height: summaryHeight, bottom: 0 }}
              role={'rfdg-summary-container'}
            >
              {(frozenColumnsWidth ?? 0) > 0 && (
                <FrozenSummary
                  style={{ width: frozenColumnsWidth }}
                  role={'rfdg-frozen-summary'}
                >
                  <TableSummaryFrozen position={'bottom'} />
                </FrozenSummary>
              )}
              <Summary style={{ left: frozenColumnsWidth }} role={'rfdg-summary'}>
                <TableSummary position={'bottom'} />
              </Summary>
            </SummaryContainer>
          )}
        </ScrollPlane>
      </ScrollContainer>

      <BodyViewport
        ref={bodyContainerRef}
        style={{ top: stickyTopHeight, height: contentBodyHeight }}
        data-last={!page ? 'true' : undefined}
      >
        {rowReorderController.preview?.visible && (
          <div
            className='bgrid-row-reorder-preview'
            data-bgrid-row-reorder-phase={rowReorderController.preview.phase}
            aria-hidden='true'
          >
            {rowReorderController.preview.text}
          </div>
        )}

        <Loading active={!!spinning} size={'small'} />
      </BodyViewport>

      <div className='bgrid-visually-hidden' role='status' aria-live='polite' aria-atomic='true'>
        {rowReorderController.announcement}
      </div>

      <CellTextEditorGateway containerRef={containerRef} />
      <CellNavigationDomSync
        containerRef={containerRef}
        activeCell={activeLogicalCell?.cell}
        cellSelectionRanges={cellSelectionRanges}
        hasMultiCellSelection={hasMultiCellSelection}
        rowCount={data.length}
        columnCount={columns.length}
      />
      {(searchSurfaceEnabled || contextMenuSurfaceEnabled) && (
        <React.Suspense fallback={null}>
          <LazyGridOptionalSurfaces
            gridRef={containerRef}
            searchPopoverRef={searchPopoverRef}
            searchEnabled={searchSurfaceEnabled}
            contextMenuEnabled={contextMenuSurfaceEnabled}
          />
        </React.Suspense>
      )}
      <EditorPortalRoot gridRef={containerRef} portalRef={editorPortalRef} />

      {showBottomBar && (
        <FooterContainer style={{ height: bottomBarHeight }} role={'rfdg-footer-container'}>
          <TableFooter
            horizontalMetrics={scrollbarMetrics.horizontal}
            scrollLeft={scrollLeft}
            onScrollLeftChange={handleScrollLeftChange}
          />
        </FooterContainer>
      )}
      <Loading active={loading} />
      </Container>
    </EditorPortalContext.Provider>
  );
}

interface CellPosition extends BGridCellAddress {
  rowSpan: number;
}

interface CellSelectionDragState {
  startRowIndex: number;
  startColumnIndex: number;
  startRowSpan: number;
  baseRanges: BGridCellSelectionRange[];
  activeRangeIndex: number;
}

type CellSelectionAxis = 'row' | 'column';

interface AxisSelectionTarget {
  axis: CellSelectionAxis;
  startIndex: number;
  endIndex: number;
}

interface AxisSelectionDragState {
  axis: CellSelectionAxis;
  startIndex: number;
  baseRanges: BGridCellSelectionRange[];
  activeRangeIndex: number;
}

function getAxisSelectionTarget(
  target: HTMLElement | null,
  container: HTMLElement | null,
): AxisSelectionTarget | undefined {
  if (!target || !container) return undefined;

  const lineNumberCell = target.closest('.bgrid-line-number-cell[data-row-index]');
  if (lineNumberCell instanceof HTMLElement && container.contains(lineNumberCell)) {
    const rowIndex = Number(lineNumberCell.dataset.rowIndex);
    if (Number.isFinite(rowIndex)) {
      return { axis: 'row', startIndex: rowIndex, endIndex: rowIndex };
    }
  }

  const headerCell = target.closest(
    '[data-header-cell-type][data-column-index][data-bgrid-axis-selectable="true"]',
  );
  if (!(headerCell instanceof HTMLTableCellElement) || !container.contains(headerCell)) return undefined;
  if (target.closest('.bgrid-col-resizer, .bgrid-toolbox-trigger-btn')) return undefined;
  if (headerCell.classList.contains('drag-item') && target.closest('.bgrid-column-drag-handle')) return undefined;

  const columnIndex = Number(headerCell.dataset.columnIndex);
  if (!Number.isFinite(columnIndex)) return undefined;
  const columnSpan = headerCell.dataset.headerCellType === 'group' ? Math.max(headerCell.colSpan || 1, 1) : 1;

  return {
    axis: 'column',
    startIndex: columnIndex,
    endIndex: columnIndex + columnSpan - 1,
  };
}

function getAxisSelectionRange({
  axis,
  startIndex,
  endIndex,
  rowCount,
  columnCount,
}: {
  axis: CellSelectionAxis;
  startIndex: number;
  endIndex: number;
  rowCount: number;
  columnCount: number;
}): BGridCellSelectionRange {
  if (axis === 'row') {
    return {
      startRowIndex: startIndex,
      endRowIndex: endIndex,
      startColumnIndex: 0,
      endColumnIndex: Math.max(columnCount - 1, 0),
    };
  }

  return {
    startRowIndex: 0,
    endRowIndex: Math.max(rowCount - 1, 0),
    startColumnIndex: startIndex,
    endColumnIndex: endIndex,
  };
}

function updateAxisSelectionDragRange(
  dragState: AxisSelectionDragState,
  activeRange: BGridCellSelectionRange,
) {
  const nextRanges = [...dragState.baseRanges];
  nextRanges[dragState.activeRangeIndex] = activeRange;
  return nextRanges;
}

function getCellPosition(target: HTMLElement | null, container: HTMLElement | null): CellPosition | undefined {
  const cell = target?.closest('td[data-bgrid-cell="true"]');
  if (!(cell instanceof HTMLElement) || !container?.contains(cell)) return undefined;

  const rowIndex = Number(cell.dataset.rowIndex);
  const columnIndex = Number(cell.dataset.columnIndex);
  if (Number.isNaN(rowIndex) || Number.isNaN(columnIndex)) return undefined;

  const rowSpan = cell instanceof HTMLTableCellElement ? Math.max(cell.rowSpan || 1, 1) : 1;

  return { rowIndex, columnIndex, rowSpan };
}

function getCellPositionFromPointer({
  clientX,
  clientY,
  bodyContainer,
  scrollContainer,
  metrics,
}: {
  clientX: number;
  clientY: number;
  bodyContainer: HTMLElement | null;
  scrollContainer: HTMLElement | null;
  metrics: {
    columns: AppModelColumn<any>[];
    dataLength: number;
    frozenColumnIndex: number;
    frozenColumnsWidth: number;
    frozenRowCount: number;
    frozenRowsHeight: number;
    trHeight: number;
  };
}): CellPosition | undefined {
  if (!bodyContainer || !scrollContainer || metrics.columns.length === 0 || metrics.dataLength === 0) return undefined;

  const scrollRect = scrollContainer.getBoundingClientRect();
  const bodyRect = bodyContainer.getBoundingClientRect();
  const frozenRowsBottom = bodyRect.top + metrics.frozenRowsHeight;
  const rowIndex =
    metrics.frozenRowCount > 0 && clientY < frozenRowsBottom
      ? clamp(Math.floor((clientY - bodyRect.top) / metrics.trHeight), 0, metrics.frozenRowCount - 1)
      : clamp(
          metrics.frozenRowCount +
            Math.floor(
              (scrollContainer.scrollTop +
                clamp(clientY - scrollRect.top, 0, Math.max(scrollContainer.clientHeight - 1, 0))) /
                metrics.trHeight,
            ),
          0,
          metrics.dataLength - 1,
        );

  const columnIndex = getColumnIndexFromPointer({
    clientX,
    bodyContainer,
    scrollContainer,
    metrics,
  });
  if (columnIndex === undefined) return undefined;

  return {
    rowIndex,
    columnIndex,
    rowSpan: 1,
  };
}

function getColumnIndexFromPointer({
  clientX,
  bodyContainer,
  scrollContainer,
  metrics,
}: {
  clientX: number;
  bodyContainer: HTMLElement;
  scrollContainer: HTMLElement;
  metrics: {
    columns: AppModelColumn<any>[];
    frozenColumnIndex: number;
    frozenColumnsWidth: number;
  };
}) {
  const scrollRect = scrollContainer.getBoundingClientRect();

  if (clientX < scrollRect.left && metrics.frozenColumnIndex > 0) {
    const bodyRect = bodyContainer.getBoundingClientRect();
    const frozenX = clamp(clientX - bodyRect.left, 0, Math.max(metrics.frozenColumnsWidth - 1, 0));
    let left = 0;

    for (let ci = 0; ci < metrics.frozenColumnIndex; ci++) {
      const width = metrics.columns[ci]?.width ?? 100;
      if (frozenX < left + width) return ci;
      left += width;
    }

    return Math.min(metrics.frozenColumnIndex - 1, metrics.columns.length - 1);
  }

  const normalX =
    scrollContainer.scrollLeft + clamp(clientX - scrollRect.left, 0, Math.max(scrollContainer.clientWidth - 1, 0));
  for (let ci = metrics.frozenColumnIndex; ci < metrics.columns.length; ci++) {
    const column = metrics.columns[ci];
    const left = column.left ?? 0;
    const width = column.width ?? 100;
    if (normalX < left + width) return ci;
  }

  return metrics.columns.length - 1;
}

function updateSelectionDragRange(dragState: CellSelectionDragState, activeRange: BGridCellSelectionRange) {
  const nextRanges = [...dragState.baseRanges];
  nextRanges[dragState.activeRangeIndex] = activeRange;
  return nextRanges;
}

function getRangeFromDrag(dragState: CellSelectionDragState, cellPosition: CellPosition): BGridCellSelectionRange {
  const isDraggingUp = cellPosition.rowIndex < dragState.startRowIndex;

  return {
    startRowIndex: isDraggingUp ? dragState.startRowIndex + dragState.startRowSpan - 1 : dragState.startRowIndex,
    startColumnIndex: dragState.startColumnIndex,
    endRowIndex: getSelectionEndRowIndex(dragState.startRowIndex, cellPosition),
    endColumnIndex: cellPosition.columnIndex,
  };
}

function getSelectionEndRowIndex(startRowIndex: number, cellPosition: CellPosition) {
  if (cellPosition.rowIndex < startRowIndex) return cellPosition.rowIndex;
  return cellPosition.rowIndex + cellPosition.rowSpan - 1;
}

function getSelectedCellMap(ranges: BGridCellSelectionRange[], rowCount?: number, columnCount?: number) {
  const selectedCells = new Map<number, Set<number>>();

  ranges.forEach(range => {
    const normalizedRange = normalizeCellSelectionRange(range);
    const startRowIndex =
      rowCount === undefined ? normalizedRange.startRowIndex : clamp(normalizedRange.startRowIndex, 0, rowCount - 1);
    const endRowIndex =
      rowCount === undefined ? normalizedRange.endRowIndex : clamp(normalizedRange.endRowIndex, 0, rowCount - 1);
    const startColumnIndex =
      columnCount === undefined
        ? normalizedRange.startColumnIndex
        : clamp(normalizedRange.startColumnIndex, 0, columnCount - 1);
    const endColumnIndex =
      columnCount === undefined
        ? normalizedRange.endColumnIndex
        : clamp(normalizedRange.endColumnIndex, 0, columnCount - 1);

    if (startRowIndex > endRowIndex || startColumnIndex > endColumnIndex) return;

    for (let ri = startRowIndex; ri <= endRowIndex; ri++) {
      const columnIndexes = selectedCells.get(ri) ?? new Set<number>();

      for (let ci = startColumnIndex; ci <= endColumnIndex; ci++) {
        columnIndexes.add(ci);
      }

      selectedCells.set(ri, columnIndexes);
    }
  });

  return selectedCells;
}

function getSelectionCellCount(ranges: BGridCellSelectionRange[], rowCount: number, columnCount: number) {
  if (rowCount <= 0 || columnCount <= 0) return 0;

  return ranges.reduce((count, range) => {
    const normalizedRange = normalizeCellSelectionRange(range);
    const startRowIndex = clamp(normalizedRange.startRowIndex, 0, rowCount - 1);
    const endRowIndex = clamp(normalizedRange.endRowIndex, 0, rowCount - 1);
    const startColumnIndex = clamp(normalizedRange.startColumnIndex, 0, columnCount - 1);
    const endColumnIndex = clamp(normalizedRange.endColumnIndex, 0, columnCount - 1);

    if (startRowIndex > endRowIndex || startColumnIndex > endColumnIndex) return count;

    return count + (endRowIndex - startRowIndex + 1) * (endColumnIndex - startColumnIndex + 1);
  }, 0);
}

function warnClipboardLimitExceeded(reason: string, actual?: number, limit?: number) {
  if (typeof console === 'undefined') return;

  if (limit === undefined || actual === undefined) {
    console.warn(`[BGrid] Clipboard copy failed. reason: ${reason}`);
    return;
  }

  console.warn(
    `[BGrid] Clipboard copy skipped because ${reason} (${actual.toLocaleString()}) exceeds the configured limit (${limit.toLocaleString()}).`,
  );
}

function warnClipboardPasteFailed(reason: string, actual?: number, limit?: number) {
  if (typeof console === 'undefined') return;

  if (limit === undefined || actual === undefined) {
    console.warn(`[BGrid] Clipboard paste skipped. reason: ${reason}`);
    return;
  }

  console.warn(
    `[BGrid] Clipboard paste skipped because ${reason} (${actual.toLocaleString()}) exceeds the configured limit (${limit.toLocaleString()}).`,
  );
}

function parseClipboardText(text: string) {
  const normalizedText = text.replace(/\r\n?/g, '\n');
  const withoutTrailingLineBreak = normalizedText.endsWith('\n') ? normalizedText.slice(0, -1) : normalizedText;
  return withoutTrailingLineBreak.split('\n').map(row => row.split('\t'));
}

function setCellValueByRowKey<T>(key: string | string[], values: T, value: unknown) {
  if (!Array.isArray(key)) {
    (values as Record<string, unknown>)[key] = value;
    return;
  }

  let target = values as Record<string, any>;
  key.forEach((path, index) => {
    if (index === key.length - 1) {
      target[path] = value;
      return;
    }
    if (target[path] === undefined || target[path] === null || typeof target[path] !== 'object') {
      target[path] = {};
    }
    target = target[path];
  });
}

function getSelectionAutoScrollDelta(
  clientX: number,
  clientY: number,
  bodyContainer: HTMLElement,
  scrollContainer: HTMLElement,
) {
  const threshold = 36;
  const maxStep = 28;
  const bodyRect = bodyContainer.getBoundingClientRect();
  const scrollRect = scrollContainer.getBoundingClientRect();

  return {
    x: getAutoScrollStep(clientX, scrollRect.left, scrollRect.right, threshold, maxStep),
    y: getAutoScrollStep(clientY, bodyRect.top, bodyRect.bottom, threshold, maxStep),
  };
}

function getAutoScrollStep(position: number, min: number, max: number, threshold: number, maxStep: number) {
  if (position < min + threshold) {
    return -Math.ceil((clamp(min + threshold - position, 0, threshold * 2) / (threshold * 2)) * maxStep);
  }
  if (position > max - threshold) {
    return Math.ceil((clamp(position - (max - threshold), 0, threshold * 2) / (threshold * 2)) * maxStep);
  }
  return 0;
}

function isInteractiveTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  if (target.closest('[data-bgrid-text-editor-gateway="true"]')) return false;
  return !!target.closest('input, textarea, select, button, [contenteditable="true"], [contenteditable=""]');
}

function normalizeContextMenuItems<T>(
  items: readonly BGridContextMenuItem<T>[],
  onDuplicateId: (id: string) => void,
): BGridContextMenuItem<T>[] {
  const seen = new Set<string>();
  const unique = items.filter(item => {
    if (seen.has(item.id)) {
      onDuplicateId(item.id);
      return false;
    }
    seen.add(item.id);
    return true;
  });

  const normalized: BGridContextMenuItem<T>[] = [];
  unique.forEach(item => {
    if (item.type === 'separator') {
      if (normalized.length === 0 || normalized[normalized.length - 1]?.type === 'separator') return;
    }
    normalized.push(item);
  });
  if (normalized[normalized.length - 1]?.type === 'separator') normalized.pop();
  return normalized;
}

function areDataQueriesEqual(previous: BGridDataQuery | undefined, next: BGridDataQuery | undefined) {
  if (previous === next) return true;
  if (!previous || !next || previous.sortParams.length !== next.sortParams.length) return false;

  const sortParamsEqual = previous.sortParams.every((sort, index) => {
    const candidate = next.sortParams[index];
    return (
      !!candidate &&
      sort.columnId === candidate.columnId &&
      sort.key === candidate.key &&
      sort.index === candidate.index &&
      sort.orderBy === candidate.orderBy
    );
  });

  return sortParamsEqual && areFilterParamsEqual(previous.filterParams, next.filterParams);
}

function areFilterParamsEqual(
  previous: BGridDataQuery['filterParams'] | undefined,
  next: BGridDataQuery['filterParams'] | undefined,
) {
  if (previous === next) return true;
  if (!previous || !next || previous.length !== next.length) return false;

  return previous.every((filter, index) => {
    const candidate = next[index];
    if (!candidate || filter.columnId !== candidate.columnId || filter.type !== candidate.type) return false;
    if (!areColumnKeysEqual(filter.key, candidate.key)) return false;

    if (filter.type === 'values' && candidate.type === 'values') {
      return (
        filter.values.length === candidate.values.length &&
        filter.values.every((value, valueIndex) => Object.is(value, candidate.values[valueIndex]))
      );
    }
    if (filter.type === 'text' && candidate.type === 'text') {
      return filter.operator === candidate.operator && filter.value === candidate.value;
    }
    if (filter.type === 'number' && candidate.type === 'number') {
      return (
        filter.operator === candidate.operator &&
        Object.is(filter.value, candidate.value) &&
        Object.is(filter.min, candidate.min) &&
        Object.is(filter.max, candidate.max)
      );
    }

    return false;
  });
}

function areColumnKeysEqual(previous: string | string[], next: string | string[]) {
  if (previous === next) return true;
  if (!Array.isArray(previous) || !Array.isArray(next) || previous.length !== next.length) return false;
  return previous.every((key, index) => key === next[index]);
}

function isPointInsideElement(element: HTMLElement, clientX: number, clientY: number) {
  const rect = element.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return false;

  return clientX >= rect.left && clientX <= rect.right && clientY >= rect.top && clientY <= rect.bottom;
}

function toClipboardText(value: any) {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint') return String(value);
  if (value instanceof Date) return value.toISOString();

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function copyTextFallback(text: string) {
  if (typeof document.execCommand !== 'function') return false;

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  textarea.style.top = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand('copy');
  document.body.removeChild(textarea);
  return copied;
}

const Container = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
  return <div ref={ref} {...props} className={['bgrid-root', props.className ?? ''].filter(Boolean).join(' ')} />;
});

function HeaderContainer(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={['bgrid-header-container', props.className ?? ''].filter(Boolean).join(' ')} />;
}

const Header = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={['bgrid-header-scroll-content', props.className ?? ''].filter(Boolean).join(' ')}
    />
  );
});

function FrozenHeader(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={['bgrid-header-frozen', 'bgrid-frozen-column-boundary', props.className ?? '']
        .filter(Boolean)
        .join(' ')}
    />
  );
}

const BodyViewport = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <div
    ref={ref}
    {...props}
    className={['bgrid-body-container', 'bgrid-body-viewport', props.className ?? ''].filter(Boolean).join(' ')}
  />
));

const ScrollContainer = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <div ref={ref} {...props} className={['bgrid-scroll-container', props.className ?? ''].filter(Boolean).join(' ')} />
));

const ScrollPlane = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <div ref={ref} {...props} className={['bgrid-scroll-plane', props.className ?? ''].filter(Boolean).join(' ')} />
));

const ScrollContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <div ref={ref} {...props} className={['bgrid-scroll-content', props.className ?? ''].filter(Boolean).join(' ')} />
));

const FrozenScrollContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => (
  <div
    ref={ref}
    {...props}
    className={[
      'bgrid-frozen-body-boundary',
      'bgrid-frozen-column-boundary',
      'bgrid-frozen-scroll-content',
      props.className ?? '',
    ]
      .filter(Boolean)
      .join(' ')}
  />
));

function FooterContainer(props: React.HTMLAttributes<HTMLDivElement>) {
  return <div {...props} className={['bgrid-footer-container', props.className ?? ''].filter(Boolean).join(' ')} />;
}

function SummaryContainer({
  position,
  className,
  ...rest
}: React.HTMLAttributes<HTMLDivElement> & { position: string }) {
  void position;
  return <div {...rest} className={['bgrid-summary-container', className ?? ''].filter(Boolean).join(' ')} />;
}

const Summary = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>((props, ref) => {
  return (
    <div
      ref={ref}
      {...props}
      className={['bgrid-summary-scroll-content', props.className ?? ''].filter(Boolean).join(' ')}
    />
  );
});

function FrozenSummary(props: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={['bgrid-summary-frozen', 'bgrid-frozen-column-boundary', props.className ?? '']
        .filter(Boolean)
        .join(' ')}
    />
  );
}

ScrollContainer.displayName = 'ScrollContainer';
ScrollPlane.displayName = 'ScrollPlane';
ScrollContent.displayName = 'ScrollContent';
FrozenScrollContent.displayName = 'FrozenScrollContent';
Container.displayName = 'Container';
BodyViewport.displayName = 'BodyViewport';
Summary.displayName = 'Summary';
Header.displayName = 'Header';

export default Table;
