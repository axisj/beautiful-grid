import * as React from 'react';
import { BGrid, BGridColumn, BGridDataItem } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';

interface MemberRecord {
  memberNo: string;
  name: string;
  email: string;
  membership: string;
  status: '정상' | '휴면' | '차단';
  joinedAt: string;
}

const TOTAL_ELEMENTS = 498;
const PAGE_SIZE = 50;
const names = ['김민준', '이서연', '박지후', '최하윤', '정도현', '한유진'];
const memberships = ['일반', 'Silver', 'Gold', 'VIP'];

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
        status: index % 17 === 0 ? '차단' : index % 7 === 0 ? '휴면' : '정상',
        joinedAt: `2026-${String(((index - 1) % 8) + 1).padStart(2, '0')}-${String(((index - 1) % 27) + 1).padStart(2, '0')}`,
      },
    };
  });
};

function PagingExample() {
  const [currentPage, setCurrentPage] = React.useState(1);
  const [columns, setColumns] = React.useState<BGridColumn<MemberRecord>[]>([
    { key: 'memberNo', label: '회원번호', width: 120, align: 'center', sortDisable: true },
    { key: 'name', label: '회원명', width: 110, align: 'center' },
    { key: 'email', label: '이메일', width: 240 },
    { key: 'membership', label: '등급', width: 100, align: 'center' },
    { key: 'status', label: '계정 상태', width: 100, align: 'center' },
    { key: 'joinedAt', label: '가입일', width: 120, align: 'center' },
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
