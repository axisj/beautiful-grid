---
title: "조건부 행 스타일링 (Row Styling)"
description: "특정 조건(예: 결제 취소, 재고 부족, VIP 회원 등)을 만족하는 행에 커스텀 CSS 클래스를 동적으로 부여하는 방법을 학습합니다."
category: "styling-and-accessibility"
order: 2
locale: "ko"
canonicalPath: "/learn/row-styling"
demoId: "row-styling"
features: ["getRowClassName", "conditional-styling", "row-color", "highlight", "css-classes"]
relatedGuides: ["getting-started", "basic", "theming", "focus"]
relatedApi: ["/api/props#getrowclassname", "/api/props#columns"]
lastReviewedAt: "2026-08-23"
indexable: true
draft: false
---

## 1. 언제 사용하며 왜 필요한가요?

경고 상태(에러 발생 로그, 위험 재고 알림)나 중요 상태(VIP 고객, 완료된 작업)의 행 전체에 **빨간색/노란색/초록색 배경 하이라이트**를 적용하여 사용자의 시선을 집중시켜야 할 때 `getRowClassName`을 사용합니다.

---

## 2. 실무 완성형 예제: 재고 부족 품목 경고 하이라이트

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface InventoryItem {
  id: string;
  name: string;
  stock: number;
  threshold: number;
}

export default function RowStylingGrid() {
  const [data] = useState<BGridDataItem<InventoryItem>[]>([
    { values: { id: 'P1', name: '고속 충전 어댑터 65W', stock: 4, threshold: 10 } }, // 재고 위험
    { values: { id: 'P2', name: '무선 블루투스 이어폰', stock: 28, threshold: 10 } }, // 정상
    { values: { id: 'P3', name: '스마트폰 강화유리 필름', stock: 0, threshold: 5 } }, // 품절
    { values: { id: 'P4', name: '태블릿 마그네틱 거치대', stock: 15, threshold: 5 } }, // 정상
  ]);

  const columns: BGridColumn<InventoryItem>[] = [
    { key: 'id', label: '코드', width: 80, align: 'center' },
    { key: 'name', label: '품목명', width: 240 },
    {
      key: 'stock',
      label: '현재 재고',
      width: 100,
      align: 'right',
      itemRender: ({ values }) => <strong>{values.stock}개</strong>,
    },
    { key: 'threshold', label: '안전 재고', width: 100, align: 'right', itemRender: ({ values }) => `${values.threshold}개` },
  ];

  return (
    <div>
      <style>{`
        .row-out-of-stock {
          background-color: #fee2e2 !important; /* 연한 빨강 */
          color: #991b1b;
        }
        .row-low-stock {
          background-color: #fef3c7 !important; /* 연한 노랑 */
          color: #92400e;
        }
      `}</style>

      <BGrid<InventoryItem>
        width={560}
        height={220}
        columns={columns}
        data={data}
        rowKey="id"
        // 조건부 행 클래스 반환
        getRowClassName={(_, item) => {
          if (item.values.stock === 0) return 'row-out-of-stock';
          if (item.values.stock < item.values.threshold) return 'row-low-stock';
          return '';
        }}
      />
    </div>
  );
}
```
