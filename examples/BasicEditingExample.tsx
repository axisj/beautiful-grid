import { t } from './i18n';
import * as React from 'react';
import { BGrid, BGridDataItemStatus, type BGridCellAddress, type BGridColumn, type BGridRef } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import {
  applyEditingDataChange,
  cloneEditingOrders,
  type EditingOrder,
  withEditingCellClasses,
} from './editing/shared';

export default function BasicEditingExample() {
  const [data, setData] = React.useState(cloneEditingOrders);
  const [activeCell, setActiveCell] = React.useState<BGridCellAddress | null>({ rowIndex: 0, columnIndex: 1 });
  const [checkedRowKeys, setCheckedRowKeys] = React.useState<React.Key[]>([]);
  const gridRef = React.useRef<BGridRef>(null);
  const nextOrderNumber = React.useRef(5);
  const pendingScrollRowKey = React.useRef<string | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  React.useEffect(() => {
    const rowIndex = data.findIndex(item => item.values.id === pendingScrollRowKey.current);
    if (rowIndex < 0) return;
    gridRef.current?.scrollToRow(rowIndex, { align: 'end' });
    pendingScrollRowKey.current = null;
  }, [data]);

  const addRow = () => {
    const orderNumber = nextOrderNumber.current++;
    const id = `ORDER-${String(orderNumber).padStart(3, '0')}`;
    pendingScrollRowKey.current = id;
    setData(current => [...current, {
      status: BGridDataItemStatus.new,
      values: {
        id,
        orderCode: `ORD-${2600 + orderNumber}`,
        customerCode: '',
        customerName: '',
        customerGrade: '',
        status: t('접수', 'Receipt'),
        deliveryDate: '',
        approved: false,
        quantity: 0,
        unitPrice: 0,
        amount: 0,
        note: '',
        mergeGroup: id,
      },
    }]);
  };

  const deleteRows = () => {
    const checkedKeys = new Set(checkedRowKeys);
    const remaining = data.filter(item => !checkedKeys.has(item.values.id));
    const activeRowKey = activeCell && data[activeCell.rowIndex]?.values.id;
    const remainingActiveIndex = remaining.findIndex(item => item.values.id === activeRowKey);
    setData(remaining);
    setCheckedRowKeys([]);
    setActiveCell(activeCell && remaining.length ? {
      ...activeCell,
      rowIndex: remainingActiveIndex >= 0
        ? remainingActiveIndex
        : Math.min(activeCell.rowIndex, remaining.length - 1),
    } : null);
  };

  const columns = React.useMemo<BGridColumn<EditingOrder>[]>(
    () => withEditingCellClasses<EditingOrder>([
      { key: 'orderCode', label: t('주문 코드', 'Order Code'), width: 150, editable: false },
      {
        key: 'customerName',
        label: t('고객명 · 더블클릭', 'Customer Name · Double Click'),
        width: 190,
        editable: true,
        editor: { type: 'text', inputProps: { maxLength: 50, autoComplete: 'off' } },
      },
      {
        key: 'note',
        label: t('메모 · 한 번 클릭', 'Note · Click Once'),
        width: 210,
        editable: true,
        editTrigger: 'click',
        editor: { type: 'text', inputProps: { maxLength: 80, autoComplete: 'off' } },
      },
      { key: 'status', label: t('상태 · 읽기 전용', 'Status · Read Only'), width: 130, editable: false },
    ]),
    [],
  );

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <div className='rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700'>
        <strong>{t('마우스:', 'Mouse:')}</strong> {t('고객명은 Grid 기본값인 더블클릭, 메모는 컬럼의', 'Customer name is double-clicked as the Grid default, and memo is edited with the column\'s')} <code>editTrigger='click'</code>{t('으로', '')}
        <br />
        {t('편집합니다.', 'edit.')}
        <br />
        <strong>{t('키보드:', 'Keyboard:')}</strong> {t('방향키로 셀을 이동하고 바로 입력하면 기존 값을 대체합니다.', 'Moving cells with arrow keys and typing directly replaces existing values.')} <kbd>Enter</kbd> {t('또는', 'or')}{' '}
        <kbd>F2</kbd>{t('는 기존 값을 유지하며 시작하고,', ' starts editing keeping the existing value,')} <kbd>Tab</kbd>{t('은 저장 후 이동,', ' saves and moves,')} <kbd>Escape</kbd>{t('는 취소합니다.', ' cancels.')}
        <output aria-live='polite' className='mt-1 block font-mono text-xs text-blue-700'>
          {activeCell
            ? `${t('활성 셀: 행', 'Active cell: Row')} ${activeCell.rowIndex + 1}, ${t('열', 'Col')} ${activeCell.columnIndex + 1}`
            : t('활성 셀: 없음', 'Active cell: None')}
        </output>
      </div>
      <div className='flex flex-wrap items-center gap-2'>
        <button type='button' onClick={addRow} className='editing-example-row-button editing-example-row-button-add'>
          <svg aria-hidden='true' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='2' strokeLinecap='round'>
            <path d='M12 5v14M5 12h14' />
          </svg>
          {t('행추가', 'Add Row')}
        </button>
        <button type='button' onClick={deleteRows} disabled={checkedRowKeys.length === 0} className='editing-example-row-button editing-example-row-button-delete'>
          <svg aria-hidden='true' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='currentColor' strokeWidth='1.8' strokeLinecap='round' strokeLinejoin='round'>
            <path d='M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6' />
          </svg>
          {t('행삭제', 'Delete Rows')}
        </button>
        <output aria-live='polite' className='text-sm text-slate-600'>
          {t(`선택 ${checkedRowKeys.length}개 / 전체 ${data.length}개`, `${checkedRowKeys.length} selected / ${data.length} total`)}
        </output>
      </div>
      <DataGridContainer ref={containerRef} style={{ height: 340 }}>
        <BGrid<EditingOrder>
          ref={gridRef}
          width={width}
          height={height}
          data={data}
          columns={columns}
          rowKey='id'
          rowChecked={{
            checkedRowKeys,
            onChange: (_indexes, keys) => setCheckedRowKeys(keys),
          }}
          editable
          variant='vertical-bordered'
          editTrigger='dblclick'
          showLineNumber
          cellSelectionOptions={{ enabled: true }}
          cellNavigationOptions={{
            enabled: true,
            editOnEnter: true,
            activeCell,
            onActiveCellChange: setActiveCell,
          }}
          onChangeData={(sourceIndex, _columnIndex, values, _column, meta) => {
            setData(current => applyEditingDataChange(current, sourceIndex, values, meta));
          }}
        />
      </DataGridContainer>
    </div>
  );
}
