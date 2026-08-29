import { t } from './i18n';
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
  const [events, setEvents] = React.useState<string[]>([t('편집을 시작하면 이벤트가 여기에 기록됩니다.', 'Events will be recorded here once you start editing.')]);
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
      { key: 'orderCode', label: t('주문 코드', 'Order Code'), width: 145, editable: false },
      {
        key: 'quantity',
        label: t('수량', 'Quantity'),
        width: 110,
        align: 'right',
        editable: true,
        editor: {
          type: 'text',
          inputProps: { inputMode: 'numeric' },
          parseValue: text => {
            const value = Number(text);
            if (!Number.isFinite(value) || value < 0) throw new Error(t('수량은 0 이상의 숫자여야 합니다.', 'Quantity must be a number greater than or equal to 0.'));
            return value;
          },
        },
        onChangeValue: async ({ changes, nextValues, commit }) => {
          appendEvent(`onChangeValue: ${t('수량', 'Quantity')} ${nextValues.quantity}, ${t('합계 재계산', 'Recalculate Total')}`);
          await commit([...changes, { key: 'amount', value: nextValues.quantity * nextValues.unitPrice }]);
        },
      },
      {
        key: 'unitPrice',
        label: t('단가', 'Unit Price'),
        width: 130,
        align: 'right',
        editable: true,
        itemRender: ({ value }) => <>{Number(value).toLocaleString()}{t('원', 'KRW')}</>,
        editor: {
          type: 'text',
          inputProps: { inputMode: 'numeric' },
          formatValue: value => String(value ?? ''),
          parseValue: text => {
            const value = Number(text);
            if (!Number.isFinite(value) || value < 0) throw new Error(t('단가는 0 이상의 숫자여야 합니다.', 'Unit price must be a number greater than or equal to 0.'));
            return value;
          },
        },
        onChangeValue: async ({ changes, nextValues, commit }) => {
          appendEvent(`onChangeValue: ${t('단가', 'Unit Price')} ${nextValues.unitPrice}, ${t('합계 재계산', 'Recalculate Total')}`);
          await commit([...changes, { key: 'amount', value: nextValues.quantity * nextValues.unitPrice }]);
        },
      },
      {
        key: 'amount',
        label: t('합계 · 자동 변경', 'Total · Auto Calculated'),
        width: 170,
        align: 'right',
        editable: false,
        itemRender: ({ value }) => <strong>{Number(value).toLocaleString()}{t('원', 'KRW')}</strong>,
      },
    ]),
    [appendEvent],
  );

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <div className='rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700'>
        <p className='m-0'>
          {t('수량이나 단가를 바꾸면', 'When you change the quantity or unit price,')} <code>onChangeValue</code>{t('가 제안 값을 검증하고 합계를 추가한 뒤 한 번의', ' verifies the suggested value, adds the total, and saves it in a single ')}
          <code>commit(changes[])</code>{t('으로 저장합니다.', ' call.')}
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
            appendEvent(`onChangeData: source ${sourceIndex}, column ${columnIndex ?? 'multi'}, ${meta?.changes.length ?? 0}${t('개 변경', ' changes')}`);
          }}
        />
      </DataGridContainer>
    </div>
  );
}
