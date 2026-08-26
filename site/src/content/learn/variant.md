---
title: '세로 구분선 (Variant)'
description: 'variant prop으로 본문과 요약 셀의 세로 구분선 표시 여부를 전환하고 적용 범위를 확인합니다.'
category: 'styling-and-accessibility'
order: 4
locale: 'ko'
canonicalPath: '/learn/variant'
demoId: 'variant'
features: ['variant', 'default', 'vertical-bordered', 'borders', 'summary']
relatedGuides: ['theming', 'row-styling', 'summary', 'accessibility-and-keyboard']
relatedApi: ['/api/props#variant']
lastReviewedAt: '2026-08-19'
indexable: true
draft: false
---

## 1. `variant`가 바꾸는 것

`BGrid`의 `variant` prop은 그리드 본문과 Summary 셀의 세로 테두리 표현을 선택합니다. 데이터, 컬럼, 정렬, 선택 같은 동작은 바꾸지 않습니다.

| 값                  | 표현                                             | 권장 용도                                   |
| ------------------- | ------------------------------------------------ | ------------------------------------------- |
| `default`           | 본문 셀 사이의 세로 구분선을 생략한 기본 스타일  | 행 단위 탐색이 중심인 일반 목록             |
| `vertical-bordered` | 본문과 Summary의 각 셀 오른쪽에 세로 구분선 표시 | 열 경계를 빠르게 구분해야 하는 밀도 높은 표 |

값을 생략하면 `default`가 적용됩니다.

---

## 2. 라이브 예제

위의 선택 버튼으로 두 값을 전환해 본문과 하단 합계 행의 세로 구분선을 비교할 수 있습니다. 고정 컬럼을 함께 사용해도 같은 `variant`가 고정 영역과 스크롤 영역에 일관되게 적용됩니다.

핵심 설정은 다음과 같습니다.

```tsx
const [variant, setVariant] = useState<'default' | 'vertical-bordered'>('default');

<BGrid
  columns={columns}
  data={data}
  variant={variant}
  summary={{
    position: 'bottom',
    columns: summaryColumns,
  }}
/>;
```

`variant`는 그리드 셀의 세로 구분선 표시 방식이며, `scrollbar.variant`의 `native | classic | modern`과는 서로 다른 설정입니다. 스크롤바 모양은 [스크롤바 설정 가이드](/learn/scrollbar)를 참고하세요.

---

## 3. 테마와 함께 사용하기

`vertical-bordered`의 선 색상은 `--bgrid-border-color-light`를 사용하며, 값이 없으면 `--bgrid-border-color-base`로 대체됩니다. 서비스 테마에 맞춰 선 색상을 바꿀 때는 그리드 wrapper에서 CSS 변수를 재정의합니다.

```css
.report-grid {
  --bgrid-border-color-light: #cbd5e1;
}
```

선의 대비를 조정한 뒤에는 일반 행, hover/선택 상태, Summary 행에서 컬럼 경계를 충분히 구분할 수 있는지 함께 확인하세요.
