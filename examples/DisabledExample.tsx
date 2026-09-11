import { t } from './i18n';
import * as React from 'react';
import {
  BGrid,
  type BGridColumn,
  type BGridDataControl,
  type BGridDataItem,
  type BGridDataQuery,
} from 'beautiful-grid';
import { Alert, Button, Space, Switch, Tag } from 'antd';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';

interface ApprovalRequest {
  requestId: string;
  requester: string;
  department: string;
  subject: string;
  amount: number;
  urgent: boolean;
  status: string;
  submittedAt: string;
}

const departments = [t('구매', 'Purchasing'), t('영업', 'Sales'), t('재무', 'Finance'), t('물류', 'Logistics')];
const requesters = [t('김하린', 'Harin Kim'), t('이도윤', 'Doyun Lee'), t('박서준', 'Seojun Park'), t('최유나', 'Yuna Choi')];
const subjects = [
  t('월말 재고 보충', 'Month-end Inventory Refill'),
  t('긴급 운송비 승인', 'Urgent Freight Approval'),
  t('신규 거래처 계약', 'New Vendor Contract'),
  t('반품 검수 비용', 'Return Inspection Cost'),
];

const approvals: BGridDataItem<ApprovalRequest>[] = Array.from({ length: 72 }, (_, index) => ({
  values: {
    requestId: `APR-${String(index + 1).padStart(5, '0')}`,
    requester: requesters[index % requesters.length],
    department: departments[index % departments.length],
    subject: subjects[index % subjects.length],
    amount: 180_000 + (index % 11) * 85_000,
    urgent: index % 5 === 0,
    status: index % 6 === 0 ? t('검토 보류', 'Review Hold') : index % 4 === 0 ? t('반려', 'Rejected') : t('대기', 'Pending'),
    submittedAt: `2026-09-${String((index % 20) + 1).padStart(2, '0')} ${String(9 + (index % 9)).padStart(2, '0')}:00`,
  },
}));

const PAGE_SIZE = 18;

function DisabledExample() {
  const [disabled, setDisabled] = React.useState(true);
  const [processing, setProcessing] = React.useState(false);
  const [currentPage, setCurrentPage] = React.useState(1);
  const [checkedRowKeys, setCheckedRowKeys] = React.useState<React.Key[]>([]);
  const [eventLog, setEventLog] = React.useState<string[]>([t('그리드가 잠긴 상태로 시작합니다.', 'The grid starts locked.')]);
  const [query, setQuery] = React.useState<BGridDataQuery>({ sortParams: [], filterParams: [] });

  const isGridDisabled = disabled || processing;

  const appendLog = React.useCallback((message: string) => {
    setEventLog(logs => [message, ...logs].slice(0, 4));
  }, []);

  const [rows, setRows] = React.useState(approvals);
  const [columns, setColumns] = React.useState<BGridColumn<ApprovalRequest>[]>([
    { key: 'requestId', label: t('요청번호', 'Request ID'), width: 120, align: 'center', toolbox: true },
    { key: 'requester', label: t('요청자', 'Requester'), width: 110, align: 'center', toolbox: true },
    { key: 'department', label: t('부서', 'Department'), width: 100, align: 'center', toolbox: true },
    { key: 'subject', label: t('제목', 'Subject'), width: 220, toolbox: true },
    {
      key: 'amount',
      label: t('금액', 'Amount'),
      width: 115,
      align: 'right',
      toolbox: true,
      itemRender: ({ value }) => <strong>{Number(value).toLocaleString()}{t('원', 'KRW')}</strong>,
    },
    {
      key: 'urgent',
      label: t('긴급', 'Urgent'),
      width: 90,
      align: 'center',
      editable: true,
      editor: {
        type: 'checkbox',
        header: { ariaLabel: t('모든 긴급 요청 토글', 'Toggle all urgent requests') },
        ariaLabel: ({ values }) => `${t('긴급 여부', 'Urgent flag')} ${values.requestId}`,
        label: ({ value }) => (value ? t('긴급', 'Urgent') : t('일반', 'Normal')),
      },
    },
    {
      key: 'status',
      label: t('상태', 'Status'),
      width: 105,
      align: 'center',
      itemRender: ({ value }) => {
        const color = value === t('반려', 'Rejected') ? 'red' : value === t('검토 보류', 'Review Hold') ? 'gold' : 'blue';
        return <Tag color={color}>{String(value)}</Tag>;
      },
    },
    { key: 'submittedAt', label: t('접수일시', 'Submitted At'), width: 145, align: 'center' },
  ]);

  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  const dataControl = React.useMemo<BGridDataControl>(
    () => ({
      mode: 'manual',
      query,
      onChange: nextQuery => {
        setQuery(nextQuery);
        appendLog(t('정렬 또는 필터가 변경되었습니다.', 'Sort or filter changed.'));
      },
    }),
    [appendLog, query],
  );

  const pageRows = React.useMemo(() => {
    const startIndex = (currentPage - 1) * PAGE_SIZE;
    return rows.slice(startIndex, startIndex + PAGE_SIZE);
  }, [currentPage, rows]);

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm'>
        <Space wrap>
          <Switch checked={disabled} onChange={setDisabled} />
          <span className='font-medium text-slate-700'>{t('disabled prop', 'disabled prop')}</span>
          <Button
            size='small'
            onClick={() => {
              setProcessing(true);
              window.setTimeout(() => setProcessing(false), 1600);
            }}
          >
            {t('처리 중 상태 시뮬레이션', 'Simulate Processing')}
          </Button>
          <Button size='small' onClick={() => setEventLog([])}>
            {t('이벤트 로그 초기화', 'Clear Event Log')}
          </Button>
        </Space>
        <span className='text-slate-500' aria-live='polite'>
          {isGridDisabled
            ? t('그리드 UI 동작이 잠겨 있습니다.', 'Grid UI interactions are locked.')
            : t('선택, 편집, 정렬, 페이징을 사용할 수 있습니다.', 'Selection, editing, sorting, and paging are available.')}
        </span>
      </div>

      <Alert
        type={isGridDisabled ? 'warning' : 'success'}
        showIcon
        message={
          isGridDisabled
            ? t('disabled=true 상태입니다. 스크롤을 제외한 그리드 UI 동작은 이벤트를 발생시키지 않습니다.', 'disabled=true. Grid UI interactions do not fire events except scrolling.')
            : t('disabled=false 상태입니다. 셀 클릭, 행 선택, 체크박스 편집, 헤더 툴박스, 페이지 이동을 시도해 보세요.', 'disabled=false. Try cell click, row selection, checkbox editing, header toolbox, and paging.')
        }
      />

      <DataGridContainer ref={containerRef} style={{ height: 390 }}>
        <BGrid<ApprovalRequest>
          width={width}
          height={height}
          headerHeight={35}
          data={pageRows}
          columns={columns}
          rowKey='requestId'
          showLineNumber
          disabled={isGridDisabled}
          spinning={processing}
          editable
          frozenColumnIndex={2}
          cellSelectionOptions={{ enabled: true }}
          cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 1 } }}
          dataControl={dataControl}
          rowChecked={{
            checkedRowKeys,
            onChange: (_indexes, rowKeys) => {
              setCheckedRowKeys(rowKeys);
              appendLog(`${t('선택 변경', 'Selection changed')}: ${rowKeys.length}${t('건', ' item(s)')}`);
            },
          }}
          onChangeColumns={(_columnIndex, { columns }) => setColumns(columns)}
          onChangeData={(rowIndex, _columnIndex, item) => {
            setRows(prevRows => prevRows.map(row => (row.values.requestId === item.requestId ? { values: item } : row)));
            appendLog(`${t('긴급 여부 편집', 'Urgent flag edited')}: ${item.requestId} (${rowIndex + 1})`);
          }}
          onClick={({ item }) => appendLog(`${t('셀 클릭', 'Cell clicked')}: ${item.requestId}`)}
          page={{
            currentPage,
            pageSize: PAGE_SIZE,
            totalPages: Math.ceil(rows.length / PAGE_SIZE),
            totalElements: rows.length,
            loading: false,
            onChange: pageNo => {
              setCurrentPage(pageNo);
              appendLog(`${t('페이지 이동', 'Page changed')}: ${pageNo}`);
            },
            displayPaginationLength: 5,
          }}
        />
      </DataGridContainer>

      <div className='rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-600' aria-live='polite'>
        <strong className='mr-2 text-slate-900'>{t('최근 이벤트', 'Recent Events')}</strong>
        {eventLog.length > 0 ? eventLog.join(' / ') : t('아직 이벤트가 없습니다.', 'No events yet.')}
      </div>
    </div>
  );
}

export default DisabledExample;
