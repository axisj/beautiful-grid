# BeautifulGrid

**Beautiful. Powerful. Naturally React.**

[![NPM version](https://img.shields.io/npm/v/beautiful-grid?logo=npm)](https://npmjs.org/package/beautiful-grid)
[![NPM downloads](https://img.shields.io/npm/dm/beautiful-grid?color=blue&logo=npm)](https://npmjs.org/package/beautiful-grid)
[![Bundle size](https://img.shields.io/badge/minzipped-62.6%20KiB-success)](https://bgrid.axisj.com)
[![Unpacked size](https://img.shields.io/npm/unpacked-size/beautiful-grid?color=informational)](https://www.npmjs.com/package/beautiful-grid)
[![Test](https://img.shields.io/github/actions/workflow/status/axisj/beautiful-grid/tests.yml?branch=main&label=tests&logo=github)](https://github.com/axisj/beautiful-grid/actions/workflows/tests.yml)
<br />
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/npm/types/beautiful-grid?logo=typescript&logoColor=white)](https://www.npmjs.com/package/beautiful-grid)
[![React](https://img.shields.io/badge/React-%5E19.0.0-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Node](https://img.shields.io/badge/node-%3E%3D22-339933?logo=node.js&logoColor=white)](https://nodejs.org)
[![Last commit](https://img.shields.io/github/last-commit/axisj/beautiful-grid?logo=git)](https://github.com/axisj/beautiful-grid/commits/main)
<br />
[![GitHub stars](https://img.shields.io/github/stars/axisj/beautiful-grid?logo=github)](https://github.com/axisj/beautiful-grid/stargazers)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/axisj/beautiful-grid/pulls)
[![Docs](https://img.shields.io/badge/docs-bgrid.axisj.com-blue?logo=googlechrome&logoColor=white)](https://bgrid.axisj.com)

<p align="center">
  <a href="https://bgrid.axisj.com">
    <img src="https://raw.githubusercontent.com/axisj/beautiful-grid/main/site/public/og-image-en.png" alt="BeautifulGrid — Beautiful, Powerful Open-Source React Data Grid" width="100%" />
  </a>
</p>

<p align="center">
  <a href="https://bgrid.axisj.com"><strong>🌐 Interactive Docs & Live Demos</strong></a>&nbsp;&nbsp;•&nbsp;&nbsp;
  <a href="https://youtu.be/BBq4hPsNDNI"><strong>▶️ Watch 1-Min Walkthrough (YouTube)</strong></a>
</p>

BeautifulGrid is a high-performance, feature-packed, and beautifully designed open-source React Data Grid for data-heavy business applications. It combines zero-runtime-CSS styling with virtual scrolling, spreadsheet-like cell selection and clipboard operations, built-in and plugin cell editing, multi-level grouped headers, filtering & sorting toolboxes, recoverable column visibility, server/client pagination, pivot table transforms, row reordering, and flexible theming.

Explore live interactive examples and in-depth documentation at [bgrid.axisj.com](https://bgrid.axisj.com).

---

## Video Walkthrough

Watch 1-million row virtual scrolling, keyboard navigation, and interactive cell editing in action (1 min):

[![BeautifulGrid 1-Minute Walkthrough](https://img.youtube.com/vi/BBq4hPsNDNI/maxresdefault.jpg)](https://youtu.be/BBq4hPsNDNI)

---

## Table of Contents

- [Video Walkthrough](#video-walkthrough)
- [Install](#install)
- [Quick Start](#quick-start)
- [Core Concepts](#core-concepts)
- [Styling & Theming](#styling--theming)
- [Key Features & Usage](#key-features--usage)
  - [1. Header Toolbox: Sorting & Filtering](#1-header-toolbox-sorting--filtering)
  - [2. Multi-Level Column Groups](#2-multi-level-column-groups)
  - [3. Cell Editing & Editor Plugins](#3-cell-editing--editor-plugins)
  - [4. Cell Focus & Keyboard Navigation](#4-cell-focus--keyboard-navigation)
  - [5. Cell Selection & Clipboard (Excel-compatible)](#5-cell-selection--clipboard-excel-compatible)
  - [6. Grid Search & Context Menu](#6-grid-search--context-menu)
  - [7. Custom Scrollbars & Bottom Bar](#7-custom-scrollbars--bottom-bar)
  - [8. Pagination (Server / Client)](#8-pagination-server--client)
  - [9. Frozen Columns & Frozen Rows](#9-frozen-columns--frozen-rows)
  - [10. Row Reordering](#10-row-reordering)
  - [11. Summary Row](#11-summary-row)
  - [12. Cell Merging](#12-cell-merging)
  - [13. Pivot Table](#13-pivot-table)
  - [14. Column Visibility](#14-column-visibility)
  - [15. Tree Grid](#15-tree-grid)
  - [16. Master-Detail (Nested Grid)](#16-master-detail-nested-grid)
- [Props Reference](#props-reference)
  - [BGridProps](#bgridprops)
  - [BGridColumn](#bgridcolumn)
  - [Sub-options Reference](#sub-options-reference)
- [Developer Workflows](#developer-workflows)
- [License](#license)

---

## Install

```bash
npm install beautiful-grid
```

Or using your favorite package manager:

```bash
# pnpm
pnpm add beautiful-grid

# yarn
yarn add beautiful-grid
```

> **Peer Dependency**: BeautifulGrid requires `react ^19.2.0` and `react-dom ^19.2.0`.

---

## Quick Start

Import the static stylesheet once at your application's entry point (e.g. `src/main.tsx`, `src/App.tsx`, or Next.js `app/layout.tsx`):

```typescript jsx
import 'beautiful-grid/style.css';
```

Then create your first grid:

```typescript jsx
import * as React from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface OrderItem {
  id: string;
  customer: string;
  product: string;
  qty: number;
  amount: number;
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED';
}

const columns: BGridColumn<OrderItem>[] = [
  { id: 'id', key: 'id', label: 'Order ID', width: 120 },
  { id: 'customer', key: 'customer', label: 'Customer', width: 160 },
  { id: 'product', key: 'product', label: 'Product', width: 200 },
  {
    id: 'qty',
    key: 'qty',
    label: 'Qty',
    width: 90,
    align: 'right',
    itemRender: ({ value }) => <>{Number(value).toLocaleString()} ea</>,
  },
  {
    id: 'amount',
    key: 'amount',
    label: 'Amount',
    width: 130,
    align: 'right',
    itemRender: ({ value }) => <strong>${Number(value).toLocaleString()}</strong>,
  },
  {
    id: 'status',
    key: 'status',
    label: 'Status',
    width: 120,
    align: 'center',
    itemRender: ({ value }) => (
      <span style={{ color: value === 'DELIVERED' ? '#16a34a' : '#ea580c', fontWeight: 600 }}>{value}</span>
    ),
  },
];

const sampleData: BGridDataItem<OrderItem>[] = [
  {
    values: { id: 'ORD-001', customer: 'Acme Corp', product: 'Sensor A1', qty: 12, amount: 1440, status: 'DELIVERED' },
  },
  { values: { id: 'ORD-002', customer: 'Global Tech', product: 'Module X', qty: 5, amount: 850, status: 'PENDING' } },
  {
    values: {
      id: 'ORD-003',
      customer: 'Logi Systems',
      product: 'Gateway V2',
      qty: 20,
      amount: 3200,
      status: 'SHIPPED',
    },
  },
];

export default function OrderGridPage() {
  const [columnsState, setColumnsState] = React.useState(columns);
  const [checkedRowKeys, setCheckedRowKeys] = React.useState<React.Key[]>([]);

  return (
    <div style={{ width: 840, height: 380 }}>
      <BGrid<OrderItem>
        width={840}
        height={380}
        data={sampleData}
        columns={columnsState}
        rowKey='id'
        showLineNumber
        rowChecked={{
          checkedRowKeys,
          onChange: (_indexes, keys) => setCheckedRowKeys(keys),
        }}
        onChangeColumns={(_colIndex, info) => setColumnsState(info.columns)}
      />
    </div>
  );
}
```

---

## Core Concepts

1. **Row Data Wrapper (`BGridDataItem<T>`)**:
   - Each row item is wrapped in `{ values: T }`. Always access and supply domain models inside `item.values`.
   - Grid internally tracks state metadata (`status`, `editedColumnIds`, `changedKeys`, `checked`).
2. **Column Key & Nested Paths (`BGridColumn.key`)**:
   - Flat key: `key: 'name'` accesses `item.values.name`.
   - Nested key: `key: ['user', 'profile', 'email']` safely accesses `item.values.user.profile.email`.
3. **Column Identifier (`BGridColumn.id`)**:
   - Unique identifier used for multi-level `columnGroups`, toolbox sort/filter states, and column persistence.
   - If omitted, an ID is generated automatically from `key` (e.g. `key:string:name`). Providing explicit unique IDs is recommended when multiple columns share the same key.
4. **Dimensions & Virtualization**:
   - `width` and `height` (in pixels) are required for viewport virtualization calculations.
   - For responsive designs, observe the container size with `ResizeObserver` and pass the measured pixel dimensions to `<BGrid>`.
5. **No Runtime CSS-in-JS**:
   - High performance and zero runtime overhead using static `.bgrid-*` classes and `--bgrid-*` CSS custom properties.

### Variable Row Heights

Use `getRowHeight(row, index)` when rows need explicit, data-driven heights. The callback receives the row's
`values` object and its current displayed index (after client-side sorting or filtering), and returns the complete
row height in pixels:

```tsx
<BGrid
  itemHeight={20}
  itemPadding={5}
  getRowHeight={(row, index) => {
    if (row.type === 'group') return 48;
    if (index === 0) return 40;
    return 30;
  }}
  {...props}
/>
```

BeautifulGrid caches all returned heights and cumulative offsets when the displayed data, callback, or fixed-height
fallback changes. Scrolling then finds rows with binary search and does not call `getRowHeight` again. Keep the
callback reference stable (for example with `useCallback`) to avoid rebuilding the cache on parent renders.

Automatic content-based row height measurement is intentionally not supported, because DOM measurement would make
large virtualized datasets less predictable. When `getRowHeight` is omitted—or returns a non-finite or non-positive
value—the existing `itemHeight + itemPadding * 2` fixed height is used.

---

## Styling & Theming

Import the static stylesheet once:

```typescript jsx
import 'beautiful-grid/style.css';
```

BeautifulGrid styles are controlled via CSS custom properties scoped to `[role='grid']`. You can customize the look and feel globally or scope it to specific containers without overriding internal class names.

### Default CSS Custom Properties

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
}
```

### Scoped Theme Example

```css
.dark-theme [role='grid'] {
  --bgrid-primary-color: #60a5fa;
  --bgrid-body-bg: #1e293b;
  --bgrid-body-odd-bg: #0f172a;
  --bgrid-body-color: #f8fafc;
  --bgrid-header-bg: #334155;
  --bgrid-header-color: #f1f5f9;
  --bgrid-border-color-base: #475569;
  --bgrid-border-color-light: #475569;
  --bgrid-border-color-subtle: #334155;
  --bgrid-body-active-bg: #1e3a8a;
  --bgrid-cell-selected-border-color: #60a5fa;
}
```

---

## Key Features & Usage

### 1. Header Toolbox: Sorting & Filtering

Add `toolbox: true` (or an options object) and `filter` configs to columns. Manage query state via `dataControl`.

```typescript jsx
import * as React from 'react';
import { BGrid, type BGridColumn, type BGridDataItem, type BGridDataQuery } from 'beautiful-grid';

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
    label: 'Product Name',
    width: 220,
    toolbox: true,
    filter: { type: 'text' },
  },
  {
    id: 'category',
    key: 'category',
    label: 'Category',
    width: 150,
    toolbox: true,
    filter: { type: 'values' },
  },
  {
    id: 'price',
    key: 'price',
    label: 'Price',
    width: 130,
    toolbox: { sort: true, filter: true },
    filter: { type: 'number' },
  },
];

function ProductTable({ data }: { data: BGridDataItem<Product>[] }) {
  const [query, setQuery] = React.useState<BGridDataQuery>({
    sortParams: [],
    filterParams: [],
  });

  return (
    <BGrid<Product>
      width={800}
      height={400}
      data={data}
      columns={columns}
      rowKey='id'
      dataControl={{
        mode: 'client', // 'client' performs in-memory filtering & sorting; 'manual' delegates to server
        multiSort: true,
        query,
        onChange: nextQuery => setQuery(nextQuery),
      }}
    />
  );
}
```

- **Filter types**:
  - `'values'`: Distinct value checkbox list.
  - `'text'`: Substring match (`contains`, `equals`, `notEquals`).
  - `'number'`: Numeric operators (`equals`, `gt`, `gte`, `lt`, `lte`, `between`).
- **Data Control Modes**:
  - `mode: 'client'`: Grid automatically filters and sorts the full in-memory `data` array.
  - `mode: 'manual'`: Grid only emits queries via `onChange`. You fetch/sort on the server and pass the resulting data back.

---

### 2. Multi-Level Column Groups

Use `columnGroups` with `BGridColumnGroupNode` trees to create arbitrarily nested headers. Leaf entries reference the column `id`.

```typescript jsx
import { BGrid, type BGridColumn, type BGridColumnGroupNode } from 'beautiful-grid';

const columns: BGridColumn<Order>[] = [
  { id: 'orderNo', key: 'orderNo', label: 'Order No', width: 130 },
  { id: 'customerName', key: 'customerName', label: 'Name', width: 140 },
  { id: 'customerCity', key: ['customer', 'city'], label: 'City', width: 120 },
  { id: 'productName', key: 'productName', label: 'Product', width: 160 },
  { id: 'amount', key: 'amount', label: 'Amount', width: 120, align: 'right' },
];

const columnGroups: BGridColumnGroupNode[] = [
  {
    id: 'order-overview',
    label: 'Order Overview',
    children: [
      'orderNo',
      {
        id: 'customer-info',
        label: 'Customer Info',
        children: ['customerName', 'customerCity'],
      },
      'productName',
      'amount',
    ],
  },
];

<BGrid
  width={800}
  height={450}
  headerHeight={64}
  columns={columns}
  columnGroups={columnGroups}
  data={data}
  rowKey='orderNo'
/>;
```

---

### 3. Cell Editing & Editor Plugins

Enable editing with `editable` and assign an `editor` configuration to specific columns.

#### Built-in Text & Checkbox Editors

```typescript jsx
const columns: BGridColumn<Item>[] = [
  {
    id: 'title',
    key: 'title',
    label: 'Title',
    width: 220,
    editable: true,
    editor: {
      type: 'text',
      startOnInput: true,
      inputProps: { maxLength: 100 },
    },
  },
  {
    id: 'active',
    key: 'active',
    label: 'Active',
    width: 100,
    align: 'center',
    editable: true,
    editor: {
      type: 'checkbox',
      header: { ariaLabel: 'Toggle all active rows' },
      trueValue: true,
      falseValue: false,
    },
  },
];

<BGrid
  width={720}
  height={380}
  editable
  editTrigger='dblclick' // 'click' | 'dblclick'
  columns={columns}
  data={data}
  rowKey='id'
  onChangeData={(rowIndex, colIndex, item, column, meta) => {
    console.log('Cell updated:', rowIndex, colIndex, item, meta);
  }}
/>;
```

#### Plugin Editors (Select, Date, Custom)

Prebuilt plugin factories are exported from `beautiful-grid/editors`:

```typescript jsx
import { createSelectEditorPlugin, createDateEditorPlugin, defineEditorPlugin } from 'beautiful-grid/editors';

const statusEditor = createSelectEditorPlugin<Item>({
  id: 'status-select',
  options: [
    { value: 'READY', label: 'Ready' },
    { value: 'PROCESSING', label: 'Processing' },
    { value: 'COMPLETED', label: 'Completed' },
  ],
});

const deliveryDateEditor = createDateEditorPlugin<Item>({
  id: 'delivery-date-picker',
});

const columns: BGridColumn<Item>[] = [
  {
    id: 'status',
    key: 'status',
    label: 'Status',
    width: 160,
    editable: true,
    editor: statusEditor,
  },
  {
    id: 'deliveryDate',
    key: 'deliveryDate',
    label: 'Delivery Date',
    width: 150,
    editable: true,
    editor: deliveryDateEditor,
  },
];
```

`createSelectEditorPlugin` options:
- `options`: List of `{ value, label, disabled? }` entries.
- `allowCustomValue?: boolean`: Set `true` to allow pasting arbitrary values not present in `options` (default: `false`, rejecting unlisted values with `parseValueFailed`).
- `copyMode?: 'label' | 'value'`: Controls clipboard copy output (`'label'` by default when label is text, or `'value'`).
- `parseClipboardText?`: Override custom clipboard parsing and validation logic.
- `openOnMount?: boolean`: Automatically opens native picker on editor activation (default: `true`).

#### Editor Icons (Lookup & Quick Triggers)

Add inline trigger icons beside cell values using `editorIcon`:

```typescript jsx
{
  id: 'customer',
  key: 'customerName',
  label: 'Customer',
  width: 180,
  editorIcon: {
    render: <span>🔍</span>,
    ariaLabel: 'Open customer search dialog',
    visibility: 'hover', // 'always' | 'hover' | 'active'
    onClick: ({ commit, cancel, values }) => {
      openCustomerLookupModal({
        initialValue: values.customerName,
        onSelect: (customer) => commit([
          { key: 'customerCode', value: customer.code },
          { key: 'customerName', value: customer.name },
        ]),
        onClose: cancel,
      });
    },
  },
}
```

---

### 4. Cell Focus & Keyboard Navigation

Configure active cell handling and keyboard behavior with `cellNavigationOptions`.

```typescript jsx
<BGrid
  width={800}
  height={400}
  columns={columns}
  data={data}
  rowKey='id'
  cellNavigationOptions={{
    enabled: true,
    defaultActiveCell: { rowIndex: 0, columnIndex: 0 },
    wrap: false,
    editOnEnter: true,
    keyRepeat: { enabled: true, interval: 16 },
    onActiveCellChange: cell => {
      console.log('Active cell moved to:', cell?.rowIndex, cell?.columnIndex);
    },
  }}
/>
```

- **Navigation shortcuts**:
  - `Arrow keys`: Move focused cell (with OS or smooth frame-synced repeat).
  - `Shift + Arrow`: Extend range selection.
  - `Ctrl/Cmd + Arrow`: Jump to boundary edge.
  - `Home / End`: First / last column in current row.
  - `Ctrl/Cmd + Home / End`: First / last cell of the entire grid.
  - `Tab / Shift + Tab`: Next / previous cell.
  - `F2` or `Enter` (when `editOnEnter: true`): Start editing the focused cell.
  - `Escape`: Cancel editing or clear selection.

---

### 5. Cell Selection & Clipboard (Excel-compatible)

Cell range selection and clipboard copy/paste are enabled by default.

```typescript jsx
<BGrid
  width={800}
  height={400}
  columns={columns}
  data={data}
  rowKey='id'
  cellSelectionOptions={{
    enabled: true,
    multiSelectFocusMode: 'first',
    clearOnEscape: true,
    clearOnOutsideClick: true,
    maxClipboardCells: 100000,
    maxClipboardTextLength: 8 * 1024 * 1024,
    onCopyError: error => console.warn('Copy skipped:', error),
    onPasteError: error => console.warn('Paste failed:', error),
    createRowOnPaste: ({ rowIndex, clipboardRow, columns }) => ({
      values: createNewRowModel(clipboardRow),
    }),
  }}
/>
```

- `Ctrl+C` / `Cmd+C`: Copies selected cells as Tab-separated (`\t`) values and CRLF (`\r\n`) lines, directly pasteable into Excel or Google Sheets. Columns configured with `createSelectEditorPlugin` copy the display `label` by default.
- `Ctrl+V` / `Cmd+V`: Pastes clipboard values across editable columns:
  - **Single cell fill**: Pasting a 1×1 value into a multi-cell selection fills every cell in the selected range.
  - **Pattern tiling (Repeat)**: Pasting an $n \times m$ matrix into an $N \times M$ selection whose dimensions are exact integer multiples ($N \pmod n = 0$ and $M \pmod m = 0$) tiles/repeats the pattern across the entire selection.
  - **Non-multiple fallback**: When the selection is not an exact multiple, the matrix pastes once starting at the active cell.
- `multiSelectFocusMode: 'last'` makes the last cell selected by a drag the active cell and the paste starting point. The default is `'first'` for backward compatibility.
- **Paste validation & editor protection**:
  - `createSelectEditorPlugin` validates pasted text against option values and string labels, mapping labels back to values.
  - By default, unlisted values are rejected and reported as `parseValueFailed` through `onPasteError`, preventing data corruption. Set `allowCustomValue: true` on the select editor plugin to allow arbitrary inputs.
- Customize copied text on a per-column basis with `getClipboardText: ({ value, values }) => string`, or restore/validate custom types with `parseClipboardText: (text, context) => parsedValue`.

---

### 6. Grid Search & Context Menu

Built-in full-text search across loaded store data and right-click context menus:

```typescript jsx
<BGrid
  width={800}
  height={420}
  columns={columns}
  data={data}
  rowKey='id'
  searchOptions={{
    enabled: true,
    shortcut: true, // Cmd+F / Ctrl+F
  }}
  contextMenuOptions={{
    enabled: true,
    items: target => [
      {
        id: 'view-details',
        label: 'View Row Details',
        onSelect: () => showDetailsModal(target.values),
      },
      { type: 'separator', id: 'sep-1' },
      {
        id: 'copy-cell',
        label: 'Copy Cell Value',
        onSelect: () => navigator.clipboard.writeText(String(target.value)),
      },
    ],
  }}
/>
```

- `Ctrl+F` / `Cmd+F`: Open search popover.
- `Enter` / `Shift+Enter`: Navigate to next / previous match (with automatic scroll to virtualized row/column).
- `Shift+F10` or Right-click: Open context menu.

---

### 7. Custom Scrollbars & Bottom Bar

BeautifulGrid provides customizable scrollbars and unified bottom bar controls:

```typescript jsx
<BGrid
  width={800}
  height={400}
  columns={columns}
  data={data}
  rowKey='id'
  bottomBarHeight={34}
  scrollbar={{
    variant: 'modern', // 'modern' (sleek overlay) | 'classic' (win-style) | 'native'
    horizontal: { visible: true },
    vertical: { visible: true },
  }}
  status={{
    visible: true,
    content: ({ visibleItems, totalItems }) => (
      <span>
        Showing {visibleItems} of {totalItems} entries
      </span>
    ),
  }}
/>
```

---

### 8. Pagination (Server / Client)

Use the `page` prop to enable bottom-bar pagination:

```typescript jsx
function PaginatedGrid() {
  const [currentPage, setCurrentPage] = React.useState(1); // 1-based index
  const pageSize = 20;
  const totalElements = 350;

  return (
    <BGrid<Item>
      width={800}
      height={450}
      columns={columns}
      data={pageData}
      rowKey='id'
      page={{
        currentPage,
        pageSize,
        totalElements,
        totalPages: Math.ceil(totalElements / pageSize),
        onChange: newPage => setCurrentPage(newPage),
      }}
    />
  );
}
```

---

### 9. Frozen Columns & Frozen Rows

Fix leading columns and top rows while the remaining area scrolls smoothly:

```typescript jsx
<BGrid
  width={900}
  height={500}
  frozenColumnIndex={2} // Columns 0 and 1 are pinned to the left
  frozenRowCount={3} // First 3 data rows are pinned to the top
  columns={columns}
  data={data}
  rowKey='id'
/>
```

---

### 10. Row Reordering

Enable drag-and-drop or keyboard row sorting:

```typescript jsx
<BGrid
  width={750}
  height={400}
  columns={columns}
  data={data}
  rowKey='id'
  showLineNumber // Line number handle hosts the reorder grip
  reorder={{
    enabled: true,
    onReorder: nextData => {
      setData(nextData);
      return true; // Return false to roll back
    },
  }}
/>
```

- Keyboard reordering: Focus the handle, press `Space` or `Enter` to pick up, `ArrowUp`/`ArrowDown` to move, `Enter` to commit, or `Escape` to cancel.

---

### 11. Summary Row

Add top or bottom summary/aggregation rows (supports both single-row and multi-row configurations):

#### Single-Row Summary
```typescript jsx
<BGrid
  width={800}
  height={400}
  columns={columns}
  data={data}
  rowKey='id'
  summary={{
    position: 'bottom', // 'top' | 'bottom'
    columns: [
      { columnIndex: 0, colSpan: 2, itemRender: () => <strong>Total Summary</strong> },
      {
        columnIndex: 2,
        align: 'right',
        itemRender: ({ data }) => (
          <strong>${data.reduce((sum, item) => sum + (item.values.amount || 0), 0).toLocaleString()}</strong>
        ),
      },
    ],
  }}
/>
```

#### Multi-Row Summary (e.g. Average & Total)
```typescript jsx
<BGrid
  width={800}
  height={400}
  columns={columns}
  data={data}
  rowKey='id'
  summary={{
    position: 'bottom',
    rows: [
      {
        style: { backgroundColor: '#fffbeb', fontWeight: 600 },
        columns: [
          { columnIndex: 0, colSpan: 2, itemRender: () => <span>Average</span> },
          {
            columnIndex: 2,
            align: 'right',
            itemRender: ({ data }) => (
              <span>${(data.reduce((sum, item) => sum + (item.values.amount || 0), 0) / (data.length || 1)).toFixed(2)}</span>
            ),
          },
        ],
      },
      {
        style: { backgroundColor: '#f1f5f9', fontWeight: 700 },
        columns: [
          { columnIndex: 0, colSpan: 2, itemRender: () => <strong>Total</strong> },
          {
            columnIndex: 2,
            align: 'right',
            itemRender: ({ data }) => (
              <strong>${data.reduce((sum, item) => sum + (item.values.amount || 0), 0).toLocaleString()}</strong>
            ),
          },
        ],
      },
    ],
  }}
/>
```

---

### 12. Cell Merging

Merge consecutive identical cells vertically:

```typescript jsx
<BGrid
  width={800}
  height={400}
  columns={columns}
  data={data}
  rowKey='id'
  cellMergeOptions={{
    columnsMap: {
      0: { mergeBy: 'department' }, // Column index 0 merges based on department field
      1: { mergeBy: ['department', 'team'] },
    },
  }}
/>
```

---

### 13. Pivot Table

Transform flat tabular data into an interactive multidimensional pivot matrix:

```typescript jsx
import { BGrid, type BGridColumn, type BGridProps } from 'beautiful-grid';

const pivotConfig: BGridProps<SalesRecord>['pivot'] = {
  rows: [{ key: 'product', label: 'Product', width: 140 }],
  columns: [{ key: 'region', label: 'Region' }],
  values: [
    {
      key: 'sales',
      label: 'Total Sales',
      aggregate: 'sum', // 'sum' | 'count' | 'avg' | 'min' | 'max' | 'first' | custom function
      itemRender: ({ value }) => <>${Number(value).toLocaleString()}</>,
    },
    {
      key: 'qty',
      label: 'Units',
      aggregate: 'sum',
      itemRender: ({ value }) => <>{Number(value).toLocaleString()} ea</>,
    },
  ],
  emptyValue: '-',
};

<BGrid<SalesRecord>
  width={900}
  height={420}
  columns={baseColumns}
  data={salesData}
  pivot={pivotConfig}
  variant='vertical-bordered'
/>;
```

---

### 14. Column Visibility

Available since BeautifulGrid `1.0.6`.

Enable recoverable column hiding through the existing header toolbox. Use controlled state to persist a user's visible-column preferences.

```typescript jsx
function OrdersGrid({ data, columns }) {
  const [hiddenColumnIds, setHiddenColumnIds] = React.useState(['owner']);

  return (
    <BGrid
      width={800}
      height={420}
      data={data}
      columns={columns}
      columnVisibility={{
        hiddenColumnIds,
        onChange: setHiddenColumnIds,
      }}
    />
  );
}
```

Set `hideable: false` on columns that must remain available. The final visible column cannot be hidden, and active sort/filter conditions remain intact while their column is hidden.

---

### 15. Tree Grid

Add the `tree` prop to `<BGrid>` for flat parent/child data. `rowKey` identifies each row and `tree.parentRowKey` names the field containing its parent's key. `tree.treeColumnId` selects the column that renders indentation and the folding icon. Expansion can be uncontrolled with `defaultExpandedRowKeys` or controlled with `expandedRowKeys`.

```typescript jsx
const [expandedRowKeys, setExpandedRowKeys] = React.useState(['group-a']);

<BGrid
  width={800}
  height={420}
  columns={columns}
  data={rows}
  rowKey='id'
  tree={{
    parentRowKey: 'parentId',
    treeColumnId: 'name',
    expandedRowKeys,
    onExpandedRowKeysChange: setExpandedRowKeys,
  }}
/>;
```

Rows whose parent is missing are treated as roots. Cycles are contained, the source row order is retained, and edit callbacks receive the original source index even when ancestors are collapsed.

---

### 16. Master-Detail (Nested Grid)

Expand grid rows to reveal subgrids, nested forms, or detailed child records spanning the full width of the grid with isolated event handling.

```typescript jsx
const [expandedRowKeys, setExpandedRowKeys] = React.useState(['ORD-001']);

<BGrid
  width={800}
  height={450}
  columns={columns}
  data={orders}
  rowKey='orderId'
  masterDetail={{
    expandMode: 'multiple',
    expandedRowKeys,
    onExpandedRowKeysChange: setExpandedRowKeys,
    hasDetail: item => item.values.items.length > 0,
    detailRowHeight: 180,
    detailRender: ({ item }) => (
      <div style={{ padding: 12 }}>
        <h4>Order Items ({item.values.items.length})</h4>
        <BGrid
          width={760}
          height={130}
          columns={itemColumns}
          data={item.values.items.map(it => ({ values: it }))}
          rowKey='itemCode'
        />
      </div>
    ),
  }}
/>;
```

Even when frozen columns are configured, the detail panel renders in a unified full-width layer while master row cells preserve their natural row height. Pointer events, clicks, and keystrokes inside the detail view are isolated from parent table selections and shortcuts.

---

## Props Reference

### BGridProps

Below is a categorized reference of `<BGrid>` props. For exact TypeScript types, refer to `beautiful-grid/types.ts`.

#### Required Props

| Prop      | Type               | Description                                                             |
| --------- | ------------------ | ----------------------------------------------------------------------- |
| `width`   | `number`           | Total pixel width of the grid container (required for virtualization).  |
| `height`  | `number`           | Total pixel height of the grid container (required for virtualization). |
| `columns` | `BGridColumn<T>[]` | Array of column definitions (`width` defaults to 100 if omitted).       |

#### Data & Selection

| Prop              | Type                                                          | Description                                                      |
| ----------------- | ------------------------------------------------------------- | ---------------------------------------------------------------- |
| `data`            | `BGridDataItem<T>[]`                                          | Array of row data wrapped in `{ values: T }`.                    |
| `rowKey`          | `React.Key \| React.Key[]`                                    | Unique identifier field in `item.values` (string or array path). |
| `selectedRowKey`  | `React.Key \| React.Key[]`                                    | Key of the currently focused/highlighted row.                    |
| `rowChecked`        | `BGridRowChecked<T>`                                          | Checkbox / radio row selection configuration.                    |
| `getRowClassName`   | `(ri: number, item: BGridDataItem<T>) => string \| undefined` | Custom row class name generator.                                 |
| `enableLoadMore`    | `boolean`                                                     | Enables infinite scroll / load-more mechanism.                   |
| `onLoadMore`        | `(params: { scrollLeft: number; scrollTop: number }) => void` | Callback fired when scrolling reaches the load-more threshold.   |
| `endLoadMoreRender` | `() => React.ReactNode`                                       | Custom renderer for the load-more indicator or end-of-list.     |

#### Layout & Sizing

| Prop                | Type                                | Default     | Description                                                                                                  |
| ------------------- | ----------------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------ |
| `headerHeight`      | `number`                            | `30`        | Header row height in pixels.                                                                                 |
| `bottomBarHeight`   | `number`                            | `30`        | Bottom bar (pagination / status) height in pixels.                                                           |
| `summaryHeight`     | `number`                            | Auto        | Total summary height in pixels. Defaults to `summaryRowHeight * number of rows` (or `30` for single-row).    |
| `summaryRowHeight`  | `number`                            | `30`        | Default height in pixels for each individual summary row.                                                    |
| `itemHeight`        | `number`                            | `15`        | Body row content height.                                                                                     |
| `itemPadding`       | `number`                            | `7`         | Body row top/bottom padding (total row height = `itemHeight + itemPadding * 2`).                             |
| `getRowHeight`      | `(row: T, index: number) => number` | —           | Complete rendered height for each displayed row. Invalid values fall back to `itemHeight + itemPadding * 2`. |
| `frozenColumnIndex` | `number`                            | `0`         | Pinned column boundary index (columns `< frozenColumnIndex` are fixed).                                      |
| `frozenRowCount`    | `number`                            | `0`         | Number of leading rows pinned below the top summary row.                                                     |
| `showLineNumber`    | `boolean`                           | `false`     | Shows row index numbers and reorder handles on the left.                                                     |
| `variant`           | `'default' \| 'vertical-bordered'`  | `'default'` | Visual border styling variant.                                                                               |
| `className`         | `string`                            | —           | Custom CSS class name for the root grid container.                                                           |
| `style`             | `React.CSSProperties`               | —           | Inline styles for the root grid container.                                                                   |
| `disabled`          | `boolean`                           | `false`     | Disables user interactions while preserving view and scrolling.                                              |
| `scrollTop`         | `number`                            | `0`         | Controlled vertical scroll position in pixels.                                                               |
| `scrollLeft`        | `number`                            | `0`         | Controlled horizontal scroll position in pixels.                                                             |

#### Columns & Headers

| Prop              | Type                                                                     | Description                                          |
| ----------------- | ------------------------------------------------------------------------ | ---------------------------------------------------- |
| `columnGroups`    | `BGridColumnGroupNode[]`                                                 | Tree-based multi-level grouped header configuration. |
| `columnSortable`  | `boolean`                                                                | Enables dragging header columns to reorder.          |
| `onChangeColumns` | `(columnIndex: number \| null, info: BGridChangeColumnsInfo<T>) => void` | Callback fired when column widths or orders change.  |

#### Editing & Interactivity

| Prop                    | Type                                               | Default      | Description                                                  |
| ----------------------- | -------------------------------------------------- | ------------ | ------------------------------------------------------------ |
| `editable`              | `boolean`                                          | `false`      | Master switch for cell editing.                              |
| `editTrigger`           | `'click' \| 'dblclick'`                            | `'dblclick'` | User event that activates inline editors.                    |
| `onChangeData`          | `(index, columnIndex, item, column, meta) => void` | -            | Callback fired after a cell edit commits.                    |
| `onClick`               | `(params: BGridClickParams<T>) => void`            | -            | Cell click callback.                                         |
| `cellNavigationOptions` | `BGridCellNavigationOptions`                       | -            | Active cell focus, arrow key navigation, and repeat options. |
| `cellSelectionOptions`  | `BGridCellSelectionOptions`                        | -            | Range drag selection, active-cell focus, and clipboard copy/paste options. |

#### Additional Features & Overlays

| Prop                 | Type                                                                | Description                                                                            |
| -------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `dataControl`        | `BGridDataControl`                                                  | Controlled sort & filter state (`mode: 'client' \| 'manual'`).                         |
| `sort`               | `BGridSortInfo`                                                     | Simple sorting state and callback (superseded by `dataControl` when present).          |
| `page`               | `BGridPage`                                                         | Pagination state, totals, and page change callback.                                    |
| `scrollbar`          | `BGridScrollbarOptions`                                             | Scrollbar variant (`'modern' \| 'classic' \| 'native'`) and visibility.                |
| `status`             | `BGridStatusOptions`                                                | Bottom bar status text / custom render function.                                       |
| `pagination`         | `BGridPaginationViewOptions`                                        | Bottom bar pagination element visibility.                                              |
| `searchOptions`      | `BGridSearchOptions<T>`                                             | Grid in-memory search UI, shortcuts (`Cmd+F`), and highlights.                         |
| `contextMenuOptions` | `BGridContextMenuOptions<T>`                                        | Right-click and `Shift+F10` cell context menu items.                                   |
| `reorder`            | `BGridReorderInfo<T>`                                               | Drag and keyboard row reordering configuration.                                        |
| `reorderingInfo`     | `BGridReorderingInfo`                                               | Reorder drop indicator and dragged state callbacks.                                    |
| `summary`            | `BGridSummaryOptions<T>`                                            | Static summary row(s) configuration. Supports single row (`columns`) or multiple rows (`rows`). |
| `cellMergeOptions`   | `{ columnsMap: Record<number, BGridCellMergeColumn> }`              | Vertical cell merge rules.                                                             |
| `pivot`              | `BGridPivotOptions<T>`                                              | Pivot table dimensions, aggregation rules, and metrics.                                |
| `columnVisibility`   | `boolean \| BGridColumnVisibilityOptions<T>`                        | Enables controlled or uncontrolled column hiding and restore controls (since `1.0.6`). |
| `icons`              | `BGridToolboxIcons`                                                 | Custom SVG / ReactNode icons for column toolbox, filter, and sort buttons.             |
| `tree`               | `BGridTreeOptions<T>`                                               | Renders flat parent-key data as collapsible hierarchical rows.                         |
| `masterDetail`       | `BGridMasterDetailOptions<T>`                                       | Expands rows to display nested subgrids, forms, or custom detail panels.               |
| `loading`            | `boolean`                                                           | Displays full-grid loading overlay.                                                    |
| `spinning`           | `boolean`                                                           | Displays body-area spinner.                                                            |
| `msg`                | `{ emptyList?: string }`                                            | Custom empty state text.                                                               |

---

### BGridColumn

| Property           | Type                                                           | Description                                                                                      |
| ------------------ | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| `id`               | `string`                                                       | Unique column identifier (recommended for `columnGroups`, toolboxes, and persistence).           |
| `key`              | `string \| string[]`                                           | Field key or nested path array to read from `item.values`.                                       |
| `label`            | `ReactNode`                                                    | Header label content.                                                                            |
| `width`            | `number`                                                       | Column width in pixels (defaults to `100` if omitted).                                           |
| `align`            | `'left' \| 'center' \| 'right'`                                | Body cell horizontal text alignment.                                                             |
| `headerAlign`      | `'left' \| 'center' \| 'right'`                                | Header cell horizontal text alignment.                                                           |
| `sortDisable`      | `boolean`                                                      | Disables sorting on this column.                                                                 |
| `className`        | `string`                                                       | Static class name applied to body cells.                                                         |
| `getClassName`     | `(item: BGridDataItem<T>) => string`                           | Dynamic class name generator for body cells.                                                     |
| `headerClassName`  | `string`                                                       | Custom class name for the column header.                                                         |
| `headerStyle`      | `React.CSSProperties`                                          | Custom CSS style for the column header.                                                          |
| `itemRender`       | `React.FC<BGridItemRenderProps<T>>`                            | Custom cell content render function.                                                             |
| `editable`         | `boolean`                                                      | Enables editing on this specific column.                                                         |
| `editor`           | `BGridCellEditorConfig<T>`                                     | Editor configuration (`type: 'text' \| 'checkbox' \| 'plugin'`).                                 |
| `editTrigger`      | `'click' \| 'dblclick'`                                        | Overrides grid-level edit trigger for this column.                                               |
| `editorIcon`       | `BGridEditorIconConfig<T>`                                     | Inline icon trigger for dropdowns, popups, or lookup dialogs.                                    |
| `onChangeValue`    | `(params: BGridChangeValueParams<T>) => void \| Promise<void>` | Column-level change interceptor with commit/cancel controller.                                   |
| `getClipboardText` | `(params: BGridCellClipboardTextParams<T>) => any`             | Custom string serializer for clipboard copy.                                                     |
| `searchable`       | `boolean`                                                      | Whether this column participates in grid search (defaults to `true`).                            |
| `getSearchText`    | `(params: BGridSearchCellParams<T>) => unknown`                | Custom string extractor for grid search matching.                                                |
| `toolbox`          | `boolean \| BGridToolboxConfig<T>`                             | Enables header sort/filter toolbox popup.                                                        |
| `hideable`         | `boolean`                                                      | Allows this column to be hidden through the visibility menu (defaults to `true`, since `1.0.6`). |
| `filter`           | `false \| BGridColumnFilterConfig<T>`                          | Column filter configuration (`type: 'values' \| 'text' \| 'number'`).                            |
| `sortComparator`   | `(a, b, params) => number`                                     | Custom comparator function for sorting.                                                          |

---

### Sub-options Reference

#### `BGridRowChecked<T>`

```typescript
interface BGridRowChecked<T> {
  isRadio?: boolean;
  checkedIndexes?: number[];
  checkedRowKeys?: React.Key[];
  disabled?: (index: number, item: BGridDataItem<T>) => boolean;
  onChange: (checkedIndexes: number[], checkedRowKeys: React.Key[], checkedAll?: CheckedAll) => void;
}
```

#### `BGridPage`

```typescript
interface BGridPage {
  currentPage?: number; // 1-based
  pageSize?: number;
  totalPages?: number;
  totalElements?: number;
  loading?: boolean;
  onChange?: (currentPage: number, pageSize?: number) => void;
}
```

#### `BGridDataControl`

```typescript
interface BGridDataControl {
  mode?: 'manual' | 'client';
  multiSort?: boolean;
  query: BGridDataQuery;
  onChange: (query: BGridDataQuery, event: BGridDataQueryChangeEvent) => void;
}
```

#### `BGridMasterDetailOptions`

```typescript
interface BGridMasterDetailOptions<T> {
  expandMode?: 'multiple' | 'single';
  expandedRowKeys?: React.Key[];
  defaultExpandedRowKeys?: React.Key[];
  onExpandedRowKeysChange?: (
    expandedRowKeys: React.Key[],
    event: BGridMasterDetailChangeEvent<T>,
  ) => void;
  hasDetail?: (item: BGridDataItem<T>, index: number) => boolean;
  detailRowHeight?: number;
  detailRender: (props: BGridMasterDetailRenderProps<T>) => React.ReactNode;
  expandColumnId?: string;
  icons?: BGridMasterDetailIcons;
}
```

---

## Developer Workflows

```bash
# Start development server (docs & demo site)
npm run dev

# Run unit tests with Vitest
npm test

# Run unit tests in watch mode
npm run test:watch

# Run unit tests with coverage report
npm run test -- --coverage

# Run library consumer compatibility tests (CJS, ESM, Types)
npm run test:library:consumers

# Run E2E tests with Playwright
npm run test:e2e
npm run test:e2e:ui

# Lint codebase
npm run lint

# Build publishable library bundle (dist/cjs, dist/esm, dist/types, dist/style.css, dist/package.json)
npm run build:library

# Build docs & demo site
npm run build
npm run preview
```

---

## Test Coverage

BeautifulGrid maintains high test coverage to ensure stability across complex features like virtualization, cell editing, and focus management.
Coverage reports are generated via Vitest. To view the detailed HTML report, run:

```bash
npm run test -- --coverage
```

---

## License

BeautifulGrid is open-source software licensed under the [Apache License 2.0](LICENSE). See [NOTICE](NOTICE) for attribution and [TRADEMARK.md](TRADEMARK.md) for brand usage guidelines.
