import { t } from './i18n';
import * as React from 'react';
import { BGrid, type BGridCellAddress, type BGridColumn, type BGridDataItem } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import { applyEditingDataChange } from './editing/shared';

interface OrderRow {
  orderNo: string;
  customer: string;
  category: string;
  product: string;
  status: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

const categories = [t('오피스', 'Office'), t('디자인', 'Design'), t('분석', 'Analysis'), t('자동화', 'Automation')];
const products = ['Workspace Pro', 'Design System', 'Analytics Seat', 'Automation Pack'];
const customers = ['AxisJ Studio', 'Northwind', 'Paperworks', 'Seoul Labs', 'Mono Office', 'Orbit Works'];

const initialData: BGridDataItem<OrderRow>[] = Array.from({ length: 48 }, (_, index) => {
  const quantity = (index % 9) + 1;
  const unitPrice = 12000 + (index % 6) * 4500;
  const groupIndex = Math.floor(index / 4) % categories.length;

  return {
    values: {
      orderNo: `A-${String(2401 + index).padStart(4, '0')}`,
      customer: customers[index % customers.length],
      category: categories[groupIndex],
      product: products[groupIndex],
      status: [t('완료', 'Completed'), t('배송 중', 'In Transit'), t('준비', 'Ready')][index % 3],
      quantity,
      unitPrice,
      total: quantity * unitPrice,
    },
  };
});

export default function CellNavigationExample() {
  const [data, setData] = React.useState(initialData);
  const [activeCell, setActiveCell] = React.useState<BGridCellAddress>({ rowIndex: 0, columnIndex: 1 });
  const [navigationEnabled, setNavigationEnabled] = React.useState(true);
  const [selectionEnabled, setSelectionEnabled] = React.useState(true);
  const [wrap, setWrap] = React.useState(false);
  const [editOnEnter, setEditOnEnter] = React.useState(true);
  const [lastActivation, setLastActivation] = React.useState(t('없음', 'None'));
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  const columns = React.useMemo<BGridColumn<OrderRow>[]>(
    () => [
      { key: 'orderNo', label: t('주문 번호', 'Order Number'), width: 110, editable: false },
      {
        key: 'customer',
        label: t('고객 · 편집 가능', 'Customer · Editable'),
        width: 170,
        editable: true,
        editor: {
          type: 'text',
          ariaLabel: t('고객 편집', 'Edit Customer'),
          inputProps: { maxLength: 50, autoComplete: 'off' },
        },
      },
      { key: 'category', label: t('분류 · 병합', 'Category · Merged'), width: 110, editable: false },
      {
        key: 'product',
        label: t('상품 · 편집 가능', 'Product · Editable'),
        width: 180,
        editable: true,
        editor: {
          type: 'text',
          ariaLabel: t('상품 편집', 'Edit Product'),
          inputProps: { maxLength: 80, autoComplete: 'off' },
        },
      },
      { key: 'status', label: t('상태', 'Status'), width: 100, align: 'center', editable: false },
      { key: 'quantity', label: t('수량', 'Quantity'), width: 80, align: 'right', editable: false },
      {
        key: 'unitPrice',
        label: t('단가', 'Unit Price'),
        width: 110,
        align: 'right',
        editable: false,
        itemRender: ({ value }) => <>{Number(value).toLocaleString()}{t('원', 'KRW')}</>,
      },
      {
        key: 'total',
        label: t('합계', 'Total'),
        width: 120,
        align: 'right',
        editable: false,
        itemRender: ({ value }) => <strong>{Number(value).toLocaleString()}{t('원', 'KRW')}</strong>,
      },
    ],
    [],
  );

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <div className='rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>
        <div className='mb-2 flex flex-wrap items-center gap-x-4 gap-y-2'>
          <Toggle label={t('키보드 이동', 'Keyboard Navigation')} checked={navigationEnabled} onChange={setNavigationEnabled} />
          <Toggle label={t('범위 선택', 'Select Range')} checked={selectionEnabled} onChange={setSelectionEnabled} />
          <Toggle label={t('경계 순환', 'Boundary Circulation')} checked={wrap} onChange={setWrap} />
          <Toggle label={t('Enter로 편집', 'Press Enter to edit')} checked={editOnEnter} onChange={setEditOnEnter} />
        </div>
        <p className='m-0 leading-6'>
          {t('셀 클릭 후', 'After clicking a cell, use')} <kbd>{t('방향키', 'Arrow keys')}</kbd>, <kbd>Home</kbd>/<kbd>End</kbd>, <kbd>PageUp</kbd>/<kbd>PageDown</kbd>,{' '}
          <kbd>Tab</kbd>{t('을 사용하세요. ', ' to navigate. ')} <kbd>Shift</kbd>{t('+방향키는 범위를 확장합니다. 편집 가능한 셀에서는', '+Arrow keys expand selection. In editable cells,')} {' '}
          <kbd>Enter</kbd> {t('또는', 'or')} <kbd>F2</kbd>{t('로 편집을 시작하고, 그 외 셀에서는', ' start editing, and in other cells,')} <kbd>Enter</kbd> {t('또는', 'or')} <kbd>Space</kbd>{t('로 클릭 콜백을 실행합니다.', ' execute the click callback.')}
        </p>
        <output aria-live='polite' className='mt-2 block font-mono text-xs text-blue-700'>
          {t('활성 셀: 행', 'Active Cell: Row')} {activeCell.rowIndex + 1}, {t('열', 'Col')} {activeCell.columnIndex + 1}
        </output>
        <output aria-live='polite' className='mt-1 block font-mono text-xs text-slate-600'>
          {t('마지막 클릭 활성화:', 'Last Click Activation:')} {lastActivation}
        </output>
      </div>

      <DataGridContainer ref={containerRef} style={{ height: 420 }}>
        <BGrid<OrderRow>
          width={width}
          height={height}
          columns={columns}
          data={data}
          frozenColumnIndex={1}
          editable
          editTrigger='dblclick'
          variant='vertical-bordered'
          cellMergeOptions={{ columnsMap: { 2: { mergeBy: 'category' } } }}
          cellSelectionOptions={{ enabled: selectionEnabled }}
          cellNavigationOptions={{
            enabled: navigationEnabled,
            activeCell,
            onActiveCellChange: cell => {
              if (cell) setActiveCell(cell);
            },
            wrap,
            editOnEnter,
          }}
          onChangeData={(rowIndex, _columnIndex, values, _column, meta) => {
            setData(current => applyEditingDataChange(current, rowIndex, values, meta));
          }}
          onClick={({ index, columnIndex, item, column }) => {
            setLastActivation(`${item.orderNo} · ${t('행', 'Row')} ${index + 1}, ${t('열', 'Col')} ${columnIndex + 1} (${String(column.label)})`);
          }}
        />
      </DataGridContainer>
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className='inline-flex cursor-pointer items-center gap-1.5 font-medium'>
      <input type='checkbox' checked={checked} onChange={event => onChange(event.target.checked)} />
      <span>{label}</span>
    </label>
  );
}
