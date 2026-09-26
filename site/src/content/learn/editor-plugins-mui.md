---
title: "MUI 에디터 플러그인 (MUI Editor Plugins)"
description: "@beautifuljs/grid-mui로 MUI Select, DatePicker, ColorPicker, TimePicker를 BeautifulGrid 컬럼에 연결합니다."
category: "interaction"
order: 6
locale: "ko"
canonicalPath: "/plugins/mui"
demoId: "editor-plugins-mui"
features: ["editor-plugin", "mui", "material-ui", "portal", "date-picker", "time-picker"]
relatedGuides: ["editor-plugins", "editor-plugins-antd", "editor-plugins-shadcn", "editor-plugins-mantine", "built-in-editors"]
relatedApi: ["/api/props#columns", "/api/props#editable"]
lastReviewedAt: "2026-09-24"
indexable: true
draft: false
---

`@beautifuljs/grid-mui`는 MUI 컴포넌트를 BeautifulGrid plugin editor 수명주기에 연결하는 공식 패키지입니다. Select, DatePicker, ColorPicker, TimePicker를 제공하며 popup은 Grid 전용 portal에 렌더링됩니다.

## 설치

```sh
npm install @beautifuljs/grid-mui @mui/material @mui/x-date-pickers @emotion/react @emotion/styled dayjs
```

애플리케이션 진입점에서 BeautifulGrid와 plugin 스타일을 한 번 불러옵니다. 앱에 기존 MUI 테마가 있다면 그 `ThemeProvider`를 그대로 사용하세요.

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

## Editor factory 연결

```tsx
import {
  createMuiColorPickerEditorPlugin,
  createMuiDatePickerEditorPlugin,
  createMuiSelectEditorPlugin,
  createMuiTimePickerEditorPlugin,
} from '@beautifuljs/grid-mui';

const statusEditor = createMuiSelectEditorPlugin<Order, Order['status']>({
  id: 'order-status',
  ariaLabel: '주문 상태 선택',
  options: [
    { value: 'ready', label: '접수' },
    { value: 'done', label: '완료' },
  ],
});

const dateEditor = createMuiDatePickerEditorPlugin<Order>({
  id: 'order-date',
  ariaLabel: '납기일 선택',
  format: 'YYYY-MM-DD',
});

const colorEditor = createMuiColorPickerEditorPlugin<Order>({
  id: 'order-color',
  ariaLabel: '라벨 색상 선택',
  colors: ['#1976D2', '#00897B', '#ED6C02'],
});

const timeEditor = createMuiTimePickerEditorPlugin<Order>({
  id: 'order-time',
  ariaLabel: '배송 시간 선택',
  minuteStep: 5,
});
```

생성된 설정을 editable 컬럼에 지정합니다.

```tsx
const columns: BGridColumn<Order>[] = [
  { key: 'status', label: '상태', editable: true, editor: statusEditor },
  { key: 'deliveryDate', label: '납기일', editable: true, editor: dateEditor },
  { key: 'labelColor', label: '색상', editable: true, editor: colorEditor },
  { key: 'deliveryTime', label: '시간', editable: true, editor: timeEditor },
];
```

## 지원 범위와 값 형식

- Select는 `string | number` option 값을 그대로 저장합니다.
- DatePicker는 기본적으로 `YYYY-MM-DD` 문자열을 저장하며 `format`으로 변경할 수 있습니다.
- ColorPicker는 `#RRGGBB`를 대문자로 정규화하고 Apply 시점에 저장합니다.
- TimePicker는 기본적으로 `HH:mm` 문자열을 저장하고 확인 동작 후 편집을 종료합니다.
- Cascader와 TreeSelect는 MUI 공식 통합 범위에 포함되지 않습니다.

각 popup은 `getPortalContainer()`에 연결되어 Grid의 바깥 클릭 판정과 스크롤 경계를 공유합니다. 사용자는 Escape로 원래 값을 유지한 채 취소할 수 있고, 저장 또는 취소 후 포커스는 활성 셀로 복원됩니다.

패키지 API와 라이선스 정보는 [@beautifuljs/grid-mui npm 페이지](https://www.npmjs.com/package/@beautifuljs/grid-mui)에서 확인할 수 있습니다.
