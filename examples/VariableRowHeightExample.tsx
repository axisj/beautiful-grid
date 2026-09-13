import * as React from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import { t } from './i18n';

type ActivityKind = 'milestone' | 'update' | 'note';

interface ProjectActivity {
  id: number;
  kind: ActivityKind;
  title: string;
  owner: string;
  status: string;
  rowHeight: number;
}

const kindLabels: Record<ActivityKind, string> = {
  milestone: t('마일스톤', 'Milestone'),
  update: t('업데이트', 'Update'),
  note: t('메모', 'Note'),
};

const activities: BGridDataItem<ProjectActivity>[] = Array.from({ length: 200 }, (_, index) => {
  const kind: ActivityKind = index % 12 === 0 ? 'milestone' : index % 4 === 0 ? 'update' : 'note';
  const rowHeight = kind === 'milestone' ? 52 : kind === 'update' ? 40 : 29;

  return {
    values: {
      id: index + 1,
      kind,
      title:
        kind === 'milestone'
          ? t(`스프린트 ${Math.floor(index / 12) + 1} 완료`, `Sprint ${Math.floor(index / 12) + 1} completed`)
          : t(`프로젝트 활동 ${index + 1}`, `Project activity ${index + 1}`),
      owner: ['Mina', 'Daniel', 'Sora', 'Alex'][index % 4],
      status:
        kind === 'milestone'
          ? t('완료', 'Done')
          : index % 3 === 0
          ? t('검토 중', 'In review')
          : t('진행 중', 'In progress'),
      rowHeight,
    },
  };
});

const columns: BGridColumn<ProjectActivity>[] = [
  { id: 'id', key: 'id', label: '#', width: 70, align: 'center' },
  {
    id: 'kind',
    key: 'kind',
    label: t('유형', 'Type'),
    width: 110,
    itemRender: ({ values }) => <strong>{kindLabels[values.kind]}</strong>,
  },
  { id: 'title', key: 'title', label: t('활동', 'Activity'), width: 260 },
  { id: 'owner', key: 'owner', label: t('담당자', 'Owner'), width: 100 },
  { id: 'status', key: 'status', label: t('상태', 'Status'), width: 110 },
  {
    id: 'rowHeight',
    key: 'rowHeight',
    label: t('행 높이', 'Row height'),
    width: 100,
    align: 'right',
    itemRender: ({ value }) => `${value}px`,
  },
];

export default function VariableRowHeightExample() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const getRowHeight = React.useCallback((row: ProjectActivity) => row.rowHeight, []);

  return (
    <DataGridContainer ref={containerRef} className='variable-row-height-example'>
      <BGrid<ProjectActivity>
        width={width}
        height={height}
        columns={columns}
        data={activities}
        rowKey='id'
        showLineNumber
        frozenRowCount={1}
        getRowHeight={getRowHeight}
      />
    </DataGridContainer>
  );
}
