---
title: "Row Styling"
description: "Dynamically assign custom CSS classes to rows that meet business conditions such as canceled payments, low inventory, or VIP membership."
category: "styling-and-accessibility"
order: 2
locale: "en"
canonicalPath: "/en/learn/row-styling"
demoId: "row-styling"
features: ["getRowClassName", "conditional-styling", "row-color", "highlight", "css-classes"]
relatedGuides: ["getting-started", "basic", "theming", "focus"]
relatedApi: ["/en/api/props#getrowclassname", "/en/api/props#columns"]
lastReviewedAt: "2026-08-23"
indexable: true
draft: false
---

## 1. When and why should you use it?

Use `getRowClassName` to draw attention to rows in warning states, such as error logs or low-inventory alerts, or important states, such as VIP customers and completed tasks. You can apply red, yellow, or green background highlights to the entire row based on your business rules.

---

## 2. Complete example: highlighting low-stock items

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  threshold: number;
}

export default function RowStylingGrid() {
  const [data] = useState<BGridDataItem<InventoryItem>[]>([
    { values: { id: 'P1', name: '65W Fast-Charging Adapter', stock: 4, threshold: 10 } }, // Low stock
    { values: { id: 'P2', name: 'Wireless Bluetooth Earbuds', stock: 28, threshold: 10 } }, // In stock
    { values: { id: 'P3', name: 'Tempered Glass Screen Protector', stock: 0, threshold: 5 } }, // Out of stock
    { values: { id: 'P4', name: 'Magnetic Tablet Stand', stock: 15, threshold: 5 } }, // In stock
  ]);

  const columns: BGridColumn<InventoryItem>[] = [
    { key: 'id', label: 'Code', width: 80, align: 'center' },
    { key: 'name', label: 'Item Name', width: 240 },
    {
      key: 'stock',
      label: 'Current Stock',
      width: 100,
      align: 'right',
      itemRender: ({ values }) => <strong>{values.stock} units</strong>,
    },
    { key: 'threshold', label: 'Safety Stock', width: 100, align: 'right', itemRender: ({ values }) => `${values.threshold} units` },
  ];

  return (
    <div>
      <style>{`
        .row-out-of-stock {
          background-color: #fee2e2 !important; /* Light red */
          color: #991b1b;
        }
        .row-low-stock {
          background-color: #fef3c7 !important; /* Light yellow */
          color: #92400e;
        }
      `}</style>

      <BGrid<InventoryItem>
        width={560}
        height={220}
        columns={columns}
        data={data}
        rowKey="id"
        // Return a row class based on inventory state
        getRowClassName={(_, item) => {
          if (item.values.stock === 0) return 'row-out-of-stock';
          if (item.values.stock < item.values.threshold) return 'row-low-stock';
          return '';
        }}
      />
    </div>
  );
}
```
