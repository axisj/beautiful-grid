import { t } from './i18n';
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
  status: string;
}

const bannerTitles = [
  t('여름 시즌 최대 40% 프로모션', 'Summer Season Up to 40% Promotion'),
  t('신규 회원 웰컴 쿠폰 안내', 'New Member Welcome Coupon Guide'),
  t('프리미엄 멤버십 오픈', 'Premium Membership Open'),
  t('오늘 주문 내일 도착 캠페인', 'Order Today, Arrive Tomorrow Campaign'),
  t('카카오페이 즉시 할인', 'KakaoPay Instant Discount'),
  t('리뷰 작성 포인트 두 배 적립', 'Double Points for Writing a Review'),
  t('주말 한정 타임 세일', 'Weekend Limited Time Sale'),
  t('친구 초대 리워드 이벤트', 'Friend Invitation Reward Event'),
];
const placements = [t('메인 히어로', 'Main Hero'), t('홈 중단', 'Home Interruption'), t('카테고리 상단', 'Top of Category'), t('앱 팝업', 'App Popup')];
const audiences = [t('전체 고객', 'All Customers'), t('신규 회원', 'New Member'), t('VIP 회원', 'VIP Member'), t('최근 구매 고객', 'Recent Customers')];

const initialBanners: BGridDataItem<BannerPriority>[] = Array.from({ length: 24 }, (_, index) => ({
  values: {
    bannerCode: `BNR-${String(index + 1).padStart(3, '0')}`,
    title: bannerTitles[index % bannerTitles.length],
    placement: placements[index % placements.length],
    audience: audiences[index % audiences.length],
    period: `2026-08-${String((index % 20) + 1).padStart(2, '0')} ~ 2026-09-${String((index % 9) + 1).padStart(2, '0')}`,
    status: index % 6 === 5 ? t('비활성', 'Inactive') : index % 4 === 3 ? t('예약', 'Reservation') : t('노출 중', 'Exposing'),
  },
}));

export default function ReorderExample() {
  const [data, setData] = React.useState(initialBanners);
  const [columns, setColumns] = React.useState<BGridColumn<BannerPriority>[]>([
    { key: 'bannerCode', label: t('배너코드', 'Banner Code'), width: 100, align: 'center' },
    { key: 'title', label: t('배너 제목', 'Banner Title'), width: 260 },
    { key: 'placement', label: t('노출 위치', 'Exposure Location'), width: 120, align: 'center' },
    { key: 'audience', label: t('대상 고객', 'Target Customer'), width: 120, align: 'center' },
    { key: 'period', label: t('노출 기간', 'Exposure Period'), width: 210, align: 'center' },
    {
      key: 'status',
      label: t('노출 상태', 'Exposure Status'),
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
