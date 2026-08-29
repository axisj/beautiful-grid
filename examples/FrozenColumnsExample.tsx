import { t } from './i18n';
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

const departments = [t('플랫폼개발', 'Platform Development'), t('디자인시스템', 'Design System'), t('데이터엔지니어링', 'Data Engineering'), t('서비스운영', 'Service Operation')];
const positions = [t('책임', 'Responsible'), t('선임', 'Senior'), t('주임', 'Assistant Manager'), t('매니저', 'Manager')];

const data: BGridDataItem<EmployeeRow>[] = Array.from({ length: 80 }, (_, index) => ({
  values: {
    employeeNo: `EMP-${String(index + 1).padStart(4, '0')}`,
    name: `${t('구성원', 'Member')} ${index + 1}`,
    department: departments[index % departments.length],
    position: positions[index % positions.length],
    location: [t('서울', 'Seoul'), t('부산', 'Busan'), t('대전', 'Daejeon')][index % 3],
    project: `${t('프로젝트', 'Project')} ${String.fromCharCode(65 + (index % 6))}`,
    allocationRate: 60 + (index % 5) * 10,
    remainingLeaveDays: 4 + (index % 12),
    joinedAt: `202${index % 6}-0${(index % 9) + 1}-15`,
    status: index % 11 === 0 ? t('휴직', 'Leave of Absence') : index % 5 === 0 ? t('휴가', 'On Leave') : t('재직', 'Employed'),
  },
}));

const columns: BGridColumn<EmployeeRow>[] = [
  { key: 'employeeNo', label: t('사번', 'Employee Number'), width: 100 },
  { key: 'name', label: t('이름', 'Name'), width: 120 },
  { key: 'department', label: t('부서', 'Department'), width: 130 },
  { key: 'position', label: t('직급', 'Job Title'), width: 90 },
  { key: 'location', label: t('근무지', 'Workplace'), width: 90 },
  { key: 'project', label: t('담당 프로젝트', 'Responsible Project'), width: 130 },
  { key: 'allocationRate', label: t('투입률(%)', 'Allocation Rate(%)'), width: 100, align: 'right' },
  { key: 'remainingLeaveDays', label: t('잔여 연차(일)', 'Remaining Leave Days'), width: 110, align: 'right' },
  { key: 'joinedAt', label: t('입사일', 'Date of Joining'), width: 110 },
  { key: 'status', label: t('상태', 'Status'), width: 200, align: 'center' },
];

const summaryColumns: NonNullable<BGridProps<EmployeeRow>['summary']>['columns'] = [
  { columnIndex: 0, align: 'center', itemRender: () => <strong>{t('인력 요약', 'Workforce Summary')}</strong> },
  { columnIndex: 1, align: 'center', itemRender: ({ data }) => `${t('전체', 'Total')} ${data.length}${t('명', ' people')}` },
  {
    columnIndex: 2,
    align: 'center',
    itemRender: ({ data }) => `${new Set(data.map(item => item.values.department)).size}${t('개 부서', ' departments')}`,
  },
  {
    columnIndex: 3,
    align: 'center',
    itemRender: ({ data }) => `${new Set(data.map(item => item.values.position)).size}${t('개 직급', ' job titles')}`,
  },
  {
    columnIndex: 4,
    align: 'center',
    itemRender: ({ data }) => `${new Set(data.map(item => item.values.location)).size}${t('개 근무지', ' workplaces')}`,
  },
  {
    columnIndex: 5,
    align: 'center',
    itemRender: ({ data }) => `${new Set(data.map(item => item.values.project)).size}${t('개 프로젝트', ' projects')}`,
  },
  {
    columnIndex: 6,
    align: 'center',
    itemRender: ({ data }) =>
      `${t('평균', 'Avg')} ${Math.round(data.reduce((sum, item) => sum + item.values.allocationRate, 0) / data.length)}%`,
  },
  {
    columnIndex: 7,
    align: 'center',
    itemRender: ({ data }) =>
      `${t('총', 'Total')} ${data.reduce((sum, item) => sum + item.values.remainingLeaveDays, 0).toLocaleString('ko-KR')}${t('일', ' days')}`,
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
      return `${t('평균', 'Avg')} ${averageYears.toFixed(1)}${t('년', ' years')}`;
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
      return `${t('재직', 'Employed')} ${statusCounts[t('재직', 'Employed')] ?? 0} · ${t('휴가', 'On Leave')} ${statusCounts[t('휴가', 'On Leave')] ?? 0} · ${t('휴직', 'Leave of Absence')} ${statusCounts[t('휴직', 'Leave of Absence')] ?? 0}`;
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
            <span>{t('고정할 선행 컬럼 수', 'Number of Columns to Freeze')}</span>
            <Select<number>
              aria-label={t('고정할 컬럼 수', 'Number of Columns to Freeze')}
              style={{ width: 84 }}
              value={frozenColumnIndex}
              options={[0, 1, 2, 3].map(count => ({ value: count, label: `${count}${t('개', ' cols')}` }))}
              onChange={setFrozenColumnIndex}
            />
          </label>
          <label className="inline-flex items-center gap-2 font-medium">
            <span>{t('고정할 선행 행 수', 'Number of Rows to Freeze')}</span>
            <Select<number>
              aria-label={t('고정할 행 수', 'Number of Rows to Freeze')}
              style={{ width: 84 }}
              value={frozenRowCount}
              options={[0, 1, 2, 3, 5].map(count => ({ value: count, label: `${count}${t('개', ' rows')}` }))}
              onChange={setFrozenRowCount}
            />
          </label>
          <label className="inline-flex items-center gap-2 font-medium">
            <input
              aria-label={t('Summary 표시', 'Show Summary')}
              type="checkbox"
              checked={summaryVisible}
              onChange={event => setSummaryVisible(event.target.checked)}
            />
            <span>{t('Summary 표시', 'Show Summary')}</span>
          </label>
          <label className="inline-flex items-center gap-2 font-medium">
            <span>{t('Summary 위치', 'Summary Position')}</span>
            <Select<'top' | 'bottom'>
              aria-label={t('Summary 위치', 'Summary Position')}
              style={{ width: 96 }}
              value={summaryPosition}
              disabled={!summaryVisible}
              options={[
                { value: 'top', label: t('상단', 'Top') },
                { value: 'bottom', label: t('하단', 'Bottom') },
              ]}
              onChange={setSummaryPosition}
            />
          </label>
        </div>
        <p className="m-0 text-slate-600">
          {summaryVisible ? `Summary ${summaryPosition === 'top' ? t('상단', 'Top') : t('하단', 'Bottom')} ${t('표시', 'Shown')}` : t('Summary 숨김', 'Summary Hidden')} ·{' '}
          {summaryVisible && summaryPosition === 'top' ? t('Summary 다음 줄부터', 'From next line of Summary') : t('첫 데이터 행부터', 'From First Data Row')} {frozenRowCount}
          {t('개 행, 왼쪽', ' rows, left')} {frozenColumnIndex}{t('개 컬럼을 고정합니다.', ' columns are frozen.')}
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
