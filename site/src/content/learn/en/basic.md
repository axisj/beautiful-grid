---
title: "Basic DataGrid"
description: "Learn basic column configuration, custom cell rendering with itemRender, frozen columns, alignment, and row click handling through a practical example."
category: "getting-started"
order: 2
locale: "en"
canonicalPath: "/en/learn/basic"
demoId: "basic"
features: ["columns", "itemRender", "frozen-columns", "onClick", "align"]
relatedGuides: ["getting-started", "data-and-columns", "frozen-columns", "editing"]
relatedApi: ["/en/api/props#columns", "/en/api/props#frozencolumnindex", "/en/api/props#onclick"]
lastReviewedAt: "2026-08-17"
indexable: true
draft: false
---

## 1. When should you use this pattern, and what will you learn?

A common business application needs to present order lists, account ledgers, or member directories with several data formats—currency, dates, status badges, and tags—while keeping key columns such as the order number or customer name visible during horizontal scrolling.

This guide covers four core techniques:

1. **Custom cell rendering (`itemRender`)**: Turn raw values into badges, links, and formatted currency.
2. **Frozen columns (`frozenColumnIndex`)**: Keep the first 1–N columns visible while scrolling horizontally.
3. **Column alignment (`align`) and width**: Apply consistent alignment rules for text, numbers, codes, and dates.
4. **Row click handling (`onClick`)**: Open a detail modal or popup when the user selects a row.

---

## 2. Complete example: order management

The following component models an e-commerce order-management screen:

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface OrderItem {
  orderNo: string;
  customerName: string;
  productName: string;
  orderDate: string;
  amount: number;
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
}

const statusBadgeStyles: Record<string, { bg: string; color: string; label: string }> = {
  PENDING: { bg: '#fef3c7', color: '#92400e', label: 'Payment complete' },
  SHIPPED: { bg: '#e0f2fe', color: '#075985', label: 'In transit' },
  DELIVERED: { bg: '#dcfce7', color: '#166534', label: 'Delivered' },
  CANCELLED: { bg: '#fee2e2', color: '#991b1b', label: 'Cancelled' },
};

export default function OrderListGrid() {
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  // 1. Configure the columns
  const columns: BGridColumn<OrderItem>[] = [
    {
      key: 'orderNo',
      label: 'Order number',
      width: 130,
      align: 'center',
      itemRender: ({ values }) => (
        <span style={{ fontWeight: 600, color: '#2563eb', cursor: 'pointer' }}>
          {values.orderNo}
        </span>
      ),
    },
    {
      key: 'customerName',
      label: 'Customer',
      width: 120,
      align: 'left',
    },
    {
      key: 'productName',
      label: 'Product',
      width: 250,
      align: 'left',
    },
    {
      key: 'amount',
      label: 'Amount',
      width: 130,
      align: 'right',
      itemRender: ({ values }) => (
        <span style={{ fontWeight: 600 }}>
          KRW {values.amount.toLocaleString('en-US')}
        </span>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      width: 110,
      align: 'center',
      itemRender: ({ values }) => {
        const badge = statusBadgeStyles[values.status];
        return (
          <span style={{
            padding: '2px 8px',
            borderRadius: '12px',
          fontSize: '13px',
            fontWeight: 600,
            backgroundColor: badge.bg,
            color: badge.color,
          }}>
            {badge.label}
          </span>
        );
      },
    },
    {
      key: 'orderDate',
      label: 'Ordered at',
      width: 160,
      align: 'center',
    },
  ];

  // 2. Provide the row data
  const data: BGridDataItem<OrderItem>[] = [
    { values: { orderNo: 'ORD-2026-001', customerName: 'Alex Morgan', productName: 'Wireless mechanical keyboard', amount: 159000, status: 'DELIVERED', orderDate: '2026-08-15 14:22' } },
    { values: { orderNo: 'ORD-2026-002', customerName: 'Jamie Park', productName: '27-inch 4K monitor', amount: 489000, status: 'SHIPPED', orderDate: '2026-08-16 09:15' } },
    { values: { orderNo: 'ORD-2026-003', customerName: 'Taylor Kim', productName: 'Ergonomic vertical mouse', amount: 69000, status: 'PENDING', orderDate: '2026-08-17 11:40' } },
    { values: { orderNo: 'ORD-2026-004', customerName: 'Jordan Lee', productName: 'USB-C multiport hub', amount: 45000, status: 'CANCELLED', orderDate: '2026-08-17 13:02' } },
  ];

  return (
    <div>
      <BGrid<OrderItem>
        width={800}
        height={320}
        columns={columns}
        data={data}
        rowKey="orderNo"
        frozenColumnIndex={2} // Freeze the order-number and customer columns on the left
        headerHeight={36}
        itemHeight={32}
        onClick={({ item, index }) => {
          setSelectedOrder(item);
          console.log(`Selected row index: ${index}`, item);
        }}
      />

      {selectedOrder && (
        <div style={{ marginTop: 12, padding: 12, backgroundColor: '#f1f5f9', borderRadius: 8, fontSize: 13 }}>
          Selected order: <strong>{selectedOrder.orderNo}</strong> ({selectedOrder.customerName} / KRW {selectedOrder.amount.toLocaleString('en-US')})
        </div>
      )}
    </div>
  );
}
```

---

## 3. Key props

| Prop | Type | Default | Practical meaning |
|---|---|---|---|
| `columns` | `BGridColumn<T>[]` | `[]` (required) | The column definitions for header labels, widths, alignment, and custom renderers. |
| `data` | `BGridDataItem<T>[]` | `[]` (required) | The row data. Each item must be wrapped in `{ values: T }`. |
| `frozenColumnIndex` | `number` | `0` | Freezes every column whose index is lower than this value. For example, `2` freezes columns 0 and 1. |
| `headerHeight` | `number` | `30` | The height of the column-header area in pixels. Adjust it for the font size or multi-row headers. |
| `itemHeight` | `number` | `15` | The base height of the cell-content area in pixels. The grid uses it for virtual-scroll calculations. |
| `itemPadding` | `number` | `7` | The vertical spacing added to each row. Confirm the resulting row height with the active theme. |
| `onClick` | `(params) => void` | `undefined` | Called when a cell is clicked. It receives `{ item, index, columnIndex, column }`. |

---

## 4. Using the custom cell renderer (`itemRender`)

`BGridColumn.itemRender` lets you render a React node inside a cell instead of displaying only the raw value.

### Callback parameters

```tsx
itemRender?: (params: {
  item: BGridDataItem<T>;      // Full row wrapper ({ values, status, checked })
  values: T;                  // Business data object for the current row
  value: any;                 // Cell value resolved from the column key
  column: BGridColumn<T>;      // Current column definition
  index: number;              // Current displayed row index
  columnIndex: number;        // Column index
  handleSave?: (value: any) => void;   // Save trigger in edit mode
  handleCancel?: () => void;           // Cancel trigger in edit mode
}) => React.ReactNode;
```

### Recommended patterns

- **Currency and numbers**: Format values with `values.amount.toLocaleString()`.
- **Status badges**: Render a tag based on `values.status`.
- **Action buttons**: Add per-row edit or delete controls. Call `event.stopPropagation()` from the button handler to prevent the row-level `onClick` event from firing as well.

---

## 5. Practical tips and caveats

> [!TIP]
> **Check horizontal-scroll performance with frozen columns**:
> BeautifulGrid renders the frozen and scrollable regions as separate components. If cell renderers are complex or the grid has many columns, verify scroll synchronization in the target browsers and with a realistic data volume.

> [!WARNING]
> **Control event propagation inside cells**:
> If clicking a `<button>` or `<input>` inside `itemRender` should not also trigger the grid's row-level `onClick` event, call `event.stopPropagation()` in the control's handler.
