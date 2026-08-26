---
title: "행 선택 및 체크박스 (Checkbox & Radio Selection)"
description: "체크박스 다중 선택, 라디오 단일 선택, 전체 선택(Indeterminate) 및 제어 컴포넌트 상태 연동 방법을 학습합니다."
category: "interaction"
order: 21
locale: "ko"
canonicalPath: "/learn/row-selection"
demoId: "row-selection"
features: ["rowChecked", "checkbox", "radio", "checkedRowKeys", "indeterminate", "batch-action"]
relatedGuides: ["getting-started", "basic", "focus", "editing"]
relatedApi: ["/api/props#rowchecked", "/api/props#bgridrowchecked-checkedrowkeys", "/api/props#selectedrowkey"]
lastReviewedAt: "2026-08-17"
indexable: true
draft: false
---

## 1. 언제 사용하며 왜 필요한가요?

관리자 화면에서 가장 빈번한 작업 중 하나는 **"체크박스로 여러 항목을 선택한 뒤 일괄 삭제, 일괄 승인, 일괄 엑셀 다운로드"**를 수행하는 일입니다.

BeautifulGrid는 다음과 같은 행 선택 기능을 기본 제공합니다:
- **다중 선택 (Checkbox)**: 여러 행을 체크박스로 선택
- **단일 선택 (Radio)**: 오직 하나의 행만 선택 가능하도록 강제
- **전체 선택 삼중 상태 (Tri-state)**: 전체 선택(`true`), 전체 해제(`false`), 일부만 선택됨(`indeterminate`)을 헤더 체크박스에 자동 반영
- **고유 키 기반 선택 (`checkedRowKeys`)**: 가상 스크롤이나 정렬/필터링 후에도 선택 상태를 안정적으로 유지

---

## 2. 실무 완성형 예제: 결제 승인 대기 목록 일괄 처리

아래 코드는 체크박스 선택 상태를 React 상태(`checkedKeys`)와 동기화하고, 선택된 항목들을 일괄 승인 처리하는 실무 예제입니다:

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface PaymentItem {
  id: string;
  applicant: string;
  department: string;
  purpose: string;
  amount: number;
  requestDate: string;
}

export default function PaymentApprovalGrid() {
  // 선택된 행의 ID 목록 상태 관리 (Controlled State)
  const [checkedKeys, setCheckedKeys] = useState<string[]>(['REQ-002']);

  const [data, setData] = useState<BGridDataItem<PaymentItem>[]>([
    { values: { id: 'REQ-001', applicant: '강현우', department: '영업1팀', purpose: '고객사 미팅 교통비', amount: 35000, requestDate: '2026-08-16' } },
    { values: { id: 'REQ-002', applicant: '송유진', department: '개발기획팀', purpose: '클라우드 서버 사용료', amount: 890000, requestDate: '2026-08-16' } },
    { values: { id: 'REQ-003', applicant: '임재원', department: '인사총무팀', purpose: '사무용품 구매', amount: 120000, requestDate: '2026-08-17' } },
    { values: { id: 'REQ-004', applicant: '오세훈', department: '마케팅팀', purpose: '온라인 광고 집행비', amount: 1500000, requestDate: '2026-08-17' } },
  ]);

  const columns: BGridColumn<PaymentItem>[] = [
    { key: 'id', label: '신청번호', width: 100, align: 'center' },
    { key: 'applicant', label: '신청자', width: 100, align: 'center' },
    { key: 'department', label: '소속부서', width: 130 },
    { key: 'purpose', label: '지출목적', width: 220 },
    {
      key: 'amount',
      label: '신청금액',
      width: 130,
      align: 'right',
      itemRender: ({ values }) => <strong>{values.amount.toLocaleString()}원</strong>,
    },
    { key: 'requestDate', label: '신청일자', width: 120, align: 'center' },
  ];

  // 일괄 승인 핸들러
  const handleApproveBatch = () => {
    if (checkedKeys.length === 0) {
      alert('승인할 항목을 1개 이상 선택해주세요.');
      return;
    }

    const selectedItems = data.filter(d => checkedKeys.includes(d.values.id));
    const totalAmount = selectedItems.reduce((sum, item) => sum + item.values.amount, 0);

    const confirmed = confirm(
      `선택된 ${selectedItems.length}건 (총 ${totalAmount.toLocaleString()}원)을 일괄 승인하시겠습니까?`
    );

    if (confirmed) {
      // 승인된 데이터 목록에서 제외
      setData(prev => prev.filter(d => !checkedKeys.includes(d.values.id)));
      setCheckedKeys([]);
      alert('정상적으로 승인 처리되었습니다.');
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          선택된 항목: <strong>{checkedKeys.length}</strong> / {data.length}건
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => setCheckedKeys(data.map(d => d.values.id))}
            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: 4, cursor: 'pointer' }}
          >
            전체 선택
          </button>
          <button
            onClick={() => setCheckedKeys([])}
            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', background: '#fff', borderRadius: 4, cursor: 'pointer' }}
          >
            선택 해제
          </button>
          <button
            onClick={handleApproveBatch}
            style={{ padding: '6px 16px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 'bold', cursor: 'pointer' }}
          >
            일괄 승인 ({checkedKeys.length})
          </button>
        </div>
      </div>

      <BGrid<PaymentItem>
        width={780}
        height={300}
        columns={columns}
        data={data}
        rowKey="id"
        rowChecked={{
          checkedIndexes: [], // 또는 checkedRowKeys 사용
          checkedRowKeys: checkedKeys,
          onChange: (checkedIndexes, checkedRowKeys, checkedAll) => {
            console.log('선택 상태 변경:', { checkedIndexes, checkedRowKeys, checkedAll });
            setCheckedKeys(checkedRowKeys);
          },
        }}
        showLineNumber={true}
      />
    </div>
  );
}
```

---

## 3. `rowChecked` 옵션 완벽 가이드

`rowChecked` prop을 객체로 넘겨주면 헤더 및 행 좌측에 전용 선택 컨트롤(체크박스/라디오)이 자동 생성됩니다.

```tsx
interface BGridRowChecked<T> {
  // true이면 단일 선택 라디오 UI를 사용
  isRadio?: boolean;

  // 인덱스 기반 선택 목록 (Uncontrolled 또는 인덱스 제어 시)
  checkedIndexes?: number[];

  // 고유 키 기반 선택 목록 (Controlled 상태 관리 시 추천)
  checkedRowKeys?: React.Key[];

  // 선택 상태 변경 시 콜백
  onChange: (
    checkedIndexes: number[],
    checkedRowKeys: React.Key[],
    checkedAll: boolean | 'indeterminate'
  ) => void;
}
```

---

## 4. 실무 팁 & 주의사항 (Gotchas)

> [!TIP]
> **1. 인덱스(`checkedIndexes`) 대신 키(`checkedRowKeys`)를 사용하세요**:
> 사용자가 컬럼 정렬(Sort)을 바꾸거나 검색 필터를 적용하면 행의 인덱스(0, 1, 2...)는 계속 바뀝니다. `rowKey="id"`와 `checkedRowKeys`를 사용하면 정렬이나 필터가 변경되어도 선택한 데이터가 정확하게 유지됩니다.

> [!NOTE]
> **2. 단일 선택 라디오(`isRadio: true`) 사용 시**:
> `rowChecked={{ isRadio: true, checkedRowKeys: [selectedId], onChange: (_, keys) => setSelectedId(keys[0]) }}` 형태로 설정하면 라디오 버튼 UI로 전환됩니다.
