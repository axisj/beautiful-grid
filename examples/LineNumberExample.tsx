import * as React from 'react';
import { BGrid, BGridColumn, BGridDataItem } from 'beautiful-grid';
import { useContainerSize } from '../hooks/useContainerSize';
import DataGridContainer from '../components/DataGridContainer';

interface FulfillmentOrder {
  orderNo: string;
  customerName: string;
  channel: string;
  productName: string;
  quantity: number;
  amount: number;
  status: string;
  manager: string;
  orderedAt: string;
  promisedAt: string;
}

export const LINE_NUMBER_RECORD_COUNT = 2_500;

const customers = ['에이원 리테일', '한빛상사', '모노마켓', '오로라스토어', '동해유통', '새봄리빙'];
const channels = ['자사몰', '스마트스토어', '쿠팡', 'B2B'];
const products = ['프리미엄 무선 키보드', '27인치 QHD 모니터', 'USB-C 멀티 허브', '인체공학 마우스', '노트북 거치대'];
const statuses = ['출고 준비', '피킹 완료', '배송 중', '출고 보류'];
const managers = ['김서준', '이하린', '박도윤', '최지우', '정유진'];
const amountFormatter = new Intl.NumberFormat('ko-KR');

const addDays = (base: Date, days: number) => {
  const date = new Date(base);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

const list: BGridDataItem<FulfillmentOrder>[] = Array.from({ length: LINE_NUMBER_RECORD_COUNT }, (_, index) => {
  const quantity = (index % 12) + 1;
  const orderedDate = new Date(Date.UTC(2026, 3, 1 + (index % 120)));

  return {
    values: {
      orderNo: `ORD-2026-${String(index + 1).padStart(6, '0')}`,
      customerName: customers[index % customers.length],
      channel: channels[index % channels.length],
      productName: products[index % products.length],
      quantity,
      amount: quantity * (39_800 + (index % 7) * 7_500),
      status: statuses[index % statuses.length],
      manager: managers[index % managers.length],
      orderedAt: addDays(orderedDate, 0),
      promisedAt: addDays(orderedDate, 2 + (index % 4)),
    },
  };
});

function LineNumberExample() {
  const [columns, setColumns] = React.useState<BGridColumn<FulfillmentOrder>[]>([
    { key: 'orderNo', label: '주문번호', width: 140 },
    { key: 'customerName', label: '고객사', width: 140 },
    { key: 'channel', label: '주문채널', width: 100, align: 'center' },
    { key: 'productName', label: '상품명', width: 210 },
    { key: 'quantity', label: '수량', width: 70, align: 'right' },
    {
      key: 'amount',
      label: '주문금액',
      width: 120,
      align: 'right',
      itemRender: ({ values }) => <>{amountFormatter.format(values.amount)}원</>,
    },
    { key: 'status', label: '출고상태', width: 100, align: 'center' },
    { key: 'manager', label: '담당자', width: 90, align: 'center' },
    { key: 'orderedAt', label: '주문일', width: 110, align: 'center' },
    { key: 'promisedAt', label: '출고예정일', width: 110, align: 'center' },
  ]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width: containerWidth, height: containerHeight } = useContainerSize(containerRef);

  return (
    <DataGridContainer ref={containerRef}>
      <BGrid<FulfillmentOrder>
        width={containerWidth}
        height={containerHeight}
        data={list}
        columns={columns}
        rowKey='orderNo'
        onChangeColumns={(_columnIndex, { columns }) => setColumns(columns)}
        onClick={item => console.log(item)}
        cellSelectionOptions={{ enabled: true }}
        showLineNumber
      />
    </DataGridContainer>
  );
}

export default LineNumberExample;
