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
      customerName: ['서울상사', '한빛물산', 'Northwind'][index % 3],
      region: ['서울', '부산', '대전'][index % 3],
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
    label: '주문 현황',
    className: 'column-groups-header-overview',
    children: [
      {
        id: 'order-customer',
        label: '주문·고객 정보',
        children: [
          'orderNo',
          {
            id: 'customer-detail',
            label: '고객 상세',
            className: 'column-groups-header-customer',
            children: ['customerName', 'region'],
          },
        ],
      },
      {
        id: 'product-sales',
        label: '상품·매출 정보',
        children: [
          {
            id: 'product-detail',
            label: '상품 상세',
            children: ['productName', 'category'],
          },
          {
            id: 'sales-detail',
            label: '매출 상세',
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
  { id: 'orderNo', key: 'orderNo', label: '주문 번호', width: 140 },
  { id: 'customerName', key: 'customerName', label: '고객명', width: 150 },
  { id: 'region', key: 'region', label: '지역', width: 100, align: 'center' },
  { id: 'productName', key: 'productName', label: '상품', width: 170 },
  { id: 'category', key: 'category', label: '분류', width: 120, align: 'center' },
  { id: 'quantity', key: 'quantity', label: '수량', width: 90, align: 'right' },
  {
    id: 'unitPrice',
    key: 'unitPrice',
    label: '단가',
    width: 120,
    align: 'right',
    itemRender: ({ value }) => <>{Number(value).toLocaleString()}원</>,
  },
  {
    id: 'total',
    key: 'total',
    label: '합계',
    width: 140,
    align: 'right',
    headerClassName: 'column-groups-header-total',
    itemRender: ({ value }) => <strong>{Number(value).toLocaleString()}원</strong>,
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
          <span>틀고정 경계</span>
          <Select<number>
            aria-label='틀고정 위치'
            style={{ minWidth: 210 }}
            value={frozenColumnIndex}
            options={[
              { value: 0, label: '고정 없음' },
              ...columns.map((column, index) => ({
                value: index + 1,
                label: `${index + 1}개 · ${column.label} 뒤`,
              })),
            ]}
            onChange={setFrozenColumnIndex}
          />
        </label>
        <p className='m-0 text-slate-600' aria-live='polite'>
          {frozenColumnIndex > 0 && frozenBoundaryColumn ? (
            <>
              앞쪽 {frozenColumnIndex}개 컬럼을 고정했습니다. <strong>{frozenBoundaryColumn.label}</strong> 뒤가
              경계입니다.
            </>
          ) : (
            '현재는 고정 컬럼 없이 모든 컬럼이 함께 스크롤됩니다.'
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
