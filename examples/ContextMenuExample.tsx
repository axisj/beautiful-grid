import * as React from 'react';
import { Tag } from 'antd';
import { Info, LockKeyhole, Rows3, Search, UserCheck } from 'lucide-react';
import {
  BGrid,
  type BGridColumn,
  type BGridContextMenuTarget,
  type BGridDataItem,
  type BGridDataQuery,
} from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';

interface SupportRequest {
  requestNo: string;
  customer: string;
  subject: string;
  owner: string;
  priority: '높음' | '보통' | '낮음';
  status: '접수' | '처리 중' | '완료';
  createdAt: string;
}

const customers = ['AxisJ Studio', 'Northwind', '서울 물류', 'Mono Office'];
const subjects = ['권한 설정 문의', '데이터 업로드 확인', '결제 내역 요청', '화면 표시 오류'];
const owners = ['김하늘', '박민준', '이서연', '최도윤'];
const priorities: SupportRequest['priority'][] = ['높음', '보통', '낮음'];
const statuses: SupportRequest['status'][] = ['접수', '처리 중', '완료'];

const data: BGridDataItem<SupportRequest>[] = Array.from({ length: 24 }, (_, index) => ({
  values: {
    requestNo: `REQ-${String(index + 1).padStart(4, '0')}`,
    customer: customers[index % customers.length],
    subject: subjects[index % subjects.length],
    owner: owners[index % owners.length],
    priority: priorities[index % priorities.length],
    status: statuses[index % statuses.length],
    createdAt: `2026-08-${String((index % 22) + 1).padStart(2, '0')}`,
  },
}));

const columns: BGridColumn<SupportRequest>[] = [
  { id: 'requestNo', key: 'requestNo', label: '요청 번호', width: 120 },
  { id: 'customer', key: 'customer', label: '고객', width: 150 },
  { id: 'subject', key: 'subject', label: '문의 내용', width: 190 },
  { id: 'owner', key: 'owner', label: '담당자', width: 110 },
  { id: 'priority', key: 'priority', label: '우선순위', width: 100, align: 'center' },
  { id: 'status', key: 'status', label: '상태', width: 100, align: 'center' },
  { id: 'createdAt', key: 'createdAt', label: '접수일', width: 120 },
];

const dataQuery: BGridDataQuery = {
  sortParams: [{ columnId: 'createdAt', key: 'createdAt', orderBy: 'desc' }],
  filterParams: [],
};

function describeTarget(target: BGridContextMenuTarget<SupportRequest>) {
  return `${target.values.requestNo} · ${String(target.column.label)} · ${String(target.value)}`;
}

export default function ContextMenuExample() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const [menuTarget, setMenuTarget] = React.useState<BGridContextMenuTarget<SupportRequest>>();
  const [lastAction, setLastAction] = React.useState('본문 셀을 우클릭해 메뉴를 열어보세요.');

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>
        <div className='flex flex-wrap items-center gap-2'>
          <Tag color='blue'>우클릭</Tag>
          <Tag>Shift+F10</Tag>
          <span>본문 셀에서 포인터 또는 키보드로 메뉴를 열 수 있습니다.</span>
        </div>
        <span>접수일 내림차순 · 표시/원본 인덱스 비교</span>
      </div>

      <div
        role='status'
        aria-live='polite'
        className='rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600'
      >
        <strong className='mr-2 text-slate-800'>최근 동작</strong>
        {lastAction}
        {menuTarget && (
          <span className='ml-2 text-slate-500'>
            (표시 {menuTarget.visibleIndex}, 원본 {menuTarget.sourceIndex})
          </span>
        )}
      </div>

      <DataGridContainer ref={containerRef} style={{ height: 430 }}>
        <BGrid<SupportRequest>
          width={width}
          height={height}
          data={data}
          columns={columns}
          rowKey='requestNo'
          frozenColumnIndex={2}
          showLineNumber
          dataControl={{ mode: 'client', query: dataQuery, onChange: () => undefined }}
          cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 1 } }}
          searchOptions={{
            icons: { search: <Search size={16} aria-hidden='true' /> },
            labels: { contextMenuItem: '그리드에서 검색' },
          }}
          contextMenuOptions={{
            onOpenChange: (open, target) => {
              if (target) setMenuTarget(target);
              if (open && target) setLastAction(`메뉴 열림: ${describeTarget(target)}`);
            },
            items: target => [
              {
                id: 'inspect-cell',
                label: '셀 정보 보기',
                icon: <Info size={15} aria-hidden='true' />,
                shortcut: 'I',
                onSelect: selected => {
                  setMenuTarget(selected);
                  setLastAction(`셀 선택: ${describeTarget(selected)}`);
                },
              },
              {
                id: 'inspect-row',
                label: '행 전체 정보 보기',
                icon: <Rows3 size={15} aria-hidden='true' />,
                shortcut: 'R',
                onSelect: selected => {
                  setMenuTarget(selected);
                  setLastAction(`행 선택: ${selected.values.requestNo} · ${selected.values.customer}`);
                },
              },
              { type: 'separator', id: 'assignment-separator' },
              {
                id: 'assign-owner',
                label:
                  target.values.status === '완료' ? '완료된 요청은 담당자 지정 불가' : '현재 사용자에게 담당자 지정',
                icon:
                  target.values.status === '완료' ? (
                    <LockKeyhole size={15} aria-hidden='true' />
                  ) : (
                    <UserCheck size={15} aria-hidden='true' />
                  ),
                disabled: target.values.status === '완료',
                onSelect: selected => {
                  setMenuTarget(selected);
                  setLastAction(`담당자 지정 요청: ${selected.values.requestNo}`);
                },
              },
            ],
          }}
        />
      </DataGridContainer>

      <p className='m-0 text-xs leading-5 text-slate-500'>
        <code>shortcut</code>은 메뉴 오른쪽의 안내 표기입니다. 실제 애플리케이션 단축키는 별도 keyboard
        handler와 연결하세요.
      </p>
    </div>
  );
}
