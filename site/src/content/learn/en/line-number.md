---
title: "Line Numbers"
description: "Display sequential row numbers in the frozen area on the left and keep them aligned with virtual scrolling."
category: "data-and-columns"
order: 4
locale: "en"
canonicalPath: "/en/learn/line-number"
demoId: "line-number"
features: ["showLineNumber", "frozen", "indexing"]
relatedGuides: ["getting-started", "basic", "row-reorder", "frozen-columns"]
relatedApi: ["/en/api/props#showlinenumber"]
lastReviewedAt: "2026-08-23"
indexable: true
draft: false
---

## 1. When and why is it needed?

When reviewing hundreds or thousands of records, a row-number column makes it easy to see **where you are in the dataset**. This is a familiar spreadsheet convention.

Set `showLineNumber={true}` to add a row-number column automatically on the left side of the DataGrid. During virtual scrolling, the Grid efficiently calculates the correct number from 1 through N for the current position.

The live demo above uses **2,500 order and fulfillment records**. Scroll down to see the number column automatically reserve enough width for 3- and 4-digit row numbers. Click or drag row numbers to select entire rows. Click or drag a non-sortable column header to select the entire column. Use `Shift` for contiguous ranges and `Ctrl`/`Cmd` for multiple ranges.

---

## 2. Practical example: row numbers for a large order dataset

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface Order {
  orderNo: string;
  customerName: string;
  status: string;
}

export default function LineNumberGrid() {
  const [data] = useState<BGridDataItem<Order>[]>(
    Array.from({ length: 2500 }).map((_, i) => ({
      values: {
        orderNo: `ORD-2026-${String(i + 1).padStart(6, '0')}`,
        customerName: ['A-One Retail', 'Hanbit Trading', 'Mono Market'][i % 3],
        status: ['Preparing shipment', 'Picking complete', 'In transit'][i % 3],
      },
    }))
  );

  const columns: BGridColumn<Order>[] = [
    { key: 'orderNo', label: 'Order No.', width: 140 },
    { key: 'customerName', label: 'Customer', width: 160 },
    { key: 'status', label: 'Fulfillment Status', width: 120, align: 'center' },
  ];

  return (
    <div>
      <BGrid<Order>
        width={650}
        height={300}
        columns={columns}
        data={data}
        rowKey="orderNo"
        showLineNumber={true} // Show row numbers
      />
    </div>
  );
}
```
