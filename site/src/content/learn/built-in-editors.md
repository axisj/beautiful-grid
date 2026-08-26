---
title: "내장·기본 제공 에디터 (Built-in Editors)"
description: "내장 text와 기본 제공 Select·Date plugin의 설정, 값 변환, 아이콘 연결 방법을 설명합니다."
category: "interaction"
order: 2
locale: "ko"
canonicalPath: "/learn/built-in-editors"
demoId: "built-in-editors"
features: ["text-editor", "select-editor", "date-editor", "parseValue", "formatValue"]
relatedGuides: ["editing", "editor-icons", "editor-plugins", "editing-events"]
relatedApi: ["/api/props#columns", "/api/props#editable"]
lastReviewedAt: "2026-08-20"
indexable: true
draft: false
---

문자열 입력은 내장 text editor를, 정해진 값과 날짜 선택은 `beautiful-grid/editors`의 기본 plugin을 사용합니다. 기본 plugin은 별도 UI 프레임워크 의존성을 추가하지 않습니다.

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
      if (!Number.isFinite(value)) throw new Error('숫자를 입력하세요.');
      return value;
    },
  },
}
```

`parseValue`가 예외를 던지면 저장하지 않고 editor를 유지하며 `aria-invalid="true"`가 설정됩니다. `commitOnBlur: false`이면 외부 포커스 이동 시 저장하지 않고 취소합니다.

## Select와 Date

```tsx
const statusEditor = createSelectEditorPlugin<Order, Order['status']>({
  id: 'order-status',
  options: [
    { value: 'ready', label: '준비' },
    { value: 'done', label: '완료' },
  ],
});

const dateEditor = createDateEditorPlugin<Order>({
  id: 'delivery-date',
  min: '2026-01-01',
  max: '2026-12-31',
});
```

factory는 컴포넌트 바깥이나 `useMemo` 안에서 한 번만 생성하세요. 컬럼 렌더마다 새 plugin 객체를 만들면 입력 컴포넌트가 다시 마운트될 수 있습니다.

기본 Select는 셀 또는 아이콘 클릭으로 editor가 마운트되면 네이티브 옵션 picker를 즉시 엽니다. 자동 열기를 원하지 않으면 factory에 `openOnMount: false`를 지정할 수 있습니다.

기본 Date는 셀 본문을 클릭하면 숫자 날짜 입력만 활성화하고, `editorIcon`을 클릭해서 진입한 경우에만 네이티브 달력 picker를 엽니다. 편집 플러그인은 `activation` 값(`'cell' | 'editorIcon'`)으로 두 진입 경로를 구분할 수 있습니다.

```tsx
{
  key: 'status',
  editable: true,
  editTrigger: 'click',
  editor: statusEditor,
  editorIcon: { render: <ChevronDownIcon />, ariaLabel: '상태 선택' },
}
```

아이콘의 모양은 editor 종류로 자동 추론하지 않습니다. 제품 디자인 시스템에 맞는 아이콘을 `editorIcon.render`로 명시합니다.
