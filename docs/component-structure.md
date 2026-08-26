# BGrid Component Structure

## Scope

This document summarizes the internal structure of the publishable `beautiful-grid/` library source. The root `src/`, `examples/`, and `components/` directories are part of the Vite demo app, while `beautiful-grid/` contains the library implementation.

## High-Level Flow

```txt
BGridProps<T>
  -> BGrid
    -> AppStoreProvider
      -> Table
        -> Header: TableHeadFrozen + TableHead
        -> Summary: TableSummaryFrozen + TableSummary
        -> Body: TableBodyFrozen + TableBody
        -> Footer: TableFooter -> Pagination
```

`BGrid` is the public entry point. It normalizes incoming props, precomputes columns, creates the initial store state, and renders `Table` inside `AppStoreProvider`.

## Entry Point

File: `beautiful-grid/BGrid.tsx`

Responsibilities:

- Receives public `BGridProps<T>`.
- Converts `rowChecked.checkedRowKeys` or `rowChecked.checkedIndexes` into `checkedIndexesMap`.
- Converts `sort.sortParams` into a lookup map keyed by column key.
- Builds `computedColumns`.
- Builds `initialStoreState`.
- Renders one `AppStoreProvider` around one `Table`.

Column layout is computed here before the data enters the store:

- Columns before `frozenColumnIndex` are frozen and receive `left: -1`.
- Columns from `frozenColumnIndex` onward receive an accumulated `left` offset.
- Missing column widths default to `100`.

`left` should stay an entry-point concern. Other components read the computed value instead of recalculating it globally.

## Store Model

Files:

- `beautiful-grid/store/createAppStore.tsx`
- `beautiful-grid/types.ts`

Each grid instance owns its own Zustand store. `AppStoreProvider` creates the store with `useRef(createStore(...))`, so multiple `<BGrid>` instances do not share state.

The type split is:

- `BGridProps<T>`: public component API.
- `AppModel<T>`: internal state shape.
- `AppActions<T>`: store actions.
- `AppStore<T>`: model plus actions.
- `BGridDataItem<T>`: row wrapper; actual row data is always under `item.values`.

Common store responsibilities:

- Layout state: width, height, header/footer/summary/body dimensions.
- Scroll state: `scrollTop`, `scrollLeft`.
- Columns and column groups.
- Data and row check state.
- Sorting state.
- Editing state.
- Pagination state.
- Frozen column width.
- Cell selection ranges.
- Reorder state.

Most internal components call `useAppStore(selector)` and subscribe only to the state they need.

## Table Orchestration

File: `beautiful-grid/components/Table.tsx`

`Table` is the main orchestrator. It does not receive final state directly from props forever; instead it synchronizes prop changes into the per-grid store through grouped `useEffect` blocks.

Main responsibilities:

- Sync incoming props into store setters.
- Compute body height and visible row count.
- Bind scroll and wheel listeners.
- Keep header and summary horizontally aligned with body scroll.
- Render frozen and non-frozen table sections.
- Coordinate row hover across split frozen/non-frozen DOM trees.
- Manage cell selection, drag extension, auto-scroll, escape clearing, outside-click clearing, and clipboard copy.
- Render loading overlays.

The rendered layout is split into:

- `HeaderContainer`: frozen header and scrollable header.
- Optional top `SummaryContainer`.
- `BodyContainer`: frozen body and scrollable body.
- Optional bottom `SummaryContainer`.
- Optional `FooterContainer`.

The main scroll container owns the actual scroll position. Frozen body listens to wheel events and visually tracks vertical scroll by applying a negative margin based on `scrollTop`.

## Header Rendering

Files:

- `beautiful-grid/components/TableHead.tsx`
- `beautiful-grid/components/TableHeadFrozen.tsx`
- `beautiful-grid/components/TableHeadColumn.tsx`
- `beautiful-grid/components/ColResizer.tsx`

Header rendering is split by frozen boundary:

- `TableHeadFrozen` renders line number, row selector header, and frozen columns.
- `TableHead` renders non-frozen columns.

Both header components support grouped headers through `columnsGroup`. They build a `columnsTable` array that represents one or two header rows.

Header interactions:

- Clicking a sortable column calls `toggleColumnSort`.
- Resize handles call column width actions.
- If `columnSortable` is enabled, SortableJS reorders columns and calls `sortColumn`.

`TableHeadColumn` displays the label, sort direction, and multi-sort order badge.

## Body Rendering

Files:

- `beautiful-grid/components/TableBody.tsx`
- `beautiful-grid/components/TableBodyFrozen.tsx`
- `beautiful-grid/components/TableBodyCell.tsx`
- `beautiful-grid/utils/useBodyData.ts`

Body rendering is also split by frozen boundary:

- `TableBodyFrozen` renders line numbers, row check controls, reorder handles, and frozen columns.
- `TableBody` renders non-frozen columns.

Vertical virtualization:

- `trHeight = itemHeight + itemPadding * 2 + 1`.
- `startIdx = floor(scrollTop / trHeight)`.
- `endNumber = min(startIdx + displayItemCount, data.length)`.
- `useBodyData(startIdx, endNumber, data)` returns the visible row slice.

Horizontal virtualization:

- `TableBody` computes visible column indexes from `scrollLeft`, grid width, frozen width, column `left`, and column width.
- It renders one extra column before and after the visible range when possible to reduce edge clipping.
- Frozen columns are not part of this horizontal range; they are rendered by `TableBodyFrozen`.

Cell rendering:

- `TableBodyCell` calls `column.itemRender` when provided.
- Otherwise it renders `getCellValueByRowKey(column.key, item.values)`.
- `column.key` may be a string or a string path array.

Editing:

- The active editor is tracked with `editItemIndex` and `editItemColIndex`.
- `editTrigger` controls whether edit mode starts on click or double-click.
- `itemRender` receives `handleSave`, `handleCancel`, and `handleMove`.
- `handleSave` updates `item.values`, marks existing rows as edited, updates store data, and calls `onChangeData`.

## Frozen Columns

Frozen columns are rendered in paired components instead of being implemented through CSS sticky cells.

Pairs:

- `TableHeadFrozen` with `TableHead`.
- `TableBodyFrozen` with `TableBody`.
- `TableSummaryFrozen` with `TableSummary`.
- `TableColGroupFrozen` with `TableColGroup`.

Frozen width is calculated by `getFrozenColumnsWidth` from:

- optional line number width,
- optional row selector width,
- widths of columns before `frozenColumnIndex`.

Absolute column indexes are preserved across frozen and non-frozen tables. For example, frozen body cells still write `data-column-index={columnIndex}` with the original column index. This matters for click handling, editing, cell selection, clipboard copy, and merged-cell logic.

## Row Selection

Files:

- `beautiful-grid/components/RowSelector.tsx`
- `beautiful-grid/store/createAppStore.tsx`
- `beautiful-grid/utils/useBodyData.ts`

Row selection state is stored in `checkedIndexesMap: Map<number, any>`.

The public `checkedAll` value is tri-state:

- `true`
- `false`
- `'indeterminate'`

Selection can be initialized from either:

- `rowChecked.checkedIndexes`
- `rowChecked.checkedRowKeys` plus `rowKey`

Checkbox mode can select multiple rows. Radio mode clears previous selection and keeps one selected row.

## Sorting

Sorting is controlled by the public `sort` prop. Internally, `BGrid` converts `sort.sortParams` into `sortParams`, a key-based lookup.

`toggleColumnSort` cycles a column through:

```txt
none -> asc -> desc -> none
```

After each change, the store calls `sort.onChange` with params sorted by their multi-sort index.

## Cell Merge

Cell merge rules live in `cellMergeOptions.columnsMap`, keyed by absolute column index.

`useBodyData` computes a row-span map for the currently rendered row range. Merged cells render with `rowSpan`; non-anchor cells return `rowSpan === 0` and are skipped.

The merge calculation is cached in a `WeakMap` keyed by the data array reference.

## Cell Selection and Clipboard

Cell selection state lives in the store:

- `cellSelectionRange`
- `cellSelectionRanges`
- `cellSelecting`

`Table` owns the pointer interaction model. It supports drag selection, additive `Ctrl`/`Cmd` selection, `Shift` range extension, auto-scroll while dragging, escape clearing, outside-click clearing, and clipboard copy.

Clipboard text resolves in this order:

1. `column.getClipboardText(params)`
2. `getCellValueByRowKey(column.key, item.values)`

See `docs/cell-selection.md` for focused details.

## Summary and Footer

Files:

- `beautiful-grid/components/TableSummary.tsx`
- `beautiful-grid/components/TableSummaryFronzen.tsx`
- `beautiful-grid/components/TableFooter.tsx`
- `beautiful-grid/components/Pagination.tsx`

Summary can render at the top or bottom. Like headers and body, summary is split into frozen and non-frozen components.

`summary.columns` is keyed by absolute column index and may use `colSpan`.

Footer appears when `page` is provided. It displays total item count and renders pagination controls. Pagination updates the store and calls `page.onChange`.

## Reorder

Row reorder is handled in `TableBodyFrozen` with SortableJS. The drag handle is rendered in the line-number area when `reorder.enabled` is true.

Column reorder is handled in the header components when `columnSortable` is true.

Reorder state is stored as `reorderingInfo`, and visual hover states are mirrored between frozen and non-frozen rows through shared row indexes.

## Important Conventions

- Use `item.values` for actual row data.
- Use `getCellValueByRowKey` for `column.key` access, especially for nested path arrays.
- Keep one store per grid instance through `AppStoreProvider`.
- Keep column `left` calculation in `BGrid`.
- Keep frozen and non-frozen components aligned by absolute row and column indexes.
- When adding features that affect both split DOM trees, update frozen and non-frozen components together.
