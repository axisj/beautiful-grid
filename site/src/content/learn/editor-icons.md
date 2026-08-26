---
title: "에디터 아이콘 (Editor Icons)"
description: "셀 값 옆에 드롭다운·달력·검색 아이콘을 표시하고 editor 시작 또는 독립 callback을 연결하는 방법을 설명합니다."
category: "interaction"
order: 4
locale: "ko"
canonicalPath: "/learn/editor-icons"
demoId: "editor-icons"
features: ["editorIcon", "visibility", "icon-callback", "accessibility"]
relatedGuides: ["built-in-editors", "lookup-editor", "editing-events"]
relatedApi: ["/api/props#columns"]
lastReviewedAt: "2026-08-20"
indexable: true
draft: false
---

`editorIcon`은 편집 중이 아닐 때도 셀 값 옆에 입력 가능성을 보여주는 핸들입니다. Select 화살표와 lookup 검색 아이콘을 별도 API로 나누지 않고 같은 설정을 사용합니다.

## Editor를 여는 아이콘

`onClick`을 생략하면 아이콘 클릭이 기존 `column.editor`를 시작합니다.

```tsx
{
  key: 'status',
  editable: true,
  editTrigger: 'click',
  editor: statusEditor,
  editorIcon: {
    render: <ChevronDownIcon />,
    ariaLabel: '상태 선택',
    visibility: 'always',
  },
}
```

## Callback을 실행하는 아이콘

`onClick`이 있으면 기본 editor 대신 callback 세션을 시작합니다. callback에는 DOM 이벤트가 아니라 셀 문맥과 공통 `commit`/`cancel`이 전달됩니다.

```tsx
editorIcon: {
  render: <SearchIcon />,
  ariaLabel: ({ values }) => `${values.customerName} lookup 열기`,
  onClick: ({ commit, cancel }) => {
    openLookup({
      onSelect: customer => commit([
        { key: 'customerCode', value: customer.code },
        { key: 'customerName', value: customer.name },
      ]),
      onClose: cancel,
    });

    return () => closeLookup();
  },
}
```

반환 함수는 commit, cancel, 새 상호작용, unmount로 세션이 끝날 때 한 번 호출되는 cleanup입니다.

## 표시 조건

| `visibility` | 동작 |
| --- | --- |
| `always` | 항상 표시, 기본값 |
| `hover` | 셀을 가리킬 때 표시 |
| `active` | 활성 셀일 때 표시 |

아이콘 종류를 editor에서 자동 추론하지 않습니다. 같은 Select라도 제품마다 아이콘과 접근성 이름이 다르므로 `render`는 필수입니다. 편집과 무관한 삭제·상세 이동 버튼은 `itemRender`에 두는 편이 역할이 명확합니다.
