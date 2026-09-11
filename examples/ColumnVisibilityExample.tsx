import * as React from 'react';
import { useMemo, useState } from 'react';
import { Button, Tag } from 'antd';
import { Eye, RotateCcw } from 'lucide-react';
import { BGrid } from 'beautiful-grid';
import type { BGridColumn, BGridColumnGroupNode, BGridDataQuery } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import { t, exampleMsg } from './i18n';

interface OrderRow {
  orderNo: string;
  customer: string;
  region: string;
  status: string;
  owner: string;
  dueDate: string;
  amount: number;
}

const customers = ['Northwind', 'Contoso', 'Fabrikam', 'Adventure Works', 'Tailspin'];
const regions = [t('서울', 'Seoul'), t('부산', 'Busan'), t('대전', 'Daejeon'), t('광주', 'Gwangju')];
const statuses = [t('접수', 'Received'), t('처리 중', 'Processing'), t('출고', 'Shipped')];
const owners = [t('김서준', 'Alex Kim'), t('이하은', 'Jamie Lee'), t('박지후', 'Chris Park')];

const rows = Array.from({ length: 24 }, (_, index) => ({
  values: {
    orderNo: `ORD-${String(index + 1).padStart(4, '0')}`,
    customer: customers[index % customers.length],
    region: regions[index % regions.length],
    status: statuses[index % statuses.length],
    owner: owners[index % owners.length],
    dueDate: `2026-09-${String((index % 20) + 8).padStart(2, '0')}`,
    amount: 128000 + index * 17500,
  },
}));

const groups: BGridColumnGroupNode[] = [
  {
    id: 'order',
    label: t('주문 정보', 'Order'),
    children: ['orderNo', 'customer'],
  },
  {
    id: 'delivery',
    label: t('처리 정보', 'Fulfillment'),
    children: ['region', 'status', 'owner', 'dueDate'],
  },
];

export default function ColumnVisibilityExample() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const [hiddenColumnIds, setHiddenColumnIds] = useState<string[]>(['owner']);
  const [query, setQuery] = useState<BGridDataQuery>({
    sortParams: [],
    filterParams: [],
  });
  const columns = useMemo<BGridColumn<OrderRow>[]>(
    () => [
      {
        id: 'orderNo',
        key: 'orderNo',
        label: t('주문 번호', 'Order No.'),
        width: 120,
        hideable: false,
        toolbox: true,
        filter: { type: 'text' },
      },
      {
        id: 'customer',
        key: 'customer',
        label: t('고객사', 'Customer'),
        width: 150,
        toolbox: true,
        filter: { type: 'text' },
      },
      {
        id: 'region',
        key: 'region',
        label: t('권역', 'Region'),
        width: 100,
        align: 'center',
        toolbox: true,
        filter: { type: 'values' },
      },
      {
        id: 'status',
        key: 'status',
        label: t('상태', 'Status'),
        width: 105,
        align: 'center',
        toolbox: true,
        filter: { type: 'values' },
      },
      {
        id: 'owner',
        key: 'owner',
        label: t('담당자', 'Owner'),
        width: 110,
        align: 'center',
        toolbox: true,
        filter: { type: 'values' },
      },
      {
        id: 'dueDate',
        key: 'dueDate',
        label: t('출고 예정일', 'Due date'),
        width: 120,
        align: 'center',
        toolbox: true,
        filter: { type: 'text' },
      },
      {
        id: 'amount',
        key: 'amount',
        label: t('주문 금액', 'Amount'),
        width: 130,
        align: 'right',
        toolbox: true,
        filter: { type: 'number' },
        itemRender: ({ value }) => `${Number(value).toLocaleString()}${t('원', ' KRW')}`,
      },
    ],
    [],
  );

  return (
    <>
      <div className='flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 border border-slate-200 rounded-lg text-sm'>
        <div className='flex flex-wrap items-center gap-2'>
          <Tag
            data-testid='hidden-column-status'
            className='inline-flex items-center gap-1'
            color={hiddenColumnIds.length ? 'blue' : 'default'}
          >
            <Eye size={13} aria-hidden='true' />
            <span>{t('숨긴 컬럼', 'Hidden')} {hiddenColumnIds.length}</span>
          </Tag>
          <Tag>{t('정렬', 'Sort')} {query.sortParams.length}</Tag>
          <Tag>{t('필터', 'Filter')} {query.filterParams.length}</Tag>
          <span className='text-slate-500'>
            {hiddenColumnIds.length
              ? hiddenColumnIds.map(id => columns.find(column => column.id === id)?.label ?? id).join(', ')
              : t('모든 컬럼 표시 중', 'All columns visible')}
          </span>
        </div>
        <Button
          size='small'
          icon={<RotateCcw size={14} />}
          disabled={hiddenColumnIds.length === 0}
          onClick={() => setHiddenColumnIds([])}
        >
          {t('모두 표시', 'Show all')}
        </Button>
      </div>

      <DataGridContainer ref={containerRef}>
        <BGrid
          width={width}
          height={height}
          data={rows}
          columns={columns}
          msg={exampleMsg}
          columnGroups={groups}
          headerHeight={54}
          frozenColumnIndex={2}
          columnVisibility={{
            hiddenColumnIds,
            onChange: setHiddenColumnIds,
          }}
          dataControl={{
            mode: 'client',
            query,
            onChange: setQuery,
            multiSort: true,
          }}
          rowKey='orderNo'
          variant='vertical-bordered'
        />
      </DataGridContainer>
    </>
  );
}
