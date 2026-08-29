---
title: "External Editor Plugins (AntD)"
description: "Connect Ant Design or application-specific inputs as editor plugins and manage popup portals, multi-value commits, and the editor lifecycle."
category: "interaction"
order: 3
locale: "en"
canonicalPath: "/en/learn/editor-plugins"
demoId: "editor-plugins"
features: ["editor-plugin", "defineEditorPlugin", "portal", "commit", "lifecycle"]
relatedGuides: ["built-in-editors", "editor-plugins-shadcn", "editor-icons", "lookup-editor", "editing-events"]
relatedApi: ["/en/api/props#columns", "/en/api/props#editable"]
lastReviewedAt: "2026-08-29"
indexable: true
draft: false
---

Connect UI components already used by your application—such as Ant Design Select, DatePicker, ColorPicker, Cascader, TimePicker, and TreeSelect, or an asynchronous autocomplete—with `defineEditorPlugin()`. If you only need text, basic Select, or Date editing, start with [Built-in Editors](/en/learn/built-in-editors).

## Plugin definition

```tsx
function PriorityEditor({
  value,
  column,
  commit,
  cancel,
  getPortalContainer,
}: BGridEditorPluginProps<Task>) {
  return (
    <Select
      autoFocus
      open
      defaultValue={value as Task['priority']}
      getPopupContainer={getPortalContainer}
      options={priorityOptions}
      onChange={nextValue =>
        void commit([{ key: column.key, value: nextValue }])
      }
      onKeyDown={event => {
        if (event.key === 'Escape') cancel();
      }}
    />
  );
}

const priorityEditor = defineEditorPlugin<Task>({
  id: 'task-priority',
  component: PriorityEditor,
});
```

Pass even a single value to `commit` as a change array of length `1`. A cell value can itself be an array, so the API deliberately avoids an ambiguous `commit(value)` form.

## Connect DatePicker and ColorPicker

Convert dates to your application's storage format before committing them. For example, if you store a `dayjs` value as a `YYYY-MM-DD` string, connect the picker as follows.

```tsx
<DatePicker
  autoFocus
  open
  defaultValue={value ? dayjs(String(value)) : null}
  getPopupContainer={getPortalContainer}
  onChange={date =>
    void commit([{
      key: column.key,
      value: date ? date.format('YYYY-MM-DD') : '',
    }])
  }
  onOpenChange={open => {
    if (!open) cancel();
  }}
/>
```

With ColorPicker, use `onChange` only to preview the value while dragging, then save the final color from `onChangeComplete` when the interaction ends.

```tsx
<ColorPicker
  open
  defaultValue={String(value)}
  disabledAlpha
  getPopupContainer={getPortalContainer}
  onChange={(_color, css) => setPreviewColor(css)}
  onChangeComplete={color =>
    void commit([{
      key: column.key,
      value: color.toHexString().toUpperCase(),
    }])
  }
/>
```

## Connect Cascader, TimePicker, and TreeSelect

Cascader commits the entire selected path as `string[]`, not just the last item. TimePicker uses `needConfirm` so editing does not end while the user is choosing an hour and minute; convert the value to your application's storage format in `onOk`. TreeSelect stores the selected node's `value` directly.

```tsx
<Cascader
  open
  defaultValue={value as string[]}
  options={categoryOptions}
  getPopupContainer={getPortalContainer}
  onChange={path =>
    void commit([{
      key: column.key,
      value: Array.from(path, String),
    }])
  }
/>

<TimePicker
  open
  needConfirm
  defaultValue={dayjs(String(value), 'HH:mm')}
  format='HH:mm'
  getPopupContainer={getPortalContainer}
  onOk={time =>
    void commit([{
      key: column.key,
      value: time ? time.format('HH:mm') : '',
    }])
  }
/>

<TreeSelect
  open
  defaultValue={String(value)}
  treeData={organizationTree}
  getPopupContainer={getPortalContainer}
  onChange={nodeValue =>
    void commit([{
      key: column.key,
      value: nodeValue,
    }])
  }
/>
```

All six adapters in the live example inherit the cell's `font`, `color`, and height. If an external UI library specifies its own font size, apply `font: inherit` to the editor root and selected-value element. Also pass `--bgrid-font-family` and `--bgrid-font-size` to the popup so the cell remains visually consistent before and after activation.

## Convert values for copy and paste

The clipboard carries tab- and newline-delimited `text/plain`, not the editor's React value. Neither the cell's `itemRender` nor the editor's `defaultValue` participates in clipboard conversion. A non-string cell such as a Cascader that stores `string[]` must therefore define both directions of the column's clipboard contract.

```tsx
const categoryColumn: BGridColumn<Order> = {
  key: 'categoryPath',
  label: 'Category',
  width: 200,
  editable: true,
  editor: categoryEditor,
  itemRender: ({ value }) => (
    <>{Array.isArray(value) ? value.join(' / ') : ''}</>
  ),
  getClipboardText: ({ value }) => JSON.stringify(value),
  parseClipboardText: text => {
    const parsed: unknown = JSON.parse(text);
    if (!Array.isArray(parsed) || !parsed.every(segment => typeof segment === 'string')) {
      throw new TypeError('Category path must be a JSON string array.');
    }
    return parsed;
  },
};
```

The example formats the cell as `Domestic / Seoul` but copies a lossless `["Domestic","Seoul"]`. Paste restores a `string[]`, so Ant Design Cascader receives the same path through `defaultValue`. If you prefer a human-readable path such as `Domestic / Seoul` on the clipboard, define escaping and validation for path values that may themselves contain `/`.

Conversion follows this order:

1. Copy uses the column's `getClipboardText`. Without it, strings remain unchanged, numbers and booleans become strings, `Date` becomes an ISO string, and arrays or objects are JSON-serialized.
2. Paste first uses the column's `parseClipboardText`. It applies to every editable column, regardless of whether the editor is text, checkbox, or plugin based.
3. If the column has no parser and its built-in text editor defines `parseValue`, the Grid uses that existing parser.
4. Without either parser, the Grid stores the clipboard string as-is. A structured value can then become a string and disappear from the editor's selected-value display.

Validate each domain explicitly: finite numbers with `Number.isFinite(Number(text))`, booleans through an allowed token map (`true`/`false` or `Y`/`N`), dates in the application's storage format, and enums against the option list. JSON plus shape validation is recommended for arrays and objects. If the parser throws, that cell remains unchanged and `cellSelectionOptions.onPasteError` receives `parseValueFailed`. The second `parseClipboardText` argument exposes the current `value`, row `values`, `item`, `index`, `columnIndex`, `column`, and original `text`.

## Save multiple columns at once

When an autocomplete resolves both a code and a name, send both changes in one request.

```tsx
await commit([
  { key: 'customerCode', value: selected.code },
  { key: 'customerName', value: selected.name },
]);
```

If a target `key` or `columnId` is missing or ambiguous, the entire commit is rejected without a partial save.

## Plugin props

- `value`, `item`, `values`, `column`, `index`, `columnIndex`: context for the current logical cell
- `commit(changes, options?)`: save the change list and end the session
- `cancel()`: keep the original value and end the session
- `move(direction)`: move to the specified cell without saving
- `sessionId`: identifies the session associated with an asynchronous callback
- `getPortalContainer()`: returns the Grid-specific floating portal root for popup UI

## Popup and session-ending rules

Rendering a popup directly in the UI library's default `document.body` portal can make the Grid treat popup interaction as an outside click. Rendering it inside the Grid DOM can instead clip a large picker at the container's `overflow: hidden` boundary. `getPortalContainer()` returns a Grid-tracked floating portal directly under `document.body`, so connect it whenever the external component supports a custom portal. This portal copies the Grid theme variables and participates in frozen/scroll position calculations and outside-click detection.

Use only one of `commit`, `cancel`, or `move` as the final action for a session. The library honors only the first completion request, so a `cancel()` triggered by blur immediately after selection cannot overwrite a successful save. If asynchronous validation fails and the `commit()` Promise rejects, the editor remains open so the user can correct the value and try again.

```tsx
await commit(changes, { move: 'next' });
```

Do not move DOM focus manually after saving or canceling. The Grid restores focus to the active cell.
