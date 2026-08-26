---
title: "Summary Row"
description: "Use the BGridProps summary configuration to display custom summary cells above or below the data rows."
category: "advanced"
order: 2
locale: "en"
canonicalPath: "/en/learn/summary"
demoId: "summary"
features: ["summary", "BGridSummaryColumn", "itemRender", "colSpan"]
relatedGuides: ["getting-started", "basic", "cell-merge", "pivot"]
relatedApi: ["/en/api/props#summary", "/en/api/props#columns"]
lastReviewedAt: "2026-08-23"
indexable: true
draft: false
---

## Summary setup

`summary` is not a render prop that returns a raw `<table>` or `<tr>`. Instead, pass the summary position and an array of summary-column definitions.

```tsx
const summary: BGridProps<Row>['summary'] = {
  position: 'bottom',
  columns: [
    {
      columnIndex: 0,
      colSpan: 2,
      align: 'center',
      itemRender: () => <>Total</>,
    },
    {
      columnIndex: 2,
      align: 'right',
      itemRender: ({ data }) => (
        <>{data.reduce((sum, item) => sum + item.values.amount, 0).toLocaleString()}</>
      ),
    },
  ],
};

<BGrid summary={summary} summaryHeight={32} {...props} />
```

## Property reference

| Property | Description |
|---|---|
| `position` | Places the summary row above (`top`) or below (`bottom`) the data. |
| `columnIndex` | The zero-based index of the column where the summary cell starts. |
| `colSpan` | The number of columns occupied by the summary cell. |
| `itemRender` | Receives `{ column, columnIndex, data }` and returns the summary content. |
| `summaryHeight` | A top-level prop that controls the height of the summary area. |

Because `data` is `BGridDataItem<T>[]`, read each record from `item.values`. Whether the result represents the current page or the complete dataset depends on the data supplied to the grid by its parent.
