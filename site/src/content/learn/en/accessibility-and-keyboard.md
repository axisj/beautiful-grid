---
title: "Accessibility & Keyboard"
description: "Review the keyboard shortcuts currently available for cell navigation, selection, editing, search, context menus, row selection, and row reordering."
category: "styling-and-accessibility"
order: 5
locale: "en"
canonicalPath: "/en/learn/accessibility-and-keyboard"
features: ["accessibility", "keyboard", "cell-navigation", "row-selection", "cell-selection", "focus", "search", "context-menu", "row-reorder"]
relatedGuides: ["cell-navigation", "editing", "search", "context-menu", "row-selection", "row-reorder", "focus"]
relatedApi: ["/en/api/props#cellnavigationoptions", "/en/api/props#cellselectionoptions", "/en/api/props#searchoptions", "/en/api/props#contextmenuoptions", "/en/api/props#reorder", "/en/api/props#selectedrowkey"]
lastReviewedAt: "2026-08-24"
indexable: true
draft: false
---

## 1. Current coverage

BeautifulGrid renders cells as DOM-based table elements rather than on a Canvas. The grid root can receive keyboard focus, and the active cell is identified by a visible outline and the `data-bgrid-cell-active` state. Row-selection controls expose real `checkbox` or `radio` roles together with `aria-checked` and `aria-disabled` states.

The keyboard supports cell navigation and selection as well as editing, search, context menus, row selection, and row reordering. The list below reflects the key-event behavior and tests in the current runtime. See the [Cell Navigation guide](/en/learn/cell-navigation) for a controlled active-cell example.

Do not treat the current implementation as complete conformance with the WAI-ARIA Grid pattern. Validate your application's accessibility requirements on the actual screen with a screen reader and keyboard.

---

## 2. Conditions for shortcuts

- `Ctrl` means the modifier key on Windows/Linux; `Cmd` is the equivalent on macOS.
- Cell-navigation shortcuts work when focus is on the grid or one of its descendants and `cellNavigationOptions.enabled !== false`.
- Range selection, select all, copy, and paste require `cellSelectionOptions.enabled: true`. Paste also requires the grid's `editable` prop to be `true`.
- Search requires `searchOptions`, with neither `enabled` nor `shortcut` set to `false`. A context menu needs at least one visible action, and row reordering requires `reorder.enabled: true`.
- The grid does not intercept keys originating from ordinary `input`, `textarea`, `select`, `button`, or `contenteditable` elements. Built-in cell editors handle the editing keys below directly to save, cancel, or move.

## 3. Cell navigation and range selection

| Key | Action | Conditions and notes |
|---|---|---|
| Arrow keys | Move to the adjacent cell up, down, left, or right | Adjusts the grid's internal scroll when needed. With `wrap: true`, movement wraps to the opposite end of the same axis. |
| Ctrl/Cmd + Arrow key | Move to the first/last row in the current column or the first/last column in the current row | Each arrow moves to the corresponding axis boundary. |
| Home / End | Move to the first/last column in the current row | Hold `Shift` to extend the range from the current anchor. |
| Ctrl/Cmd + Home / End | Move to the first/last cell in the grid | Hold `Shift` to extend the range to that location. |
| PageUp / PageDown | Move up/down by the visible body height in the current column | Hold `Shift` to extend the range to the destination cell. |
| Tab / Shift + Tab | Move to the next/previous cell | At a row edge, movement continues at the first cell of the next row or last cell of the previous row. Wrapping across the whole grid requires `wrap: true`. |
| Shift + Arrow key | Extend the range one cell from the current selection anchor | Creates a selection only when cell-range selection is enabled. |
| Ctrl/Cmd + A | Select all cells | Prevents the browser's default Select All only when cell-range selection is enabled and the grid has data and columns. |
| Escape | Clear the cell range | Works when `cellSelectionOptions.clearOnEscape !== false`. During editing, canceling the edit takes precedence. |

## 4. Cell activation and editing

| State | Key | Action |
|---|---|---|
| Regular cell | Enter | Starts editing an editable cell by default. With `editOnEnter: false`, a read-only column, or a read-only grid, it invokes the cell's `onClick`. |
| Regular cell | Space | Invokes the current cell's `onClick` without entering edit mode. |
| Regular cell | F2 | Starts editing the current editable cell. |
| Built-in text, Select, or Date editor | Enter | Saves the current value. |
| Built-in text, Select, or Date editor | Tab / Shift + Tab | Saves the current value and moves to the next/previous cell. |
| Built-in text, Select, or Date editor | Escape | Cancels changes and exits editing. |

If a custom `itemRender` or external editor plugin renders its own input, its implementer controls that element's keyboard behavior. An `itemRender` implementation can connect `handleSave`, `handleCancel`, and `handleMove` to provide the same save, cancel, and navigation rules.

## 5. Clipboard

| Key | Action | Conditions and notes |
|---|---|---|
| Ctrl/Cmd + C | Copy selected cells as tab- and newline-delimited text | Multiple ranges are sorted into row and column order. Per-column `getClipboardText` and copy limits apply. |
| Ctrl/Cmd + V | Paste tabular text starting at the active cell | Cell selection and editing must both be enabled. Read-only columns and deleted rows are skipped; column `parseClipboardText`, text-editor `parseValue`, `createRowOnPaste`, and paste limits apply. |

Paste is handled through the browser's `paste` event rather than a separate `keydown` shortcut, so it follows the paste behavior allowed by the user's browser and operating system.

The clipboard always carries `text/plain`, so it cannot automatically restore the original JavaScript type of arrays, objects, numbers, booleans, or dates. Use `getClipboardText` to define the copied representation and `parseClipboardText` to restore that text to the stored type. Without `parseClipboardText`, the Grid falls back to a text editor's `parseValue`; without either converter, it stores the pasted string as-is.

## 6. Search and context menu

| Target | Key | Action |
|---|---|---|
| Grid search | Ctrl/Cmd + F | Opens the search box and selects its value. If already open, moves focus to the search input. |
| Search input | Enter / Shift + Enter | Moves to the next/previous result. Does not move while IME composition or search processing is active. |
| Search input | Escape | Closes search and restores the previous grid focus. |
| Active cell | Context Menu key / Shift + F10 | Opens the current cell's context menu in keyboard mode. Does nothing if there are no enabled menu items. |
| Context menu | ↑ / ↓ | Cycles through previous/next items, skipping disabled items and separators. |
| Context menu | Home / End | Moves to the first/last enabled item. |
| Context menu | Enter / Space | Invokes the focused menu item. |
| Context menu | Escape / Tab | Closes the menu. A menu opened by keyboard restores grid focus. |

## 7. Row selection, row reordering, and header toolbox

| Target | Key | Action |
|---|---|---|
| Row-selection checkbox/radio | Space / Enter | Toggles selection for the focused row. Disabled rows cannot receive focus or be toggled. |
| Row-reorder handle | Space / Enter | Starts keyboard reordering; while moving, drops the row at the current position. |
| During row reorder | ↑ / ↓ | Moves the drop position one row at a time. |
| During row reorder | Escape | Cancels reordering and restores the previous selection state. |
| Header toolbox | Tab / Shift + Tab | Cycles focus within the open toolbox. |
| Header toolbox | ↑ / ↓ | Cycles through focusable items. Text/number inputs and `select` retain their native arrow-key behavior. |
| Header filter input | Enter | Applies the current filter value and closes the toolbox. |
| Header toolbox | Escape | Closes the toolbox. |

---

## 8. Checklist when applicable

- Mark non-selectable rows with `rowChecked.disabled` and verify that the visual state and `aria-disabled` are both applied.
- In a real browser, verify active-cell movement, row selection, cell-range selection, copy/paste, and required overlay controls without a mouse.
- Confirm that the focus indicator has sufficient contrast in the application's theme.
- Verify that inputs rendered by a custom `itemRender` do not break focus order or omit required key events. Grid shortcuts should not run inside ordinary input elements.
- In controlled `activeCell` mode, pass the value from `onActiveCellChange` back through props.
- For higher accessibility targets, supplement automated checks with screen-reader and keyboard-only scenarios.
