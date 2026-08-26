import * as React from 'react';
import { BGrid, type BGridColumn } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import {
  applyEditingDataChange,
  cloneEditingOrders,
  type EditingOrder,
  withEditingCellClasses,
} from './editing/shared';
import './EditingEventsExample.css';

export default function EditingEventsExample() {
  const [data, setData] = React.useState(cloneEditingOrders);
  const [events, setEvents] = React.useState<string[]>(['편집을 시작하면 이벤트가 여기에 기록됩니다.']);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const eventLogRef = React.useRef<HTMLOListElement>(null);
  const { width, height } = useContainerSize(containerRef);

  const appendEvent = React.useCallback((message: string) => {
    setEvents(current => [...current, message].slice(-20));
  }, []);

  React.useEffect(() => {
    const eventLog = eventLogRef.current;
    if (!eventLog) return;
    eventLog.scrollTo({ top: eventLog.scrollHeight });
  }, [events]);

  const columns = React.useMemo<BGridColumn<EditingOrder>[]>(
    () => withEditingCellClasses<EditingOrder>([
      { key: 'orderCode', label: '주문 코드', width: 145, editable: false },
      {
        key: 'quantity',
        label: '수량',
        width: 110,
        align: 'right',
        editable: true,
        editor: {
          type: 'text',
          inputProps: { inputMode: 'numeric' },
          parseValue: text => {
            const value = Number(text);
            if (!Number.isFinite(value) || value < 0) throw new Error('수량은 0 이상의 숫자여야 합니다.');
            return value;
          },
        },
        onChangeValue: async ({ changes, nextValues, commit }) => {
          appendEvent(`onChangeValue: 수량 ${nextValues.quantity}, 합계 재계산`);
          await commit([...changes, { key: 'amount', value: nextValues.quantity * nextValues.unitPrice }]);
        },
      },
      {
        key: 'unitPrice',
        label: '단가',
        width: 130,
        align: 'right',
        editable: true,
        itemRender: ({ value }) => <>{Number(value).toLocaleString()}원</>,
        editor: {
          type: 'text',
          inputProps: { inputMode: 'numeric' },
          formatValue: value => String(value ?? ''),
          parseValue: text => {
            const value = Number(text);
            if (!Number.isFinite(value) || value < 0) throw new Error('단가는 0 이상의 숫자여야 합니다.');
            return value;
          },
        },
        onChangeValue: async ({ changes, nextValues, commit }) => {
          appendEvent(`onChangeValue: 단가 ${nextValues.unitPrice}, 합계 재계산`);
          await commit([...changes, { key: 'amount', value: nextValues.quantity * nextValues.unitPrice }]);
        },
      },
      {
        key: 'amount',
        label: '합계 · 자동 변경',
        width: 170,
        align: 'right',
        editable: false,
        itemRender: ({ value }) => <strong>{Number(value).toLocaleString()}원</strong>,
      },
    ]),
    [appendEvent],
  );

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <div className='rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700'>
        <p className='m-0'>
          수량이나 단가를 바꾸면 <code>onChangeValue</code>가 제안 값을 검증하고 합계를 추가한 뒤 한 번의{' '}
          <code>commit(changes[])</code>으로 저장합니다.
        </p>
        <div className='editing-events-terminal'>
          <div className='editing-events-terminal-header' aria-hidden='true'>
            <span>EVENT LOG</span>
            <span>{events.length} entries</span>
          </div>
          <ol
            ref={eventLogRef}
            className='editing-events-log'
            role='log'
            aria-live='polite'
            aria-relevant='additions'
          >
            {events.map((event, index) => <li key={`${event}-${index}`}>{event}</li>)}
          </ol>
        </div>
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
          editTrigger='click'
          onChangeData={(sourceIndex, columnIndex, values, _column, meta) => {
            setData(current => applyEditingDataChange(current, sourceIndex, values, meta));
            appendEvent(`onChangeData: source ${sourceIndex}, column ${columnIndex ?? 'multi'}, ${meta?.changes.length ?? 0}개 변경`);
          }}
        />
      </DataGridContainer>
    </div>
  );
}
