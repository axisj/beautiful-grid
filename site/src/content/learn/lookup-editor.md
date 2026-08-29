---
title: "Autocomplete와 Lookup (Lookup Editor)"
description: "같은 셀에서 자동완성 입력과 lookup 모달 아이콘을 함께 제공하고 여러 컬럼 값을 원자적으로 저장하는 방법을 설명합니다."
category: "interaction"
order: 6
locale: "ko"
canonicalPath: "/learn/lookup-editor"
demoId: "lookup-editor"
features: ["autocomplete", "lookup", "editorIcon", "multi-cell-commit"]
relatedGuides: ["editor-plugins", "editor-icons", "editing-events"]
relatedApi: ["/api/props#columns", "/api/props#onchangedata"]
lastReviewedAt: "2026-08-29"
indexable: true
draft: false
---

FACEDM 형태의 고객 입력은 두 진입 경로를 한 컬럼에 함께 구성할 수 있습니다. 셀 라벨 영역을 더블클릭하면 Ant Design `AutoComplete` plugin을 열고, 같은 셀의 검색 아이콘을 한 번 클릭하면 검색바와 단일 선택 DataGrid를 포함한 Ant Design `Modal`을 엽니다. 단일 클릭은 셀 선택만 변경하므로 사용자가 lookup 아이콘을 누르려다 의도치 않게 자동완성 편집을 여는 일을 방지합니다.

```tsx
{
  key: 'customerName',
  editable: true,
  editTrigger: 'dblclick',
  editor: customerAutocompleteEditor,
  editorIcon: {
    render: <SearchIcon />,
    ariaLabel: '고객 lookup 열기',
    onClick: ({ commit, cancel }) => {
      const close = openCustomerLookup({
        onSelect: customer => commit([
          { key: 'customerCode', value: customer.code },
          { key: 'customerName', value: customer.name },
          { key: 'customerGrade', value: customer.grade },
        ]),
        onCancel: cancel,
      });
      return close;
    },
  },
}
```

## 역할 분담

- `editor`: 입력 문자열, 후보 조회, 키보드 선택을 담당합니다.
- `editorIcon`: lookup 모달의 열기와 수명주기를 담당합니다.
- `editTrigger: 'dblclick'`: 라벨 영역의 단일 클릭은 셀 선택에만 사용하고 더블클릭에서 자동완성 편집을 시작합니다.
- `commit(changes[])`: 어느 경로에서 선택하든 동일한 저장 트랜잭션으로 보냅니다.
- `onChangeValue`: 두 경로가 제안한 값을 공통으로 검증·보정합니다.

브라우저 기본 자동완성 속성인 `text` editor의 `inputProps.autoComplete`와 후보 목록 UI는 다릅니다. 이 예제처럼 Ant Design `AutoComplete`를 plugin editor로 연결하면 셀 입력과 후보 목록을 하나의 편집 UI로 구성할 수 있습니다. 실제 서버 검색에서는 입력값으로 후보를 비동기 조회하되 최종 선택값은 동일한 `commit(changes[])` 경로로 저장하세요.

## 비동기 lookup 주의사항

callback 세션이 끝난 뒤 늦게 도착한 결과의 commit은 무시됩니다. 그래도 애플리케이션은 cleanup에서 진행 중인 요청을 중단하고 모달을 닫아 불필요한 작업과 화면 깜빡임을 방지해야 합니다.

값 선택에 실패하면 `commit()` Promise가 reject되고 현재 icon 세션은 종료됩니다. Promise 오류를 사용자에게 표시하고 필요하면 lookup을 다시 열 수 있도록 처리하세요.
