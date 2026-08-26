import * as React from 'react';
import { notification } from 'antd';
import { BGrid, BGridColumn } from 'beautiful-grid';
import type { BGridCellSelectionCopyError } from 'beautiful-grid';
import { useContainerSize } from '../hooks/useContainerSize';
import DataGridContainer from '../components/DataGridContainer';

interface IOrderItem {
  orderNo: string;
  orderedAt: string;
  customerName: string;
  customerTier: string;
  salesChannel: string;
  region: string;
  salesTeam: string;
  salesRep: string;
  category: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  grossAmount: number;
  discountRate: number;
  netAmount: number;
  paymentMethod: string;
  paymentStatus: string;
  orderStatus: string;
  fulfillmentCenter: string;
  shippingMethod: string;
  promisedAt: string;
  riskLevel: string;
  marginRate: number;
}

const ROW_COUNT = 550000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ORDER_START_AT = Date.UTC(2026, 0, 1, 9);
const companyNames = [
  '한빛리테일',
  '서울커머스',
  '오로라테크',
  '브릿지웍스',
  '그린마켓',
  '넥스트랩',
  '모노오피스',
  '클라우드나인',
  '페이퍼앤코',
  '어반스토어',
  '블루하버',
  '트리니티솔루션',
];
const customerTiers = ['일반', '실버', '골드', 'VIP'];
const salesChannels = ['직영몰', '오픈마켓', '파트너', '오프라인', 'B2B'];
const regions = ['서울', '경기', '인천', '부산', '대전', '광주', '대구', '제주'];
const salesTeams = ['엔터프라이즈 1팀', '엔터프라이즈 2팀', '커머스팀', '파트너팀', '공공영업팀'];
const salesReps = ['김하늘', '박민준', '이서연', '최도윤', '정유진', '한지민', '윤서준', '송지아', '임도현', '강유나'];
const categories = ['노트북', '모니터', '네트워크', '스토리지', '소프트웨어', '주변기기', '협업도구', '보안'];
const products = [
  'AX 워크스테이션',
  'UltraView 모니터',
  'EdgeLink 라우터',
  'Vault NAS',
  'Workspace Pro',
  'Smart Dock',
  'Meeting Hub',
  'SecureKey',
  'Cloud Backup',
  'Analytics Seat',
  'WiFi 7 Access Point',
  'Ergo Keyboard',
];
const paymentMethods = ['신용카드', '계좌이체', '가상계좌', '후불결제', '법인카드'];
const paymentStatuses = ['결제 완료', '입금 대기', '부분 결제', '환불 완료'];
const orderStatuses = ['주문 접수', '상품 준비', '출고 완료', '배송 중', '배송 완료', '주문 취소'];
const fulfillmentCenters = ['김포 FC', '용인 FC', '이천 FC', '대구 FC', '부산 FC'];
const shippingMethods = ['일반 택배', '당일 배송', '새벽 배송', '화물 배송', '방문 수령'];
const riskLevels = ['낮음', '관찰', '주의', '높음'];
function formatDateTime(timestamp: number) {
  return new Date(timestamp).toISOString().replace('T', ' ').slice(0, 16);
}

const list = Array.from({ length: ROW_COUNT }, (_, index) => {
  const sequence = index + 1;
  const quantity = ((index * 7) % 48) + 1;
  const unitPrice = 39000 + ((index * 7919) % 72) * 12500;
  const grossAmount = quantity * unitPrice;
  const discountRate = [0, 3, 5, 7, 10, 15, 20][index % 7];
  const orderedTimestamp = ORDER_START_AT + (index % 234) * DAY_MS + (index % 12) * 60 * 60 * 1000;
  const promisedTimestamp = orderedTimestamp + ((index % 6) + 1) * DAY_MS;

  return {
    values: {
      orderNo: `ORD-2026-${String(sequence).padStart(6, '0')}`,
      orderedAt: formatDateTime(orderedTimestamp),
      customerName: `${companyNames[index % companyNames.length]} ${regions[(index * 3) % regions.length]} ${
        (index % 37) + 1
      }호점`,
      customerTier: customerTiers[(index * 5) % customerTiers.length],
      salesChannel: salesChannels[(index * 7) % salesChannels.length],
      region: regions[(index * 3) % regions.length],
      salesTeam: salesTeams[(index * 11) % salesTeams.length],
      salesRep: salesReps[(index * 13) % salesReps.length],
      category: categories[(index * 5) % categories.length],
      productName: `${products[index % products.length]} ${2024 + (index % 3)} ${['Basic', 'Plus', 'Pro'][index % 3]}`,
      sku: `SKU-${String((index * 17) % 18000).padStart(5, '0')}`,
      quantity,
      unitPrice,
      grossAmount,
      discountRate,
      netAmount: Math.round(grossAmount * (1 - discountRate / 100)),
      paymentMethod: paymentMethods[(index * 17) % paymentMethods.length],
      paymentStatus: paymentStatuses[(index * 19) % paymentStatuses.length],
      orderStatus: orderStatuses[(index * 23) % orderStatuses.length],
      fulfillmentCenter: fulfillmentCenters[(index * 29) % fulfillmentCenters.length],
      shippingMethod: shippingMethods[(index * 31) % shippingMethods.length],
      promisedAt: formatDateTime(promisedTimestamp),
      riskLevel: riskLevels[Math.min(Math.floor(((index * 37) % 100) / 25), riskLevels.length - 1)],
      marginRate: 12 + ((index * 41) % 31),
    },
  };
});

const columns: BGridColumn<IOrderItem>[] = [
    {
      id: 'orderNo',
      key: 'orderNo',
      label: '주문 번호',
      width: 150,
      toolbox: true,
      filter: { type: 'text', caseSensitive: true },
    },
    {
      id: 'orderedAt',
      key: 'orderedAt',
      label: '주문 일시',
      width: 145,
      toolbox: true,
      filter: { type: 'text', caseSensitive: true },
    },
    { id: 'customerName', key: 'customerName', label: '고객사', width: 210, toolbox: true, filter: { type: 'text' } },
    {
      id: 'customerTier',
      key: 'customerTier',
      label: '고객 등급',
      width: 100,
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'salesChannel',
      key: 'salesChannel',
      label: '판매 채널',
      width: 110,
      toolbox: true,
      filter: { type: 'values' },
    },
    { id: 'region', key: 'region', label: '권역', width: 80, toolbox: true, filter: { type: 'values' } },
    { id: 'salesTeam', key: 'salesTeam', label: '영업 조직', width: 135, toolbox: true, filter: { type: 'values' } },
    { id: 'salesRep', key: 'salesRep', label: '담당자', width: 90, toolbox: true, filter: { type: 'values' } },
    { id: 'category', key: 'category', label: '상품 분류', width: 105, toolbox: true, filter: { type: 'values' } },
    { id: 'productName', key: 'productName', label: '상품명', width: 225, toolbox: true, filter: { type: 'text' } },
    {
      id: 'sku',
      key: 'sku',
      label: 'SKU',
      width: 115,
      toolbox: true,
      filter: { type: 'text', caseSensitive: true },
    },
    {
      id: 'quantity',
      key: 'quantity',
      label: '수량',
      width: 75,
      align: 'right',
      toolbox: true,
      filter: { type: 'number' },
    },
    {
      id: 'unitPrice',
      key: 'unitPrice',
      label: '단가',
      width: 115,
      align: 'right',
      toolbox: true,
      filter: { type: 'number' },
      itemRender: ({ value }) => `${formatNumber(value)}원`,
    },
    {
      id: 'grossAmount',
      key: 'grossAmount',
      label: '주문 금액',
      width: 135,
      align: 'right',
      toolbox: true,
      filter: { type: 'number' },
      itemRender: ({ value }) => `${formatNumber(value)}원`,
    },
    {
      id: 'discountRate',
      key: 'discountRate',
      label: '할인율',
      width: 85,
      align: 'right',
      toolbox: true,
      filter: { type: 'number' },
      itemRender: ({ value }) => `${value}%`,
    },
    {
      id: 'netAmount',
      key: 'netAmount',
      label: '결제 금액',
      width: 135,
      align: 'right',
      toolbox: true,
      filter: { type: 'number' },
      itemRender: ({ value }) => `${formatNumber(value)}원`,
    },
    {
      id: 'paymentMethod',
      key: 'paymentMethod',
      label: '결제 수단',
      width: 110,
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'paymentStatus',
      key: 'paymentStatus',
      label: '결제 상태',
      width: 110,
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'orderStatus',
      key: 'orderStatus',
      label: '주문 상태',
      width: 110,
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'fulfillmentCenter',
      key: 'fulfillmentCenter',
      label: '출고 센터',
      width: 105,
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'shippingMethod',
      key: 'shippingMethod',
      label: '배송 방식',
      width: 110,
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'promisedAt',
      key: 'promisedAt',
      label: '출고 예정일',
      width: 145,
      toolbox: true,
      filter: { type: 'text', caseSensitive: true },
    },
    { id: 'riskLevel', key: 'riskLevel', label: '거래 위험도', width: 105, toolbox: true, filter: { type: 'values' } },
    {
      id: 'marginRate',
      key: 'marginRate',
      label: '매출 총이익률',
      width: 120,
      align: 'right',
      toolbox: true,
      filter: { type: 'number' },
      itemRender: ({ value }) => `${value}%`,
    },
];

const virtualScrollColumns = columns.map(column => ({
  ...column,
  toolbox: false as const,
  filter: false as const,
}));

function ScrollExample() {
  const [notificationApi, contextHolder] = notification.useNotification();

  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width: containerWidth, height: containerHeight } = useContainerSize(containerRef);
  const handleCopyError = React.useCallback(
    (error: BGridCellSelectionCopyError) => {
      const description =
        error.reason === 'maxClipboardCells'
          ? `선택된 셀이 ${formatNumber(error.actual)}개입니다. 최대 ${formatNumber(
              error.limit,
            )}개까지만 복사할 수 있습니다.`
          : error.reason === 'maxClipboardTextLength'
          ? `복사할 텍스트가 ${formatNumber(error.actual)}자입니다. 최대 ${formatNumber(
              error.limit,
            )}자까지만 복사할 수 있습니다.`
          : '브라우저가 클립보드 복사를 거부했습니다.';

      notificationApi.warning({
        message: '복사할 수 없습니다',
        description,
        placement: 'topRight',
      });
    },
    [notificationApi],
  );

  return (
    <DataGridContainer ref={containerRef}>
      {contextHolder}
      <BGrid<IOrderItem>
        width={containerWidth}
        height={containerHeight}
        data={list}
        columns={virtualScrollColumns}
        rowKey='orderNo'
        showLineNumber
        cellSelectionOptions={{
          onCopyError: handleCopyError,
        }}
        rowChecked={{
          checkedIndexes: [],
          onChange: (ids, selectedAll) => {
            console.log('onChange rowSelection', ids, selectedAll);
          },
        }}
        onClick={item => console.log(item)}
        status={{
          content: ({ visibleItems }) => `현재 ${formatNumber(visibleItems)}건 / 전체 ${formatNumber(ROW_COUNT)}건`,
        }}
        pagination={{ visible: false }}
      />
    </DataGridContainer>
  );
}

function formatNumber(value?: number) {
  return value === undefined ? '-' : value.toLocaleString();
}

export default ScrollExample;
