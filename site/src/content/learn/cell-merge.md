---
title: "셀 병합 (Cell Merge)"
description: "인접한 행의 동일한 데이터를 시각적으로 하나로 합쳐서 그룹화된 가독성 높은 보고서 테이블을 만드는 방법을 학습합니다."
category: "advanced"
order: 1
locale: "ko"
canonicalPath: "/learn/cell-merge"
demoId: "cell-merge"
features: ["cellMergeOptions", "mergeBy", "rowspan", "reporting", "grouping"]
relatedGuides: ["getting-started", "basic", "summary", "frozen-columns"]
relatedApi: ["/api/props#cellmergeoptions", "/api/props#columns"]
lastReviewedAt: "2026-08-23"
indexable: true
draft: false
---

## 1. 언제 사용하며 왜 필요한가요?

경영 정보 대시보드나 정산 리포트, 재고 집계표를 작성할 때 **"대분류"**, **"중분류"**, **"담당자"**처럼 동일한 값이 여러 행에 걸쳐 반복 출력되면 테이블이 산만해 보입니다.

BeautifulGrid의 **셀 병합(Cell Merge)** 기능을 사용하면:
- 동일한 연속된 값을 가지는 인접 행의 셀을 자동으로 감지하여 `rowspan` 효과로 시각적 병합을 수행합니다.
- 일반 컬럼과 Frozen 컬럼에서 같은 `columnsMap` 병합 기준을 사용합니다.
- 데이터의 정렬 순서에 맞추어 유연하게 병합 기준(`mergeBy`)을 설정할 수 있습니다.

---

## 2. 실무 완성형 예제: 카테고리별 판매 품목 보고서

아래 코드는 `대분류`와 `중분류` 컬럼을 기준으로 셀을 병합하여 렌더링하는 예제입니다:

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface CategoryItem {
  mainCategory: string;
  subCategory: string;
  itemCode: string;
  itemName: string;
  unitPrice: number;
  stockQty: number;
}

export default function CategoryMergeGrid() {
  const [data] = useState<BGridDataItem<CategoryItem>[]>([
    { values: { mainCategory: '가전/디지털', subCategory: '컴퓨터 주변기기', itemCode: 'IT-01', itemName: '무선 키보드', unitPrice: 45000, stockQty: 120 } },
    { values: { mainCategory: '가전/디지털', subCategory: '컴퓨터 주변기기', itemCode: 'IT-02', itemName: '게이밍 마우스', unitPrice: 38000, stockQty: 85 } },
    { values: { mainCategory: '가전/디지털', subCategory: '모니터/디스플레이', itemCode: 'IT-03', itemName: '27인치 4K 모니터', unitPrice: 420000, stockQty: 30 } },
    { values: { mainCategory: '가전/디지털', subCategory: '모니터/디스플레이', itemCode: 'IT-04', itemName: '32인치 커브드 모니터', unitPrice: 580000, stockQty: 15 } },
    { values: { mainCategory: '가구/인테리어', subCategory: '사무용 가구', itemCode: 'FN-01', itemName: '모션 데스크 1400', unitPrice: 350000, stockQty: 25 } },
    { values: { mainCategory: '가구/인테리어', subCategory: '사무용 가구', itemCode: 'FN-02', itemName: '인체공학 메시 의자', unitPrice: 280000, stockQty: 40 } },
  ]);

  const columns: BGridColumn<CategoryItem>[] = [
    { key: 'mainCategory', label: '대분류', width: 140, align: 'center' },
    { key: 'subCategory', label: '중분류', width: 160, align: 'center' },
    { key: 'itemCode', label: '품목코드', width: 100, align: 'center' },
    { key: 'itemName', label: '품목명', width: 200 },
    {
      key: 'unitPrice',
      label: '단가',
      width: 120,
      align: 'right',
      itemRender: ({ values }) => `${values.unitPrice.toLocaleString()}원`,
    },
    {
      key: 'stockQty',
      label: '재고',
      width: 90,
      align: 'right',
      itemRender: ({ values }) => `${values.stockQty}개`,
    },
  ];

  return (
    <div>
      <BGrid<CategoryItem>
        width={810}
        height={320}
        columns={columns}
        data={data}
        rowKey="itemCode"
        frozenColumnIndex={2} // 대분류, 중분류를 좌측 고정
        // 셀 병합 옵션 구성
        cellMergeOptions={{
          columnsMap: {
            0: { mergeBy: 'mainCategory' }, // 0번째 컬럼(대분류)은 mainCategory 값이 같을 때 병합
            1: { mergeBy: 'subCategory' },  // 1번째 컬럼(중분류)은 subCategory 값이 같을 때 병합
          },
        }}
        headerHeight={34}
        itemHeight={30}
      />
    </div>
  );
}
```

---

## 3. `cellMergeOptions` 설정 명세

```tsx
type CellMergeOptions = {
  columnsMap: {
    [columnIndex: number]: BGridCellMergeColumn;
  };
};

interface BGridCellMergeColumn {
      wordWrap?: boolean;
      mergeBy: string | string[]; // 동일성 판단 기준 데이터 키
}
```

- **`columnIndex`**: 병합을 적용할 컬럼의 0-based 인덱스 번호입니다.
- **`mergeBy`**: 인접 행끼리 값이 같은지 비교할 데이터 필드명입니다.

---

## 4. 실무 팁 & 주의사항 (Gotchas)

> [!IMPORTANT]
> **데이터 정렬 선행 필수**:
> 셀 병합은 **연속된 인접 행**의 값이 같을 때만 병합됩니다. 만약 `대분류: '가전'`인 행 사이에 `대분류: '가구'` 행이 끼어있으면 병합이 끊어지므로, 데이터를 그리드에 넘기기 전에 병합 기준 컬럼으로 미리 `sort()`를 수행해두어야 깔끔하게 병합됩니다.
