---
title: "Cell Merge"
description: "Learn how to visually merge identical values in adjacent rows to create readable, grouped report tables."
category: "advanced"
order: 1
locale: "en"
canonicalPath: "/en/learn/cell-merge"
demoId: "cell-merge"
features: ["cellMergeOptions", "mergeBy", "rowspan", "reporting", "grouping"]
relatedGuides: ["getting-started", "basic", "summary", "frozen-columns"]
relatedApi: ["/en/api/props#cellmergeoptions", "/en/api/props#columns"]
lastReviewedAt: "2026-08-23"
indexable: true
draft: false
---

## 1. When and why should you use cell merging?

Management dashboards, settlement reports, and inventory summaries often repeat the same values—such as category, subcategory, or owner—across several rows. That repetition can make a table harder to scan.

BeautifulGrid's **cell merge** feature lets you:

- Detect consecutive adjacent rows with the same value and display their cells as a visual `rowspan`.
- Apply the same `columnsMap` merge rules to regular and frozen columns.
- Configure each merge rule with `mergeBy` so that it follows the sort order of the data.

---

## 2. Complete example: sales items grouped by category

The following example merges cells in the **Category** and **Subcategory** columns:

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface CategoryItem {
  mainCategory: string;
  subCategory: string;
  itemCode: string;
  itemName: string;
  unitPrice: number;
  stockQty: number;
}

export default function CategoryMergeGrid() {
  const [data] = useState<BGridDataItem<CategoryItem>[]>([
    { values: { mainCategory: 'Electronics', subCategory: 'Computer accessories', itemCode: 'IT-01', itemName: 'Wireless keyboard', unitPrice: 45000, stockQty: 120 } },
    { values: { mainCategory: 'Electronics', subCategory: 'Computer accessories', itemCode: 'IT-02', itemName: 'Gaming mouse', unitPrice: 38000, stockQty: 85 } },
    { values: { mainCategory: 'Electronics', subCategory: 'Monitors and displays', itemCode: 'IT-03', itemName: '27-inch 4K monitor', unitPrice: 420000, stockQty: 30 } },
    { values: { mainCategory: 'Electronics', subCategory: 'Monitors and displays', itemCode: 'IT-04', itemName: '32-inch curved monitor', unitPrice: 580000, stockQty: 15 } },
    { values: { mainCategory: 'Furniture and interiors', subCategory: 'Office furniture', itemCode: 'FN-01', itemName: '1400 mm sit-stand desk', unitPrice: 350000, stockQty: 25 } },
    { values: { mainCategory: 'Furniture and interiors', subCategory: 'Office furniture', itemCode: 'FN-02', itemName: 'Ergonomic mesh chair', unitPrice: 280000, stockQty: 40 } },
  ]);

  const columns: BGridColumn<CategoryItem>[] = [
    { key: 'mainCategory', label: 'Category', width: 140, align: 'center' },
    { key: 'subCategory', label: 'Subcategory', width: 160, align: 'center' },
    { key: 'itemCode', label: 'Item code', width: 100, align: 'center' },
    { key: 'itemName', label: 'Item name', width: 200 },
    {
      key: 'unitPrice',
      label: 'Unit price',
      width: 120,
      align: 'right',
      itemRender: ({ values }) => `KRW ${values.unitPrice.toLocaleString('en-US')}`,
    },
    {
      key: 'stockQty',
      label: 'In stock',
      width: 90,
      align: 'right',
      itemRender: ({ values }) => `${values.stockQty} units`,
    },
  ];

  return (
    <div>
      <BGrid<CategoryItem>
        width={810}
        height={320}
        columns={columns}
        data={data}
        rowKey="itemCode"
        frozenColumnIndex={2} // Freeze Category and Subcategory on the left
        // Configure cell merging
        cellMergeOptions={{
          columnsMap: {
            0: { mergeBy: 'mainCategory' }, // Merge Category cells with the same mainCategory value
            1: { mergeBy: 'subCategory' },  // Merge Subcategory cells with the same subCategory value
          },
        }}
        headerHeight={34}
        itemHeight={30}
      />
    </div>
  );
}
```

---

## 3. `cellMergeOptions` specification

```tsx
type CellMergeOptions = {
  columnsMap: {
    [columnIndex: number]: BGridCellMergeColumn;
  };
};

interface BGridCellMergeColumn {
  wordWrap?: boolean;
  mergeBy: string | string[]; // Data key used to determine equality
}
```

- **`columnIndex`**: The zero-based index of the column to merge.
- **`mergeBy`**: The data field whose values are compared between adjacent rows.

---

## 4. Practical tips and caveats

> [!IMPORTANT]
> **Sort the data before merging**:
> Cells merge only when **consecutive adjacent rows** have the same value. If a row with `mainCategory: 'Furniture'` appears between rows whose `mainCategory` is `'Electronics'`, the merge is interrupted. Sort the data by the merge keys before passing it to the grid so that each group remains contiguous.

> [!TIP]
> **Frozen merged columns on mobile screens**:
> Freezing multiple merged columns (`frozenColumnIndex`) on narrow mobile screens can obscure the horizontal scrollable area. Consider reducing or removing frozen columns on mobile viewports.
