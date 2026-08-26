---
title: "테마 및 스타일 커스터마이징 (Theming)"
description: "CSS 변수(--bgrid-*)를 오버라이드하여 라이트/다크 모드 및 기업 브랜드 컬러에 맞춘 커스텀 테마를 적용하는 방법을 학습합니다."
category: "styling-and-accessibility"
order: 3
locale: "ko"
canonicalPath: "/learn/theming"
demoId: "theming"
features: ["theming", "css-variables", "dark-mode", "custom-styles", "variant"]
relatedGuides: ["getting-started", "basic", "row-styling", "variant", "accessibility-and-keyboard"]
relatedApi: ["/api/props#variant", "/api/props#classname", "/api/props#style"]
lastReviewedAt: "2026-08-23"
indexable: true
draft: false
---

## 1. 개요 및 CSS 변수 아키텍처

BeautifulGrid는 현대적인 **CSS 커스텀 프로퍼티(CSS Variables)** 설계를 따르고 있어, 별도의 복잡한 테마 프로바이더나 무거운 CSS-in-JS 런타임 없이도 순수 CSS 변수 오버라이드만으로 폰트, 배경색, 테두리 색상, 활성 행 하이라이트 색상을 즉시 변경할 수 있습니다.

위 라이브 데모에서 **기본 / 브랜드 / 다크**를 전환해 보세요. 데이터와 컬럼 설정은 그대로 유지되고 Grid 루트의 클래스와 `--bgrid-*` 변수만 바뀝니다. 색상 칩에는 현재 적용된 핵심 변수와 실제 값이 표시되며, 셀을 클릭하거나 행에 마우스를 올리면 선택·hover 상태까지 함께 비교할 수 있습니다.

테마는 Grid 전체의 시각 토큰을 바꾸는 작업이고, 스타일 커스터마이징은 `itemRender`의 상태 뱃지처럼 업무 UI를 추가하는 작업입니다. 두 방식 모두 Grid 인스턴스의 `className` 아래로 범위를 한정하면 다른 Grid에는 영향을 주지 않습니다.

---

## 2. 주요 CSS 변수 계약 명세

```css
/* 데이터그리드 컨테이너 또는 글로벌 CSS에서 오버라이드 가능 */
[role='grid'] {
  /* 폰트 및 타이포그래피 */
  --bgrid-font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --bgrid-font-size: 13px;

  /* 테두리 및 구분선 */
  --bgrid-border-color-base: #cbd5e1;
  --bgrid-border-color-light: #dbe2ea;
  --bgrid-border-color-subtle: #eef2f6;
  --bgrid-header-separator-color: #94a3b8;

  /* 헤더 스타일 */
  --bgrid-header-bg: #f8fafc;
  --bgrid-header-color: #1e293b;

  /* 바디 행 및 셀 */
  --bgrid-body-bg: #ffffff;
  --bgrid-body-color: #0f172a;
  --bgrid-body-odd-bg: #f8fafc;
  --bgrid-body-hover-bg: #f1f5f9;
  --bgrid-body-hover-odd-bg: #e9eef5;
  --bgrid-body-active-bg: #e2e8f0;

  /* 별도 오버레이로 그려지는 셀 선택 범위 */
  --bgrid-cell-selected-bg: var(--bgrid-body-active-bg);
  --bgrid-cell-selected-overlay-opacity: 0.72;
  --bgrid-cell-selected-border-color: rgba(37, 99, 235, 0.78);
  --bgrid-cell-selected-border-width: var(--bgrid-active-cell-ring-width);

  /* 선택 범위 안의 포커스 셀 */
  --bgrid-active-cell-bg: #ffffff;
  --bgrid-active-cell-ring-color: #2563eb;
  --bgrid-active-cell-ring-width: 2px;

  /* 선택 범위의 컬럼 헤더와 라인넘버 축 */
  --bgrid-selection-axis-bg: #dbeafe;
  --bgrid-selection-axis-color: #2563eb;
  --bgrid-selection-axis-border-color: #2563eb;

  /* 값이 변경된 셀 */
  --bgrid-cell-edited-bg: #fff7ed;
  --bgrid-cell-edited-color: #c2410c;
  --bgrid-cell-edited-border-color: #fdba74;
  --bgrid-cell-value-changed-bg: #fff7ed;
  --bgrid-cell-value-changed-color: #c2410c;
  --bgrid-cell-value-changed-border-color: #fdba74;

  /* 포인트 컬러 (선택선, 활성 뱃지) */
  --bgrid-primary-color: #2563eb;

  /* 행 순서 재배치 모션과 preview */
  --bgrid-row-reorder-duration: 150ms;
  --bgrid-row-reorder-easing: cubic-bezier(0.2, 0, 0, 1);
  --bgrid-row-reorder-guide-color: #2563eb;
  --bgrid-row-reorder-preview-bg: #e2e8f0;
  --bgrid-row-reorder-preview-shadow: 0 8px 24px rgba(15, 23, 42, 0.18);

  /* 정렬 및 필터 Toolbox */
  --bgrid-toolbox-bg: #ffffff;
  --bgrid-toolbox-color: #334155;
  --bgrid-toolbox-muted-color: #64748b;
  --bgrid-toolbox-control-bg: #ffffff;
  --bgrid-toolbox-control-color: #334155;
  --bgrid-toolbox-control-border-color: #cbd5e1;
  --bgrid-toolbox-control-placeholder-color: #94a3b8;
  --bgrid-toolbox-hover-bg: #f1f5f9;
  --bgrid-toolbox-active-bg: #dbeafe;
  --bgrid-toolbox-danger-color: #dc2626;
  --bgrid-toolbox-danger-bg: #fef2f2;
  --bgrid-toolbox-button-bg: #f8fafc;
  --bgrid-toolbox-primary-hover-color: #1d4ed8;
  --bgrid-toolbox-primary-contrast-color: #ffffff;
  --bgrid-toolbox-notice-bg: #f8fafc;
  --bgrid-toolbox-scroll-thumb-bg: #b8c2d1;
  --bgrid-toolbox-scroll-track-bg: #f1f5f9;
  --bgrid-toolbox-focus-ring-color: #bfdbfe;

  /* 검색 하이라이트와 셀 컨텍스트 메뉴 */
  --bgrid-search-bg: #ffffff;
  --bgrid-search-color: #334155;
  --bgrid-search-control-bg: #f8fafc;
  --bgrid-search-button-hover-bg: #f1f5f9;
  --bgrid-search-match-bg: rgba(250, 204, 21, 0.28);
  --bgrid-search-match-border-color: #ca8a04;
  --bgrid-search-current-bg: rgba(249, 115, 22, 0.3);
  --bgrid-search-current-border-color: #f97316;
  --bgrid-context-menu-bg: #ffffff;
  --bgrid-context-menu-color: #334155;
  --bgrid-context-menu-border-color: #cbd5e1;
  --bgrid-context-menu-hover-bg: #f1f5f9;
}
```

편집 저장 또는 다중 셀 붙여넣기가 직접 발생한 셀에는 `bgrid-cell-edited`가 적용됩니다. 변경된 데이터 key를 공유하는 모든 셀에는 `bgrid-cell-value-changed`가 적용되므로 동일 key·다른 id 컬럼도 값 변경 상태를 표시합니다. 일반 선택 셀에는 선택 테마가 우선하며, 선택을 이동하면 변경 셀 배경과 inset border가 표시됩니다.

셀 선택은 각 셀의 border를 변경하지 않고 포인터 이벤트를 통과시키는 별도 오버레이 사각형으로 표시합니다. 틀고정 행·컬럼을 가로지르는 범위는 패널별 조각으로 나누되 전체 선택의 바깥쪽 외곽선만 표시하므로, 병합셀이 일부 포함되어도 선택 영역은 직사각형을 유지하고 스크롤 위치와 동기화됩니다. 배경은 `--bgrid-cell-selected-bg`, 투명도는 `--bgrid-cell-selected-overlay-opacity`, 외곽선은 `--bgrid-cell-selected-border-*` 변수로 조정합니다.

선택 영역 안의 포커스 셀은 선택 배경 대신 `--bgrid-active-cell-bg`를 사용합니다. 단일 셀 선택에서는 `--bgrid-active-cell-ring-*`으로 지정한 inset 링을 표시하지만, 다중 셀 선택에서는 포커스 셀의 개별 링을 제거하고 전체 선택 범위 외곽선만 표시합니다. 외곽선 두께는 `--bgrid-cell-selected-border-width`로 조정하며 기본값은 단일 셀 포커스 링 두께와 같습니다.

활성 셀이나 다중 선택 범위에 포함된 컬럼 헤더에는 `bgrid-column-axis-active`, 라인넘버에는 `bgrid-row-axis-active`가 자동으로 적용됩니다. 배경·글자·강조선 색상은 `--bgrid-selection-axis-*` 변수로 조정할 수 있으며 frozen 컬럼과 일반 컬럼에 동일하게 적용됩니다.

정렬·필터 Toolbox, editor plugin과 셀 컨텍스트 메뉴는 문서 최상위 포털인 Grid 인스턴스별 floating root를 공유합니다. 해당 Grid의 `--bgrid-*` 변수가 포털에 자동으로 전달되므로 컨테이너에 지정한 테마가 팝오버와 메뉴에도 동일하게 적용됩니다. 검색 입력은 Grid 안에 배치되며 `--bgrid-search-*`, 검색 셀은 `--bgrid-search-match-*`와 `--bgrid-search-current-*`로 조정합니다.

---

## 3. 실무 완성형 예제: 다크 테마(Dark Theme) 적용

```tsx
import React from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

export default function DarkThemeGrid() {
  const columns: BGridColumn<any>[] = [
    { key: 'id', label: 'ID', width: 70, align: 'center' },
    { key: 'name', label: '서비스명', width: 180 },
    { key: 'status', label: '상태', width: 100, align: 'center' },
  ];

  const data: BGridDataItem<any>[] = [
    { values: { id: 1, name: 'Auth Gateway', status: 'Healthy' } },
    { values: { id: 2, name: 'Payment Worker', status: 'Healthy' } },
  ];

  return (
    <div style={{ padding: 16, backgroundColor: '#0f172a', borderRadius: 8 }}>
      <style>{`
        .custom-dark-grid {
          --bgrid-border-color-base: #334155;
          --bgrid-border-color-light: #475569;
          --bgrid-border-color-subtle: #1e293b;
          --bgrid-header-separator-color: #475569;
          --bgrid-header-bg: #1e293b;
          --bgrid-header-color: #f8fafc;
          --bgrid-body-bg: #0f172a;
          --bgrid-body-color: #e2e8f0;
          --bgrid-body-odd-bg: #111c2f;
          --bgrid-body-hover-bg: #1e293b;
          --bgrid-body-hover-odd-bg: #263449;
          --bgrid-body-active-bg: #334155;
          --bgrid-primary-color: #38bdf8;
        }
      `}</style>

      <BGrid
        className="custom-dark-grid"
        width={450}
        height={180}
        columns={columns}
        data={data}
        rowKey="id"
      />
    </div>
  );
}
```
