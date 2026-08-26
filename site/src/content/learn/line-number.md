---
title: "행 번호 (Line Number)"
description: "좌측 틀고정 영역에 행 순번(1, 2, 3...)을 표시하고 가상 스크롤과 자연스럽게 연동하는 방법을 학습합니다."
category: "data-and-columns"
order: 4
locale: "ko"
canonicalPath: "/learn/line-number"
demoId: "line-number"
features: ["showLineNumber", "frozen", "indexing"]
relatedGuides: ["getting-started", "basic", "row-reorder", "frozen-columns"]
relatedApi: ["/api/props#showlinenumber"]
lastReviewedAt: "2026-08-23"
indexable: true
draft: false
---

## 1. 언제 사용하며 왜 필요한가요?

수백~수천 건의 데이터를 검토할 때 **"몇 번째 행을 보고 있는지"** 직관적으로 파악할 수 있도록 좌측에 행 번호(Line Number) 열을 두는 것은 스프레드시트의 기본입니다.

`showLineNumber={true}`를 설정하면 DataGrid 좌측에 행 번호 열이 자동으로 생성되며, 가상 스크롤 시에도 스크롤 위치에 맞춰 정확한 번호(1~N)가 고속으로 계산됩니다.

위 라이브 데모는 **2,500건의 주문·출고 데이터**를 사용합니다. 아래로 스크롤하면 3~4자리 행 번호에 맞춰 번호 열 너비가 자동으로 확보되는 것을 확인할 수 있습니다. 행 번호를 클릭하거나 드래그하면 해당 행 전체가, 정렬 기능이 없는 컬럼 헤더를 클릭하거나 드래그하면 해당 컬럼 전체가 선택됩니다. `Shift`는 연속 범위, `Ctrl`/`Cmd`는 다중 범위 선택에 사용할 수 있습니다.

---

## 2. 실무 완성형 예제: 대량 주문 데이터의 행 번호

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface Order {
  orderNo: string;
  customerName: string;
  status: string;
}

export default function LineNumberGrid() {
  const [data] = useState<BGridDataItem<Order>[]>(
    Array.from({ length: 2500 }).map((_, i) => ({
      values: {
        orderNo: `ORD-2026-${String(i + 1).padStart(6, '0')}`,
        customerName: ['에이원 리테일', '한빛상사', '모노마켓'][i % 3],
        status: ['출고 준비', '피킹 완료', '배송 중'][i % 3],
      },
    }))
  );

  const columns: BGridColumn<Order>[] = [
    { key: 'orderNo', label: '주문번호', width: 140 },
    { key: 'customerName', label: '고객사', width: 160 },
    { key: 'status', label: '출고상태', width: 120, align: 'center' },
  ];

  return (
    <div>
      <BGrid<Order>
        width={650}
        height={300}
        columns={columns}
        data={data}
        rowKey="orderNo"
        showLineNumber={true} // 행 번호 표시
      />
    </div>
  );
}
```
