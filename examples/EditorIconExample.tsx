import * as React from 'react';
import { BGrid, type BGridColumn } from 'beautiful-grid';
import { createDateEditorPlugin, createSelectEditorPlugin } from 'beautiful-grid/editors';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import { CalendarIcon, CheckIcon, ChevronDownIcon } from './editing/editorIcons';
import {
  applyEditingDataChange,
  cloneEditingOrders,
  type EditingOrder,
  withEditingCellClasses,
} from './editing/shared';

const statusEditor = createSelectEditorPlugin<EditingOrder, EditingOrder['status']>({
  id: 'icon-status',
  options: [
    { value: '접수', label: '접수' },
    { value: '진행', label: '진행' },
    { value: '완료', label: '완료' },
  ],
});

const dateEditor = createDateEditorPlugin<EditingOrder>({ id: 'icon-date' });

export default function EditorIconExample() {
  const [data, setData] = React.useState(cloneEditingOrders);
  const [lastAction, setLastAction] = React.useState('아이콘을 눌러 동작을 확인하세요.');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  const columns = React.useMemo<BGridColumn<EditingOrder>[]>(
    () => withEditingCellClasses<EditingOrder>([
      { key: 'orderCode', label: '주문 코드', width: 145, editable: false },
      {
        key: 'status',
        label: '항상 표시',
        width: 145,
        editable: true,
        editor: statusEditor,
        editTrigger: 'click',
        editorIcon: { render: <ChevronDownIcon />, ariaLabel: '상태 선택', visibility: 'always' },
      },
      {
        key: 'deliveryDate',
        label: 'hover 표시',
        width: 165,
        editable: true,
        editor: dateEditor,
        editorIcon: { render: <CalendarIcon />, ariaLabel: '납기일 선택', visibility: 'hover' },
      },
      {
        key: 'note',
        label: 'callback 아이콘',
        width: 210,
        editable: true,
        editor: { type: 'text' },
        editorIcon: {
          render: <CheckIcon />,
          ariaLabel: '메모 확인 완료',
          visibility: 'active',
          onClick: async ({ index, commit }) => {
            setLastAction(`${index + 1}행 메모에 확인 표시를 추가했습니다.`);
            await commit([{ key: 'note', value: '확인 완료' }]);
          },
        },
      },
    ]),
    [],
  );

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <div className='rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700'>
        <code>onClick</code>이 없는 아이콘은 연결된 editor를 시작합니다. callback 아이콘은 editor 대신 자체 작업을 실행하며
        동일한 <code>commit(changes[])</code>으로 값을 저장합니다.
        <output aria-live='polite' className='mt-1 block text-xs text-blue-700'>{lastAction}</output>
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
          onChangeData={(sourceIndex, _columnIndex, values, _column, meta) => {
            setData(current => applyEditingDataChange(current, sourceIndex, values, meta));
          }}
        />
      </DataGridContainer>
    </div>
  );
}
