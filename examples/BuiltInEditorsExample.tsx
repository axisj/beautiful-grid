import { t } from './i18n';
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
  ariaLabel: t('주문 상태 선택', 'Select Order Status'),
  options: [
    { value: t('접수', 'Receipt'), label: t('접수', 'Receipt') },
    { value: t('진행', 'In Progress'), label: t('진행', 'In Progress') },
    { value: t('완료', 'Completed'), label: t('완료', 'Completed') },
  ],
});

const deliveryDateEditor = createDateEditorPlugin<EditingOrder>({
  id: 'built-in-delivery-date',
  ariaLabel: t('납기일 선택', 'Select Delivery Date'),
  min: '2026-08-01',
  max: '2026-12-31',
});

export default function BuiltInEditorsExample() {
  const [data, setData] = React.useState(cloneEditingOrders);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  const columns = React.useMemo<BGridColumn<EditingOrder>[]>(
    () => withEditingCellClasses<EditingOrder>([
      { key: 'orderCode', label: t('주문 코드', 'Order Code'), width: 145, editable: false },
      {
        key: 'customerName',
        label: t('내장 text', 'Built-in text'),
        width: 180,
        editable: true,
        editor: {
          type: 'text',
          inputProps: { maxLength: 50, autoComplete: 'off' },
        },
      },
      {
        key: 'status',
        label: t('기본 Select', 'Default Select'),
        width: 150,
        editable: true,
        editTrigger: 'click',
        editor: statusEditor,
        editorIcon: { render: <ChevronDownIcon />, ariaLabel: t('주문 상태 선택', 'Select Order Status'), visibility: 'always' },
      },
      {
        key: 'deliveryDate',
        label: t('기본 Date', 'Default Date'),
        width: 170,
        editable: true,
        editTrigger: 'click',
        editor: deliveryDateEditor,
        itemRender: ({ value }) => formatDate(value),
        editorIcon: { render: <CalendarIcon />, ariaLabel: t('납기일 선택', 'Select Delivery Date'), visibility: 'always' },
      },
      {
        key: 'approved',
        label: t('승인 권한', 'Approval Permission'),
        width: 150,
        align: 'center',
        headerAlign: 'center',
        editable: true,
        editor: {
          type: 'checkbox',
          header: { ariaLabel: t('승인 권한 전체 선택', 'Select All Approval Permissions') },
          ariaLabel: ({ values }) => `${values.orderCode} ${t('승인 권한', 'Approval Permission')}`,
          label: ({ value }) => (value ? t('허용', 'Allowed') : t('차단', 'Blocked')),
        },
      },
    ]),
    [],
  );

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <p className='m-0 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700'>
        {t('text와 checkbox는 라이브러리 내장 편집기이며 Select와 Date는', 'Text and checkbox are built-in editors, while Select and Date are provided by')} <code>beautiful-grid/editors</code>{t('가 제공하는 의존성 없는 plugin입니다. 승인 권한 헤더의 checkbox로 현재 행을 한 번에 선택하거나 해제할 수 있습니다.', ' as dependency-free plugins. You can select or deselect all rows at once using the checkbox in the Approval Permission header.')}
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
