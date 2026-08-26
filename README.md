# BeautifulGrid

**Beautiful. Powerful. Naturally React.**

[![NPM version](https://img.shields.io/npm/v/beautiful-grid.svg?style=flat)](https://npmjs.org/package/beautiful-grid)
[![NPM downloads](https://img.shields.io/npm/dm/beautiful-grid.svg?style=flat)](https://npmjs.org/package/beautiful-grid)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)

BeautifulGrid is a beautiful, powerful, open-source React Data Grid for data-heavy business applications. It combines polished defaults with editing, sorting, filtering, selection, merging, aggregation, pivoting, and virtual scrolling.

Explore the live examples and documentation at [bgrid.axisj.com](https://bgrid.axisj.com).

## Install

```bash
npm i beautiful-grid
```

## Development

```bash
npm i
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) with your browser to see the demo app.

- [BGrid component structure](docs/component-structure.md)
- [Cell selection and clipboard](docs/cell-selection.md)

## Testing

```bash
# Unit tests (Vitest)
npm test

# Unit tests in watch mode
npm run test:watch

# Consumer compatibility test (install + cjs/esm/types check)
npm run test:library:consumers

# Published ESM initial bundle budget and generated homepage metrics
npm run test:library:bundle

# E2E tests (Playwright)
npm run test:e2e

# E2E tests with UI runner
npm run test:e2e:ui
```

## Build

```bash
# Demo app bundle (Vite)
npm run build

# Publishable library bundle (CJS + ESM + types + style)
npm run build:library

# Recalculate the published-library bundle metrics used by the website
npm run update:library:bundle-metrics
```

The published ESM build targets ES2020 and loads column reordering, the column toolbox, search, and context menus only when they are used. The CommonJS build remains downleveled to ES5. Bundle measurements model an external ESM consumer and exclude the `react` and `react-dom` peer dependencies.

## Publish

```bash
# Build dist/cjs, dist/esm, dist/types and dist/package.json
npm run build:library

# Dry-run package file list from dist
npm run pack:library

# Publish a stable package manually
npm run publish:library

# Publish a prerelease without moving the latest tag
npm publish ./dist --access public --tag next
```

### Release checks

- Pushes to `main` run the GitHub Actions test workflow.
- Build and publish `dist` manually after the pushed commit passes CI.
- Prerelease versions must use the npm `next` tag so `latest` remains on the stable release.
- The production website deploy runs manually from `.github/workflows/deploy-website.yml` on `main`.

## License

BeautifulGrid is open-source software licensed under the [Apache License 2.0](LICENSE). See [NOTICE](NOTICE) for attribution and [TRADEMARK.md](TRADEMARK.md) for use of the BeautifulGrid name and branding.

## Styling

Import the library stylesheet once in your app:

```typescript jsx
import 'beautiful-grid/style.css';
```

`beautiful-grid` ships with pure static CSS and requires no runtime CSS-in-JS engine. The grid uses CSS custom properties (`--bgrid-*`) scoped to `[role='grid']`, allowing you to easily customize the theme globally or for a specific wrapper element.

We recommend overriding the public `--bgrid-*` CSS variables rather than targeting internal `.bgrid-*` classes directly to maintain upgrade compatibility across releases.

Default variables:

```css
[role='grid'] {
  --bgrid-primary-color: #3b82f6;
  --bgrid-header-bg: #f3f4f5;
  --bgrid-header-color: #222;
  --bgrid-header-font-weight: 500;
  --bgrid-header-hover-bg: #e2e5e5;
  --bgrid-header-group-bg: #e9e9e9;
  --bgrid-footer-bg: #f3f4f5;
  --bgrid-summary-bg: #eaeef6;
  --bgrid-border-color-base: #d2d5d9;
  --bgrid-border-color-light: #d2d5d9;
  --bgrid-border-color-subtle: #e8ebef;
  --bgrid-header-separator-color: #dde2e8;
  --bgrid-frozen-boundary-color: #b8bec5;
  --bgrid-frozen-boundary-width: 2px;
  --bgrid-border-radius: 4px;
  --bgrid-row-selector-color: #ffffff;
  --bgrid-body-bg: #ffffff;
  --bgrid-body-odd-bg: #f8f8f8;
  --bgrid-body-hover-bg: #f3f4f5;
  --bgrid-body-hover-odd-bg: #eeeeee;
  --bgrid-body-active-bg: #e6f6ff;
  --bgrid-cell-selected-bg: var(--bgrid-body-active-bg);
  --bgrid-cell-selected-overlay-opacity: 0.72;
  --bgrid-cell-selected-border-color: rgba(59, 130, 246, 0.78);
  --bgrid-active-cell-bg: var(--bgrid-body-bg);
  --bgrid-active-cell-ring-color: var(--bgrid-primary-color);
  --bgrid-active-cell-ring-width: 2px;
  --bgrid-cell-selected-border-width: var(--bgrid-active-cell-ring-width);
  --bgrid-selection-axis-bg: #dbeafe;
  --bgrid-selection-axis-color: var(--bgrid-primary-color);
  --bgrid-selection-axis-border-color: var(--bgrid-primary-color);
  --bgrid-cell-edited-bg: #fff7ed;
  --bgrid-cell-edited-color: #c2410c;
  --bgrid-cell-edited-border-color: #fdba74;
  --bgrid-cell-value-changed-bg: var(--bgrid-cell-edited-bg);
  --bgrid-cell-value-changed-color: var(--bgrid-cell-edited-color);
  --bgrid-cell-value-changed-border-color: var(--bgrid-cell-edited-border-color);
  --bgrid-body-color: #444;

  --bgrid-toolbox-bg: #ffffff;
  --bgrid-toolbox-color: #444444;
  --bgrid-toolbox-muted-color: #64748b;
  --bgrid-toolbox-control-bg: #ffffff;
  --bgrid-toolbox-control-color: #444444;
  --bgrid-toolbox-control-border-color: #d2d5d9;
  --bgrid-toolbox-control-placeholder-color: #94a3b8;
  --bgrid-toolbox-hover-bg: #f3f4f5;
  --bgrid-toolbox-active-bg: #e6f6ff;
  --bgrid-toolbox-danger-color: #dc2626;
  --bgrid-toolbox-danger-bg: #fef2f2;
  --bgrid-toolbox-button-bg: #f8fafc;
  --bgrid-toolbox-primary-hover-color: #2563eb;
  --bgrid-toolbox-primary-contrast-color: #ffffff;
  --bgrid-toolbox-notice-bg: #f8fafc;
  --bgrid-toolbox-scroll-thumb-bg: #c7ccda;
  --bgrid-toolbox-scroll-track-bg: #f6f6f6;
  --bgrid-toolbox-focus-ring-color: #bfdbfe;

  --bgrid-search-bg: #ffffff;
  --bgrid-search-color: #334155;
  --bgrid-search-border-color: #d4dce8;
  --bgrid-search-control-bg: #f8fafc;
  --bgrid-search-control-color: #1f2937;
  --bgrid-search-control-border-color: #cbd5e1;
  --bgrid-search-muted-color: #64748b;
  --bgrid-search-focus-ring-color: #3b82f6;
  --bgrid-search-button-hover-bg: #f1f5f9;
  --bgrid-search-match-bg: rgba(250, 204, 21, 0.28);
  --bgrid-search-match-border-color: #ca8a04;
  --bgrid-search-current-bg: rgba(249, 115, 22, 0.3);
  --bgrid-search-current-border-color: #f97316;
  --bgrid-context-menu-bg: var(--bgrid-toolbox-bg);
  --bgrid-context-menu-color: var(--bgrid-toolbox-color);
  --bgrid-context-menu-border-color: var(--bgrid-toolbox-control-border-color);
  --bgrid-context-menu-hover-bg: var(--bgrid-toolbox-hover-bg);
  --bgrid-context-menu-muted-color: var(--bgrid-toolbox-muted-color);
  --bgrid-floating-z-editor: 9999;
  --bgrid-floating-z-toolbox: 20;
  --bgrid-floating-z-context-menu: 30;
  --bgrid-search-z-index: 31;

  --bgrid-scroll-size: 11px;
  --bgrid-scroll-bg: #ffffff;
  --bgrid-scroll-track-bg: #f6f6f6;
  --bgrid-scroll-thumb-radius: 100px;
  --bgrid-scroll-thumb-bg: #c7ccda;
  --bgrid-scroll-thumb-hover-bg: #a1a3a6;
  --bgrid-scroll-corner-bg: #c7ccda;
  --bgrid-scroll-corner-radius: 5px;

  --bgrid-loading-bg: rgba(163, 163, 163, 0.1);
  --bgrid-loading-color: rgba(0, 0, 0, 0.1);
  --bgrid-loading-second-color: #767676;

  --bgrid-page-number-active-border-radius: 4px;
}
```

Common customization targets:

| Area            | Variables                                                                                                                                                                                                            |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary accents | `--bgrid-primary-color`                                                                                                                                                                                               |
| Header          | `--bgrid-header-bg`, `--bgrid-header-color`, `--bgrid-header-font-weight`, `--bgrid-header-hover-bg`, `--bgrid-header-group-bg`, `--bgrid-header-separator-color`                                                          |
| Borders         | `--bgrid-border-color-base`, `--bgrid-border-color-light`, `--bgrid-border-color-subtle`, `--bgrid-frozen-boundary-color`, `--bgrid-frozen-boundary-width`, `--bgrid-border-radius`                                                           |
| Body rows       | `--bgrid-body-bg`, `--bgrid-body-odd-bg`, `--bgrid-body-hover-bg`, `--bgrid-body-hover-odd-bg`, `--bgrid-body-active-bg`, `--bgrid-body-color`                                                                             |
| Cell selection  | `--bgrid-cell-selected-bg`, `--bgrid-cell-selected-overlay-opacity`, `--bgrid-cell-selected-border-color`, `--bgrid-cell-selected-border-width`, `--bgrid-active-cell-bg`, `--bgrid-active-cell-ring-color`, `--bgrid-active-cell-ring-width`                    |
| Selection axes  | `--bgrid-selection-axis-bg`, `--bgrid-selection-axis-color`, `--bgrid-selection-axis-border-color`                                                                                                                      |
| Edited cells    | `--bgrid-cell-edited-bg`, `--bgrid-cell-edited-color`, `--bgrid-cell-edited-border-color`                                                                                                                              |
| Changed values  | `--bgrid-cell-value-changed-bg`, `--bgrid-cell-value-changed-color`, `--bgrid-cell-value-changed-border-color`                                                                                                          |
| Summary/Footer  | `--bgrid-summary-bg`, `--bgrid-footer-bg`                                                                                                                                                                              |
| Filter toolbox  | `--bgrid-toolbox-bg`, `--bgrid-toolbox-color`, `--bgrid-toolbox-muted-color`, `--bgrid-toolbox-control-*`, `--bgrid-toolbox-hover-bg`, `--bgrid-toolbox-active-bg`, `--bgrid-toolbox-danger-*`, `--bgrid-toolbox-button-bg`, `--bgrid-toolbox-primary-*`, `--bgrid-toolbox-notice-bg`, `--bgrid-toolbox-scroll-*`, `--bgrid-toolbox-focus-ring-color` |
| Grid search     | `--bgrid-search-bg`, `--bgrid-search-color`, `--bgrid-search-border-color`, `--bgrid-search-control-*`, `--bgrid-search-muted-color`, `--bgrid-search-focus-ring-color`, `--bgrid-search-button-hover-bg`, `--bgrid-search-match-*`, `--bgrid-search-current-*`, `--bgrid-search-z-index`                                                           |
| Context menu    | `--bgrid-context-menu-bg`, `--bgrid-context-menu-color`, `--bgrid-context-menu-border-color`, `--bgrid-context-menu-hover-bg`, `--bgrid-context-menu-muted-color`, `--bgrid-floating-z-*`                                                                                                                                                       |
| Scrollbars      | `--bgrid-scroll-size`, `--bgrid-scroll-bg`, `--bgrid-scroll-track-bg`, `--bgrid-scroll-thumb-radius`, `--bgrid-scroll-thumb-bg`, `--bgrid-scroll-thumb-hover-bg`, `--bgrid-scroll-corner-bg`, `--bgrid-scroll-corner-radius` |
| Loading overlay | `--bgrid-loading-bg`, `--bgrid-loading-color`, `--bgrid-loading-second-color`                                                                                                                                           |
| Pagination      | `--bgrid-page-number-active-border-radius`                                                                                                                                                                            |

`selectedRowKey` row highlighting uses `--bgrid-body-active-bg`. Cell selection is painted by pointer-transparent overlay rectangles rather than per-cell borders. The overlay uses `--bgrid-cell-selected-bg` for the fill, `--bgrid-cell-selected-overlay-opacity` for fill opacity, and `--bgrid-cell-selected-border-color` for the selection edge. By default, `--bgrid-cell-selected-bg` references `--bgrid-body-active-bg` so row selection and cell selection stay in the same color tone.

When a range crosses frozen rows or columns, the Grid splits the overlay into the corresponding panel fragments and draws only the outside perimeter. This keeps the selection rectangular across merged cells and synchronized with horizontal and vertical scrolling.

The focused cell uses `--bgrid-active-cell-bg`. A single-cell selection also uses the inset ring controlled by `--bgrid-active-cell-ring-color` and `--bgrid-active-cell-ring-width`. During multi-cell selection the focused cell has no individual ring; only the outer border of the complete selection range is rendered. Its width is controlled by `--bgrid-cell-selected-border-width`, which defaults to the single-cell ring width.

The column headers and line numbers covered by the active cell or a multi-cell range receive `bgrid-column-axis-active` and `bgrid-row-axis-active`. Their fill, text, and inset axis line use the three `--bgrid-selection-axis-*` variables.

Cells directly changed by a text editor, plugin editor, legacy inline editor, or clipboard paste receive `bgrid-cell-edited` and `data-bgrid-cell-edited="true"`. The row wrapper records those stable column ids in `editedColumnIds`. It separately records normalized data key tokens in `changedKeys`. Every column sharing a changed key receives `bgrid-cell-value-changed` and `data-bgrid-cell-value-changed="true"`, even when only one column instance was directly edited. Clear both arrays after a successful commit. The two states use the `--bgrid-cell-edited-*` and `--bgrid-cell-value-changed-*` palettes; the changed-value palette defaults to the edited-cell palette.

The filter toolbox, editor plugins, and cell context menu share a document-level floating portal per Grid instance. The Grid copies its public `--bgrid-*` variables to that portal, so instance-level themes continue to apply outside the Grid DOM subtree.

### Grid Search and Cell Context Menu

Pass `searchOptions` to enable search over all currently loaded display rows. The Grid searches Store data rather than rendered DOM, highlights every matching cell, and scrolls virtual or frozen regions when moving between results.

Dedicated context menu example: [`examples/ContextMenuExample.tsx`](./examples/ContextMenuExample.tsx)

```tsx
<BGrid
  columns={columns}
  data={data}
  rowKey='id'
  searchOptions={{}}
  contextMenuOptions={{
    items: target => [
      {
        id: 'inspect-row',
        label: 'Inspect row',
        onSelect: () => console.log(target.sourceIndex, target.values),
      },
    ],
  }}
/>
```

- `Ctrl+F` / `Cmd+F`: open search in the focused Grid.
- `Enter` / `Shift+Enter`: next / previous match.
- `Escape`: close search and clear highlights.
- Right-click: activate and select the target cell before opening the body-cell context menu.
- Selecting another cell closes the open context menu.
- `Shift+F10`: open the context menu for the active cell.
- Search covers only rows currently supplied to the Grid. Server-wide search and result filtering are separate concerns.
- Searchable text defaults to the value read from `item.values`. Use column `getSearchText` when `itemRender` displays a formatted value, or `searchable: false` to exclude a column.

Controlled `searchOptions.open` and `searchOptions.query` require their matching callbacks:

```tsx
searchOptions={{
  open,
  query,
  onOpenChange: setOpen,
  onQueryChange: setQuery,
}}
```

Example: scope a custom blue selection theme to one grid wrapper.

```css
.my-grid [role='grid'] {
  --bgrid-primary-color: #2563eb;
  --bgrid-body-active-bg: #e0f2fe;
  --bgrid-cell-selected-bg: var(--bgrid-body-active-bg);
  --bgrid-cell-selected-overlay-opacity: 0.72;
  --bgrid-cell-selected-border-color: rgba(37, 99, 235, 0.72);
}
```

## Usage

- codesandbox DEMO : https://codesandbox.io/p/devbox/basic-example-5ch6kt?embed=1&file=%2Fsrc%2FApp.tsx

### Basic Example

```typescript jsx
import * as React from 'react';
import { BGrid, BGridColumn } from 'beautiful-grid';

interface IListItem {
  id: string;
  title: string;
  writer: string;
  createAt: string;
}

const list = Array.from({ length: 1000 }).map((_, i) => ({
  values: {
    id: `ID_${i}`,
    title: `title_${i}`,
    writer: `writer_${i}`,
    createAt: `2022-09-08`,
  },
}));

function BasicExample() {
  const [columns, setColumns] = React.useState<BGridColumn<IListItem>[]>([
    { key: 'id', label: 'ID', width: 120 },
    {
      key: 'title',
      label: '제목',
      width: 260,
      itemRender: ({ values }) => (
        <>
          {values.writer} / {values.title}
        </>
      ),
    },
    { key: 'writer', label: '작성자', width: 120 },
    { key: 'createAt', label: '작성일', width: 140 },
  ]);

  const [checkedRowKeys, setCheckedRowKeys] = React.useState<React.Key[]>([]);

  return (
    <div style={{ fontSize: 13 }}>
      <BGrid<IListItem>
        width={720}
        height={420}
        data={list}
        columns={columns}
        rowKey={'id'}
        onChangeColumns={(columnIndex, { width, columns }) => {
          console.log('onChangeColumns', columnIndex, width, columns);
          setColumns(columns);
        }}
        rowChecked={{
          checkedRowKeys,
          onChange: (checkedIndexes, checkedRowKeys, checkedAll) => {
            console.log('rowChecked changed', checkedIndexes, checkedRowKeys, checkedAll);
            setCheckedRowKeys(checkedRowKeys);
          },
        }}
      />
    </div>
  );
}

export default BasicExample;
```

### Important Data/Column Rules

- Row data type is `BGridDataItem<T>` and the real domain model is always inside `item.values`.
- `BGridColumn.key` supports both `string` and `string[]`.
  - `key: 'writer'`
  - `key: ['user', 'profile', 'name']` (nested value path)
- `itemRender` receives both:
  - `value`: current cell value by `column.key`
  - `values`: full row model (`T`)
- `columns[i].left` is internal layout value computed by `BGrid`; do not manage it manually.

### Header Toolbox: Sorting and Filtering

Add `toolbox` to a column and control the applied sort/filter state through `dataControl.query`. Query state is controlled: `onChange` receives a new query, and the consumer must pass that query back to the Grid.

```typescript jsx
import * as React from 'react';
import { BGrid, BGridColumn, BGridDataItem, BGridDataQuery } from 'beautiful-grid';

interface Product {
  id: number;
  name: string;
  category: string;
  price: number;
}

const columns: BGridColumn<Product>[] = [
  {
    id: 'name',
    key: 'name',
    label: 'Name',
    width: 220,
    toolbox: true,
    filter: { type: 'text' },
  },
  {
    id: 'category',
    key: 'category',
    label: 'Category',
    width: 140,
    toolbox: true,
    filter: { type: 'values' },
  },
  {
    id: 'price',
    key: 'price',
    label: 'Price',
    width: 120,
    toolbox: { sort: true, filter: true },
    filter: { type: 'number' },
  },
];

function ProductGrid({ data }: { data: BGridDataItem<Product>[] }) {
  const [query, setQuery] = React.useState<BGridDataQuery>({
    sortParams: [],
    filterParams: [],
  });

  return (
    <BGrid<Product>
      width={720}
      height={420}
      data={data}
      columns={columns}
      rowKey='id'
      dataControl={{
        mode: 'client',
        multiSort: true,
        query,
        onChange: nextQuery => setQuery(nextQuery),
      }}
    />
  );
}
```

Toolbox configuration:

- `toolbox: true` enables the built-in sort and filter sections.
- `toolbox: { sort, filter, extraItems, render, icons }` configures sections and custom content. Object form enables only sections explicitly set to `true`.
- `filter.type` supports `values`, `text`, and `number`. Use `filter: false` to suppress the filter section.
- Give every Toolbox column a stable, unique `id`, especially when multiple columns read the same `key`.
- Grid-level `icons` supplies default Toolbox icons. A column-level `toolbox.icons` overrides them for that column.

Data modes:

- `mode: 'client'` filters and sorts the complete `data` array inside the Grid. Do not combine it with externally paged data as if the current page were the complete data set.
- `mode: 'manual'` only emits the next query. Fetch, filter, sort, and paginate on the server, then pass the resulting `data` back. For a manual `values` filter, provide `filter.values` because the Grid must not infer the full server-side value domain from one page.
- `mode` defaults to `manual`. Set it explicitly when shared configuration should make the processing location obvious.
- `dataControl` takes precedence over the legacy `sort` prop. Existing grids can continue using `sort` when Toolbox filtering is not needed.

Manual/server-controlled example:

```typescript jsx
<BGrid
  width={720}
  height={420}
  data={serverPage}
  columns={columns}
  page={page}
  dataControl={{
    mode: 'manual',
    query,
    onChange: (nextQuery, event) => {
      setQuery(nextQuery);
      requestPage({ page: 0, query: nextQuery, changedBy: event });
    },
  }}
/>
```

Pivot mode disables the default Toolbox. Row reordering is automatically disabled while a client-side filter or sort is active because displayed row order no longer represents the source array order.

### Row Reorder

Enable line numbers and `reorder` to move rows. The dedicated handle supports pointer drag and keyboard operation: focus it, press `Space` or `Enter` to pick up, use `ArrowUp`/`ArrowDown`, then press `Enter` to drop or `Escape` to cancel.

```typescript jsx
<BGrid
  data={data}
  columns={columns}
  rowKey='id'
  showLineNumber
  reorder={{
    enabled: true,
    onReorder: nextData => {
      setData(nextData);
      return true;
    },
  }}
/>
```

The Grid previews the source, shifted rows, and insertion target before changing data. It commits once after the settle motion. Returning `false` from the synchronous `onReorder` callback rolls the operation back; `true` or `void` keeps it. Checked rows and the active cell follow the moved item, while an open editor blocks reordering. Virtual scrolling supports edge auto-scroll and an off-screen source preview. Merged-cell grids use a safe preview fallback instead of transforming `rowspan` geometry. Reduced-motion preferences remove both the transition and its commit delay.

Row reordering is disabled for pivot output, frozen rows, and active client-side sort/filter queries. `onReorder` is not a Promise-based save lifecycle; applications that persist remotely should own their optimistic update and failure policy.

### Cell Selection and Clipboard

Cell selection is enabled by default. Cells can be selected by mouse drag, and `Ctrl+C` or `Cmd+C` copies selected cell text using tab (`\t`) between columns and carriage return (`\r`) between rows. In an editable grid, select a target cell and press `Ctrl+V` or `Cmd+V` to paste tab/newline-delimited data from that cell. Disable the feature when it is not needed:

```typescript jsx
<BGrid width={700} height={400} columns={columns} data={data} cellSelectionOptions={{ enabled: false }} />
```

Cell selection is kept when the user clicks inside the grid, including empty body space or the grid scrollbar. By default, selection is cleared when `Escape` is pressed or when the user clicks outside the grid. Use `cellSelectionOptions` to change those clear rules:

```typescript jsx
<BGrid
  width={700}
  height={400}
  columns={columns}
  data={data}
  cellSelectionOptions={{
    enabled: true,
    clearOnEscape: false,
    clearOnOutsideClick: false,
    maxClipboardCells: 100000,
    maxClipboardTextLength: 8 * 1024 * 1024,
    onCopyError: error => {
      console.warn(error);
    },
    onPasteError: error => {
      console.warn(error);
    },
    createRowOnPaste: () => ({
      values: createEmptyRow(),
    }),
  }}
/>
```

Clipboard copy is skipped before building clipboard text when the selected range is too large. The default limits are
`maxClipboardCells: 100000` and `maxClipboardTextLength: 8 * 1024 * 1024`. The same limits apply to paste. Use `onCopyError` or `onPasteError` to notify users when clipboard work is skipped, parsing fails, or the browser rejects the clipboard write.

Pasted data beyond the last row is clipped unless `createRowOnPaste` is provided. The callback creates each missing row, which is registered with `BGridDataItemStatus.new` and reported through `onChangeData(rowIndex, null, values, null)`.

By default, copied text is read from `column.key`:

```typescript jsx
{ key: 'title', label: 'Title', width: 240 }
```

If a column renders a custom component or needs a different clipboard value, define `getClipboardText` on the column. `getClipboardText` is used before falling back to the `column.key` value.

```typescript jsx
const columns: BGridColumn<IListItem>[] = [
  {
    key: 'title',
    label: 'Title',
    width: 260,
    itemRender: ({ values }) => (
      <>
        {values.writer} / {values.title}
      </>
    ),
    getClipboardText: ({ values }) => `${values.writer}\t${values.title}`,
  },
  {
    key: ['user', 'profile', 'name'],
    label: 'User',
    width: 160,
    getClipboardText: ({ value, values }) => value ?? values.writer,
  },
];
```

### Cell Focus and Keyboard Navigation

Click a cell to make it active, then use Arrow keys, Home/End, PageUp/PageDown, or Tab to move. `Shift` + Arrow extends the cell selection. `Ctrl`/`Cmd` + Arrow moves to an edge, and `Ctrl`/`Cmd` + Home/End moves to the first or last grid cell.

Use `cellNavigationOptions` when the active cell must be initialized or controlled by the application:

```typescript jsx
const [activeCell, setActiveCell] = React.useState({ rowIndex: 0, columnIndex: 1 });

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
    wrap: false,
    editOnEnter: true,
    keyRepeat: { interval: 16 },
  }}
/>;
```

`F2` starts editing the active editable cell. `Enter` also starts editing when `editable` and `editOnEnter` are enabled; otherwise `Enter` and `Space` invoke the active cell's `onClick` callback without moving focus. Holding an Arrow key switches from the operating system repeat event to a frame-synchronized repeat loop; use `keyRepeat.interval` to tune the interval in milliseconds or `keyRepeat.enabled: false` to retain native repeat timing. Interactive elements such as inputs and buttons keep their own keyboard behavior. See the runnable [cell navigation example](examples/CellNavigationExample.tsx) and the [keyboard guide](site/src/content/learn/cell-navigation.md).

### Pivot

Pass `pivot` to render the grid as a derived pivot table. The API follows the Excel-style field areas:

- `rows`: row fields
- `columns`: column fields
- `values`: value fields and aggregate rules

When `pivot` is active, row-based grid UI is disabled internally because the rendered rows are derived summary rows. This includes frozen columns, line numbers, row check controls, sorting, column sorting, editing, pagination, summary, cell merge, reorder, and row/cell change callbacks.

```typescript jsx
import * as React from 'react';
import { BGrid, BGridColumn, BGridProps } from 'beautiful-grid';

interface SalesItem {
  region: string;
  product: string;
  quarter: string;
  sales: number;
  quantity: number;
}

const data = [
  { values: { region: 'North', product: 'Desk', quarter: 'Q1', sales: 1200, quantity: 12 } },
  { values: { region: 'North', product: 'Desk', quarter: 'Q2', sales: 1400, quantity: 10 } },
  { values: { region: 'South', product: 'Chair', quarter: 'Q1', sales: 900, quantity: 8 } },
];

const columns: BGridColumn<SalesItem>[] = [
  { key: 'region', label: 'Region', width: 120 },
  { key: 'product', label: 'Product', width: 140 },
  { key: 'quarter', label: 'Quarter', width: 100 },
  { key: 'sales', label: 'Sales', width: 120, align: 'right' },
  { key: 'quantity', label: 'Quantity', width: 120, align: 'right' },
];

const pivot: BGridProps<SalesItem>['pivot'] = {
  rows: [{ key: 'product', label: 'Product', width: 140 }],
  columns: [{ key: 'region', label: 'Region' }],
  values: [
    {
      key: 'sales',
      label: 'Sales',
      aggregate: 'sum',
      itemRender: ({ value, columnValues, sourceItems }) => {
        const text = `$${Number(value).toLocaleString()}`;
        if (columnValues[0] === 'South') {
          return <strong title={`${sourceItems.length} source rows`}>{text}</strong>;
        }
        return <span title={`${sourceItems.length} source rows`}>{text}</span>;
      },
      getClipboardText: ({ value }) => Number(value).toLocaleString(),
    },
    {
      key: 'quantity',
      label: 'Quantity',
      aggregate: 'sum',
      itemRender: ({ value }) => <>{Number(value).toLocaleString()} ea</>,
    },
  ],
  emptyValue: 0,
};

function PivotExample() {
  return (
    <BGrid<SalesItem>
      width={900}
      height={420}
      columns={columns}
      data={data}
      pivot={pivot}
      variant={'vertical-bordered'}
    />
  );
}
```

Built-in aggregate values:

| Aggregate | Description                       |
| --------- | --------------------------------- |
| `sum`     | Numeric sum. This is the default. |
| `count`   | Number of source values.          |
| `avg`     | Numeric average.                  |
| `min`     | Numeric minimum.                  |
| `max`     | Numeric maximum.                  |
| `first`   | First source value.               |

You can also pass a custom aggregate function:

```typescript jsx
const pivot: BGridProps<SalesItem>['pivot'] = {
  rows: [{ key: 'product', label: 'Product' }],
  columns: [{ key: 'quarter', label: 'Quarter' }],
  values: [
    {
      key: 'sales',
      label: 'Max online sales',
      aggregate: ({ items }) => {
        return Math.max(...items.filter(item => item.values.region === 'North').map(item => item.values.sales));
      },
    },
  ],
};
```

`pivot.values[].itemRender` receives the normal cell render props plus pivot context:

| Prop           | Description                                     |
| -------------- | ----------------------------------------------- |
| `value`        | Aggregated cell value                           |
| `values`       | Pivot result row values                         |
| `rowValues`    | Values for the current pivot row fields         |
| `columnValues` | Values for the current pivot column fields      |
| `sourceItems`  | Original `BGridDataItem<T>[]` used for this cell |
| `pivotValue`   | The current value-field definition              |
| `aggregate`    | The current aggregate setting                   |

### Common Scenarios

#### 1) Frozen Columns

```typescript jsx
<BGrid width={900} height={500} frozenColumnIndex={2} columns={columns} data={data} />
```

`frozenColumnIndex` 이전 컬럼(0, 1)은 고정 영역으로 렌더링됩니다.

행과 컬럼을 함께 고정할 수 있습니다. 상단 Summary Row를 사용하면 고정 행은 Summary 바로 다음 줄부터 시작합니다.

```typescript jsx
<BGrid
  width={900}
  height={500}
  frozenColumnIndex={2}
  frozenRowCount={3}
  summary={{ position: 'top', columns: summaryColumns }}
  columns={columns}
  data={data}
/>
```

#### 2) Editable Cell

```typescript jsx
const columns: BGridColumn<IListItem>[] = [
  {
    key: 'title',
    label: '제목',
    width: 240,
    editable: true,
    editor: {
      type: 'text',
      startOnInput: true,
      inputProps: { maxLength: 100, autoComplete: 'off' },
    },
  },
];

<BGrid editable editTrigger={'dblclick'} columns={columns} data={data} width={700} height={400} />;
```

The built-in text editor supports direct typing, IME composition, Enter/F2 preserve mode, Escape cancel,
and focus return after editing. Prebuilt Select and Date plugins are available from the editor subpath:

```typescript jsx
import { createDateEditorPlugin, createSelectEditorPlugin } from 'beautiful-grid/editors';

const statusEditor = createSelectEditorPlugin<IListItem>({
  id: 'status',
  options: [
    { value: 'ready', label: 'Ready' },
    { value: 'done', label: 'Done' },
  ],
});

const dateEditor = createDateEditorPlugin<IListItem>({ id: 'delivery-date' });
```

Use `defineEditorPlugin()` from the same subpath to connect application-specific editors. Portal-based UI
components should mount their popup into the `getPortalContainer()` supplied to the plugin component.

#### 3) Sort + Page

```typescript jsx
<BGrid
  width={900}
  height={560}
  columns={columns}
  data={rows}
  sort={{
    sortParams,
    onChange: next => setSortParams(next),
  }}
  page={{
    currentPage,
    pageSize,
    totalPages,
    totalElements,
    onChange: (nextPage, nextSize) => {
      setCurrentPage(nextPage);
      if (nextSize) setPageSize(nextSize);
    },
  }}
/>
```

### Props Reference (BGrid)

아래는 자주 사용하는 Props 중심 정리입니다. 타입의 최종 기준은 `beautiful-grid/types.ts`의 `BGridProps<T>`입니다.

#### Required

| Prop      | Type                                 | Description      |
| --------- | ------------------------------------ | ---------------- |
| `width`   | `number`                             | 그리드 전체 너비 |
| `height`  | `number`                             | 그리드 전체 높이 |
| `columns` | `BGridColumn<T>[]` (`width` optional) | 컬럼 정의        |

#### Data / Selection / Row Focus

| Prop              | Type                                | Description                                 |
| ----------------- | ----------------------------------- | ------------------------------------------- |
| `data`            | `BGridDataItem<T>[]`                 | 행 데이터 (`values` 래핑 필수)              |
| `rowKey`          | `React.Key \| React.Key[]`          | 행 고유 키 필드                             |
| `selectedRowKey`  | `React.Key \| React.Key[]`          | 포커스된 행 키                              |
| `rowChecked`      | `BGridRowChecked<T>`                 | 체크박스/라디오 선택 제어 (`onChange` 필수) |
| `getRowClassName` | `(ri, item) => string \| undefined` | 행 단위 className 지정                      |

> `rowSelection` / `selectedIds`는 현재 API가 아닙니다. `rowChecked`를 사용해야 합니다.

#### Layout / Rendering

| Prop                | Type                               | Description                      |
| ------------------- | ---------------------------------- | -------------------------------- |
| `headerHeight`      | `number`                           | 헤더 높이 (기본 30)              |
| `footerHeight`      | `number`                           | 페이지네이션 푸터 높이 (기본 30) |
| `summaryHeight`     | `number`                           | summary 높이 (기본 30)           |
| `itemHeight`        | `number`                           | 본문 행 컨텐츠 높이 (기본 15)    |
| `itemPadding`       | `number`                           | 행 내부 패딩 (기본 7)            |
| `frozenColumnIndex` | `number`                           | 고정 컬럼 경계 인덱스            |
| `frozenRowCount`    | `number`                           | 상단에 고정할 선행 데이터 행 수  |
| `showLineNumber`    | `boolean`                          | 좌측 라인 번호 표시              |
| `variant`           | `'default' \| 'vertical-bordered'` | 스킨 변형                        |
| `loading`           | `boolean`                          | 전체 오버레이 로딩               |
| `spinning`          | `boolean`                          | 바디 스피너 로딩                 |

#### Column / Editing / Events

| Prop              | Type                                         | Description                        |
| ----------------- | -------------------------------------------- | ---------------------------------- |
| `columnGroups`    | `BGridColumnGroupNode[]`                      | 컬럼 ID 기반 임의 깊이 헤더 그룹   |
| `columnsGroup`    | `BGridColumnGroup[]`                          | 레거시 2단 헤더 그룹 (deprecated)  |
| `onChangeColumns` | `(columnIndex, info) => void`                | 컬럼 폭/순서/그룹 변경 콜백        |
| `onChangeData`    | `(index, columnIndex, item, column) => void` | 셀 편집 데이터 변경 콜백           |
| `editable`        | `boolean`                                    | 편집 모드 활성화                   |
| `editTrigger`     | `'click' \| 'dblclick'`                      | 편집 진입 트리거 (기본 `dblclick`) |
| `onClick`         | `(params) => void`                           | 셀 클릭 이벤트                     |

Each `BGridColumn<T>` can specify `editable` and an `editor`. Supported editor configs are the built-in
`{ type: 'text' }` config and plugin objects created by `defineEditorPlugin()` or the prebuilt editor factories.

Nested headers use stable column IDs and can be composed to any depth:

```tsx
<BGrid
  columns={[
    { id: 'customer', key: 'customer', label: 'Customer', width: 160 },
    { id: 'region', key: 'region', label: 'Region', width: 120 },
  ]}
  columnGroups={[
    {
      id: 'sales',
      label: 'Sales',
      children: [{ id: 'customer-info', label: 'Customer info', children: ['customer', 'region'] }],
    },
  ]}
  {...props}
/>
```

Leaf headers can be styled with `BGridColumn.headerClassName` or `BGridColumn.headerStyle`. Nested group
headers support `BGridColumnGroupNode.className` and `BGridColumnGroupNode.headerStyle`; the same styling is
preserved when a header is rendered in the frozen region.

#### Extra Features

| Prop                    | Type                                                                                                                                                                        | Description                                 |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------- |
| `sort`                  | `BGridSortInfo`                                                                                                                                                              | 정렬 상태/변경 콜백                         |
| `columnSortable`        | `boolean`                                                                                                                                                                   | 컬럼 drag sort 제어                         |
| `page`                  | `BGridPage`                                                                                                                                                                  | 페이지네이션 상태/콜백                      |
| `summary`               | `{ columns, position }`                                                                                                                                                     | 상/하단 summary 행                          |
| `cellMergeOptions`      | `{ columnsMap }`                                                                                                                                                            | 셀 병합 옵션                                |
| `cellSelectionOptions`  | `{ enabled?: boolean; clearOnEscape?: boolean; clearOnOutsideClick?: boolean; maxClipboardCells?: number; maxClipboardTextLength?: number; onCopyError?: (error) => void; onPasteError?: (error) => void; createRowOnPaste?: (context) => BGridDataItem<T> }` | 셀 선택 활성화 및 클립보드 룰 (기본 활성화) |
| `cellNavigationOptions` | `BGridCellNavigationOptions`                                                                                                                                                 | 활성 셀과 키보드 이동·편집 진입 정책        |
| `reorder`               | `BGridReorderInfo<T>`                                                                                                                                                        | 행 reorder 설정                             |
| `pivot`                 | `BGridPivotOptions<T>`                                                                                                                                                       | 피벗 테이블 렌더링 설정                     |
| `msg`                   | `{ emptyList?: string }`                                                                                                                                                    | 커스텀 메시지                               |
| `searchOptions`         | `BGridSearchOptions<T>`                                                                                                                                                                                                                                       | 검색 UI, 단축키, 문자열 getter와 제어형 상태 |
| `contextMenuOptions`    | `BGridContextMenuOptions<T>`                                                                                                                                                                                                                                  | 본문 셀 우클릭/키보드 메뉴 항목              |

## Update Note

### v1.5

- rowChecked 속성 추가 (rowChecked > isRadio, rowChecked > disabled)

```typescript
<BGrid<IListItem>
  width={containerWidth}
  height={containerHeight}
  headerHeight={35}
  data={sortedList}
  columns={columns}
  onChangeColumns={(columnIndex, { width, columns }) => {
    console.log('onChangeColumnWidths', columnIndex, width, columns);
    setColumns(columns);
  }}
  rowChecked={{
    disabled: (ri, item) => ri === 0,
    isRadio: true,
    checkedRowKeys: checkedKeys,
    onChange: (ids, keys, selectedAll) => {
      console.log('onChange rowSelection', ids, keys, selectedAll);
      setCheckedKeys(keys);
    },
  }}
  sort={{
    sortParams,
    onChange: sortParams => {
      console.log('onChange: sortParams', sortParams);
      setSortParams(sortParams);
    },
  }}
  showLineNumber
  rowKey={'nation'}
/>
```

### V1.4

- columnsGroup 타입변경
  기존 columnsIndex: []에서 start, end 지정 형태로 변경되었습니다.

```typescript jsx
[{ label: '묶음', groupStartIndex: 2, groupEndIndex: 4, align: 'center' }];
```

- onChangeColumns 속성 변경

```typescript jsx
// onChangeColumns Type
onChangeColumns?: (
  columnIndex: number | null,
  info: {
    width?: number;
    columns: BGridColumn<T>[];
    columnsGroup?: BGridColumnGroup[];
    columnGroups?: BGridColumnGroupNode[];
  },
) => void;

// onChangeColumns에서 변경된 컬럼과 컬럼 그룹을 받을 수 있습니다
<BGrid
  /*...*/
  onChangeColumns={(columnIndex, { columns, columnsGroup }) => {
    console.log('onChangeColumnWidths', columnIndex, columns, columnsGroup);
    setColumns(columns);
    setColumnsGroup(columnsGroup);
  }}
/>
```
