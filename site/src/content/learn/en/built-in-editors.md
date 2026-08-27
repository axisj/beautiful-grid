---
title: "Built-in Editors"
description: "Configure the built-in text and checkbox editors and the provided Select and Date plugins, including header controls, value conversion, and editor icons."
category: "interaction"
order: 2
locale: "en"
canonicalPath: "/en/learn/built-in-editors"
demoId: "built-in-editors"
features: ["text-editor", "checkbox-editor", "checkbox-header", "select-editor", "date-editor", "parseValue", "formatValue"]
relatedGuides: ["editing", "editor-icons", "editor-plugins", "editing-events"]
relatedApi: ["/en/api/props#columns", "/en/api/props#editable"]
lastReviewedAt: "2026-08-27"
indexable: true
draft: false
---

Use the built-in text and checkbox editors for free-form input and boolean or permission toggles. Use the standard plugins from `beautiful-grid/editors` for selecting predefined values and dates. These plugins add no dependency on an external UI framework.

## Checkbox and bulk header control

```tsx
{
  key: 'approved',
  label: 'Approval',
  width: 150,
  align: 'center',
  editable: true,
  editor: {
    type: 'checkbox',
    header: { ariaLabel: 'Toggle all approvals' },
    ariaLabel: ({ values }) => `Approval for ${values.orderCode}`,
    label: ({ value }) => (value ? 'Allowed' : 'Blocked'),
    disabled: ({ values }) => values.locked,
  },
}
```

With `header` enabled, the header checkbox selects or clears every eligible row and reports an indeterminate state when only some rows are checked. It operates on the rows currently available to the Grid after filtering or paging. Disabled cells and removed rows are excluded from both the state calculation and the bulk update.

The default stored values are `true` and `false`. Map another domain model with options such as `trueValue: 'Y'` and `falseValue: 'N'`. Space, Enter, or F2 toggles an active checkbox cell. Cell and header changes pass through `onChangeValue`, then call `onChangeData` for each changed row with `meta.source` set to `'checkbox'`.

## Text

```tsx
{
  key: 'quantity',
  editable: true,
  editor: {
    type: 'text',
    inputProps: { inputMode: 'numeric', autoComplete: 'off' },
    formatValue: value => String(value ?? ''),
    parseValue: text => {
      const value = Number(text);
      if (!Number.isFinite(value)) throw new Error('Enter a number.');
      return value;
    },
  },
}
```

If `parseValue` throws, the Grid does not save the value. It keeps the editor open and sets `aria-invalid="true"`. With `commitOnBlur: false`, moving focus outside the editor cancels the edit instead of saving it.

## Select and Date

```tsx
const statusEditor = createSelectEditorPlugin<Order, Order['status']>({
  id: 'order-status',
  options: [
    { value: 'ready', label: 'Ready' },
    { value: 'done', label: 'Completed' },
  ],
});

const dateEditor = createDateEditorPlugin<Order>({
  id: 'delivery-date',
  min: '2026-01-01',
  max: '2026-12-31',
});
```

Create each factory result once, either outside the component or inside `useMemo`. Creating a new plugin object on every column render can remount the input component.

The standard Select opens its native option picker as soon as the editor mounts after a cell or icon click. Set `openOnMount: false` in the factory options to disable this automatic opening behavior.

The standard Date editor activates only the numeric date input when entered through the cell body. It opens the native calendar picker only when entered through `editorIcon`. An editor plugin can distinguish these entry paths through the `activation` value (`'cell' | 'editorIcon'`).

```tsx
{
  key: 'status',
  editable: true,
  editTrigger: 'click',
  editor: statusEditor,
  editorIcon: { render: <ChevronDownIcon />, ariaLabel: 'Select status' },
}
```

The Grid does not infer an icon from the editor type. Provide an icon that matches your product design system through `editorIcon.render`.
