---
title: "Sorting and Filtering Toolbox"
description: "Apply multi-column sorting and header-toolbox filtering to practical data exploration workflows."
category: "interaction"
order: 22
locale: "en"
canonicalPath: "/en/learn/sorting-filtering"
demoId: "sorting-filtering"
features: ["sorting", "filtering", "toolbox", "multi-sort", "dataControl"]
relatedGuides: ["getting-started", "basic", "sorting", "virtual-scroll"]
relatedApi: ["/en/api/props#datacontrol", "/en/api/props#bgriddatacontrol-query", "/en/api/props#columns"]
lastReviewedAt: "2026-08-17"
indexable: true
draft: false
---

## 1. When and why should you use it?

When users explore large datasets, sorting by the highest amount or quickly filtering for a specific department or status is essential.

BeautifulGrid provides three related data-exploration tools:

1. **Sort from a column header**: Clicking a column label cycles through ascending (ASC), descending (DESC), and unsorted states.
2. **Header toolbox popover**: Clicking the filter and sort icon in a column header provides value-list filters, text search, and multi-column sorting.
3. **Client or manual mode (`dataControl`)**: In `client` mode, the grid processes the current `data`; in `manual` mode, the parent retrieves the matching data.

---

## 2. Practical example: Client-side multi-filter and sorting

The following example enables the header toolbox and runs data processing in client mode:

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem, type BGridDataQuery } from 'beautiful-grid';

interface EmployeeItem {
  id: number;
  name: string;
  department: string;
  position: string;
  salary: number;
  joinedAt: string;
}

export default function EmployeeFilterGrid() {
  const [query, setQuery] = useState<BGridDataQuery>({ sortParams: [], filterParams: [] });
  const [data] = useState<BGridDataItem<EmployeeItem>[]>([
    { values: { id: 1, name: 'Alex Kim', department: 'Engineering', position: 'Manager', salary: 85000000, joinedAt: '2020-03-01' } },
    { values: { id: 2, name: 'Olivia Lee', department: 'Design', position: 'Senior', salary: 52000000, joinedAt: '2022-07-15' } },
    { values: { id: 3, name: 'Daniel Park', department: 'Engineering', position: 'Principal', salary: 92000000, joinedAt: '2018-11-01' } },
    { values: { id: 4, name: 'Jiwon Choi', department: 'Marketing', position: 'Lead', salary: 64000000, joinedAt: '2021-01-10' } },
    { values: { id: 5, name: 'Donghoon Jung', department: 'Engineering', position: 'Associate', salary: 45000000, joinedAt: '2024-02-01' } },
    { values: { id: 6, name: 'Sophie Han', department: 'People Operations', position: 'Senior', salary: 55000000, joinedAt: '2023-05-10' } },
  ]);

  const columns: BGridColumn<EmployeeItem>[] = [
    { id: 'id', key: 'id', label: 'Employee ID', width: 70, align: 'center', toolbox: true, filter: { type: 'number' } },
    { id: 'name', key: 'name', label: 'Name', width: 120, align: 'center', toolbox: true, filter: { type: 'text' } },
    { id: 'department', key: 'department', label: 'Department', width: 140, toolbox: true, filter: { type: 'values' } },
    { id: 'position', key: 'position', label: 'Position', width: 100, align: 'center', toolbox: true, filter: { type: 'values' } },
    {
      key: 'salary',
      label: 'Annual salary',
      width: 140,
      align: 'right',
      toolbox: true,
      filter: { type: 'number' },
      itemRender: ({ values }) => `${values.salary.toLocaleString()} KRW`,
    },
    { id: 'joinedAt', key: 'joinedAt', label: 'Hire date', width: 120, align: 'center', toolbox: true, filter: { type: 'text' } },
  ];

  return (
    <div>
      <div style={{ marginBottom: 10, fontSize: 13, color: '#475569' }}>
        💡 Hover over a column header and click the <strong>filter and sort icon</strong> to filter by department or position.
      </div>

      <BGrid<EmployeeItem>
        width={750}
        height={320}
        columns={columns}
        data={data}
        rowKey="id"
        dataControl={{
          mode: 'client',
          multiSort: true,
          query,
          onChange: setQuery,
        }}
        showLineNumber={true}
      />
    </div>
  );
}
```

---

## 3. Choose a `dataControl` mode

| Mode | Configuration | Behavior | Recommended use |
|---|---|---|---|
| **Client mode** | `{ mode: 'client', query, onChange }` | The grid calculates sorting and filtering results from the supplied `data`. | Immediate exploration within data already loaded in the browser |
| **Manual mode** | `{ mode: 'manual', query, onChange }` | The grid reports only the condition change; the parent queries the server and supplies new `data`. | Server-side pagination or database sorting and filtering |

---

## 4. Practical tips and gotchas

> [!TIP]
> **Use unique column IDs:**
> When the toolbox is enabled, each column must have a unique `key` or `id`. If multiple columns reuse the same `key`, give each one a unique `id`, such as `id: 'custom_id_1'`.
