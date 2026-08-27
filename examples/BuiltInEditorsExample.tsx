import * as React from 'react';
import { BGrid, type BGridColumn } from 'beautiful-grid';
import { createDateEditorPlugin, createSelectEditorPlugin } from 'beautiful-grid/editors';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import { CalendarIcon, ChevronDownIcon } from './editing/editorIcons';
import {
  applyEditingDataChange,
  cloneEditingOrders,
  type EditingOrder,
  withEditingCellClasses,
} from './editing/shared';

function formatDate(value: unknown) {
  if (typeof value !== 'string') return '';
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? `${match[1]}.${match[2]}.${match[3]}` : value;
}

const statusEditor = createSelectEditorPlugin<EditingOrder, EditingOrder['status']>({
  id: 'built-in-status',
  ariaLabel: '주문 상태 선택',
  options: [
    { value: '접수', label: '접수' },
    { value: '진행', label: '진행' },
    { value: '완료', label: '완료' },
  ],
});

const deliveryDateEditor = createDateEditorPlugin<EditingOrder>({
  id: 'built-in-delivery-date',
  ariaLabel: '납기일 선택',
  min: '2026-08-01',
  max: '2026-12-31',
});

export default function BuiltInEditorsExample() {
  const [data, setData] = React.useState(cloneEditingOrders);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  const columns = React.useMemo<BGridColumn<EditingOrder>[]>(
    () => withEditingCellClasses<EditingOrder>([
      { key: 'orderCode', label: '주문 코드', width: 145, editable: false },
      {
        key: 'customerName',
        label: '내장 text',
        width: 180,
        editable: true,
        editor: {
          type: 'text',
          inputProps: { maxLength: 50, autoComplete: 'off' },
        },
      },
      {
        key: 'status',
        label: '기본 Select',
        width: 150,
        editable: true,
        editTrigger: 'click',
        editor: statusEditor,
        editorIcon: { render: <ChevronDownIcon />, ariaLabel: '주문 상태 선택', visibility: 'always' },
      },
      {
        key: 'deliveryDate',
        label: '기본 Date',
        width: 170,
        editable: true,
        editTrigger: 'click',
        editor: deliveryDateEditor,
        itemRender: ({ value }) => formatDate(value),
        editorIcon: { render: <CalendarIcon />, ariaLabel: '납기일 선택', visibility: 'always' },
      },
      {
        key: 'approved',
        label: '승인 권한',
        width: 150,
        align: 'center',
        headerAlign: 'center',
        editable: true,
        editor: {
          type: 'checkbox',
          header: { ariaLabel: '승인 권한 전체 선택' },
          ariaLabel: ({ values }) => `${values.orderCode} 승인 권한`,
          label: ({ value }) => (value ? '허용' : '차단'),
        },
      },
    ]),
    [],
  );

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <p className='m-0 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700'>
        text와 checkbox는 라이브러리 내장 편집기이며 Select와 Date는 <code>beautiful-grid/editors</code>가 제공하는
        의존성 없는 plugin입니다. 승인 권한 헤더의 checkbox로 현재 행을 한 번에 선택하거나 해제할 수 있습니다.
      </p>
      <DataGridContainer ref={containerRef} style={{ height: 340 }}>
        <BGrid<EditingOrder>
          width={width}
          height={height}
          data={data}
          columns={columns}
          rowKey='id'
          editable
          variant='vertical-bordered'
          onChangeData={(sourceIndex, _columnIndex, values, _column, meta) => {
            setData(current => applyEditingDataChange(current, sourceIndex, values, meta));
          }}
        />
      </DataGridContainer>
    </div>
  );
}
