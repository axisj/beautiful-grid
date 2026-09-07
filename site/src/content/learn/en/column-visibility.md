---
title: "Column Visibility"
description: "Hide columns from the header toolbox, restore them from another column menu, or show every hidden column at once."
category: "interaction"
order: 24
locale: "en"
canonicalPath: "/en/learn/column-visibility"
demoId: "column-visibility"
features: ["columnVisibility", "hideable", "controlled-state", "user-customization"]
relatedGuides: ["data-and-columns", "sorting-filtering", "column-groups", "frozen-columns"]
relatedApi: ["/en/api/props#columnvisibility", "/en/api/props#bgridcolumnvisibilityoptions", "/en/api/props#bgridcolumn-hideable"]
sinceVersion: "1.0.6"
lastReviewedAt: "2026-09-07"
indexable: true
draft: false
---

## Basic usage

Column hiding and restoration are available starting with **BeautifulGrid 1.0.6**.

Enable `columnVisibility` to add a **Hide this column** action to every eligible header toolbox. Restore hidden columns from any remaining column menu. The final visible column cannot be hidden. As shown in the live demo, enabling `toolbox` and `filter` on a column puts sorting, filtering, and visibility actions in the same menu.

```tsx
<BGrid
  width={800}
  height={420}
  columns={columns}
  data={data}
  columnVisibility
/>
```

## Persisting visibility

Give every column a unique `id` and use controlled state when visibility belongs to a user preference or saved view.

```tsx
const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>(['owner']);

<BGrid
  width={800}
  height={420}
  columns={columns}
  data={data}
  columnVisibility={{
    hiddenColumnIds,
    onChange: setHiddenColumnIds,
  }}
/>
```

Set `hideable: false` on an essential column. Hiding does not remove its active sort or filter conditions, so they remain intact when the column is restored.

```tsx
const columns = [
  { id: 'orderNo', key: 'orderNo', label: 'Order No.', width: 120, hideable: false },
  { id: 'customer', key: 'customer', label: 'Customer', width: 160 },
  { id: 'owner', key: 'owner', label: 'Owner', width: 120 },
];
```

Column drag reordering is disabled while at least one column is hidden. The configured `columnSortable` behavior returns after every column is shown again.
