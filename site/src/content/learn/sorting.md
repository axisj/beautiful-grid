---
title: "다중 정렬 (Sorting)"
description: "단일 컬럼 및 다중 컬럼(Multi-column) 정렬 규칙과 정렬 상태 제어(Controlled Sort)를 학습합니다."
category: "data-and-columns"
order: 5
locale: "ko"
canonicalPath: "/learn/sorting"
demoId: "sorting"
features: ["sorting", "multi-sort", "sortInfo", "asc-desc", "dataControl"]
relatedGuides: ["getting-started", "basic", "sorting-filtering", "virtual-scroll"]
relatedApi: ["/api/props#sort", "/api/props#datacontrol"]
lastReviewedAt: "2026-08-17"
indexable: true
draft: false
---

## 1. 언제 사용하며 왜 필요한가요?

단순히 한 컬럼으로만 정렬하는 것을 넘어, **"1차로 부서명 오름차순 정렬 후, 같은 부서 내에서는 2차로 직급/입사일순 정렬"**처럼 여러 컬럼을 복합 정렬해야 하는 실무 요구사항이 빈번합니다.

BeautifulGrid는 `sort.sortParams`와 `sort.onChange`로 정렬 상태를 제어합니다. `sort` 방식에서는 변경된 조건을 부모가 받아 데이터를 정렬해 다시 전달합니다. 헤더 툴박스의 클라이언트 자동 처리가 필요하면 `dataControl.mode: 'client'`를 사용하세요.

---

## 2. 실무 완성형 예제: 다중 정렬 제어

```tsx
import React, { useMemo, useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem, type BGridSortParam } from 'beautiful-grid';

interface Person {
  id: number;
  dept: string;
  name: string;
  score: number;
}

export default function SortGrid() {
  const [sortParams, setSortParams] = useState<BGridSortParam[]>([]);
  const [data] = useState<BGridDataItem<Person>[]>([
    { values: { id: 1, dept: '개발팀', name: '김민수', score: 95 } },
    { values: { id: 2, dept: '개발팀', name: '박도현', score: 88 } },
    { values: { id: 3, dept: '기획팀', name: '이수진', score: 92 } },
    { values: { id: 4, dept: '기획팀', name: '최동욱', score: 95 } },
  ]);

  const columns: BGridColumn<Person>[] = [
    { key: 'id', label: 'ID', width: 70, align: 'center' },
    { key: 'dept', label: '부서', width: 120, align: 'center' },
    { key: 'name', label: '이름', width: 120, align: 'center' },
    { key: 'score', label: '점수', width: 100, align: 'right' },
  ];

  const sortedData = useMemo(() => [...data].sort((a, b) => {
    for (const sort of sortParams) {
      if (!sort.key) continue;
      const left = a.values[sort.key as keyof Person];
      const right = b.values[sort.key as keyof Person];
      if (left === right) continue;
      const result = left < right ? -1 : 1;
      return sort.orderBy === 'asc' ? result : -result;
    }
    return 0;
  }), [data, sortParams]);

  return (
    <div>
      <BGrid<Person>
        width={550}
        height={240}
        columns={columns}
        data={sortedData}
        rowKey="id"
        sort={{
          multiSort: true,
          sortParams,
          onChange: setSortParams,
        }}
      />
    </div>
  );
}
```
