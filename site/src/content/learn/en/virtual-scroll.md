---
title: "Large-Data Virtual Scroll"
description: "Understand how virtual scrolling renders rows around the current viewport and the constraints to consider when applying it to large datasets."
category: "data-and-columns"
order: 7
locale: "en"
canonicalPath: "/en/learn/virtual-scroll"
demoId: "virtual-scroll"
features: ["virtual-scrolling", "large-dataset", "performance", "dom-recycling", "itemHeight", "showLineNumber"]
relatedGuides: ["getting-started", "basic", "scrollbar", "pagination"]
relatedApi: ["/en/api/props#itemheight", "/en/api/props#height", "/en/api/props#data", "/en/api/props#showlinenumber"]
lastReviewedAt: "2026-08-25"
indexable: true
draft: false
---

## 1. Why virtual scrolling is essential

What happens if a standard HTML `<table>` renders more than 10,000 `<tr>` elements at once?

1. **Browser freezes**: Creating and calculating tens of thousands of DOM nodes can block the main thread for several seconds.
2. **Excessive memory use**: The memory allocated to all those DOM nodes can crash the tab.
3. **Scroll jank**: Recalculating tens of thousands of layouts during scrolling causes dropped frames.

**BeautifulGrid's virtual-scrolling logic** uses `height`, `itemHeight`, and the scroll position to calculate and render a range of rows around the current viewport. The number of rendered rows and perceived performance depend on the grid height, cell-renderer complexity, and browser environment.

---

## 2. How the virtual-scroll range is calculated

When a scroll event occurs, BeautifulGrid calculates the render range with the following formulas in O(1) time:

The live demo above uses the default 29 px total row height: `itemHeight` of 15 px plus 7 px of `itemPadding` above and below. For 550,000 rows, the scroll height is approximately 15,950,030 px including the additional area. That is about 827,186 px below the 16,777,216 px single-scroll-area limit observed in desktop Chromium, leaving roughly 4.9% headroom instead of running at the limit. Use the row numbers on the left to confirm that the grid reaches row 550,000.

For 550,000 rows, the maximum whole-number row height is **30 px**, calculated by rounding down `(16,777,216 px - 30 px of additional area) ÷ 550,000 rows`. With the default `itemPadding={7}`, the largest usable `itemHeight` prop is therefore 16 px (`16 + 7 × 2 = 30 px`). The default `itemHeight={15}` produces a 29 px total row height, leaving 1 px of configuration headroom. This limit was measured in Chromium and can vary by browser and layout.

```text
1. Viewport row count: displayItemCount = Math.ceil(height / itemHeight)
2. Start index: startIndex = Math.floor(scrollTop / itemHeight)
3. End index: endIndex = startIndex + displayItemCount + 3 (buffer)
4. Top-offset correction: topPadding = startIndex * itemHeight
```

Virtualization reduces the number of DOM rows, but the complete source data passed to the grid still remains in memory. For large datasets, measure the initial data-generation and transfer costs, cell-renderer cost, and sorting and filtering costs separately.

---

## 3. Complete example: a 10,000-record transaction-log viewer

The following example generates 10,000 log records and applies sorting and filtering across the complete virtualized dataset:

```tsx
import React, { useCallback, useMemo, useState, useTransition } from 'react';
import {
  BGrid,
  type BGridColumn,
  type BGridDataItem,
  type BGridDataQuery,
} from 'beautiful-grid';

interface LogItem {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: string;
  message: string;
  latencyMs: number;
}

export default function LargeLogViewer() {
  const [isQueryPending, startQueryTransition] = useTransition();
  const [query, setQuery] = useState<BGridDataQuery>({ sortParams: [], filterParams: [] });
  const handleQueryChange = useCallback((nextQuery: BGridDataQuery) => {
    startQueryTransition(() => setQuery(nextQuery));
  }, [startQueryTransition]);

  // 1. Generate 10,000 mock records
  const data: BGridDataItem<LogItem>[] = useMemo(() => {
    const levels: LogItem['level'][] = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const services = ['auth-service', 'order-api', 'payment-gateway', 'notification-worker'];

    return Array.from({ length: 10000 }).map((_, i) => ({
      values: {
        id: i + 1,
        timestamp: new Date(Date.now() - (10000 - i) * 1000).toISOString().replace('T', ' ').substring(0, 19),
        level: levels[i % levels.length],
        service: services[i % services.length],
        message: `Request processed for user_session_${1000 + (i % 500)} with HTTP 200 OK`,
        latencyMs: Math.floor(Math.random() * 450) + 10,
      },
    }));
  }, []);

  // 2. Configure columns
  const columns: BGridColumn<LogItem>[] = [
    { id: 'id', key: 'id', label: 'Log ID', width: 90, align: 'center', toolbox: true, filter: { type: 'number' } },
    { id: 'timestamp', key: 'timestamp', label: 'Timestamp', width: 170, align: 'center', toolbox: true, filter: { type: 'text' } },
    {
      id: 'level',
      key: 'level',
      label: 'Level',
      width: 90,
      align: 'center',
      toolbox: true,
      filter: { type: 'values' },
      itemRender: ({ values }) => {
        const colors = {
          INFO: '#2563eb',
          WARN: '#d97706',
          ERROR: '#dc2626',
          DEBUG: '#64748b',
        };
        return (
          <span style={{ fontWeight: 700, color: colors[values.level] }}>
            {values.level}
          </span>
        );
      },
    },
    { id: 'service', key: 'service', label: 'Service Name', width: 160, toolbox: true, filter: { type: 'values' } },
    { id: 'message', key: 'message', label: 'Log Message', width: 380, toolbox: true, filter: { type: 'text' } },
    {
      id: 'latencyMs',
      key: 'latencyMs',
      label: 'Response Time (ms)',
      width: 120,
      align: 'right',
      toolbox: true,
      filter: { type: 'number' },
      itemRender: ({ values }) => (
        <span style={{ color: values.latencyMs > 300 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
          {values.latencyMs} ms
        </span>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 14, color: '#475569' }}>
        <strong>{data.length.toLocaleString()}</strong> real-time log records are loaded with virtual scrolling.
      </div>

      <BGrid<LogItem>
        width={850}
        height={450} // Viewport height fixed (required)
        columns={columns}
        data={data}
        rowKey="id"
        showLineNumber // Verify the virtual scroll location and the full data range
        dataControl={{
          mode: 'client',
          multiSort: true,
          query,
          onChange: handleQueryChange,
        }}
        spinning={isQueryPending}
        itemHeight={28} // Explicit row height (25–28 px is recommended)
        headerHeight={34}
      />
    </div>
  );
}
```

---

## 4. Practical optimization tips for high-performance rendering

### 1) Avoid expensive calculations and hook calls inside `itemRender`

Rows in the viewport rerender rapidly as the virtual-scroll position changes. Keep `itemRender` focused on simple formatting; avoid expensive regular-expression parsing, filtering large arrays, and creating many new objects.

### 2) Set `itemHeight` to match the row content exactly

If the actual row height differs from `itemHeight`, the grid can appear to jump slightly while scrolling. Set an explicit height that matches the design, such as `itemHeight={28}` or `itemHeight={32}`.

### 3) Detect parent-container size changes (`useContainerSize`)

For dashboards that fill the available screen, measure the container instead of using fixed pixel dimensions. Pass the measured `width` and `height` to the grid so the virtual-scroll range is recalculated smoothly when the window changes size.

### 4) Move sorting and filtering for 550,000 rows to the server

The live demo focuses on verifying consistent virtual-scroll positions across 550,000 rows. Sorting or filtering that many rows in the browser can severely reduce UI responsiveness. In production, use `dataControl.mode: 'manual'` with server-side queries or pagination. See [Sorting and Filtering Toolbox](/en/learn/sorting-filtering) for client-side sorting and filtering on smaller datasets.

---

## 5. Frequently asked questions

**Q. How does browser search (Ctrl+F) work with virtual scrolling?**

Only the rows currently visible in the viewport exist in the DOM, so the browser's built-in Ctrl+F cannot find off-screen data. For large datasets, provide a grid-specific filter with the [Sorting and Filtering Toolbox](/en/learn/sorting-filtering).
