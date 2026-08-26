---
title: "기본 DataGrid (Basic)"
description: "기본적인 컬럼 설정, 커스텀 셀 렌더러(itemRender), 좌측 열 고정(Frozen Columns), 행 클릭 이벤트 처리를 실무 예제로 학습합니다."
category: "getting-started"
order: 2
locale: "ko"
canonicalPath: "/learn/basic"
demoId: "basic"
features: ["columns", "itemRender", "frozen-columns", "onClick", "align"]
relatedGuides: ["getting-started", "data-and-columns", "frozen-columns", "editing"]
relatedApi: ["/api/props#columns", "/api/props#frozencolumnindex", "/api/props#onclick"]
lastReviewedAt: "2026-08-17"
indexable: true
draft: false
---

## 1. 언제 사용하며 무엇을 배울 수 있나요?

실무 비즈니스 시스템에서 가장 많이 쓰이는 형태는 **주문 목록, 거래처 원장, 회원 관리 대장**처럼 다양한 데이터 포맷(통화, 날짜, 상태 뱃지, 태그 등)을 깔끔하게 표현하고, 주요 키 컬럼(주문번호, 고객명 등)을 좌측에 고정시켜 가로 스크롤 시에도 항상 보이게 만드는 패턴입니다.

이 페이지에서는 다음과 같은 핵심 기법을 배웁니다:
1. **커스텀 셀 렌더링 (`itemRender`)**: 원시 데이터를 뱃지, 링크, 통화 포맷팅된 UI로 변환하기
2. **틀고정 컬럼 (`frozenColumnIndex`)**: 좌측 1~N개 열을 고정하여 가로 스크롤 시에도 뷰포트에 유지하기
3. **컬럼 정렬 (`align`) 및 너비 제어**: 텍스트(left), 숫자(right), 코드/날짜(center) 정렬 규칙
4. **행 클릭 상호작용 (`onClick`)**: 사용자가 행을 클릭했을 때 상세 모달이나 팝업 열기

---

## 2. 실무 완성형 샘플 코드 (주문 내역 관리)

아래 예제는 이커머스 주문 관리 화면을 가정한 완성된 컴포넌트입니다:

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface OrderItem {
  orderNo: string;
  customerName: string;
  productName: string;
  orderDate: string;
  amount: number;
  status: 'PENDING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
}

const statusBadgeStyles: Record<string, { bg: string; color: string; label: string }> = {
  PENDING: { bg: '#fef3c7', color: '#92400e', label: '결제완료' },
  SHIPPED: { bg: '#e0f2fe', color: '#075985', label: '배송중' },
  DELIVERED: { bg: '#dcfce7', color: '#166534', label: '배송완료' },
  CANCELLED: { bg: '#fee2e2', color: '#991b1b', label: '주문취소' },
};

export default function OrderListGrid() {
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);

  // 1. 컬럼 구성
  const columns: BGridColumn<OrderItem>[] = [
    {
      key: 'orderNo',
      label: '주문번호',
      width: 130,
      align: 'center',
      itemRender: ({ values }) => (
        <span style={{ fontWeight: 600, color: '#2563eb', cursor: 'pointer' }}>
          {values.orderNo}
        </span>
      ),
    },
    {
      key: 'customerName',
      label: '주문자명',
      width: 120,
      align: 'left',
    },
    {
      key: 'productName',
      label: '상품명',
      width: 250,
      align: 'left',
    },
    {
      key: 'amount',
      label: '결제금액',
      width: 130,
      align: 'right',
      itemRender: ({ values }) => (
        <span style={{ fontWeight: 600 }}>
          {values.amount.toLocaleString('ko-KR')}원
        </span>
      ),
    },
    {
      key: 'status',
      label: '주문상태',
      width: 110,
      align: 'center',
      itemRender: ({ values }) => {
        const badge = statusBadgeStyles[values.status];
        return (
          <span style={{
            padding: '2px 8px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 600,
            backgroundColor: badge.bg,
            color: badge.color,
          }}>
            {badge.label}
          </span>
        );
      },
    },
    {
      key: 'orderDate',
      label: '주문일시',
      width: 160,
      align: 'center',
    },
  ];

  // 2. 데이터 구성
  const data: BGridDataItem<OrderItem>[] = [
    { values: { orderNo: 'ORD-2026-001', customerName: '이민호', productName: '무선 기계식 키보드', amount: 159000, status: 'DELIVERED', orderDate: '2026-08-15 14:22' } },
    { values: { orderNo: 'ORD-2026-002', customerName: '박지영', productName: '4K 모니터 27인치', amount: 489000, status: 'SHIPPED', orderDate: '2026-08-16 09:15' } },
    { values: { orderNo: 'ORD-2026-003', customerName: '최동욱', productName: '인체공학 버티컬 마우스', amount: 69000, status: 'PENDING', orderDate: '2026-08-17 11:40' } },
    { values: { orderNo: 'ORD-2026-004', customerName: '정수연', productName: 'USB-C 멀티허브', amount: 45000, status: 'CANCELLED', orderDate: '2026-08-17 13:02' } },
  ];

  return (
    <div>
      <BGrid<OrderItem>
        width={800}
        height={320}
        columns={columns}
        data={data}
        rowKey="orderNo"
        frozenColumnIndex={2} // 주문번호, 주문자명 2개 컬럼 좌측 고정
        headerHeight={36}
        itemHeight={32}
        onClick={({ item, index }) => {
          setSelectedOrder(item);
          console.log(`선택된 행 index: ${index}`, item);
        }}
      />

      {selectedOrder && (
        <div style={{ marginTop: 12, padding: 12, backgroundColor: '#f1f5f9', borderRadius: 8, fontSize: 13 }}>
          선택된 주문: <strong>{selectedOrder.orderNo}</strong> ({selectedOrder.customerName} 고객님 / {selectedOrder.amount.toLocaleString()}원)
        </div>
      )}
    </div>
  );
}
```

---

## 3. 핵심 속성(Props) 상세 해설

| 속성명 | 타입 | 기본값 | 실무 설명 |
|---|---|---|---|
| `columns` | `BGridColumn<T>[]` | `[]` (필수) | 테이블 헤더와 열의 너비, 정렬, 렌더러를 정의하는 컬럼 설정 배열입니다. |
| `data` | `BGridDataItem<T>[]` | `[]` (필수) | 행 데이터 배열입니다. 각 항목은 `{ values: T }` 형태로 래핑되어야 합니다. |
| `frozenColumnIndex` | `number` | `0` | 지정된 인덱스 미만의 컬럼들을 좌측에 틀고정(Frozen)하여 가로 스크롤 시 고정 렌더링합니다. (예: `2`면 0번, 1번 열 고정) |
| `headerHeight` | `number` | `30` | 컬럼 헤더 영역의 높이(px)입니다. 폰트 크기나 다단 헤더 여부에 맞춰 조정합니다. |
| `itemHeight` | `number` | `15` | 셀 콘텐츠 영역의 기준 높이(px)입니다. 가상 스크롤 계산에 사용됩니다. |
| `itemPadding` | `number` | `7` | 행에 더해지는 세로 여백 계산값입니다. 실제 높이는 현재 테마와 함께 확인하세요. |
| `onClick` | `(params) => void` | `undefined` | 셀 클릭 시 호출됩니다. `{ item: T, index, columnIndex, column }`을 받습니다. |

---

## 4. 커스텀 셀 렌더러 (`itemRender`) 완벽 활용법

`BGridColumn.itemRender`는 단순 텍스트 출력을 넘어, 리액트 컴포넌트를 셀 내부에 자유롭게 렌더링할 수 있는 강력한 함수입니다.

### 콜백 매개변수 구조:
```tsx
itemRender?: (params: {
  item: BGridDataItem<T>;      // 전체 행 래퍼 ({ values, status, checked })
  values: T;                  // 실제 비즈니스 행 데이터 객체
  value: any;                 // 해당 컬럼 key에 매핑된 단일 셀 값
  column: BGridColumn<T>;      // 현재 컬럼 설정 객체
  index: number;              // 현재 표시 행 인덱스
  columnIndex: number;        // 컬럼 인덱스
  handleSave?: (value: any) => void;   // 편집 모드 시 저장 트리거
  handleCancel?: () => void;           // 편집 모드 시 취소 트리거
}) => React.ReactNode;
```

### 실무 추천 패턴:
- **금액/숫자 표기**: `values.amount.toLocaleString()`
- **상태 뱃지**: `values.status`에 따른 태그 렌더링
- **액션 버튼**: 행별 삭제/수정 버튼 배치 (버튼 클릭 시 `e.stopPropagation()`을 호출하여 `onClick` 행 선택과 이벤트 충돌 방지)

---

## 5. 실무 팁 & 주의사항 (Gotchas)

> [!TIP]
> **좌측 열 고정 시 가로 스크롤 성능**:
> BeautifulGrid의 고정 컬럼(`frozenColumnIndex`)은 고정 영역과 일반 영역을 별도 컴포넌트로 렌더링합니다. 셀 렌더러가 복잡하거나 컬럼 수가 많다면 목표 브라우저와 데이터 규모에서 스크롤 동기화를 확인하세요.

> [!WARNING]
> **셀 내부 이벤트 전파 주의**:
> `itemRender` 내부에서 `<button>`이나 `<input>`을 클릭할 때 그리드의 행 선택 이벤트(`onClick`)가 함께 발생하는 것을 원치 않는다면, 핸들러에서 `event.stopPropagation()`을 반드시 호출하세요.
