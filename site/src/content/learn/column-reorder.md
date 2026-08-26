---
title: "컬럼 순서 재배치 (Column Reorder)"
description: "마우스 드래그 앤 드롭으로 컬럼 헤더의 순서를 자유롭게 변경하고 변경된 순서를 저장하는 방법을 학습합니다."
category: "interaction"
order: 23
locale: "ko"
canonicalPath: "/learn/column-reorder"
demoId: "column-reorder"
features: ["columnSortable", "drag-and-drop", "reorder", "user-customization"]
relatedGuides: ["getting-started", "basic", "row-reorder", "sorting"]
relatedApi: ["/api/props#columnsortable", "/api/props#columns"]
lastReviewedAt: "2026-08-17"
indexable: true
draft: false
---

## 1. 언제 사용하며 왜 필요한가요?

사용자마다 업무 시 자주 확인하는 컬럼이 다릅니다. 어떤 담당자는 "연락처"를 먼저 보고 싶고, 어떤 담당자는 "주문금액"을 먼저 보고 싶어 합니다.

`columnSortable={true}`를 설정하면 사용자가 헤더를 마우스로 드래그하여 자신이 원하는 순서로 컬럼 위치를 즉시 바꿀 수 있습니다.

---

## 2. 실무 완성형 예제: 드래그 컬럼 순서 변경

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface TaskItem {
  id: number;
  title: string;
  assignee: string;
  priority: string;
  dueDate: string;
}

export default function ColumnReorderGrid() {
  const [columns, setColumns] = useState<BGridColumn<TaskItem>[]>([
    { key: 'id', label: 'ID', width: 70, align: 'center' },
    { key: 'title', label: '업무명', width: 220 },
    { key: 'assignee', label: '담당자', width: 120, align: 'center' },
    { key: 'priority', label: '우선순위', width: 100, align: 'center' },
    { key: 'dueDate', label: '마감일', width: 120, align: 'center' },
  ]);

  const [data] = useState<BGridDataItem<TaskItem>[]>([
    { values: { id: 1, title: '결제 모듈 v2 마이그레이션', assignee: '김민수', priority: '높음', dueDate: '2026-08-25' } },
    { values: { id: 2, title: '모바일 뷰 반응형 UI 개선', assignee: '이수진', priority: '보통', dueDate: '2026-08-28' } },
    { values: { id: 3, title: '분기별 보안 감사 보고서 작성', assignee: '박도현', priority: '긴급', dueDate: '2026-08-20' } },
  ]);

  return (
    <div>
      <div style={{ marginBottom: 10, fontSize: 13, color: '#475569' }}>
        💡 컬럼 헤더 라벨을 마우스로 잡고 좌우로 드래그하여 순서를 바꿔보세요.
      </div>

      <BGrid<TaskItem>
        width={700}
        height={240}
        columns={columns}
        data={data}
        rowKey="id"
        columnSortable={true} // 헤더 드래그 순서 변경 활성화
        onChangeColumns={(_, { columns: nextColumns }) => {
          console.log('변경된 컬럼 순서:', nextColumns.map(c => c.key));
          setColumns(nextColumns);
        }}
      />
    </div>
  );
}
```
