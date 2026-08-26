---
title: "로딩 및 빈 상태 (Loading & Empty State)"
description: "데이터 비동기 로딩 시 스피너 오버레이 표시 및 검색 결과가 없을 때의 안내 메시지 커스터마이징을 학습합니다."
category: "styling-and-accessibility"
order: 1
locale: "ko"
canonicalPath: "/learn/loading"
demoId: "loading"
features: ["loading", "spinning", "msg", "empty-state", "overlay"]
relatedGuides: ["getting-started", "basic", "pagination"]
relatedApi: ["/api/props#loading", "/api/props#spinning", "/api/props#msg"]
lastReviewedAt: "2026-08-23"
indexable: true
draft: false
---

## 1. 언제 사용하며 왜 필요한가요?

API 호출 중 사용자가 빈 화면을 보고 시스템이 멈춘 것으로 오해하지 않도록 **반투명 로딩 오버레이와 스피너**를 띄우고, 검색 결과가 0건일 때 **"조회된 데이터가 없습니다"**라는 친절한 안내 문구를 보여주는 것은 완성도 높은 UX의 기본입니다.

BeautifulGrid는 `loading`, `spinning`, `msg.emptyList` 속성으로 로딩 표시와 빈 데이터 메시지를 제어합니다.

---

## 2. 실무 완성형 예제: 로딩 및 빈 데이터 상태 시뮬레이션

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function LoadingDemoGrid() {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BGridDataItem<Product>[]>([]);

  const columns: BGridColumn<Product>[] = [
    { key: 'id', label: 'ID', width: 80, align: 'center' },
    { key: 'name', label: '상품명', width: 220 },
    { key: 'price', label: '가격', width: 140, align: 'right', itemRender: ({ values }) => `${values.price.toLocaleString()}원` },
  ];

  const handleFetch = () => {
    setLoading(true);
    setTimeout(() => {
      setData([
        { values: { id: 1, name: '에르고노믹 마우스', price: 65000 } },
        { values: { id: 2, name: '텐키리스 키보드', price: 129000 } },
      ]);
      setLoading(false);
    }, 1000);
  };

  const handleClear = () => {
    setData([]);
  };

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', gap: 8 }}>
        <button onClick={handleFetch} style={{ padding: '6px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
          데이터 불러오기 (로딩 1초)
        </button>
        <button onClick={handleClear} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: 4, cursor: 'pointer' }}>
          데이터 비우기 (Empty State)
        </button>
      </div>

      <BGrid<Product>
        width={500}
        height={240}
        columns={columns}
        data={data}
        rowKey="id"
        loading={loading} // 로딩 상태 활성화 시 오버레이 스피너 자동 렌더링
        msg={{
          emptyList: '조회 조건에 일치하는 상품 데이터가 없습니다.',
        }}
      />
    </div>
  );
}
```
