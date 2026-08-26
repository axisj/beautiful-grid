---
title: "Autocomplete and Lookup"
description: "Combine autocomplete input and a lookup-modal icon in one cell, then commit values to multiple columns atomically."
category: "interaction"
order: 5
locale: "en"
canonicalPath: "/en/learn/lookup-editor"
demoId: "lookup-editor"
features: ["autocomplete", "lookup", "editorIcon", "multi-cell-commit"]
relatedGuides: ["editor-plugins", "editor-icons", "editing-events"]
relatedApi: ["/en/api/props#columns", "/en/api/props#onchangedata"]
lastReviewedAt: "2026-08-21"
indexable: true
draft: false
---

FACEDM-style customer input can provide two entry paths in a single column. The cell area opens an Ant Design `AutoComplete` plugin, while the search icon in the same cell opens an Ant Design `Modal` containing a search bar and a single-selection DataGrid.

```tsx
{
  key: 'customerName',
  editable: true,
  editTrigger: 'click',
  editor: customerAutocompleteEditor,
  editorIcon: {
    render: <SearchIcon />,
    ariaLabel: 'Open customer lookup',
    onClick: ({ commit, cancel }) => {
      const close = openCustomerLookup({
        onSelect: customer => commit([
          { key: 'customerCode', value: customer.code },
          { key: 'customerName', value: customer.name },
          { key: 'customerGrade', value: customer.grade },
        ]),
        onCancel: cancel,
      });
      return close;
    },
  },
}
```

## Responsibilities

- `editor`: Handles text input, candidate lookup, and keyboard selection.
- `editorIcon`: Opens the lookup modal and manages its lifecycle.
- `commit(changes[])`: Sends either selection path through the same save transaction.
- `onChangeValue`: Applies shared validation and normalization to values proposed by either path.

The `inputProps.autoComplete` option on the `text` editor controls the browser's native autocomplete behavior; it is not a candidate-list UI. As shown here, connecting Ant Design `AutoComplete` as a plugin editor combines cell input and candidate suggestions into one editing interface. For a real server-backed search, fetch candidates asynchronously as the user types, but save the final selection through the same `commit(changes[])` path.

## Asynchronous lookup considerations

Commits that arrive after the callback session has ended are ignored. Even so, the application should abort in-flight requests during cleanup and close the modal to prevent wasted work and visual flicker.

If saving the selected value fails, the `commit()` Promise rejects and the current icon session ends. Display the error to the user and allow them to reopen the lookup if necessary.
