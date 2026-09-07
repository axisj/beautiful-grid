---
title: "컬럼 숨김과 복구 (Column Visibility)"
description: "헤더 툴박스에서 컬럼을 숨기고, 다른 컬럼 메뉴에서 다시 표시하거나 전체 복구하는 방법을 설명합니다."
category: "interaction"
order: 24
locale: "ko"
canonicalPath: "/learn/column-visibility"
demoId: "column-visibility"
features: ["columnVisibility", "hideable", "controlled-state", "user-customization"]
relatedGuides: ["data-and-columns", "sorting-filtering", "column-groups", "frozen-columns"]
relatedApi: ["/api/props#columnvisibility", "/api/props#bgridcolumnvisibilityoptions", "/api/props#bgridcolumn-hideable"]
sinceVersion: "1.0.6"
lastReviewedAt: "2026-09-07"
indexable: true
draft: false
---

## 기본 사용법

컬럼 숨김과 복구 기능은 **BeautifulGrid 1.0.6부터 지원**합니다.

`columnVisibility`를 켜면 각 컬럼 툴박스에 **이 컬럼 숨기기**가 추가됩니다. 숨긴 컬럼은 남아 있는 컬럼의 메뉴에서 다시 표시할 수 있습니다. 마지막 표시 컬럼은 숨길 수 없습니다. 위 라이브 데모처럼 컬럼의 `toolbox`와 `filter`를 함께 설정하면 같은 메뉴에서 정렬, 필터, 숨김을 모두 사용할 수 있습니다.

```tsx
<BGrid
  width={800}
  height={420}
  columns={columns}
  data={data}
  columnVisibility
/>
```

## 숨김 상태 저장하기

사용자 설정을 저장하려면 컬럼마다 고유한 `id`를 지정하고 controlled 상태를 사용합니다.

```tsx
const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>(['owner']);

<BGrid
  width={800}
  height={420}
  columns={columns}
  data={data}
  columnVisibility={{
    hiddenColumnIds,
    onChange: setHiddenColumnIds,
  }}
/>
```

특정 컬럼을 사용자가 숨기지 못하게 하려면 `hideable: false`를 설정합니다. API로 전달한 숨김 상태는 정렬·필터 조건을 제거하지 않으며, 컬럼을 다시 표시하면 이전 조건이 그대로 나타납니다.

```tsx
const columns = [
  { id: 'orderNo', key: 'orderNo', label: '주문 번호', width: 120, hideable: false },
  { id: 'customer', key: 'customer', label: '고객사', width: 160 },
  { id: 'owner', key: 'owner', label: '담당자', width: 120 },
];
```

컬럼이 숨겨진 동안에는 드래그 컬럼 재배치가 비활성화됩니다. 모든 컬럼을 다시 표시하면 `columnSortable` 설정이 자동으로 복원됩니다.
