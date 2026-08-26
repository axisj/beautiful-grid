---
title: "합계 및 요약행 (Summary Row)"
description: "BGridProps의 summary 설정으로 상단 또는 하단에 사용자 정의 요약 셀을 표시하는 방법을 학습합니다."
category: "advanced"
order: 2
locale: "ko"
canonicalPath: "/learn/summary"
demoId: "summary"
features: ["summary", "BGridSummaryColumn", "itemRender", "colSpan"]
relatedGuides: ["getting-started", "basic", "cell-merge", "pivot"]
relatedApi: ["/api/props#summary", "/api/props#columns"]
lastReviewedAt: "2026-08-23"
indexable: true
draft: false
---

## Summary 설정

`summary`는 일반 `<table>`이나 `<tr>`을 직접 반환하는 렌더 prop이 아닙니다. 표시 위치와 요약할 컬럼 정의 배열을 전달합니다.

```tsx
const summary: BGridProps<Row>['summary'] = {
  position: 'bottom',
  columns: [
    {
      columnIndex: 0,
      colSpan: 2,
      align: 'center',
      itemRender: () => <>합계</>,
    },
    {
      columnIndex: 2,
      align: 'right',
      itemRender: ({ data }) => (
        <>{data.reduce((sum, item) => sum + item.values.amount, 0).toLocaleString()}</>
      ),
    },
  ],
};

<BGrid summary={summary} summaryHeight={32} {...props} />
```

## 멤버 의미

| 멤버 | 설명 |
|---|---|
| `position` | 요약 행을 데이터 위(`top`) 또는 아래(`bottom`)에 배치합니다. |
| `columnIndex` | 요약 셀이 시작될 컬럼의 0 기반 인덱스입니다. |
| `colSpan` | 요약 셀이 차지할 컬럼 수입니다. |
| `itemRender` | `{ column, columnIndex, data }`를 받아 요약 콘텐츠를 반환합니다. |
| `summaryHeight` | 요약 영역의 높이를 조정하는 최상위 prop입니다. |

`data`는 `BGridDataItem<T>[]`이므로 실제 값은 `item.values`에서 읽습니다. 페이지 단위 합계인지 전체 데이터 합계인지는 부모가 그리드에 어떤 데이터를 전달했는지에 따라 결정됩니다.
