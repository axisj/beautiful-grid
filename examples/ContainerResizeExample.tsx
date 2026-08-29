import { t } from './i18n';
import * as React from 'react';
import { BGrid } from 'beautiful-grid';
import type { BGridColumn, BGridDataItem } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';

interface Order {
  id: string;
  customer: string;
  status: string;
  amount: number;
}

const columns: BGridColumn<Order>[] = [
  { key: 'id', label: t('주문 번호', 'Order Number'), width: 120 },
  { key: 'customer', label: t('고객', 'Customer'), width: 180 },
  { key: 'status', label: t('상태', 'Status'), width: 110, align: 'center' },
  { key: 'amount', label: t('금액', 'Amount'), width: 140, align: 'right', itemRender: ({ value }) => `${value.toLocaleString()}${t('원', 'KRW')}` },
];

const data: BGridDataItem<Order>[] = Array.from({ length: 80 }, (_, index) => ({
  values: {
    id: `ORDER-${String(index + 1).padStart(4, '0')}`,
    customer: `${t('고객', 'Customer')} ${index + 1}`,
    status: [t('준비 중', 'Preparing'), t('배송 중', 'In Transit'), t('완료', 'Completed')][index % 3] as Order['status'],
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
          {isSidebarOpen ? t('사이드 패널 닫기', 'Close Side Panel') : t('사이드 패널 열기', 'Open Side Panel')}
        </button>
        <span style={{ color: '#64748b', fontSize: 13 }}>{t('컨테이너', 'Container')}: {Math.round(width)} × {Math.round(height)}px</span>
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
            <strong style={{ display: 'block', marginBottom: 8 }}>{t('필터 패널', 'Filter Panel')}</strong>
            {t('화면 폭이 줄어도 그리드는 이 영역의 정확한 크기를 다시 측정합니다.', 'The grid will remeasure the exact size of this area even if the screen width decreases.')}
          </aside>
        )}
        <DataGridContainer ref={containerRef} style={{ height: '100%', minWidth: 0 }}>
          <BGrid<Order> width={width} height={height} columns={columns} data={data} />
        </DataGridContainer>
      </div>
    </div>
  );
}
