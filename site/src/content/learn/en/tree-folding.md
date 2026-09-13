---
title: 'Tree Folding'
description: 'Render flat parent-key data as a hierarchy and safely expand or collapse rows.'
category: 'advanced'
order: 32
locale: 'en'
canonicalPath: '/en/learn/tree-folding'
demoId: 'tree-folding'
features: ['tree', 'folding', 'parent-row-key', 'virtual-scroll', 'accessibility']
relatedGuides: ['data-and-columns', 'sorting-filtering', 'frozen-columns', 'row-selection']
relatedApi: ['/en/api/props#tree', '/en/api/props#rowkey']
sinceVersion: '1.0.12'
lastReviewedAt: '2026-09-13'
indexable: true
draft: false
---

## Render flat data as a tree

Tree mode is enabled through the existing `<BGrid>` component's `tree` prop. `rowKey` identifies the current row, while `tree.parentRowKey` names the field containing its parent's `rowKey` value.

```tsx
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface Row {
  id: string;
  parentId: string | null;
  name: string;
}

const columns: BGridColumn<Row>[] = [{ id: 'name', key: 'name', label: 'Name', width: 240 }];

const data: BGridDataItem<Row>[] = [
  { values: { id: 'root', parentId: null, name: 'Electronics' } },
  { values: { id: 'laptop', parentId: 'root', name: 'Laptops' } },
];

<BGrid
  width={640}
  height={360}
  columns={columns}
  data={data}
  rowKey='id'
  tree={{
    parentRowKey: 'parentId',
    treeColumnId: 'name',
  }}
/>;
```

`tree.treeColumnId` refers to `BGridColumn.id`, not the data field in `key`. The selected column renders indentation and a folding icon in every tree row. If it is omitted or currently hidden, the first visible column is used.

The live demo above uses 10,557 source rows in a three-level hierarchy. Its initial state expands a representative branch for responsive folding checks, while virtual scrolling limits the DOM to the rows needed for the current viewport as more branches are opened.

## Control expansion

Use `defaultExpandedRowKeys` as an initial value when the grid owns expansion state. Use `expandedRowKeys` with `onExpandedRowKeysChange` for controlled state.

```tsx
const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>(['root']);

<BGrid
  {...gridProps}
  rowKey='id'
  tree={{
    parentRowKey: 'parentId',
    expandedRowKeys,
    onExpandedRowKeysChange: setExpandedRowKeys,
  }}
/>;
```

The callback event includes the toggled `rowKey`, the next `expanded` state, the original row `item`, and a stable `sourceIndex` that does not change when branches fold.

## Customize icons and spacing

```tsx
tree={{
  parentRowKey: 'parentId',
  treeColumnId: 'name',
  indentSize: 20,
  icons: {
    expanded: <ChevronDown />,
    collapsed: <ChevronRight />,
    leaf: <File />,
  },
}}
```

When the leaf icon is omitted, the grid retains an equal-width spacer so labels stay aligned. The grid owns button input behavior and `aria-expanded`; supplied icons are visual content only.

## Sorting, filtering, and source indexes

Client sorting stays within sibling groups, so parents and children are never separated. When a child matches a filter, its ancestor path is temporarily revealed without changing the controlled expansion array.

The on-screen `visibleIndex` can change as branches fold. Row selection and edit callbacks retain the flat input array's `sourceIndex`, and edit metadata exposes the root-to-row key path as `meta.tree.path`.

## Limitations

- Row reordering and cell merging are disabled in tree mode.
- Pivot mode takes precedence and disables tree mode.
- Lazy child loading and cascading parent-to-child selection are not supported yet.
- A row whose parent cannot be found is treated as a root.
- Missing or duplicate row keys and cycles produce a development warning and safely fall back to flat rows.
