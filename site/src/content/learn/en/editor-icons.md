---
title: "Editor Icons"
description: "Display dropdown, calendar, and search icons beside cell values and connect them to editor activation or an independent callback."
category: "interaction"
order: 4
locale: "en"
canonicalPath: "/en/learn/editor-icons"
demoId: "editor-icons"
features: ["editorIcon", "visibility", "icon-callback", "accessibility"]
relatedGuides: ["built-in-editors", "lookup-editor", "editing-events"]
relatedApi: ["/en/api/props#columns"]
lastReviewedAt: "2026-08-20"
indexable: true
draft: false
---

`editorIcon` is a visual affordance beside the cell value that remains available when the cell is not being edited. Select arrows and lookup search icons use the same configuration rather than separate APIs.

## Icon that opens the editor

If you omit `onClick`, clicking the icon starts the existing `column.editor`.

```tsx
{
  key: 'status',
  editable: true,
  editTrigger: 'click',
  editor: statusEditor,
  editorIcon: {
    render: <ChevronDownIcon />,
    ariaLabel: 'Select status',
    visibility: 'always',
  },
}
```

## Icon that runs a callback

When `onClick` is defined, the icon starts a callback session instead of the default editor. The callback receives cell context and the shared `commit`/`cancel` functions, not a DOM event.

```tsx
editorIcon: {
  render: <SearchIcon />,
  ariaLabel: ({ values }) => `Open the lookup for ${values.customerName}`,
  onClick: ({ commit, cancel }) => {
    openLookup({
      onSelect: customer => commit([
        { key: 'customerCode', value: customer.code },
        { key: 'customerName', value: customer.name },
      ]),
      onClose: cancel,
    });

    return () => closeLookup();
  },
}
```

The returned function is a cleanup function that runs once when the session ends through `commit`, `cancel`, a new interaction, or unmounting.

## Visibility conditions

| `visibility` | Behavior |
| --- | --- |
| `always` | Always visible; the default |
| `hover` | Visible while the pointer is over the cell |
| `active` | Visible while the cell is active |

The Grid does not infer an icon from the editor type. Even Select editors can require different icons and accessible names across products, so `render` is required. Put editing-independent controls such as delete or open-details buttons in `itemRender` to keep their role clear.
