import React, { ReactNode } from 'react';

export type AlignDirection = 'left' | 'center' | 'right';
export type MoveDirection = 'prev' | 'next' | 'current';
export type BGridEditTrigger = 'click' | 'dblclick';

export const DIRC_MAP = {
  next: 1,
  prev: -1,
  current: 0,
};

export interface BGridItemRenderProps<T> {
  column: BGridColumn<T>;
  index: number;
  columnIndex: number;
  item: BGridDataItem<T>;
  values: T;
  value: any;
  editable?: boolean;
  handleSave?: (value: any, columnDirection?: MoveDirection, rowDirection?: MoveDirection) => void;
  handleCancel?: () => void;
  handleMove?: (columnDirection: MoveDirection, rowDirection: MoveDirection) => void;
}

export interface BGridTextEditorContext<T> {
  index: number;
  columnIndex: number;
  item: BGridDataItem<T>;
  values: T;
  column: BGridColumn<T>;
}

export interface BGridCheckboxEditorContext<T> extends BGridTextEditorContext<T> {
  sourceIndex: number;
  value: unknown;
}

export type BGridCellValueChange<T> =
  | {
      key: BGridColumn<T>['key'];
      columnId?: never;
      value: unknown;
    }
  | {
      columnId: string;
      key?: never;
      value: unknown;
    };

export interface BGridCommitOptions {
  move?: BGridCellMoveDirection;
}

export interface BGridCellCommitController<T> {
  commit: (changes: readonly BGridCellValueChange<T>[], options?: BGridCommitOptions) => Promise<void>;
  cancel: () => void;
}

export type BGridEditSource = 'text' | 'plugin' | 'checkbox' | 'itemRender' | 'editorIcon';

export interface BGridChangeValueRow<T> {
  index: number;
  sourceIndex: number;
  item: BGridDataItem<T>;
  values: T;
  nextValues: T;
}

export interface BGridChangeValueParams<T> extends BGridCellCommitController<T> {
  source: BGridEditSource;
  column: BGridColumn<T>;
  index: number;
  columnIndex: number;
  item: BGridDataItem<T>;
  values: T;
  nextValues: T;
  changes: readonly BGridCellValueChange<T>[];
  rows: readonly BGridChangeValueRow<T>[];
}

export interface BGridEditorIconParams<T> {
  column: BGridColumn<T>;
  index: number;
  columnIndex: number;
  item: BGridDataItem<T>;
  values: T;
  value: unknown;
  active: boolean;
}

export interface BGridEditorIconClickParams<T>
  extends BGridEditorIconParams<T>, BGridCellCommitController<T> {}

export type BGridEditorIconClickHandler<T> = (
  params: BGridEditorIconClickParams<T>,
) => void | (() => void) | Promise<void | (() => void)>;

export interface BGridEditorIconConfig<T> {
  render: React.ReactNode | ((params: BGridEditorIconParams<T>) => React.ReactNode);
  ariaLabel?: string | ((params: BGridEditorIconParams<T>) => string);
  visibility?: 'always' | 'hover' | 'active';
  onClick?: BGridEditorIconClickHandler<T>;
}

export interface BGridTextEditorConfig<T> {
  type: 'text';
  startOnInput?: boolean;
  commitOnBlur?: boolean;
  formatValue?: (value: unknown, context: BGridTextEditorContext<T>) => string;
  parseValue?: (text: string, context: BGridTextEditorContext<T>) => unknown;
  ariaLabel?: string | ((context: BGridTextEditorContext<T>) => string);
  inputProps?: Pick<
    React.InputHTMLAttributes<HTMLInputElement>,
    'placeholder' | 'maxLength' | 'inputMode' | 'autoComplete' | 'spellCheck'
  >;
}

export interface BGridCheckboxHeaderConfig {
  ariaLabel?: string;
  disabled?: boolean;
}

export interface BGridCheckboxEditorConfig<T> {
  type: 'checkbox';
  /** Value written when the checkbox is checked. Defaults to true. */
  trueValue?: unknown;
  /** Value written when the checkbox is unchecked. Defaults to false. */
  falseValue?: unknown;
  /** Shows a select-all control in the column header for the currently available rows. */
  header?: boolean | BGridCheckboxHeaderConfig;
  ariaLabel?: string | ((context: BGridCheckboxEditorContext<T>) => string);
  label?: ReactNode | ((context: BGridCheckboxEditorContext<T>) => ReactNode);
  disabled?: boolean | ((context: BGridCheckboxEditorContext<T>) => boolean);
}

export interface BGridEditorPluginProps<T> extends BGridTextEditorContext<T> {
  sessionId: number;
  value: unknown;
  mode: 'preserve' | 'replace';
  activation: BGridCellEditActivation;
  commit: BGridCellCommitController<T>['commit'];
  cancel: BGridCellCommitController<T>['cancel'];
  move: (direction: BGridCellMoveDirection) => void;
  getPortalContainer: () => HTMLElement;
}

export interface BGridPluginEditorConfig<T> {
  type: 'plugin';
  id: string;
  component: React.ComponentType<BGridEditorPluginProps<T>>;
}

export type BGridCellEditorConfig<T> =
  | BGridTextEditorConfig<T>
  | BGridCheckboxEditorConfig<T>
  | BGridPluginEditorConfig<T>;

export interface BGridCellClipboardTextParams<T> {
  column: BGridColumn<T>;
  index: number;
  columnIndex: number;
  item: BGridDataItem<T>;
  values: T;
  value: any;
}

export interface BGridCellClipboardParseParams<T> extends BGridCellClipboardTextParams<T> {
  /** Original text/plain value read from the clipboard for this cell. */
  text: string;
}

export interface BGridSearchCellParams<T> {
  cell: BGridCellAddress;
  visibleIndex: number;
  sourceIndex: number;
  rowKey?: React.Key;
  columnIndex: number;
  columnId: string;
  column: BGridColumn<T>;
  item: BGridDataItem<T>;
  values: T;
  value: unknown;
}

export interface BGridColumn<T> {
  id?: string;
  key: string | string[];
  label: ReactNode;
  width: number;
  align?: AlignDirection;
  headerAlign?: AlignDirection;
  sortDisable?: boolean;
  className?: string;
  getClassName?: (item: BGridDataItem<T>) => string;
  headerClassName?: string;
  headerStyle?: React.CSSProperties;
  itemRender?: React.FC<BGridItemRenderProps<T>>;
  editor?: BGridCellEditorConfig<T>;
  editTrigger?: BGridEditTrigger;
  editorIcon?: BGridEditorIconConfig<T>;
  onChangeValue?: (params: BGridChangeValueParams<T>) => void | Promise<void>;
  getClipboardText?: (params: BGridCellClipboardTextParams<T>) => any;
  /**
   * Restores text/plain clipboard input to the column's stored value type.
   * Takes precedence over a built-in text editor's parseValue during multi-cell paste.
   * Throw to keep the current cell value and report parseValueFailed through onPasteError.
   */
  parseClipboardText?: (text: string, params: BGridCellClipboardParseParams<T>) => unknown;
  searchable?: boolean;
  getSearchText?: (params: BGridSearchCellParams<T>) => unknown;
  editable?: boolean;
  toolbox?: boolean | BGridToolboxConfig<T>;
  filter?: false | BGridColumnFilterConfig<T>;
  sortComparator?: (
    a: unknown,
    b: unknown,
    params: {
      column: BGridColumn<T>;
      aItem: BGridDataItem<T>;
      bItem: BGridDataItem<T>;
    },
  ) => number;
}

export interface BGridColumnGroup {
  label: ReactNode;
  groupStartIndex: number;
  groupEndIndex: number;
  align?: AlignDirection;
  headerAlign?: AlignDirection;
}

export interface BGridColumnGroupNode {
  id: string;
  label: ReactNode;
  headerAlign?: AlignDirection;
  className?: string;
  headerStyle?: React.CSSProperties;
  children: Array<string | BGridColumnGroupNode>;
}

export interface BGridCellMergeColumn {
  wordWrap?: boolean;
  mergeBy: string | string[];
}

export interface BGridSummaryItemRenderProps<T> {
  column: BGridColumn<T>;
  columnIndex: number;
  data: BGridDataItem<T>[];
}

export interface BGridSummaryColumn<T> {
  columnIndex: number;
  align?: AlignDirection;
  colSpan?: number;
  className?: string;
  getClassName?: (key: string | string[]) => string;
  itemRender?: (props: BGridSummaryItemRenderProps<T>) => React.ReactNode;
}

export enum BGridDataItemStatus {
  new,
  edit,
  remove,
}

export type BGridDataItem<T> = {
  values: T;
  status?: BGridDataItemStatus;
  /** Column instances directly edited since the data owner last cleared the edit state. */
  editedColumnIds?: string[];
  /** Stable key tokens whose underlying values changed since the data owner last cleared the change state. */
  changedKeys?: string[];
  checked?: boolean;
  parentItemIndex?: number;
  meta?: Record<string, any>;
};

export interface BGridProcessedRow<T> {
  item: BGridDataItem<T>;
  sourceIndex: number;
  rowKey?: React.Key;
}

export interface BGridPage {
  currentPage?: number;
  pageSize?: number;
  totalPages?: number;
  totalElements?: number;
  loading?: boolean;
  onChange?: (currentPage: number, pageSize?: number) => void;
  displayPaginationLength?: number;
  statusRender?: () => void;
  paginationRender?: () => void;
}

export interface BGridRowChecked<T> {
  isRadio?: boolean;
  checkedIndexes?: number[];
  checkedRowKeys?: React.Key[];
  disabled?: (index: number, item: BGridDataItem<T>) => boolean;
  onChange: (checkedIndexes: number[], checkedRowKeys: React.Key[], checkedAll?: CheckedAll) => void;
}

export interface BGridSortParam {
  columnId?: string;
  key?: string;
  index?: number;
  orderBy: 'asc' | 'desc';
}

export interface BGridSortInfo {
  multiSort?: boolean;
  sortParams: BGridSortParam[];
  onChange: (sortParams: BGridSortParam[]) => void;
}

export type BGridFilterOperator = 'contains' | 'equals' | 'notEquals' | 'gt' | 'gte' | 'lt' | 'lte' | 'between';

export type BGridFilterValue = string | number | boolean | null;

interface BGridFilterParamBase {
  columnId: string;
  key: string | string[];
}

export type BGridFilterParam =
  | (BGridFilterParamBase & {
      type: 'values';
      values: BGridFilterValue[];
    })
  | (BGridFilterParamBase & {
      type: 'text';
      operator: 'contains' | 'equals' | 'notEquals';
      value: string;
    })
  | (BGridFilterParamBase & {
      type: 'number';
      operator: Exclude<BGridFilterOperator, 'contains'>;
      value?: number;
      min?: number;
      max?: number;
    });

export interface BGridDataQuery {
  sortParams: BGridSortParam[];
  filterParams: BGridFilterParam[];
}

export interface BGridDataQueryChangeEvent {
  type: 'sort' | 'filter';
  columnId: string;
  action: 'apply' | 'clear';
}

export interface BGridDataControl {
  mode?: 'manual' | 'client';
  multiSort?: boolean;
  query: BGridDataQuery;
  onChange: (query: BGridDataQuery, event: BGridDataQueryChangeEvent) => void;
}

export interface BGridColumnFilterConfig<T> {
  type: 'values' | 'text' | 'number';
  caseSensitive?: boolean;
  values?: BGridFilterValue[];
  getValue?: (item: BGridDataItem<T>) => unknown;
  predicate?: (params: { item: BGridDataItem<T>; value: unknown; filter: BGridFilterParam }) => boolean;
  formatValue?: (value: unknown) => React.ReactNode;
  maxValueListItems?: number;
}

export interface BGridToolboxItem<T> {
  id: string;
  label: React.ReactNode;
  disabled?: boolean;
  onClick: (params: { column: BGridColumn<T>; columnId: string; columnIndex: number }) => void;
}

export interface BGridToolboxRenderProps<T> {
  column: BGridColumn<T>;
  columnId: string;
  columnIndex: number;
  close: () => void;
}

export interface BGridToolboxIcons {
  sortAsc?: React.ReactNode;
  sortDesc?: React.ReactNode;
  filter?: React.ReactNode;
  filterBadge?: React.ReactNode;
  dropdown?: React.ReactNode;
  sortClear?: React.ReactNode;
}

export interface BGridToolboxConfig<T> {
  sort?: boolean;
  filter?: boolean;
  icons?: BGridToolboxIcons;
  extraItems?: BGridToolboxItem<T>[];
  render?: React.FC<BGridToolboxRenderProps<T>>;
}

export interface BGridClickParams<T> {
  index: number;
  columnIndex: number;
  item: T;
  column: BGridColumn<T>;
}

export interface BGridChangeColumnsInfo<T> {
  width?: number;
  columns: BGridColumn<T>[];
  columnsGroup?: BGridColumnGroup[];
  columnGroups?: BGridColumnGroupNode[];
}

export interface BGridReorderInfo<T> {
  enabled?: boolean;
  handleIcon?: React.ReactNode;
  onReorder?: (data: BGridDataItem<T>[]) => void | boolean;
}
export interface BGridReorderingInfo {
  fromIndex?: number;
  toIndex?: number;
  phase?: 'dragging' | 'settling' | 'cancelling';
  input?: 'pointer' | 'keyboard';
}

export interface BGridPivotField {
  key: string | string[];
  label?: ReactNode;
  width?: number;
  align?: AlignDirection;
  headerAlign?: AlignDirection;
  className?: string;
  headerClassName?: string;
  headerStyle?: React.CSSProperties;
}

export interface BGridPivotAggregateParams<T> {
  values: any[];
  items: BGridDataItem<T>[];
  rowValues: any[];
  columnValues: any[];
  value: BGridPivotValue<T>;
}

export type BGridPivotAggregate<T> =
  | 'sum'
  | 'count'
  | 'avg'
  | 'min'
  | 'max'
  | 'first'
  | ((params: BGridPivotAggregateParams<T>) => any);

export interface BGridPivotValue<T> extends BGridPivotField {
  aggregate?: BGridPivotAggregate<T>;
  itemRender?: React.FC<BGridPivotValueItemRenderProps<T>>;
  getClipboardText?: (params: BGridPivotValueClipboardTextParams<T>) => any;
}

export interface BGridPivotValueContext<T> {
  sourceItems: BGridDataItem<T>[];
  rowValues: any[];
  columnValues: any[];
  pivotValue: BGridPivotValue<T>;
  aggregate?: BGridPivotAggregate<T>;
}

export interface BGridPivotValueItemRenderProps<T>
  extends Omit<BGridItemRenderProps<Record<string, any>>, 'column'>,
    BGridPivotValueContext<T> {
  column: BGridColumn<Record<string, any>>;
}

export interface BGridPivotValueClipboardTextParams<T>
  extends Omit<BGridCellClipboardTextParams<Record<string, any>>, 'column'>,
    BGridPivotValueContext<T> {
  column: BGridColumn<Record<string, any>>;
}

export interface BGridPivotOptions<T> {
  enabled?: boolean;
  rows: BGridPivotField[];
  columns: BGridPivotField[];
  values: BGridPivotValue<T>[];
  columnLabelSeparator?: string;
  emptyValue?: ReactNode;
}

export interface BGridCellAddress {
  rowIndex: number;
  columnIndex: number;
}

export type BGridSearchOpenReason =
  | 'shortcut'
  | 'contextMenu'
  | 'external'
  | 'escape'
  | 'closeButton'
  | 'surfaceConflict';

export interface BGridSearchIcons {
  search?: React.ReactNode;
  previous?: React.ReactNode;
  next?: React.ReactNode;
  close?: React.ReactNode;
}

export interface BGridSearchLabels {
  inputAriaLabel?: string;
  placeholder?: string;
  previousAriaLabel?: string;
  nextAriaLabel?: string;
  closeAriaLabel?: string;
  searching?: string;
  noResults?: string;
  contextMenuItem?: React.ReactNode;
  formatResultCount?: (params: {
    activeResult: number;
    totalResults: number;
    loadedRowCount: number;
    paged: boolean;
  }) => React.ReactNode;
}

export interface BGridSearchOptions<T> {
  enabled?: boolean;
  shortcut?: boolean;
  contextMenu?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean, reason: BGridSearchOpenReason) => void;
  query?: string;
  defaultQuery?: string;
  onQueryChange?: (query: string) => void;
  getSearchText?: (params: BGridSearchCellParams<T>) => unknown;
  icons?: BGridSearchIcons;
  labels?: BGridSearchLabels;
}

export interface BGridContextMenuTarget<T> {
  cell: BGridCellAddress;
  visibleIndex: number;
  sourceIndex: number;
  rowKey?: React.Key;
  columnIndex: number;
  columnId: string;
  column: BGridColumn<T>;
  item: BGridDataItem<T>;
  values: T;
  value: unknown;
}

export type BGridContextMenuItem<T> =
  | {
      type?: 'item';
      id: string;
      label: React.ReactNode;
      icon?: React.ReactNode;
      shortcut?: string;
      disabled?: boolean;
      onSelect: (target: BGridContextMenuTarget<T>) => void | Promise<void>;
    }
  | {
      type: 'separator';
      id: string;
    };

export interface BGridContextMenuOptions<T> {
  enabled?: boolean;
  items?: (target: BGridContextMenuTarget<T>) => readonly BGridContextMenuItem<T>[];
  onOpenChange?: (open: boolean, target?: BGridContextMenuTarget<T>) => void;
}

export interface BGridSearchMatch {
  cell: BGridCellAddress;
  visibleIndex: number;
  sourceIndex: number;
  rowKey?: React.Key;
  columnIndex: number;
  columnId: string;
}

export interface BGridContextMenuState<T> {
  target: BGridContextMenuTarget<T>;
  items: BGridContextMenuItem<T>[];
  clientX: number;
  clientY: number;
  keyboard: boolean;
}

export interface BGridCellInteractionRowScope {
  merged: boolean;
  visibleIndexes: readonly number[];
  sourceIndexes: readonly number[];
}

export interface BGridCellInteractionSessionBase {
  id: number;
  phase: 'active' | 'resolving' | 'committing';
  cell: BGridCellAddress;
  hostCell: BGridCellAddress;
  rowScope: BGridCellInteractionRowScope;
}

export interface BGridCellEditSession extends BGridCellInteractionSessionBase {
  kind: 'editor';
  mode: 'preserve' | 'replace';
  activation: BGridCellEditActivation;
  originalValue: unknown;
}

export type BGridCellEditActivation = 'cell' | 'editorIcon';

export interface BGridEditorIconSession extends BGridCellInteractionSessionBase {
  kind: 'editorIcon';
}

export type BGridCellInteractionSession = BGridCellEditSession | BGridEditorIconSession;

export interface BGridCellCommitRequest<T> {
  sessionId: number;
  source: BGridEditSource;
  changes: readonly BGridCellValueChange<T>[];
  options?: BGridCommitOptions;
}

export type BGridCellMoveDirection =
  | 'up'
  | 'down'
  | 'left'
  | 'right'
  | 'home'
  | 'end'
  | 'pageUp'
  | 'pageDown'
  | 'first'
  | 'last'
  | 'next'
  | 'prev';

export interface BGridMoveActiveCellOptions {
  extendSelection?: boolean;
  toBoundary?: boolean;
  pageSize?: number;
  selectionEnabled?: boolean;
}

export interface BGridCellNavigationOptions {
  enabled?: boolean;
  activeCell?: BGridCellAddress;
  defaultActiveCell?: BGridCellAddress;
  onActiveCellChange?: (cell?: BGridCellAddress) => void;
  wrap?: boolean;
  editOnEnter?: boolean;
  keyRepeat?: {
    enabled?: boolean;
    interval?: number;
  };
}

export interface BGridCellSelectionRange {
  startRowIndex: number;
  startColumnIndex: number;
  endRowIndex: number;
  endColumnIndex: number;
}

export type BGridCellSelectionCopyErrorReason = 'maxClipboardCells' | 'maxClipboardTextLength' | 'clipboardWriteFailed';

export interface BGridCellSelectionCopyError {
  reason: BGridCellSelectionCopyErrorReason;
  actual?: number;
  limit?: number;
  selectedCellCount: number;
  maxClipboardCells: number;
  maxClipboardTextLength: number;
  error?: unknown;
}

export type BGridCellSelectionPasteErrorReason =
  | 'maxClipboardCells'
  | 'maxClipboardTextLength'
  | 'parseValueFailed'
  | 'createRowFailed'
  | 'unsupportedClipboardData'
  | 'mergedCellConflict';

export interface BGridCellSelectionPasteError {
  reason: BGridCellSelectionPasteErrorReason;
  actual?: number;
  limit?: number;
  rowIndex?: number;
  columnIndex?: number;
  clipboardTypes?: string[];
  clipboardTextLength: number;
  clipboardCellCount: number;
  maxClipboardCells: number;
  maxClipboardTextLength: number;
  error?: unknown;
}

export interface BGridCellSelectionPasteRowContext<T> {
  rowIndex: number;
  clipboardRow: string[];
  columns: BGridColumn<T>[];
}

export type BGridColumnWithOptionalWidth<T> = Partial<Pick<BGridColumn<T>, 'width'>> & Omit<BGridColumn<T>, 'width'>;

export type BGridScrollbarVariant = 'native' | 'classic' | 'modern';

export interface BGridStatusContext {
  totalItems: number;
  visibleItems: number;
  page?: BGridPage;
}

export type BGridStatusContent = React.ReactNode | ((context: BGridStatusContext) => React.ReactNode);

export interface BGridViewStyleProps {
  className?: string;
  style?: React.CSSProperties;
}

export interface BGridStatusOptions extends BGridViewStyleProps {
  visible?: boolean;
  content?: BGridStatusContent;
}

export interface BGridPaginationViewOptions extends BGridViewStyleProps {
  visible?: boolean;
}

export interface BGridHorizontalScrollbarOptions extends BGridViewStyleProps {
  visible?: boolean;
}

export interface BGridVerticalScrollbarOptions extends BGridViewStyleProps {
  visible?: boolean;
}

export interface BGridScrollbarOptions {
  variant?: BGridScrollbarVariant;
  horizontal?: BGridHorizontalScrollbarOptions;
  vertical?: BGridVerticalScrollbarOptions;
}

export interface BGridResolvedScrollbarOptions {
  variant: BGridScrollbarVariant;
  horizontal: Required<Pick<BGridHorizontalScrollbarOptions, 'visible'>> &
    Omit<BGridHorizontalScrollbarOptions, 'visible'>;
  vertical: Required<Pick<BGridVerticalScrollbarOptions, 'visible'>> & Omit<BGridVerticalScrollbarOptions, 'visible'>;
}

export interface BGridResolvedStatusOptions extends BGridStatusOptions {
  visible: boolean;
  configured: boolean;
}

export type BGridResolvedPaginationViewOptions = Required<Pick<BGridPaginationViewOptions, 'visible'>> &
  Omit<BGridPaginationViewOptions, 'visible'>;

export interface BGridProps<T> {
  width: number;
  height: number;
  headerHeight?: number;
  /** @deprecated Use bottomBarHeight instead. */
  footerHeight?: number;
  bottomBarHeight?: number;
  summaryHeight?: number;
  itemHeight?: number;
  itemPadding?: number;
  frozenColumnIndex?: number;
  /** Number of leading rows fixed below an optional top summary row. */
  frozenRowCount?: number;

  columns: BGridColumnWithOptionalWidth<T>[];
  /** @deprecated Use columnGroups for nested column header groups. */
  columnsGroup?: BGridColumnGroup[];
  columnGroups?: BGridColumnGroupNode[];
  onChangeColumns?: (columnIndex: number | null, info: BGridChangeColumnsInfo<T>) => void;
  data?: BGridDataItem<T>[];
  onChangeData?: (
    index: number,
    columnIndex: number | null,
    item: T,
    column: BGridColumn<T> | null,
    meta?: BGridChangeDataMeta<T>,
  ) => void;

  page?: BGridPage;
  enableLoadMore?: boolean;
  onLoadMore?: (params: { scrollLeft: number; scrollTop: number }) => void;
  endLoadMoreRender?: () => React.ReactNode;

  scrollbar?: BGridScrollbarOptions;
  status?: BGridStatusOptions;
  pagination?: BGridPaginationViewOptions;

  className?: string;
  style?: React.CSSProperties;

  loading?: boolean;
  spinning?: boolean;
  scrollTop?: number;
  scrollLeft?: number;

  rowChecked?: BGridRowChecked<T>;
  sort?: BGridSortInfo;
  onClick?: (params: BGridClickParams<T>) => void;

  msg?: {
    emptyList?: string;
  };

  rowKey?: React.Key | React.Key[];
  selectedRowKey?: React.Key | React.Key[];
  editable?: boolean;
  /** Event that starts cell editing. Defaults to `dblclick`. */
  editTrigger?: BGridEditTrigger;
  showLineNumber?: boolean;

  getRowClassName?: (ri: number, item: BGridDataItem<T>) => string | undefined;
  cellMergeOptions?: {
    columnsMap: Record<number, BGridCellMergeColumn>;
  };
  cellSelectionOptions?: {
    enabled?: boolean;
    clearOnEscape?: boolean;
    clearOnOutsideClick?: boolean;
    maxClipboardCells?: number;
    maxClipboardTextLength?: number;
    onCopyError?: (error: BGridCellSelectionCopyError) => void;
    onPasteError?: (error: BGridCellSelectionPasteError) => void;
    /** Creates missing trailing rows while pasting. Returned rows are always marked as `new`. */
    createRowOnPaste?: (context: BGridCellSelectionPasteRowContext<T>) => BGridDataItem<T> | undefined;
  };
  cellNavigationOptions?: BGridCellNavigationOptions;
  variant?: 'default' | 'vertical-bordered';
  summary?: {
    columns: BGridSummaryColumn<T>[];
    position: 'top' | 'bottom';
  };
  columnSortable?: boolean;
  reorder?: BGridReorderInfo<T>;
  reorderingInfo?: BGridReorderingInfo;
  pivot?: BGridPivotOptions<T>;
  dataControl?: BGridDataControl;
  icons?: BGridToolboxIcons;
  searchOptions?: BGridSearchOptions<T>;
  contextMenuOptions?: BGridContextMenuOptions<T>;
}

export type CheckedAll = true | false | 'indeterminate';

export interface BGridChangeDataMeta<T> {
  source: BGridEditSource;
  originColumn: BGridColumn<T>;
  changes: readonly BGridCellValueChange<T>[];
  /**
   * The committed row including Grid-managed metadata such as `status` and
   * `editedColumnIds` and `changedKeys`. Controlled grids should store this
   * item to preserve cell and value change state after synchronizing `data`.
   */
  dataItem: BGridDataItem<T>;
  transaction: {
    merged: boolean;
    canonicalCell: BGridCellAddress;
    visibleIndexes: readonly number[];
    sourceIndexes: readonly number[];
  };
}

export interface AppModelColumn<T> extends BGridColumn<T> {
  columnId: string;
  keyToken?: string;
  left: number;
}

export interface AppModel<T> extends BGridProps<T> {
  initialized: boolean;
  headerHeight: number;
  footerHeight: number;
  bottomBarHeight: number;
  summaryHeight: number;
  itemHeight: number;
  itemPadding: number;
  frozenColumnIndex: number;
  frozenRowCount: number;
  frozenRowsHeight: number;
  frozenColumnsWidth?: number;
  columns: AppModelColumn<T>[];
  columnsGroup: BGridColumnGroup[];
  columnGroups: BGridColumnGroupNode[];
  data: BGridDataItem<T>[];
  sourceData: BGridDataItem<T>[];
  sourceIndexByVisibleIndex: number[];
  visibleIndexBySourceIndex: Map<number, number>;
  columnResizing: boolean;
  containerBorderWidth: number;
  contentBodyHeight: number;
  displayItemCount: number;
  scrollTop: number;
  scrollLeft: number;
  checkedIndexesMap: Map<number, any>;
  checkedAll: CheckedAll;
  sortParams?: Record<string, BGridSortParam>;
  dataQuery?: BGridDataQuery;
  filterDrafts: Record<string, BGridFilterParam | undefined>;
  activeToolboxColumnId: string | null;
  searchOptions?: BGridSearchOptions<T>;
  contextMenuOptions?: BGridContextMenuOptions<T>;
  searchOpen: boolean;
  searchQuery: string;
  searchStatus: 'idle' | 'searching' | 'ready';
  searchMatches: BGridSearchMatch[];
  activeSearchMatchIndex?: number;
  contextMenuState?: BGridContextMenuState<T>;
  displayPaginationLength?: number;
  loading: boolean;
  editItemIndex?: number;
  editItemColIndex?: number;
  cellInteractionSession?: BGridCellInteractionSession;
  editTrigger?: BGridEditTrigger;
  reorder?: BGridReorderInfo<T>;
  reorderingInfo?: BGridReorderingInfo;
  activeCell?: BGridCellAddress;
  activeCellHost?: BGridCellAddress;
  cellNavigationOptions?: BGridCellNavigationOptions;
  cellSelectionRange?: BGridCellSelectionRange;
  cellSelectionRanges: BGridCellSelectionRange[];
  cellSelecting: boolean;
  scrollbar: BGridResolvedScrollbarOptions;
  status: BGridResolvedStatusOptions;
  pagination: BGridResolvedPaginationViewOptions;
}

export interface AppActions<T> {
  setInitialized: (initialized: boolean) => void;
  setScrollTop: (scrollTop: number) => void;
  setScrollLeft: (scrollLeft: number) => void;
  setScroll: (scrollTop: number, scrollLeft: number) => void;
  setColumns: (columns: AppModelColumn<T>[]) => void;
  setColumnsGroup: (columnsGroup: BGridColumnGroup[]) => void;
  setColumnGroups: (columnGroups: BGridColumnGroupNode[]) => void;
  setData: (data: BGridDataItem<T>[]) => void;
  setSourceData: (sourceData: BGridDataItem<T>[]) => void;
  setProcessedData: (params: {
    data: BGridDataItem<T>[];
    sourceData: BGridDataItem<T>[];
    sourceIndexByVisibleIndex: number[];
    visibleIndexBySourceIndex: Map<number, number>;
  }) => void;
  setDataQuery: (dataQuery: BGridDataQuery) => void;
  setDataControl: (dataControl?: BGridDataControl) => void;
  setIcons: (icons?: BGridToolboxIcons) => void;
  setColumnSort: (columnId: string, order: 'asc' | 'desc' | null) => void;
  setFilterDraft: (columnId: string, filter: BGridFilterParam | undefined) => void;
  applyColumnFilter: (columnId: string) => void;
  clearColumnFilter: (columnId: string) => void;
  setActiveToolbox: (columnId: string | null) => void;
  setSearchOptions: (options?: BGridSearchOptions<T>) => void;
  setContextMenuOptions: (options?: BGridContextMenuOptions<T>) => void;
  requestSearchOpen: (open: boolean, reason: BGridSearchOpenReason) => void;
  setSearchQuery: (query: string) => void;
  setSearchStatus: (status: AppModel<T>['searchStatus']) => void;
  setSearchResults: (matches: BGridSearchMatch[]) => void;
  moveSearchMatch: (direction: 'previous' | 'next') => BGridSearchMatch | undefined;
  clearSearchResults: () => void;
  openContextMenu: (state: BGridContextMenuState<T>) => void;
  closeContextMenu: () => void;
  closeTransientSurfaces: (except?: 'search' | 'toolbox' | 'contextMenu') => void;
  setCheckedIndexes: (ids: number[]) => void;
  setCheckedAll: (checkedAll: CheckedAll) => void;
  setColumnWidth: (
    columnIndex: number,
    options?: {
      width?: number;
      updateColumns?: boolean;
    },
  ) => void;
  setColumnResizing: (columnResizing: boolean) => void;
  toggleColumnSort: (columnIndex: number) => void;
  setPage: (page: BGridPage) => void;
  handleClick: (index: number, columnIndex: number) => void;
  setWidth: (width: number) => void;
  setHeight: (height: number) => void;
  setContentBodyHeight: (contentBodyHeight: number) => void;
  setDisplayItemCount: (displayItemCount: number) => void;
  setLoading: (loading: boolean) => void;
  setSpinning: (spinning: boolean) => void;
  setHeaderHeight: (headerHeight: number) => void;
  setFooterHeight: (footerHeight: number) => void;
  setBottomBarHeight: (bottomBarHeight: number) => void;
  setSummaryHeight: (summaryHeight: number) => void;
  setItemHeight: (itemHeight: number) => void;
  setItemPadding: (itemPadding: number) => void;
  setFrozenColumnIndex: (frozenColumnIndex: number) => void;
  setFrozenRowCount: (frozenRowCount: number) => void;
  setFrozenRowsHeight: (frozenRowsHeight: number) => void;
  setCheckedIndexesMap: (checkedIndexesMap: Map<number, any>) => void;

  setRowChecked: (rowChecked?: BGridRowChecked<T>) => void;
  setSort: (sort?: BGridSortInfo) => void;
  setSortParams: (sortParams?: Record<string, BGridSortParam>) => void;
  setFrozenColumnsWidth: (frozenColumnsWidth: number) => void;
  setRowKey: (rowKey?: React.Key | React.Key[]) => void;
  setSelectedRowKey: (rowKey?: React.Key | React.Key[]) => void;
  setEditable: (editable: boolean) => void;
  setEditItem: (index: number, columnIndex: number) => void;
  beginCellEdit: (
    cell: BGridCellAddress,
    mode?: BGridCellEditSession['mode'],
    activation?: BGridCellEditActivation,
  ) => void;
  beginEditorIconInteraction: (cell: BGridCellAddress) => BGridEditorIconSession | undefined;
  endCellEdit: (sessionId?: number) => void;
  isCellEditSessionActive: (sessionId: number) => boolean;
  isCellInteractionSessionActive: (sessionId: number) => boolean;
  requestCellCommit: (request: BGridCellCommitRequest<T>) => Promise<void>;
  commitCheckboxCell: (rowIndex: number, columnIndex: number, checked: boolean) => Promise<void>;
  commitCheckboxColumn: (columnIndex: number, checked: boolean) => Promise<void>;
  cancelCellInteraction: (sessionId?: number) => void;

  setOnClick: (onClick?: BGridProps<T>['onClick']) => void;
  setOnChangeColumns: (onChangeColumns?: BGridProps<T>['onChangeColumns']) => void;
  setOnChangeData: (onChangeData?: BGridProps<T>['onChangeData']) => void;
  setOnLoadMore: (onLoadMore?: BGridProps<T>['onLoadMore']) => void;
  setShowLineNumber: (showLineNumber?: boolean) => void;
  setMsg: (msg?: BGridProps<T>['msg']) => void;
  setDisplayPaginationLength: (length: number) => void;

  setRowClassName: (getRowClassName?: BGridProps<T>['getRowClassName']) => void;
  setEditTrigger: (editTrigger: BGridEditTrigger) => void;
  setCellMergeOptions: (cellMergeOptions: BGridProps<T>['cellMergeOptions']) => void;
  setVariant: (variant: BGridProps<T>['variant']) => void;
  setSummary: (summary?: BGridProps<T>['summary']) => void;
  setColumnSortable: (columnSortable?: boolean) => void;
  sortColumn: (trLevel: number, oldColumn: SortedColumn, newColumn: SortedColumn) => void;
  setReorder: (reorder?: BGridReorderInfo<T>) => void;
  setClassName: (className?: string) => void;
  setStyle: (style?: React.CSSProperties) => void;
  setReorderingInfo: (reorderingInfo?: BGridReorderingInfo) => void;
  setActiveCell: (activeCell?: BGridCellAddress, hostCell?: BGridCellAddress) => void;
  syncActiveCellToBounds: () => void;
  moveActiveCell: (
    direction: BGridCellMoveDirection,
    options?: BGridMoveActiveCellOptions,
  ) => BGridCellAddress | undefined;
  setCellNavigationOptions: (options?: BGridCellNavigationOptions) => void;
  setCellSelectionRange: (cellSelectionRange?: BGridCellSelectionRange) => void;
  setCellSelectionRanges: (cellSelectionRanges: BGridCellSelectionRange[]) => void;
  setCellSelecting: (cellSelecting: boolean) => void;
  clearCellSelection: () => void;
  setScrollbar: (scrollbar: BGridResolvedScrollbarOptions) => void;
  setStatus: (status: BGridResolvedStatusOptions) => void;
  setPagination: (pagination: BGridResolvedPaginationViewOptions) => void;
}

export interface SortedColumn {
  index: number;
  columnIndex: number;
}

export interface AppStore<T = any> extends AppModel<T>, AppActions<T> {}

export type ZustandSetter<T> = (partial: Partial<T>, replace?: boolean | undefined) => void;
export type ZustandGetter<T> = () => T;
export type StoreActions = <T>(set: ZustandSetter<AppModel<T>>, get: ZustandGetter<AppModel<T>>) => AppActions<T>;
