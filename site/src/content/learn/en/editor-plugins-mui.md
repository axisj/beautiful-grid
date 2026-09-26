---
title: "MUI Editor Plugins"
description: "Connect MUI Select, DatePicker, ColorPicker, and TimePicker controls to BeautifulGrid columns with @beautifuljs/grid-mui."
category: "interaction"
order: 6
locale: "en"
canonicalPath: "/en/plugins/mui"
demoId: "editor-plugins-mui"
features: ["editor-plugin", "mui", "material-ui", "portal", "date-picker", "time-picker"]
relatedGuides: ["editor-plugins", "editor-plugins-antd", "editor-plugins-shadcn", "editor-plugins-mantine", "built-in-editors"]
relatedApi: ["/en/api/props#columns", "/en/api/props#editable"]
lastReviewedAt: "2026-09-24"
indexable: true
draft: false
---

`@beautifuljs/grid-mui` is the official package that connects MUI components to the BeautifulGrid plugin-editor lifecycle. It provides Select, DatePicker, ColorPicker, and TimePicker controls and renders their popups inside the Grid portal.

## Install

```sh
npm install @beautifuljs/grid-mui @mui/material @mui/x-date-pickers @emotion/react @emotion/styled dayjs
```

Import the BeautifulGrid and plugin styles once from the application entry point. Keep using the application's existing MUI `ThemeProvider` when one is already configured.

```tsx
import { ThemeProvider } from '@mui/material/styles';
import 'beautiful-grid/style.css';
import '@beautifuljs/grid-mui/style.css';

root.render(
  <ThemeProvider theme={appTheme}>
    <App />
  </ThemeProvider>,
);
```

## Connect editor factories

```tsx
import {
  createMuiColorPickerEditorPlugin,
  createMuiDatePickerEditorPlugin,
  createMuiSelectEditorPlugin,
  createMuiTimePickerEditorPlugin,
} from '@beautifuljs/grid-mui';

const statusEditor = createMuiSelectEditorPlugin<Order, Order['status']>({
  id: 'order-status',
  ariaLabel: 'Select order status',
  options: [
    { value: 'ready', label: 'Ready' },
    { value: 'done', label: 'Done' },
  ],
});

const dateEditor = createMuiDatePickerEditorPlugin<Order>({
  id: 'order-date',
  ariaLabel: 'Select delivery date',
  format: 'YYYY-MM-DD',
});

const colorEditor = createMuiColorPickerEditorPlugin<Order>({
  id: 'order-color',
  ariaLabel: 'Select label color',
  colors: ['#1976D2', '#00897B', '#ED6C02'],
});

const timeEditor = createMuiTimePickerEditorPlugin<Order>({
  id: 'order-time',
  ariaLabel: 'Select delivery time',
  minuteStep: 5,
});
```

Assign the resulting configurations to editable columns.

```tsx
const columns: BGridColumn<Order>[] = [
  { key: 'status', label: 'Status', editable: true, editor: statusEditor },
  { key: 'deliveryDate', label: 'Delivery date', editable: true, editor: dateEditor },
  { key: 'labelColor', label: 'Color', editable: true, editor: colorEditor },
  { key: 'deliveryTime', label: 'Time', editable: true, editor: timeEditor },
];
```

## Supported values

- Select stores its `string | number` option value directly.
- DatePicker stores `YYYY-MM-DD` by default and accepts a custom `format`.
- ColorPicker normalizes `#RRGGBB` to uppercase and commits on Apply.
- TimePicker stores `HH:mm` by default and ends editing after confirmation.
- Cascader and TreeSelect are not part of the official MUI integration scope.

Every popup uses `getPortalContainer()`, sharing the Grid's outside-click handling and scroll boundaries. Escape cancels without changing the original value, and focus returns to the active cell after save or cancel.

See the [@beautifuljs/grid-mui npm page](https://www.npmjs.com/package/@beautifuljs/grid-mui) for package APIs and license information.
