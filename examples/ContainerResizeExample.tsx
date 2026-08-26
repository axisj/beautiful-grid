import * as React from 'react';
import { BGrid } from 'beautiful-grid';
import type { BGridColumn, BGridDataItem } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';

interface Order {
  id: string;
  customer: string;
  status: '준비 중' | '배송 중' | '완료';
  amount: number;
}

const columns: BGridColumn<Order>[] = [
  { key: 'id', label: '주문 번호', width: 120 },
  { key: 'customer', label: '고객', width: 180 },
  { key: 'status', label: '상태', width: 110, align: 'center' },
  { key: 'amount', label: '금액', width: 140, align: 'right', itemRender: ({ value }) => `${value.toLocaleString()}원` },
];

const data: BGridDataItem<Order>[] = Array.from({ length: 80 }, (_, index) => ({
  values: {
    id: `ORDER-${String(index + 1).padStart(4, '0')}`,
    customer: `고객 ${index + 1}`,
    status: ['준비 중', '배송 중', '완료'][index % 3] as Order['status'],
    amount: 18000 + index * 750,
  },
}));

export default function ContainerResizeExample() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  return (
    <div>
      <div style={{ alignItems: 'center', display: 'flex', gap: 12, marginBottom: 12 }}>
        <button
          type="button"
          onClick={() => setIsSidebarOpen(open => !open)}
          style={{ background: '#2563eb', border: 0, borderRadius: 6, color: '#fff', cursor: 'pointer', padding: '8px 12px' }}
        >
          {isSidebarOpen ? '사이드 패널 닫기' : '사이드 패널 열기'}
        </button>
        <span style={{ color: '#64748b', fontSize: 13 }}>컨테이너: {Math.round(width)} × {Math.round(height)}px</span>
      </div>

      <div
        style={{
          display: 'grid',
          gap: 12,
          gridTemplateColumns: isSidebarOpen ? 'minmax(150px, 0.35fr) minmax(0, 1fr)' : 'minmax(0, 1fr)',
          height: 440,
        }}
      >
        {isSidebarOpen && (
          <aside style={{ background: '#f1f5f9', borderRadius: 8, color: '#475569', padding: 16 }}>
            <strong style={{ display: 'block', marginBottom: 8 }}>필터 패널</strong>
            화면 폭이 줄어도 그리드는 이 영역의 정확한 크기를 다시 측정합니다.
          </aside>
        )}
        <DataGridContainer ref={containerRef} style={{ height: '100%', minWidth: 0 }}>
          <BGrid<Order> width={width} height={height} columns={columns} data={data} />
        </DataGridContainer>
      </div>
    </div>
  );
}
