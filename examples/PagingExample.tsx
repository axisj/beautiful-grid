import { t } from './i18n';
import * as React from 'react';
import { BGrid, BGridColumn, BGridDataItem } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';

interface MemberRecord {
  memberNo: string;
  name: string;
  email: string;
  membership: string;
  status: string;
  joinedAt: string;
}

const TOTAL_ELEMENTS = 498;
const PAGE_SIZE = 50;
const names = [t('김민준', 'Minjun Kim'), t('이서연', 'Seoyeon Lee'), t('박지후', 'Jihu Park'), t('최하윤', 'Hayun Choi'), t('정도현', 'Dohyun Jeong'), t('한유진', 'Yujin Han')];
const memberships = [t('일반', 'General'), 'Silver', 'Gold', 'VIP'];

const createPageData = (currentPage: number): BGridDataItem<MemberRecord>[] => {
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const length = Math.max(0, Math.min(PAGE_SIZE, TOTAL_ELEMENTS - startIndex));
  return Array.from({ length }, (_, pageIndex) => {
    const index = startIndex + pageIndex + 1;
    return {
      values: {
        memberNo: `MBR-${String(index).padStart(6, '0')}`,
        name: names[index % names.length],
        email: `member${String(index).padStart(4, '0')}@example.com`,
        membership: memberships[index % memberships.length],
        status: index % 17 === 0 ? t('차단', 'Blocked') : index % 7 === 0 ? t('휴면', 'Dormant') : t('정상', 'Normal'),
        joinedAt: `2026-${String(((index - 1) % 8) + 1).padStart(2, '0')}-${String(((index - 1) % 27) + 1).padStart(2, '0')}`,
      },
    };
  });
};

function PagingExample() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [columns, setColumns] = React.useState<BGridColumn<MemberRecord>[]>([
    { key: 'memberNo', label: t('회원번호', 'Member Number'), width: 120, align: 'center', sortDisable: true },
    { key: 'name', label: t('회원명', 'Member Name'), width: 110, align: 'center' },
    { key: 'email', label: t('이메일', 'Email'), width: 240 },
    { key: 'membership', label: t('등급', 'Level'), width: 100, align: 'center' },
    { key: 'status', label: t('계정 상태', 'Account Status'), width: 100, align: 'center' },
    { key: 'joinedAt', label: t('가입일', 'Join Date'), width: 120, align: 'center' },
  ]);
  const data = React.useMemo(() => createPageData(currentPage), [currentPage]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  return (
    <DataGridContainer ref={containerRef}>
      <BGrid<MemberRecord>
        width={width}
        height={height}
        headerHeight={35}
        data={data}
        columns={columns}
        rowKey='memberNo'
        onChangeColumns={(_columnIndex, { columns }) => setColumns(columns)}
        page={{
          currentPage,
          pageSize: PAGE_SIZE,
          totalPages: Math.ceil(TOTAL_ELEMENTS / PAGE_SIZE),
          totalElements: TOTAL_ELEMENTS,
          loading: false,
          onChange: pageNo => setCurrentPage(pageNo),
          displayPaginationLength: 5,
        }}
      />
    </DataGridContainer>
  );
}

export default PagingExample;
