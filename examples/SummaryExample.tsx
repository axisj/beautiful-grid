import { Radio } from 'antd';
import * as React from 'react';
import { BGrid, BGridColumn, BGridDataItem, BGridProps } from 'beautiful-grid';
import { useContainerSize } from '../hooks/useContainerSize';
import DataGridContainer from '../components/DataGridContainer';

interface SalesOrder {
  channel: string;
  orderNo: string;
  customer: string;
  quantity: number;
  supplyAmount: number;
  taxAmount: number;
  totalAmount: number;
}

const customers = ['에이원 리테일', '한빛상사', '모노마켓', '오로라스토어'];
const channels = ['자사몰', '스마트스토어', 'B2B'];
const data: BGridDataItem<SalesOrder>[] = Array.from({ length: 30 }, (_, index) => {
  const quantity = (index % 8) + 1;
  const supplyAmount = quantity * (48_000 + (index % 5) * 12_000);
  const taxAmount = Math.round(supplyAmount * 0.1);
  return {
    values: {
      channel: channels[index % channels.length],
      orderNo: `ORD-2026-${String(index + 1).padStart(5, '0')}`,
      customer: customers[index % customers.length],
      quantity,
      supplyAmount,
      taxAmount,
      totalAmount: supplyAmount + taxAmount,
    },
  };
});

const formatWon = (value: number) => `${value.toLocaleString()}원`;
const sumBy = (rows: BGridDataItem<SalesOrder>[], key: 'quantity' | 'supplyAmount' | 'taxAmount' | 'totalAmount') =>
  rows.reduce((total, item) => total + item.values[key], 0);

const createSummary = (position: 'top' | 'bottom'): BGridProps<SalesOrder>['summary'] => ({
  position,
  columns: [
    {
      columnIndex: 0,
      colSpan: 3,
      align: 'center',
      itemRender: ({ data }) => <strong>{position === 'top' ? '상단' : '하단'} 매출 합계 · {data.length}건</strong>,
    },
    { columnIndex: 3, align: 'right', itemRender: ({ data }) => <strong>{sumBy(data, 'quantity')}개</strong> },
    { columnIndex: 4, align: 'right', itemRender: ({ data }) => <strong>{formatWon(sumBy(data, 'supplyAmount'))}</strong> },
    { columnIndex: 5, align: 'right', itemRender: ({ data }) => <strong>{formatWon(sumBy(data, 'taxAmount'))}</strong> },
    { columnIndex: 6, align: 'right', itemRender: ({ data }) => <strong>{formatWon(sumBy(data, 'totalAmount'))}</strong> },
  ],
});

function SummaryExample() {
  const [position, setPosition] = React.useState<'top' | 'bottom'>('top');
  const [columns, setColumns] = React.useState<BGridColumn<SalesOrder>[]>([
    { key: 'channel', label: '주문채널', width: 100, align: 'center' },
    { key: 'orderNo', label: '주문번호', width: 140 },
    { key: 'customer', label: '고객사', width: 150 },
    { key: 'quantity', label: '수량', width: 80, align: 'right' },
    { key: 'supplyAmount', label: '공급가액', width: 130, align: 'right', itemRender: ({ values }) => <>{formatWon(values.supplyAmount)}</> },
    { key: 'taxAmount', label: '부가세', width: 110, align: 'right', itemRender: ({ values }) => <>{formatWon(values.taxAmount)}</> },
    { key: 'totalAmount', label: '결제금액', width: 140, align: 'right', itemRender: ({ values }) => <strong>{formatWon(values.totalAmount)}</strong> },
  ]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  return (
    <>
      <Radio.Group
        style={{ marginBottom: 10 }}
        options={[{ label: '상단 요약', value: 'top' }, { label: '하단 요약', value: 'bottom' }]}
        value={position}
        onChange={event => setPosition(event.target.value)}
      />
      <DataGridContainer ref={containerRef}>
        <BGrid<SalesOrder>
          showLineNumber
          frozenColumnIndex={1}
          width={width}
          height={height}
          data={data}
          columns={columns}
          rowKey='orderNo'
          onChangeColumns={(_columnIndex, { columns }) => setColumns(columns)}
          variant='vertical-bordered'
          summary={createSummary(position)}
        />
      </DataGridContainer>
    </>
  );
}

export default SummaryExample;
