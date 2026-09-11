---
title: "그리드 비활성화 (Disabled State)"
description: "작업 처리 중 DataGrid의 클릭, 선택, 편집, 정렬, 필터, 컨텍스트 메뉴, 페이징 등 UI 상호작용을 한 번에 잠그는 방법을 학습합니다."
category: "interaction"
order: 26
locale: "ko"
canonicalPath: "/learn/disabled"
demoId: "disabled"
features: ["disabled", "readonly", "editing", "rowChecked", "pagination", "toolbox"]
relatedGuides: ["loading", "editing", "row-selection", "sorting-filtering", "pagination"]
relatedApi: ["/api/props#disabled", "/api/props#editable", "/api/props#rowchecked", "/api/props#page"]
sinceVersion: "1.0.7"
lastReviewedAt: "2026-09-08"
indexable: true
draft: false
---

## 1. 언제 사용하나요?

저장, 승인, 재계산처럼 서버 처리가 진행되는 동안 사용자가 같은 그리드를 다시 조작하면 중복 요청이나 화면 상태 불일치가 생길 수 있습니다. 이때 `disabled`를 켜면 BeautifulGrid가 스크롤을 제외한 UI 상호작용을 한 번에 잠급니다.

`disabled`는 단순히 편집만 막는 옵션이 아닙니다. 셀 클릭, 행 체크박스, checkbox editor, 헤더 정렬과 필터 툴박스, 컬럼 리사이즈, 셀 선택, 키보드 이동, 컨텍스트 메뉴, 검색 UI, 페이지 이동 요청까지 비활성화합니다.

---

## 2. 기본 사용법

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface Row {
  id: string;
  name: string;
  approved: boolean;
}

export default function DisabledGrid() {
  const [disabled, setDisabled] = useState(false);
  const [checkedRowKeys, setCheckedRowKeys] = useState<React.Key[]>([]);

  const data: BGridDataItem<Row>[] = [
    { values: { id: 'REQ-001', name: '월말 재고 보충', approved: false } },
    { values: { id: 'REQ-002', name: '긴급 운송비 승인', approved: true } },
  ];

  const columns: BGridColumn<Row>[] = [
    { key: 'id', label: '요청번호', width: 110 },
    { key: 'name', label: '제목', width: 220 },
    {
      key: 'approved',
      label: '승인',
      width: 90,
      align: 'center',
      editable: true,
      editor: {
        type: 'checkbox',
        ariaLabel: ({ values }) => `${values.id} 승인 여부`,
      },
    },
  ];

  return (
    <>
      <button type="button" onClick={() => setDisabled(value => !value)}>
        {disabled ? '잠금 해제' : '그리드 잠금'}
      </button>

      <BGrid<Row>
        width={520}
        height={260}
        columns={columns}
        data={data}
        rowKey="id"
        disabled={disabled}
        editable
        rowChecked={{
          checkedRowKeys,
          onChange: (_indexes, rowKeys) => setCheckedRowKeys(rowKeys),
        }}
      />
    </>
  );
}
```

---

## 3. `loading`, `spinning`과 함께 쓰기

`loading`과 `spinning`은 상태를 표시하고, `disabled`는 조작을 막습니다. 처리 중에는 두 역할을 같이 묶어 두는 패턴이 가장 명확합니다.

```tsx
<BGrid
  loading={initialLoading}
  spinning={saving}
  disabled={initialLoading || saving}
  columns={columns}
  data={data}
  width={width}
  height={height}
/>
```

이렇게 하면 사용자는 현재 그리드가 처리 중임을 시각적으로 이해하고, 컴포넌트는 불필요한 이벤트를 발생시키지 않습니다.

---

## 4. 동작 범위

| 영역 | `disabled=true`일 때 |
| --- | --- |
| 셀 클릭과 더블클릭 | `onClick` 및 편집 진입이 발생하지 않음 |
| 행 선택 | 체크박스와 라디오 선택 변경이 발생하지 않음 |
| 셀 편집 | text, checkbox, editor plugin 편집 진입과 커밋이 발생하지 않음 |
| 정렬과 필터 | 헤더 정렬, 툴박스 열기, 필터 적용이 발생하지 않음 |
| 셀 선택과 키보드 이동 | 활성 셀 이동, 범위 선택, 복사·붙여넣기 요청이 발생하지 않음 |
| 컨텍스트 메뉴와 검색 | 메뉴와 검색 UI가 열리지 않음 |
| 페이지네이션 | 페이지 번호 클릭이 `page.onChange`를 호출하지 않음 |
| 스크롤 | 데이터 탐색을 위해 계속 가능 |

상위 업무 화면에서 버튼이나 폼도 함께 잠가야 한다면, 그리드의 `disabled`와 별도로 외부 UI의 `disabled` 상태를 같은 플래그로 제어하세요.
