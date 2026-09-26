---
title: "에디터 플러그인 개요 (Editor Plugins Overview)"
description: "Ant Design, Shadcn UI, MUI, Mantine 공식 플러그인을 비교하고 프로젝트에 맞는 설치·사용 가이드로 이동합니다."
category: "interaction"
order: 3
locale: "ko"
canonicalPath: "/plugins"
features: ["editor-plugin", "defineEditorPlugin", "custom-plugin", "antd", "shadcn-ui", "mui", "mantine", "portal"]
relatedGuides: ["editor-plugins-custom", "built-in-editors", "editor-plugins-antd", "editor-plugins-shadcn", "editor-plugins-mui", "editor-plugins-mantine"]
relatedApi: ["/api/props#columns", "/api/props#editable"]
lastReviewedAt: "2026-09-26"
indexable: true
draft: false
---

BeautifulGrid 공식 에디터 플러그인은 외부 UI 라이브러리의 입력 컴포넌트를 Grid의 편집 수명주기와 연결합니다. 각 플러그인은 popup을 `getPortalContainer()`에 렌더링하고, 선택 결과를 `commit(changes[])`로 저장하며, 취소와 포커스 복원을 일관되게 처리합니다.

text·기본 Select·Date·checkbox만 필요하다면 번들 의존성이 없는 [내장·기본 제공 에디터](/learn/built-in-editors)를 먼저 사용하세요. 사내 고유 디자인 시스템이나 비동기 검색 등 특수한 입력 UI가 필요하다면 [플러그인 제작 가이드](/plugins/custom)를 참고하여 직접 제작할 수 있습니다.

## 플러그인 선택

| 통합 | 배포 방식 | 지원 에디터 | 상세 가이드 |
| --- | --- | --- | --- |
| 커스텀 플러그인 | `defineEditorPlugin()` 직접 구현 | 사내 디자인 시스템, 비동기 자동완성, 모달 검색 등 모든 UI | [플러그인 제작 가이드](/plugins/custom) |
| Ant Design | `@beautifuljs/grid-antd` npm 패키지 | Select, DatePicker, ColorPicker, Cascader, TimePicker, TreeSelect | [Ant Design 플러그인](/plugins/antd) |
| Shadcn UI | 공식 Registry 소스 설치 | Select, DatePicker, ColorPicker, Cascader, TimePicker, TreeSelect | [Shadcn UI 플러그인](/plugins/shadcn) |
| MUI | `@beautifuljs/grid-mui` npm 패키지 | Select, DatePicker, ColorPicker, TimePicker | [MUI 플러그인](/plugins/mui) |
| Mantine | `@beautifuljs/grid-mantine` npm 패키지 | Select, DatePicker, ColorPicker, TimePicker | [Mantine 플러그인](/plugins/mantine) |

MUI와 Mantine 통합은 각 라이브러리에 직접 대응하는 Cascader·TreeSelect가 없어 두 에디터를 지원 범위에서 제외합니다. 계층 선택이 필요하다면 Ant Design·Shadcn UI 통합을 사용하거나 [플러그인 제작 가이드](/plugins/custom)에 따라 앱 전용 plugin을 정의하세요.

## 공통 사용 흐름

1. BeautifulGrid와 선택한 UI 라이브러리, 공식 플러그인을 설치합니다.
2. 애플리케이션 진입점에서 UI 라이브러리와 플러그인 스타일을 한 번 불러옵니다.
3. 필요한 `create...EditorPlugin()` factory로 editor 설정을 만듭니다.
4. `editable: true`인 컬럼의 `editor`에 설정을 연결합니다.

```tsx
const statusEditor = createLibrarySelectEditorPlugin<Order, Order['status']>({
  id: 'order-status',
  ariaLabel: '주문 상태 선택',
  options: statusOptions,
});

const columns: BGridColumn<Order>[] = [
  { key: 'status', label: '상태', editable: true, editor: statusEditor },
];
```

factory 이름과 Provider·스타일 요구사항은 라이브러리마다 다릅니다. 위 표에서 프로젝트의 UI 라이브러리를 선택하면 설치 명령, Provider 구성, 실제 편집 가능한 예제와 지원 범위를 확인할 수 있습니다.

## 직접 만든 입력 컴포넌트: 플러그인 제작 가이드

공식 목록에 없는 사내 디자인 시스템 컴포넌트나 비동기 자동완성, 모달 팝업 검색창 등은 `defineEditorPlugin()`으로 손쉽게 플러그인화하여 Grid에 연결할 수 있습니다.

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

### 플러그인 구현 시 3대 핵심 규칙

- **포털 컨테이너 필수**: 팝업이나 드롭다운은 반드시 `getPortalContainer()` 반환 요소 내에 렌더링해야 Grid 스크롤과 동기화되고 외부 클릭 판정이 정확하게 동작합니다.
- **단일 터미널 호출**: 편집 완료 시 `commit()`, 취소 시 `cancel()` 중 정확히 하나만 호출하고 중복 호출을 방지합니다.
- **클립보드 지원**: 복사 시 `getClipboardText`, 다중 셀 붙여넣기 시 `parseClipboardText`를 정의하여 텍스트 데이터의 변환 및 유효성 검사를 처리합니다.

더 자세한 단계별 제작 방법과 비동기 검색, 모달 팝업 검색 및 다중 컬럼 동시 커밋 예제는 **[에디터 플러그인 제작 가이드](/plugins/custom)** 페이지에서 확인하세요.
