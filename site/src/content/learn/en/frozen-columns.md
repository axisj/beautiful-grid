---
title: "Frozen Rows & Columns"
description: "Learn how to freeze important rows at the top and columns on the left, including use with a Summary Row."
category: "advanced"
order: 5
locale: "en"
canonicalPath: "/en/learn/frozen-columns"
demoId: "frozen-columns"
features: ["frozenColumnIndex", "frozenRowCount", "frozen-columns", "frozen-rows", "summary", "sync-scroll"]
relatedGuides: ["getting-started", "basic", "column-groups", "cell-merge"]
relatedApi: ["/en/api/props#frozencolumnindex", "/en/api/props#frozenrowcount", "/en/api/props#columns"]
lastReviewedAt: "2026-08-19"
indexable: true
draft: false
---

## 1. Overview

In a wide table, users may need to keep identifying columns such as **employee number and name** visible while scrolling horizontally. With many rows, they may also need to keep important comparison rows at the top of the viewport.

Use `frozenColumnIndex` to set the number of columns frozen on the left, and `frozenRowCount` to set the number of rows frozen at the top. You can use either option independently or combine them. The frozen data remains visible during horizontal and vertical scrolling.

Frozen cells support the same selection and editing behavior as ordinary cells, including checkboxes and row states.

---

## 2. Usage

Set `frozenColumnIndex={N}` to freeze columns 0 through N-1 on the left.

```tsx
<BGrid
  columns={columns}
  data={data}
  frozenColumnIndex={2} // Freeze 2 columns (columns 0 and 1) on the left.
/>
```

Set `frozenRowCount={N}` to freeze the first N rows of the displayed data after the current sorting, filtering, and pagination have been applied.

```tsx
<BGrid
  columns={columns}
  data={data}
  frozenColumnIndex={2}
  frozenRowCount={3}
/>
```

A top Summary Row occupies a separate region from frozen data rows. When you use both features, the Grid displays the header, top Summary, frozen rows, and regular rows in that order.

```tsx
<BGrid
  columns={columns}
  data={data}
  frozenRowCount={2}
  summary={{
    position: 'top',
    columns: [{ columnIndex: 0, itemRender: () => 'Total' }],
  }}
/>
```

If `frozenRowCount` exceeds the current displayed row count, it is automatically clamped to that count. Frozen rows are disabled in Pivot mode under the initial release policy.
