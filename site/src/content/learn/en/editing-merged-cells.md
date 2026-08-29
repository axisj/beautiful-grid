---
title: "Merged Cell Editing"
description: "Learn how editing works for merged cells in normal layouts and across frozen row and column boundaries, including atomic updates to every underlying row."
category: "interaction"
order: 8
locale: "en"
canonicalPath: "/en/learn/editing-merged-cells"
demoId: "editing-merged-cells"
features: ["cell-merge", "editing", "virtual-scroll", "frozen-row", "frozen-column", "atomic-commit"]
relatedGuides: ["editing-events", "cell-merge", "frozen-columns"]
relatedApi: ["/en/api/props#cellmergeoptions", "/en/api/props#frozenrowcount", "/en/api/props#frozencolumnindex"]
lastReviewedAt: "2026-08-29"
indexable: true
draft: false
---

Editing a merged cell applies the same change to every underlying row in the merge group, not just the anchor row visible on screen. Editor and icon callbacks do not need to calculate the merge range themselves. The live example uses 24 rows so you can verify that the range remains intact while scrolling vertically. It starts with ordinary merged editing and no frozen rows or columns.

## Editing merged cells without frozen panes

The merged-cell edit transaction works the same when both `frozenRowCount` and `frozenColumnIndex` are `0`. In the live example, set both frozen-pane controls to **0** for the **Standard merge** state. Editing a customer name then updates all 3 underlying rows with the same `mergeBy` value.

```tsx
<BGrid<Order>
  editable
  cellMergeOptions={{
    columnsMap: {
      1: { mergeBy: 'customerGroup' },
    },
  }}
/>
```

In the live example, **Frozen columns on the left** controls how many columns remain visible while scrolling horizontally. Select **1** to freeze only the order code, or **2** to freeze both the order code and the editable merged customer-name column. **Frozen rows at the top** controls how many underlying data rows remain visible while scrolling vertically. Selecting **1** or **2** splits the first 3-row merged cell between the frozen and scrollable regions; selecting **3** freezes the entire first merge group. Editing any fragment updates all 3 underlying rows in that group. See [Frozen Rows and Columns](/en/learn/frozen-columns) for the basic frozen-pane behavior.

## Logical cells and DOM fragments

A frozen-row boundary or frozen-column layer can split one merged cell into multiple `td` elements. With `frozenRowCount=1`, for example, a 3-row merge group renders as a 1-row cell in the frozen region and a merged 2-row cell in the scrollable region. These fragments are separate rendering units but behave as one logical cell during interaction.

- Clicking any fragment activates the same canonical anchor.
- `itemRender`, editor, and `editorIcon` callbacks receive the canonical row's `index`, `item`, `values`, and `value`.
- The editor mounts only in the fragment the user interacted with.
- After commit, every row in the merge group and every rendered fragment updates together.

## Transaction scope

When an edit session starts, the Grid snapshots the full contiguous range of matching `mergeBy` values in the visible data. The range is not limited to the rows currently rendered by virtual scrolling.

```tsx
onChangeValue: async ({ changes, rows, commit }) => {
  console.log(rows.map(row => row.sourceIndex));
  await commit(changes);
}
```

Only the merge rule of the originating column determines the row range. Adding another merged column to the change list does not expand the range transitively, and changing the merge key itself does not cause the range to be recalculated during the save. If any target row is invalid, the entire transaction is canceled.

## Copying and pasting merged cells

A merged-cell selection spans several backing rows for layout purposes, but copy treats it as one logical cell. Copying only that cell writes the canonical anchor's `getClipboardText` result once. If the selection also includes ordinary neighboring cells, continuation rows contain an empty TSV slot for the merged column so every other row and column stays aligned.

Paste is atomic at the merge-group level. Pasting one clipboard value runs `parseClipboardText` once and assigns that same result to every backing row. This prevents arrays or objects used as `mergeBy` values from splitting because each row received a different parsed instance. If several clipboard rows map to the same merged target, identical strings collapse to one value. Any conflict reports `mergedCellConflict` through `onPasteError` and leaves the entire logical cell unchanged.

For display-only merge configuration, see [Cell Merging](/en/learn/cell-merge). For frozen layout settings, see [Frozen Rows and Columns](/en/learn/frozen-columns).

> [!TIP]
> **Frozen columns and merged cells on mobile**:
> Increasing the number of frozen columns on mobile screens reduces the visible editable area. Set `frozenColumnIndex` to 1 or 0 based on screen width to ensure sufficient editing space on narrow devices.
