---
title: "편집 이벤트와 트랜잭션 (Editing Events)"
description: "editor 요청에서 onChangeValue 검증·보정, 다중 컬럼 commit, onChangeData 통지까지의 이벤트 흐름을 설명합니다."
category: "interaction"
order: 7
locale: "ko"
canonicalPath: "/learn/editing-events"
demoId: "editing-events"
features: ["onChangeValue", "commit", "onChangeData", "transaction", "validation"]
relatedGuides: ["editing", "editor-plugins", "lookup-editor", "editing-merged-cells"]
relatedApi: ["/api/props#onchangedata", "/api/props#columns"]
lastReviewedAt: "2026-08-21"
indexable: true
draft: false
---

text, checkbox, Select, 외부 plugin, lookup 아이콘은 모두 같은 변경 트랜잭션을 사용합니다. 에디터별 저장 코드를 따로 만들지 않고 시작 컬럼의 `onChangeValue`에서 검증과 연관 셀 변경을 한 번 처리합니다.

## 이벤트 흐름

```text
text / checkbox / plugin / editorIcon
        ↓
 requestCommit(changes)
        ↓
 column.onChangeValue
        ↓
   commit(changes)
        ↓
 데이터 갱신 → onChangeData → 이동·세션 종료
```

`onChangeValue`가 없으면 제안된 변경이 자동 저장됩니다. hook을 지정했다면 반드시 `commit()` 또는 `cancel()`로 끝내야 합니다.

## 연관 셀을 함께 변경

```tsx
{
  key: 'quantity',
  editor: { type: 'text', parseValue: Number },
  onChangeValue: async ({ changes, nextValues, commit }) => {
    if (nextValues.quantity < 0) {
      throw new Error('수량은 0 이상이어야 합니다.');
    }

    await commit([
      ...changes,
      {
        key: 'amount',
        value: nextValues.quantity * nextValues.unitPrice,
      },
    ]);
  },
}
```

- `changes`: editor 또는 아이콘이 제안한 변경 목록
- `values`: 변경 전 canonical 행 값
- `nextValues`: 제안된 변경만 immutable하게 미리 적용한 값
- `rows`: 병합 전파 대상 전체와 각 행의 `nextValues`
- `commit`: 최종 목록 저장. `onChangeValue`를 다시 호출하지 않음
- `cancel`: 제안 폐기

같은 대상이 여러 번 나타나면 마지막 값이 적용됩니다. 중첩 데이터는 `{ key: ['customer', 'code'], value }`처럼 path 배열로 지정할 수 있습니다.

## 완료 통지

```tsx
onChangeData={(sourceIndex, columnIndex, values, column, meta) => {
  // 여러 컬럼이 바뀌면 columnIndex와 column은 null입니다.
  console.log(meta?.source, meta?.changes);
  console.log(meta?.dataItem.status, meta?.dataItem.editedColumnIds, meta?.dataItem.changedKeys);
  console.log(meta?.transaction.sourceIndexes);
}}
```

`onChangeData`는 트랜잭션이 실제 데이터를 바꾼 행마다 한 번 호출됩니다. 기존 네 인자 callback은 그대로 사용할 수 있고, 다중 변경과 병합 범위가 필요할 때만 다섯 번째 `meta`를 읽습니다. `meta.dataItem`에는 변경된 값과 함께 행 `status`, 직접 편집한 컬럼의 `editedColumnIds`, 변경된 데이터 key의 `changedKeys`가 포함됩니다.

제어형 `data`를 사용하는 경우에는 `values`만 새 객체에 복사하지 말고 `meta.dataItem`을 저장해야 변경 셀 표시가 다음 렌더에서도 유지됩니다.

```tsx
onChangeData={(sourceIndex, _columnIndex, values, _column, meta) => {
  setData(current =>
    current.map((item, index) =>
      index === sourceIndex ? meta?.dataItem ?? { ...item, values } : item,
    ),
  );
}}
```

직접 편집한 셀에는 `bgrid-cell-edited`가 적용되고, 같은 데이터 key를 공유하는 모든 셀에는 `bgrid-cell-value-changed`가 적용됩니다. 두 상태는 각각 `--bgrid-cell-edited-*`, `--bgrid-cell-value-changed-*` CSS 변수로 변경할 수 있습니다.

## 실패와 비동기 규칙

대상 컬럼이 없거나 모호한 경우, `parseValue` 또는 `onChangeValue` 검증이 실패한 경우 전체 변경을 취소하며 부분 저장하지 않습니다. commit Promise가 reject되면 text/plugin editor는 현재 세션을 유지합니다. 같은 세션의 commit·cancel 경쟁에서는 최초로 완료된 최종 동작만 반영됩니다.
