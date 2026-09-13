import * as React from 'react';
import { ChevronDown, ChevronRight, File } from 'lucide-react';
import { BGrid, type BGridColumn, type BGridDataItem, type BGridDataQuery } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import { exampleMsg, t } from './i18n';

interface OrganizationRow {
  id: string;
  parentId: string | null;
  name: string;
  type: string;
  owner: string;
}

const data: BGridDataItem<OrganizationRow>[] = [
  {
    values: {
      id: 'platform',
      parentId: null,
      name: t('플랫폼 본부', 'Platform'),
      type: t('본부', 'Division'),
      owner: 'Mina',
    },
  },
  {
    values: {
      id: 'frontend',
      parentId: 'platform',
      name: t('프론트엔드 팀', 'Frontend'),
      type: t('팀', 'Team'),
      owner: 'Alex',
    },
  },
  { values: { id: 'grid', parentId: 'frontend', name: 'BeautifulGrid', type: t('프로젝트', 'Project'), owner: 'Jin' } },
  {
    values: {
      id: 'design',
      parentId: 'frontend',
      name: t('디자인 시스템', 'Design System'),
      type: t('프로젝트', 'Project'),
      owner: 'Sora',
    },
  },
  {
    values: {
      id: 'backend',
      parentId: 'platform',
      name: t('백엔드 팀', 'Backend'),
      type: t('팀', 'Team'),
      owner: 'Noah',
    },
  },
  {
    values: {
      id: 'commerce',
      parentId: null,
      name: t('커머스 본부', 'Commerce'),
      type: t('본부', 'Division'),
      owner: 'Yuna',
    },
  },
  {
    values: { id: 'orders', parentId: 'commerce', name: t('주문 팀', 'Orders'), type: t('팀', 'Team'), owner: 'Liam' },
  },
];

// Keep the demo large enough to exercise hierarchy projection and virtual scrolling together.
const initialExpandedRowKeys: React.Key[] = ['platform', 'frontend', 'division-1', 'division-1-team-1'];
for (let divisionIndex = 1; divisionIndex <= 50; divisionIndex++) {
  const divisionId = `division-${divisionIndex}`;
  data.push({
    values: {
      id: divisionId,
      parentId: null,
      name: t(`사업 본부 ${divisionIndex}`, `Business division ${divisionIndex}`),
      type: t('본부', 'Division'),
      owner: `Owner ${divisionIndex}`,
    },
  });
  for (let teamIndex = 1; teamIndex <= 10; teamIndex++) {
    const teamId = `${divisionId}-team-${teamIndex}`;
    data.push({
      values: {
        id: teamId,
        parentId: divisionId,
        name: t(`팀 ${divisionIndex}-${teamIndex}`, `Team ${divisionIndex}-${teamIndex}`),
        type: t('팀', 'Team'),
        owner: `Lead ${divisionIndex}-${teamIndex}`,
      },
    });
    for (let projectIndex = 1; projectIndex <= 20; projectIndex++) {
      data.push({
        values: {
          id: `${teamId}-project-${projectIndex}`,
          parentId: teamId,
          name: t(
            `프로젝트 ${divisionIndex}-${teamIndex}-${projectIndex}`,
            `Project ${divisionIndex}-${teamIndex}-${projectIndex}`,
          ),
          type: t('프로젝트', 'Project'),
          owner: `Member ${projectIndex}`,
        },
      });
    }
  }
}

const columns: BGridColumn<OrganizationRow>[] = [
  {
    id: 'name',
    key: 'name',
    label: t('조직·프로젝트', 'Organization & project'),
    width: 260,
    toolbox: true,
    filter: { type: 'text' },
  },
  { id: 'type', key: 'type', label: t('구분', 'Type'), width: 120, toolbox: true, filter: { type: 'values' } },
  { id: 'owner', key: 'owner', label: t('담당자', 'Owner'), width: 120, toolbox: true, filter: { type: 'text' } },
];

export default function TreeFoldingExample() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const [expandedRowKeys, setExpandedRowKeys] = React.useState<React.Key[]>(() => [...initialExpandedRowKeys]);
  const [query, setQuery] = React.useState<BGridDataQuery>({ sortParams: [], filterParams: [] });

  return (
    <DataGridContainer ref={containerRef}>
      <BGrid
        width={width}
        height={height}
        columns={columns}
        data={data}
        rowKey='id'
        msg={exampleMsg}
        tree={{
          parentRowKey: 'parentId',
          treeColumnId: 'name',
          expandedRowKeys,
          onExpandedRowKeysChange: setExpandedRowKeys,
          icons: {
            expanded: <ChevronDown size={14} />,
            collapsed: <ChevronRight size={14} />,
            leaf: <File size={12} />,
          },
        }}
        dataControl={{ mode: 'client', query, onChange: setQuery }}
        status={{
          content: ({ visibleItems }) =>
            t(
              `원본 ${data.length.toLocaleString()}행 · 현재 ${visibleItems.toLocaleString()}행`,
              `${data.length.toLocaleString()} source rows · ${visibleItems.toLocaleString()} visible`,
            ),
        }}
        variant='vertical-bordered'
      />
    </DataGridContainer>
  );
}
