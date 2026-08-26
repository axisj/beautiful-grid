---
title: "Sorting"
description: "Learn single-column and multi-column sorting rules and how to manage sorting as controlled state."
category: "data-and-columns"
order: 5
locale: "en"
canonicalPath: "/en/learn/sorting"
demoId: "sorting"
features: ["sorting", "multi-sort", "sortInfo", "asc-desc", "dataControl"]
relatedGuides: ["getting-started", "basic", "sorting-filtering", "virtual-scroll"]
relatedApi: ["/en/api/props#sort", "/en/api/props#datacontrol"]
lastReviewedAt: "2026-08-17"
indexable: true
draft: false
---

## 1. When and why should you use it?

Real-world applications often need compound sorting across several columns, such as sorting first by department name in ascending order and then by job title or hire date within each department.

BeautifulGrid manages controlled sorting through `sort.sortParams` and `sort.onChange`. With the `sort` API, the parent receives the updated conditions, sorts the data, and passes the result back to the grid. To let the header toolbox process sorting automatically on the client, use `dataControl.mode: 'client'`.

---

## 2. Practical example: Control multi-column sorting

```tsx
import React, { useMemo, useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem, type BGridSortParam } from 'beautiful-grid';

interface Person {
  id: number;
  dept: string;
  name: string;
  score: number;
}

export default function SortGrid() {
  const [sortParams, setSortParams] = useState<BGridSortParam[]>([]);
  const [data] = useState<BGridDataItem<Person>[]>([
    { values: { id: 1, dept: 'Engineering', name: 'Alex Kim', score: 95 } },
    { values: { id: 2, dept: 'Engineering', name: 'Daniel Park', score: 88 } },
    { values: { id: 3, dept: 'Planning', name: 'Sujin Lee', score: 92 } },
    { values: { id: 4, dept: 'Planning', name: 'David Choi', score: 95 } },
  ]);

  const columns: BGridColumn<Person>[] = [
    { key: 'id', label: 'ID', width: 70, align: 'center' },
    { key: 'dept', label: 'Department', width: 120, align: 'center' },
    { key: 'name', label: 'Name', width: 120, align: 'center' },
    { key: 'score', label: 'Score', width: 100, align: 'right' },
  ];

  const sortedData = useMemo(() => [...data].sort((a, b) => {
    for (const sort of sortParams) {
      if (!sort.key) continue;
      const left = a.values[sort.key as keyof Person];
      const right = b.values[sort.key as keyof Person];
      if (left === right) continue;
      const result = left < right ? -1 : 1;
      return sort.orderBy === 'asc' ? result : -result;
    }
    return 0;
  }), [data, sortParams]);

  return (
    <div>
      <BGrid<Person>
        width={550}
        height={240}
        columns={columns}
        data={sortedData}
        rowKey="id"
        sort={{
          multiSort: true,
          sortParams,
          onChange: setSortParams,
        }}
      />
    </div>
  );
}
```
