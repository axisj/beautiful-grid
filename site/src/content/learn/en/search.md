---
title: 'Grid Search'
description: 'Search cells across the currently loaded visible data and configure highlighting, previous and next navigation, context-menu entry points, and a controlled search UI.'
category: 'interaction'
order: 24
locale: 'en'
canonicalPath: '/en/learn/search'
demoId: 'search'
features: ['search', 'context-menu', 'keyboard', 'virtual-scroll', 'frozen-columns', 'dataControl']
relatedGuides:
  [
    'getting-started',
    'context-menu',
    'sorting-filtering',
    'virtual-scroll',
    'frozen-columns',
    'accessibility-and-keyboard',
  ]
relatedApi:
  [
    '/en/api/props#searchoptions',
    '/en/api/props#contextmenuoptions',
    '/en/api/props#bgridcolumn-searchable',
    '/en/api/props#bgridcolumn-getsearchtext',
  ]
lastReviewedAt: '2026-08-22'
indexable: true
draft: false
---

## 1. Search scope and behavior

Pass `searchOptions` to let users open the search UI from the focused grid with `Ctrl+F`, or `Cmd+F` on macOS. The same UI opens when they right-click a body cell—or press `Shift+F10` on the active cell—and choose **Search** from the context menu.

Search runs against **all currently loaded visible data** in the Grid Store, not just the rendered DOM. Rows outside the virtual-scroll viewport are therefore included, and previous/next navigation scrolls the matching cell into view. When `dataControl.mode === 'client'`, only rows remaining after client-side sorting and filtering are searched. With external pagination or manual server mode, search covers only the current page or the rows currently supplied to the grid.

Searching the entire server dataset or filtering the grid down to search results is outside the scope of this API.

## 2. Minimum setup

```tsx
<BGrid columns={columns} data={data} rowKey='employeeNo' searchOptions={{}} />
```

The following keyboard shortcuts are available while the search UI is open.

| Key                           | Action                                        |
| ----------------------------- | ------------------------------------- |
| `Enter`                       | Move to the next result.                      |
| `Shift+Enter`                 | Move to the previous result.                  |
| `Escape`                      | Close the search UI and clear highlights.     |
| `Ctrl/Cmd+F`                  | Open the search UI, or select all input text if it is already open. |
| `Shift+F10` / Context Menu key | Open the active cell's context menu.         |

The grid does not intercept `Ctrl/Cmd+F` during an editing session or while an `input`, `textarea`, `select`, or `contenteditable` element has focus. Pressing Enter during IME composition does not navigate to another result.

## 3. Match search text to the displayed value

By default, the grid reads the value identified by `column.key` from `item.values`. It does not inspect rendered DOM text. If `itemRender` formats an amount, date, or status code as a different string, define `getSearchText` as well.

```tsx
const columns = [
  {
    id: 'allocationRate',
    key: 'allocationRate',
    label: 'Allocation Rate',
    width: 100,
    itemRender: ({ values }) => `${values.allocationRate}%`,
    getSearchText: ({ value }) => `${value}%`,
  },
  {
    id: 'privateMemo',
    key: 'privateMemo',
    label: 'Internal notes',
    width: 180,
    searchable: false,
  },
];
```

A column's `getSearchText` takes precedence over the grid-wide `searchOptions.getSearchText`. The callback must be a side-effect-free synchronous function; Promises are not supported.

## 4. Control search from an external toolbar

Provide `open` and `query` to use the search UI in controlled mode. Return each new value to the grid through props from the corresponding change callback.

```tsx
const [open, setOpen] = useState(false);
const [query, setQuery] = useState('');

<>
  <button type='button' onClick={() => setOpen(true)}>
    Search Data
  </button>
  <BGrid
    columns={columns}
    data={data}
    searchOptions={{
      open,
      query,
      onOpenChange: setOpen,
      onQueryChange: setQuery,
      labels: {
        placeholder: 'Search currently loaded data',
        formatResultCount: ({ activeResult, totalResults }) => `${activeResult} / ${totalResults}`,
      },
    }}
  />
</>;
```

Pass React nodes from your application's icon system to the `icons.search`, `icons.previous`, `icons.next`, and `icons.close` slots. The library also provides fallbacks that require no separate icon runtime dependency.

## 5. Add custom context-menu items

`contextMenuOptions.items` receives an immutable snapshot of the target when a body cell is right-clicked. After client-side sorting or filtering, `visibleIndex` can differ from the original `sourceIndex`, so choose the value that matches your intended operation.

```tsx
<BGrid
  columns={columns}
  data={data}
  searchOptions={{}}
  contextMenuOptions={{
    items: target => [
      {
        id: 'inspect-row',
        label: 'Inspect This Row',
        onSelect: () => {
          console.log({
            visibleIndex: target.visibleIndex,
            sourceIndex: target.sourceIndex,
            values: target.values,
          });
        },
      },
    ],
  }}
/>
```

If there are no actionable menu items, the browser's default context menu remains available. Set `searchOptions.contextMenu = false` to remove the Search item, or `contextMenuOptions.enabled = false` to disable all custom menu items.

## 6. Implementation checklist

- On externally paginated or infinitely loaded screens, explain to users that search covers only currently loaded data.
- For formatted cells, verify that `getSearchText` matches the value users see.
- Provide `rowKey` to preserve the current result more reliably after data changes or reordering.
- With narrow grids, frozen rows or columns, and summary rows, verify that previous/next navigation does not place the matching cell behind the search panel.
- Searching pivot results is not currently supported.
