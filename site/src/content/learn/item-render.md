---
title: '강력한 셀 확장 (itemRender)'
description: 'itemRender로 Canvas 차트, 설비 부하 히트맵, 상태 게이지와 행 단위 액션을 한 Grid에 구성하는 실전 패턴을 설명합니다.'
category: 'data-and-columns'
order: 3
locale: 'ko'
canonicalPath: '/learn/item-render'
demoId: 'item-render'
features: ['itemRender', 'canvas', 'custom-cell', 'react-component', 'accessibility']
relatedGuides: ['data-and-columns', 'virtual-scroll', 'search', 'accessibility-and-keyboard']
relatedApi:
  ['/api/props#bgridcolumn-itemrender', '/api/props#bgriditemrenderprops', '/api/props#bgridcolumn-getclipboardtext']
lastReviewedAt: '2026-08-24'
indexable: true
draft: false
---

## 텍스트 셀을 작은 애플리케이션으로 확장하기

`itemRender`는 값을 문자열로 포맷하는 함수에 머물지 않습니다. 현재 행의 `values`, 셀의 `value`, 행·컬럼 인덱스와 편집 제어 함수를 받아 **임의의 React 노드**를 반환하므로, 보통의 formatter 기반 Grid에서 만들기 까다로운 시각화와 상호작용을 셀 안에 배치할 수 있습니다.

위 물류 관제 예제는 동일한 행 데이터에서 다음 UI를 렌더링합니다.

| 셀          | 구현                                | 일반 텍스트 셀보다 어려운 점                           |
| ----------- | ----------------------------------- | ------------------------------------------------------ |
| 물류 거점   | 아이콘, 이름, 코드가 결합된 복합 셀 | 한 값이 아니라 여러 행 필드를 함께 사용합니다.         |
| 처리량 추이 | 고해상도 Canvas 스파크라인          | 배열을 좌표로 변환하고 기기 픽셀 비율에 맞춰 그립니다. |
| 설비 부하   | 12구간 Canvas 히트맵                | 수치 구간에 따라 색상과 블록을 동적으로 계산합니다.    |
| 출고 SLA    | CSS 원형 게이지와 상태 텍스트       | 수치, 상태, 접근성 값을 하나의 컴포넌트로 묶습니다.    |
| 이상 대응   | 행 상태를 변경하는 버튼             | 셀 클릭과 버튼 클릭의 이벤트 경계를 관리합니다.        |

`이상 거점만 보기`를 누르면 React 상태로 표시 행을 좁힐 수 있고, `알림 N건 확인`은 해당 행만 immutable하게 갱신합니다. Canvas는 지속적으로 애니메이션하지 않고 데이터가 바뀔 때만 다시 그립니다.

## 핵심 패턴: 콜백에서 컴포넌트를 반환합니다

`itemRender` 자체에서 Hook을 호출하지 말고, Hook을 사용하는 React 컴포넌트를 반환하세요. 이렇게 하면 React의 Hook 규칙을 지키면서 Canvas 수명주기와 memoization을 독립적으로 관리할 수 있습니다.

```tsx
const SparklineCanvas = React.memo(function SparklineCanvas({ values }: { values: number[] }) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) return;

    // devicePixelRatio를 반영한 뒤 values를 좌표로 변환해 그립니다.
  }, [values]);

  return <canvas ref={canvasRef} role='img' aria-label={`처리량 ${values.join(', ')}`} />;
});

const columns: BGridColumn<FulfillmentCenter>[] = [
  {
    key: 'throughput',
    label: '시간당 처리량 추이',
    width: 205,
    itemRender: ({ values }) => <SparklineCanvas values={values.throughput} />,
    getClipboardText: ({ values }) => `${values.throughput.at(-1)} orders/h`,
  },
];
```

실제 Canvas 좌표 계산, 색상 구간, 액션 버튼까지 포함한 전체 구현은 이 페이지의 소스 패널에서 확인할 수 있습니다.

## 전달되는 렌더링 컨텍스트

| 속성                                       | 활용 예                                                                  |
| ------------------------------------------ | ------------------------------------------------------------------------ |
| `value`                                    | 현재 `column.key`가 가리키는 값으로 단일 차트나 게이지를 만듭니다.       |
| `values`                                   | 같은 행의 여러 필드를 조합해 이름+코드, 값+상태 같은 복합 셀을 만듭니다. |
| `item`                                     | `values`와 함께 행의 `status`, `checked` 같은 Grid 상태를 확인합니다.    |
| `index`, `columnIndex`                     | 시각화의 접근성 이름이나 셀별 진단 정보에 위치를 포함합니다.             |
| `handleSave`, `handleCancel`, `handleMove` | `editable` 컬럼의 커스텀 편집 흐름을 제어합니다.                         |

표시 컴포넌트와 편집 UI의 역할은 다릅니다. 평상시의 복합 표시는 `itemRender`, 입력과 저장 수명주기는 `editor` 또는 편집 제어 함수로 분리하는 편이 명확합니다.

## Canvas와 가상 스크롤을 함께 쓸 때

BeautifulGrid의 가상 스크롤은 현재 뷰포트에 필요한 행만 DOM에 유지합니다. 따라서 Canvas 셀도 화면에 들어올 때 mount되고 벗어나면 unmount될 수 있습니다.

- 좌표 변환이나 색상 구간처럼 반복되는 계산은 렌더 전에 가공하거나 작은 컴포넌트 안에 한정합니다.
- 컬럼 배열은 `useMemo`, 이벤트 함수는 `useCallback`, 무거운 셀 컴포넌트는 `React.memo`를 사용합니다.
- 지속적인 `requestAnimationFrame`보다 데이터가 변경될 때 한 번 다시 그리는 방식을 우선합니다.
- Canvas의 CSS 크기와 실제 픽셀 크기를 `devicePixelRatio`에 맞춰 선명도를 유지합니다.
- 행 높이는 콘텐츠에 맞게 고정하고 목표 데이터 규모에서 실제 스크롤을 확인합니다.

Canvas가 많다고 항상 느린 것은 아니지만, 셀마다 별도 그래픽 컨텍스트가 생깁니다. 수천 개 Canvas를 한 번에 DOM에 두는 구조가 아니라 가상 스크롤 범위 안에서 필요한 셀만 mount되는지 확인해야 합니다.

## 검색·복사·접근성은 별도로 정의합니다

시각화된 DOM이나 Canvas 픽셀은 Grid의 검색·복사 문자열이 아닙니다. 화면 표시와 데이터 의미가 다르면 다음 계약을 함께 구성하세요.

- `getClipboardText`: 배열이나 객체 대신 사용자가 이해할 복사 문자열을 반환합니다.
- `getSearchText`: 검색 UI를 사용하는 경우 차트가 의미하는 값이나 라벨을 검색 문자열로 제공합니다.
- Canvas에 `role="img"`와 데이터 의미를 요약한 `aria-label`을 제공합니다.
- 상태는 색상만으로 구분하지 말고 `정상`, `관찰`, `대응 필요` 같은 텍스트를 함께 표시합니다.
- 셀 내부 버튼에는 구체적인 `aria-label`을 붙이고, 행 클릭을 함께 실행하지 않을 때 `event.stopPropagation()`을 호출합니다.

## 적합한 사용 사례와 경계

`itemRender`가 특히 유용한 화면은 운영 관제, 생산 설비 상태, 포트폴리오 변화, 품질 검사 결과, 재고 위험도처럼 **행 비교와 작은 시각화가 동시에 중요한 Grid**입니다.

반대로 여러 셀을 연결한 대형 차트, 자유 배치 대시보드, 고주사율 애니메이션은 Grid 셀보다 독립된 차트 영역에 두는 편이 낫습니다. `itemRender`의 강점은 각 행의 문맥을 잃지 않으면서 필요한 정보 밀도와 조작성을 높이는 데 있습니다.
