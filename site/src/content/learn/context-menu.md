---
title: '셀 컨텍스트 메뉴 구성 (Cell Context Menu)'
description: '본문 셀의 우클릭과 키보드 메뉴에 동적 항목, 아이콘, 구분선, 비활성 상태와 실행 callback을 구성합니다.'
category: 'interaction'
order: 25
locale: 'ko'
canonicalPath: '/learn/context-menu'
demoId: 'context-menu'
features: ['context-menu', 'keyboard', 'accessibility', 'dataControl']
relatedGuides: ['search', 'cell-navigation', 'sorting-filtering', 'accessibility-and-keyboard']
relatedApi: ['/api/props#contextmenuoptions', '/api/props#searchoptions']
lastReviewedAt: '2026-08-23'
indexable: true
draft: false
---

## 1. 컨텍스트 메뉴 열기

`contextMenuOptions`를 전달하면 본문 데이터 셀에서 사용자 메뉴를 열 수 있습니다.

- 포인터: 셀 우클릭
- 키보드: 활성 셀에서 `Shift+F10` 또는 Context Menu 키
- 메뉴 탐색: `ArrowUp`, `ArrowDown`, `Home`, `End`
- 실행: `Enter` 또는 `Space`
- 닫기: `Escape`, 바깥 클릭, Grid 스크롤, 화면 크기 변경

포인터로 열 때는 대상 셀이 먼저 활성화·선택되고 그 다음 메뉴가 열립니다. 메뉴가 열린 상태에서 다른 셀을 선택하면 메뉴는 즉시 닫힙니다.

헤더, Summary, scrollbar, 빈 데이터 영역과 editor input에서는 브라우저 기본 메뉴를 유지합니다. 실행 가능한 메뉴 항목이 하나도 없을 때도 native context menu를 막지 않습니다.

## 2. 기본 메뉴 항목 구성

`items` callback은 메뉴를 연 셀의 immutable target을 받습니다. 반환 배열에는 실행 항목과 구분선을 함께 넣을 수 있습니다.

```tsx
<BGrid
  columns={columns}
  data={data}
  rowKey='requestNo'
  contextMenuOptions={{
    items: target => [
      {
        id: 'inspect-cell',
        label: '셀 정보 보기',
        icon: <Info size={15} />,
        shortcut: 'I',
        onSelect: selected => console.log(selected.value),
      },
      { type: 'separator', id: 'action-separator' },
      {
        id: 'assign-owner',
        label: '현재 사용자에게 담당자 지정',
        disabled: target.values.status === '완료',
        onSelect: selected => assignOwner(selected.values.requestNo),
      },
    ],
  }}
/>
```

`id`는 한 메뉴 안에서 고유해야 합니다. `shortcut`은 오른쪽에 표시되는 안내 문자열이며 실제 단축키 이벤트를 자동 등록하지 않습니다.

## 3. target 좌표와 데이터

메뉴 callback에서 자주 사용하는 값은 다음과 같습니다.

| 속성           | 의미                                         |
| -------------- | -------------------------------------------- |
| `value`        | 선택한 셀의 원본 값                          |
| `values`       | `BGridDataItem.values`의 행 데이터            |
| `column`       | 선택한 컬럼 정의                             |
| `columnId`     | 정규화된 컬럼 식별자                         |
| `visibleIndex` | 정렬·필터 적용 후 현재 화면의 표시 행 인덱스 |
| `sourceIndex`  | 소비자가 전달한 원본 데이터의 행 인덱스      |
| `rowKey`       | `BGrid.rowKey`로 읽은 안정적인 행 키    |

`dataControl.mode === 'client'`에서 정렬이나 필터가 적용되면 `visibleIndex`와 `sourceIndex`가 달라질 수 있습니다. 화면 이동에는 표시 인덱스를, 원본 배열 갱신이나 서버 요청에는 원본 인덱스 또는 `rowKey`를 사용하세요.

## 4. 검색 메뉴와 함께 사용하기

`searchOptions`와 `contextMenuOptions`를 함께 전달하면 Grid가 검색 항목을 사용자 항목 앞에 자동으로 추가하고 구분선을 정리합니다.

```tsx
<BGrid
  columns={columns}
  data={data}
  searchOptions={{
    labels: { contextMenuItem: '그리드에서 검색' },
  }}
  contextMenuOptions={{
    items: target => createRowActions(target),
  }}
/>
```

검색 항목만 숨기려면 `searchOptions.contextMenu = false`를 사용합니다. 사용자 메뉴 전체를 비활성화하려면 `contextMenuOptions.enabled = false`를 사용합니다.

## 5. 열림 상태 관찰

`onOpenChange`로 메뉴 열림과 닫힘을 관찰할 수 있습니다. 열릴 때는 현재 target이 함께 전달되므로 별도 상세 패널이나 telemetry 문맥을 구성할 수 있습니다.

```tsx
contextMenuOptions={{
  onOpenChange: (open, target) => {
    if (open && target) {
      console.log(target.rowKey, target.columnId);
    }
  },
  items: target => createRowActions(target),
}}
```

`onSelect`는 동기 함수와 Promise를 모두 허용합니다. 비동기 실행이 실패하면 개발 모드에서 해당 메뉴 항목 id와 함께 경고하며, 메뉴는 선택 직후 먼저 닫힙니다.

## 6. 적용 시 점검 목록

- 메뉴 action은 전달받은 immutable target을 사용하고 현재 DOM 텍스트를 다시 읽지 않습니다.
- 삭제·결제·권한 변경처럼 되돌리기 어려운 action은 메뉴 선택 즉시 실행하지 말고 확인 dialog를 거칩니다.
- 상태에 따라 실행할 수 없는 항목은 제거하기보다 `disabled`와 명확한 label로 이유를 보여줄 수 있습니다.
- 여러 Grid 인스턴스가 있으면 각 Grid의 focus와 메뉴 상태가 격리되는지 확인합니다.
- 모바일 long-press는 현재 기본 제공 범위가 아니므로 필요하면 애플리케이션의 별도 진입 UI를 제공합니다.
