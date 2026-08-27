---
title: "Editing Events and Transactions"
description: "Understand the editing event flow from an editor request through onChangeValue validation and normalization, multi-column commits, and onChangeData notifications."
category: "interaction"
order: 6
locale: "en"
canonicalPath: "/en/learn/editing-events"
demoId: "editing-events"
features: ["onChangeValue", "commit", "onChangeData", "transaction", "validation"]
relatedGuides: ["editing", "editor-plugins", "lookup-editor", "editing-merged-cells"]
relatedApi: ["/en/api/props#onchangedata", "/en/api/props#columns"]
lastReviewedAt: "2026-08-21"
indexable: true
draft: false
---

Text editors, checkbox editors, Select editors, external plugins, and lookup icons all use the same change transaction. Instead of implementing separate save logic for every editor, perform validation and related-cell updates once in the initiating column's `onChangeValue` hook.

## Event flow

```text
text / checkbox / plugin / editorIcon
        ↓
 requestCommit(changes)
        ↓
 column.onChangeValue
        ↓
   commit(changes)
        ↓
 data update → onChangeData → move and end session
```

If `onChangeValue` is not defined, the proposed changes are saved automatically. If you define the hook, it must finish by calling either `commit()` or `cancel()`.

## Update related cells in the same transaction

```tsx
{
  key: 'quantity',
  editor: { type: 'text', parseValue: Number },
  onChangeValue: async ({ changes, nextValues, commit }) => {
    if (nextValues.quantity < 0) {
      throw new Error('Quantity must be at least 0.');
    }

    await commit([
      ...changes,
      {
        key: 'amount',
        value: nextValues.quantity * nextValues.unitPrice,
      },
    ]);
  },
}
```

- `changes`: changes proposed by the editor or icon
- `values`: canonical row values before the change
- `nextValues`: immutable preview with only the proposed changes applied
- `rows`: every row targeted by merge propagation, with each row's `nextValues`
- `commit`: saves the final list without calling `onChangeValue` again
- `cancel`: discards the proposal

If the same target appears more than once, the last value wins. For nested data, specify the key as a path array such as `{ key: ['customer', 'code'], value }`.

## Completion notification

```tsx
onChangeData={(sourceIndex, columnIndex, values, column, meta) => {
  // columnIndex and column are null when multiple columns change.
  console.log(meta?.source, meta?.changes);
  console.log(meta?.dataItem.status, meta?.dataItem.editedColumnIds, meta?.dataItem.changedKeys);
  console.log(meta?.transaction.sourceIndexes);
}}
```

`onChangeData` is called once for every row whose data is actually changed by the transaction. The existing four-argument callback remains supported; read the fifth `meta` argument only when you need multi-change or merged-range details. Along with the changed values, `meta.dataItem` includes the row `status`, the `editedColumnIds` of directly edited columns, and the `changedKeys` of changed data fields.

When using controlled `data`, save `meta.dataItem` rather than copying only `values` into a new object. This preserves the changed-cell indicators on the next render.

```tsx
onChangeData={(sourceIndex, _columnIndex, values, _column, meta) => {
  setData(current =>
    current.map((item, index) =>
      index === sourceIndex ? meta?.dataItem ?? { ...item, values } : item,
    ),
  );
}}
```

Directly edited cells receive `bgrid-cell-edited`, while every cell that shares a changed data key receives `bgrid-cell-value-changed`. Customize these states with the `--bgrid-cell-edited-*` and `--bgrid-cell-value-changed-*` CSS variables, respectively.

## Failure and asynchronous behavior

If a target column is missing or ambiguous, or if `parseValue` or `onChangeValue` validation fails, the entire change is canceled without a partial save. If the commit Promise rejects, text and plugin editors keep the current session open. When `commit` and `cancel` race within the same session, only the first final action to complete takes effect.
