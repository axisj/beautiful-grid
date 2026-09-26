---
title: "Mantine 에디터 플러그인 (Mantine Editor Plugins)"
description: "@beautifuljs/grid-mantine으로 Mantine Select, DatePicker, ColorPicker, TimePicker를 BeautifulGrid 컬럼에 연결합니다."
category: "interaction"
order: 7
locale: "ko"
canonicalPath: "/plugins/mantine"
demoId: "editor-plugins-mantine"
features: ["editor-plugin", "mantine", "portal", "date-picker", "color-picker", "time-picker"]
relatedGuides: ["editor-plugins", "editor-plugins-antd", "editor-plugins-shadcn", "editor-plugins-mui", "built-in-editors"]
relatedApi: ["/api/props#columns", "/api/props#editable"]
lastReviewedAt: "2026-09-24"
indexable: true
draft: false
---

`@beautifuljs/grid-mantine`은 Mantine 컴포넌트를 BeautifulGrid plugin editor 수명주기에 연결하는 공식 패키지입니다. Select, DatePicker, ColorPicker, TimePicker를 제공하며 각 dropdown과 popover를 Grid 전용 portal에 렌더링합니다.

## 설치

```sh
npm install @beautifuljs/grid-mantine @mantine/core @mantine/dates dayjs
```

Mantine의 기본 스타일과 plugin 스타일을 애플리케이션 진입점에서 한 번 불러오고, 앱 최상위에 `MantineProvider`를 둡니다.

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

## Editor factory 연결

```tsx
import {
  createMantineColorPickerEditorPlugin,
  createMantineDatePickerEditorPlugin,
  createMantineSelectEditorPlugin,
  createMantineTimePickerEditorPlugin,
} from '@beautifuljs/grid-mantine';

const statusEditor = createMantineSelectEditorPlugin<Order, Order['status']>({
  id: 'order-status',
  ariaLabel: '주문 상태 선택',
  searchable: true,
  options: [
    { value: 'ready', label: '접수' },
    { value: 'done', label: '완료' },
  ],
});

const dateEditor = createMantineDatePickerEditorPlugin<Order>({
  id: 'order-date',
  ariaLabel: '납기일 선택',
});

const colorEditor = createMantineColorPickerEditorPlugin<Order>({
  id: 'order-color',
  ariaLabel: '라벨 색상 선택',
  colors: ['#228BE6', '#12B886', '#FD7E14'],
});

const timeEditor = createMantineTimePickerEditorPlugin<Order>({
  id: 'order-time',
  ariaLabel: '배송 시간 선택',
  minuteStep: 5,
});
```

```tsx
const columns: BGridColumn<Order>[] = [
  { key: 'status', label: '상태', editable: true, editor: statusEditor },
  { key: 'deliveryDate', label: '납기일', editable: true, editor: dateEditor },
  { key: 'labelColor', label: '색상', editable: true, editor: colorEditor },
  { key: 'deliveryTime', label: '시간', editable: true, editor: timeEditor },
];
```

## 지원 범위와 값 형식

- Select는 문자열·숫자 option과 검색 모드를 지원합니다.
- DatePicker는 ISO 형태의 `YYYY-MM-DD` 문자열을 저장합니다.
- ColorPicker는 기본적으로 `#RRGGBB`를 저장하며 alpha 사용 여부를 설정할 수 있습니다.
- TimePicker는 `HH:mm` 또는 seconds 옵션을 켠 `HH:mm:ss` 문자열을 저장합니다.
- Cascader와 TreeSelect는 Mantine 공식 통합 범위에 포함되지 않습니다.

popup이 닫힐 때 아직 저장하지 않았다면 편집을 취소하고, Apply 또는 값 선택으로 저장한 경우 뒤이어 발생하는 close 이벤트가 결과를 덮어쓰지 않습니다.

패키지 API와 라이선스 정보는 [@beautifuljs/grid-mantine npm 페이지](https://www.npmjs.com/package/@beautifuljs/grid-mantine)에서 확인할 수 있습니다.
