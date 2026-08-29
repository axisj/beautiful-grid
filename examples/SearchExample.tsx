import { t } from './i18n';
import * as React from 'react';
import { Button, Select, Tag } from 'antd';
import { ChevronDown, ChevronUp, Search, X } from 'lucide-react';
import {
  BGrid,
  type BGridColumn,
  type BGridContextMenuTarget,
  type BGridDataItem,
  type BGridDataQuery,
} from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';

interface SearchRow {
  employeeNo: string;
  name: string;
  department: string;
  location: string;
  project: string;
  allocationRate: number;
  joinedAt: string;
  status: string;
}

const departments = [t('플랫폼개발', 'Platform Development'), t('디자인시스템', 'Design System'), t('데이터엔지니어링', 'Data Engineering'), t('서비스운영', 'Service Operation')];
const locations = [t('서울', 'Seoul'), t('부산', 'Busan'), t('대전', 'Daejeon')];

const data: BGridDataItem<SearchRow>[] = Array.from({ length: 200 }, (_, index) => ({
  values: {
    employeeNo: `EMP-${String(index + 1).padStart(4, '0')}`,
    name: `${t('구성원', 'Member')} ${index + 1}`,
    department: departments[index % departments.length],
    location: locations[index % locations.length],
    project: `${t('프로젝트', 'Project')} ${String.fromCharCode(65 + (index % 8))}`,
    allocationRate: 60 + (index % 5) * 10,
    joinedAt: `202${index % 6}-${String((index % 12) + 1).padStart(2, '0')}-15`,
    status: index % 11 === 0 ? t('휴직', 'Leave of Absence') : index % 5 === 0 ? t('휴가', 'On Leave') : t('재직', 'Employed'),
  },
}));

const columns: BGridColumn<SearchRow>[] = [
  { id: 'employeeNo', key: 'employeeNo', label: t('사번', 'Employee Number'), width: 110 },
  { id: 'name', key: 'name', label: t('이름', 'Name'), width: 120, toolbox: true, filter: { type: 'text' } },
  {
    id: 'department',
    key: 'department',
    label: t('부서', 'Department'),
    width: 150,
    toolbox: true,
    filter: { type: 'values' },
  },
  { id: 'location', key: 'location', label: t('근무지', 'Workplace'), width: 100 },
  { id: 'project', key: 'project', label: t('담당 프로젝트', 'Responsible Project'), width: 140 },
  {
    id: 'allocationRate',
    key: 'allocationRate',
    label: t('투입률', 'Input Rate'),
    width: 100,
    align: 'right',
    itemRender: ({ values }) => `${values.allocationRate}%`,
    getSearchText: ({ value }) => `${value}%`,
  },
  { id: 'joinedAt', key: 'joinedAt', label: t('입사일', 'Date of Joining'), width: 120 },
  { id: 'status', key: 'status', label: t('상태', 'Status'), width: 100, align: 'center' },
];

export default function SearchExample() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const [searchOpen, setSearchOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [dataQuery, setDataQuery] = React.useState<BGridDataQuery>({ sortParams: [], filterParams: [] });
  const [inspectedCell, setInspectedCell] = React.useState<BGridContextMenuTarget<SearchRow>>();
  const departmentFilter = dataQuery.filterParams.find(
    filter => filter.columnId === 'department' && filter.type === 'values',
  );
  const department = departmentFilter?.type === 'values' ? String(departmentFilter.values[0] ?? 'all') : 'all';

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>
        <div className='flex flex-wrap items-center gap-2'>
          <Button icon={<Search size={15} />} onClick={() => setSearchOpen(true)}>
            {t('그리드 검색', 'Search Grid')}
          </Button>
          <Select
            aria-label={t('검색 대상 부서 필터', 'Search Target Department Filter')}
            value={department}
            style={{ width: 170 }}
            options={[{ value: 'all', label: t('전체 부서', 'All Departments') }, ...departments.map(value => ({ value, label: value }))]}
            onChange={nextDepartment =>
              setDataQuery(current => ({
                ...current,
                filterParams:
                  nextDepartment === 'all'
                    ? current.filterParams.filter(filter => filter.columnId !== 'department')
                    : [
                        ...current.filterParams.filter(filter => filter.columnId !== 'department'),
                        {
                          columnId: 'department',
                          key: 'department',
                          type: 'values',
                          values: [nextDepartment],
                        },
                      ],
              }))
            }
          />
          <Tag color='blue'>Ctrl/Cmd+F</Tag>
          <span>{t('또는 셀 우클릭 → 검색', 'Or right-click on cell → Search')}</span>
        </div>
        <span>{t('검색 범위:', 'Search Scope:')} {department === 'all' ? t('현재 로드된 200개 행', 'Currently Loaded 200 Rows') : `${department} ${t('필터 결과', 'Filter Result')}`}</span>
      </div>

      {inspectedCell && (
        <div role='status' className='rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600'>
          {t('컨텍스트 메뉴 대상:', 'Context Menu Target:')} {inspectedCell.values.employeeNo} · {String(inspectedCell.column.label)} ·{' '}
          {String(inspectedCell.value)} ({t('표시', 'Visible')} {inspectedCell.visibleIndex}, {t('원본', 'Source')} {inspectedCell.sourceIndex})
        </div>
      )}

      <DataGridContainer ref={containerRef} style={{ height: 430 }}>
        <BGrid<SearchRow>
          width={width}
          height={height}
          data={data}
          columns={columns}
          rowKey='employeeNo'
          frozenColumnIndex={2}
          frozenRowCount={2}
          showLineNumber
          dataControl={{ mode: 'client', query: dataQuery, onChange: setDataQuery }}
          cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 1 } }}
          searchOptions={{
            open: searchOpen,
            query: searchQuery,
            onOpenChange: setSearchOpen,
            onQueryChange: setSearchQuery,
            icons: {
              search: <Search size={16} aria-hidden='true' />,
              previous: <ChevronUp size={16} aria-hidden='true' />,
              next: <ChevronDown size={16} aria-hidden='true' />,
              close: <X size={16} aria-hidden='true' />,
            },
            labels: {
              placeholder: t('현재 로드된 데이터에서 찾기', 'Find in Currently Loaded Data'),
              formatResultCount: ({ activeResult, totalResults }) => `${activeResult} / ${totalResults}`,
            },
          }}
          contextMenuOptions={{
            items: target => [
              {
                id: 'inspect-cell',
                label: t('이 셀 정보 보기', 'View this cell\'s information'),
                onSelect: () => setInspectedCell(target),
              },
            ],
          }}
        />
      </DataGridContainer>
    </div>
  );
}
