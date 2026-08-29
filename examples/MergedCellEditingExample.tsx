import { t } from './i18n';
import * as React from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';
import { Select } from 'antd';
import { Pencil } from 'lucide-react';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import {
  applyEditingDataChange,
  type EditingOrder,
  withEditingCellClasses,
} from './editing/shared';

const customerGroups: Array<
  Pick<EditingOrder, 'customerCode' | 'customerName' | 'customerGrade'>
> = [
  { customerCode: 'C001', customerName: t('서울상사', 'Seoul Sangsa'), customerGrade: 'VIP' },
  { customerCode: 'C002', customerName: t('한빛물산', 'Hanbit Mulsan'), customerGrade: t('우수', 'Excellent') },
  { customerCode: 'C003', customerName: 'Northwind', customerGrade: t('일반', 'General') },
  { customerCode: 'C004', customerName: 'AxisJ Studio', customerGrade: t('우수', 'Excellent') },
  { customerCode: 'C005', customerName: t('대한유통 장기 고객사명 샘플', 'Daehan Distribution Long-term Client Name Sample'), customerGrade: 'VIP' },
  { customerCode: 'C006', customerName: 'Blue Ocean Trading', customerGrade: t('일반', 'General') },
  { customerCode: 'C007', customerName: t('새봄물류', 'Saebom Logistics'), customerGrade: t('우수', 'Excellent') },
  { customerCode: 'C008', customerName: 'Global Partners Korea', customerGrade: 'VIP' },
];

const statuses: EditingOrder['status'][] = [t('접수', 'Receipt'), t('진행', 'In Progress'), t('완료', 'Completed')];
const notes = [
  t('오전 배송', 'Morning Delivery'),
  t('담당자 확인', 'Assignee Confirmation'),
  '행 높이를 늘리지 않는 긴 메모 내용이 말줄임으로 표시됩니다.',
];

const createMergedEditingOrders = (): BGridDataItem<EditingOrder>[] =>
  customerGroups.flatMap((customer, groupIndex) =>
    Array.from({ length: 3 }, (_, groupRowIndex) => {
      const rowIndex = groupIndex * 3 + groupRowIndex;
      const quantity = (rowIndex % 5) + 1;
      const unitPrice = 9000 + (rowIndex % 4) * 3000;

      return {
        values: {
          id: `MERGED-ORDER-${String(rowIndex + 1).padStart(3, '0')}`,
          orderCode: `ORD-${2601 + rowIndex}`,
          ...customer,
          status: statuses[rowIndex % statuses.length],
          deliveryDate: `2026-09-${String((rowIndex % 28) + 1).padStart(2, '0')}`,
          quantity,
          unitPrice,
          amount: quantity * unitPrice,
          note: notes[rowIndex % notes.length],
          mergeGroup: `CUSTOMER-${String(groupIndex + 1).padStart(2, '0')}`,
        },
      };
    }),
  );

export default function MergedCellEditingExample() {
  const [data, setData] = React.useState(createMergedEditingOrders);
  const [frozenColumnIndex, setFrozenColumnIndex] = React.useState(0);
  const [frozenRowCount, setFrozenRowCount] = React.useState(0);
  const [changedRows, setChangedRows] = React.useState<number[]>([]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const hasFrozenBoundary = frozenColumnIndex > 0 || frozenRowCount > 0;
  const layoutMode = hasFrozenBoundary ? 'frozen-boundary' : 'standard';

  const columns = React.useMemo<BGridColumn<EditingOrder>[]>(
    () => withEditingCellClasses<EditingOrder>([
      { key: 'orderCode', label: t('주문 코드', 'Order Code'), width: 145, editable: false },
      {
        key: 'customerName',
        label: '병합 고객명 · 편집',
        width: 240,
        editable: true,
        editTrigger: 'click',
        editor: { type: 'text' },
        editorIcon: { render: <Pencil aria-hidden='true' size={14} strokeWidth={1.8} />, ariaLabel: t('병합 고객명 편집', 'Edit Merged Customer Name') },
      },
      { key: 'status', label: t('상태', 'Status'), width: 120, editable: false },
      { key: 'note', label: t('메모', 'Memo'), width: 300, editable: false },
    ]),
    [],
  );

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <div className='rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700'>
        <div className='flex flex-wrap items-center justify-between gap-3'>
          <p className='m-0'>
            24개 행을 3개씩 병합해 세로 스크롤과 일반 병합·고정 경계 병합 편집을 함께 확인합니다.
          </p>
          <div className='flex flex-wrap items-center gap-3' aria-label={t(t('병합 셀 틀고정 옵션', 'Merged Cell Freeze Option'), 'Merged Cell Freeze Option')}>
            <label className='inline-flex items-center gap-2 font-medium'>
              <span>왼쪽 고정 컬럼 수</span>
              <Select<number>
                aria-label={t(t('고정할 컬럼 수', 'Number of Columns to Freeze'), 'Number of Columns to Freeze')}
                aria-describedby='merged-frozen-column-help'
                style={{ width: 84 }}
                value={frozenColumnIndex}
                options={[0, 1, 2].map(count => ({ value: count, label: `${count}개` }))}
                onChange={setFrozenColumnIndex}
              />
            </label>
            <label className='inline-flex items-center gap-2 font-medium'>
              <span>위쪽 고정 행 수</span>
              <Select<number>
                aria-label={t(t('고정할 행 수', 'Number of Rows to Freeze'), 'Number of Rows to Freeze')}
                aria-describedby='merged-frozen-row-help'
                style={{ width: 84 }}
                value={frozenRowCount}
                options={[0, 1, 2, 3].map(count => ({ value: count, label: `${count}개` }))}
                onChange={setFrozenRowCount}
              />
            </label>
          </div>
        </div>
        <div className='mt-2 grid gap-1 text-xs text-slate-600'>
          <p id='merged-frozen-column-help' className='m-0'>
            <strong>왼쪽 고정 컬럼 수</strong>는 가로 스크롤 중에도 왼쪽에 남겨 둘 컬럼 수입니다. 1개는 ‘주문
            코드’만, 2개는 ‘주문 코드’와 편집 대상인 ‘병합 고객명’을 고정합니다.
          </p>
          <p id='merged-frozen-row-help' className='m-0'>
            <strong>위쪽 고정 행 수</strong>는 세로 스크롤 중에도 위쪽에 남겨 둘 실제 데이터 행 수입니다. 1~2개는
            첫 3행 병합 셀을 고정·스크롤 영역으로 나누고, 3개는 첫 병합 그룹 전체를 고정합니다. 나뉜 어느 조각을
            편집해도 같은 3행이 함께 변경됩니다.
          </p>
        </div>
        <p className='mb-0 mt-2 text-xs text-slate-600'>
          {hasFrozenBoundary ? (
            <>
              <strong>고정 경계 병합</strong> · <code>frozenColumnIndex={frozenColumnIndex}</code>,{' '}
              <code>frozenRowCount={frozenRowCount}</code>. 병합 그룹이 행 고정 경계를 가로지르면 각 영역 안에서 다시
              병합되며, 어느 조각을 편집해도 세 행이 함께 변경됩니다.
            </>
          ) : (
            <>
              <strong>일반 병합</strong> · 틀고정 없이 하나의 병합 셀을 직접 편집하며, 병합 그룹의 세 실제 행이 함께
              변경됩니다.
            </>
          )}
        </p>
        <output aria-live='polite' className='mt-1 block text-xs text-blue-700'>
          마지막 트랜잭션의 변경 행: {changedRows.length ? changedRows.map(index => index + 1).join(', ') : t('없음', 'None')}
        </output>
      </div>
      <DataGridContainer ref={containerRef} style={{ height: 360 }} data-merge-layout={layoutMode}>
        <BGrid<EditingOrder>
          key={`${frozenColumnIndex}:${frozenRowCount}`}
          width={width}
          height={height}
          data={data}
          columns={columns}
          rowKey='id'
          editable
          variant='vertical-bordered'
          itemHeight={22}
          itemPadding={4}
          frozenColumnIndex={frozenColumnIndex}
          frozenRowCount={frozenRowCount}
          cellMergeOptions={{ columnsMap: { 1: { mergeBy: 'mergeGroup' } } }}
          onChangeData={(sourceIndex, _columnIndex, values, _column, meta) => {
            setData(current => applyEditingDataChange(current, sourceIndex, values, meta));
            if (meta) setChangedRows([...meta.transaction.sourceIndexes]);
          }}
        />
      </DataGridContainer>
    </div>
  );
}
