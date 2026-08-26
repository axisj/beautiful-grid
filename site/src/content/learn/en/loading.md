---
title: "Loading & Empty State"
description: "Show a spinner overlay while data loads and customize the message displayed when no rows or search results are available."
category: "styling-and-accessibility"
order: 1
locale: "en"
canonicalPath: "/en/learn/loading"
demoId: "loading"
features: ["loading", "spinning", "msg", "empty-state", "overlay"]
relatedGuides: ["getting-started", "basic", "pagination"]
relatedApi: ["/en/api/props#loading", "/en/api/props#spinning", "/en/api/props#msg"]
lastReviewedAt: "2026-08-23"
indexable: true
draft: false
---

## 1. When and why is it needed?

During an API request, show a **semi-transparent loading overlay and spinner** so users do not mistake a blank screen for a frozen application. When a search returns 0 rows, display a clear message such as **"No data found"**. Both are fundamental to a polished user experience.

BeautifulGrid controls loading indicators and empty-state messages with `loading`, `spinning`, and `msg.emptyList`.

---

## 2. Practical example: simulate loading and empty states

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function LoadingDemoGrid() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BGridDataItem<Product>[]>([]);

  const columns: BGridColumn<Product>[] = [
    { key: 'id', label: 'ID', width: 80, align: 'center' },
    { key: 'name', label: 'Product name', width: 220 },
    { key: 'price', label: 'Price', width: 140, align: 'right', itemRender: ({ values }) => `₩${values.price.toLocaleString()}` },
  ];

  const handleFetch = () => {
    setLoading(true);
    setTimeout(() => {
      setData([
        { values: { id: 1, name: 'Ergonomic Mouse', price: 65000 } },
        { values: { id: 2, name: 'Tenkeyless Keyboard', price: 129000 } },
      ]);
      setLoading(false);
    }, 1000);
  };

  const handleClear = () => {
    setData([]);
  };

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <button onClick={handleFetch} style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          Load data (1-second delay)
        </button>
        <button onClick={handleClear} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: 4, cursor: 'pointer' }}>
          Clear data (empty state)
        </button>
      </div>

      <BGrid<Product>
        width={500}
        height={240}
        columns={columns}
        data={data}
        rowKey="id"
        loading={loading} // Automatically render the overlay spinner while loading.
        msg={{
          emptyList: 'No products match the current filters.',
        }}
      />
    </div>
  );
}
```
