import * as React from 'react';
import { BGrid, BGridColumn, BGridDataItem } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';

interface KnowledgeArticle {
  articleId: number;
  category: string;
  title: string;
  owner: string;
  status: '게시' | '검토 중' | '초안';
  updatedAt: string;
}

const articleTitles = [
  '신규 입사자 계정 발급 절차',
  '법인카드 비용 정산 가이드',
  '고객 데이터 보안 등급 정책',
  '원격 근무 VPN 접속 방법',
  '장애 상황 긴급 연락 체계',
  '구매 요청 및 승인 프로세스',
];
const categories = ['인사', '재무', '보안', 'IT 운영', '고객지원'];
const owners = ['김서준', '이하린', '박도윤', '최지우'];

const data: BGridDataItem<KnowledgeArticle>[] = Array.from({ length: 120 }, (_, index) => ({
  values: {
    articleId: index + 1,
    category: categories[index % categories.length],
    title: articleTitles[index % articleTitles.length],
    owner: owners[index % owners.length],
    status: index % 7 === 0 ? '초안' : index % 4 === 0 ? '검토 중' : '게시',
    updatedAt: `2026-08-${String((index % 23) + 1).padStart(2, '0')}`,
  },
}));

export default function FocusExample() {
  const [selectedRowKey, setSelectedRowKey] = React.useState<number>();
  const [columns, setColumns] = React.useState<BGridColumn<KnowledgeArticle>[]>([
    { key: 'articleId', label: '문서번호', width: 90, align: 'center' },
    { key: 'category', label: '분류', width: 100, align: 'center' },
    { key: 'title', label: '문서 제목', width: 320 },
    { key: 'owner', label: '담당자', width: 100, align: 'center' },
    { key: 'status', label: '게시 상태', width: 100, align: 'center' },
    { key: 'updatedAt', label: '최종 수정일', width: 120, align: 'center', sortDisable: true },
  ]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const selectedArticle = data.find(item => item.values.articleId === selectedRowKey)?.values;

  return (
    <>
      <div data-testid='selected-article' style={{ marginBottom: 10 }}>
        <strong>선택 문서:</strong> {selectedArticle ? `${selectedArticle.articleId}. ${selectedArticle.title}` : '없음'}
      </div>
      <DataGridContainer ref={containerRef}>
        <BGrid<KnowledgeArticle>
          width={width}
          height={height}
          headerHeight={35}
          data={data}
          columns={columns}
          rowKey='articleId'
          selectedRowKey={selectedRowKey}
          onChangeColumns={(_columnIndex, { columns }) => setColumns(columns)}
          onClick={({ item }) => setSelectedRowKey(item.articleId)}
        />
      </DataGridContainer>
    </>
  );
}
