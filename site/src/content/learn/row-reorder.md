---
title: '행 순서 재배치 (Row Reorder)'
description: '행 좌측 핸들을 포인터나 키보드로 이동하고, 가상 스크롤·선택·병합 셀에서도 안전하게 순서를 저장하는 방법을 학습합니다.'
category: 'interaction'
order: 24
locale: 'ko'
canonicalPath: '/learn/row-reorder'
demoId: 'row-reorder'
features: ['reorder', 'drag-handle', 'onReorder', 'pointer-drag', 'keyboard', 'virtual-scroll']
relatedGuides: ['getting-started', 'basic', 'column-reorder', 'row-selection', 'virtual-scroll', 'accessibility-and-keyboard']
relatedApi: ['/api/props#reorder', '/api/props#showlinenumber', '/api/props#rowkey']
lastReviewedAt: '2026-08-23'
indexable: true
draft: false
---

## 1. 언제 사용하며 왜 필요한가요?

메뉴 관리(Menu Tree), 배너 노출 우선순위 설정, 할 일(TODO) 순서 변경 등 **"사용자가 직접 항목의 순서를 조정하여 저장해야 하는 기능"**에서 행 드래그 재배치는 필수적인 UX입니다.

BeautifulGrid의 `reorder` 기능을 활성화하면:

- 행 번호 영역 좌측에 전용 드래그 핸들 아이콘(`grip-vertical`)이 자동 표시됩니다.
- 이동 중 원본 행과 사이 행이 150ms 계열의 transform으로 움직여 목적지를 미리 보여 줍니다.
- 드롭 모션이 끝난 뒤 새 배열을 한 번 commit하고 `onReorder`에 전달합니다.
- 가상 스크롤의 가장자리 자동 스크롤과 화면 밖 source row용 preview를 지원합니다.
- 핸들에 포커스한 뒤 `Space` 또는 `Enter`, 방향키, `Enter`를 사용해 키보드로도 이동할 수 있습니다.

---

## 2. 실무 완성형 예제: 배너 노출 순서 관리 그리드

```tsx
import React, { useState } from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';

interface BannerItem {
  id: number;
  title: string;
  linkUrl: string;
  active: boolean;
}

export default function BannerReorderGrid() {
  const [data, setData] = useState<BGridDataItem<BannerItem>[]>([
    { values: { id: 1, title: '메인 상단 여름 시즌 프로모션 배너', linkUrl: '/events/summer', active: true } },
    { values: { id: 2, title: '신규 회원 가입 10% 웰컴 쿠폰 안내', linkUrl: '/welcome', active: true } },
    { values: { id: 3, title: '카카오페이 결제 시 5천원 즉시 할인', linkUrl: '/events/kakaopay', active: false } },
    { values: { id: 4, title: '프리미엄 멤버십 오픈 기념 이벤트', linkUrl: '/membership', active: true } },
  ]);

  const columns: BGridColumn<BannerItem>[] = [
    { key: 'id', label: 'ID', width: 60, align: 'center' },
    { key: 'title', label: '배너 제목', width: 280 },
    { key: 'linkUrl', label: '연결 링크', width: 180 },
    {
      key: 'active',
      label: '노출여부',
      width: 90,
      align: 'center',
      itemRender: ({ values }) => (
        <span style={{ color: values.active ? '#16a34a' : '#94a3b8', fontWeight: 600 }}>
          {values.active ? '노출중' : '비활성'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 10, fontSize: 13, color: '#475569' }}>
        💡 행 좌측의 드래그 핸들(점 6개 아이콘)을 마우스로 잡고 위아래로 끌어서 순서를 변경해보세요.
      </div>

      <BGrid<BannerItem>
        width={720}
        height={260}
        columns={columns}
        data={data}
        rowKey='id'
        showLineNumber={true} // 줄번호 영역 표시 (필수)
        reorder={{
          enabled: true, // 행 드래그 재배치 활성화
          onReorder: (newData: BGridDataItem<BannerItem>[]) => {
            console.log('재배치 완료:', newData.map(d => d.values.title));
            setData(newData);
            return true; // 성공 시 true 반환
          },
        }}
      />
    </div>
  );
}
```

## 3. 입력 방법

| 입력 | 동작 |
| --- | --- |
| 마우스·펜·터치 | 핸들을 누른 채 위아래로 이동하고 놓아 확정 |
| `Space` / `Enter` | 포커스된 핸들의 행을 집거나 현재 위치에 놓기 |
| `ArrowUp` / `ArrowDown` | 키보드 이동 중 목적지를 한 행씩 변경 |
| `Escape` | 변경하지 않고 원래 위치로 취소 |

드래그를 시작하기 전의 짧은 클릭은 데이터 순서를 바꾸지 않습니다. 이동 중에는 `onReorder`가 호출되지 않으며, settle이 끝난 뒤 최종 배열로 한 번만 호출됩니다. `prefers-reduced-motion: reduce` 환경에서는 모션과 commit 대기 시간이 함께 제거됩니다.

## 4. `onReorder` 계약과 저장 실패 처리

`onReorder`는 동기 callback입니다. `true` 또는 `void`를 반환하면 새 순서를 유지하고, `false`를 반환하면 내부 데이터·체크·활성 셀 상태를 원래 순서로 되돌립니다. 예외가 발생해도 같은 cleanup과 rollback을 먼저 수행합니다. 서버 저장 Promise를 callback에서 기다리는 pending 계약은 제공하지 않으므로, 원격 저장이 필요한 화면은 애플리케이션 상태에서 낙관적 업데이트와 실패 복구 정책을 별도로 구성하세요.

이동된 wrapper는 `status: edit`로 표시됩니다. 입력 `data` 배열과 기존 row wrapper를 직접 mutate하지 않습니다.

## 5. 선택·편집·행 식별자

- `rowKey`를 지정하면 드래그 도중 외부 render가 발생해도 같은 행 순서인지 안정적으로 판별할 수 있습니다.
- 체크 상태와 활성 셀은 index가 아니라 이동한 데이터 항목을 따라 재매핑됩니다. 다중 셀 range는 잘못된 범위를 남기지 않도록 성공한 reorder 뒤 초기화됩니다.
- 셀 editor가 열려 있으면 핸들을 비활성화해 저장되지 않은 draft를 암묵적으로 버리지 않습니다.
- 드래그 도중 외부 `data` 순서가 바뀌면 현재 reorder session을 취소하고 callback을 호출하지 않습니다.

## 6. 제한과 안전 fallback

- `showLineNumber`와 `reorder.enabled`가 모두 필요합니다.
- client-side 정렬 또는 필터가 적용된 표시 순서는 원본 배열 순서와 다르므로 reorder가 자동 비활성화됩니다.
- frozen row가 있거나 pivot 결과를 렌더링하는 동안에도 reorder가 비활성화됩니다.
- 셀 병합이 설정된 표에서 `rowspan` 셀을 transform하면 겹칠 수 있습니다. 이 경우 행 셀을 직접 이동하지 않고 가벼운 preview와 insertion guide로 목적지를 표시한 뒤 같은 데이터 permutation을 적용합니다.

테마에서는 `--bgrid-row-reorder-duration`, `--bgrid-row-reorder-easing`, `--bgrid-row-reorder-guide-color`, `--bgrid-row-reorder-preview-bg`, `--bgrid-row-reorder-preview-shadow`를 재정의할 수 있습니다.
