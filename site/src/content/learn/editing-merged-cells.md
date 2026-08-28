---
title: "병합 셀 편집 (Merged Cell Editing)"
description: "틀고정 없는 병합 셀과 frozen row·column 경계의 병합 셀을 편집하고 모든 실제 행을 함께 변경하는 규칙을 설명합니다."
category: "interaction"
order: 8
locale: "ko"
canonicalPath: "/learn/editing-merged-cells"
demoId: "editing-merged-cells"
features: ["cell-merge", "editing", "virtual-scroll", "frozen-row", "frozen-column", "atomic-commit"]
relatedGuides: ["editing-events", "cell-merge", "frozen-columns"]
relatedApi: ["/api/props#cellmergeoptions", "/api/props#frozenrowcount", "/api/props#frozencolumnindex"]
lastReviewedAt: "2026-08-22"
indexable: true
draft: false
---

병합 셀을 편집하면 화면에 보이는 anchor 행만 바꾸지 않고 병합 그룹에 속한 모든 실제 행에 같은 변경을 적용합니다. editor와 icon callback은 병합 여부를 직접 계산할 필요가 없습니다. 라이브 예제는 24개 행을 사용하므로 세로 스크롤 중에도 병합 범위가 유지되는지 확인할 수 있으며, 기본 상태는 틀고정 없는 일반 병합 편집입니다.

## 틀고정 없는 병합 편집

`frozenRowCount`와 `frozenColumnIndex`가 모두 `0`이어도 병합 셀의 편집 트랜잭션은 동일하게 동작합니다. 라이브 예제에서 두 틀고정 값을 `0개`로 선택한 **일반 병합** 상태에서 하나의 고객명을 수정하면 같은 `mergeBy` 값을 가진 세 실제 행이 함께 변경됩니다.

```tsx
<BGrid<Order>
  editable
  cellMergeOptions={{
    columnsMap: {
      1: { mergeBy: 'customerGroup' },
    },
  }}
/>
```

라이브 예제의 **왼쪽 고정 컬럼 수**는 가로 스크롤 중에도 왼쪽에 남겨 둘 컬럼 수입니다. `1개`는 주문 코드만, `2개`는 주문 코드와 편집 대상인 병합 고객명 컬럼까지 고정합니다. **위쪽 고정 행 수**는 세로 스크롤 중에도 위쪽에 남겨 둘 실제 데이터 행 수입니다. `1개` 또는 `2개`를 선택하면 첫 3행 병합 셀이 고정 영역과 스크롤 영역으로 나뉘며, `3개`를 선택하면 첫 병합 그룹 전체가 고정됩니다. 어느 조각을 편집해도 같은 병합 그룹의 세 실제 행이 함께 변경됩니다. 기본 틀고정 동작은 [행·컬럼 틀고정 예제](/learn/frozen-columns)에서도 확인할 수 있습니다.

## 논리 셀과 DOM 조각

frozen row 경계나 frozen column 레이어 때문에 하나의 병합 셀이 여러 `td`로 나뉠 수 있습니다. 3행 병합 그룹을 `frozenRowCount=1`로 나누면 고정 영역에는 1행 셀, 스크롤 영역에는 다시 병합된 2행 셀이 렌더링됩니다. 이 조각들은 렌더링 단위일 뿐 다음 상호작용에서는 같은 논리 셀입니다.

- 어느 조각을 클릭해도 같은 canonical anchor가 활성화됩니다.
- `itemRender`, editor, `editorIcon` callback은 canonical 행의 `index`, `item`, `values`, `value`를 받습니다.
- editor는 사용자가 상호작용한 조각 한 곳에만 마운트됩니다.
- commit이 끝나면 모든 병합 행과 화면 조각이 함께 갱신됩니다.

## 트랜잭션 범위

병합 범위는 편집 세션을 시작할 때 전체 visible data의 연속된 `mergeBy` 값으로 snapshot됩니다. 가상 스크롤의 현재 렌더 범위로 제한하지 않습니다.

```tsx
onChangeValue: async ({ changes, rows, commit }) => {
  console.log(rows.map(row => row.sourceIndex));
  await commit(changes);
}
```

origin 컬럼의 병합 규칙만 행 범위를 결정합니다. 변경 목록에 다른 병합 컬럼이 포함되어도 범위를 연쇄 확장하지 않으며, 병합 key 자체를 바꾸더라도 저장 도중 범위를 다시 계산하지 않습니다. 대상 행 중 하나라도 유효하지 않으면 전체를 취소합니다.

표시 목적의 일반 셀 병합 구성은 [셀 병합 가이드](/learn/cell-merge), frozen 레이아웃 설정은 [고정 컬럼과 행](/learn/frozen-columns)에서 확인하세요.

> [!TIP]
> **모바일 환경에서의 고정 열과 병합 셀**:
> 모바일 화면에서는 고정 컬럼 수를 늘리면 스크롤 가능한 본문 영역이 좁아집니다. 화면 크기에 맞춰 `frozenColumnIndex`를 1개 또는 0개로 설정하여 좁은 화면에서도 편집 영역을 충분히 확보하세요.
