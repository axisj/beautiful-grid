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
lastReviewedAt: "2026-09-16"
indexable: true
draft: false
---

## Summary 설정

`summary`는 일반 `<table>`이나 `<tr>`을 직접 반환하는 렌더 prop이 아닙니다. 표시 위치(`position`)와 행별 요약 정의 배열(`rows`)을 전달합니다. 평균과 합계처럼 **여러 줄의 요약행(Multi-row Summary)** 도 손쉽게 구성할 수 있습니다.

```tsx
const summary: BGridProps<Row>['summary'] = {
  position: 'bottom', // 'top' | 'bottom'
  rows: [
    // 1행: 평균
    {
      className: 'summary-avg-row',
      columns: [
        { columnIndex: 0, colSpan: 2, align: 'center', itemRender: () => <>평균</> },
        {
          columnIndex: 2,
          align: 'right',
          itemRender: ({ data }) => (
            <>{Math.round(data.reduce((sum, item) => sum + item.values.amount, 0) / (data.length || 1)).toLocaleString()}</>
          ),
        },
      ],
    },
    // 2행: 합계
    {
      className: 'summary-total-row',
      style: { fontWeight: 'bold' },
      columns: [
        { columnIndex: 0, colSpan: 2, align: 'center', itemRender: () => <>합계</> },
        {
          columnIndex: 2,
          align: 'right',
          itemRender: ({ data }) => (
            <>{data.reduce((sum, item) => sum + item.values.amount, 0).toLocaleString()}</>
          ),
        },
      ],
    },
  ],
};

<BGrid
  summary={summary}
  summaryRowHeight={32} // 또는 (rowIndex) => (rowIndex === 1 ? 36 : 28)
  {...props}
/>
```

---

## 주요 옵션 및 속성

### 최상위 Summary 옵션 (`summary`)

| 속성 | 타입 | 설명 |
|---|---|---|
| `position` | `'top' \| 'bottom'` | 요약 행을 데이터 영역 위(`top`) 또는 아래(`bottom`)에 배치합니다. |
| `rows` | `BGridSummaryRow<T>[]` | 요약 행 목록입니다. 여러 줄의 요약행을 정의할 때 사용합니다. (권장) |
| `columns` | `BGridSummaryColumn<T>[]` | 단일 요약행을 위한 하위 호환용 간편 속성입니다. |

### 요약 행 옵션 (`BGridSummaryRow<T>`)

| 속성 | 타입 | 설명 |
|---|---|---|
| `columns` | `BGridSummaryColumn<T>[]` | 해당 행에 표시될 컬럼 요약 셀 정의 배열입니다. |
| `className` | `string` | 요약 `<tr>` 요소에 적용할 커스텀 CSS 클래스명입니다. |
| `style` | `CSSProperties` | 요약 `<tr>` 요소에 적용할 인라인 스타일입니다. |

### 요약 셀 옵션 (`BGridSummaryColumn<T>`)

| 속성 | 타입 | 설명 |
|---|---|---|
| `columnIndex` | `number` | 요약 셀이 시작될 컬럼의 0 기반 인덱스입니다. |
| `colSpan` | `number` | 요약 셀이 가로로 차지할 컬럼 수입니다. |
| `align` | `'left' \| 'center' \| 'right'` | 요약 셀 내부 텍스트 정렬입니다. |
| `className` | `string` | 요약 셀(`<td>`)에 적용할 커스텀 클래스명입니다. |
| `style` | `CSSProperties` | 요약 셀(`<td>`)에 적용할 인라인 스타일입니다. |
| `itemRender` | `(props) => ReactNode` | 요약 셀 내용을 렌더링하는 함수입니다. `{ column, columnIndex, rowIndex, data }` 인자가 제공됩니다. |

### 요약 영역 높이 설정

| 최상위 Prop | 타입 | 설명 |
|---|---|---|
| `summaryRowHeight` | `number \| ((rowIndex: number) => number)` | 요약 행의 개별 높이를 지정합니다. 숫자로 지정하면 모든 요약행에 균등 적용되며, 함수로 지정하면 행 인덱스(`rowIndex`)별로 서로 다른 높이를 적용할 수 있습니다. (기본값: 30px) |
| `summaryHeight` | `number` | 전체 요약 영역 높이를 고정할 때 사용합니다. 다중 요약행에서는 행 개수에 맞춰 균등 분할됩니다. |

---

## 팁 & 주의사항

1. **데이터 참조 (`data`)**: `itemRender`의 `data`는 `BGridDataItem<T>[]` 타입이므로 실제 데이터 필드는 `item.values`를 통해 안전하게 접근합니다.
2. **단일행 하위 호환성**: 기존의 `summary={{ position: 'bottom', columns: [...] }}` 형태도 100% 동일하게 동작합니다. 신규 코드에서는 다중행 확장이 용이한 `rows: [...]` 형태를 권장합니다.
3. **빈 공간 테두리 처리**: 요약 컬럼으로 채워지지 않은 우측 여백 셀은 그리드에서 자동으로 비워지며 깔끔한 레이아웃을 위해 불필요한 테두리가 제거됩니다.
