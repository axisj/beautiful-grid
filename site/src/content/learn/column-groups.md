---
title: '다단 그룹 헤더 (Column Groups)'
description: '컬럼 ID를 참조하는 트리로 3단 이상의 그룹 헤더를 만들고 고정 컬럼 경계에서도 안전하게 사용하는 방법을 학습합니다.'
category: 'advanced'
order: 4
locale: 'ko'
canonicalPath: '/learn/column-groups'
demoId: 'column-groups'
features: ['columnGroups', 'BGridColumnGroupNode', 'nested-header', 'frozenColumnIndex', 'headerHeight']
relatedGuides: ['getting-started', 'basic', 'pivot', 'frozen-columns']
relatedApi: ['/api/props#columngroups', '/api/props#headerheight']
lastReviewedAt: '2026-08-19'
indexable: true
draft: false
---

## 트리 기반 그룹 정의

`columns`는 렌더링 순서를 결정하는 평면 배열로 유지하고, `columnGroups`가 컬럼 ID를 참조하는 트리를 만듭니다. 그룹 안에는 컬럼 ID와 다른 그룹을 깊이 제한 없이 배치할 수 있습니다.

```tsx
const columns: BGridColumn<Order>[] = [
  { id: 'orderNo', key: 'orderNo', label: '주문 번호', width: 140 },
  { id: 'customerName', key: 'customerName', label: '고객명', width: 150 },
  { id: 'region', key: 'region', label: '지역', width: 100 },
  { id: 'productName', key: 'productName', label: '상품', width: 170 },
];

const columnGroups: BGridColumnGroupNode[] = [
  {
    id: 'order-overview',
    label: '주문 현황',
    children: [
      'orderNo',
      {
        id: 'customer',
        label: '고객 정보',
        children: [
          {
            id: 'customer-detail',
            label: '고객 상세',
            children: ['customerName', 'region'],
          },
          'productName',
        ],
      },
    ],
  },
];

<BGrid columns={columns} columnGroups={columnGroups} headerHeight={88} {...props} />;
```

## 헤더 셀 스타일링

leaf 컬럼은 `headerClassName` 또는 `headerStyle`, 그룹 노드는 `className` 또는 `headerStyle`로 각각 스타일링할 수 있습니다. 클래스 방식은 hover 상태나 테마처럼 여러 규칙을 함께 관리할 때 적합하고, `headerStyle`은 한 셀의 간단한 동적 스타일을 지정할 때 유용합니다. 고정 컬럼 영역에 복제되는 헤더에도 같은 클래스와 스타일이 적용됩니다.

```tsx
const columns: BGridColumn<Order>[] = [
  {
    id: 'total',
    key: 'total',
    label: '합계',
    width: 140,
    headerClassName: 'order-grid-header-total',
  },
];

const columnGroups: BGridColumnGroupNode[] = [
  {
    id: 'sales',
    label: '매출 정보',
    className: 'order-grid-header-sales',
    headerStyle: { color: '#166534' },
    children: ['total'],
  },
];

<BGrid className='order-grid' columns={columns} columnGroups={columnGroups} {...props} />;
```

```css
.order-grid .bgrid-head-group-cell.order-grid-header-sales {
  background-color: #dcfce7;
}

.order-grid .bgrid-head-cell.order-grid-header-total {
  --bgrid-header-hover-bg: #fef08a;

  background-color: #fef9c3;
  color: #854d0e;
}
```

`headerAlign`과 `headerStyle.textAlign`을 모두 지정하면 정렬 전용 속성인 `headerAlign`이 우선합니다. 정렬 가능한 leaf 헤더의 hover 배경은 셀 클래스에서 `--bgrid-header-hover-bg`를 재정의할 수 있습니다.

## 컬럼 `key`와 `id`의 차이

`key`와 `id`는 비슷해 보이지만 담당하는 역할이 다릅니다.

- `key`: `item.values`에서 셀 값을 읽을 데이터 경로입니다. 최상위 필드는 문자열(`'status'`), 중첩 필드는 문자열 배열(`['customer', 'address', 'city']`)로 지정합니다.
- `id`: 그리드가 컬럼을 구분하는 안정적인 고유 식별자입니다. `columnGroups`의 leaf 참조와 정렬·필터 상태를 연결할 때 사용하며, 실제 데이터 값을 읽는 경로에는 관여하지 않습니다.

따라서 같은 데이터 필드를 서로 다른 방식으로 보여 주는 컬럼은 `key`가 같아도 각각 다른 `id`를 가질 수 있습니다. 반대로 `id`는 전체 컬럼에서 중복되지 않아야 합니다.

```tsx
const columns: BGridColumn<Order>[] = [
  { id: 'amount-raw', key: 'amount', label: '금액', width: 120 },
  { id: 'amount-with-tax', key: 'amount', label: '세금 포함 금액', width: 140 },
  {
    id: 'customer-city',
    key: ['customer', 'address', 'city'],
    label: '고객 도시',
    width: 120,
  },
];
```

`id`를 생략하면 라이브러리가 `key`를 직렬화해 내부 `columnId`를 만듭니다.

- `key: 'status'` → `key:string:status`
- `key: ['customer', 'name']` → `key:array:["customer","name"]`

`columnGroups`의 문자열 leaf는 원래 `key`가 아니라 이 최종 컬럼 ID를 참조합니다. 예를 들어 `{ key: 'status' }`처럼 `id`를 생략한 컬럼은 `children: ['key:string:status']`로 참조해야 하며, `children: ['status']`로는 찾을 수 없습니다. 자동 생성 형식에 의존하지 않도록 그룹에 포함할 컬럼에는 명시적인 `id`를 지정하는 방식을 권장합니다.

```tsx
const columns = [{ id: 'status', key: 'status', label: '상태', width: 100 }];

const columnGroups = [{ id: 'order-state', label: '주문 상태', children: ['status'] }];
```

여기서 그룹 노드의 `id: 'order-state'`는 그룹 자체를 식별하고, `children`의 `'status'`는 컬럼의 `id`를 가리킵니다.

## 행과 병합 계산

가장 깊은 그룹에 맞춰 헤더 행 수가 결정됩니다. 얕은 위치에서 끝나는 leaf 컬럼은 남은 행을 `rowSpan`으로 채우고, 그룹은 실제 포함 컬럼 수를 `colSpan`으로 사용합니다. 헤더 한 행당 22px 이상이 되도록 `headerHeight`를 지정하세요. 높이가 부족하면 개발 환경에서 경고합니다.

## 고정 컬럼 경계를 지나는 그룹

그룹이 `frozenColumnIndex` 경계를 지나도 별도 설정은 필요하지 않습니다. 같은 그룹 레이블이 고정 영역과 스크롤 영역에 각각 렌더링되고, 각 영역에 실제로 포함된 leaf 수로 `colSpan`이 계산됩니다. 위 라이브 데모는 `상품 상세` 그룹이 고정 경계를 지나는 사례를 포함합니다.

## 유효성 검사

다음 구성은 개발 환경에서 경고하고 안전한 1단 헤더로 대체합니다.

- 존재하지 않는 컬럼 ID
- 한 컬럼을 둘 이상의 위치에서 중복 참조
- 비어 있는 그룹 또는 중복 그룹 ID
- 실제 `columns` 순서와 다른 leaf 순서
- 중간 컬럼을 건너뛰는 비연속 그룹

`columnSortable`을 함께 사용하면 같은 부모 그룹에 직접 포함된 leaf끼리만 순서를 바꿀 수 있습니다. 그룹 자체 이동과 다른 부모 그룹으로의 이동은 차단됩니다. 제어형 컬럼 배열을 사용한다면 `onChangeColumns`에서 `info.columns`와 `info.columnGroups`를 함께 상태에 반영하세요.

## 기존 `columnsGroup` 호환

인덱스 범위 기반 `columnsGroup`은 기존 애플리케이션을 위해 계속 동작하지만 deprecated 상태입니다.

```tsx
<BGrid columns={columns} columnsGroup={[{ label: '문서 정보', groupStartIndex: 1, groupEndIndex: 3 }]} />
```

두 API를 함께 전달하면 `columnGroups`가 우선합니다. 신규 화면은 컬럼 순서 변경에 더 안전하고 임의 깊이를 지원하는 `columnGroups`를 사용하세요.
