import * as React from 'react';
import { createContext, useContext, useRef, ReactNode } from 'react';
import { createStore, useStore, StoreApi } from 'zustand';
import {
  AppModel,
  AppModelColumn,
  AppStore,
  BGridCellAddress,
  BGridCellCommitRequest,
  BGridCellInteractionSession,
  BGridCellSelectionRange,
  BGridColumnGroup,
  BGridColumnGroupNode,
  BGridContextMenuOptions,
  BGridContextMenuState,
  BGridDataItem,
  BGridDataItemStatus,
  BGridDataQuery,
  BGridEditorIconSession,
  BGridSearchMatch,
  BGridSearchOpenReason,
  BGridSearchOptions,
  BGridSortParam,
  CheckedAll,
  SortedColumn,
} from '../types';
import { clampCellAddress } from '../utils/coordinate';
import {
  applyFilterToQuery,
  applyChangesToItem,
  applySortToQuery,
  clearFilterFromQuery,
  createNextValues,
  createCheckboxEditorContext,
  getCellValueByRowKey,
  getCheckboxFalseValue,
  getCheckboxTrueValue,
  getColumnId,
  getFrozenColumnsWidth,
  getMergedRowRange,
  findMatchingSearchResultIndex,
  resolveCellValueChanges,
  resolveLogicalCell,
  isCheckboxEditorDisabled,
  isCheckboxValueChecked,
} from '../utils';

const StoreContext = createContext<StoreApi<AppStore> | null>(null);

function cellsEqual(a?: BGridCellAddress, b?: BGridCellAddress) {
  return a?.rowIndex === b?.rowIndex && a?.columnIndex === b?.columnIndex;
}

function selectionRangesEqual(a?: BGridCellSelectionRange, b?: BGridCellSelectionRange) {
  return (
    a?.startRowIndex === b?.startRowIndex &&
    a?.startColumnIndex === b?.startColumnIndex &&
    a?.endRowIndex === b?.endRowIndex &&
    a?.endColumnIndex === b?.endColumnIndex
  );
}

function findColumnGroupParent(groups: BGridColumnGroupNode[], columnId: string): string | undefined {
  for (const group of groups) {
    for (const child of group.children) {
      if (typeof child === 'string') {
        if (child === columnId) return group.id;
      } else {
        const parent = findColumnGroupParent([child], columnId);
        if (parent !== undefined) return parent;
      }
    }
  }
  return undefined;
}

function reorderColumnGroupTree(
  groups: BGridColumnGroupNode[],
  columnOrderById: Map<string, number>,
): BGridColumnGroupNode[] {
  const getFirstColumnIndex = (child: string | BGridColumnGroupNode): number => {
    if (typeof child === 'string') return columnOrderById.get(child) ?? Number.MAX_SAFE_INTEGER;
    return child.children.reduce(
      (minimum, nestedChild) => Math.min(minimum, getFirstColumnIndex(nestedChild)),
      Number.MAX_SAFE_INTEGER,
    );
  };

  const reorderGroup = (group: BGridColumnGroupNode): BGridColumnGroupNode => {
    const children = group.children.map(child => (typeof child === 'string' ? child : reorderGroup(child)));
    children.sort((left, right) => getFirstColumnIndex(left) - getFirstColumnIndex(right));
    return { ...group, children };
  };

  return groups.map(reorderGroup).sort((left, right) => getFirstColumnIndex(left) - getFirstColumnIndex(right));
}

export type AppStoreInitialState<T = any> = Partial<
  Pick<
    AppModel<T>,
    | 'width'
    | 'height'
    | 'headerHeight'
    | 'footerHeight'
    | 'bottomBarHeight'
    | 'scrollbar'
    | 'status'
    | 'pagination'
    | 'summaryHeight'
    | 'itemHeight'
    | 'itemPadding'
    | 'frozenColumnIndex'
    | 'frozenRowCount'
    | 'frozenRowsHeight'
    | 'frozenColumnsWidth'
    | 'columns'
    | 'columnsGroup'
    | 'columnGroups'
    | 'data'
    | 'sourceData'
    | 'sourceIndexByVisibleIndex'
    | 'visibleIndexBySourceIndex'
    | 'contentBodyHeight'
    | 'displayItemCount'
    | 'checkedIndexesMap'
    | 'rowChecked'
    | 'checkedAll'
    | 'sort'
    | 'sortParams'
    | 'dataQuery'
    | 'activeCell'
    | 'activeCellHost'
    | 'cellInteractionSession'
    | 'cellNavigationOptions'
    | 'dataControl'
    | 'filterDrafts'
    | 'activeToolboxColumnId'
    | 'searchOptions'
    | 'contextMenuOptions'
    | 'searchOpen'
    | 'searchQuery'
    | 'searchStatus'
    | 'searchMatches'
    | 'activeSearchMatchIndex'
    | 'contextMenuState'
    | 'icons'
    | 'page'
    | 'displayPaginationLength'
    | 'loading'
    | 'spinning'
    | 'scrollTop'
    | 'scrollLeft'
    | 'rowKey'
    | 'selectedRowKey'
    | 'editable'
    | 'editTrigger'
    | 'showLineNumber'
    | 'msg'
    | 'getRowClassName'
    | 'cellMergeOptions'
    | 'variant'
    | 'summary'
    | 'columnSortable'
    | 'reorder'
    | 'className'
    | 'style'
    | 'onClick'
    | 'onChangeColumns'
    | 'onChangeData'
    | 'onLoadMore'
  >
>;

interface AppStoreProviderProps<T = any> {
  children: ReactNode;
  initialState?: AppStoreInitialState<T>;
}

export function AppStoreProvider<T = any>({ children, initialState }: AppStoreProviderProps<T>) {
  const storeRef = useRef<StoreApi<AppStore<T>> | null>(null);
  const editSessionIdRef = useRef(0);
  // Merged cells render at their top anchor, so keep the entered row separately for horizontal navigation.
  const activeCellNavigationRowRef = useRef(
    initialState?.activeCell?.rowIndex ??
      initialState?.cellNavigationOptions?.activeCell?.rowIndex ??
      initialState?.cellNavigationOptions?.defaultActiveCell?.rowIndex,
  );
  const lastNavigationCellRef = useRef<BGridCellAddress | undefined>(undefined);
  if (!storeRef.current) {
    storeRef.current = createStore<AppStore<T>>((set, get) => ({
      initialized: false,
      width: initialState?.width ?? 0,
      height: initialState?.height ?? 0,
      headerHeight: initialState?.headerHeight ?? 30,
      footerHeight: initialState?.footerHeight ?? 30,
      bottomBarHeight: initialState?.bottomBarHeight ?? 30,
      scrollbar: initialState?.scrollbar ?? {
        variant: 'modern',
        horizontal: {
          visible: true,
        },
        vertical: {
          visible: true,
        },
      },
      status: initialState?.status ?? {
        visible: true,
        configured: false,
        content: undefined,
      },
      pagination: initialState?.pagination ?? {
        visible: true,
      },
      summaryHeight: initialState?.summaryHeight ?? 30,
      itemHeight: initialState?.itemHeight ?? 15,
      itemPadding: initialState?.itemPadding ?? 7,
      frozenColumnIndex: initialState?.frozenColumnIndex ?? 0,
      frozenRowCount: initialState?.frozenRowCount ?? 0,
      frozenRowsHeight: initialState?.frozenRowsHeight ?? 0,
      frozenColumnsWidth: initialState?.frozenColumnsWidth,
      columns: initialState?.columns ?? [],
      columnsGroup: initialState?.columnsGroup ?? [],
      columnGroups: initialState?.columnGroups ?? [],
      data: initialState?.data ?? [],
      sourceData: initialState?.sourceData ?? initialState?.data ?? [],
      sourceIndexByVisibleIndex: initialState?.sourceIndexByVisibleIndex ?? [],
      visibleIndexBySourceIndex: initialState?.visibleIndexBySourceIndex ?? new Map(),
      columnResizing: false,
      containerBorderWidth: 1,
      contentBodyHeight: initialState?.contentBodyHeight ?? 0,
      displayItemCount: initialState?.displayItemCount ?? 0,
      checkedIndexesMap: initialState?.checkedIndexesMap ?? new Map(),
      checkedAll: initialState?.checkedAll ?? false,
      displayPaginationLength: initialState?.displayPaginationLength ?? 0,
      loading: initialState?.loading ?? false,
      editTrigger: initialState?.editTrigger ?? 'dblclick',
      cellMergeOptions: initialState?.cellMergeOptions,
      variant: initialState?.variant ?? 'default',
      columnSortable: initialState?.columnSortable ?? false,
      reordering: false,
      activeCell:
        initialState?.activeCell ??
        initialState?.cellNavigationOptions?.activeCell ??
        initialState?.cellNavigationOptions?.defaultActiveCell,
      activeCellHost:
        initialState?.activeCellHost ??
        initialState?.activeCell ??
        initialState?.cellNavigationOptions?.activeCell ??
        initialState?.cellNavigationOptions?.defaultActiveCell,
      cellInteractionSession: initialState?.cellInteractionSession,
      cellNavigationOptions: initialState?.cellNavigationOptions,
      cellSelectionRanges: [],
      cellSelecting: false,
      rowChecked: initialState?.rowChecked,
      sort: initialState?.sort,
      sortParams: initialState?.sortParams,
      dataQuery: initialState?.dataQuery,
      dataControl: initialState?.dataControl,
      filterDrafts: initialState?.filterDrafts ?? {},
      activeToolboxColumnId: initialState?.activeToolboxColumnId ?? null,
      searchOptions: initialState?.searchOptions,
      contextMenuOptions: initialState?.contextMenuOptions,
      searchOpen:
        initialState?.searchOptions?.open ?? initialState?.searchOpen ?? initialState?.searchOptions?.defaultOpen ?? false,
      searchQuery:
        initialState?.searchOptions?.query ?? initialState?.searchQuery ?? initialState?.searchOptions?.defaultQuery ?? '',
      searchStatus: initialState?.searchStatus ?? 'idle',
      searchMatches: initialState?.searchMatches ?? [],
      activeSearchMatchIndex: initialState?.activeSearchMatchIndex,
      contextMenuState: initialState?.contextMenuState,
      icons: initialState?.icons,
      page: initialState?.page,
      spinning: initialState?.spinning,
      scrollTop: initialState?.scrollTop ?? 0,
      scrollLeft: initialState?.scrollLeft ?? 0,
      rowKey: initialState?.rowKey,
      selectedRowKey: initialState?.selectedRowKey,
      editable: initialState?.editable,
      showLineNumber: initialState?.showLineNumber,
      msg: initialState?.msg,
      getRowClassName: initialState?.getRowClassName,
      summary: initialState?.summary,
      reorder: initialState?.reorder,
      className: initialState?.className,
      style: initialState?.style,
      onClick: initialState?.onClick,
      onChangeColumns: initialState?.onChangeColumns,
      onChangeData: initialState?.onChangeData,
      onLoadMore: initialState?.onLoadMore,
      setInitialized: initialized => set({ initialized }),
      setIcons: icons => set({ icons }),
      setScrollTop: scrollTop => set({ scrollTop }),
      setScrollLeft: scrollLeft => set({ scrollLeft }),
      setScrollbar: scrollbar => set({ scrollbar }),
      setStatus: status => set({ status }),
      setPagination: pagination => set({ pagination }),
      setBottomBarHeight: bottomBarHeight => set({ bottomBarHeight }),
      setScroll: (scrollTop, scrollLeft) => set({ scrollTop, scrollLeft }),
      setColumns: columns => {
        const state = get();
        if (state.contextMenuState && state.columns !== columns) {
          state.contextMenuOptions?.onOpenChange?.(false, state.contextMenuState.target);
        }
        const session = state.cellInteractionSession;
        const currentColumn = session ? state.columns[session.cell.columnIndex] : undefined;
        const nextColumn = session ? columns[session.cell.columnIndex] : undefined;
        const columnKeyChanged =
          !!currentColumn && !!nextColumn && JSON.stringify(currentColumn.key) !== JSON.stringify(nextColumn.key);
        const editorKindChanged =
          session?.kind === 'editor' &&
          (currentColumn?.editor?.type !== nextColumn?.editor?.type ||
            (currentColumn?.editor?.type === 'plugin' &&
              nextColumn?.editor?.type === 'plugin' &&
              currentColumn.editor.id !== nextColumn.editor.id));
        const shouldCancelInteraction =
          !!session &&
          (!currentColumn ||
            !nextColumn ||
            currentColumn.columnId !== nextColumn.columnId ||
            columnKeyChanged ||
            nextColumn.editable === false ||
            editorKindChanged ||
            (session.kind === 'editorIcon' && !nextColumn.editorIcon));

        set(
          shouldCancelInteraction
            ? {
                columns,
                contextMenuState: undefined,
                editItemIndex: -1,
                editItemColIndex: -1,
                cellInteractionSession: undefined,
              }
            : { columns, contextMenuState: undefined },
        );
      },
      setColumnsGroup: columnsGroup => set({ columnsGroup }),
      setColumnGroups: columnGroups => set({ columnGroups }),
      setData: data => {
        const state = get();
        if (state.contextMenuState && state.data !== data) {
          state.contextMenuOptions?.onOpenChange?.(false, state.contextMenuState.target);
        }
        set({
          data,
          contextMenuState: undefined,
          editItemIndex: -1,
          editItemColIndex: -1,
          cellInteractionSession: undefined,
        });
      },
      setSourceData: sourceData => {
        const state = get();
        if (state.contextMenuState && state.sourceData !== sourceData) {
          state.contextMenuOptions?.onOpenChange?.(false, state.contextMenuState.target);
        }
        set({
          sourceData,
          contextMenuState: undefined,
          editItemIndex: -1,
          editItemColIndex: -1,
          cellInteractionSession: undefined,
        });
      },
      setProcessedData: ({ data, sourceData, sourceIndexByVisibleIndex, visibleIndexBySourceIndex }) => {
        const state = get();
        if (state.contextMenuState && (state.data !== data || state.sourceData !== sourceData)) {
          state.contextMenuOptions?.onOpenChange?.(false, state.contextMenuState.target);
        }
        const mappingUnchanged =
          state.sourceIndexByVisibleIndex.length === sourceIndexByVisibleIndex.length &&
          state.sourceIndexByVisibleIndex.every((sourceIndex, index) => sourceIndex === sourceIndexByVisibleIndex[index]);
        const preservesEditedRows = state.sourceData === sourceData && mappingUnchanged;
        set(
          preservesEditedRows
            ? { data, sourceData, sourceIndexByVisibleIndex, visibleIndexBySourceIndex, contextMenuState: undefined }
            : {
                data,
                sourceData,
                sourceIndexByVisibleIndex,
                visibleIndexBySourceIndex,
                contextMenuState: undefined,
                editItemIndex: -1,
                editItemColIndex: -1,
                cellInteractionSession: undefined,
              },
        );
      },
      setDataQuery: dataQuery => set({ dataQuery }),
      setDataControl: dataControl => set({ dataControl }),
      setColumnSort: (columnId, order) => {
        const dataControl = get().dataControl;
        const columns = get().columns;
        const col = columns.find(c => (c.columnId ?? getColumnId(c)) === columnId);
        const key = col?.key;

        if (dataControl) {
          const currentQuery = get().dataQuery ?? { sortParams: [], filterParams: [] };
          const nextQuery = applySortToQuery(currentQuery, columnId, key, order, dataControl.multiSort ?? false);
          dataControl.onChange(nextQuery, {
            type: 'sort',
            columnId,
            action: order ? 'apply' : 'clear',
          });
          const nextDrafts = { ...get().filterDrafts };
          delete nextDrafts[columnId];
          set({ activeToolboxColumnId: null, filterDrafts: nextDrafts });
          return;
        }

        // Fallback for legacy sort prop without dataControl
        const sort = get().sort;
        if (sort && col) {
          const colIdx = columns.findIndex(c => (c.columnId ?? getColumnId(c)) === columnId);
          if (colIdx > -1) {
            get().toggleColumnSort(colIdx);
          }
        }
        const nextDrafts = { ...get().filterDrafts };
        delete nextDrafts[columnId];
        set({ activeToolboxColumnId: null, filterDrafts: nextDrafts });
      },
      setFilterDraft: (columnId, filter) =>
        set(s => ({
          filterDrafts: {
            ...s.filterDrafts,
            [columnId]: filter,
          },
        })),
      applyColumnFilter: columnId => {
        const dataControl = get().dataControl;
        const draft = get().filterDrafts[columnId];
        if (!dataControl) return;

        const currentQuery = get().dataQuery ?? { sortParams: [], filterParams: [] };
        let nextQuery: BGridDataQuery;
        if (draft) {
          nextQuery = applyFilterToQuery(currentQuery, draft);
        } else {
          nextQuery = clearFilterFromQuery(currentQuery, columnId);
        }

        dataControl.onChange(nextQuery, {
          type: 'filter',
          columnId,
          action: draft ? 'apply' : 'clear',
        });
        const nextDrafts = { ...get().filterDrafts };
        delete nextDrafts[columnId];
        set({ activeToolboxColumnId: null, filterDrafts: nextDrafts });
      },
      clearColumnFilter: columnId => {
        const dataControl = get().dataControl;
        if (!dataControl) return;

        const currentQuery = get().dataQuery ?? { sortParams: [], filterParams: [] };
        const nextQuery = clearFilterFromQuery(currentQuery, columnId);

        const nextDrafts = { ...get().filterDrafts };
        delete nextDrafts[columnId];

        dataControl.onChange(nextQuery, {
          type: 'filter',
          columnId,
          action: 'clear',
        });
        set({ activeToolboxColumnId: null, filterDrafts: nextDrafts });
      },
      setActiveToolbox: columnId => {
        if (columnId === null) {
          set(s => {
            const nextDrafts = { ...s.filterDrafts };
            if (s.activeToolboxColumnId) delete nextDrafts[s.activeToolboxColumnId];
            return { activeToolboxColumnId: null, filterDrafts: nextDrafts };
          });
          return;
        }

        const appliedFilter = get().dataQuery?.filterParams.find(f => f.columnId === columnId);
        const currentState = get();
        currentState.contextMenuOptions?.onOpenChange?.(false, currentState.contextMenuState?.target);
        if (currentState.searchOpen) {
          currentState.searchOptions?.onOpenChange?.(false, 'surfaceConflict');
        }
        set(s => ({
          activeToolboxColumnId: columnId,
          contextMenuState: undefined,
          ...(s.searchOptions?.open === undefined
            ? {
                searchOpen: false,
                searchStatus: 'idle' as const,
                searchMatches: [],
                activeSearchMatchIndex: undefined,
              }
            : {}),
          filterDrafts: Object.keys(s.filterDrafts).reduce(
            (drafts, draftColumnId) => {
              if (draftColumnId !== s.activeToolboxColumnId) {
                drafts[draftColumnId] = s.filterDrafts[draftColumnId];
              }
              return drafts;
            },
            { [columnId]: appliedFilter ? { ...appliedFilter } : undefined } as typeof s.filterDrafts,
          ),
        }));
      },
      setSearchOptions: (options?: BGridSearchOptions<T>) =>
        set(state => {
          if (!options || options.enabled === false) {
            return {
              searchOptions: options,
              searchOpen: false,
              searchStatus: 'idle',
              searchMatches: [],
              activeSearchMatchIndex: undefined,
            };
          }

          const searchOpen = options.open ?? state.searchOpen;
          return {
            searchOptions: options,
            searchOpen,
            searchQuery: options.query ?? state.searchQuery,
            ...(searchOpen
              ? {}
              : {
                  searchStatus: 'idle' as const,
                  searchMatches: [],
                  activeSearchMatchIndex: undefined,
                }),
          };
        }),
      setContextMenuOptions: (options?: BGridContextMenuOptions<T>) =>
        set(state => {
          if (options || !state.contextMenuState) return { contextMenuOptions: options };
          return { contextMenuOptions: options, contextMenuState: undefined };
        }),
      requestSearchOpen: (open: boolean, reason: BGridSearchOpenReason) => {
        const state = get();
        const options = state.searchOptions;
        if (open && (!options || options.enabled === false)) return;

        if (open) {
          state.contextMenuOptions?.onOpenChange?.(false, state.contextMenuState?.target);
          set({ activeToolboxColumnId: null, contextMenuState: undefined });
        }

        if (options?.open === undefined) {
          set(
            open
              ? { searchOpen: true }
              : {
                  searchOpen: false,
                  searchStatus: 'idle',
                  searchMatches: [],
                  activeSearchMatchIndex: undefined,
                },
          );
        }
        options?.onOpenChange?.(open, reason);
      },
      setSearchQuery: (query: string) => {
        const options = get().searchOptions;
        if (options?.query === undefined) {
          set({ searchQuery: query });
        }
        options?.onQueryChange?.(query);
      },
      setSearchStatus: status => set({ searchStatus: status }),
      setSearchResults: (matches: BGridSearchMatch[]) =>
        set(state => {
          const previous =
            state.activeSearchMatchIndex === undefined
              ? undefined
              : state.searchMatches[state.activeSearchMatchIndex];
          return {
            searchMatches: matches,
            activeSearchMatchIndex: findMatchingSearchResultIndex(
              matches,
              previous,
              state.activeSearchMatchIndex,
            ),
            searchStatus: 'ready',
          };
        }),
      moveSearchMatch: direction => {
        const state = get();
        if (state.searchMatches.length === 0) return undefined;
        const current = state.activeSearchMatchIndex ?? 0;
        const nextIndex =
          direction === 'next'
            ? (current + 1) % state.searchMatches.length
            : (current - 1 + state.searchMatches.length) % state.searchMatches.length;
        set({ activeSearchMatchIndex: nextIndex });
        return state.searchMatches[nextIndex];
      },
      clearSearchResults: () =>
        set({ searchStatus: 'idle', searchMatches: [], activeSearchMatchIndex: undefined }),
      openContextMenu: (contextMenuState: BGridContextMenuState<T>) => {
        const state = get();
        if (state.searchOpen) state.searchOptions?.onOpenChange?.(false, 'surfaceConflict');
        state.contextMenuOptions?.onOpenChange?.(true, contextMenuState.target);
        set({
          activeToolboxColumnId: null,
          contextMenuState,
          ...(state.searchOptions?.open === undefined
            ? {
                searchOpen: false,
                searchStatus: 'idle' as const,
                searchMatches: [],
                activeSearchMatchIndex: undefined,
              }
            : {}),
        });
      },
      closeContextMenu: () => {
        const state = get();
        if (!state.contextMenuState) return;
        state.contextMenuOptions?.onOpenChange?.(false, state.contextMenuState.target);
        set({ contextMenuState: undefined });
      },
      closeTransientSurfaces: except => {
        const state = get();
        if (except !== 'contextMenu' && state.contextMenuState) {
          state.contextMenuOptions?.onOpenChange?.(false, state.contextMenuState.target);
        }
        if (except !== 'search' && state.searchOpen) {
          state.searchOptions?.onOpenChange?.(false, 'surfaceConflict');
        }
        set({
          ...(except === 'toolbox' ? {} : { activeToolboxColumnId: null }),
          ...(except === 'contextMenu' ? {} : { contextMenuState: undefined }),
          ...(except === 'search' || state.searchOptions?.open !== undefined
            ? {}
            : {
                searchOpen: false,
                searchStatus: 'idle' as const,
                searchMatches: [],
                activeSearchMatchIndex: undefined,
              }),
        });
      },
      setCheckedIndexes: keys => {
        const rowKey = get().rowKey;
        const sourceData = get().sourceData.length > 0 ? get().sourceData : get().data;
        const data = get().data;
        const sourceIndexByVisibleIndex = get().sourceIndexByVisibleIndex;
        const checkedIndexesMap = get().checkedIndexesMap;
        const checkedIndexes: number[] = [];
        const checkedRowKeys: (string | number)[] = [];

        checkedIndexesMap.clear();
        keys.forEach(sourceIdx => {
          checkedIndexesMap.set(sourceIdx, true);
          const item = sourceData[sourceIdx];
          if (item) {
            checkedIndexes.push(sourceIdx);
            if (rowKey) {
              checkedRowKeys.push(getCellValueByRowKey(rowKey, item.values));
            }
          }
        });

        let visibleCheckedCount = 0;
        data.forEach((_, vi) => {
          const si = sourceIndexByVisibleIndex[vi] ?? vi;
          if (checkedIndexesMap.has(si)) visibleCheckedCount++;
        });

        const checkedAll: CheckedAll =
          data.length === 0
            ? false
            : visibleCheckedCount === data.length
            ? true
            : visibleCheckedCount > 0
            ? 'indeterminate'
            : false;

        set({ checkedIndexesMap: new Map([...checkedIndexesMap]), checkedAll });
        get().rowChecked?.onChange(checkedIndexes, checkedRowKeys, checkedAll);
      },
      setCheckedAll: checkedAll => {
        const rowKey = get().rowKey;
        const data = get().data;
        const sourceData = get().sourceData.length > 0 ? get().sourceData : get().data;
        const sourceIndexByVisibleIndex = get().sourceIndexByVisibleIndex;
        const checkedIndexesMap = get().checkedIndexesMap;

        if (checkedAll === true) {
          data.forEach((v, vi) => {
            v.checked = true;
            const si = sourceIndexByVisibleIndex[vi] ?? vi;
            checkedIndexesMap.set(si, true);
          });
        } else {
          data.forEach((v, vi) => {
            v.checked = false;
            const si = sourceIndexByVisibleIndex[vi] ?? vi;
            checkedIndexesMap.delete(si);
          });
        }

        const checkedIndexes: number[] = [];
        const checkedRowKeys: (string | number)[] = [];
        checkedIndexesMap.forEach((_, si) => {
          checkedIndexes.push(si);
          const item = sourceData[si];
          if (item && rowKey) {
            checkedRowKeys.push(getCellValueByRowKey(rowKey, item.values));
          }
        });

        let visibleCheckedCount = 0;
        data.forEach((_, vi) => {
          const si = sourceIndexByVisibleIndex[vi] ?? vi;
          if (checkedIndexesMap.has(si)) visibleCheckedCount++;
        });

        const nextCheckedAll: CheckedAll =
          data.length === 0
            ? false
            : visibleCheckedCount === data.length
            ? true
            : visibleCheckedCount > 0
            ? 'indeterminate'
            : false;

        set({ checkedIndexesMap: new Map([...checkedIndexesMap]), checkedAll: nextCheckedAll, data: [...get().data] });
        get().rowChecked?.onChange(checkedIndexes, checkedRowKeys, nextCheckedAll);
      },
      setRowChecked: rowChecked => {
        set({ rowChecked });
      },
      setCheckedIndexesMap: checkedIndexesMap => {
        const data = get().data;
        const sourceIndexByVisibleIndex = get().sourceIndexByVisibleIndex;

        let visibleCheckedCount = 0;
        data.forEach((_, vi) => {
          const si = sourceIndexByVisibleIndex[vi] ?? vi;
          if (checkedIndexesMap.has(si)) visibleCheckedCount++;
        });

        const checkedAll: CheckedAll =
          data.length === 0
            ? false
            : visibleCheckedCount === data.length
            ? true
            : visibleCheckedCount > 0
            ? 'indeterminate'
            : false;

        set({ checkedIndexesMap, checkedAll });
      },
      setColumnWidth: (columnIndex, options) => {
        const currentColumns = get().columns;
        const columnsGroup = get().columnsGroup;
        const columnGroups = get().columnGroups;
        const columnResizing = get().columnResizing;
        const frozenColumnIndex = get().frozenColumnIndex;

        const { width, updateColumns } = options ?? {};
        const notifyColumnsChanged = (columns: AppModelColumn<T>[]) => {
          get().onChangeColumns?.(columnIndex, {
            width: columns[columnIndex].width,
            columns,
            columnsGroup,
            columnGroups,
          });
        };

        if (width !== undefined) {
          let updated = false;
          const columns = currentColumns.map(column => ({ ...column }));

          if (columns[columnIndex]) {
            const _columnWidth = columns[columnIndex].width;
            columns[columnIndex].width = width;

            let mainLeft = 0;
            for (let i = 0; i < columns.length; i++) {
              if (i < frozenColumnIndex) {
                columns[i].left = -1;
                continue;
              }

              columns[i].left = mainLeft;
              mainLeft += columns[i].width ?? 100;
            }

            if (columnIndex < frozenColumnIndex) {
              const frozenColumnsWidth = getFrozenColumnsWidth({
                showLineNumber: get().showLineNumber,
                rowChecked: get().rowChecked,
                itemHeight: get().itemHeight,
                frozenColumnIndex: get().frozenColumnIndex,
                columns,
                dataLength: get().data.length,
                reorderable: get().reorder?.enabled,
              });

              if (frozenColumnsWidth + 20 > get().width) {
                columns[columnIndex].width = _columnWidth;
              } else {
                set({ columns: [...columns], frozenColumnsWidth });
                updated = true;
              }
            } else {
              set({ columns: [...columns] });
              updated = true;
            }
          }

          if (updated && (updateColumns || columnResizing)) {
            notifyColumnsChanged(columns);
          }
        } else {
          if (updateColumns || columnResizing) {
            notifyColumnsChanged(currentColumns);
          }
        }
      },
      setColumnResizing: columnResizing => set({ columnResizing }),
      toggleColumnSort: columnIndex => {
        const columns = get().columns;
        const column = columns[columnIndex];
        if (!column) return;

        const dataControl = get().dataControl;
        const columnId = getColumnId(column);

        if (dataControl) {
          const dataQuery = get().dataQuery;
          const currentSort = (dataQuery?.sortParams ?? []).find(s => (s.columnId ?? s.key) === columnId);
          const nextOrder = !currentSort ? 'asc' : currentSort.orderBy === 'asc' ? 'desc' : null;
          get().setColumnSort(columnId, nextOrder);
          return;
        }

        const currentSortParams = get().sortParams ?? {};
        const columnKey = Array.isArray(column.key) ? column.key.join('.') : column.key;
        const nextSortParams: Record<string, BGridSortParam> = { ...currentSortParams };

        if (nextSortParams[columnKey]) {
          if (nextSortParams[columnKey].orderBy === 'asc') {
            nextSortParams[columnKey] = {
              ...nextSortParams[columnKey],
              orderBy: 'desc',
            };
          } else {
            delete nextSortParams[columnKey];
          }
        } else {
          nextSortParams[columnKey] = {
            key: columnKey,
            index: Object.keys(nextSortParams).length,
            orderBy: 'asc',
          };
        }

        const sortedList = Object.values(nextSortParams)
          .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
          .map((param, index) => ({ ...param, index }));

        const reindexedMap: Record<string, BGridSortParam> = {};
        sortedList.forEach(p => {
          if (p.key) reindexedMap[p.key] = p;
        });

        set({ sortParams: reindexedMap });
        get().sort?.onChange?.(sortedList);
      },
      setPage: page => {
        set({ page });
      },
      handleClick: (index, columnIndex) => {
        const state = get();
        if (columnIndex < 0) return;
        const logicalCell = resolveLogicalCell(state.data, state.cellMergeOptions, {
          rowIndex: index,
          columnIndex,
        });
        const sourceIndex = state.sourceIndexByVisibleIndex?.[logicalCell.cell.rowIndex] ?? logicalCell.cell.rowIndex;
        const item = state.data[logicalCell.cell.rowIndex];
        if (!item) return;

        state.onClick?.({
          index: sourceIndex,
          columnIndex: logicalCell.cell.columnIndex,
          item: item.values,
          column: state.columns[logicalCell.cell.columnIndex],
        });
      },
      setWidth: width => set({ width }),
      setHeight: height => set({ height }),
      setContentBodyHeight: contentBodyHeight => set({ contentBodyHeight }),
      setDisplayItemCount: displayItemCount => set({ displayItemCount }),
      setLoading: loading => set({ loading }),
      setSpinning: spinning => set({ spinning }),

      setHeaderHeight: headerHeight => set({ headerHeight }),
      setFooterHeight: footerHeight => set({ footerHeight }),
      setSummaryHeight: summaryHeight => set({ summaryHeight }),
      setItemHeight: itemHeight => set({ itemHeight }),
      setItemPadding: itemPadding => set({ itemPadding }),
      setFrozenColumnIndex: frozenColumnIndex => set({ frozenColumnIndex }),
      setFrozenRowCount: frozenRowCount => set({ frozenRowCount }),
      setFrozenRowsHeight: frozenRowsHeight => set({ frozenRowsHeight }),
      setSort: sort => set({ sort }),
      setSortParams: sortParams => set({ sortParams }),
      setFrozenColumnsWidth: frozenColumnsWidth => set({ frozenColumnsWidth }),
      setRowKey: rowKey => set({ rowKey }),
      setSelectedRowKey: selectedRowKey => set({ selectedRowKey }),
      setEditable: editable =>
        set(
          editable
            ? { editable }
            : {
                editable,
                editItemIndex: -1,
                editItemColIndex: -1,
                cellInteractionSession: undefined,
              },
        ),
      setEditItem: (index, columnIndex) => {
        if (index < 0 || columnIndex < 0) {
          get().endCellEdit();
          return;
        }
        get().beginCellEdit({ rowIndex: index, columnIndex }, 'preserve');
      },
      beginCellEdit: (cell, mode = 'preserve', activation = 'cell') => {
        const state = get();
        const logicalCell = resolveLogicalCell(state.data, state.cellMergeOptions, cell);
        const item = state.data[logicalCell.cell.rowIndex];
        const column = state.columns[logicalCell.cell.columnIndex];
        if (
          !item ||
          !column ||
          !state.editable ||
          column.editable === false ||
          item.status === BGridDataItemStatus.remove
        ) {
          return;
        }

        const sourceIndexes = logicalCell.rowIndexes.map(
          visibleIndex => state.sourceIndexByVisibleIndex?.[visibleIndex] ?? visibleIndex,
        );
        if (sourceIndexes.some(sourceIndex => sourceIndex < 0 || sourceIndex >= state.sourceData.length)) return;

        const currentSession = state.cellInteractionSession;
        if (
          currentSession?.kind === 'editor' &&
          currentSession.cell.rowIndex === logicalCell.cell.rowIndex &&
          currentSession.cell.columnIndex === logicalCell.cell.columnIndex &&
          currentSession.mode === mode
        ) {
          return;
        }

        const originalValue = getCellValueByRowKey(column.key, item.values);
        const sessionId = ++editSessionIdRef.current;
        state.contextMenuOptions?.onOpenChange?.(false, state.contextMenuState?.target);
        if (state.searchOpen) state.searchOptions?.onOpenChange?.(false, 'surfaceConflict');
        set({
          activeCell: logicalCell.cell,
          activeCellHost: cell,
          editItemIndex: cell.rowIndex,
          editItemColIndex: cell.columnIndex,
          cellSelectionRange: undefined,
          cellSelectionRanges: [],
          cellSelecting: false,
          contextMenuState: undefined,
          ...(state.searchOptions?.open === undefined
            ? {
                searchOpen: false,
                searchStatus: 'idle' as const,
                searchMatches: [],
                activeSearchMatchIndex: undefined,
              }
            : {}),
          cellInteractionSession: {
            id: sessionId,
            kind: 'editor',
            phase: 'active',
            cell: logicalCell.cell,
            hostCell: cell,
            rowScope: {
              merged: logicalCell.merged,
              visibleIndexes: logicalCell.rowIndexes,
              sourceIndexes,
            },
            mode,
            activation,
            originalValue,
          },
        });
      },
      beginEditorIconInteraction: cell => {
        const state = get();
        const logicalCell = resolveLogicalCell(state.data, state.cellMergeOptions, cell);
        const item = state.data[logicalCell.cell.rowIndex];
        const column = state.columns[logicalCell.cell.columnIndex];
        if (
          !item ||
          !column?.editorIcon ||
          !state.editable ||
          column.editable === false ||
          item.status === BGridDataItemStatus.remove
        ) {
          return undefined;
        }

        const sourceIndexes = logicalCell.rowIndexes.map(
          visibleIndex => state.sourceIndexByVisibleIndex?.[visibleIndex] ?? visibleIndex,
        );
        if (sourceIndexes.some(sourceIndex => sourceIndex < 0 || sourceIndex >= state.sourceData.length)) {
          return undefined;
        }

        const currentSession = state.cellInteractionSession;
        if (
          currentSession?.kind === 'editorIcon' &&
          currentSession.cell.rowIndex === logicalCell.cell.rowIndex &&
          currentSession.cell.columnIndex === logicalCell.cell.columnIndex
        ) {
          return undefined;
        }

        const session: BGridEditorIconSession = {
          id: ++editSessionIdRef.current,
          kind: 'editorIcon',
          phase: 'active',
          cell: logicalCell.cell,
          hostCell: cell,
          rowScope: {
            merged: logicalCell.merged,
            visibleIndexes: logicalCell.rowIndexes,
            sourceIndexes,
          },
        };
        state.contextMenuOptions?.onOpenChange?.(false, state.contextMenuState?.target);
        if (state.searchOpen) state.searchOptions?.onOpenChange?.(false, 'surfaceConflict');
        set({
          activeCell: logicalCell.cell,
          activeCellHost: cell,
          editItemIndex: -1,
          editItemColIndex: -1,
          cellSelectionRange: undefined,
          cellSelectionRanges: [],
          cellSelecting: false,
          contextMenuState: undefined,
          ...(state.searchOptions?.open === undefined
            ? {
                searchOpen: false,
                searchStatus: 'idle' as const,
                searchMatches: [],
                activeSearchMatchIndex: undefined,
              }
            : {}),
          cellInteractionSession: session,
        });
        return session;
      },
      endCellEdit: sessionId => {
        const currentSession = get().cellInteractionSession;
        if (sessionId !== undefined && currentSession?.id !== sessionId) return;
        set({
          editItemIndex: -1,
          editItemColIndex: -1,
          cellInteractionSession: undefined,
        });
      },
      cancelCellInteraction: sessionId => {
        const currentSession = get().cellInteractionSession;
        if (sessionId !== undefined && currentSession?.id !== sessionId) return;
        set({
          editItemIndex: -1,
          editItemColIndex: -1,
          cellInteractionSession: undefined,
        });
      },
      isCellEditSessionActive: sessionId => {
        const session = get().cellInteractionSession;
        return session?.kind === 'editor' && session.id === sessionId;
      },
      isCellInteractionSessionActive: sessionId => get().cellInteractionSession?.id === sessionId,
      requestCellCommit: async (request: BGridCellCommitRequest<T>) => {
        const initialState = get();
        const session = initialState.cellInteractionSession;
        if (!session || session.id !== request.sessionId || session.phase !== 'active') return;

        const originColumn = initialState.columns[session.cell.columnIndex];
        const originItem = initialState.data[session.cell.rowIndex];
        if (!originColumn || !originItem) throw new Error('[BGrid] The edit origin no longer exists.');

        set({
          cellInteractionSession: {
            ...session,
            phase: 'resolving',
          } as BGridCellInteractionSession,
        });

        let committed = false;
        let terminal: 'commit' | 'cancel' | undefined;
        let commitPromise: Promise<void> | undefined;

        const finalizeCommit = async (
          finalChanges: BGridCellCommitRequest<T>['changes'],
          finalOptions = request.options,
        ) => {
          const resolvingState = get();
          const activeSession = resolvingState.cellInteractionSession;
          if (!activeSession || activeSession.id !== request.sessionId) return;

          const resolvedChanges = resolveCellValueChanges(finalChanges, resolvingState.columns);
          set({
            cellInteractionSession: {
              ...activeSession,
              phase: 'committing',
            } as BGridCellInteractionSession,
          });

          const committingState = get();
          const currentSession = committingState.cellInteractionSession;
          if (!currentSession || currentSession.id !== request.sessionId) return;

          currentSession.rowScope.visibleIndexes.forEach((visibleIndex, index) => {
            const currentSourceIndex = committingState.sourceIndexByVisibleIndex?.[visibleIndex] ?? visibleIndex;
            if (currentSourceIndex !== currentSession.rowScope.sourceIndexes[index]) {
              throw new Error('[BGrid] The edited row mapping changed before commit.');
            }
            const row = committingState.data[visibleIndex];
            if (!row || row.status === BGridDataItemStatus.remove) {
              throw new Error('[BGrid] Removed or missing rows cannot be edited.');
            }
          });

          const nextData = [...committingState.data];
          const sourceData = committingState.sourceData.length > 0 ? committingState.sourceData : committingState.data;
          const nextSourceData = [...sourceData];
          const callbacks: Array<{
            sourceIndex: number;
            item: BGridDataItem<T>;
            changes: BGridCellCommitRequest<T>['changes'];
            columns: AppModelColumn<T>[];
          }> = [];

          currentSession.rowScope.visibleIndexes.forEach((visibleIndex, index) => {
            const sourceIndex = currentSession.rowScope.sourceIndexes[index];
            if (sourceIndex < 0 || sourceIndex >= nextSourceData.length) {
              throw new Error('[BGrid] The edited source row no longer exists.');
            }
            const applied = applyChangesToItem(committingState.data[visibleIndex], resolvedChanges);
            if (applied.changes.length === 0) return;
            nextData[visibleIndex] = applied.item;
            nextSourceData[sourceIndex] = applied.item;
            callbacks.push({
              sourceIndex,
              item: applied.item,
              changes: applied.changes,
              columns: applied.columns,
            });
          });

          set({
            data: nextData,
            sourceData: nextSourceData,
            editItemIndex: -1,
            editItemColIndex: -1,
            cellInteractionSession: undefined,
          });
          committed = true;

          callbacks.forEach(callback => {
            const singleColumn = callback.columns.length === 1 ? callback.columns[0] : undefined;
            const columnIndex = singleColumn ? committingState.columns.indexOf(singleColumn) : null;
            try {
              committingState.onChangeData?.(
                callback.sourceIndex,
                columnIndex,
                callback.item.values,
                singleColumn ?? null,
                {
                  source: request.source,
                  originColumn,
                  changes: callback.changes,
                  dataItem: callback.item,
                  transaction: {
                    merged: currentSession.rowScope.merged,
                    canonicalCell: currentSession.cell,
                    visibleIndexes: currentSession.rowScope.visibleIndexes,
                    sourceIndexes: currentSession.rowScope.sourceIndexes,
                  },
                },
              );
            } catch (error) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn('[BGrid] onChangeData callback failed after the edit was committed.', error);
              }
            }
          });

          if (finalOptions?.move) {
            get().moveActiveCell(finalOptions.move, { extendSelection: false });
          }
        };

        const commit = (
          finalChanges: BGridCellCommitRequest<T>['changes'],
          finalOptions = request.options,
        ) => {
          if (terminal) return commitPromise ?? Promise.resolve();
          terminal = 'commit';
          commitPromise = finalizeCommit(finalChanges, finalOptions);
          return commitPromise;
        };
        const cancel = () => {
          if (terminal) return;
          terminal = 'cancel';
          get().cancelCellInteraction(request.sessionId);
        };

        try {
          const proposedChanges = resolveCellValueChanges(request.changes, initialState.columns);
          const rows = session.rowScope.visibleIndexes.map((visibleIndex, index) => {
            const item = initialState.data[visibleIndex];
            if (!item || item.status === BGridDataItemStatus.remove) {
              throw new Error('[BGrid] Removed or missing rows cannot be edited.');
            }
            return {
              index: visibleIndex,
              sourceIndex: session.rowScope.sourceIndexes[index],
              item,
              values: item.values,
              nextValues: createNextValues(item.values, proposedChanges),
            };
          });
          const anchorRow = rows.find(row => row.index === session.cell.rowIndex) ?? rows[0];
          if (!anchorRow) throw new Error('[BGrid] The edit origin row no longer exists.');

          if (originColumn.onChangeValue) {
            await originColumn.onChangeValue({
              source: request.source,
              column: originColumn,
              index: session.cell.rowIndex,
              columnIndex: session.cell.columnIndex,
              item: anchorRow.item,
              values: anchorRow.values,
              nextValues: anchorRow.nextValues,
              changes: request.changes,
              rows,
              commit,
              cancel,
            });
            if (!terminal) {
              if (process.env.NODE_ENV !== 'production') {
                console.warn('[BGrid] onChangeValue finished without calling commit() or cancel().');
              }
              cancel();
            }
            if (commitPromise) await commitPromise;
          } else {
            await commit(request.changes, request.options);
          }
        } catch (error) {
          if (committed) return;
          const currentSession = get().cellInteractionSession;
          if (request.source === 'editorIcon') {
            get().cancelCellInteraction(request.sessionId);
          } else if (currentSession?.id === request.sessionId) {
            set({
              cellInteractionSession: {
                ...currentSession,
                phase: 'active',
              } as BGridCellInteractionSession,
            });
          }
          throw error;
        }
      },
      commitCheckboxCell: async (rowIndex, columnIndex, checked) => {
        const state = get();
        const column = state.columns[columnIndex];
        const config = column?.editor?.type === 'checkbox' ? column.editor : undefined;
        if (!column || !config || !state.editable || column.editable === false) return;

        const logicalCell = resolveLogicalCell(state.data, state.cellMergeOptions, { rowIndex, columnIndex });
        const isDisabled = logicalCell.rowIndexes.some(visibleIndex => {
          const item = state.data[visibleIndex];
          if (!item || item.status === BGridDataItemStatus.remove) return true;
          const sourceIndex = state.sourceIndexByVisibleIndex?.[visibleIndex] ?? visibleIndex;
          return isCheckboxEditorDisabled(
            config,
            createCheckboxEditorContext({
              index: visibleIndex,
              sourceIndex,
              columnIndex,
              column,
              item,
              value: getCellValueByRowKey(column.key, item.values),
            }),
          );
        });
        if (isDisabled) return;

        get().beginCellEdit({ rowIndex, columnIndex }, 'preserve');
        const session = get().cellInteractionSession;
        if (session?.kind !== 'editor' || session.cell.columnIndex !== columnIndex) return;

        try {
          await get().requestCellCommit({
            sessionId: session.id,
            source: 'checkbox',
            changes: [
              {
                columnId: column.columnId,
                value: checked ? getCheckboxTrueValue(config) : getCheckboxFalseValue(config),
              },
            ],
          });
        } catch (error) {
          get().cancelCellInteraction(session.id);
          throw error;
        }
      },
      commitCheckboxColumn: async (columnIndex, checked) => {
        const state = get();
        const column = state.columns[columnIndex];
        const config = column?.editor?.type === 'checkbox' ? column.editor : undefined;
        if (!column || !config || !config.header || !state.editable || column.editable === false) return;
        if (typeof config.header === 'object' && config.header.disabled) return;

        const rowIndexes: number[] = [];
        const canonicalIndexes = new Set<number>();
        state.data.forEach((_item, visibleIndex) => {
          const logicalCell = resolveLogicalCell(state.data, state.cellMergeOptions, {
            rowIndex: visibleIndex,
            columnIndex,
          });
          const canonicalIndex = logicalCell.cell.rowIndex;
          if (canonicalIndexes.has(canonicalIndex)) return;
          canonicalIndexes.add(canonicalIndex);

          let needsChange = false;
          const eligible = logicalCell.rowIndexes.every(index => {
            const item = state.data[index];
            if (!item || item.status === BGridDataItemStatus.remove) return false;
            const sourceIndex = state.sourceIndexByVisibleIndex?.[index] ?? index;
            const value = getCellValueByRowKey(column.key, item.values);
            if (isCheckboxValueChecked(config, value) !== checked) needsChange = true;
            return !isCheckboxEditorDisabled(
              config,
              createCheckboxEditorContext({
                index,
                sourceIndex,
                columnIndex,
                column,
                item,
                value,
              }),
            );
          });
          if (eligible && needsChange) rowIndexes.push(canonicalIndex);
        });

        for (const visibleIndex of rowIndexes) {
          await get().commitCheckboxCell(visibleIndex, columnIndex, checked);
        }
      },
      setOnClick: onClick => set({ onClick }),
      setOnChangeColumns: onChangeColumns => set({ onChangeColumns }),
      setOnChangeData: onChangeData => set({ onChangeData }),
      setOnLoadMore: onLoadMore => set({ onLoadMore }),
      setShowLineNumber: showLineNumber => set({ showLineNumber }),
      setMsg: msg => set({ msg }),
      setDisplayPaginationLength: length => set({ displayPaginationLength: length }),
      setRowClassName: getRowClassName => set({ getRowClassName }),
      setEditTrigger: editTrigger => set({ editTrigger }),
      setCellMergeOptions: cellMergeOptions => set({ cellMergeOptions }),
      setVariant: variant => set({ variant }),
      setSummary: summary => set({ summary }),
      setColumnSortable: columnSortable => set({ columnSortable }),
      sortColumn: (trLevel, oldColumn, newColumn) => {
        const nestedColumnGroups = get().columnGroups;
        if (nestedColumnGroups.length > 0) {
          const columns = [...get().columns];
          const oldItem = columns[oldColumn.columnIndex];
          const newItem = columns[newColumn.columnIndex];
          if (!oldItem || !newItem) return;

          const oldParentId = findColumnGroupParent(nestedColumnGroups, oldItem.columnId);
          const newParentId = findColumnGroupParent(nestedColumnGroups, newItem.columnId);
          if (oldParentId !== newParentId) return;

          const movedColumn = columns.splice(oldColumn.columnIndex, 1)[0];
          columns.splice(newColumn.columnIndex, 0, movedColumn);
          const columnOrderById = new Map(columns.map((column, index) => [column.columnId, index]));
          const nextColumnGroups = reorderColumnGroupTree(nestedColumnGroups, columnOrderById);

          if (get().onChangeColumns) {
            get().onChangeColumns?.(null, {
              columns,
              columnsGroup: get().columnsGroup,
              columnGroups: nextColumnGroups,
            });
          } else {
            get().setColumns(columns);
            get().setColumnGroups(nextColumnGroups);
          }
          return;
        }

        const columnsGroup = structuredClone(get().columnsGroup);
        const columns = [...get().columns];
        const columnMap: (SortedColumn | { group: BGridColumnGroup; children: SortedColumn[] })[] = [];

        if (trLevel === 0) {
          get().columns.forEach((c, i) => {
            const cg = columnsGroup.find(cg => {
              return cg.groupStartIndex <= i && cg.groupEndIndex >= i;
            });

            if (cg) {
              const cgm = columnMap[cg.groupStartIndex];
              if (cgm && 'group' in cgm) {
                cgm.children.push({
                  index: i,
                  columnIndex: i,
                });
              } else {
                columnMap[cg.groupStartIndex] = {
                  group: cg,
                  children: [
                    {
                      index: i,
                      columnIndex: i,
                    },
                  ],
                };
              }
            } else {
              columnMap.push({
                index: i,
                columnIndex: i,
              });
            }
          });

          const cc = columnMap.splice(oldColumn.index, 1)[0];
          columnMap.splice(newColumn.index, 0, cc);

          const newColumnsGroup: BGridColumnGroup[] = [];
          const newColumns: AppModelColumn<any>[] = [];

          columnMap.forEach((c, i) => {
            if ('group' in c) {
              newColumnsGroup.push({
                ...c.group,
                groupStartIndex: i,
                groupEndIndex: i + c.children.length - 1,
              });

              c.children.forEach(cg => {
                newColumns.push(columns[cg.index]);
              });
            } else {
              newColumns.push(columns[c.index]);
            }
          });

          if (get().onChangeColumns) {
            get().onChangeColumns?.(null, {
              columns: newColumns,
              columnsGroup: newColumnsGroup,
            });
          } else {
            get().setColumns(newColumns);
            get().setColumnsGroup(newColumnsGroup);
          }
        } else {
          const cc = columns.splice(oldColumn.columnIndex, 1)[0];
          columns.splice(newColumn.columnIndex, 0, cc);

          if (get().onChangeColumns) {
            get().onChangeColumns?.(null, {
              columns,
              columnsGroup,
            });
          } else {
            get().setColumns(columns);
          }
        }
      },
      setReorder: reorder => set({ reorder }),
      setClassName: className => set({ className }),
      setStyle: style => set({ style }),
      setReorderingInfo: reorderingInfo => set({ reorderingInfo }),
      setActiveCell: (activeCell, hostCell = activeCell) => {
        const state = get();
        const normalizedCell = activeCell
          ? resolveLogicalCell(state.data, state.cellMergeOptions, activeCell).cell
          : undefined;
        const normalizedHostCell = hostCell
          ? clampCellAddress(hostCell, state.data.length, state.columns.length)
          : undefined;
        const contextMenuCell = state.contextMenuState?.target.cell;
        const shouldCloseContextMenu =
          !!contextMenuCell &&
          (!normalizedCell ||
            normalizedCell.rowIndex !== contextMenuCell.rowIndex ||
            normalizedCell.columnIndex !== contextMenuCell.columnIndex);
        activeCellNavigationRowRef.current = activeCell?.rowIndex;
        lastNavigationCellRef.current = undefined;
        const cellNavigationOptions = state.cellNavigationOptions;
        if (shouldCloseContextMenu) {
          state.contextMenuOptions?.onOpenChange?.(false, state.contextMenuState?.target);
        }
        if (cellNavigationOptions?.activeCell === undefined || shouldCloseContextMenu) {
          set({
            ...(cellNavigationOptions?.activeCell === undefined
              ? { activeCell: normalizedCell, activeCellHost: normalizedHostCell }
              : {}),
            ...(shouldCloseContextMenu ? { contextMenuState: undefined } : {}),
          });
        }
        cellNavigationOptions?.onActiveCellChange?.(normalizedCell);
      },
      setCellNavigationOptions: cellNavigationOptions => {
        const updates: Partial<AppModel<T>> = { cellNavigationOptions };
        if (cellNavigationOptions?.activeCell !== undefined) {
          updates.activeCell = cellNavigationOptions.activeCell;
          updates.activeCellHost = cellNavigationOptions.activeCell;
          if (!cellsEqual(lastNavigationCellRef.current, cellNavigationOptions.activeCell)) {
            activeCellNavigationRowRef.current = cellNavigationOptions.activeCell.rowIndex;
          }
        } else if (get().activeCell === undefined && cellNavigationOptions?.defaultActiveCell !== undefined) {
          updates.activeCell = cellNavigationOptions.defaultActiveCell;
          updates.activeCellHost = cellNavigationOptions.defaultActiveCell;
          activeCellNavigationRowRef.current = cellNavigationOptions.defaultActiveCell.rowIndex;
        }
        set(updates);
      },
      syncActiveCellToBounds: () => {
        const state = get();
        const requestedCell =
          state.cellNavigationOptions?.activeCell ?? state.activeCell ?? state.cellNavigationOptions?.defaultActiveCell;

        if (!requestedCell || state.data.length === 0 || state.columns.length === 0) {
          if (state.activeCell !== undefined) set({ activeCell: undefined, activeCellHost: undefined });
          return;
        }

        const clampedCell = clampCellAddress(requestedCell, state.data.length, state.columns.length);
        const nextCell = resolveLogicalCell(state.data, state.cellMergeOptions, clampedCell).cell;
        if (!cellsEqual(lastNavigationCellRef.current, nextCell)) {
          activeCellNavigationRowRef.current = clampedCell.rowIndex;
        } else if (activeCellNavigationRowRef.current !== undefined) {
          activeCellNavigationRowRef.current = Math.min(
            Math.max(activeCellNavigationRowRef.current, 0),
            state.data.length - 1,
          );
        }
        if (
          state.activeCell?.rowIndex !== nextCell.rowIndex ||
          state.activeCell?.columnIndex !== nextCell.columnIndex
        ) {
          set({ activeCell: nextCell, activeCellHost: clampedCell });
        }
      },
      moveActiveCell: (direction, options) => {
        const state = get();
        const data = state.data;
        const columns = state.columns;
        if (!data || data.length === 0 || !columns || columns.length === 0) return;
        if (state.cellNavigationOptions?.enabled === false) return;

        const currentCell = state.activeCell ?? { rowIndex: 0, columnIndex: 0 };
        const currentLogicalCell = resolveLogicalCell(data, state.cellMergeOptions, currentCell);
        const preferredRowIndex = activeCellNavigationRowRef.current;
        const hasPreferredRowInCurrentCell =
          preferredRowIndex !== undefined &&
          preferredRowIndex >= currentLogicalCell.rowRange.startRowIndex &&
          preferredRowIndex <= currentLogicalCell.rowRange.endRowIndex;
        const preservesRow =
          direction === 'left' ||
          direction === 'right' ||
          direction === 'home' ||
          direction === 'end' ||
          direction === 'next' ||
          direction === 'prev';
        let rowIndex = preservesRow && hasPreferredRowInCurrentCell ? preferredRowIndex : currentCell.rowIndex;
        let { columnIndex } = currentCell;
        const rowCount = data.length;
        const colCount = columns.length;
        const wrap = state.cellNavigationOptions?.wrap ?? false;

        switch (direction) {
          case 'up':
            if (options?.toBoundary) {
              rowIndex = 0;
            } else {
              rowIndex = wrap && rowIndex === 0 ? rowCount - 1 : Math.max(0, rowIndex - 1);
            }
            break;
          case 'down':
            if (options?.toBoundary) {
              rowIndex = rowCount - 1;
            } else {
              rowIndex = wrap && rowIndex === rowCount - 1 ? 0 : Math.min(rowCount - 1, rowIndex + 1);
            }
            break;
          case 'left':
            if (options?.toBoundary) {
              columnIndex = 0;
            } else {
              columnIndex = wrap && columnIndex === 0 ? colCount - 1 : Math.max(0, columnIndex - 1);
            }
            break;
          case 'right':
            if (options?.toBoundary) {
              columnIndex = colCount - 1;
            } else {
              columnIndex = wrap && columnIndex === colCount - 1 ? 0 : Math.min(colCount - 1, columnIndex + 1);
            }
            break;
          case 'home':
            if (options?.toBoundary) {
              rowIndex = 0;
              columnIndex = 0;
            } else {
              columnIndex = 0;
            }
            break;
          case 'end':
            if (options?.toBoundary) {
              rowIndex = rowCount - 1;
              columnIndex = colCount - 1;
            } else {
              columnIndex = colCount - 1;
            }
            break;
          case 'pageUp': {
            const pageSize = options?.pageSize ?? Math.max(1, state.displayItemCount || 10);
            rowIndex = Math.max(0, rowIndex - pageSize);
            break;
          }
          case 'pageDown': {
            const pageSize = options?.pageSize ?? Math.max(1, state.displayItemCount || 10);
            rowIndex = Math.min(rowCount - 1, rowIndex + pageSize);
            break;
          }
          case 'next': {
            if (columnIndex < colCount - 1) {
              columnIndex += 1;
            } else if (rowIndex < rowCount - 1) {
              rowIndex += 1;
              columnIndex = 0;
            } else if (wrap) {
              rowIndex = 0;
              columnIndex = 0;
            }
            break;
          }
          case 'prev': {
            if (columnIndex > 0) {
              columnIndex -= 1;
            } else if (rowIndex > 0) {
              rowIndex -= 1;
              columnIndex = colCount - 1;
            } else if (wrap) {
              rowIndex = rowCount - 1;
              columnIndex = colCount - 1;
            }
            break;
          }
          case 'first':
            rowIndex = 0;
            columnIndex = 0;
            break;
          case 'last':
            rowIndex = rowCount - 1;
            columnIndex = colCount - 1;
            break;
        }

        // Normalize for merged cells and skip the current group when moving down.
        let navigationRowIndex = rowIndex;
        const columnsMap = state.cellMergeOptions?.columnsMap;
        if (columnsMap?.[columnIndex]) {
          const mergeBy = columnsMap[columnIndex].mergeBy;
          const currentRange = getMergedRowRange(data, mergeBy, currentCell.rowIndex);

          if (
            !options?.toBoundary &&
            (direction === 'down' || direction === 'pageDown') &&
            currentCell.columnIndex === columnIndex &&
            rowIndex <= currentRange.endRowIndex &&
            currentRange.endRowIndex < rowCount - 1
          ) {
            rowIndex = currentRange.endRowIndex + 1;
          }

          navigationRowIndex = rowIndex;
          const targetRange = getMergedRowRange(data, mergeBy, rowIndex);
          rowIndex = targetRange.startRowIndex;
        }

        const clamped = clampCellAddress({ rowIndex, columnIndex }, rowCount, colCount);
        const newLogicalCell = resolveLogicalCell(data, state.cellMergeOptions, clamped);
        const newActiveCell: BGridCellAddress = newLogicalCell.cell;
        const newActiveCellHost = clampCellAddress(
          { rowIndex: navigationRowIndex, columnIndex },
          rowCount,
          colCount,
        );
        activeCellNavigationRowRef.current = newActiveCellHost.rowIndex;
        lastNavigationCellRef.current = newActiveCell;

        const isActiveCellControlled = state.cellNavigationOptions?.activeCell !== undefined;
        const cellSelectionEnabled = options?.selectionEnabled ?? true;
        if (!cellSelectionEnabled) {
          if (!isActiveCellControlled && !cellsEqual(state.activeCell, newActiveCell)) {
            set({ activeCell: newActiveCell, activeCellHost: newActiveCellHost });
          }
        } else if (options?.extendSelection) {
          const currentRange = state.cellSelectionRange ?? {
            startRowIndex: currentCell.rowIndex,
            startColumnIndex: currentCell.columnIndex,
            endRowIndex: currentCell.rowIndex,
            endColumnIndex: currentCell.columnIndex,
          };
          const newRange: BGridCellSelectionRange = {
            startRowIndex: currentRange.startRowIndex,
            startColumnIndex: currentRange.startColumnIndex,
            endRowIndex:
              newLogicalCell.rowRange.startRowIndex < currentRange.startRowIndex
                ? newLogicalCell.rowRange.startRowIndex
                : newLogicalCell.rowRange.endRowIndex,
            endColumnIndex: newActiveCell.columnIndex,
          };
          const baseRanges = state.cellSelectionRanges.length > 1 ? state.cellSelectionRanges.slice(0, -1) : [];
          const activeCellChanged = !isActiveCellControlled && !cellsEqual(state.activeCell, newActiveCell);
          const selectionChanged =
            !selectionRangesEqual(state.cellSelectionRange, newRange) ||
            state.cellSelectionRanges.length !== baseRanges.length + 1;
          if (activeCellChanged || selectionChanged) {
            set({
              ...(activeCellChanged ? { activeCell: newActiveCell, activeCellHost: newActiveCellHost } : {}),
              ...(selectionChanged
                ? { cellSelectionRange: newRange, cellSelectionRanges: [...baseRanges, newRange] }
                : {}),
            });
          }
        } else {
          const newRange: BGridCellSelectionRange = {
            startRowIndex: newLogicalCell.rowRange.startRowIndex,
            startColumnIndex: newActiveCell.columnIndex,
            endRowIndex: newLogicalCell.rowRange.endRowIndex,
            endColumnIndex: newActiveCell.columnIndex,
          };
          const activeCellChanged = !isActiveCellControlled && !cellsEqual(state.activeCell, newActiveCell);
          const selectionChanged =
            state.cellSelectionRanges.length !== 1 || !selectionRangesEqual(state.cellSelectionRange, newRange);
          if (activeCellChanged || selectionChanged) {
            set({
              ...(activeCellChanged ? { activeCell: newActiveCell, activeCellHost: newActiveCellHost } : {}),
              ...(selectionChanged ? { cellSelectionRange: newRange, cellSelectionRanges: [newRange] } : {}),
            });
          }
        }

        state.cellNavigationOptions?.onActiveCellChange?.(newActiveCell);
        return newActiveCell;
      },
      setCellSelectionRange: cellSelectionRange =>
        set({
          cellSelectionRange,
          cellSelectionRanges: cellSelectionRange ? [cellSelectionRange] : [],
        }),
      setCellSelectionRanges: cellSelectionRanges =>
        set({
          cellSelectionRange: cellSelectionRanges[cellSelectionRanges.length - 1],
          cellSelectionRanges,
        }),
      setCellSelecting: cellSelecting => set({ cellSelecting }),
      clearCellSelection: () => set({ cellSelectionRange: undefined, cellSelectionRanges: [], cellSelecting: false }),
    }));
  }
  return <StoreContext.Provider value={storeRef.current}>{children}</StoreContext.Provider>;
}

// @ts-ignore
export function useAppStore<T>(selector: (state: AppStore<any>) => T): T {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('Missing StoreProvider');
  }
  return useStore(store, selector);
}

export function useAppStoreApi<T = any>() {
  const store = useContext(StoreContext);
  if (!store) {
    throw new Error('Missing StoreProvider');
  }
  return store as StoreApi<AppStore<T>>;
}
