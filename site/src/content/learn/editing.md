---
title: "셀 편집 시작하기 (Cell Editing)"
description: "편집 가능 셀 선언부터 클릭·키보드 진입, IME, 저장·취소·이동까지 셀 편집의 기본 흐름을 설명합니다."
category: "interaction"
order: 1
locale: "ko"
canonicalPath: "/learn/editing"
demoId: "editing"
features: ["cell-editing", "editable", "editTrigger", "keyboard", "IME", "text-editor"]
relatedGuides: ["built-in-editors", "editor-plugins", "editor-icons", "lookup-editor", "editing-events", "editing-merged-cells"]
relatedApi: ["/api/props#editable", "/api/props#edittrigger", "/api/props#cellnavigationoptions", "/api/props#columns", "/api/props#ref", "/api/props#rowchecked"]
lastReviewedAt: "2026-09-03"
indexable: true
draft: false
---

셀 편집은 Grid의 `editable`과 대상 컬럼의 `editable`을 모두 켠 뒤 `column.editor`를 지정하면 시작할 수 있습니다. 이 페이지에서 마우스 진입 조건부터 키보드·IME·저장과 이동까지 기본 흐름을 함께 다루며, Select·lookup·이벤트 확장은 독립 가이드로 이어집니다.

## 1. 최소 설정

```tsx
const columns: BGridColumn<Order>[] = [
  {
    key: 'customerName',
    label: '고객명',
    width: 180,
    editable: true,
    editor: { type: 'text' },
  },
];

<BGrid<Order>
  width={720}
  height={360}
  data={data}
  columns={columns}
  rowKey='id'
  editable
/>
```

`itemRender`는 평상시 표시를, `editor`는 편집 상태의 입력 UI를 담당합니다. 표시 형식을 바꾸기 위해 editor를 만들 필요는 없습니다.

## 2. Grid 기본값과 컬럼 예외

기본 진입 방식은 더블클릭입니다. Grid의 `editTrigger`로 전체 기본값을 바꾸고, Select처럼 즉시 열려야 하는 컬럼만 다시 지정할 수 있습니다.

```tsx
<BGrid editTrigger='dblclick' {...props} />

const columns: BGridColumn<Order>[] = [
  { key: 'name', editable: true, editor: { type: 'text' } },
  {
    key: 'status',
    editable: true,
    editTrigger: 'click',
    editor: statusEditor,
  },
];
```

해석 우선순위는 `column.editTrigger → grid.editTrigger → 'dblclick'`입니다. `editTrigger: 'none'`은 제공하지 않습니다. 셀을 읽기 전용으로 만들려면 `editable: false`를 사용하고, 셀 클릭과 별개인 버튼 동작은 `editorIcon.onClick` 또는 `itemRender`에 둡니다.

## 3. 마우스와 키보드로 입력 시작하기

- 셀 클릭 또는 더블클릭: 설정된 `editTrigger`에 따라 editor를 엽니다.
- 문자 직접 입력: text 셀의 기존 값을 대체하며 입력합니다.
- `Enter` 또는 `F2`: 기존 값을 유지한 채 editor를 엽니다.
- 아이콘 클릭: `editorIcon.onClick`이 없으면 해당 editor를 엽니다.

셀 포커스와 editor 포커스는 서로 다른 상태입니다. 먼저 셀을 활성화한 뒤 키보드로 editor를 열며, 편집이 끝나면 Grid가 다시 활성 셀에 포커스를 돌려줍니다.

## 4. 키 동작표

| 키 | 셀 포커스 상태 | 편집 상태 |
| --- | --- | --- |
| 문자 입력 | text 셀의 기존 값을 대체하며 시작 | 일반 입력 |
| `Enter` / `F2` | 기존 값을 유지하며 시작 | `Enter`는 저장 |
| `Tab` / `Shift+Tab` | 다음/이전 셀 이동 | 저장 후 다음/이전 셀 이동 |
| `Escape` | 선택 범위 해제 | 변경 취소 후 같은 셀 복귀 |
| 방향키 | 활성 셀 이동 | 입력 컨트롤 기본 동작 |
| `Ctrl/Cmd+C`, `V` | 선택 범위 복사·붙여넣기 | 입력 컨트롤 기본 동작 |

내장 text editor의 `startOnInput` 기본값은 `true`입니다. 셀 포커스에서 문자를 바로 입력해 editor를 여는 동작을 끄려면 `startOnInput: false`를 사용합니다.

```tsx
editor: {
  type: 'text',
  startOnInput: false,
}
```

## 5. IME와 키보드 이동 설정

한글처럼 조합 입력 중인 상태에서는 Enter나 blur가 먼저 발생해도 조합 전 문자열을 저장하지 않습니다. 조합이 완료된 뒤 최종 문자열로 commit합니다. 외부 plugin은 사용하는 UI 컴포넌트의 composition 동작도 함께 확인해야 합니다.

```tsx
<BGrid
  cellNavigationOptions={{
    enabled: true,
    editOnEnter: true,
    wrap: false,
  }}
/>
```

활성 셀을 제어형으로 관리하거나 Home/End, PageUp/PageDown 동작까지 확인하려면 [셀 포커스와 키보드 이동](/learn/cell-navigation)을 이어서 보세요.

## 6. 애플리케이션 상태 반영

Grid 내부 저장 후 `onChangeData`가 호출됩니다. 정렬·필터가 적용되어도 첫 번째 인자는 원본 데이터의 source index입니다.

```tsx
onChangeData={(sourceIndex, _columnIndex, values, _column, meta) => {
  setData(current =>
    current.map((item, index) =>
      index === sourceIndex ? meta?.dataItem ?? { ...item, values } : item,
    ),
  );
}}
```

실제 행 데이터는 항상 `BGridDataItem<T>.values`에 있습니다. `meta.dataItem`을 저장하면 직접 편집한 컬럼의 `editedColumnIds`와 값이 변경된 데이터 key의 `changedKeys`가 함께 유지됩니다. 직접 편집한 셀에는 `bgrid-cell-edited`, 같은 key를 공유하는 모든 셀에는 `bgrid-cell-value-changed` 스타일이 적용됩니다.

## 7. 행 추가·선택 삭제와 스크롤

라이브 예제의 **행추가**는 새 행을 끝에 추가하고 그 위치로 이동합니다. 왼쪽 체크박스로 여러 행을 선택한 다음 **행삭제**를 누르면 선택된 행만 데이터에서 제거합니다. 선택이 없으면 삭제 버튼은 비활성화됩니다. 새 행은 `status: BGridDataItemStatus.new`로 표시하며, 삭제는 서버 저장 없이 예제의 React 상태에서 즉시 처리합니다.

행 추가·삭제는 애플리케이션이 `data`를 갱신하고, 스크롤은 `BGridRef.scrollToRow()`로 명시적으로 요청합니다. 일반적인 데이터 갱신은 현재 스크롤 위치를 유지합니다. 이 예제는 추가할 행의 고유 키를 기억했다가 데이터 반영 후 이동하므로 셀 편집 때마다 다시 스크롤하지 않습니다.

```tsx
import { useEffect, useRef, useState, type Key } from 'react';
import { BGrid, type BGridDataItem, type BGridRef } from 'beautiful-grid';

const gridRef = useRef<BGridRef>(null);
const pendingRowKey = useRef<string | null>(null);
const [checkedRowKeys, setCheckedRowKeys] = useState<Key[]>([]);

function addRow(item: BGridDataItem<Order>) {
  pendingRowKey.current = item.values.id;
  setData(current => [...current, item]);
}

useEffect(() => {
  const rowIndex = data.findIndex(item => item.values.id === pendingRowKey.current);
  if (rowIndex < 0) return;
  gridRef.current?.scrollToRow(rowIndex, { align: 'end' });
  pendingRowKey.current = null;
}, [data]);

function deleteCheckedRows() {
  const keys = new Set(checkedRowKeys);
  setData(current => current.filter(item => !keys.has(item.values.id)));
  setCheckedRowKeys([]);
}

<BGrid<Order>
  ref={gridRef}
  width={720}
  height={360}
  data={data}
  columns={columns}
  rowKey='id'
  editable
  rowChecked={{
    checkedRowKeys,
    onChange: (_indexes, keys) => setCheckedRowKeys(keys),
  }}
/>
```

`scrollToRow(rowIndex, { align })`의 인덱스는 **현재 페이지에서 정렬·필터가 적용된 표시 순서의 0 기반 인덱스**입니다. `onChangeData`의 source index와는 다릅니다. 정렬·필터를 사용한다면 표시 데이터에서 행 위치를 구해야 하며, 필터로 숨겨진 행이나 다른 페이지를 자동으로 열지는 않습니다.

- `nearest` (기본값): 행이 이미 보이면 유지하고, 벗어나면 필요한 만큼만 이동합니다.
- `start` / `center` / `end`: 행을 스크롤 영역의 위 / 가운데 / 아래로 맞추되 스크롤 한계를 넘지 않습니다.
- 고정 행, 범위 밖 인덱스, 정수가 아닌 인덱스는 무시합니다.
- 가로 스크롤, 활성 셀과 선택은 변경하지 않습니다. 연속 요청은 마지막 요청을 반영합니다.
- 같은 이벤트에서 데이터 갱신과 호출을 함께 해도 Grid 내부 데이터 반영 후 처리합니다. 서버 응답 등 비동기 데이터는 도착한 뒤 호출하세요.

## 8. 다음 가이드 선택

| 하고 싶은 일 | 다음 문서 |
| --- | --- |
| text, Select, Date 사용 | [내장·기본 제공 에디터](/learn/built-in-editors) |
| Ant Design 등 외부 UI 연결 | [외부 에디터 플러그인](/learn/editor-plugins) |
| 평상시 셀에 화살표·검색 아이콘 표시 | [에디터 아이콘](/learn/editor-icons) |
| autocomplete 입력과 lookup 모달 함께 사용 | [Lookup 에디터](/learn/lookup-editor) |
| 연관 셀 변경과 검증 | [편집 이벤트와 트랜잭션](/learn/editing-events) |
| 병합 셀과 frozen 경계 편집 | [병합 셀 편집](/learn/editing-merged-cells) |
