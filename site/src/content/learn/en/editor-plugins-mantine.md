---
title: "Mantine Editor Plugins"
description: "Connect Mantine Select, DatePicker, ColorPicker, and TimePicker controls to BeautifulGrid columns with @beautifuljs/grid-mantine."
category: "interaction"
order: 7
locale: "en"
canonicalPath: "/en/plugins/mantine"
demoId: "editor-plugins-mantine"
features: ["editor-plugin", "mantine", "portal", "date-picker", "color-picker", "time-picker"]
relatedGuides: ["editor-plugins", "editor-plugins-antd", "editor-plugins-shadcn", "editor-plugins-mui", "built-in-editors"]
relatedApi: ["/en/api/props#columns", "/en/api/props#editable"]
lastReviewedAt: "2026-09-24"
indexable: true
draft: false
---

`@beautifuljs/grid-mantine` is the official package that connects Mantine components to the BeautifulGrid plugin-editor lifecycle. It provides Select, DatePicker, ColorPicker, and TimePicker and renders every dropdown and popover inside the Grid portal.

## Install

```sh
npm install @beautifuljs/grid-mantine @mantine/core @mantine/dates dayjs
```

Import Mantine's base styles and the plugin stylesheet once from the application entry point, and place `MantineProvider` above the application.

```tsx
import { MantineProvider } from '@mantine/core';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import 'beautiful-grid/style.css';
import '@beautifuljs/grid-mantine/style.css';

root.render(
  <MantineProvider>
    <App />
  </MantineProvider>,
);
```

## Connect editor factories

```tsx
import {
  createMantineColorPickerEditorPlugin,
  createMantineDatePickerEditorPlugin,
  createMantineSelectEditorPlugin,
  createMantineTimePickerEditorPlugin,
} from '@beautifuljs/grid-mantine';

const statusEditor = createMantineSelectEditorPlugin<Order, Order['status']>({
  id: 'order-status',
  ariaLabel: 'Select order status',
  searchable: true,
  options: [
    { value: 'ready', label: 'Ready' },
    { value: 'done', label: 'Done' },
  ],
});

const dateEditor = createMantineDatePickerEditorPlugin<Order>({
  id: 'order-date',
  ariaLabel: 'Select delivery date',
});

const colorEditor = createMantineColorPickerEditorPlugin<Order>({
  id: 'order-color',
  ariaLabel: 'Select label color',
  colors: ['#228BE6', '#12B886', '#FD7E14'],
});

const timeEditor = createMantineTimePickerEditorPlugin<Order>({
  id: 'order-time',
  ariaLabel: 'Select delivery time',
  minuteStep: 5,
});
```

```tsx
const columns: BGridColumn<Order>[] = [
  { key: 'status', label: 'Status', editable: true, editor: statusEditor },
  { key: 'deliveryDate', label: 'Delivery date', editable: true, editor: dateEditor },
  { key: 'labelColor', label: 'Color', editable: true, editor: colorEditor },
  { key: 'deliveryTime', label: 'Time', editable: true, editor: timeEditor },
];
```

## Supported values

- Select supports string and number options plus searchable mode.
- DatePicker stores an ISO-style `YYYY-MM-DD` string.
- ColorPicker stores `#RRGGBB` by default and can optionally enable alpha.
- TimePicker stores `HH:mm`, or `HH:mm:ss` when seconds are enabled.
- Cascader and TreeSelect are not part of the official Mantine integration scope.

Closing a popup before a value is saved cancels the editing session. After Apply or a value selection commits, the following close event cannot overwrite the saved result.

See the [@beautifuljs/grid-mantine npm page](https://www.npmjs.com/package/@beautifuljs/grid-mantine) for package APIs and license information.
