import { t } from './i18n';
import * as React from 'react';
import { BGrid, type BGridCellAddress, type BGridColumn } from 'beautiful-grid';
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
  const [activeCell, setActiveCell] = React.useState<BGridCellAddress>({ rowIndex: 0, columnIndex: 1 });
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  const columns = React.useMemo<BGridColumn<EditingOrder>[]>(
    () => withEditingCellClasses<EditingOrder>([
      { key: 'orderCode', label: t('주문 코드', 'Order Code'), width: 150, editable: false },
      {
        key: 'customerName',
        label: '고객명 · 더블클릭',
        width: 190,
        editable: true,
        editor: { type: 'text', inputProps: { maxLength: 50, autoComplete: 'off' } },
      },
      {
        key: 'note',
        label: '메모 · 한 번 클릭',
        width: 210,
        editable: true,
        editTrigger: 'click',
        editor: { type: 'text', inputProps: { maxLength: 80, autoComplete: 'off' } },
      },
      { key: 'status', label: '상태 · 읽기 전용', width: 130, editable: false },
    ]),
    [],
  );

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <div className='rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700'>
        <strong>마우스:</strong> 고객명은 Grid 기본값인 더블클릭, 메모는 컬럼의 <code>editTrigger='click'</code>으로
        편집합니다.
        <br />
        <strong>키보드:</strong> 방향키로 셀을 이동하고 바로 입력하면 기존 값을 대체합니다. <kbd>Enter</kbd> 또는{' '}
        <kbd>F2</kbd>는 기존 값을 유지하며 시작하고, <kbd>Tab</kbd>은 저장 후 이동, <kbd>Escape</kbd>는 취소합니다.
        <output aria-live='polite' className='mt-1 block font-mono text-xs text-blue-700'>
          활성 셀: 행 {activeCell.rowIndex + 1}, 열 {activeCell.columnIndex + 1}
        </output>
      </div>
      <DataGridContainer ref={containerRef} style={{ height: 340 }}>
        <BGrid<EditingOrder>
          width={width}
          height={height}
          data={data}
          columns={columns}
          rowKey='id'
          editable
          variant='vertical-bordered'
          editTrigger='dblclick'
          showLineNumber
          cellSelectionOptions={{ enabled: true }}
          cellNavigationOptions={{
            enabled: true,
            editOnEnter: true,
            activeCell,
            onActiveCellChange: cell => cell && setActiveCell(cell),
          }}
          onChangeData={(sourceIndex, _columnIndex, values, _column, meta) => {
            setData(current => applyEditingDataChange(current, sourceIndex, values, meta));
          }}
        />
      </DataGridContainer>
    </div>
  );
}
