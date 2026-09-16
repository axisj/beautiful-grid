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
lastReviewedAt: "2026-09-16"
indexable: true
draft: false
---

## Summary setup

`summary` is not a render prop that returns a raw `<table>` or `<tr>`. Instead, pass the summary position (`position`) and an array of summary row definitions (`rows`). You can also easily configure **Multi-row Summary** such as average and total rows.

```tsx
const summary: BGridProps<Row>['summary'] = {
  position: 'bottom', // 'top' | 'bottom'
  rows: [
    // Row 1: Average
    {
      className: 'summary-avg-row',
      columns: [
        { columnIndex: 0, colSpan: 2, align: 'center', itemRender: () => <>Average</> },
        {
          columnIndex: 2,
          align: 'right',
          itemRender: ({ data }) => (
            <>{Math.round(data.reduce((sum, item) => sum + item.values.amount, 0) / (data.length || 1)).toLocaleString()}</>
          ),
        },
      ],
    },
    // Row 2: Total
    {
      className: 'summary-total-row',
      style: { fontWeight: 'bold' },
      columns: [
        { columnIndex: 0, colSpan: 2, align: 'center', itemRender: () => <>Total</> },
        {
          columnIndex: 2,
          align: 'right',
          itemRender: ({ data }) => (
            <>{data.reduce((sum, item) => sum + item.values.amount, 0).toLocaleString()}</>
          ),
        },
      ],
    },
  ],
};

<BGrid
  summary={summary}
  summaryRowHeight={32} // or (rowIndex) => (rowIndex === 1 ? 36 : 28)
  {...props}
/>
```

---

## Options and property reference

### Top-level Summary options (`summary`)

| Property | Type | Description |
|---|---|---|
| `position` | `'top' \| 'bottom'` | Places the summary rows above (`top`) or below (`bottom`) data rows. |
| `rows` | `BGridSummaryRow<T>[]` | Array of summary row definitions. Use this to configure one or more summary rows. (Recommended) |
| `columns` | `BGridSummaryColumn<T>[]` | Legacy shorthand for a single summary row. |

### Summary row options (`BGridSummaryRow<T>`)

| Property | Type | Description |
|---|---|---|
| `columns` | `BGridSummaryColumn<T>[]` | Array of summary column cell definitions for this row. |
| `className` | `string` | Custom CSS class name to apply to the summary `<tr>` element. |
| `style` | `CSSProperties` | Inline styles to apply to the summary `<tr>` element. |

### Summary cell options (`BGridSummaryColumn<T>`)

| Property | Type | Description |
|---|---|---|
| `columnIndex` | `number` | The zero-based index of the column where the summary cell starts. |
| `colSpan` | `number` | The number of columns occupied horizontally by the summary cell. |
| `align` | `'left' \| 'center' \| 'right'` | Text alignment inside the summary cell. |
| `className` | `string` | Custom CSS class name to apply to the summary `<td>` element. |
| `style` | `CSSProperties` | Inline styles to apply to the summary `<td>` element. |
| `itemRender` | `(props) => ReactNode` | Function that renders the summary cell content. Receives `{ column, columnIndex, rowIndex, data }`. |

### Summary height configuration

| Top-level Prop | Type | Description |
|---|---|---|
| `summaryRowHeight` | `number \| ((rowIndex: number) => number)` | Configures the height of each summary row. When a number is passed, it is applied uniformly. When a function is passed, row-specific heights can be set by `rowIndex`. (Default: 30px) |
| `summaryHeight` | `number` | Fixes the total height of the summary area. For multi-row summaries, it is divided equally across rows. |

---

## Tips & Best Practices

1. **Accessing data (`data`)**: Because `data` in `itemRender` is typed as `BGridDataItem<T>[]`, read row values safely via `item.values`.
2. **Backward compatibility**: The legacy `summary={{ position: 'bottom', columns: [...] }}` syntax remains 100% compatible. For new code, `rows: [...]` is recommended for future extensibility.
3. **Empty trailing cells**: Columns not covered by summary cells are filled with empty cells automatically and their right borders are removed for a clean table appearance.
