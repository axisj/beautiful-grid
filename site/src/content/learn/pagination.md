---
title: "페이지네이션 (Pagination)"
description: "DataGrid 하단 푸터 바에 페이지 번호 네비게이션을 배치하고, 서버 측 페이징 API와 연동하는 방법을 학습합니다."
category: "data-and-columns"
order: 2
locale: "ko"
canonicalPath: "/learn/pagination"
demoId: "pagination"
features: ["pagination", "page", "server-side-paging", "pageSize", "totalElements", "bottomBarHeight"]
relatedGuides: ["getting-started", "basic", "virtual-scroll", "sorting-filtering"]
relatedApi: ["/api/props#page", "/api/props#bottombarheight", "/api/props#columns"]
lastReviewedAt: "2026-08-23"
indexable: true
draft: false
---

## 1. 언제 사용하며 왜 필요한가요?

가상 스크롤(Virtual Scroll)이 전체 데이터를 한 번에 조회하여 무한 스크롤처럼 탐색할 때 유용하다면, **페이지네이션(Pagination)**은 다음과 같은 경우에 최적의 선택입니다:
1. **대용량 DB 부하 절감**: 백엔드에서 10~50건씩만 분할 조회(`LIMIT / OFFSET`)하여 네트워크 비용 절감
2. **명확한 페이지 위치 파악**: "3페이지의 5번째 항목"처럼 특정 페이지로 바로 점프할 수 있는 사용자 경험
3. **인쇄 및 리포트 출력**: 특정 페이지 단위로 문서를 출력하거나 검토해야 하는 업무 환경

---

## 2. 실무 완성형 예제: 서버 연동 페이지네이션

아래 코드는 페이지 변경 시 비동기 API 요청을 시뮬레이션하여 데이터를 갱신하는 실무 패턴입니다:

```tsx
import React, { useState, useEffect } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface MemberItem {
  id: number;
  email: string;
  name: string;
  joinDate: string;
  status: 'ACTIVE' | 'DORMANT' | 'BLOCKED';
}

export default function MemberPaginationGrid() {
  const [currentPage, setCurrentPage] = useState(1); // 1-based page number
  const pageSize = 10;
  const totalElements = 145; // 전체 145건

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BGridDataItem<MemberItem>[]>([]);

  // 페이지 변경 시 데이터 로딩 시뮬레이션
  useEffect(() => {
    setLoading(true);
    const timer = setTimeout(() => {
      const startIdx = (currentPage - 1) * pageSize;
      const mockItems: BGridDataItem<MemberItem>[] = Array.from({ length: pageSize }).map((_, i) => {
        const itemIndex = startIdx + i + 1;
        return {
          values: {
            id: itemIndex,
            email: `user_${itemIndex}@example.com`,
            name: `사용자_${itemIndex}`,
            joinDate: '2026-08-01',
            status: itemIndex % 5 === 0 ? 'DORMANT' : 'ACTIVE',
          },
        };
      });
      setData(mockItems);
      setLoading(false);
    }, 200);

    return () => clearTimeout(timer);
  }, [currentPage]);

  const columns: BGridColumn<MemberItem>[] = [
    { key: 'id', label: '회원번호', width: 90, align: 'center' },
    { key: 'name', label: '회원명', width: 140, align: 'center' },
    { key: 'email', label: '이메일 주소', width: 250 },
    { key: 'joinDate', label: '가입일시', width: 130, align: 'center' },
    {
      key: 'status',
      label: '상태',
      width: 100,
      align: 'center',
      itemRender: ({ values }) => (
        <span style={{ color: values.status === 'ACTIVE' ? '#16a34a' : '#d97706', fontWeight: 600 }}>
          {values.status === 'ACTIVE' ? '정상' : '휴면'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <BGrid<MemberItem>
        width={750}
        height={360}
        columns={columns}
        data={data}
        rowKey="id"
        loading={loading}
        // 페이지네이션 구성
        page={{
          currentPage,
          pageSize,
          totalElements,
          totalPages: Math.ceil(totalElements / pageSize),
          loading,
          onChange: (newPage: number) => {
            console.log(`페이지 이동: ${newPage} 페이지`);
            setCurrentPage(newPage);
          },
        }}
        bottomBarHeight={36} // 하단 페이지네이션 바 높이
        headerHeight={34}
        itemHeight={28}
      />
    </div>
  );
}
```

---

## 3. `page` 속성 명세

```tsx
interface BGridPage {
  // 현재 페이지 번호 (1부터 시작)
  currentPage?: number;

  // 페이지당 행 개수
  pageSize?: number;

  // 전체 페이지 수. 페이지 번호 UI를 렌더링할 때 필요
  totalPages?: number;

  // 서버 전체 데이터 총 레코드 건수
  totalElements?: number;

  // 페이지 데이터 로딩 상태
  loading?: boolean;

  // 사용자가 페이지 번호나 이전/다음 버튼을 클릭했을 때 콜백
  onChange?: (newPage: number, pageSize?: number) => void;
}
```

---

## 4. 실무 팁 & 주의사항 (Gotchas)

> [!IMPORTANT]
> **1-based 페이지 규칙**:
> 내장 페이지 번호 UI는 첫 페이지를 `1`로 사용합니다. 백엔드 API가 0부터 시작하는 페이지 인덱스를 요구한다면 요청 시 `currentPage - 1`, 응답을 화면 상태로 옮길 때 `pageIndex + 1`로 변환하세요. 페이지 번호 UI를 표시하려면 `currentPage`와 `totalPages`를 함께 제공해야 합니다.
