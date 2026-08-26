# Cell Selection and Clipboard

## Scope

The grid supports Excel-like cell selection by mouse drag. Selection state is stored per grid instance in the Zustand store, not in DOM state.

## Selection State

- `cellSelectionRange`: the latest active selection range.
- `cellSelectionRanges`: all selected ranges. This supports `Ctrl`/`Cmd` additive selection.
- `cellSelecting`: whether a pointer drag selection is active.

Each range uses absolute row and column indexes:

```ts
{
  startRowIndex: number;
  startColumnIndex: number;
  endRowIndex: number;
  endColumnIndex: number;
}
```

Frozen and non-frozen bodies use the same absolute column indexes via `data-column-index`, so selections can cross the split DOM boundary.

## Selection Rendering

Selection state is rendered by separate, pointer-transparent overlay `div` elements instead of changing each selected cell's border. A range is split only where frozen rows or frozen columns divide the grid, producing at most four rectangular fragments:

- `top-left`: frozen rows and frozen columns
- `top-main`: frozen rows and horizontally scrolling columns
- `body-left`: vertically scrolling rows and frozen columns
- `body-main`: vertically and horizontally scrolling rows and columns

Each fragment uses the geometry of the logical row and column range. Interior frozen-panel seams do not draw an extra selection edge; only the outside perimeter of the complete range is bordered. The overlays live in the same coordinate space as their body panel, so frozen fragments remain fixed on their frozen axis while the other fragments follow native or custom scrollbar state.

Overlay elements use `pointer-events: none`, so hit testing, editing, drag selection, context menus, and row reorder continue to target the underlying cells. Cell classes still expose active/navigation state, but selection fill and perimeter are no longer painted with per-cell border classes.

## Mouse and Keyboard Behavior

- Drag: replaces the previous selection.
- `Shift` + drag/click: extends from the latest range anchor.
- `Ctrl`/`Cmd` + drag/click: adds a new range.
- `Ctrl`/`Cmd` + `A`: selects all data cells by absolute row and column range.
- `Ctrl+C`/`Cmd+C`: copies selected cells using `\t` between columns and `\r` between rows.
- `Ctrl+V`/`Cmd+V`: pastes tab/newline-delimited text from the active cell when the grid is editable.

## Auto Scroll

During active cell drag, document-level pointer movement is tracked. If the pointer moves near or beyond the grid body edge, the scroll container is moved with `requestAnimationFrame`, and the selection end is recalculated from scroll position and column widths. This allows selection to extend beyond currently rendered virtual rows or columns.

## Merged Cells

Merged cells are rendered with `rowSpan`. When selection starts or ends on a merged cell, the range includes the full row span so clipboard output includes the underlying row data.

The visual selection remains a rectangle derived from the logical range. A merged cell that only partially intersects the selection no longer extends or breaks the selection perimeter because the overlay is independent of the merged cell DOM border.

## Clipboard Values

Clipboard text is resolved in this order:

1. `column.getClipboardText(params)`
2. `getCellValueByRowKey(column.key, item.values)`

Use `getClipboardText` when `itemRender` shows formatted JSX, editor UI, labels from lookup data, or any value that differs from the raw `column.key` value.

## Clipboard Paste

Clipboard rows may use `\r`, `\n`, or `\r\n`; columns are separated by `\t`. The active cell is the top-left paste target. Data outside the grid is clipped, `editable: false` columns and rows with `BGridDataItemStatus.remove` are skipped, existing rows become `edit`, and `new` rows keep their status.

For `editor: { type: 'text' }`, pasted text is passed through the editor's `parseValue` callback. Plugin columns receive the raw clipboard string. Every changed cell calls `onChangeData`, and the pasted rectangle becomes the current selection.

By default, data beyond the last row is clipped. Provide `cellSelectionOptions.createRowOnPaste` to append missing rows:

```tsx
<BGrid
  editable
  cellSelectionOptions={{
    createRowOnPaste: ({ rowIndex, clipboardRow }) => ({
      values: createEmptyRow({ rowIndex, clipboardRow }),
    }),
  }}
/>
```

The factory is called once for each missing trailing row. Returned rows are marked as `BGridDataItemStatus.new` regardless of the returned status. Row creation calls `onChangeData(rowIndex, null, values, null)` before the per-cell change notifications, allowing controlled data owners to append the row before applying its cell changes.

## Clipboard Limits

Clipboard copy is skipped before expanding virtual-scroll selections into cell maps when the selection is too large.

Default limits:

- `cellSelectionOptions.maxClipboardCells`: `100000`
- `cellSelectionOptions.maxClipboardTextLength`: `8 * 1024 * 1024`

When either limit is exceeded, the grid does not call the Clipboard API, writes a warning to the console, and calls
`cellSelectionOptions.onCopyError`.

`onCopyError` receives:

- `reason`: `maxClipboardCells`, `maxClipboardTextLength`, or `clipboardWriteFailed`
- `actual`: actual selected cell count or clipboard text length when available
- `limit`: configured limit when available
- `selectedCellCount`
- `maxClipboardCells`
- `maxClipboardTextLength`
- `error`: original browser error when clipboard writing fails

The same limits apply to paste. `cellSelectionOptions.onPasteError` receives `maxClipboardCells`, `maxClipboardTextLength`, `parseValueFailed`, or `createRowFailed`, together with the clipboard size and the failed cell coordinates when available.
