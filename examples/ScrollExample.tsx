import { t } from './i18n';
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

const ROW_COUNT = 1000000;
const DAY_MS = 24 * 60 * 60 * 1000;
const ORDER_START_AT = Date.UTC(2026, 0, 1, 9);
const companyNames = [
  t('한빛리테일', 'Hanbit Retail'),
  t('서울커머스', 'Seoul Commerce'),
  t('오로라테크', 'Aurora Tech'),
  t('브릿지웍스', 'Bridge Works'),
  t('그린마켓', 'Green Market'),
  t('넥스트랩', 'Next Lab'),
  t('모노오피스', 'Mono Office'),
  t('클라우드나인', 'Cloud Nine'),
  t('페이퍼앤코', 'Paper & Co'),
  t('어반스토어', 'Urban Store'),
  t('블루하버', 'Blue Harbor'),
  t('트리니티솔루션', 'Trinity Solution'),
];
const customerTiers = [t('일반', 'General'), t('실버', 'Silver'), t('골드', 'Gold'), 'VIP'];
const salesChannels = [t('직영몰', 'Direct Mall'), t('오픈마켓', 'Open Market'), t('파트너', 'Partner'), t('오프라인', 'Offline'), 'B2B'];
const regions = [t('서울', 'Seoul'), t('경기', 'Gyeonggi'), t('인천', 'Incheon'), t('부산', 'Busan'), t('대전', 'Daejeon'), t('광주', 'Gwangju'), t('대구', 'Daegu'), t('제주', 'Jeju')];
const salesTeams = [t('엔터프라이즈 1팀', 'Enterprise Team 1'), t('엔터프라이즈 2팀', 'Enterprise Team 2'), t('커머스팀', 'Commerce Team'), t('파트너팀', 'Partner Team'), t('공공영업팀', 'Public Sales Team')];
const salesReps = [t('김하늘', 'Haneul Kim'), t('박민준', 'Minjun Park'), t('이서연', 'Seoyeon Lee'), t('최도윤', 'Doyun Choi'), t('정유진', 'Yujin Jeong'), t('한지민', 'Jimin Han'), t('윤서준', 'Seojun Yoon'), t('송지아', 'Jia Song'), t('임도현', 'Dohyun Lim'), t('강유나', 'Yuna Kang')];
const categories = [t('노트북', 'Laptop'), t('모니터', 'Monitor'), t('네트워크', 'Network'), t('스토리지', 'Storage'), t('소프트웨어', 'Software'), t('주변기기', 'Peripherals'), t('협업도구', 'Collaboration Tool'), t('보안', 'Security')];
const products = [
  t('AX 워크스테이션', 'AX Workstation'),
  t('UltraView 모니터', 'UltraView Monitor'),
  t('EdgeLink 라우터', 'EdgeLink Router'),
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
const paymentMethods = [t('신용카드', 'Credit Card'), t('계좌이체', 'Account Transfer'), t('가상계좌', 'Virtual Account'), t('후불결제', 'Postpaid Payment'), t('법인카드', 'Corporate Card')];
const paymentStatuses = [t('결제 완료', 'Payment Completed'), t('입금 대기', 'Waiting for Deposit'), t('부분 결제', 'Partial Payment'), t('환불 완료', 'Refund Completed')];
const orderStatuses = [t('주문 접수', 'Order Receipt'), t('상품 준비', 'Product Preparation'), t('출고 완료', 'Dispatch Completed'), t('배송 중', 'In Transit'), t('배송 완료', 'Delivery Completed'), t('주문 취소', 'Order Cancelled')];
const fulfillmentCenters = [t('김포 FC', 'Gimpo FC'), t('용인 FC', 'Yongin FC'), t('이천 FC', 'Icheon FC'), t('대구 FC', 'Daegu FC'), t('부산 FC', 'Busan FC')];
const shippingMethods = [t('일반 택배', 'General Courier'), t('당일 배송', 'Same-day Delivery'), t('새벽 배송', 'Dawn Delivery'), t('화물 배송', 'Freight Delivery'), t('방문 수령', 'Pick Up in Store')];
const riskLevels = [t('낮음', 'Low'), t('관찰', 'Observation'), t('주의', 'Caution'), t('높음', 'High')];
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
      customerName: t(`${companyNames[index % companyNames.length]} ${regions[(index * 3) % regions.length]} ${
        (index % 37) + 1
      }호점`, `Branch ${index + 1}`),
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
      label: t('주문 번호', 'Order Number'),
      width: 150,
      toolbox: true,
      filter: { type: 'text', caseSensitive: true },
    },
    {
      id: 'orderedAt',
      key: 'orderedAt',
      label: t('주문 일시', 'Order Date and Time'),
      width: 145,
      toolbox: true,
      filter: { type: 'text', caseSensitive: true },
    },
    { id: 'customerName', key: 'customerName', label: t('고객사', 'Client'), width: 210, toolbox: true, filter: { type: 'text' } },
    {
      id: 'customerTier',
      key: 'customerTier',
      label: t('고객 등급', 'Customer Level'),
      width: 100,
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'salesChannel',
      key: 'salesChannel',
      label: t('판매 채널', 'Sales Channel'),
      width: 110,
      toolbox: true,
      filter: { type: 'values' },
    },
    { id: 'region', key: 'region', label: t('권역', 'Region'), width: 80, toolbox: true, filter: { type: 'values' } },
    { id: 'salesTeam', key: 'salesTeam', label: t('영업 조직', 'Sales Organization'), width: 135, toolbox: true, filter: { type: 'values' } },
    { id: 'salesRep', key: 'salesRep', label: t('담당자', 'Assignee'), width: 90, toolbox: true, filter: { type: 'values' } },
    { id: 'category', key: 'category', label: t('상품 분류', 'Product Category'), width: 105, toolbox: true, filter: { type: 'values' } },
    { id: 'productName', key: 'productName', label: t('상품명', 'Product Name'), width: 225, toolbox: true, filter: { type: 'text' } },
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
      label: t('수량', 'Quantity'),
      width: 75,
      align: 'right',
      toolbox: true,
      filter: { type: 'number' },
    },
    {
      id: 'unitPrice',
      key: 'unitPrice',
      label: t('단가', 'Unit Price'),
      width: 115,
      align: 'right',
      toolbox: true,
      filter: { type: 'number' },
      itemRender: ({ value }) => t(`${formatNumber(value)}원`, `${formatNumber(value)} KRW`),
    },
    {
      id: 'grossAmount',
      key: 'grossAmount',
      label: t('주문 금액', 'Order Amount'),
      width: 135,
      align: 'right',
      toolbox: true,
      filter: { type: 'number' },
      itemRender: ({ value }) => t(`${formatNumber(value)}원`, `${formatNumber(value)} KRW`),
    },
    {
      id: 'discountRate',
      key: 'discountRate',
      label: t('할인율', 'Discount Rate'),
      width: 85,
      align: 'right',
      toolbox: true,
      filter: { type: 'number' },
      itemRender: ({ value }) => `${value}%`,
    },
    {
      id: 'netAmount',
      key: 'netAmount',
      label: t('결제 금액', 'Payment Amount'),
      width: 135,
      align: 'right',
      toolbox: true,
      filter: { type: 'number' },
      itemRender: ({ value }) => t(`${formatNumber(value)}원`, `${formatNumber(value)} KRW`),
    },
    {
      id: 'paymentMethod',
      key: 'paymentMethod',
      label: t('결제 수단', 'Payment Method'),
      width: 110,
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'paymentStatus',
      key: 'paymentStatus',
      label: t('결제 상태', 'Payment Status'),
      width: 110,
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'orderStatus',
      key: 'orderStatus',
      label: t('주문 상태', 'Order Status'),
      width: 110,
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'fulfillmentCenter',
      key: 'fulfillmentCenter',
      label: t('출고 센터', 'Dispatch Center'),
      width: 105,
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'shippingMethod',
      key: 'shippingMethod',
      label: t('배송 방식', 'Delivery Method'),
      width: 110,
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'promisedAt',
      key: 'promisedAt',
      label: t('출고 예정일', 'Expected Dispatch Date'),
      width: 145,
      toolbox: true,
      filter: { type: 'text', caseSensitive: true },
    },
    { id: 'riskLevel', key: 'riskLevel', label: t('거래 위험도', 'Transaction Risk Level'), width: 105, toolbox: true, filter: { type: 'values' } },
    {
      id: 'marginRate',
      key: 'marginRate',
      label: t('매출 총이익률', 'Gross Margin'),
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
          ? `${t('선택된 셀이', 'Selected cells are')} ${formatNumber(error.actual)}${t('개입니다. 최대', 'ea. Up to')} ${formatNumber(error.limit)}${t('개까지만 복사할 수 있습니다.', 'ea can be copied.')}`
          : error.reason === 'maxClipboardTextLength'
          ? `${t('복사할 텍스트가', 'Text to copy is')} ${formatNumber(error.actual)}${t('자입니다. 최대', 'characters long. Up to')} ${formatNumber(error.limit)}${t('자까지만 복사할 수 있습니다.', 'characters can be copied.')}`
          : t('브라우저가 클립보드 복사를 거부했습니다.', 'The browser denied copying to the clipboard.');

      notificationApi.warning({
        message: t('복사할 수 없습니다', 'Cannot copy'),
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
          content: ({ visibleItems }) => `${t('현재', 'Current')} ${formatNumber(visibleItems)}${t('건 / 전체', 'cases / Total')} ${formatNumber(ROW_COUNT)}${t('건', 'cases')}`,
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
