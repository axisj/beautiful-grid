---
title: "행·컬럼 틀고정 (Frozen Rows & Columns)"
description: "상단 주요 행과 좌측 주요 열을 고정하고 Summary Row와 함께 사용하는 방법을 학습합니다."
category: "advanced"
order: 5
locale: "ko"
canonicalPath: "/learn/frozen-columns"
demoId: "frozen-columns"
features: ["frozenColumnIndex", "frozenRowCount", "frozen-columns", "frozen-rows", "summary", "sync-scroll"]
relatedGuides: ["getting-started", "basic", "column-groups", "cell-merge"]
relatedApi: ["/api/props#frozencolumnindex", "/api/props#frozenrowcount", "/api/props#columns"]
lastReviewedAt: "2026-08-19"
indexable: true
draft: false
---

## 1. 개요

열이 많은 테이블에서는 가로 스크롤 후에도 **사번, 이름** 같은 식별 컬럼을 계속 확인해야 합니다. 데이터가 길어질 때는 비교 기준이 되는 주요 행도 화면 상단에 유지할 필요가 있습니다.

BeautifulGrid는 `frozenColumnIndex`로 왼쪽에 고정할 컬럼 수를, `frozenRowCount`로 상단에 고정할 행 수를 설정합니다. 두 옵션은 함께 사용하거나 각각 사용할 수 있으며, 가로·세로 스크롤 중에도 고정된 데이터가 유지됩니다.

고정된 셀도 일반 셀과 동일하게 선택·편집할 수 있으며, 체크박스와 행 상태도 함께 사용할 수 있습니다.

---

## 2. 사용법

`frozenColumnIndex={N}`을 설정하면 0번부터 N-1번까지의 컬럼이 좌측에 고정됩니다.

```tsx
<BGrid
  columns={columns}
  data={data}
  frozenColumnIndex={2} // 0번째, 1번째 컬럼 2개 좌측 고정
/>
```

`frozenRowCount={N}`을 함께 설정하면 현재 정렬·필터·페이지 처리가 반영된 표시 데이터의 앞 N개 행을 상단에 고정합니다.

```tsx
<BGrid
  columns={columns}
  data={data}
  frozenColumnIndex={2}
  frozenRowCount={3}
/>
```

상단 Summary Row는 고정 데이터 행과 별도 영역입니다. 두 기능을 함께 사용하면 화면에는 헤더, 상단 Summary, 고정 행, 일반 행 순서로 표시됩니다.

```tsx
<BGrid
  columns={columns}
  data={data}
  frozenRowCount={2}
  summary={{
    position: 'top',
    columns: [{ columnIndex: 0, itemRender: () => '합계' }],
  }}
/>
```

`frozenRowCount`가 현재 표시 행 수보다 크면 자동으로 행 수에 맞춰 줄어듭니다. 피벗 모드에서는 첫 릴리스 정책상 행 틀고정이 비활성화됩니다.
