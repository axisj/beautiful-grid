import { t } from './i18n';
import * as React from 'react';
import { BGrid, BGridColumn, BGridDataItem } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';

interface KnowledgeArticle {
  articleId: number;
  category: string;
  title: string;
  owner: string;
  status: string;
  updatedAt: string;
}

const articleTitles = [
  t('신규 입사자 계정 발급 절차', 'New Employee Account Issuance Procedure'),
  t('법인카드 비용 정산 가이드', 'Corporate Card Expense Settlement Guide'),
  t('고객 데이터 보안 등급 정책', 'Customer Data Security Level Policy'),
  t('원격 근무 VPN 접속 방법', 'Remote Work VPN Access Method'),
  t('장애 상황 긴급 연락 체계', 'Emergency Contact System for Outages'),
  t('구매 요청 및 승인 프로세스', 'Purchase Request and Approval Process'),
];
const categories = [t('인사', 'HR'), t('재무', 'Finance'), t('보안', 'Security'), t('IT 운영', 'IT Operations'), t('고객지원', 'Customer Support')];
const owners = [t('김서준', 'Seojun Kim'), t('이하린', 'Harin Lee'), t('박도윤', 'Doyun Park'), t('최지우', 'Jiwoo Choi')];

const data: BGridDataItem<KnowledgeArticle>[] = Array.from({ length: 120 }, (_, index) => ({
  values: {
    articleId: index + 1,
    category: categories[index % categories.length],
    title: articleTitles[index % articleTitles.length],
    owner: owners[index % owners.length],
    status: index % 7 === 0 ? t('초안', 'Draft') : index % 4 === 0 ? t('검토 중', 'Under Review') : t('게시', 'Publish'),
    updatedAt: `2026-08-${String((index % 23) + 1).padStart(2, '0')}`,
  },
}));

export default function FocusExample() {
  const [selectedRowKey, setSelectedRowKey] = React.useState<number>();
  const [columns, setColumns] = React.useState<BGridColumn<KnowledgeArticle>[]>([
    { key: 'articleId', label: t('문서번호', 'Document Number'), width: 90, align: 'center' },
    { key: 'category', label: t('분류', 'Category'), width: 100, align: 'center' },
    { key: 'title', label: t('문서 제목', 'Document Title'), width: 320 },
    { key: 'owner', label: t('담당자', 'Assignee'), width: 100, align: 'center' },
    { key: 'status', label: t('게시 상태', 'Publish Status'), width: 100, align: 'center' },
    { key: 'updatedAt', label: t('최종 수정일', 'Last Modified Date'), width: 120, align: 'center', sortDisable: true },
  ]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const selectedArticle = data.find(item => item.values.articleId === selectedRowKey)?.values;

  return (
    <>
      <div data-testid='selected-article' style={{ marginBottom: 10 }}>
        <strong>선택 문서:</strong> {selectedArticle ? `${selectedArticle.articleId}. ${selectedArticle.title}` : t('없음', 'None')}
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
