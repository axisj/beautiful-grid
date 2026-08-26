import * as React from 'react';
import { BGrid, BGridColumn, BGridDataItem } from 'beautiful-grid';
import { useContainerSize } from '../hooks/useContainerSize';
import DataGridContainer from '../components/DataGridContainer';

interface BannerPriority {
  bannerCode: string;
  title: string;
  placement: string;
  audience: string;
  period: string;
  status: '노출 중' | '예약' | '비활성';
}

const bannerTitles = [
  '여름 시즌 최대 40% 프로모션',
  '신규 회원 웰컴 쿠폰 안내',
  '프리미엄 멤버십 오픈',
  '오늘 주문 내일 도착 캠페인',
  '카카오페이 즉시 할인',
  '리뷰 작성 포인트 두 배 적립',
  '주말 한정 타임 세일',
  '친구 초대 리워드 이벤트',
];
const placements = ['메인 히어로', '홈 중단', '카테고리 상단', '앱 팝업'];
const audiences = ['전체 고객', '신규 회원', 'VIP 회원', '최근 구매 고객'];

const initialBanners: BGridDataItem<BannerPriority>[] = Array.from({ length: 24 }, (_, index) => ({
  values: {
    bannerCode: `BNR-${String(index + 1).padStart(3, '0')}`,
    title: bannerTitles[index % bannerTitles.length],
    placement: placements[index % placements.length],
    audience: audiences[index % audiences.length],
    period: `2026-08-${String((index % 20) + 1).padStart(2, '0')} ~ 2026-09-${String((index % 9) + 1).padStart(2, '0')}`,
    status: index % 6 === 5 ? '비활성' : index % 4 === 3 ? '예약' : '노출 중',
  },
}));

export default function ReorderExample() {
  const [data, setData] = React.useState(initialBanners);
  const [columns, setColumns] = React.useState<BGridColumn<BannerPriority>[]>([
    { key: 'bannerCode', label: '배너코드', width: 100, align: 'center' },
    { key: 'title', label: '배너 제목', width: 260 },
    { key: 'placement', label: '노출 위치', width: 120, align: 'center' },
    { key: 'audience', label: '대상 고객', width: 120, align: 'center' },
    { key: 'period', label: '노출 기간', width: 210, align: 'center' },
    {
      key: 'status',
      label: '노출 상태',
      width: 100,
      align: 'center',
      itemRender: ({ values }) => <strong>{values.status}</strong>,
    },
  ]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  return (
    <DataGridContainer ref={containerRef}>
      <BGrid<BannerPriority>
        width={width}
        height={height}
        data={data}
        columns={columns}
        rowKey='bannerCode'
        showLineNumber
        columnSortable={false}
        onChangeColumns={(_columnIndex, { columns }) => setColumns(columns)}
        reorder={{
          enabled: true,
          onReorder: reorderedData => {
            setData(reorderedData);
            return true;
          },
        }}
      />
    </DataGridContainer>
  );
}
