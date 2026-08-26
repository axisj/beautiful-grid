---
title: "Data and Columns"
description: "Explore type-safe column mapping with TypeScript generics, nested key paths, and the rules for column width and alignment."
category: "data-and-columns"
order: 1
locale: "en"
canonicalPath: "/en/learn/data-and-columns"
demoId: "basic"
features: ["columns", "nested-keys", "typescript", "data-types", "align"]
relatedGuides: ["getting-started", "basic", "column-groups", "editing"]
relatedApi: ["/en/api/props#columns", "/en/api/props#data", "/en/api/props#rowkey"]
lastReviewedAt: "2026-08-17"
indexable: true
draft: false
---

## 1. Overview and type safety

`BGridColumn<T>` and `BGridDataItem<T>` carry row-value types into cell renderers and callbacks. However, because `BGridColumn.key` is currently `string | string[]`, the compiler cannot automatically reject a field name that does not exist. Verify in application code and tests that each column key matches the corresponding data field.

---

## 2. Two ways to specify a column `key`

### 1) Simple string key (top-level, 1D property)

```tsx
{ key: 'username', label: 'User name', width: 120 }
```

### 2) Array path key (nested object access)

For nested data such as `{ company: { address: { city: 'Seoul' } } }`:

```tsx
{ key: ['company', 'address', 'city'], label: 'City', width: 120 }
```
