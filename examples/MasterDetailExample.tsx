import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { BGrid, type BGridColumn, type BGridDataItem, type BGridMasterDetailExpandMode } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import { exampleMsg, t } from './i18n';
import './masterDetail.css';
import { Button, Select } from 'antd';

interface OrderItem {
  itemCode: string;
  productName: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
}

interface OrderRow {
  orderId: string;
  customer: string;
  orderDate: string;
  status: string;
  itemCount: number;
  totalAmount: number;
  notes?: string;
  items: OrderItem[];
}

const sampleItemsPool: Omit<OrderItem, 'quantity' | 'subtotal'>[] = [
  { itemCode: 'PRD-101', productName: 'Ergonomic Keyboard', unitPrice: 129000 },
  { itemCode: 'PRD-102', productName: 'Wireless Vertical Mouse', unitPrice: 65000 },
  { itemCode: 'PRD-103', productName: '4K Ultra-wide Monitor 34"', unitPrice: 680000 },
  { itemCode: 'PRD-104', productName: 'Noise Cancelling Headset', unitPrice: 249000 },
  { itemCode: 'PRD-105', productName: 'USB-C Multi-hub Dock', unitPrice: 89000 },
  { itemCode: 'PRD-106', productName: 'Desk Mat Large (Black)', unitPrice: 25000 },
  { itemCode: 'PRD-107', productName: 'Aluminum Laptop Stand', unitPrice: 42000 },
];

const customerNames = [
  'Alice Kim',
  'Bob Lee',
  'Charlie Park',
  'David Choi',
  'Emma Jung',
  'Frank Kang',
  'Grace Yoon',
  'Henry Shin',
  'Isabella Han',
  'Jack Song',
];

const statusOptions = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

const generateOrders = (count: number): BGridDataItem<OrderRow>[] => {
  const list: BGridDataItem<OrderRow>[] = [];
  for (let i = 1; i <= count; i++) {
    const idNum = String(i).padStart(4, '0');
    const orderId = `ORD-${idNum}`;
    const customer = customerNames[(i - 1) % customerNames.length];
    const status = statusOptions[(i - 1) % statusOptions.length];
    const day = String((i % 28) + 1).padStart(2, '0');
    const orderDate = `2026-03-${day}`;

    // 0 to 4 line items (some orders have 0 items to demonstrate hasDetail: false)
    const itemCount = i % 7 === 0 ? 0 : (i % 4) + 1;
    const items: OrderItem[] = [];
    let total = 0;

    for (let j = 0; j < itemCount; j++) {
      const sample = sampleItemsPool[(i - 1 + j) % sampleItemsPool.length];
      const qty = (j % 3) + 1;
      const subtotal = sample.unitPrice * qty;
      total += subtotal;
      items.push({
        ...sample,
        quantity: qty,
        subtotal,
      });
    }

    list.push({
      values: {
        orderId,
        customer,
        orderDate,
        status,
        itemCount,
        totalAmount: total,
        notes: itemCount > 0 ? `Please handle with care. Ship via express.` : undefined,
        items,
      },
    });
  }
  return list;
};

const ordersData = generateOrders(60);

const masterColumns: BGridColumn<OrderRow>[] = [
  {
    id: 'orderId',
    key: 'orderId',
    label: t('주문 번호', 'Order ID'),
    width: 130,
  },
  {
    id: 'customer',
    key: 'customer',
    label: t('고객명', 'Customer'),
    width: 140,
  },
  {
    id: 'orderDate',
    key: 'orderDate',
    label: t('주문 일자', 'Order Date'),
    width: 120,
    align: 'center',
  },
  {
    id: 'status',
    key: 'status',
    label: t('상태', 'Status'),
    width: 120,
    align: 'center',
    itemRender: ({ value }) => {
      const colorClass =
        value === 'Delivered'
          ? 'text-emerald-600'
          : value === 'Shipped'
          ? 'text-blue-600'
          : value === 'Processing'
          ? 'text-amber-600'
          : 'text-red-600';
      return <span className={`font-semibold ${colorClass}`}>{value}</span>;
    },
  },
  {
    id: 'itemCount',
    key: 'itemCount',
    label: t('품목 수', 'Item Count'),
    width: 100,
    align: 'right',
    itemRender: ({ value }) => `${value} ${t('개', 'items')}`,
  },
  {
    id: 'totalAmount',
    key: 'totalAmount',
    label: t('주문 총액', 'Total Amount'),
    width: 150,
    align: 'right',
    itemRender: ({ value }) => `₩${(value as number).toLocaleString()}`,
  },
];

const itemColumns: BGridColumn<OrderItem>[] = [
  { id: 'itemCode', key: 'itemCode', label: t('품목 코드', 'Item Code'), width: 110 },
  { id: 'productName', key: 'productName', label: t('상품명', 'Product Name'), width: 220 },
  {
    id: 'unitPrice',
    key: 'unitPrice',
    label: t('단가', 'Unit Price'),
    width: 110,
    align: 'right',
    itemRender: ({ value }) => `₩${(value as number).toLocaleString()}`,
  },
  { id: 'quantity', key: 'quantity', label: t('수량', 'Quantity'), width: 80, align: 'right' },
  {
    id: 'subtotal',
    key: 'subtotal',
    label: t('소계', 'Subtotal'),
    width: 120,
    align: 'right',
    itemRender: ({ value }) => `₩${(value as number).toLocaleString()}`,
  },
];

function OrderItemsGrid({ items }: { items: OrderItem[] }) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width } = useContainerSize(containerRef);
  const nestedData: BGridDataItem<OrderItem>[] = React.useMemo(() => items.map(it => ({ values: it })), [items]);

  return (
    <div ref={containerRef} className='master-detail-order-items h-[130px] overflow-hidden border'>
      <BGrid
        className='master-detail-child-grid'
        headerHeight={25}
        itemHeight={15}
        width={width > 0 ? width : 640}
        height={130}
        columns={itemColumns}
        data={nestedData}
        rowKey='itemCode'
        msg={exampleMsg}
        // variant='vertical-bordered'
        showLineNumber
        scrollbar={{
          variant: 'native',
        }}
        status={{ visible: false }}
      />
    </div>
  );
}

export default function MasterDetailExample() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const [expandMode, setExpandMode] = React.useState<BGridMasterDetailExpandMode>('multiple');
  const [expandedRowKeys, setExpandedRowKeys] = React.useState<React.Key[]>(['ORD-0001']);
  const [orderMemos, setOrderMemos] = React.useState<Record<string, string>>({
    'ORD-0001': 'Deliver before 2 PM if possible.',
  });

  const handleExpandAll = React.useCallback(() => {
    if (expandMode === 'single') {
      const firstExpandable = ordersData.find(d => d.values.itemCount > 0);
      setExpandedRowKeys(firstExpandable ? [firstExpandable.values.orderId] : []);
    } else {
      setExpandedRowKeys(ordersData.filter(d => d.values.itemCount > 0).map(d => d.values.orderId));
    }
  }, [expandMode]);

  const handleCollapseAll = React.useCallback(() => {
    setExpandedRowKeys([]);
  }, []);

  const detailRender = React.useCallback(
    ({ item }: { item: BGridDataItem<OrderRow> }) => {
      const order = item.values;
      const memo = orderMemos[order.orderId] ?? order.notes ?? '';

      return (
        <div className='box-border flex h-full flex-col gap-2 px-4 py-3'>
          <div className='flex items-center justify-between'>
            <div className='master-detail-title text-[13px] font-semibold'>
              {t('주문 상세 품목', 'Order Items')} — {order.orderId} ({order.customer})
            </div>
            <span className='master-detail-count text-xs'>
              {t(`총 ${order.items.length}개 품목`, `${order.items.length} line items`)}
            </span>
          </div>

          <OrderItemsGrid items={order.items} />
        </div>
      );
    },
    [orderMemos],
  );

  return (
    <div className='master-detail-example flex h-full flex-col gap-3'>
      <div className='flex flex-wrap items-center gap-3'>
        <label className='inline-flex items-center gap-2 font-medium'>
          <span>{t('펼침 모드', 'Expand Mode')}</span>
          <Select<BGridMasterDetailExpandMode>
            className='min-w-[210px]'
            value={expandMode}
            options={[
              { value: 'multiple', label: t('다중 (Multiple)', 'Multiple') },
              { value: 'single', label: t('단일 (Accordion)', 'Single (Accordion)') },
            ]}
            onChange={v => {
              setExpandMode(v);
              if (v === 'single' && expandedRowKeys.length > 1) {
                setExpandedRowKeys(expandedRowKeys.slice(0, 1));
              }
            }}
          />
        </label>

        <Button size='small' onClick={handleExpandAll}>
          {t('모두 펼치기', 'Expand All')}
        </Button>

        <Button size='small' onClick={handleCollapseAll}>
          {t('모두 접기', 'Collapse All')}
        </Button>

        <span className='text-xs text-slate-500'>
          {t(
            `펼쳐진 행: ${expandedRowKeys.length}개 (일부 행은 품목이 없어 펼침 불가)`,
            `Expanded: ${expandedRowKeys.length} (Rows with 0 items cannot be expanded)`,
          )}
        </span>
      </div>

      <div className='min-h-0 flex-1'>
        <DataGridContainer ref={containerRef}>
          <BGrid
            width={width}
            height={height}
            columns={masterColumns}
            data={ordersData}
            rowKey='orderId'
            msg={exampleMsg}
            variant='vertical-bordered'
            showLineNumber
            masterDetail={{
              expandMode,
              expandedRowKeys,
              onExpandedRowKeysChange: setExpandedRowKeys,
              hasDetail: item => item.values.itemCount > 0,
              detailRowHeight: 200,
              detailRender,
              icons: {
                expanded: <ChevronDown size={14} />,
                collapsed: <ChevronRight size={14} />,
              },
            }}
          />
        </DataGridContainer>
      </div>
    </div>
  );
}
