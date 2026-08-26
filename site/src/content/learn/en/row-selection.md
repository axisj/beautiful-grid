---
title: "Checkbox & Radio Selection"
description: "Learn checkbox multi-selection, radio single-selection, select-all indeterminate state, and controlled selection state."
category: "interaction"
order: 21
locale: "en"
canonicalPath: "/en/learn/row-selection"
demoId: "row-selection"
features: ["rowChecked", "checkbox", "radio", "checkedRowKeys", "indeterminate", "batch-action"]
relatedGuides: ["getting-started", "basic", "focus", "editing"]
relatedApi: ["/en/api/props#rowchecked", "/en/api/props#bgridrowchecked-checkedrowkeys", "/en/api/props#selectedrowkey"]
lastReviewedAt: "2026-08-17"
indexable: true
draft: false
---

## 1. When and why should you use it?

One of the most common workflows in an admin interface is selecting multiple items with checkboxes and then deleting, approving, or exporting them in a batch.

BeautifulGrid provides these row-selection features out of the box:

- **Multiple selection (checkbox)**: Select any number of rows.
- **Single selection (radio)**: Restrict selection to one row.
- **Select-all tri-state**: Reflect all selected (`true`), none selected (`false`), or some selected (`indeterminate`) in the header checkbox automatically.
- **Key-based selection (`checkedRowKeys`)**: Keep selection stable through virtual scrolling, sorting, and filtering.

---

## 2. Complete example: batch-processing pending payment approvals

The following example synchronizes checkbox selection with React state (`checkedKeys`) and approves all selected requests in one operation:

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface PaymentItem {
  id: string;
  applicant: string;
  department: string;
  purpose: string;
  amount: number;
  requestDate: string;
}

export default function PaymentApprovalGrid() {
  // Controlled state containing the selected row IDs
  const [checkedKeys, setCheckedKeys] = useState<string[]>(['REQ-002']);

  const [data, setData] = useState<BGridDataItem<PaymentItem>[]>([
    { values: { id: 'REQ-001', applicant: 'Alex Kim', department: 'Sales', purpose: 'Transportation for client meeting', amount: 35000, requestDate: '2026-08-16' } },
    { values: { id: 'REQ-002', applicant: 'Eugene Song', department: 'Development Planning', purpose: 'Cloud server usage', amount: 890000, requestDate: '2026-08-16' } },
    { values: { id: 'REQ-003', applicant: 'Jamie Lim', department: 'People Operations', purpose: 'Office supplies', amount: 120000, requestDate: '2026-08-17' } },
    { values: { id: 'REQ-004', applicant: 'Sam Oh', department: 'Marketing', purpose: 'Online advertising', amount: 1500000, requestDate: '2026-08-17' } },
  ]);

  const columns: BGridColumn<PaymentItem>[] = [
    { key: 'id', label: 'Request ID', width: 100, align: 'center' },
    { key: 'applicant', label: 'Applicant', width: 100, align: 'center' },
    { key: 'department', label: 'Department', width: 130 },
    { key: 'purpose', label: 'Purpose', width: 220 },
    {
      key: 'amount',
      label: 'Amount',
      width: 130,
      align: 'right',
      itemRender: ({ values }) => <strong>${values.amount.toLocaleString()}</strong>,
    },
    { key: 'requestDate', label: 'Requested On', width: 120, align: 'center' },
  ];

  // Batch approval handler
  const handleApproveBatch = () => {
    if (checkedKeys.length === 0) {
      alert('Please select one or more items to approve.');
      return;
    }

    const selectedItems = data.filter(d => checkedKeys.includes(d.values.id));
    const totalAmount = selectedItems.reduce((sum, item) => sum + item.values.amount, 0);

    const confirmed = confirm(
      `Approve ${selectedItems.length} selected requests totaling $${totalAmount.toLocaleString()}?`
    );

    if (confirmed) {
      // Remove approved requests from the list
      setData(prev => prev.filter(d => !checkedKeys.includes(d.values.id)));
      setCheckedKeys([]);
      alert('The selected requests were approved.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          Selected: <strong>{checkedKeys.length}</strong> / {data.length}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setCheckedKeys(data.map(d => d.values.id))}
            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: 4, cursor: 'pointer' }}
          >
            Select All
          </button>
          <button
            onClick={() => setCheckedKeys([])}
            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: 4, cursor: 'pointer' }}
          >
            Clear Selection
          </button>
          <button
            onClick={handleApproveBatch}
            style={{ padding: '6px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}
          >
            Approve Selected ({checkedKeys.length})
          </button>
        </div>
      </div>

      <BGrid<PaymentItem>
        width={780}
        height={300}
        columns={columns}
        data={data}
        rowKey="id"
        rowChecked={{
          checkedIndexes: [], // Or use checkedRowKeys
          checkedRowKeys: checkedKeys,
          onChange: (checkedIndexes, checkedRowKeys, checkedAll) => {
            console.log('Selection changed:', { checkedIndexes, checkedRowKeys, checkedAll });
            setCheckedKeys(checkedRowKeys);
          },
        }}
        showLineNumber={true}
      />
    </div>
  );
}
```

---

## 3. `rowChecked` option reference

Pass an object to the `rowChecked` prop to add dedicated selection controls—checkboxes or radio buttons—to the header and the left side of each row.

```tsx
interface BGridRowChecked<T> {
  // Use a single-selection radio UI when true
  isRadio?: boolean;

  // Index-based selection (for uncontrolled or index-controlled state)
  checkedIndexes?: number[];

  // Key-based selection (recommended for controlled state)
  checkedRowKeys?: React.Key[];

  // Called when the selection changes
  onChange: (
    checkedIndexes: number[],
    checkedRowKeys: React.Key[],
    checkedAll: boolean | 'indeterminate'
  ) => void;
}
```

---

## 4. Practical tips and gotchas

> [!TIP]
> **1. Prefer keys (`checkedRowKeys`) to indexes (`checkedIndexes`)**:
> Row indexes (`0`, `1`, `2`, and so on) change whenever the user sorts a column or applies a filter. Use `rowKey="id"` with `checkedRowKeys` to preserve the exact selected records when sorting or filtering changes.

> [!NOTE]
> **2. Using single-selection radio buttons (`isRadio: true`)**:
> Set `rowChecked={{ isRadio: true, checkedRowKeys: [selectedId], onChange: (_, keys) => setSelectedId(keys[0]) }}` to switch the selection UI to radio buttons.
