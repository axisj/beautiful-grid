---
title: "포커스 및 선택 (Focus & Active Row)"
description: "셀 클릭과 selectedRowKey를 연결해 현재 선택된 행을 시각적으로 강조하는 방법을 학습합니다."
category: "interaction"
order: 25
locale: "ko"
canonicalPath: "/learn/focus"
demoId: "focus"
features: ["selectedRowKey", "focus", "row-click", "active-row"]
relatedGuides: ["getting-started", "basic", "row-selection", "editing"]
relatedApi: ["/api/props#selectedrowkey", "/api/props#onclick"]
lastReviewedAt: "2026-08-23"
indexable: true
draft: false
---

## 1. 언제 사용하며 왜 필요한가요?

목록과 상세 영역을 연결할 때처럼 **사용자가 클릭한 행을 계속 강조**해야 하는 경우 `selectedRowKey`를 사용합니다. `onClick`에서 원본 행의 키를 상태로 저장하고, 그 값을 `selectedRowKey`로 다시 전달하는 제어형 패턴입니다.

---

## 2. 실무 완성형 예제: 선택 행 강조 및 상세 뷰어 연동

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface ArticleItem {
  id: number;
  title: string;
  author: string;
  createdAt: string;
}

export default function FocusGrid() {
  const [selectedKey, setSelectedKey] = useState<string | number>(2);

  const [data] = useState<BGridDataItem<ArticleItem>[]>([
    { values: { id: 1, title: 'BeautifulGrid v1.11 출시 안내', author: '관리자', createdAt: '2026-08-10' } },
    { values: { id: 2, title: '고성능 가상 스크롤 렌더링 최적화 팁', author: '기술팀', createdAt: '2026-08-12' } },
    { values: { id: 3, title: 'React 19 호환성 및 타입스크립트 지원', author: '프론트엔드', createdAt: '2026-08-15' } },
  ]);

  const columns: BGridColumn<ArticleItem>[] = [
    { key: 'id', label: '번호', width: 70, align: 'center' },
    { key: 'title', label: '제목', width: 320 },
    { key: 'author', label: '작성자', width: 100, align: 'center' },
    { key: 'createdAt', label: '등록일', width: 120, align: 'center' },
  ];

  return (
    <div>
      <BGrid<ArticleItem>
        width={650}
        height={220}
        columns={columns}
        data={data}
        rowKey="id"
        selectedRowKey={selectedKey} // 선택된 행의 고유 키 (Active 스타일 적용)
        onClick={({ item }) => {
          setSelectedKey(item.id);
        }}
      />
    </div>
  );
}
```
