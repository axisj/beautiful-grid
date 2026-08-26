import * as React from 'react';
import { BGrid, type BGridColumn, type BGridDataItem, type BGridProps } from 'beautiful-grid';
import { Select } from 'antd';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';

interface EmployeeRow {
  employeeNo: string;
  name: string;
  department: string;
  position: string;
  location: string;
  project: string;
  allocationRate: number;
  remainingLeaveDays: number;
  joinedAt: string;
  status: string;
}

const departments = ['플랫폼개발', '디자인시스템', '데이터엔지니어링', '서비스운영'];
const positions = ['책임', '선임', '주임', '매니저'];

const data: BGridDataItem<EmployeeRow>[] = Array.from({ length: 80 }, (_, index) => ({
  values: {
    employeeNo: `EMP-${String(index + 1).padStart(4, '0')}`,
    name: `구성원 ${index + 1}`,
    department: departments[index % departments.length],
    position: positions[index % positions.length],
    location: ['서울', '부산', '대전'][index % 3],
    project: `프로젝트 ${String.fromCharCode(65 + (index % 6))}`,
    allocationRate: 60 + (index % 5) * 10,
    remainingLeaveDays: 4 + (index % 12),
    joinedAt: `202${index % 6}-0${(index % 9) + 1}-15`,
    status: index % 11 === 0 ? '휴직' : index % 5 === 0 ? '휴가' : '재직',
  },
}));

const columns: BGridColumn<EmployeeRow>[] = [
  { key: 'employeeNo', label: '사번', width: 100 },
  { key: 'name', label: '이름', width: 120 },
  { key: 'department', label: '부서', width: 130 },
  { key: 'position', label: '직급', width: 90 },
  { key: 'location', label: '근무지', width: 90 },
  { key: 'project', label: '담당 프로젝트', width: 130 },
  { key: 'allocationRate', label: '투입률(%)', width: 100, align: 'right' },
  { key: 'remainingLeaveDays', label: '잔여 연차(일)', width: 110, align: 'right' },
  { key: 'joinedAt', label: '입사일', width: 110 },
  { key: 'status', label: '상태', width: 200, align: 'center' },
];

const summaryColumns: NonNullable<BGridProps<EmployeeRow>['summary']>['columns'] = [
  { columnIndex: 0, align: 'center', itemRender: () => <strong>인력 요약</strong> },
  { columnIndex: 1, align: 'center', itemRender: ({ data }) => `전체 ${data.length}명` },
  {
    columnIndex: 2,
    align: 'center',
    itemRender: ({ data }) => `${new Set(data.map(item => item.values.department)).size}개 부서`,
  },
  {
    columnIndex: 3,
    align: 'center',
    itemRender: ({ data }) => `${new Set(data.map(item => item.values.position)).size}개 직급`,
  },
  {
    columnIndex: 4,
    align: 'center',
    itemRender: ({ data }) => `${new Set(data.map(item => item.values.location)).size}개 근무지`,
  },
  {
    columnIndex: 5,
    align: 'center',
    itemRender: ({ data }) => `${new Set(data.map(item => item.values.project)).size}개 프로젝트`,
  },
  {
    columnIndex: 6,
    align: 'center',
    itemRender: ({ data }) =>
      `평균 ${Math.round(data.reduce((sum, item) => sum + item.values.allocationRate, 0) / data.length)}%`,
  },
  {
    columnIndex: 7,
    align: 'center',
    itemRender: ({ data }) =>
      `총 ${data.reduce((sum, item) => sum + item.values.remainingLeaveDays, 0).toLocaleString('ko-KR')}일`,
  },
  {
    columnIndex: 8,
    align: 'center',
    itemRender: ({ data }) => {
      const reviewDate = new Date('2026-08-19T00:00:00Z').getTime();
      const averageYears =
        data.reduce((sum, item) => sum + (reviewDate - new Date(`${item.values.joinedAt}T00:00:00Z`).getTime()), 0) /
        data.length /
        (365.25 * 24 * 60 * 60 * 1000);
      return `평균 ${averageYears.toFixed(1)}년`;
    },
  },
  {
    columnIndex: 9,
    align: 'center',
    itemRender: ({ data }) => {
      const statusCounts = data.reduce<Record<string, number>>((counts, item) => {
        counts[item.values.status] = (counts[item.values.status] ?? 0) + 1;
        return counts;
      }, {});
      return `재직 ${statusCounts.재직 ?? 0} · 휴가 ${statusCounts.휴가 ?? 0} · 휴직 ${statusCounts.휴직 ?? 0}`;
    },
  },
];

export default function FrozenColumnsExample() {
  const [frozenColumnIndex, setFrozenColumnIndex] = React.useState(2);
  const [frozenRowCount, setFrozenRowCount] = React.useState(2);
  const [summaryVisible, setSummaryVisible] = React.useState(true);
  const [summaryPosition, setSummaryPosition] = React.useState<'top' | 'bottom'>('top');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const summary = React.useMemo<NonNullable<BGridProps<EmployeeRow>['summary']>>(
    () => ({ position: summaryPosition, columns: summaryColumns }),
    [summaryPosition],
  );

  return (
    <div className="flex min-h-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 font-medium">
            <span>고정할 선행 컬럼 수</span>
            <Select<number>
              aria-label="고정할 컬럼 수"
              style={{ width: 84 }}
              value={frozenColumnIndex}
              options={[0, 1, 2, 3].map(count => ({ value: count, label: `${count}개` }))}
              onChange={setFrozenColumnIndex}
            />
          </label>
          <label className="inline-flex items-center gap-2 font-medium">
            <span>고정할 선행 행 수</span>
            <Select<number>
              aria-label="고정할 행 수"
              style={{ width: 84 }}
              value={frozenRowCount}
              options={[0, 1, 2, 3, 5].map(count => ({ value: count, label: `${count}개` }))}
              onChange={setFrozenRowCount}
            />
          </label>
          <label className="inline-flex items-center gap-2 font-medium">
            <input
              aria-label="Summary 표시"
              type="checkbox"
              checked={summaryVisible}
              onChange={event => setSummaryVisible(event.target.checked)}
            />
            <span>Summary 표시</span>
          </label>
          <label className="inline-flex items-center gap-2 font-medium">
            <span>Summary 위치</span>
            <Select<'top' | 'bottom'>
              aria-label="Summary 위치"
              style={{ width: 96 }}
              value={summaryPosition}
              disabled={!summaryVisible}
              options={[
                { value: 'top', label: '상단' },
                { value: 'bottom', label: '하단' },
              ]}
              onChange={setSummaryPosition}
            />
          </label>
        </div>
        <p className="m-0 text-slate-600">
          {summaryVisible ? `Summary ${summaryPosition === 'top' ? '상단' : '하단'} 표시` : 'Summary 숨김'} ·{' '}
          {summaryVisible && summaryPosition === 'top' ? 'Summary 다음 줄부터' : '첫 데이터 행부터'} {frozenRowCount}
          개 행, 왼쪽 {frozenColumnIndex}개 컬럼을 고정합니다.
        </p>
      </div>

      <DataGridContainer ref={containerRef} style={{ height: 420 }}>
        <BGrid<EmployeeRow>
          width={width}
          height={height}
          columns={columns}
          data={data}
          frozenColumnIndex={frozenColumnIndex}
          frozenRowCount={frozenRowCount}
          summary={summaryVisible ? summary : undefined}
          showLineNumber
          rowKey="employeeNo"
          selectedRowKey="EMP-0003"
          cellNavigationOptions={{ defaultActiveCell: { rowIndex: 2, columnIndex: 0 } }}
        />
      </DataGridContainer>
    </div>
  );
}
