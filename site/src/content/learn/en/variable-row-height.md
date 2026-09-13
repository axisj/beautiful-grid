---
title: "Variable Row Height"
description: "Use getRowHeight to assign data-driven row heights while preserving virtual-scroll performance."
category: "data-and-columns"
order: 8
locale: "en"
canonicalPath: "/en/learn/variable-row-height"
demoId: "variable-row-height"
features: ["getRowHeight", "variable-row-height", "virtual-scrolling", "performance", "frozen-row"]
relatedGuides: ["basic", "virtual-scroll", "frozen-columns", "row-styling"]
relatedApi: ["/en/api/props#getrowheight", "/en/api/props#itemheight", "/en/api/props#itempadding"]
lastReviewedAt: "2026-09-13"
indexable: true
draft: false
---

## Assign heights from row data

`getRowHeight(row, index)` receives the row values and its current displayed index, then returns the complete row height in pixels. The live example uses 52px for milestones, 40px for updates, and 29px for ordinary notes.

```tsx
const getRowHeight = React.useCallback((row: ProjectActivity) => {
  if (row.kind === 'milestone') return 52;
  if (row.kind === 'update') return 40;
  return 29;
}, []);

<BGrid
  data={activities}
  columns={columns}
  getRowHeight={getRowHeight}
/>
```

The callback receives `item.values`, not the `BGridDataItem` wrapper. After sorting or filtering, `index` follows the resulting display order.

## Performance behavior

BeautifulGrid calculates heights and cumulative offsets once whenever the displayed data or `getRowHeight` reference changes. Scrolling reads the cache and locates the first row with binary search, so it does not repeatedly invoke the callback. Keep the function reference stable with `useCallback`, as shown above, to avoid unnecessary cache rebuilds.

Automatic DOM measurement for content-based heights is not supported. If `getRowHeight` is omitted or returns zero, a negative number, `NaN`, or `Infinity`, the grid falls back to `itemHeight + itemPadding * 2`.
