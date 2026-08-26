---
title: "피벗 크로스탭 (Pivot Table)"
description: "행 축, 컬럼 축과 집계 값을 BGridPivotOptions로 구성해 교차 집계 결과를 표시하는 방법을 학습합니다."
category: "advanced"
order: 3
locale: "ko"
canonicalPath: "/learn/pivot"
demoId: "pivot"
features: ["pivot", "rows", "columns", "values", "aggregate"]
relatedGuides: ["getting-started", "basic", "summary", "column-groups"]
relatedApi: ["/api/props#pivot", "/api/props#columns", "/api/props#data"]
lastReviewedAt: "2026-08-17"
indexable: true
draft: false
---

## Pivot 구성

피벗은 일반 `columns`를 중첩해서 만드는 기능이 아닙니다. 원본 그리드의 `columns`와 `data`를 전달한 뒤, 별도의 `pivot` 객체에 행 축·컬럼 축·집계 값을 정의합니다.

```tsx
const pivot: BGridPivotOptions<SalesRow> = {
  rows: [
    { key: 'region', label: 'Region', width: 120 },
    { key: 'product', label: 'Product', width: 140 },
  ],
  columns: [
    { key: 'quarter', label: 'Quarter', width: 110 },
  ],
  values: [
    {
      key: 'sales',
      label: 'Sales',
      width: 120,
      align: 'right',
      aggregate: 'sum',
    },
  ],
  emptyValue: 0,
};

<BGrid<SalesRow> columns={columns} data={data} pivot={pivot} {...sizeProps} />
```

`aggregate`는 `'sum' | 'count' | 'avg' | 'min' | 'max' | 'first'` 중 하나이거나 사용자 정의 함수입니다. 사용자 함수는 대상 값, 원본 `BGridDataItem`, 현재 행·컬럼 축 값과 `BGridPivotValue`를 받습니다.

## 렌더링과 복사

각 value에는 `itemRender`와 `getClipboardText`를 지정할 수 있습니다. 두 콜백 모두 일반 셀 정보뿐 아니라 `sourceItems`, `rowValues`, `columnValues`, `pivotValue`, `aggregate` 컨텍스트를 제공합니다. 화면의 통화 포맷과 클립보드 문자열을 같은 규칙으로 맞추려면 두 콜백을 함께 구성하세요.

피벗이 활성화되면 표시 컬럼과 행은 축 조합으로 다시 만들어집니다. 행 선택, 정렬, Frozen 범위를 함께 사용할 경우 위 라이브 데모처럼 실제 조합을 브라우저에서 검증하는 것이 안전합니다.
