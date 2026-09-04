import * as React from 'react';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { BGrid } from 'beautiful-grid';
import type { BGridColumn, BGridDataControl, BGridDataItem, BGridDataQuery } from 'beautiful-grid';
import { createAntdCascaderEditorPlugin } from '../../../../examples/editor-plugins/createAntdCascaderEditorPlugin';
import { createAntdDatePickerEditorPlugin } from '../../../../examples/editor-plugins/createAntdDatePickerEditorPlugin';
import { createAntdSelectEditorPlugin } from '../../../../examples/editor-plugins/createAntdSelectEditorPlugin';
import { formatCascaderClipboardText, parseCascaderClipboardText } from '../../../../examples/editor-plugins/cascaderValue';
import { CalendarIcon, ChevronDownIcon } from '../../../../examples/editing/editorIcons';
import 'beautiful-grid/style.css';
import '../../styles/datagrid-theme.css';
import './HomeHeroGrid.css';
import type { Locale } from '../../i18n';
import { useSiteDarkTheme } from '../useSiteDarkTheme';

interface OrderRow {
  orderNo: string;
  customer: string;
  companySize: string;
  industry: string;
  product: string;
  status: 'Ready' | 'Shipping' | 'Complete';
  quantity: number;
  amount: number;
  salesRep: string;
  contactNumber: string;
  email: string;
  region: string[];
  deliveryDate: string;
  priority: 'High' | 'Normal' | 'Low';
  channel: string;
  paymentStatus: string;
  updatedAt: string;
}


const companySizes = ['대기업', '중견기업', '중소기업', '스타트업'];
const industries = ['IT/통신', '금융', '제조', '유통', '서비스'];
const englishCompanySizes = ['Enterprise', 'Mid-market', 'SMB', 'Startup'];
const englishIndustries = ['IT/Telecom', 'Finance', 'Manufacturing', 'Retail', 'Service'];

const customers = [
  'AxisJ Studio',
  'Northwind',
  'Paperworks',
  'Seoul Labs',
  'Mono Office',
  'Orbit Works',
  'Forest Team',
  'Foundry Inc.',
  'Blue Harbor',
  'April Studio',
  'Field Notes',
  'Nexus Retail',
];
const products = ['Workspace Pro', 'Analytics Seat', 'Design System', 'Automation Pack'];
const statuses: OrderRow['status'][] = ['Complete', 'Shipping', 'Ready'];
const salesReps = ['김하늘', '박민준', '이서연', '최도윤', '정유진', '한지민'];
const regions = [
  ['수도권', '서울'],
  ['수도권', '경기'],
  ['수도권', '인천'],
  ['지방', '부산'],
  ['지방', '대전'],
  ['지방', '광주'],
];
const priorities: OrderRow['priority'][] = ['High', 'Normal', 'Low'];
const channels = ['직접 영업', '파트너', '온라인', '리퍼럴'];
const paymentStatuses = ['결제 완료', '청구 예정', '입금 확인'];

const statusEditor = createAntdSelectEditorPlugin<OrderRow, OrderRow['status']>({
  id: 'home-status',
  ariaLabel: '상태 편집',
  options: [
    { value: 'Ready', label: '준비' },
    { value: 'Shipping', label: '배송 중' },
    { value: 'Complete', label: '완료' },
  ],
});

const cascaderRegions = [
  { value: '수도권', label: '수도권', children: [{ value: '서울', label: '서울' }, { value: '경기', label: '경기' }, { value: '인천', label: '인천' }] },
  { value: '지방', label: '지방', children: [{ value: '부산', label: '부산' }, { value: '대전', label: '대전' }, { value: '광주', label: '광주' }] },
];
const regionEditor = createAntdCascaderEditorPlugin<OrderRow>({
  id: 'home-region',
  ariaLabel: '권역 편집',
  options: cascaderRegions,
});

const deliveryDateEditor = createAntdDatePickerEditorPlugin<OrderRow>({
  id: 'home-delivery-date',
  ariaLabel: '납기일 편집',
  min: '2026-01-01',
  max: '2027-12-31',
});

const priorityEditor = createAntdSelectEditorPlugin<OrderRow, OrderRow['priority']>({
  id: 'home-priority',
  ariaLabel: '우선순위 편집',
  options: priorities.map(value => ({ value, label: value })),
});

const channelEditor = createAntdSelectEditorPlugin<OrderRow, OrderRow['channel']>({
  id: 'home-channel',
  ariaLabel: '채널 편집',
  options: channels.map(value => ({ value, label: value })),
});

const paymentStatusEditor = createAntdSelectEditorPlugin<OrderRow, OrderRow['paymentStatus']>({
  id: 'home-payment-status',
  ariaLabel: '결제 상태 편집',
  options: paymentStatuses.map(value => ({ value, label: value })),
});

const englishRegions = [
  ['Metro', 'Seoul'],
  ['Metro', 'Gyeonggi'],
  ['Metro', 'Incheon'],
  ['Provincial', 'Busan'],
  ['Provincial', 'Daejeon'],
  ['Provincial', 'Gwangju'],
];
const englishChannels = ['Direct', 'Partner', 'Online', 'Referral'];
const englishPaymentStatuses = ['Paid', 'Invoice scheduled', 'Payment confirmed'];
const englishStatusEditor = createAntdSelectEditorPlugin<OrderRow, OrderRow['status']>({
  id: 'home-status-en',
  ariaLabel: 'Edit status',
  options: [
    { value: 'Ready', label: 'Ready' },
    { value: 'Shipping', label: 'Shipping' },
    { value: 'Complete', label: 'Complete' },
  ],
});
const englishCascaderRegions = [
  { value: 'Metro', label: 'Metro', children: [{ value: 'Seoul', label: 'Seoul' }, { value: 'Gyeonggi', label: 'Gyeonggi' }, { value: 'Incheon', label: 'Incheon' }] },
  { value: 'Provincial', label: 'Provincial', children: [{ value: 'Busan', label: 'Busan' }, { value: 'Daejeon', label: 'Daejeon' }, { value: 'Gwangju', label: 'Gwangju' }] },
];
const englishRegionEditor = createAntdCascaderEditorPlugin<OrderRow>({
  id: 'home-region-en',
  ariaLabel: 'Edit region',
  options: englishCascaderRegions,
});
const englishPriorityEditor = createAntdSelectEditorPlugin<OrderRow, OrderRow['priority']>({
  id: 'home-priority-en', ariaLabel: 'Edit priority', options: priorities.map(value => ({ value, label: value })),
});
const englishChannelEditor = createAntdSelectEditorPlugin<OrderRow, OrderRow['channel']>({
  id: 'home-channel-en', ariaLabel: 'Edit channel', options: englishChannels.map(value => ({ value, label: value })),
});
const englishPaymentStatusEditor = createAntdSelectEditorPlugin<OrderRow, OrderRow['paymentStatus']>({
  id: 'home-payment-status-en', ariaLabel: 'Edit payment status', options: englishPaymentStatuses.map(value => ({ value, label: value })),
});

const columns: BGridColumn<OrderRow>[] = (
  [
    {
      id: 'orderNo',
      key: 'orderNo',
      label: '주문 번호',
      width: 104,
      editable: false,
      toolbox: true,
      filter: { type: 'text' },
    },
    {
      id: 'customer',
      key: 'customer',
      label: '고객',
      width: 138,
      editable: true,
      editor: {
        type: 'text',
        ariaLabel: '고객 편집',
        inputProps: { maxLength: 50, autoComplete: 'off' },
      },
      toolbox: true,
      filter: { type: 'text' },
    },
    {
      id: 'companySize',
      key: 'companySize',
      label: '기업 규모',
      width: 100,
      editable: false,
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'industry',
      key: 'industry',
      label: '산업군',
      width: 100,
      editable: false,
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'product',
      key: 'product',
      label: '상품',
      width: 184,
      editable: true,
      editor: {
        type: 'text',
        ariaLabel: '상품 편집',
        inputProps: { maxLength: 50, autoComplete: 'off' },
      },
      toolbox: true,
      filter: { type: 'text' },
    },
    {
      id: 'status',
      key: 'status',
      label: '상태',
      width: 112,
      editable: true,
      editor: statusEditor,
      editorIcon: { render: <ChevronDownIcon />, ariaLabel: '상태 선택', visibility: 'always' },
      toolbox: true,
      filter: { type: 'values' },
      itemRender: ({ value }) => <StatusBadge status={value as OrderRow['status']} />,
    },
    {
      id: 'quantity',
      key: 'quantity',
      label: '수량',
      width: 72,
      align: 'right',
      editable: true,
      toolbox: true,
      filter: { type: 'number' },
      editor: {
        type: 'text',
        ariaLabel: '수량 편집',
        inputProps: { inputMode: 'numeric', autoComplete: 'off' },
        parseValue: text => {
          const quantity = Number(text);
          if (text.trim() === '' || !Number.isInteger(quantity) || quantity < 0) {
            throw new Error('수량은 0 이상의 정수여야 합니다.');
          }
          return quantity;
        },
      },
    },
    {
      id: 'amount',
      key: 'amount',
      label: '금액',
      width: 112,
      align: 'right',
      editable: false,
      toolbox: true,
      filter: { type: 'number' },
      itemRender: ({ value }) => <>{Number(value).toLocaleString()}원</>,
    },
    {
      id: 'salesRep',
      key: 'salesRep',
      label: '담당자',
      width: 124,
      editable: true,
      editor: {
        type: 'text',
        ariaLabel: '담당자 편집',
        inputProps: { maxLength: 30, autoComplete: 'off' },
      },
      toolbox: true,
      filter: { type: 'text' },
    },
    {
      id: 'contactNumber',
      key: 'contactNumber',
      label: '연락처',
      width: 130,
      editable: false,
      toolbox: true,
      filter: { type: 'text' },
    },
    {
      id: 'email',
      key: 'email',
      label: '이메일',
      width: 180,
      editable: false,
      toolbox: true,
      filter: { type: 'text' },
    },
    {
      id: 'region',
      key: 'region',
      label: '권역',
      width: 130,
      editable: true,
      editor: regionEditor,
      editorIcon: { render: <ChevronDownIcon />, ariaLabel: '권역 선택', visibility: 'always' },
      toolbox: true,
      filter: { type: 'values' },
      itemRender: ({ value }) => (value as string[]).join(' / '),
      getClipboardText: ({ value }) => formatCascaderClipboardText(value),
      parseClipboardText: parseCascaderClipboardText,
    },
    {
      id: 'deliveryDate',
      key: 'deliveryDate',
      label: '납기일',
      width: 118,
      editable: true,
      editor: deliveryDateEditor,
      editorIcon: { render: <CalendarIcon />, ariaLabel: '납기일 선택', visibility: 'always' },
      toolbox: true,
      filter: { type: 'text' },
    },
    {
      id: 'priority',
      key: 'priority',
      label: '우선순위',
      width: 100,
      editable: true,
      editor: priorityEditor,
      editorIcon: { render: <ChevronDownIcon />, ariaLabel: '우선순위 선택', visibility: 'always' },
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'channel',
      key: 'channel',
      label: '채널',
      width: 116,
      editable: true,
      editor: channelEditor,
      editorIcon: { render: <ChevronDownIcon />, ariaLabel: '채널 선택', visibility: 'always' },
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'paymentStatus',
      key: 'paymentStatus',
      label: '결제 상태',
      width: 116,
      editable: true,
      editor: paymentStatusEditor,
      editorIcon: { render: <ChevronDownIcon />, ariaLabel: '결제 상태 선택', visibility: 'always' },
      toolbox: true,
      filter: { type: 'values' },
    },
    {
      id: 'updatedAt',
      key: 'updatedAt',
      label: '최종 수정',
      width: 148,
      editable: false,
      toolbox: true,
      filter: { type: 'text' },
    },
  ] as BGridColumn<OrderRow>[]
).map(column => ({
  ...column,
  className: column.editable === false ? 'hero-grid-cell-readonly' : 'hero-grid-cell-editable',
}));

const englishColumnLabels: Record<string, string> = {
  orderNo: 'Order no.', customer: 'Customer', companySize: 'Company Size', industry: 'Industry', product: 'Product', status: 'Status', quantity: 'Quantity',
  amount: 'Amount', salesRep: 'Sales rep', contactNumber: 'Contact Number', email: 'Email', region: 'Region', deliveryDate: 'Delivery date', priority: 'Priority',
  channel: 'Channel', paymentStatus: 'Payment status', updatedAt: 'Last updated',
};

const englishColumns: BGridColumn<OrderRow>[] = columns.map(column => {
  const id = String(column.id);
  const localized: BGridColumn<OrderRow> = { ...column, label: englishColumnLabels[id] ?? column.label };
  if (id === 'customer') localized.editor = { type: 'text', ariaLabel: 'Edit customer', inputProps: { maxLength: 50, autoComplete: 'off' } };
  if (id === 'product') localized.editor = { type: 'text', ariaLabel: 'Edit product', inputProps: { maxLength: 50, autoComplete: 'off' } };
  if (id === 'status') {
    localized.editor = englishStatusEditor;
    localized.editorIcon = { render: <ChevronDownIcon />, ariaLabel: 'Select status', visibility: 'always' };
    localized.itemRender = ({ value }) => <StatusBadge status={value as OrderRow['status']} locale='en' />;
  }
  if (id === 'quantity') localized.editor = {
    type: 'text', ariaLabel: 'Edit quantity', inputProps: { inputMode: 'numeric', autoComplete: 'off' },
    parseValue: text => {
      const quantity = Number(text);
      if (text.trim() === '' || !Number.isInteger(quantity) || quantity < 0) throw new Error('Quantity must be a non-negative integer.');
      return quantity;
    },
  };
  if (id === 'amount') localized.itemRender = ({ value }) => `${Number(value).toLocaleString('en-US')} KRW`;
  if (id === 'salesRep') localized.editor = { type: 'text', ariaLabel: 'Edit sales representative', inputProps: { maxLength: 30, autoComplete: 'off' } };
  if (id === 'region') { localized.editor = englishRegionEditor; localized.editorIcon = { render: <ChevronDownIcon />, ariaLabel: 'Select region', visibility: 'always' }; localized.itemRender = ({ value }) => (value as string[]).join(' / '); }
  if (id === 'deliveryDate') localized.editorIcon = { render: <CalendarIcon />, ariaLabel: 'Select delivery date', visibility: 'always' };
  if (id === 'priority') { localized.editor = englishPriorityEditor; localized.editorIcon = { render: <ChevronDownIcon />, ariaLabel: 'Select priority', visibility: 'always' }; }
  if (id === 'channel') { localized.editor = englishChannelEditor; localized.editorIcon = { render: <ChevronDownIcon />, ariaLabel: 'Select channel', visibility: 'always' }; }
  if (id === 'paymentStatus') { localized.editor = englishPaymentStatusEditor; localized.editorIcon = { render: <ChevronDownIcon />, ariaLabel: 'Select payment status', visibility: 'always' }; }
  return localized;
});

const initialData: BGridDataItem<OrderRow>[] = Array.from({ length: 500 }, (_, index) => {
  const cycle = Math.floor(index / 7);
  const remainder = index % 7;
  const groupId = cycle * 2 + (remainder < 3 ? 0 : 1);

  const day = String((index % 28) + 1).padStart(2, '0');
  const month = String((index % 8) + 1).padStart(2, '0');
  const quantity = ((index * 7) % 15) + 1;
  
  const customer = customers[groupId % customers.length];
  const customerDomain = customer.toLowerCase().replace(/[^a-z0-9]/g, '') || 'company';
  const region = regions[groupId % regions.length];

  return {
    values: {
      orderNo: `A-${2401 + index}`,
      customer,
      companySize: companySizes[(groupId + 1) % companySizes.length],
      industry: industries[(groupId + 2) % industries.length],
      product: products[index % products.length],
      status: statuses[index % statuses.length],
      quantity,
      amount: quantity * (98000 + (index % 5) * 49000),
      salesRep: salesReps[groupId % salesReps.length],
      contactNumber: `010-${String(1000 + (groupId % 9000))}-${String(1000 + ((groupId * 3) % 9000))}`,
      email: `contact@${customerDomain}.com`,
      region,
      deliveryDate: `2026-${month}-${day}`,
      priority: priorities[index % priorities.length],
      channel: channels[groupId % channels.length],
      paymentStatus: paymentStatuses[index % paymentStatuses.length],
      updatedAt: `2026-08-${day} ${String(9 + (index % 9)).padStart(2, '0')}:30`,
    },
  };
});

const englishInitialData: BGridDataItem<OrderRow>[] = initialData.map((item) => {
  const regionIndex = regions.indexOf(item.values.region);
  const channelIndex = channels.indexOf(item.values.channel);
  const paymentStatusIndex = paymentStatuses.indexOf(item.values.paymentStatus);
  const salesRepIndex = salesReps.indexOf(item.values.salesRep);
  const companySizeIndex = companySizes.indexOf(item.values.companySize);
  const industryIndex = industries.indexOf(item.values.industry);

  return {
    ...item,
    values: {
      ...item.values,
      salesRep: ['Alex Kim', 'Morgan Park', 'Jamie Lee', 'Taylor Choi', 'Robin Jung', 'Casey Han'][salesRepIndex],
      region: englishRegions[regionIndex],
      channel: englishChannels[channelIndex],
      paymentStatus: englishPaymentStatuses[paymentStatusIndex],
      companySize: englishCompanySizes[companySizeIndex],
      industry: englishIndustries[industryIndex],
    },
  };
});

export default function HomeHeroGrid({ locale = 'ko' }: { locale?: Locale }) {
  const isDark = useSiteDarkTheme();
  const mountStartedAtRef = React.useRef(performance.now());
  const mountReportedRef = React.useRef(false);
  const viewportRef = React.useRef<HTMLDivElement>(null);
  const [size, setSize] = React.useState<{ width: number; height: number }>();
  const [gridData, setGridData] = React.useState(locale === 'en' ? englishInitialData : initialData);
  const [checkedRowKeys, setCheckedRowKeys] = React.useState<React.Key[]>([]);
  const [query, setQuery] = React.useState<BGridDataQuery>({ sortParams: [], filterParams: [] });

  const dataControl = React.useMemo<BGridDataControl>(
    () => ({ mode: 'client', multiSort: true, query, onChange: setQuery }),
    [query],
  );

  React.useLayoutEffect(() => {
    if (!size || mountReportedRef.current) return;

    mountReportedRef.current = true;
    const mountDuration = performance.now() - mountStartedAtRef.current;
    document.documentElement.dataset.bgridHomeGridMountMs = mountDuration.toFixed(1);
    window.dispatchEvent(
      new CustomEvent('bgrid-home-grid-mounted', {
        detail: { duration: mountDuration },
      }),
    );
  }, [size]);

  React.useEffect(() => {
    const element = viewportRef.current;
    if (!element) return;

    const updateSize = () => {
      const width = Math.max(Math.floor(element.clientWidth), 280);
      setSize({
        width,
        height: width < 520 ? 280 : width < 720 ? 340 : width < 1000 ? 420 : 520,
      });
    };

    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <ConfigProvider theme={{ algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm }}>
      <div className='hero-grid-demo'>
        <div className='hero-grid-surface'>
          <div ref={viewportRef} className='hero-grid-viewport site-grid-theme'>
            {size && (
              <BGrid<OrderRow>
              width={size.width}
              height={size.height}
              data={gridData}
              columns={locale === 'en' ? englishColumns : columns}
              itemHeight={15}
              itemPadding={7}
              editable
              editTrigger='dblclick'
              dataControl={dataControl}
              rowChecked={{
                checkedRowKeys,
                onChange: (_checkedIndexes, keys) => setCheckedRowKeys(keys),
              }}
              onChangeData={(index, _columnIndex, values, _column, meta) => {
                setGridData(current =>
                  current.map((item, itemIndex) =>
                    itemIndex === index ? meta?.dataItem ?? { ...item, values } : item,
                  ),
                );
              }}
              cellSelectionOptions={{ enabled: true }}
              cellNavigationOptions={{ enabled: true, editOnEnter: false }}
              variant='vertical-bordered'
              showLineNumber
              rowKey='orderNo'
              status={{
                content: ({ totalItems }) => locale === 'en' ? `${totalItems} rows` : `총 ${totalItems}개 행`,
              }}
              pagination={{ visible: false }}
              scrollbar={{
                variant: 'modern',
              }}
              />
            )}
          </div>
        </div>
      </div>
    </ConfigProvider>
  );
}

function StatusBadge({ status, locale = 'ko' }: { status: OrderRow['status']; locale?: Locale }) {
  const labels: Record<OrderRow['status'], string> = {
    Ready: '준비',
    Shipping: '배송 중',
    Complete: '완료',
  };

  return <span className={`hero-grid-status hero-grid-status-${status.toLowerCase()}`}>{locale === 'en' ? status : labels[status]}</span>;
}
