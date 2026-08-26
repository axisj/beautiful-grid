---
title: "컨테이너 리사이즈 대응 (DataGridContainer)"
description: "ResizeObserver로 그리드 컨테이너의 실제 크기를 측정해, 레이아웃이 커지거나 작아져도 정확한 크기로 렌더링합니다."
category: "getting-started"
order: 3
locale: "ko"
canonicalPath: "/learn/container-resize"
demoId: "container-resize"
features: ["resize-observer", "responsive-layout", "container", "absolute-positioning"]
relatedGuides: ["getting-started", "basic", "virtual-scroll"]
relatedApi: ["/api/props#width", "/api/props#height"]
lastReviewedAt: "2026-08-18"
indexable: true
draft: false
---

## 1. 그리드 크기는 화면이 아니라 컨테이너에서 측정합니다

업무 화면은 사이드 패널, 탭, 분할 화면처럼 실행 중에 폭과 높이가 바뀌는 경우가 많습니다. 그리드에 최초의 `window` 크기나 고정 값을 전달하면 화면이 넓어질 때는 문제가 드러나지 않아도, 좁아질 때 이전 크기가 남아 가로 스크롤과 레이아웃이 어긋날 수 있습니다.

`useContainerSize`는 `ResizeObserver`로 **그리드를 담는 요소의 실제 콘텐츠 영역**을 관찰합니다. 측정된 `width`, `height`를 `BGrid`에 전달하면 부모 레이아웃의 확대·축소 모두에 맞춰 다시 렌더링됩니다.

---

## 2. `DataGridContainer`가 필요한 이유

`DataGridContainer`는 `position: relative`인 측정 기준점입니다. 그 안의 DataGrid 루트는 `position: absolute; inset: 0`으로 배치합니다. 따라서 컨테이너는 일반 레이아웃 흐름 안에서 정확한 크기를 갖고, 그리드는 그 측정 영역을 빈틈없이 채웁니다.

특히 flex나 grid 레이아웃에서는 그리드를 담는 칸에 `min-width: 0`을 주어야 작은 폭으로 줄어들 수 있습니다. 컨테이너에는 명시적인 높이도 필요합니다. DataGrid는 그 높이를 기준으로 보이는 행 수와 가상 스크롤 범위를 계산합니다.

---

## 3. 적용 순서

1. 그리드 영역을 `DataGridContainer`로 감싸고 높이를 정합니다.
2. `useContainerSize`에 컨테이너 ref를 전달합니다.
3. 반환된 `width`, `height`를 `BGrid`에 전달합니다.
4. 부모가 flex/grid라면 그리드 칸에 `minWidth: 0` 또는 CSS `min-width: 0`을 적용합니다.

위 실행 예제에서 사이드 패널을 열고 닫아 보세요. 컨테이너 폭이 커질 때뿐 아니라 작아질 때도 그리드가 즉시 정확한 폭으로 맞춰집니다.

---

## 4. 피해야 할 방식

- `window.innerWidth`만 한 번 읽어 그리드 크기로 사용하기
- 컨테이너의 높이 없이 `height="100%"`만 전달하기
- flex 항목에 기본 `min-width: auto`를 둬서 내용이 줄어들지 못하게 하기
- 그리드 밖의 임의 DOM 크기를 측정해 여러 그리드에 공통으로 전달하기

각 그리드는 자신을 감싸는 컨테이너를 개별 관찰하는 편이 가장 예측 가능하고, 분할 화면·접이식 패널·반응형 레이아웃에서도 안정적입니다.
