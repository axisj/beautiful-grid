---
title: '마스터-디테일 (Master-Detail)'
description: '그리드 행을 펼쳐 중첩된 서브 그리드나 폼, 상세 뷰를 전체 너비로 표시하고 이벤트를 안전하게 격리하는 방법을 설명합니다.'
category: 'advanced'
order: 33
locale: 'ko'
canonicalPath: '/learn/master-detail'
demoId: 'master-detail'
features: ['master-detail', 'nested-grid', 'expandable-rows', 'virtual-scroll', 'accessibility']
relatedGuides: ['data-and-columns', 'tree-folding', 'variable-row-height', 'frozen-columns']
relatedApi: ['/api/props#masterdetail', '/api/props#rowkey']
sinceVersion: '1.15.0'
lastReviewedAt: '2026-09-17'
indexable: true
draft: false
---

## 행을 펼쳐 상세 뷰 표시하기

마스터-디테일 모드는 주문 목록 아래의 품목 내역, 고객 프로필 아래의 거래 기록처럼 각 행에 종속된 세부 정보나 중첩 `<BGrid>`를 표시할 때 사용합니다. 기존 `<BGrid>`의 `masterDetail` prop으로 활성화합니다.

고유 키 식별을 위해 `rowKey`가 반드시 지정되어야 합니다.

```tsx
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface OrderItem {
  itemCode: string;
  name: string;
  qty: number;
  price: number;
}

interface Order {
  orderId: string;
  customer: string;
  items: OrderItem[];
}

const columns: BGridColumn<Order>[] = [
  { id: 'orderId', key: 'orderId', label: '주문번호', width: 140 },
  { id: 'customer', key: 'customer', label: '고객명', width: 160 },
];

const data: BGridDataItem<Order>[] = [
  {
    values: {
      orderId: 'ORD-001',
      customer: 'Alice',
      items: [{ itemCode: 'ITEM-1', name: 'Keyboard', qty: 1, price: 120000 }],
    },
  },
];

<BGrid
  width={800}
  height={400}
  columns={columns}
  data={data}
  rowKey='orderId'
  masterDetail={{
    detailRowHeight: 180,
    detailRender: ({ item }) => (
      <div style={{ padding: 12 }}>
        <h4>주문 품목 ({item.values.items.length}건)</h4>
        {/* 임의의 리액트 컴포넌트 또는 중첩 BGrid 렌더링 */}
      </div>
    ),
  }}
/>;
```

`expandColumnId`를 생략하면 가장 앞쪽에 토글 버튼 전용 컬럼(`__bgrid_master_detail__`)이 자동으로 추가됩니다. 기존 컬럼 셀 내부에 토글 버튼을 배치하려면 해당 컬럼의 id를 `expandColumnId`로 지정합니다.

## 펼침 상태 제어 (Controlled & Uncontrolled)

비제어 모드에서는 `defaultExpandedRowKeys`로 초기 펼침 행을 지정합니다. 외부 상태로 제어하려면 `expandedRowKeys`와 `onExpandedRowKeysChange`를 함께 사용합니다.

```tsx
const [expandedRowKeys, setExpandedRowKeys] = useState<React.Key[]>(['ORD-001']);

<BGrid
  {...gridProps}
  rowKey='orderId'
  masterDetail={{
    expandedRowKeys,
    onExpandedRowKeysChange: (nextKeys, event) => {
      console.log('토글된 행:', event.rowKey, '펼침 여부:', event.expanded);
      setExpandedRowKeys(nextKeys);
    },
    detailRender: ({ item }) => <OrderDetailView order={item.values} />,
  }}
/>;
```

## 단일 및 다중 펼침 모드 (expandMode)

- `'multiple'` (기본값): 여러 행을 동시에 펼쳐서 비교하거나 확인할 수 있습니다.
- `'single'` (아코디언 모드): 새 행을 펼치면 이전에 펼쳐져 있던 다른 행이 자동으로 접힙니다.

```tsx
masterDetail={{
  expandMode: 'single',
  detailRender: ({ item }) => <OrderDetailView order={item.values} />,
}}
```

## 행별 펼침 조건 (hasDetail)

특정 행에 하위 데이터가 없는 경우 토글 버튼을 숨기거나 비활성화하려면 `hasDetail` 콜백을 정의합니다. `hasDetail`이 `false`를 반환하면 버튼 대신 정렬 간격을 유지하는 투명 스페이서가 렌더링됩니다.

```tsx
masterDetail={{
  hasDetail: item => item.values.items.length > 0,
  detailRender: ({ item }) => <OrderDetailView order={item.values} />,
}}
```

## 전체 너비 렌더링 및 가상 스크롤 격리

틀고정 컬럼(`frozenColumnIndex > 0`)이 활성화되어 있어도 디테일 패널은 고정 영역과 스크롤 영역을 아우르는 **전체 너비 공통 레이어(`MasterDetailLayer`)**에 렌더링됩니다.

- **마스터 행 셀 높이 보존**: 디테일 패널이 열려도 부모 행 `<tr>`의 셀들은 위아래로 늘어나지 않으며 기본 `rowHeight`를 그대로 유지합니다.
- **스페이서 행 연동**: 본문 테이블에는 디테일 패널 높이만큼의 투명 스페이서 행이 삽입되어 가상 스크롤 오프셋과 마스터 행 간격을 정확히 유지합니다.

## 이벤트 및 포커스 격리

디테일 뷰 내부에는 중첩된 `<BGrid>`, 텍스트 입력창, 버튼, 셀렉트 박스 등 임의의 대화형 컴포넌트를 자유롭게 배치할 수 있습니다.

- 디테일 패널 내부에서 발생하는 클릭, 드래그, 키보드 입력은 부모 테이블의 셀 선택, 행 체크, 셀 편집 진입, 단축키 복사 동작을 트리거하지 않습니다.
- 포커스가 디테일 패널 내부에 있는 상태에서 행이 접히면 포커스가 해당 행의 펼침 토글 버튼으로 안전하게 복귀합니다.

## 커스텀 아이콘

```tsx
masterDetail={{
  icons: {
    expanded: <ChevronDown size={14} />,
    collapsed: <ChevronRight size={14} />,
  },
  detailRender: ({ item }) => <OrderDetailView order={item.values} />,
}}
```

## 제한 사항 및 충돌 가이드

- `rowKey`가 지정되지 않으면 마스터-디테일 기능이 활성화되지 않으며 개발 모드 콘솔에 경고가 출력됩니다.
- 계층 구조가 겹치는 `tree` 모드, `pivot` 모드, `cellMergeOptions`, `reorder`, `frozenRowCount > 0`과는 동시에 사용할 수 없으며 충돌 시 안전하게 마스터-디테일이 비활성화됩니다.
