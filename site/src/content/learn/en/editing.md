---
title: "Cell Editing"
description: "Learn the core cell-editing flow, from declaring editable cells and entering by pointer or keyboard to IME input, save, cancel, and movement."
category: "interaction"
order: 1
locale: "en"
canonicalPath: "/en/learn/editing"
demoId: "editing"
features: ["cell-editing", "editable", "editTrigger", "keyboard", "IME", "text-editor"]
relatedGuides: ["built-in-editors", "editor-plugins", "editor-icons", "lookup-editor", "editing-events", "editing-merged-cells"]
relatedApi: ["/en/api/props#editable", "/en/api/props#edittrigger", "/en/api/props#cellnavigationoptions", "/en/api/props#columns", "/en/api/props#ref", "/en/api/props#rowchecked"]
lastReviewedAt: "2026-09-03"
indexable: true
draft: false
---

To enable cell editing, set `editable` on both the Grid and the target column, then define `column.editor`. This page covers the core flow from pointer activation through keyboard and IME input, saving, canceling, and navigation. Separate guides cover Select, lookup, and editing-event extensions.

## 1. Minimum setup

```tsx
const columns: BGridColumn<Order>[] = [
  {
    key: 'customerName',
    label: 'Customer name',
    width: 180,
    editable: true,
    editor: { type: 'text' },
  },
];

<BGrid<Order>
  width={720}
  height={360}
  data={data}
  columns={columns}
  rowKey='id'
  editable
/>
```

`itemRender` controls how a cell appears when it is not being edited, while `editor` provides the input UI during editing. You do not need an editor merely to change display formatting.

## 2. Grid defaults and column overrides

The default edit trigger is a double-click. Change the Grid-wide default with `editTrigger`, then override individual columns that should open immediately, such as a Select editor.

```tsx
<BGrid editTrigger='dblclick' {...props} />

const columns: BGridColumn<Order>[] = [
  { key: 'name', editable: true, editor: { type: 'text' } },
  {
    key: 'status',
    editable: true,
    editTrigger: 'click',
    editor: statusEditor,
  },
];
```

The resolution order is `column.editTrigger → grid.editTrigger → 'dblclick'`. There is no `editTrigger: 'none'`. Use `editable: false` to make a cell read-only. Put button actions that are independent of cell editing in `editorIcon.onClick` or `itemRender`.

## 3. Start editing with the pointer or keyboard

- Cell click or double-click: opens the editor according to the configured `editTrigger`.
- Direct character input: opens a text editor and replaces the existing value.
- `Enter` or `F2`: opens the editor while preserving the existing value.
- Icon click: opens the editor when `editorIcon.onClick` is not defined.

Cell focus and editor focus are separate states. Activate a cell first, then open its editor from the keyboard. When editing ends, the Grid returns focus to the active cell.

## 4. Keyboard behavior

| Key | Cell focused | Editing |
| --- | --- | --- |
| Character input | Starts a text edit by replacing the existing value | Normal text input |
| `Enter` / `F2` | Starts editing while preserving the existing value | `Enter` saves |
| `Tab` / `Shift+Tab` | Moves to the next/previous cell | Saves, then moves to the next/previous cell |
| `Escape` | Clears the selection range | Cancels changes and returns to the same cell |
| Arrow keys | Moves the active cell | Uses the input control's default behavior |
| `Ctrl/Cmd+C`, `V` | Copies or pastes the selected range | Uses the input control's default behavior |

The built-in text editor defaults `startOnInput` to `true`. Set `startOnInput: false` to prevent direct character input on a focused cell from opening the editor.

```tsx
editor: {
  type: 'text',
  startOnInput: false,
}
```

## 5. IME and keyboard movement settings

During IME composition, such as Korean text input, the Grid does not save an incomplete string even if `Enter` or blur occurs first. It commits the final string only after composition ends. For external plugins, also verify the composition behavior of the UI component you use.

```tsx
<BGrid
  cellNavigationOptions={{
    enabled: true,
    editOnEnter: true,
    wrap: false,
  }}
/>
```

To control the active cell or review `Home`/`End` and `PageUp`/`PageDown` behavior, continue to [Cell Focus and Keyboard Navigation](/en/learn/cell-navigation).

## 6. Update application state

After the Grid saves a change internally, it calls `onChangeData`. Its first argument is the source index in the original data, even when sorting or filtering is active.

```tsx
onChangeData={(sourceIndex, _columnIndex, values, _column, meta) => {
  setData(current =>
    current.map((item, index) =>
      index === sourceIndex ? meta?.dataItem ?? { ...item, values } : item,
    ),
  );
}}
```

The actual row data always lives in `BGridDataItem<T>.values`. Saving `meta.dataItem` also preserves the `editedColumnIds` for directly edited columns and the `changedKeys` for changed data fields. Directly edited cells receive the `bgrid-cell-edited` style, while all cells that share a changed key receive `bgrid-cell-value-changed`.

## 7. Add, select and delete rows, then scroll

**Add Row** appends a new row and scrolls it into view. Use the left checkboxes to select rows, then **Delete Rows** to remove just those rows. Deletion is disabled when nothing is selected. New rows use `status: BGridDataItemStatus.new`; deletion immediately updates the example's React state without saving to a server.

The application owns additions and deletions through `data`, and explicitly requests scrolling through `BGridRef.scrollToRow()`. Ordinary data updates preserve the current scroll position. This example remembers the inserted row's unique key and requests scrolling after the data update, so subsequent cell edits do not trigger another scroll.

```tsx
import { useEffect, useRef, useState, type Key } from 'react';
import { BGrid, type BGridDataItem, type BGridRef } from 'beautiful-grid';

const gridRef = useRef<BGridRef>(null);
const pendingRowKey = useRef<string | null>(null);
const [checkedRowKeys, setCheckedRowKeys] = useState<Key[]>([]);

function addRow(item: BGridDataItem<Order>) {
  pendingRowKey.current = item.values.id;
  setData(current => [...current, item]);
}

useEffect(() => {
  const rowIndex = data.findIndex(item => item.values.id === pendingRowKey.current);
  if (rowIndex < 0) return;
  gridRef.current?.scrollToRow(rowIndex, { align: 'end' });
  pendingRowKey.current = null;
}, [data]);

function deleteCheckedRows() {
  const keys = new Set(checkedRowKeys);
  setData(current => current.filter(item => !keys.has(item.values.id)));
  setCheckedRowKeys([]);
}

<BGrid<Order>
  ref={gridRef}
  width={720}
  height={360}
  data={data}
  columns={columns}
  rowKey='id'
  editable
  rowChecked={{
    checkedRowKeys,
    onChange: (_indexes, keys) => setCheckedRowKeys(keys),
  }}
/>
```

The index in `scrollToRow(rowIndex, { align })` is a **zero-based index in the displayed, sorted/filtered data on the current page**. It differs from the source index passed to `onChangeData`. With sorting or filtering, resolve the position in the displayed data; the API does not reveal filtered-out rows or load another page.

- `nearest` (default): keep a visible row in place, otherwise scroll only as far as needed.
- `start` / `center` / `end`: align the row at the top / center / bottom of the scrollable area, clamped to the scroll limits.
- Frozen rows, out-of-range indexes and non-integer indexes are ignored.
- Horizontal scroll, the active cell and selection are preserved. The last of consecutive requests wins.
- A call in the same event as a data update runs after the Grid synchronizes its data. For asynchronous data, call after the response arrives.

## 8. Choose the next guide

| Goal | Next guide |
| --- | --- |
| Use text, Select, and Date editors | [Built-in Editors](/en/learn/built-in-editors) |
| Integrate Ant Design or another external UI library | [External Editor Plugins](/en/learn/editor-plugins) |
| Show dropdown or search icons in idle cells | [Editor Icons](/en/learn/editor-icons) |
| Combine autocomplete input with a lookup modal | [Lookup Editor](/en/learn/lookup-editor) |
| Validate changes and update related cells | [Editing Events and Transactions](/en/learn/editing-events) |
| Edit merged cells across frozen boundaries | [Merged Cell Editing](/en/learn/editing-merged-cells) |
