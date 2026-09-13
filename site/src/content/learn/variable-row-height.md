---
title: "가변 행 높이 (Variable Row Height)"
description: "getRowHeight로 데이터에 따라 행 높이를 지정하면서 가상 스크롤 성능을 유지하는 방법을 알아봅니다."
category: "data-and-columns"
order: 8
locale: "ko"
canonicalPath: "/learn/variable-row-height"
demoId: "variable-row-height"
features: ["getRowHeight", "variable-row-height", "virtual-scrolling", "performance", "frozen-row"]
relatedGuides: ["basic", "virtual-scroll", "frozen-columns", "row-styling"]
relatedApi: ["/api/props#getrowheight", "/api/props#itemheight", "/api/props#itempadding"]
lastReviewedAt: "2026-09-13"
indexable: true
draft: false
---

## 데이터에 따라 행 높이 지정하기

`getRowHeight(row, index)`는 현재 표시 순서의 행 데이터와 인덱스를 받아 전체 행 높이를 픽셀로 반환합니다. 위 예제에서는 마일스톤은 52px, 업데이트는 40px, 일반 메모는 29px로 표시합니다.

```tsx
const getRowHeight = React.useCallback((row: ProjectActivity) => {
  if (row.kind === 'milestone') return 52;
  if (row.kind === 'update') return 40;
  return 29;
}, []);

<BGrid
  data={activities}
  columns={columns}
  getRowHeight={getRowHeight}
/>
```

콜백은 `BGridDataItem` 래퍼가 아니라 `item.values`를 받습니다. 정렬이나 필터링이 적용되면 `index`는 변경된 표시 순서를 기준으로 합니다.

## 성능 특성

BeautifulGrid는 표시 데이터나 `getRowHeight` 참조가 바뀔 때 높이와 누적 오프셋을 한 번 계산합니다. 스크롤 중에는 캐시된 값을 사용하고 이진 탐색으로 시작 행을 찾으므로 콜백이 반복 실행되지 않습니다. 불필요한 캐시 재생성을 피하려면 예제처럼 `useCallback`으로 함수 참조를 안정적으로 유지하세요.

콘텐츠를 DOM에서 측정하는 자동 높이는 지원하지 않습니다. `getRowHeight`를 생략하거나 0, 음수, `NaN`, `Infinity`를 반환하면 `itemHeight + itemPadding * 2`가 fallback으로 사용됩니다.
