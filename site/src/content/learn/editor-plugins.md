---
title: "외부 에디터 플러그인 (AntD) (Editor Plugins (AntD))"
description: "Ant Design과 앱 전용 입력 컴포넌트를 plugin으로 연결하고 popup portal, 다중 변경 commit, 종료 수명주기를 관리하는 방법을 설명합니다."
category: "interaction"
order: 3
locale: "ko"
canonicalPath: "/learn/editor-plugins"
demoId: "editor-plugins"
features: ["editor-plugin", "defineEditorPlugin", "portal", "commit", "lifecycle"]
relatedGuides: ["built-in-editors", "editor-plugins-shadcn", "editor-icons", "lookup-editor", "editing-events"]
relatedApi: ["/api/props#columns", "/api/props#editable"]
lastReviewedAt: "2026-08-29"
indexable: true
draft: false
---

Ant Design Select·DatePicker·ColorPicker·Cascader·TimePicker·TreeSelect, 비동기 자동완성처럼 앱이 이미 사용하는 UI 컴포넌트는 `defineEditorPlugin()`으로 연결합니다. text·기본 Select·Date만 필요하다면 [내장·기본 제공 에디터](/learn/built-in-editors)를 먼저 확인하세요.

## Plugin 정의

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

`commit`은 단일 값도 항상 길이 1의 변경 배열로 받습니다. 셀 값 자체가 배열일 수 있으므로 `commit(value)` 형태와 혼용하지 않습니다.

## DatePicker와 ColorPicker 연결

날짜는 앱의 저장 형식으로 변환한 뒤 commit합니다. 예를 들어 `dayjs` 값을 `YYYY-MM-DD` 문자열로 보관한다면 다음처럼 연결합니다.

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

ColorPicker는 드래그 중인 `onChange` 값은 미리보기에만 사용하고, 조작이 끝나는 `onChangeComplete`에서 최종 색상을 저장할 수 있습니다.

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

## Cascader, TimePicker, TreeSelect 연결

Cascader는 마지막 항목만 저장하지 않고 선택된 전체 경로를 `string[]`로 commit합니다. TimePicker는 시·분을 고르는 중에 편집이 끝나지 않도록 `needConfirm`을 사용하고, 확인 버튼을 누른 `onOk` 시점에 앱의 저장 형식으로 변환합니다. TreeSelect는 선택한 노드의 `value`를 그대로 저장합니다.

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

라이브 예제의 여섯 어댑터는 셀의 `font`, `color`, 높이를 상속합니다. 외부 UI 라이브러리가 자체 글꼴 크기를 지정한다면 editor root와 선택 값 요소에 `font: inherit`을 적용하고, popup에도 `--bgrid-font-family`와 `--bgrid-font-size`를 전달하면 활성화 전후의 셀 스타일이 일관됩니다.

## 복사·붙여넣기 값 변환

클립보드는 editor의 React 값이 아니라 탭과 줄바꿈으로 구분된 `text/plain`만 전달합니다. 화면의 `itemRender`와 editor의 `defaultValue`는 클립보드 변환에 관여하지 않습니다. 따라서 `string[]`을 저장하는 Cascader처럼 문자열이 아닌 셀은 컬럼에서 복사와 붙여넣기의 양방향 계약을 정의해야 합니다.

```tsx
const categoryColumn: BGridColumn<Order> = {
  key: 'categoryPath',
  label: '분류',
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
      throw new TypeError('분류 경로는 JSON 문자열 배열이어야 합니다.');
    }
    return parsed;
  },
};
```

이 예제에서는 셀 표시만 `국내 / 서울`로 포맷하고, 클립보드에는 손실 없는 `["국내","서울"]`을 기록합니다. 붙여넣을 때 다시 `string[]`로 복원하므로 Ant Design Cascader의 `defaultValue`에도 같은 경로가 표시됩니다. 사람이 읽는 `국내 / 서울`을 복사 형식으로 사용하려면 경로 값에 `/`가 들어오는 경우까지 처리하는 escape 규칙과 유효성 검사를 직접 정의해야 합니다.

변환 우선순위는 다음과 같습니다.

1. 복사는 컬럼의 `getClipboardText`를 사용합니다. 없으면 문자열은 그대로, 숫자·불리언은 문자열, `Date`는 ISO 문자열, 배열·객체는 JSON으로 직렬화합니다.
2. 붙여넣기는 컬럼의 `parseClipboardText`를 먼저 사용합니다. 이 API는 text·checkbox·plugin 여부와 관계없이 모든 editable 컬럼에 적용됩니다.
3. 컬럼 parser가 없고 내장 text editor에 `parseValue`가 있으면 기존 parser를 사용합니다.
4. 둘 다 없으면 클립보드 문자열을 그대로 저장합니다. 이 경우 구조화 값은 문자열로 바뀌어 editor 선택 표시가 사라질 수 있습니다.

숫자는 `Number.isFinite(Number(text))`, 불리언은 허용할 토큰(`true`/`false`, `Y`/`N`)의 명시적 매핑, 날짜는 앱의 저장 포맷, enum은 option 목록 포함 여부를 각각 검증하세요. 배열·객체에는 JSON과 shape 검증을 권장합니다. parser가 예외를 던지면 해당 셀은 변경하지 않고 `cellSelectionOptions.onPasteError`에 `parseValueFailed`를 전달합니다. `parseClipboardText`의 두 번째 인자에서는 현재 `value`, 행 `values`, `item`, `index`, `columnIndex`, `column`, 원본 `text`를 확인할 수 있습니다.

## 여러 컬럼을 한 번에 저장

자동완성에서 코드와 이름이 함께 결정되면 한 요청에 모두 전달합니다.

```tsx
await commit([
  { key: 'customerCode', value: selected.code },
  { key: 'customerName', value: selected.name },
]);
```

대상 `key` 또는 `columnId`를 찾을 수 없거나 모호하면 부분 저장 없이 전체 commit이 거부됩니다.

## Plugin props

- `value`, `item`, `values`, `column`, `index`, `columnIndex`: 현재 논리 셀 문맥
- `commit(changes, options?)`: 변경 목록을 저장하고 세션 종료
- `cancel()`: 원래 값을 유지하고 세션 종료
- `move(direction)`: 저장하지 않고 지정 셀로 이동
- `sessionId`: 비동기 callback이 속한 세션 식별자
- `getPortalContainer()`: popup UI를 연결할 Grid 전용 floating portal root

## Popup과 종료 규칙

popup을 UI 라이브러리의 기본 `document.body`에 직접 렌더링하면 Grid 바깥 클릭으로 오인될 수 있습니다. 반대로 Grid DOM 내부에 렌더링하면 컨테이너의 `overflow: hidden` 경계에서 큰 picker가 잘립니다. `getPortalContainer()`는 Grid가 추적하는 `document.body` 직속 floating portal을 반환하므로, 외부 컴포넌트가 portal을 지원하면 반드시 이 함수를 연결하세요. 이 portal은 Grid 테마 변수를 복사하며 frozen·스크롤 위치 계산과 바깥 클릭 판정에도 포함됩니다.

한 세션에서는 `commit`, `cancel`, `move` 중 하나만 최종 동작으로 사용합니다. 라이브러리도 첫 번째 완료 요청만 반영하므로 선택 직후 발생한 blur의 `cancel()`이 저장 결과를 덮어쓰지 않습니다. 비동기 검증이 실패해 `commit()` Promise가 reject되면 editor는 유지되며 사용자가 수정 후 다시 시도할 수 있습니다.

```tsx
await commit(changes, { move: 'next' });
```

저장 또는 취소 뒤 DOM 포커스를 직접 옮기지 마세요. Grid가 활성 셀로 포커스를 복원합니다.
