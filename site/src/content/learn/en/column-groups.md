---
title: 'Column Groups'
description: 'Create group headers with three or more levels from a tree of column IDs, and use them safely across frozen-column boundaries.'
category: 'advanced'
order: 4
locale: 'en'
canonicalPath: '/en/learn/column-groups'
demoId: 'column-groups'
features: ['columnGroups', 'BGridColumnGroupNode', 'nested-header', 'frozenColumnIndex', 'headerHeight']
relatedGuides: ['getting-started', 'basic', 'pivot', 'frozen-columns']
relatedApi: ['/en/api/props#columngroups', '/en/api/props#headerheight']
lastReviewedAt: '2026-08-19'
indexable: true
draft: false
---

## Define groups as a tree

Keep `columns` as a flat array that determines rendering order. Use `columnGroups` to create a tree that references column IDs. A group can contain column IDs and other groups at any depth.

```tsx
const columns: BGridColumn<Order>[] = [
  { id: 'orderNo', key: 'orderNo', label: 'Order number', width: 140 },
  { id: 'customerName', key: 'customerName', label: 'Customer name', width: 150 },
  { id: 'region', key: 'region', label: 'Region', width: 100 },
  { id: 'productName', key: 'productName', label: 'Product', width: 170 },
];

const columnGroups: BGridColumnGroupNode[] = [
  {
    id: 'order-overview',
    label: 'Order overview',
    children: [
      'orderNo',
      {
        id: 'customer',
        label: 'Customer information',
        children: [
          {
            id: 'customer-detail',
            label: 'Customer details',
            children: ['customerName', 'region'],
          },
          'productName',
        ],
      },
    ],
  },
];

<BGrid columns={columns} columnGroups={columnGroups} headerHeight={88} {...props} />;
```

## Style header cells

Style leaf columns with `headerClassName` or `headerStyle`, and group nodes with `className` or `headerStyle`. Classes are useful for managing related rules such as hover states and themes, while `headerStyle` is convenient for a simple dynamic style on one cell. The same classes and styles are applied to headers duplicated in the frozen-column area.

```tsx
const columns: BGridColumn<Order>[] = [
  {
    id: 'total',
    key: 'total',
    label: 'Total',
    width: 140,
    headerClassName: 'order-grid-header-total',
  },
];

const columnGroups: BGridColumnGroupNode[] = [
  {
    id: 'sales',
    label: 'Sales information',
    className: 'order-grid-header-sales',
    headerStyle: { color: '#166534' },
    children: ['total'],
  },
];

<BGrid className='order-grid' columns={columns} columnGroups={columnGroups} {...props} />;
```

```css
.order-grid .bgrid-head-group-cell.order-grid-header-sales {
  background-color: #dcfce7;
}

.order-grid .bgrid-head-cell.order-grid-header-total {
  --bgrid-header-hover-bg: #fef08a;

  background-color: #fef9c3;
  color: #854d0e;
}
```

When both `headerAlign` and `headerStyle.textAlign` are set, the dedicated alignment property `headerAlign` takes precedence. To customize the hover background of a sortable leaf header, redefine `--bgrid-header-hover-bg` in the cell class.

## Understand column `key` and `id`

`key` and `id` may look similar, but they serve different purposes.

- `key`: The data path used to read a cell value from `item.values`. Use a string for a top-level field, such as `'status'`, and an array of strings for a nested field, such as `['customer', 'address', 'city']`.
- `id`: A stable, unique identifier that the grid uses to distinguish columns. It connects leaf references in `columnGroups` with sorting and filtering state; it does not affect the path used to read data.

Columns that present the same data field in different ways can therefore share a `key` while using different `id` values. Every `id` must be unique across the column set.

```tsx
const columns: BGridColumn<Order>[] = [
  { id: 'amount-raw', key: 'amount', label: 'Amount', width: 120 },
  { id: 'amount-with-tax', key: 'amount', label: 'Amount including tax', width: 140 },
  {
    id: 'customer-city',
    key: ['customer', 'address', 'city'],
    label: 'Customer city',
    width: 120,
  },
];
```

If you omit `id`, the library serializes `key` to create an internal `columnId`.

- `key: 'status'` → `key:string:status`
- `key: ['customer', 'name']` → `key:array:["customer","name"]`

A string leaf in `columnGroups` refers to this final column ID, not the original `key`. For example, a column declared as `{ key: 'status' }` without an `id` must be referenced as `children: ['key:string:status']`; `children: ['status']` will not find it. To avoid depending on the generated format, explicitly set `id` on columns that belong to a group.

```tsx
const columns = [{ id: 'status', key: 'status', label: 'Status', width: 100 }];

const columnGroups = [{ id: 'order-state', label: 'Order status', children: ['status'] }];
```

Here, the group node's `id: 'order-state'` identifies the group itself, while `'status'` in `children` refers to the column's `id`.

## Calculate rows and spans

The deepest group determines the number of header rows. A leaf column that ends at a shallower level fills the remaining rows with `rowSpan`, while each group uses the number of leaf columns it actually contains as its `colSpan`. Set `headerHeight` to at least 22px per header row. The grid emits a development warning when the height is insufficient.

## Cross a frozen-column boundary

No additional configuration is required when a group crosses the `frozenColumnIndex` boundary. The same group label is rendered in both the frozen and scrollable areas, and each area's `colSpan` is calculated from the leaf columns it actually contains. The live demo above includes a group that crosses the frozen boundary.

> [!TIP]
> **Mobile screens and frozen width**:
> On narrow mobile screens, freezing multiple grouped columns may restrict the horizontal scrollable area. Consider reducing `frozenColumnIndex` on mobile devices to preserve ample scroll space.

## Validate the configuration

The following configurations emit a development warning and fall back to a safe single-row header:

- A column ID that does not exist
- The same column referenced in more than one location
- An empty group or a duplicate group ID
- A leaf order that differs from the actual `columns` order
- A non-contiguous group that skips an intermediate column

When `columnSortable` is enabled, users can reorder only leaf columns that are direct children of the same parent group. Moving a group itself or moving a leaf into another parent group is blocked. If you use a controlled columns array, update both `info.columns` and `info.columnGroups` in `onChangeColumns`.

## Maintain compatibility with `columnsGroup`

The index-range-based `columnsGroup` API continues to work for existing applications, but it is deprecated.

```tsx
<BGrid columns={columns} columnsGroup={[{ label: 'Document information', groupStartIndex: 1, groupEndIndex: 3 }]} />
```

When both APIs are provided, `columnGroups` takes precedence. For new screens, use `columnGroups`: it supports arbitrary depth and remains safe when the column order changes.
