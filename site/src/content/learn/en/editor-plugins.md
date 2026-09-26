---
title: "Editor Plugins Overview"
description: "Compare the official Ant Design, Shadcn UI, MUI, and Mantine integrations and open the installation and usage guide that matches your project."
category: "interaction"
order: 3
locale: "en"
canonicalPath: "/en/plugins"
features: ["editor-plugin", "defineEditorPlugin", "custom-plugin", "antd", "shadcn-ui", "mui", "mantine", "portal"]
relatedGuides: ["editor-plugins-custom", "built-in-editors", "editor-plugins-antd", "editor-plugins-shadcn", "editor-plugins-mui", "editor-plugins-mantine"]
relatedApi: ["/api/props#columns", "/api/props#editable"]
lastReviewedAt: "2026-09-26"
indexable: true
draft: false
---

BeautifulGrid's official editor plugins connect input components from external UI libraries to the Grid editing lifecycle. Each integration renders popups through `getPortalContainer()`, saves selections through `commit(changes[])`, and handles cancellation and focus restoration consistently.

If text, basic Select, Date, and checkbox editors are enough, start with [Built-in Editors](/en/learn/built-in-editors) and avoid adding another UI dependency. When internal design systems or custom asynchronous inputs are required, author custom plugins directly by following the [Custom Plugin Guide](/en/plugins/custom).

## Choose an integration

| Integration | Distribution | Supported editors | Guide |
| --- | --- | --- | --- |
| Custom Plugins | Built with `defineEditorPlugin()` | In-house design systems, async autocomplete, modal lookups, any custom UI | [Custom Plugin Guide](/en/plugins/custom) |
| Ant Design | `@beautifuljs/grid-antd` npm package | Select, DatePicker, ColorPicker, Cascader, TimePicker, TreeSelect | [Ant Design plugin](/en/plugins/antd) |
| Shadcn UI | Official Registry source | Select, DatePicker, ColorPicker, Cascader, TimePicker, TreeSelect | [Shadcn UI plugin](/en/plugins/shadcn) |
| MUI | `@beautifuljs/grid-mui` npm package | Select, DatePicker, ColorPicker, TimePicker | [MUI plugin](/en/plugins/mui) |
| Mantine | `@beautifuljs/grid-mantine` npm package | Select, DatePicker, ColorPicker, TimePicker | [Mantine plugin](/en/plugins/mantine) |

MUI and Mantine do not provide direct equivalents for Cascader and TreeSelect, so those editor families are intentionally outside their integration scope. Use the Ant Design or Shadcn UI integration, or follow the [Custom Plugin Guide](/en/plugins/custom) to author an application-specific plugin when needed.

## Shared setup flow

1. Install BeautifulGrid, your UI library, and the corresponding official plugin.
2. Import the UI library and plugin styles once from the application entry point.
3. Create editor configurations with the required `create...EditorPlugin()` factories.
4. Assign each configuration to an `editable: true` column's `editor`.

```tsx
const statusEditor = createLibrarySelectEditorPlugin<Order, Order['status']>({
  id: 'order-status',
  ariaLabel: 'Select order status',
  options: statusOptions,
});

const columns: BGridColumn<Order>[] = [
  { key: 'status', label: 'Status', editable: true, editor: statusEditor },
];
```

Factory names and Provider and stylesheet requirements vary by library. Open the matching guide above for exact installation commands, Provider setup, a runnable editing example, and the supported editor scope.

## Application-specific inputs: Custom Plugin Guide

Connect internal design system components, asynchronous remote autocompletes, or modal search dialogs with `defineEditorPlugin()`.

```tsx
import { defineEditorPlugin } from 'beautiful-grid/editors';
import type { BGridEditorPluginProps } from 'beautiful-grid';

function InHouseStatusEditor({
  value,
  column,
  commit,
  cancel,
  getPortalContainer,
}: BGridEditorPluginProps<Order>) {
  return (
    <MyDesignSystemSelect
      autoFocus
      defaultValue={value}
      portalContainer={getPortalContainer()}
      onChange={next => void commit([{ key: column.key, value: next }])}
      onKeyDown={e => {
        if (e.key === 'Escape') cancel();
      }}
    />
  );
}

export const inHouseStatusPlugin = defineEditorPlugin<Order>({
  id: 'inhouse-order-status',
  component: InHouseStatusEditor,
  getClipboardText: ({ value }) => String(value ?? ''),
  parseClipboardText: text => text.trim(),
});
```

### Three Core Rules for Custom Plugins

- **Always use `getPortalContainer()`**: Render dropdowns and popups in the container returned by `getPortalContainer()` to synchronize with Grid virtual scrolling and click-outside listeners.
- **Single terminal action**: Call either `commit()` or `cancel()` exactly once, and guard against duplicate calls during unmount.
- **Clipboard support**: Provide `getClipboardText` and `parseClipboardText` to handle copying and multi-cell paste validation cleanly.

For a complete step-by-step walkthrough, debounce search examples, and multi-column atomic commits, see the **[Custom Plugin Guide](/en/plugins/custom)**.
