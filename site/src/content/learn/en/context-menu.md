---
title: 'Cell Context Menu'
description: 'Configure dynamic items, icons, separators, disabled states, and action callbacks for pointer and keyboard context menus on body cells.'
category: 'interaction'
order: 25
locale: 'en'
canonicalPath: '/en/learn/context-menu'
demoId: 'context-menu'
features: ['context-menu', 'keyboard', 'accessibility', 'dataControl']
relatedGuides: ['search', 'cell-navigation', 'sorting-filtering', 'accessibility-and-keyboard']
relatedApi: ['/en/api/props#contextmenuoptions', '/en/api/props#searchoptions']
lastReviewedAt: '2026-08-23'
indexable: true
draft: false
---

## 1. Open the context menu

Pass `contextMenuOptions` to provide a custom menu for body data cells.

- Pointer: right-click a cell
- Keyboard: press `Shift+F10` or the Context Menu key on the active cell
- Navigate the menu: `ArrowUp`, `ArrowDown`, `Home`, `End`
- Activate an item: `Enter` or `Space`
- Close the menu: `Escape`, an outside click, Grid scrolling, or a viewport resize

When you open the menu with the pointer, the target cell is activated and selected before the menu appears. Selecting another cell while the menu is open closes it immediately.

The browser's native context menu remains available on headers, summaries, scrollbars, empty data areas, and editor inputs. The Grid also preserves the native menu when there are no actionable custom items.

## 2. Configure menu items

The `items` callback receives an immutable snapshot of the cell that opened the menu. Its return array can contain both actionable items and separators.

```tsx
<BGrid
  columns={columns}
  data={data}
  rowKey='requestNo'
  contextMenuOptions={{
    items: target => [
      {
        id: 'inspect-cell',
        label: 'View cell details',
        icon: <Info size={15} />,
        shortcut: 'I',
        onSelect: selected => console.log(selected.value),
      },
      { type: 'separator', id: 'action-separator' },
      {
        id: 'assign-owner',
        label: 'Assign to current user',
        disabled: target.values.status === 'Completed',
        onSelect: selected => assignOwner(selected.values.requestNo),
      },
    ],
  }}
/>
```

Each `id` must be unique within a menu. `shortcut` is a hint displayed on the right; it does not automatically register a keyboard shortcut.

## 3. Target coordinates and data

The following target values are commonly used in menu callbacks:

| Property       | Meaning                                                               |
| -------------- | --------------------------------------------------------------------- |
| `value`        | Raw value of the selected cell                                        |
| `values`       | Row data from `BGridDataItem.values`                                   |
| `column`       | Definition of the selected column                                     |
| `columnId`     | Normalized column identifier                                          |
| `visibleIndex` | Current displayed row index after client-side sorting and filtering  |
| `sourceIndex`  | Row index in the original data supplied by the consumer               |
| `rowKey`       | Stable row key resolved through `BGrid.rowKey`                   |

With `dataControl.mode === 'client'`, sorting or filtering can make `visibleIndex` differ from `sourceIndex`. Use the visible index for on-screen navigation, and use the source index or `rowKey` when updating the original array or making server requests.

## 4. Use it with Grid search

When you pass both `searchOptions` and `contextMenuOptions`, the Grid automatically places its search item before your custom items and normalizes the separators.

```tsx
<BGrid
  columns={columns}
  data={data}
  searchOptions={{
    labels: { contextMenuItem: 'Search in grid' },
  }}
  contextMenuOptions={{
    items: target => createRowActions(target),
  }}
/>
```

Set `searchOptions.contextMenu = false` to hide only the search item. Set `contextMenuOptions.enabled = false` to disable the entire custom menu.

## 5. Observe the open state

Use `onOpenChange` to observe when the menu opens and closes. When it opens, the current target is also provided so you can populate a separate details panel or attach context to telemetry.

```tsx
contextMenuOptions={{
  onOpenChange: (open, target) => {
    if (open && target) {
      console.log(target.rowKey, target.columnId);
    }
  },
  items: target => createRowActions(target),
}}
```

`onSelect` accepts either a synchronous function or a Promise. If an asynchronous action fails, the Grid logs a development-mode warning with the item's `id`. The menu still closes immediately after selection.

## 6. Implementation checklist

- Use the immutable target passed to each menu action instead of reading the current DOM text again.
- Put irreversible actions such as deletion, payment, or permission changes behind a confirmation dialog instead of executing them immediately on selection.
- For actions unavailable in the current state, consider keeping the item visible with `disabled` and a clear label that explains why.
- With multiple Grid instances, verify that focus and menu state remain isolated per Grid.
- Mobile long-press is not currently built in. Provide a separate application-level entry point if you need one.
