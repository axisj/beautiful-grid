---
title: "Cell Navigation"
description: "Control the active cell, navigate with Arrow keys, Tab, Home/End, and PageUp/PageDown, and connect navigation to selection and inline editing."
category: "interaction"
order: 20
locale: "en"
canonicalPath: "/en/learn/cell-navigation"
demoId: "cell-navigation"
features: ["cellNavigationOptions", "activeCell", "keyboard-navigation", "cell-selection", "inline-editing"]
relatedGuides: ["editing", "row-selection", "focus", "accessibility-and-keyboard", "frozen-columns", "cell-merge"]
relatedApi: ["/en/api/props#cellnavigationoptions", "/en/api/props#cellselectionoptions", "/en/api/props#editable"]
lastReviewedAt: "2026-08-19"
indexable: true
draft: false
---

## 1. When do you use it?

On order-entry, inventory, and settlement screens where keyboard input is more common than pointer input, users need a clear view of the current working cell and a fast way to move to the next one. `cellNavigationOptions` configures the active cell and navigation policy for each Grid instance.

Click a cell in the live demo above, then press an Arrow key. Navigation uses the same absolute column index across frozen columns and the scrollable region. When the active cell moves outside the viewport, the Grid scrolls automatically to reveal it.

---

## 2. Supported keys

| Key | Behavior |
|---|---|
| <kbd>↑</kbd> <kbd>↓</kbd> <kbd>←</kbd> <kbd>→</kbd> | Move to the adjacent cell |
| <kbd>Shift</kbd> + Arrow key | Move the active cell and extend the selection range |
| <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + Arrow key | Move to the boundary of the current row or column |
| <kbd>Home</kbd> / <kbd>End</kbd> | Move to the first/last column of the current row |
| <kbd>Ctrl</kbd>/<kbd>Cmd</kbd> + <kbd>Home</kbd>/<kbd>End</kbd> | Move to the first/last cell in the Grid |
| <kbd>PageUp</kbd> / <kbd>PageDown</kbd> | Move by one page based on the current viewport height |
| <kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd> | Move to the next/previous cell |
| <kbd>Enter</kbd> | Start editing an editable cell; otherwise run the current cell's `onClick` callback |
| <kbd>Space</kbd> | Run the current cell's `onClick` callback |
| <kbd>F2</kbd> | Start editing the active cell when it is editable |
| <kbd>Escape</kbd> | Cancel editing or clear the cell selection |

When the event target is an `input`, `textarea`, `select`, `button`, or `contenteditable` element, Grid shortcuts do not intercept the input. A custom editor must handle the keys it needs and call `handleSave`, `handleCancel`, or `handleMove` itself.

---

## 3. Default and controlled state

Use `defaultActiveCell` when you only need to specify the initial active cell.

```tsx
<BGrid
  width={800}
  height={420}
  columns={columns}
  data={data}
  cellNavigationOptions={{
    defaultActiveCell: { rowIndex: 0, columnIndex: 0 },
    wrap: false,
    editOnEnter: true,
    keyRepeat: { interval: 16 },
  }}
/>
```

To connect the active cell to external application state, pass `activeCell` and `onActiveCellChange` together. In controlled mode, the displayed active cell does not change until you pass the value received by the callback back into the Grid.

```tsx
const [activeCell, setActiveCell] = useState({ rowIndex: 0, columnIndex: 1 });

<BGrid
  width={800}
  height={420}
  columns={columns}
  data={data}
  cellNavigationOptions={{
    activeCell,
    onActiveCellChange: cell => {
      if (cell) setActiveCell(cell);
    },
    wrap: true,
  }}
/>
```

If fewer rows or columns leave the active cell outside the valid range, the Grid clamps it to the last valid cell. With no data, the active cell is cleared. When data returns, the Grid restores it from the controlled value or the default.

---

## 4. Interaction with selection, merging, and editing

- Cell selection is enabled by default. Disable it with `cellSelectionOptions={{ enabled: false }}` when it is not needed; keyboard focus navigation remains available independently.
- <kbd>Shift</kbd> + Arrow key creates a range only when `cellSelectionOptions.enabled` is enabled.
- Moving into a merged column activates the first row of the merge group. Horizontal movement through a merged cell preserves the row from which the user entered. Vertical movement skips the current merge group and continues to the next one.
- With `editable` and a custom `itemRender`, users can start editing with <kbd>F2</kbd> or <kbd>Enter</kbd>.
- With `editOnEnter: false`, <kbd>Enter</kbd> does not start editing even on an editable cell; it runs the current cell's `onClick` callback instead.
- Holding an Arrow key switches from the first operating-system repeat event to frame-synchronized repetition. Set the movement interval in milliseconds with `keyRepeat.interval`, or use `keyRepeat.enabled: false` to retain the operating system's default repeat rate.
- In a read-only cell, <kbd>Enter</kbd> and <kbd>Space</kbd> pass the same arguments to `BGridProps.onClick` as a pointer click. The active cell does not move, so use Arrow keys to move vertically.
- With `wrap: true`, Arrow-key and Tab navigation wraps from one Grid boundary to the opposite edge.

Cell focus is separate from `selectedRowKey`, which highlights a row. To connect a row to a detail view, see [Focus and Active Row](/en/learn/focus). For cell input, see [Cell Editing](/en/learn/editing).

---

## 5. Preflight checklist

- Keyboard navigation works only while the Grid root actually has focus. Clicking a cell moves focus to the Grid.
- The active cell and selection range use indexes from the currently displayed data. If external state must continue pointing to a specific source row after sorting or filtering, manage it with application state based on `rowKey`.
- DOM-based cells and keyboard navigation alone do not guarantee full conformance with the WAI-ARIA Grid pattern. Validate the implementation in real browsers and assistive technologies against your accessibility target.
