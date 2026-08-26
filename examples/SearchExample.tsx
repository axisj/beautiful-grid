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

const departments = ['플랫폼개발', '디자인시스템', '데이터엔지니어링', '서비스운영'];
const locations = ['서울', '부산', '대전'];

const data: BGridDataItem<SearchRow>[] = Array.from({ length: 200 }, (_, index) => ({
  values: {
    employeeNo: `EMP-${String(index + 1).padStart(4, '0')}`,
    name: `구성원 ${index + 1}`,
    department: departments[index % departments.length],
    location: locations[index % locations.length],
    project: `프로젝트 ${String.fromCharCode(65 + (index % 8))}`,
    allocationRate: 60 + (index % 5) * 10,
    joinedAt: `202${index % 6}-${String((index % 12) + 1).padStart(2, '0')}-15`,
    status: index % 11 === 0 ? '휴직' : index % 5 === 0 ? '휴가' : '재직',
  },
}));

const columns: BGridColumn<SearchRow>[] = [
  { id: 'employeeNo', key: 'employeeNo', label: '사번', width: 110 },
  { id: 'name', key: 'name', label: '이름', width: 120, toolbox: true, filter: { type: 'text' } },
  {
    id: 'department',
    key: 'department',
    label: '부서',
    width: 150,
    toolbox: true,
    filter: { type: 'values' },
  },
  { id: 'location', key: 'location', label: '근무지', width: 100 },
  { id: 'project', key: 'project', label: '담당 프로젝트', width: 140 },
  {
    id: 'allocationRate',
    key: 'allocationRate',
    label: '투입률',
    width: 100,
    align: 'right',
    itemRender: ({ values }) => `${values.allocationRate}%`,
    getSearchText: ({ value }) => `${value}%`,
  },
  { id: 'joinedAt', key: 'joinedAt', label: '입사일', width: 120 },
  { id: 'status', key: 'status', label: '상태', width: 100, align: 'center' },
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
            그리드 검색
          </Button>
          <Select
            aria-label='검색 대상 부서 필터'
            value={department}
            style={{ width: 170 }}
            options={[{ value: 'all', label: '전체 부서' }, ...departments.map(value => ({ value, label: value }))]}
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
          <span>또는 셀 우클릭 → 검색</span>
        </div>
        <span>검색 범위: {department === 'all' ? '현재 로드된 200개 행' : `${department} 필터 결과`}</span>
      </div>

      {inspectedCell && (
        <div role='status' className='rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600'>
          컨텍스트 메뉴 대상: {inspectedCell.values.employeeNo} · {String(inspectedCell.column.label)} ·{' '}
          {String(inspectedCell.value)} (표시 {inspectedCell.visibleIndex}, 원본 {inspectedCell.sourceIndex})
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
              placeholder: '현재 로드된 데이터에서 찾기',
              formatResultCount: ({ activeResult, totalResults }) => `${activeResult} / ${totalResults}`,
            },
          }}
          contextMenuOptions={{
            items: target => [
              {
                id: 'inspect-cell',
                label: '이 셀 정보 보기',
                onSelect: () => setInspectedCell(target),
              },
            ],
          }}
        />
      </DataGridContainer>
    </div>
  );
}
