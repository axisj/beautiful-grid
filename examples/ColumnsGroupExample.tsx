import { t } from './i18n';
import * as React from 'react';
import { BGrid } from 'beautiful-grid';
import type { BGridColumn, BGridColumnGroupNode } from 'beautiful-grid';
import { Select } from 'antd';
import { useContainerSize } from '../hooks/useContainerSize';
import DataGridContainer from '../components/DataGridContainer';
import './ColumnsGroupExample.css';

interface Order {
  orderNo: string;
  customerName: string;
  region: string;
  productName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const data = Array.from({ length: 100 }, (_, index) => {
  const quantity = (index % 8) + 1;
  const unitPrice = 12000 + (index % 5) * 3500;
  return {
    values: {
      orderNo: `ORD-${String(2401 + index).padStart(4, '0')}`,
      customerName: [t('서울상사', 'Seoul Sangsa'), t('한빛물산', 'Hanbit Mulsan'), 'Northwind'][index % 3],
      region: [t('서울', 'Seoul'), t('부산', 'Busan'), t('대전', 'Daejeon')][index % 3],
      productName: ['Workspace Pro', 'Analytics Seat', 'Automation Pack'][index % 3],
      category: ['Software', 'License', 'Service'][index % 3],
      quantity,
      unitPrice,
      total: quantity * unitPrice,
    },
  };
});

const columnGroups: BGridColumnGroupNode[] = [
  {
    id: 'order-overview',
    label: t('주문 현황', 'Order Status Overview'),
    className: 'column-groups-header-overview',
    children: [
      {
        id: 'order-customer',
        label: t('주문·고객 정보', 'Order/Customer Info'),
        children: [
          'orderNo',
          {
            id: 'customer-detail',
            label: t('고객 상세', 'Customer Details'),
            className: 'column-groups-header-customer',
            children: ['customerName', 'region'],
          },
        ],
      },
      {
        id: 'product-sales',
        label: t('상품·매출 정보', 'Product/Sales Info'),
        children: [
          {
            id: 'product-detail',
            label: t('상품 상세', 'Product Details'),
            children: ['productName', 'category'],
          },
          {
            id: 'sales-detail',
            label: t('매출 상세', 'Sales Details'),
            headerStyle: {
              backgroundColor: '#ffedd5',
              color: '#9a3412',
            },
            children: ['quantity', 'unitPrice', 'total'],
          },
        ],
      },
    ],
  },
];

const initialColumns: BGridColumn<Order>[] = [
  { id: 'orderNo', key: 'orderNo', label: t('주문 번호', 'Order Number'), width: 140 },
  { id: 'customerName', key: 'customerName', label: t('고객명', 'Customer Name'), width: 150 },
  { id: 'region', key: 'region', label: t('지역', 'Region'), width: 100, align: 'center' },
  { id: 'productName', key: 'productName', label: t('상품', 'Product'), width: 170 },
  { id: 'category', key: 'category', label: t('분류', 'Category'), width: 120, align: 'center' },
  { id: 'quantity', key: 'quantity', label: t('수량', 'Quantity'), width: 90, align: 'right' },
  {
    id: 'unitPrice',
    key: 'unitPrice',
    label: t('단가', 'Unit Price'),
    width: 120,
    align: 'right',
    itemRender: ({ value }) => <>{Number(value).toLocaleString()}{t('원', 'KRW')}</>,
  },
  {
    id: 'total',
    key: 'total',
    label: t('합계', 'Total'),
    width: 140,
    align: 'right',
    headerClassName: 'column-groups-header-total',
    itemRender: ({ value }) => <strong>{Number(value).toLocaleString()}{t('원', 'KRW')}</strong>,
  },
];

export default function ColumnsGroupExample() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const [columns, setColumns] = React.useState(initialColumns);
  const [groups, setGroups] = React.useState(columnGroups);
  const [frozenColumnIndex, setFrozenColumnIndex] = React.useState(4);
  const frozenBoundaryColumn = columns[frozenColumnIndex - 1];

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>
        <label className='inline-flex items-center gap-2 font-medium'>
          <span>{t('틀고정 경계', 'Freeze Boundary')}</span>
          <Select<number>
            aria-label={t('틀고정 위치', 'Freeze Position')}
            style={{ minWidth: 210 }}
            value={frozenColumnIndex}
            options={[
              { value: 0, label: t('고정 없음', 'No Freeze') },
              ...columns.map((column, index) => ({
                value: index + 1,
                label: t(`${index + 1}개 · ${column.label} 뒤`, `${index + 1} cols · After ${column.label}`),
              })),
            ]}
            onChange={setFrozenColumnIndex}
          />
        </label>
        <p className='m-0 text-slate-600' aria-live='polite'>
          {frozenColumnIndex > 0 && frozenBoundaryColumn ? (
            <>
              {t('앞쪽', 'First')} {frozenColumnIndex}{t('개 컬럼을 고정했습니다.', ' columns are frozen. Boundary is after ')} <strong>{frozenBoundaryColumn.label}</strong>.
            </>
          ) : (
            t('현재는 고정 컬럼 없이 모든 컬럼이 함께 스크롤됩니다.', 'Currently all columns scroll together with no freeze.')
          )}
        </p>
      </div>

      <DataGridContainer ref={containerRef} style={{ height: 560 }}>
        <BGrid<Order>
          className='column-groups-example-grid'
          width={width}
          height={height}
          data={data}
          frozenColumnIndex={frozenColumnIndex}
          headerHeight={96}
          itemHeight={24}
          itemPadding={6}
          columns={columns}
          columnGroups={groups}
          columnSortable
          onChangeColumns={(_, info) => {
            setColumns(info.columns);
            if (info.columnGroups) setGroups(info.columnGroups);
          }}
          rowChecked={{ checkedIndexes: [], onChange: () => undefined }}
          showLineNumber
        />
      </DataGridContainer>
    </div>
  );
}
