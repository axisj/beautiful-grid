---
title: "스크롤바 설정 (Custom Scrollbar)"
description: "네이티브 브라우저 스크롤바와 OS에 종속되지 않는 커스텀 오버레이 스크롤바의 설정 및 도킹(Dock) 옵션을 학습합니다."
category: "styling-and-accessibility"
order: 6
locale: "ko"
canonicalPath: "/learn/scrollbar"
demoId: "scrollbar"
features: ["scrollbar", "custom-scrollbar", "native-scrollbar", "scrollbar-dock", "scroll-metrics"]
relatedGuides: ["getting-started", "basic", "virtual-scroll", "pagination"]
relatedApi: ["/api/props#scrollbar", "/api/props#bottombarheight"]
lastReviewedAt: "2026-08-18"
indexable: true
draft: false
---

## 1. 언제 사용하며 왜 필요한가요?

운영체제와 브라우저에 따라 기본 스크롤바의 모양과 점유 공간이 다를 수 있습니다. `scrollbar` prop으로 `native`, `classic`, `modern` 변형과 가로·세로 스크롤바의 표시 여부를 설정할 수 있습니다. 커스텀 가로 스크롤바는 항상 Bottom Bar에 표시되며 위치는 변경할 수 없습니다.

- `modern`: 얇고 둥근 트랙과 썸, 미니멀한 이동 버튼을 사용하는 기본 스타일
- `classic`: 각진 트랙과 화살표 버튼을 사용하는 Windows 스타일
- `native`: 브라우저 네이티브 스크롤바에 기존 BeautifulGrid 테마만 적용하는 호환 스타일

---

## 2. 실무 완성형 예제: 커스텀 스크롤바 활성화

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface Item {
  id: number;
  col1: string;
  col2: string;
  col3: string;
  col4: string;
  col5: string;
}

export default function CustomScrollbarGrid() {
  const [data] = useState<BGridDataItem<Item>[]>(
    Array.from({ length: 50 }).map((_, i) => ({
      values: {
        id: i + 1,
        col1: `데이터_1_${i}`,
        col2: `데이터_2_${i}`,
        col3: `데이터_3_${i}`,
        col4: `데이터_4_${i}`,
        col5: `데이터_5_${i}`,
      },
    }))
  );

  const columns: BGridColumn<Item>[] = [
    { key: 'id', label: 'ID', width: 60, align: 'center' },
    { key: 'col1', label: '열 1', width: 180 },
    { key: 'col2', label: '열 2', width: 180 },
    { key: 'col3', label: '열 3', width: 180 },
    { key: 'col4', label: '열 4', width: 180 },
    { key: 'col5', label: '열 5', width: 180 },
  ];

  return (
    <div>
      <BGrid<Item>
        width={600} // 가로 스크롤 유도를 위해 좁게 설정
        height={260}
        columns={columns}
        data={data}
        rowKey="id"
        // 커스텀 스크롤바 설정
        scrollbar={{
          variant: 'modern', // 'native' | 'classic' | 'modern'
        }}
      />
    </div>
  );
}
```
