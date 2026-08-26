---
title: "Pivot Table"
description: "Configure row axes, column axes, and aggregate values with BGridPivotOptions to display a cross-tab result."
category: "advanced"
order: 3
locale: "en"
canonicalPath: "/en/learn/pivot"
demoId: "pivot"
features: ["pivot", "rows", "columns", "values", "aggregate"]
relatedGuides: ["getting-started", "basic", "summary", "column-groups"]
relatedApi: ["/en/api/props#pivot", "/en/api/props#columns", "/en/api/props#data"]
lastReviewedAt: "2026-08-17"
indexable: true
draft: false
---

## Pivot configuration

Pivot mode is not configured by nesting the regular `columns` definition. Pass the source grid's `columns` and `data`, then define the row axes, column axes, and aggregate values in a separate `pivot` object.

```tsx
const pivot: BGridPivotOptions<SalesRow> = {
  rows: [
    { key: 'region', label: 'Region', width: 120 },
    { key: 'product', label: 'Product', width: 140 },
  ],
  columns: [
    { key: 'quarter', label: 'Quarter', width: 110 },
  ],
  values: [
    {
      key: 'sales',
      label: 'Sales',
      width: 120,
      align: 'right',
      aggregate: 'sum',
    },
  ],
  emptyValue: 0,
};

<BGrid<SalesRow> columns={columns} data={data} pivot={pivot} {...sizeProps} />
```

`aggregate` can be one of `'sum' | 'count' | 'avg' | 'min' | 'max' | 'first'`, or a custom function. A custom function receives the target values, the source `BGridDataItem` objects, the current row and column axis values, and the `BGridPivotValue` definition.

## Rendering and copying

Each value definition can specify `itemRender` and `getClipboardText`. In addition to the standard cell information, both callbacks receive the `sourceItems`, `rowValues`, `columnValues`, `pivotValue`, and `aggregate` context. Configure both callbacks with the same rules so the on-screen formatting and clipboard text stay consistent.

When pivot mode is active, the displayed columns and rows are rebuilt from the axis combinations. If you combine pivot mode with row selection, sorting, or frozen regions, verify the exact configuration in a browser as shown in the live demo above.
