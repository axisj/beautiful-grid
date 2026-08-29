import { t } from './i18n';
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

const customers = [t('에이원 리테일', 'A1 Retail'), t('한빛상사', 'Hanbit Sangsa'), t('모노마켓', 'Mono Market'), t('오로라스토어', 'Aurora Store'), t('동해유통', 'Donghae Distribution'), t('새봄리빙', 'Saebom Living')];
const channels = [t('자사몰', 'Own Mall'), t('스마트스토어', 'Smart Store'), t('쿠팡', 'Coupang'), 'B2B'];
const products = [t('프리미엄 무선 키보드', 'Premium Wireless Keyboard'), t('27인치 QHD 모니터', '27-inch QHD Monitor'), 'USB-C 멀티 허브', t('인체공학 마우스', 'Ergonomic Mouse'), t('노트북 거치대', 'Laptop Stand')];
const statuses = [t('출고 준비', 'Dispatch Preparation'), t('피킹 완료', 'Picking Completed'), t('배송 중', 'In Transit'), t('출고 보류', 'Dispatch Pending')];
const managers = [t('김서준', 'Seojun Kim'), t('이하린', 'Harin Lee'), t('박도윤', 'Doyun Park'), t('최지우', 'Jiwoo Choi'), t('정유진', 'Yujin Jeong')];
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
    { key: 'orderNo', label: t('주문번호', 'Order Number'), width: 140 },
    { key: 'customerName', label: t('고객사', 'Client'), width: 140 },
    { key: 'channel', label: t('주문채널', 'Order Channel'), width: 100, align: 'center' },
    { key: 'productName', label: t('상품명', 'Product Name'), width: 210 },
    { key: 'quantity', label: t('수량', 'Quantity'), width: 70, align: 'right' },
    {
      key: 'amount',
      label: t('주문금액', 'Order Amount'),
      width: 120,
      align: 'right',
      itemRender: ({ values }) => <>{amountFormatter.format(values.amount)}원</>,
    },
    { key: 'status', label: t('출고상태', 'Dispatch Status'), width: 100, align: 'center' },
    { key: 'manager', label: t('담당자', 'Assignee'), width: 90, align: 'center' },
    { key: 'orderedAt', label: t('주문일', 'Order Date'), width: 110, align: 'center' },
    { key: 'promisedAt', label: t('출고예정일', 'Expected Dispatch Date'), width: 110, align: 'center' },
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
