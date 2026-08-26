---
title: 'Row Reorder'
description: 'Move rows by pointer or keyboard from the handle on the left and safely persist the order with virtual scrolling, selection, and merged cells.'
category: 'interaction'
order: 24
locale: 'en'
canonicalPath: '/en/learn/row-reorder'
demoId: 'row-reorder'
features: ['reorder', 'drag-handle', 'onReorder', 'pointer-drag', 'keyboard', 'virtual-scroll']
relatedGuides: ['getting-started', 'basic', 'column-reorder', 'row-selection', 'virtual-scroll', 'accessibility-and-keyboard']
relatedApi: ['/en/api/props#reorder', '/en/api/props#showlinenumber', '/en/api/props#rowkey']
lastReviewedAt: '2026-08-23'
indexable: true
draft: false
---

## 1. When and why should you use it?

Drag-and-drop row reordering is essential wherever users must arrange and save items themselves—for example, menu trees, banner priorities, and task lists.

When you enable BeautifulGrid's `reorder` feature:

- A dedicated drag handle (`grip-vertical`) appears automatically at the left of the row-number area.
- The source row and intervening rows animate with a 150 ms transform, previewing the destination before the drop.
- After the drop animation finishes, the grid commits the new array once and passes it to `onReorder`.
- Virtual scrolling supports automatic edge scrolling and a preview for a source row that moves off screen.
- Keyboard users can focus the handle, pick up the row with `Space` or `Enter`, move it with the arrow keys, and drop it with `Enter`.

---

## 2. Complete example: managing banner display order

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface BannerItem {
  id: number;
  title: string;
  linkUrl: string;
  active: boolean;
}

export default function BannerReorderGrid() {
  const [data, setData] = useState<BGridDataItem<BannerItem>[]>([
    { values: { id: 1, title: 'Summer promotion banner', linkUrl: '/events/summer', active: true } },
    { values: { id: 2, title: '10% welcome coupon for new members', linkUrl: '/welcome', active: true } },
    { values: { id: 3, title: '$5 instant discount with Kakao Pay', linkUrl: '/events/kakaopay', active: false } },
    { values: { id: 4, title: 'Premium membership launch event', linkUrl: '/membership', active: true } },
  ]);

  const columns: BGridColumn<BannerItem>[] = [
    { key: 'id', label: 'ID', width: 60, align: 'center' },
    { key: 'title', label: 'Banner Title', width: 280 },
    { key: 'linkUrl', label: 'Link URL', width: 180 },
    {
      key: 'active',
      label: 'Visible',
      width: 90,
      align: 'center',
      itemRender: ({ values }) => (
        <span style={{ color: values.active ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
          {values.active ? 'Visible' : 'Inactive'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 10, fontSize: 13, color: '#475569' }}>
        💡 Drag the six-dot handle at the left of a row up or down to change its position.
      </div>

      <BGrid<BannerItem>
        width={720}
        height={260}
        columns={columns}
        data={data}
        rowKey='id'
        showLineNumber={true} // Show the row-number area (required)
        reorder={{
          enabled: true, // Enable drag-and-drop row reordering
          onReorder: (newData: BGridDataItem<BannerItem>[]) => {
            console.log('Reorder complete:', newData.map(d => d.values.title));
            setData(newData);
            return true; // Return true on success
          },
        }}
      />
    </div>
  );
}
```

## 3. Input methods

| Input | Action |
| --- | --- |
| Mouse, pen, or touch | Hold the handle, move it up or down, and release it to confirm the new position. |
| `Space` / `Enter` | Pick up the row with the focused handle, or drop it at the current position. |
| `ArrowUp` / `ArrowDown` | Move the keyboard destination one row at a time. |
| `Escape` | Cancel and return the row to its original position. |

A short click that does not start a drag leaves the data order unchanged. `onReorder` is not called while the row is moving; it is called exactly once with the final array after the rows settle. When `prefers-reduced-motion: reduce` is active, both the animation and the commit delay are removed.

## 4. The `onReorder` contract and save failures

`onReorder` is a synchronous callback. Return `true` or `void` to keep the new order; return `false` to restore the original internal data, checkbox state, and active-cell state. If the callback throws, the grid performs the same cleanup and rollback. The callback does not support a pending state that waits for a server-save Promise, so screens that persist the order remotely should implement optimistic updates and recovery from save failures in application state.

The moved wrapper is marked with `status: edit`. The input `data` array and existing row wrappers are not mutated directly.

## 5. Selection, editing and action identifiers

- Specify `rowKey` so the grid can reliably determine whether the row order is still the same if an external render occurs during a drag.
- Checkbox state and the active cell are remapped by the moved data item, not by index. The multi-cell selection range is cleared after a successful reorder so it cannot point to the wrong cells.
- While a cell editor is open, the handle is disabled so an unsaved draft is not discarded silently.
- If the external `data` order changes during a drag, the current reorder session is canceled and the callback is not called.

## 6. Restrictions and safety fallback

- Both `showLineNumber` and `reorder.enabled` are required.
- Client-side sorting or filtering produces a display order that differs from the source array, so reordering is disabled automatically.
- Reordering is also disabled when rows are frozen or pivot results are being rendered.
- Transforming `rowspan` cells in a merged table can make them overlap. In that case, the grid leaves the row cells in place, marks the destination with a lightweight preview and insertion guide, and then applies the same data permutation.

You can customize the interaction by overriding `--bgrid-row-reorder-duration`, `--bgrid-row-reorder-easing`, `--bgrid-row-reorder-guide-color`, `--bgrid-row-reorder-preview-bg`, and `--bgrid-row-reorder-preview-shadow` in your theme.
