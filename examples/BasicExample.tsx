import { t } from './i18n';
import * as React from 'react';
import { BGrid, type BGridColumn, type BGridDataItem, type BGridSortParam } from 'beautiful-grid';
import { useContainerSize } from '../hooks/useContainerSize';
import DataGridContainer from '../components/DataGridContainer';

type FulfillmentPriority = 'URGENT' | 'HIGH' | 'NORMAL';
type FulfillmentStatus = 'ON_HOLD' | 'PICKING' | 'PACKED' | 'SHIPPED';

interface FulfillmentOrder {
  orderNo: string;
  priority: FulfillmentPriority;
  status: FulfillmentStatus;
  customer: string;
  product: string;
  orderedQty: number;
  availableQty: number;
  warehouse: string;
  promisedAt: string;
  amount: number;
}

const fulfillmentOrders: BGridDataItem<FulfillmentOrder>[] = [
  {
    values: {
      orderNo: 'SO-260822-1048',
      priority: 'URGENT',
      status: 'ON_HOLD',
      customer: t('ACME 리테일', 'ACME Retail'),
      product: '산업용 센서 A-100',
      orderedQty: 18,
      availableQty: 6,
      warehouse: t('이천 DC', 'Icheon DC'),
      promisedAt: '2026-08-22 14:00',
      amount: 12600000,
    },
  },
  {
    values: {
      orderNo: 'SO-260822-1049',
      priority: 'HIGH',
      status: 'PICKING',
      customer: t('한빛 모빌리티', 'Hanbit Mobility'),
      product: '제어 모듈 CM-8',
      orderedQty: 8,
      availableQty: 8,
      warehouse: t('평택 DC', 'Pyeongtaek DC'),
      promisedAt: '2026-08-22 15:30',
      amount: 5840000,
    },
  },
  {
    values: {
      orderNo: 'SO-260822-1050',
      priority: 'NORMAL',
      status: 'PACKED',
      customer: t('오로라 시스템즈', 'Aurora Systems'),
      product: '게이트웨이 GW-20',
      orderedQty: 24,
      availableQty: 31,
      warehouse: t('이천 DC', 'Icheon DC'),
      promisedAt: '2026-08-22 17:00',
      amount: 9120000,
    },
  },
  {
    values: {
      orderNo: 'SO-260822-1051',
      priority: 'URGENT',
      status: 'ON_HOLD',
      customer: t('세림 테크', 'Serim Tech'),
      product: '서보 드라이브 SD-4',
      orderedQty: 12,
      availableQty: 4,
      warehouse: t('부산 DC', 'Busan DC'),
      promisedAt: '2026-08-22 13:30',
      amount: 10800000,
    },
  },
  {
    values: {
      orderNo: 'SO-260822-1052',
      priority: 'HIGH',
      status: 'PICKING',
      customer: t('미래 자동화', 'Mirae Automation'),
      product: t('PLC 확장 모듈 X2', 'PLC Expansion Module X2'),
      orderedQty: 30,
      availableQty: 30,
      warehouse: t('평택 DC', 'Pyeongtaek DC'),
      promisedAt: '2026-08-22 18:00',
      amount: 7650000,
    },
  },
  {
    values: {
      orderNo: 'SO-260822-1053',
      priority: 'NORMAL',
      status: 'SHIPPED',
      customer: t('대성 로보틱스', 'Daesung Robotics'),
      product: '엔코더 EC-12',
      orderedQty: 15,
      availableQty: 22,
      warehouse: t('이천 DC', 'Icheon DC'),
      promisedAt: '2026-08-22 11:00',
      amount: 4350000,
    },
  },
  {
    values: {
      orderNo: 'SO-260822-1054',
      priority: 'URGENT',
      status: 'ON_HOLD',
      customer: t('뉴웨이브 에너지', 'New Wave Energy'),
      product: '인버터 IV-75',
      orderedQty: 10,
      availableQty: 0,
      warehouse: t('부산 DC', 'Busan DC'),
      promisedAt: '2026-08-22 16:00',
      amount: 18900000,
    },
  },
  {
    values: {
      orderNo: 'SO-260822-1055',
      priority: 'HIGH',
      status: 'PACKED',
      customer: t('정우 정밀', 'Jungwoo Precision'),
      product: '리니어 스케일 LS-9',
      orderedQty: 6,
      availableQty: 9,
      warehouse: t('평택 DC', 'Pyeongtaek DC'),
      promisedAt: '2026-08-22 19:00',
      amount: 3960000,
    },
  },
  {
    values: {
      orderNo: 'SO-260822-1056',
      priority: 'NORMAL',
      status: 'PICKING',
      customer: t('에이스 팩토리', 'Ace Factory'),
      product: '비전 카메라 VC-3',
      orderedQty: 14,
      availableQty: 14,
      warehouse: t('이천 DC', 'Icheon DC'),
      promisedAt: '2026-08-23 09:00',
      amount: 11200000,
    },
  },
  {
    values: {
      orderNo: 'SO-260822-1057',
      priority: 'HIGH',
      status: 'ON_HOLD',
      customer: t('태성 이노텍', 'Taesung Innotek'),
      product: '안전 라이트커튼 LC-5',
      orderedQty: 20,
      availableQty: 13,
      warehouse: t('부산 DC', 'Busan DC'),
      promisedAt: '2026-08-22 20:00',
      amount: 6800000,
    },
  },
  {
    values: {
      orderNo: 'SO-260822-1058',
      priority: 'NORMAL',
      status: 'PACKED',
      customer: t('비전 솔루션', 'Vision Solution'),
      product: t('HMI 패널 H7', 'HMI Panel H7'),
      orderedQty: 5,
      availableQty: 11,
      warehouse: t('평택 DC', 'Pyeongtaek DC'),
      promisedAt: '2026-08-23 10:30',
      amount: 4750000,
    },
  },
  {
    values: {
      orderNo: 'SO-260822-1059',
      priority: 'HIGH',
      status: 'PICKING',
      customer: t('글로벌 메카', 'Global Mecca'),
      product: '토크 센서 TS-2',
      orderedQty: 16,
      availableQty: 16,
      warehouse: t('이천 DC', 'Icheon DC'),
      promisedAt: '2026-08-23 12:00',
      amount: 8320000,
    },
  },
];

const priorityView: Record<FulfillmentPriority, { label: string; className: string }> = {
  URGENT: { label: t('긴급', 'Urgent'), className: 'bg-rose-100 text-rose-700' },
  HIGH: { label: t('높음', 'High'), className: 'bg-amber-100 text-amber-700' },
  NORMAL: { label: t('보통', 'Normal'), className: 'bg-slate-100 text-slate-600' },
};

const statusView: Record<FulfillmentStatus, { label: string; className: string }> = {
  ON_HOLD: { label: t('출고 보류', 'Dispatch Pending'), className: 'bg-rose-100 text-rose-700' },
  PICKING: { label: t('피킹 중', 'Picking in Progress'), className: 'bg-blue-100 text-blue-700' },
  PACKED: { label: t('포장 완료', 'Packaging Completed'), className: 'bg-violet-100 text-violet-700' },
  SHIPPED: { label: t('출고 완료', 'Dispatch Completed'), className: 'bg-emerald-100 text-emerald-700' },
};

const initialColumns: BGridColumn<FulfillmentOrder>[] = [
  { key: 'orderNo', label: t('주문번호', 'Order Number'), width: 145 },
  {
    key: 'priority',
    label: t('우선순위', 'Priority'),
    width: 90,
    align: 'center',
    itemRender: ({ value }) => {
      const view = priorityView[value as FulfillmentPriority];
      return (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${view.className}`}>
          {view.label}
        </span>
      );
    },
  },
  {
    key: 'status',
    label: t('처리상태', 'Processing Status'),
    width: 105,
    align: 'center',
    itemRender: ({ value }) => {
      const view = statusView[value as FulfillmentStatus];
      return (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-semibold ${view.className}`}>
          {view.label}
        </span>
      );
    },
  },
  { key: 'customer', label: t('고객사', 'Client'), width: 145 },
  { key: 'product', label: t('상품', 'Product'), width: 185 },
  {
    key: 'orderedQty',
    label: t('주문수량', 'Order Quantity'),
    width: 95,
    align: 'right',
    itemRender: ({ value }) => <>{Number(value).toLocaleString()}개</>,
  },
  {
    key: 'availableQty',
    label: t('가용재고', 'Available Stock'),
    width: 95,
    align: 'right',
    itemRender: ({ value, values }) => (
      <strong className={values.availableQty < values.orderedQty ? 'text-rose-600' : 'text-emerald-700'}>
        {Number(value).toLocaleString()}개
      </strong>
    ),
  },
  { key: 'warehouse', label: t('출고센터', 'Dispatch Center'), width: 105, align: 'center' },
  { key: 'promisedAt', label: t('출고 약속일', 'Promised Dispatch Date'), width: 155, align: 'center' },
  {
    key: 'amount',
    label: t('주문금액', 'Order Amount'),
    width: 135,
    align: 'right',
    itemRender: ({ value }) => <strong>{Number(value).toLocaleString()}원</strong>,
  },
];

function BasicExample() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width: containerWidth, height: containerHeight } = useContainerSize(containerRef);
  const [columns, setColumns] = React.useState(initialColumns);
  const [sortParams, setSortParams] = React.useState<BGridSortParam[]>([]);
  const [checkedRowKeys, setCheckedRowKeys] = React.useState<React.Key[]>([]);
  const [focusedOrderNo, setFocusedOrderNo] = React.useState(fulfillmentOrders[0].values.orderNo);

  const sortedOrders = React.useMemo(() => {
    const [sort] = sortParams;
    if (!sort?.key) return fulfillmentOrders;

    const key = sort.key as keyof FulfillmentOrder;
    return [...fulfillmentOrders].sort((a, b) => {
      const left = a.values[key];
      const right = b.values[key];
      const result =
        typeof left === 'number' && typeof right === 'number'
          ? left - right
          : String(left).localeCompare(String(right), 'ko');
      return sort.orderBy === 'asc' ? result : -result;
    });
  }, [sortParams]);

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600'>
        <div>
          <strong className='text-slate-900'>주문 출고 예외 관리</strong>
          <span className='ml-2'>재고 부족과 마감 임박 주문을 한 화면에서 우선 처리합니다.</span>
        </div>
        <span aria-live='polite'>
          검토 선택 {checkedRowKeys.length}건 · 현재 주문 {focusedOrderNo}
        </span>
      </div>

      <DataGridContainer ref={containerRef} style={{ height: 400 }}>
        <BGrid<FulfillmentOrder>
          width={containerWidth}
          height={containerHeight}
          headerHeight={36}
          itemHeight={18}
          data={sortedOrders}
          columns={columns}
          rowKey='orderNo'
          frozenColumnIndex={containerWidth > 0 && containerWidth < 640 ? 1 : 3}
          showLineNumber
          rowChecked={{
            checkedRowKeys,
            onChange: (_indexes, rowKeys) => setCheckedRowKeys(rowKeys),
          }}
          sort={{ sortParams, onChange: setSortParams }}
          cellSelectionOptions={{ enabled: true }}
          cellNavigationOptions={{ enabled: true, defaultActiveCell: { rowIndex: 0, columnIndex: 0 } }}
          onChangeColumns={(_columnIndex, info) => setColumns(info.columns)}
          onClick={({ item }) => setFocusedOrderNo(item.orderNo)}
        />
      </DataGridContainer>
    </div>
  );
}

export default BasicExample;
