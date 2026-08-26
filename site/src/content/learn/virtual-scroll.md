---
title: "대용량 가상 스크롤 (Virtual Scroll)"
description: "현재 viewport에 필요한 행을 중심으로 렌더링하는 가상 스크롤(Virtual Scrolling)의 원리와 적용 시 주의사항을 알아봅니다."
category: "data-and-columns"
order: 7
locale: "ko"
canonicalPath: "/learn/virtual-scroll"
demoId: "virtual-scroll"
features: ["virtual-scrolling", "large-dataset", "performance", "dom-recycling", "itemHeight", "showLineNumber"]
relatedGuides: ["getting-started", "basic", "scrollbar", "pagination"]
relatedApi: ["/api/props#itemheight", "/api/props#height", "/api/props#data", "/api/props#showlinenumber"]
lastReviewedAt: "2026-08-25"
indexable: true
draft: false
---

## 1. 개요 및 가상 스크롤이 왜 필수적인가?

일반적인 HTML `<table>`에 1만 개 이상의 `<tr>`을 한 번에 렌더링하면 어떻게 될까요?
1. **브라우저 멈춤(Freezing)**: 수만 개의 DOM 노드를 생성하고 계산하느라 메인 스레드가 수 초간 정지합니다.
2. **엄청난 메모리 점유**: DOM 노드 하나당 할당되는 메모리로 인해 탭이 다운(Crash)될 수 있습니다.
3. **스크롤 버벅임(Jank)**: 스크롤 시 브라우저가 수만 개의 레이아웃을 다시 계산(Reflow/Repaint)하느라 프레임 드랍이 발생합니다.

**BeautifulGrid의 가상 스크롤(Virtual Scrolling) 로직**은 `height`, `itemHeight`, 스크롤 위치를 이용해 현재 viewport 주변의 행을 계산하고 해당 범위를 렌더링합니다. 실제 렌더 행 수와 체감 성능은 그리드 높이, 셀 렌더러 복잡도, 브라우저 환경에 따라 달라집니다.

---

## 2. 가상 스크롤의 내부 계산 원리

BeautifulGrid는 스크롤 이벤트 발생 시 다음과 같은 공식으로 렌더링할 행의 범위를 O(1) 시간 복잡도로 즉시 계산합니다:

위 라이브 데모는 별도의 행 높이 조정 없이 기본값인 29px(`itemHeight` 15px + 위아래 `itemPadding` 7px)을 사용합니다. 55만 행의 스크롤 높이는 부가 영역을 포함해 약 15,950,030px로, 데스크톱 Chromium에서 확인한 단일 스크롤 영역 상한 16,777,216px보다 약 827,186px 낮습니다. 한계에 맞춘 최대치가 아니라 약 4.9%의 여유를 둔 이유이며, 왼쪽 행 번호로 마지막 550,000번째 행까지 도달했는지 확인할 수 있습니다.

55만 행을 유지할 때 사용할 수 있는 최대 정수 행 높이는 `(16,777,216px - 부가 영역 30px) ÷ 550,000행`을 내림한 **30px**입니다. 기본 `itemPadding={7}`을 유지한다면 `itemHeight` prop은 최대 16px(`16 + 7 × 2 = 30px`)이고, 기본 `itemHeight={15}`는 전체 행 높이 29px이므로 1px의 설정 여유가 있습니다. 이는 Chromium에서 확인한 한계이며 브라우저와 레이아웃 구성에 따라 달라질 수 있습니다.

```text
1. 뷰포트 행 개수: displayItemCount = Math.ceil(height / itemHeight)
2. 시작 인덱스: startIndex = Math.floor(scrollTop / itemHeight)
3. 종료 인덱스: endIndex = startIndex + displayItemCount + 3 (버퍼 여유분)
4. 상단 여백 보정: topPadding = startIndex * itemHeight
```

가상화는 DOM 행 수를 줄이지만 전달한 원본 데이터 자체는 메모리에 존재합니다. 대용량 데이터에서는 초기 데이터 생성·전송 비용, 셀 렌더러 비용, 정렬·필터 처리 비용도 별도로 측정해야 합니다.

---

## 3. 실무 샘플 코드: 10,000건 대용량 거래 로그 뷰어

아래 코드는 10,000건의 로그 데이터를 즉시 생성하고, 가상 스크롤 데이터 전체에 정렬과 필터를 적용하는 완성된 예제입니다:

```tsx
import React, { useCallback, useMemo, useState, useTransition } from 'react';
import {
  BGrid,
  type BGridColumn,
  type BGridDataItem,
  type BGridDataQuery,
} from 'beautiful-grid';

interface LogItem {
  id: number;
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  service: string;
  message: string;
  latencyMs: number;
}

export default function LargeLogViewer() {
  const [isQueryPending, startQueryTransition] = useTransition();
  const [query, setQuery] = useState<BGridDataQuery>({ sortParams: [], filterParams: [] });
  const handleQueryChange = useCallback((nextQuery: BGridDataQuery) => {
    startQueryTransition(() => setQuery(nextQuery));
  }, [startQueryTransition]);

  // 1. 10,000건의 mock 데이터 고속 생성
  const data: BGridDataItem<LogItem>[] = useMemo(() => {
    const levels: LogItem['level'][] = ['INFO', 'WARN', 'ERROR', 'DEBUG'];
    const services = ['auth-service', 'order-api', 'payment-gateway', 'notification-worker'];

    return Array.from({ length: 10000 }).map((_, i) => ({
      values: {
        id: i + 1,
        timestamp: new Date(Date.now() - (10000 - i) * 1000).toISOString().replace('T', ' ').substring(0, 19),
        level: levels[i % levels.length],
        service: services[i % services.length],
        message: `Request processed for user_session_${1000 + (i % 500)} with HTTP 200 OK`,
        latencyMs: Math.floor(Math.random() * 450) + 10,
      },
    }));
  }, []);

  // 2. 컬럼 구성
  const columns: BGridColumn<LogItem>[] = [
    { id: 'id', key: 'id', label: '로그 ID', width: 90, align: 'center', toolbox: true, filter: { type: 'number' } },
    { id: 'timestamp', key: 'timestamp', label: '발생 시각', width: 170, align: 'center', toolbox: true, filter: { type: 'text' } },
    {
      id: 'level',
      key: 'level',
      label: '레벨',
      width: 90,
      align: 'center',
      toolbox: true,
      filter: { type: 'values' },
      itemRender: ({ values }) => {
        const colors = {
          INFO: '#2563eb',
          WARN: '#d97706',
          ERROR: '#dc2626',
          DEBUG: '#64748b',
        };
        return (
          <span style={{ fontWeight: 700, color: colors[values.level] }}>
            {values.level}
          </span>
        );
      },
    },
    { id: 'service', key: 'service', label: '서비스명', width: 160, toolbox: true, filter: { type: 'values' } },
    { id: 'message', key: 'message', label: '로그 메시지', width: 380, toolbox: true, filter: { type: 'text' } },
    {
      id: 'latencyMs',
      key: 'latencyMs',
      label: '응답시간(ms)',
      width: 120,
      align: 'right',
      toolbox: true,
      filter: { type: 'number' },
      itemRender: ({ values }) => (
        <span style={{ color: values.latencyMs > 300 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
          {values.latencyMs} ms
        </span>
      ),
    },
  ];

  return (
    <div>
      <div style={{ marginBottom: 12, fontSize: 14, color: '#475569' }}>
        총 <strong>{data.length.toLocaleString()}</strong>건의 실시간 로그 데이터가 가상 스크롤로 로드되었습니다.
      </div>

      <BGrid<LogItem>
        width={850}
        height={450} // 뷰포트 높이 고정 (필수)
        columns={columns}
        data={data}
        rowKey="id"
        showLineNumber // 가상 스크롤 위치와 전체 데이터 범위를 확인
        dataControl={{
          mode: 'client',
          multiSort: true,
          query,
          onChange: handleQueryChange,
        }}
        spinning={isQueryPending}
        itemHeight={28} // 행 높이 지정 (기본 25~28px 권장)
        headerHeight={34}
      />
    </div>
  );
}
```

---

## 4. 고성능 렌더링을 위한 실무 최적화 팁

### 1) `itemRender` 내부에서 무거운 계산이나 훅 호출 금지
가상 스크롤 시 스크롤 위치가 바뀔 때마다 뷰포트 안의 행들이 빠르게 리렌더링됩니다.
`itemRender` 콜백 안에서 무거운 정규식 파싱, 대용량 배열 필터링, 새로운 객체 대량 생성을 피하고 단순한 포맷팅 위주로 작성하세요.

### 2) `itemHeight`를 데이터 내용에 맞게 정확히 지정
각 행의 높이가 `itemHeight`와 불일치하면 스크롤바 이동 시 미세한 덜컥거림이 생길 수 있습니다. 디자인 시안에 맞추어 `itemHeight={28}` 또는 `32`처럼 명시적 높이를 고정하세요.

### 3) 부모 컨테이너 크기 변경 감지 (`useContainerSize`)
화면 전체를 채우는 대시보드에서는 고정 픽셀 대신 컨테이너 크기 측정 훅을 사용하여 `width`와 `height`를 전달하면 창 크기 조절 시에도 가상 스크롤 범위가 매끄럽게 재계산됩니다.

### 4) 55만 행의 정렬·필터는 서버 조회로 분리
위 라이브 데모는 55만 행 전체에서 가상 스크롤의 위치 일관성을 확인하는 데 집중합니다. 이 정도 규모를 브라우저에서 한 번에 정렬·필터하면 UI 응답성이 크게 떨어질 수 있으므로, 실제 업무에서는 `dataControl.mode: 'manual'`과 서버 조회 또는 페이지네이션을 사용하세요. 비교적 작은 클라이언트 데이터의 정렬·필터 구성은 [정렬 및 필터 툴박스](/learn/sorting-filtering)에서 확인할 수 있습니다.

---

## 5. 자주 묻는 질문 (FAQ)

**Q. 가상 스크롤이 적용되면 브라우저 검색(Ctrl + F)은 어떻게 되나요?**
가상 스크롤 테이블은 현재 뷰포트에 보이는 행만 DOM에 존재하므로 브라우저 기본 Ctrl+F는 화면 밖의 데이터를 찾을 수 없습니다. 대용량 데이터에서 검색이 필요한 경우 [헤더 툴박스 필터링](/learn/sorting-filtering) 기능을 사용하여 그리드 자체 필터를 제공하는 것이 표준적인 방법입니다.
