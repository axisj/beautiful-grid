---
title: "Column Reorder"
description: "Learn how to rearrange column headers with drag and drop and persist the resulting order."
category: "interaction"
order: 23
locale: "en"
canonicalPath: "/en/learn/column-reorder"
demoId: "column-reorder"
features: ["columnSortable", "drag-and-drop", "reorder", "user-customization"]
relatedGuides: ["getting-started", "basic", "row-reorder", "sorting"]
relatedApi: ["/en/api/props#columnsortable", "/en/api/props#columns"]
lastReviewedAt: "2026-08-17"
indexable: true
draft: false
---

## 1. When and why should you use it?

Different users prioritize different columns in their daily work. One person may want to see contact information first, while another may want the order amount at the beginning of the grid.

Set `columnSortable={true}` to let users drag a header with the mouse and immediately move the column to their preferred position.

---

## 2. Practical example: Reorder columns by dragging

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface TaskItem {
  id: number;
  title: string;
  assignee: string;
  priority: string;
  dueDate: string;
}

export default function ColumnReorderGrid() {
  const [columns, setColumns] = useState<BGridColumn<TaskItem>[]>([
    { key: 'id', label: 'ID', width: 70, align: 'center' },
    { key: 'title', label: 'Task', width: 220 },
    { key: 'assignee', label: 'Assignee', width: 120, align: 'center' },
    { key: 'priority', label: 'Priority', width: 100, align: 'center' },
    { key: 'dueDate', label: 'Due date', width: 120, align: 'center' },
  ]);

  const [data] = useState<BGridDataItem<TaskItem>[]>([
    { values: { id: 1, title: 'Migrate payment module to v2', assignee: 'Alex Kim', priority: 'High', dueDate: '2026-08-25' } },
    { values: { id: 2, title: 'Improve responsive mobile UI', assignee: 'Sujin Lee', priority: 'Normal', dueDate: '2026-08-28' } },
    { values: { id: 3, title: 'Prepare quarterly security audit report', assignee: 'Daniel Park', priority: 'Urgent', dueDate: '2026-08-20' } },
  ]);

  return (
    <div>
      <div style={{ marginBottom: 10, fontSize: 13, color: '#475569' }}>
        💡 Drag a column header label left or right to change its position.
      </div>

      <BGrid<TaskItem>
        width={700}
        height={240}
        columns={columns}
        data={data}
        rowKey="id"
        columnSortable={true} // Enable column reordering by dragging headers
        onChangeColumns={(_, { columns: nextColumns }) => {
          console.log('Updated column order:', nextColumns.map(c => c.key));
          setColumns(nextColumns);
        }}
      />
    </div>
  );
}
```
