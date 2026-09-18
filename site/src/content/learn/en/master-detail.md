---
title: 'Master-Detail'
description: 'Expand grid rows to reveal nested subgrids, forms, or detail panels spanning the full width with complete event isolation.'
category: 'advanced'
order: 33
locale: 'en'
canonicalPath: '/en/learn/master-detail'
demoId: 'master-detail'
features: ['master-detail', 'nested-grid', 'expandable-rows', 'virtual-scroll', 'accessibility']
relatedGuides: ['data-and-columns', 'tree-folding', 'variable-row-height', 'frozen-columns']
relatedApi: ['/en/api/props#masterdetail', '/en/api/props#rowkey']
sinceVersion: '1.14.0'
lastReviewedAt: '2026-09-17'
indexable: true
draft: false
---

## Expand Rows to Display Detail Views

Master-Detail mode is designed for scenarios where each row owns secondary details or a nested `<BGrid>`, such as purchase order line items or customer transaction history. Enable it via the `masterDetail` prop on `<BGrid>`.

A unique `rowKey` is required to track expansion state accurately across sorting, filtering, and virtualization.

```tsx
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface OrderItem {
  itemCode: string;
  name: string;
  qty: number;
  price: number;
}

interface Order {
  orderId: string;
  customer: string;
  items: OrderItem[];
}

const columns: BGridColumn<Order>[] = [
  { id: 'orderId', key: 'orderId', label: 'Order ID', width: 140 },
  { id: 'customer', key: 'customer', label: 'Customer', width: 160 },
];

const data: BGridDataItem<Order>[] = [
  {
    values: {
      orderId: 'ORD-001',
      customer: 'Alice',
      items: [{ itemCode: 'ITEM-1', name: 'Keyboard', qty: 1, price: 120000 }],
    },
  },
];

<BGrid
  width={800}
  height={400}
  columns={columns}
  data={data}
  rowKey='orderId'
  masterDetail={{
    detailRowHeight: 180,
    detailRender: ({ item }) => (
      <div style={{ padding: 12 }}>
        <h4>Order Items ({item.values.items.length})</h4>
        {/* Render any React component or nested BGrid */}
      </div>
    ),
  }}
/>;
```

When `expandColumnId` is omitted, an expansion toggle column (`__bgrid_master_detail__`) is prepended to the columns list automatically. To place the toggle button inside an existing column cell instead, specify that column's id as `expandColumnId`.

## Expansion State Control (Controlled & Uncontrolled)

Use `defaultExpandedRowKeys` when the grid manages expansion state internally. To control expansion from outside, use `expandedRowKeys` paired with `onExpandedRowKeysChange`.

```tsx
const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>(['ORD-001']);

<BGrid
  {...gridProps}
  rowKey='orderId'
  masterDetail={{
    expandedRowKeys,
    onExpandedRowKeysChange: (nextKeys, event) => {
      console.log('Toggled row:', event.rowKey, 'Expanded:', event.expanded);
      setExpandedRowKeys(nextKeys);
    },
    detailRender: ({ item }) => <OrderDetailView order={item.values} />,
  }}
/>;
```

## Single and Multiple Expand Modes (expandMode)

- `'multiple'` (default): Multiple rows can be opened simultaneously for side-by-side inspection.
- `'single'` (Accordion mode): Expanding a row automatically collapses previously opened rows.

```tsx
masterDetail={{
  expandMode: 'single',
  detailRender: ({ item }) => <OrderDetailView order={item.values} />,
}}
```

## Row-Level Expansion Filter (hasDetail)

To suppress expansion for rows that lack detail records, pass a `hasDetail` callback. When `hasDetail` returns `false`, a blank spacer is rendered instead of a toggle button to preserve column alignment without broken affordances.

```tsx
masterDetail={{
  hasDetail: item => item.values.items.length > 0,
  detailRender: ({ item }) => <OrderDetailView order={item.values} />,
}}
```

## Full-Width Layer & Virtual Scroll Layout Isolation

Even when frozen columns (`frozenColumnIndex > 0`) are active, the detail view is rendered across the entire grid width inside a dedicated sticky layer (`MasterDetailLayer`).

- **Master Cell Height Preservation**: Master row `<tr>` cells never stretch vertically when the detail view expands; they keep their natural `rowHeight`.
- **Transparent Spacer Rows**: A matching transparent spacer row is rendered in the body table to offset succeeding master rows accurately within the virtual scroll engine.

## Complete Event and Focus Isolation

The detail container (`[data-bgrid-detail-owner]`) accommodates nested `<BGrid>` instances, input fields, dropdowns, and buttons.

- Pointer clicks, drags, and keystrokes occurring inside the detail view never bubble up to parent grid cell selection, row checking, cell editing, or copy-paste shortcuts.
- If focus is inside a detail view when that row is collapsed, focus returns safely to that row's toggle button.

## Custom Icons

```tsx
masterDetail={{
  icons: {
    expanded: <ChevronDown size={14} />,
    collapsed: <ChevronRight size={14} />,
  },
  detailRender: ({ item }) => <OrderDetailView order={item.values} />,
}}
```

## Compatibility & Constraints

- A valid `rowKey` is strictly required. A development warning is emitted if omitted.
- Master-detail cannot be combined with `tree`, `pivot`, `cellMergeOptions`, `reorder`, or `frozenRowCount > 0`. Conflicts are gracefully resolved by disabling master-detail and logging a development warning.
