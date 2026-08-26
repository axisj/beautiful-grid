---
title: "정렬 및 필터 툴박스 (Sorting & Filtering)"
description: "컬럼 헤더의 다중 정렬(Multi-sort)과 강력한 툴박스 필터링(Toolbox Filter)을 실무에 적용하는 방법을 학습합니다."
category: "interaction"
order: 22
locale: "ko"
canonicalPath: "/learn/sorting-filtering"
demoId: "sorting-filtering"
features: ["sorting", "filtering", "toolbox", "multi-sort", "dataControl"]
relatedGuides: ["getting-started", "basic", "sorting", "virtual-scroll"]
relatedApi: ["/api/props#datacontrol", "/api/props#bgriddatacontrol-query", "/api/props#columns"]
lastReviewedAt: "2026-08-17"
indexable: true
draft: false
---

## 1. 언제 사용하며 왜 필요한가요?

사용자가 대량의 데이터를 조회할 때 **"금액이 높은 순으로 정렬"**하거나 **"특정 부서나 상태만 빠르게 필터링"**하는 기능은 데이터 탐색의 핵심입니다.

BeautifulGrid는 다음과 같은 두 가지 차원의 탐색 도구를 제공합니다:
1. **컬럼 헤더 클릭 정렬**: 컬럼 라벨 클릭 시 오름차순(ASC) ➔ 내림차순(DESC) ➔ 정렬 해제 토글
2. **헤더 툴박스 팝오버 (Toolbox)**: 각 컬럼 헤더의 필터/정렬 아이콘을 클릭하여 값 목록 필터, 텍스트 검색, 다중 정렬을 손쉽게 수행
3. **클라이언트 vs 수동 모드 (`dataControl`)**: 그리드가 현재 `data`를 처리하는 `client` 또는 부모가 조회를 수행하는 `manual` 방식

---

## 2. 실무 완성형 예제: 클라이언트 측 다중 필터 & 정렬

아래 코드는 헤더 툴박스를 활성화하고 클라이언트 모드로 동작하는 예제입니다:

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem, type BGridDataQuery } from 'beautiful-grid';

interface EmployeeItem {
  id: number;
  name: string;
  department: string;
  position: string;
  salary: number;
  joinedAt: string;
}

export default function EmployeeFilterGrid() {
  const [query, setQuery] = useState<BGridDataQuery>({ sortParams: [], filterParams: [] });
  const [data] = useState<BGridDataItem<EmployeeItem>[]>([
    { values: { id: 1, name: '김철수', department: '개발본부', position: '팀장', salary: 85000000, joinedAt: '2020-03-01' } },
    { values: { id: 2, name: '이영희', department: '디자인팀', position: '선임', salary: 52000000, joinedAt: '2022-07-15' } },
    { values: { id: 3, name: '박민수', department: '개발본부', position: '수석', salary: 92000000, joinedAt: '2018-11-01' } },
    { values: { id: 4, name: '최지우', department: '마케팅팀', position: '책임', salary: 64000000, joinedAt: '2021-01-10' } },
    { values: { id: 5, name: '정동훈', department: '개발본부', position: '주임', salary: 45000000, joinedAt: '2024-02-01' } },
    { values: { id: 6, name: '한소희', department: '인사팀', position: '선임', salary: 55000000, joinedAt: '2023-05-10' } },
  ]);

  const columns: BGridColumn<EmployeeItem>[] = [
    { id: 'id', key: 'id', label: '사번', width: 70, align: 'center', toolbox: true, filter: { type: 'number' } },
    { id: 'name', key: 'name', label: '이름', width: 120, align: 'center', toolbox: true, filter: { type: 'text' } },
    { id: 'department', key: 'department', label: '부서명', width: 140, toolbox: true, filter: { type: 'values' } },
    { id: 'position', key: 'position', label: '직급', width: 100, align: 'center', toolbox: true, filter: { type: 'values' } },
    {
      key: 'salary',
      label: '연봉',
      width: 140,
      align: 'right',
      toolbox: true,
      filter: { type: 'number' },
      itemRender: ({ values }) => `${values.salary.toLocaleString()}원`,
    },
    { id: 'joinedAt', key: 'joinedAt', label: '입사일', width: 120, align: 'center', toolbox: true, filter: { type: 'text' } },
  ];

  return (
    <div>
      <div style={{ marginBottom: 10, fontSize: 13, color: '#475569' }}>
        💡 각 컬럼 헤더에 마우스를 올리면 나타나는 <strong>필터/정렬 아이콘</strong>을 클릭하여 원하는 부서나 직급을 필터링해보세요.
      </div>

      <BGrid<EmployeeItem>
        width={750}
        height={320}
        columns={columns}
        data={data}
        rowKey="id"
        dataControl={{
          mode: 'client',
          multiSort: true,
          query,
          onChange: setQuery,
        }}
        showLineNumber={true}
      />
    </div>
  );
}
```

---

## 3. `dataControl` 모드 선택 가이드

| 모드 | 설정값 | 동작 방식 | 권장 환경 |
|---|---|---|---|
| **클라이언트 모드** | `{ mode: 'client', query, onChange }` | 현재 전달된 `data`를 대상으로 그리드가 정렬·필터 결과를 계산합니다. | 이미 브라우저에 로드한 데이터 안에서 즉시 탐색할 때 |
| **수동 모드** | `{ mode: 'manual', query, onChange }` | 조건 변경만 부모에 알리고, 부모가 서버 조회 후 새 `data`를 전달합니다. | 서버 페이징이나 DB 정렬·필터가 필요할 때 |

---

## 4. 실무 팁 & 주의사항 (Gotchas)

> [!TIP]
> **중복 컬럼 ID 주의**:
> 툴박스가 활성화된 경우 각 컬럼은 고유한 `key` 또는 `id`를 가져야 합니다. 동일한 `key`를 여러 컬럼에서 재사용할 경우 `id: 'custom_id_1'` 처럼 고유 `id`를 명시해주세요.
