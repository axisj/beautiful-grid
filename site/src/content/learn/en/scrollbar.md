---
title: "Custom Scrollbar"
description: "Configure native browser scrollbars or OS-independent custom overlay scrollbars, including the available dock options."
category: "styling-and-accessibility"
order: 6
locale: "en"
canonicalPath: "/en/learn/scrollbar"
demoId: "scrollbar"
features: ["scrollbar", "custom-scrollbar", "native-scrollbar", "scrollbar-dock", "scroll-metrics"]
relatedGuides: ["getting-started", "basic", "virtual-scroll", "pagination"]
relatedApi: ["/en/api/props#scrollbar", "/en/api/props#bottombarheight"]
lastReviewedAt: "2026-08-18"
indexable: true
draft: false
---

## 1. When and why should you use it?

Default scrollbars differ in appearance and occupied space across operating systems and browsers. Use the `scrollbar` prop to choose the `native`, `classic`, or `modern` variant and control whether the horizontal and vertical scrollbars are visible. The custom horizontal scrollbar always appears in the Bottom Bar; its position cannot be changed.

- `modern`: The default style, with a thin rounded track and thumb plus minimal navigation buttons.
- `classic`: A Windows-style scrollbar with a squared track and arrow buttons.
- `native`: A compatibility style that applies the BeautifulGrid theme to the browser's native scrollbar.

---

## 2. Complete example: enabling a custom scrollbar

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface Item {
  id: number;
  col1: string;
  col2: string;
  col3: string;
  col4: string;
  col5: string;
}

export default function CustomScrollbarGrid() {
  const [data] = useState<BGridDataItem<Item>[]>(
    Array.from({ length: 50 }).map((_, i) => ({
      values: {
        id: i + 1,
        col1: `Data_1_${i}`,
        col2: `Data_2_${i}`,
        col3: `Data_3_${i}`,
        col4: `Data_4_${i}`,
        col5: `Data_5_${i}`,
      },
    }))
  );

  const columns: BGridColumn<Item>[] = [
    { key: 'id', label: 'ID', width: 60, align: 'center' },
    { key: 'col1', label: 'Column 1', width: 180 },
    { key: 'col2', label: 'Column 2', width: 180 },
    { key: 'col3', label: 'Column 3', width: 180 },
    { key: 'col4', label: 'Column 4', width: 180 },
    { key: 'col5', label: 'Column 5', width: 180 },
  ];

  return (
    <div>
      <BGrid<Item>
        width={600} // Narrow enough to require horizontal scrolling
        height={260}
        columns={columns}
        data={data}
        rowKey="id"
        // Custom scrollbar configuration
        scrollbar={{
          variant: 'modern', // 'native' | 'classic' | 'modern'
        }}
      />
    </div>
  );
}
```
