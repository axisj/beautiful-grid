---
title: '그리드 검색 (Grid Search)'
description: '현재 로드된 표시 데이터의 셀을 검색하고 하이라이트, 이전·다음 이동, 우클릭 메뉴와 제어형 검색 UI를 구성합니다.'
category: 'interaction'
order: 24
locale: 'ko'
canonicalPath: '/learn/search'
demoId: 'search'
features: ['search', 'context-menu', 'keyboard', 'virtual-scroll', 'frozen-columns', 'dataControl']
relatedGuides:
  [
    'getting-started',
    'context-menu',
    'sorting-filtering',
    'virtual-scroll',
    'frozen-columns',
    'accessibility-and-keyboard',
  ]
relatedApi:
  [
    '/api/props#searchoptions',
    '/api/props#contextmenuoptions',
    '/api/props#bgridcolumn-searchable',
    '/api/props#bgridcolumn-getsearchtext',
  ]
lastReviewedAt: '2026-08-22'
indexable: true
draft: false
---

## 1. 검색 범위와 동작

`searchOptions`를 전달하면 포커스된 Grid에서 `Ctrl+F` 또는 macOS의 `Cmd+F`로 검색 UI를 열 수 있습니다. 본문 셀을 우클릭하거나 활성 셀에서 `Shift+F10`을 눌러 컨텍스트 메뉴의 **검색** 항목을 선택해도 같은 UI가 열립니다.

검색은 렌더된 DOM이 아니라 Grid Store의 **현재 로드된 표시 데이터 전체**를 대상으로 합니다. 따라서 가상 스크롤 밖의 행도 결과에 포함되고, 이전·다음 이동 시 해당 셀이 보이도록 스크롤합니다. `dataControl.mode === 'client'`이면 정렬·필터가 적용된 표시 행만 검색하며, 외부 페이지네이션과 수동 서버 모드에서는 현재 전달된 페이지나 로드된 행만 검색합니다.

서버 전체 검색이나 검색 결과만 남기는 필터 모드는 이 API의 범위가 아닙니다.

## 2. 최소 설정

```tsx
<BGrid columns={columns} data={data} rowKey='employeeNo' searchOptions={{}} />
```

검색 UI가 열린 상태에서 다음 키를 사용할 수 있습니다.

| 키                            | 동작                                  |
| ----------------------------- | ------------------------------------- |
| `Enter`                       | 다음 결과로 이동                      |
| `Shift+Enter`                 | 이전 결과로 이동                      |
| `Escape`                      | 검색 UI를 닫고 하이라이트 제거        |
| `Ctrl/Cmd+F`                  | 검색 UI 열기 또는 열린 입력 전체 선택 |
| `Shift+F10` / Context Menu 키 | 활성 셀의 컨텍스트 메뉴 열기          |

편집 세션이나 `input`, `textarea`, `select`, `contenteditable`에 포커스가 있으면 Grid가 `Ctrl/Cmd+F`를 가로채지 않습니다. IME 조합 중 Enter도 결과 이동으로 처리하지 않습니다.

## 3. 화면 표시값과 검색 문자열 맞추기

기본 검색 문자열은 `column.key`로 `item.values`에서 읽은 값입니다. `itemRender`가 금액, 날짜, 상태 코드를 다른 문자열로 표시한다면 DOM 텍스트를 자동으로 읽지 않으므로 `getSearchText`를 함께 지정합니다.

```tsx
const columns = [
  {
    id: 'allocationRate',
    key: 'allocationRate',
    label: '투입률',
    width: 100,
    itemRender: ({ values }) => `${values.allocationRate}%`,
    getSearchText: ({ value }) => `${value}%`,
  },
  {
    id: 'privateMemo',
    key: 'privateMemo',
    label: '내부 메모',
    width: 180,
    searchable: false,
  },
];
```

컬럼의 `getSearchText`가 Grid 전역 `searchOptions.getSearchText`보다 우선합니다. callback은 부작용이 없는 동기 함수여야 하며 Promise는 지원하지 않습니다.

## 4. 외부 툴바에서 제어하기

`open`과 `query`를 제공하면 검색 UI를 제어형으로 사용할 수 있습니다. 변경 callback에서 새 값을 다시 props로 전달해야 화면 상태가 확정됩니다.

```tsx
const [open, setOpen] = useState(false);
const [query, setQuery] = useState('');

<>
  <button type='button' onClick={() => setOpen(true)}>
    데이터 검색
  </button>
  <BGrid
    columns={columns}
    data={data}
    searchOptions={{
      open,
      query,
      onOpenChange: setOpen,
      onQueryChange: setQuery,
      labels: {
        placeholder: '현재 로드된 데이터에서 찾기',
        formatResultCount: ({ activeResult, totalResults }) => `${activeResult} / ${totalResults}`,
      },
    }}
  />
</>;
```

`icons.search`, `icons.previous`, `icons.next`, `icons.close` 슬롯에는 애플리케이션이 사용하는 아이콘 시스템의 React 노드를 전달할 수 있습니다. 라이브러리 자체는 별도 아이콘 runtime dependency를 요구하지 않는 fallback을 제공합니다.

## 5. 사용자 컨텍스트 메뉴 항목 추가

`contextMenuOptions.items`는 본문 셀을 우클릭한 시점의 immutable target을 받습니다. client 정렬·필터 후에는 `visibleIndex`와 원본 `sourceIndex`가 다를 수 있으므로 목적에 맞는 값을 명시적으로 사용합니다.

```tsx
<BGrid
  columns={columns}
  data={data}
  searchOptions={{}}
  contextMenuOptions={{
    items: target => [
      {
        id: 'inspect-row',
        label: '이 행 정보 보기',
        onSelect: () => {
          console.log({
            visibleIndex: target.visibleIndex,
            sourceIndex: target.sourceIndex,
            values: target.values,
          });
        },
      },
    ],
  }}
/>
```

실행 가능한 메뉴 항목이 하나도 없으면 브라우저 기본 컨텍스트 메뉴를 유지합니다. 검색 항목을 제외하려면 `searchOptions.contextMenu = false`, 모든 사용자 메뉴를 끄려면 `contextMenuOptions.enabled = false`를 사용합니다.

## 6. 적용 시 점검 목록

- 외부 페이지네이션이나 무한 로딩 화면에서는 “현재 로드된 데이터” 범위를 사용자에게 설명합니다.
- 포맷된 셀은 `getSearchText`가 실제 화면 의미와 일치하는지 확인합니다.
- `rowKey`를 제공하면 데이터 변경과 재정렬 뒤 현재 결과를 더 안정적으로 보존할 수 있습니다.
- 좁은 Grid, Frozen 행·컬럼, Summary와 함께 이전·다음 결과 셀이 검색 패널에 가려지지 않는지 실제 화면에서 확인합니다.
- 피벗 결과 검색은 현재 지원하지 않습니다.
