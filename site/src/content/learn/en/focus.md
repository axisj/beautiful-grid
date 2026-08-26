---
title: "Focus and Active Row"
description: "Connect cell clicks to selectedRowKey and visually highlight the currently selected row."
category: "interaction"
order: 25
locale: "en"
canonicalPath: "/en/learn/focus"
demoId: "focus"
features: ["selectedRowKey", "focus", "row-click", "active-row"]
relatedGuides: ["getting-started", "basic", "row-selection", "editing"]
relatedApi: ["/en/api/props#selectedrowkey", "/en/api/props#onclick"]
lastReviewedAt: "2026-08-23"
indexable: true
draft: false
---

## 1. When and why is it needed?

Use `selectedRowKey` when a clicked row must remain highlighted, such as when connecting a list to a detail panel. This is a controlled pattern: store the original row's key in state from `onClick`, then pass that value back through `selectedRowKey`.

---

## 2. Practical example: highlight a row and connect a detail view

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface ArticleItem {
  id: number;
  title: string;
  author: string;
  createdAt: string;
}

export default function FocusGrid() {
  const [selectedKey, setSelectedKey] = useState<string | number>(2);

  const [data] = useState<BGridDataItem<ArticleItem>[]>([
    { values: { id: 1, title: 'BeautifulGrid v1.11 release notes', author: 'Admin', createdAt: '2026-08-10' } },
    { values: { id: 2, title: 'Tips for optimizing high-performance virtual scrolling', author: 'Engineering', createdAt: '2026-08-12' } },
    { values: { id: 3, title: 'React 19 compatibility and TypeScript support', author: 'Frontend', createdAt: '2026-08-15' } },
  ]);

  const columns: BGridColumn<ArticleItem>[] = [
    { key: 'id', label: 'No.', width: 70, align: 'center' },
    { key: 'title', label: 'Title', width: 320 },
    { key: 'author', label: 'Author', width: 100, align: 'center' },
    { key: 'createdAt', label: 'Published', width: 120, align: 'center' },
  ];

  return (
    <div>
      <BGrid<ArticleItem>
        width={650}
        height={220}
        columns={columns}
        data={data}
        rowKey="id"
        selectedRowKey={selectedKey} // Unique key of the selected row (applies the active style)
        onClick={({ item }) => {
          setSelectedKey(item.id);
        }}
      />
    </div>
  );
}
```
