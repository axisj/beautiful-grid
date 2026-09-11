---
title: "Disabled State"
description: "Lock DataGrid UI interactions such as click, selection, editing, sorting, filtering, context menus, and pagination while work is in progress."
category: "interaction"
order: 26
locale: "en"
canonicalPath: "/en/learn/disabled"
demoId: "disabled"
features: ["disabled", "readonly", "editing", "rowChecked", "pagination", "toolbox"]
relatedGuides: ["loading", "editing", "row-selection", "sorting-filtering", "pagination"]
relatedApi: ["/en/api/props#disabled", "/en/api/props#editable", "/en/api/props#rowchecked", "/en/api/props#page"]
sinceVersion: "1.0.7"
lastReviewedAt: "2026-09-08"
indexable: true
draft: false
---

## 1. When should you use it?

While a save, approval, recalculation, or server-side workflow is running, allowing users to keep manipulating the same Grid can create duplicate requests or mismatched UI state. Set `disabled` to lock BeautifulGrid interactions in one place while still allowing users to scroll through the visible data.

`disabled` is broader than a read-only editing flag. It suppresses cell clicks, row checkboxes, checkbox editors, header sort and filter toolboxes, column resizing, cell selection, keyboard movement, context menus, search UI, and pagination requests.

---

## 2. Basic usage

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface Row {
  id: string;
  name: string;
  approved: boolean;
}

export default function DisabledGrid() {
  const [disabled, setDisabled] = useState(false);
  const [checkedRowKeys, setCheckedRowKeys] = useState<React.Key[]>([]);

  const data: BGridDataItem<Row>[] = [
    { values: { id: 'REQ-001', name: 'Month-end Inventory Refill', approved: false } },
    { values: { id: 'REQ-002', name: 'Urgent Freight Approval', approved: true } },
  ];

  const columns: BGridColumn<Row>[] = [
    { key: 'id', label: 'Request ID', width: 110 },
    { key: 'name', label: 'Subject', width: 220 },
    {
      key: 'approved',
      label: 'Approved',
      width: 90,
      align: 'center',
      editable: true,
      editor: {
        type: 'checkbox',
        ariaLabel: ({ values }) => `${values.id} approval state`,
      },
    },
  ];

  return (
    <>
      <button type="button" onClick={() => setDisabled(value => !value)}>
        {disabled ? 'Unlock grid' : 'Lock grid'}
      </button>

      <BGrid<Row>
        width={520}
        height={260}
        columns={columns}
        data={data}
        rowKey="id"
        disabled={disabled}
        editable
        rowChecked={{
          checkedRowKeys,
          onChange: (_indexes, rowKeys) => setCheckedRowKeys(rowKeys),
        }}
      />
    </>
  );
}
```

---

## 3. Pair it with `loading` and `spinning`

`loading` and `spinning` communicate state visually. `disabled` prevents interaction. During an in-flight operation, wire them from the same state when both behaviors are needed.

```tsx
<BGrid
  loading={initialLoading}
  spinning={saving}
  disabled={initialLoading || saving}
  columns={columns}
  data={data}
  width={width}
  height={height}
/>
```

This gives users a clear processing state while preventing BeautifulGrid from firing unwanted interaction events.

---

## 4. Behavior scope

| Area | When `disabled=true` |
| --- | --- |
| Cell click and double click | `onClick` and edit activation do not fire |
| Row selection | Checkbox and radio selection changes do not fire |
| Cell editing | Text, checkbox, and editor plugin editing cannot start or commit |
| Sorting and filtering | Header sort, toolbox opening, and filter changes do not fire |
| Cell selection and keyboard movement | Active-cell movement, range selection, copy, and paste requests do not fire |
| Context menu and search | Menus and search UI do not open |
| Pagination | Page number clicks do not call `page.onChange` |
| Scrolling | Still available for data inspection |

If the surrounding workflow also has buttons or form fields, control those external UI elements with the same state flag separately from the Grid prop.
