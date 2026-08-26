import * as React from 'react';
import { BGrid, type BGridColumn, type BGridDataItem, type BGridProps } from 'beautiful-grid';
import { Segmented } from 'antd';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';

interface SalesRow {
  id: string;
  product: string;
  category: string;
  quantity: number;
  amount: number;
}

type GridVariant = NonNullable<BGridProps<SalesRow>['variant']>;

const categories = ['하드웨어', '소프트웨어', '서비스'];

const data: BGridDataItem<SalesRow>[] = Array.from({ length: 30 }, (_, index) => ({
  values: {
    id: `ORD-${String(index + 1).padStart(3, '0')}`,
    product: `상품 ${index + 1}`,
    category: categories[index % categories.length],
    quantity: (index % 5) + 1,
    amount: 28000 + index * 3500,
  },
}));

const columns: BGridColumn<SalesRow>[] = [
  { key: 'id', label: '주문번호', width: 100, align: 'center' },
  { key: 'product', label: '상품명', width: 180 },
  { key: 'category', label: '분류', width: 120, align: 'center' },
  { key: 'quantity', label: '수량', width: 90, align: 'right' },
  {
    key: 'amount',
    label: '금액',
    width: 140,
    align: 'right',
    itemRender: ({ values }) => `${values.amount.toLocaleString('ko-KR')}원`,
  },
];

const summaryColumns: NonNullable<BGridProps<SalesRow>['summary']>['columns'] = [
  { columnIndex: 0, align: 'center', itemRender: () => <strong>합계</strong> },
  {
    columnIndex: 3,
    align: 'right',
    itemRender: ({ data }) => data.reduce((sum, item) => sum + item.values.quantity, 0),
  },
  {
    columnIndex: 4,
    align: 'right',
    itemRender: ({ data }) => `${data.reduce((sum, item) => sum + item.values.amount, 0).toLocaleString('ko-KR')}원`,
  },
];

const variantOptions: Array<{ value: GridVariant; label: string; description: string }> = [
  { value: 'default', label: 'default', description: '본문과 요약 셀의 세로 구분선 생략' },
  { value: 'vertical-bordered', label: 'vertical-bordered', description: '본문과 요약 셀의 세로 구분선 표시' },
];

export default function VariantExample() {
  const [variant, setVariant] = React.useState<GridVariant>('default');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>
        <div>
          <strong className='block text-slate-900'>세로 구분선 Variant</strong>
          <span className='text-xs text-slate-500'>본문과 하단 합계 행에서 세로 구분선의 표시 여부를 비교해 보세요.</span>
        </div>

        <Segmented
          aria-label='세로 구분선 variant 선택'
          value={variant}
          options={variantOptions.map(({ value, label }) => ({ value, label }))}
          onChange={value => setVariant(value as GridVariant)}
        />
      </div>

      <p className='m-0 text-xs text-slate-500' aria-live='polite'>
        현재 설정: <code>variant=&quot;{variant}&quot;</code> —{' '}
        {variantOptions.find(option => option.value === variant)?.description}
      </p>

      <DataGridContainer ref={containerRef}>
        <BGrid<SalesRow>
          width={width}
          height={height}
          columns={columns}
          data={data}
          rowKey='id'
          showLineNumber
          frozenColumnIndex={1}
          variant={variant}
          summary={{ position: 'bottom', columns: summaryColumns }}
        />
      </DataGridContainer>
    </div>
  );
}
