import { t } from './i18n';
import * as React from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import { createShadcnSelectEditorPlugin } from './editor-plugins/createShadcnSelectEditorPlugin';
import { createShadcnDatePickerEditorPlugin } from './editor-plugins/createShadcnDatePickerEditorPlugin';
import { createShadcnColorPickerEditorPlugin } from './editor-plugins/createShadcnColorPickerEditorPlugin';
import { createShadcnCascaderEditorPlugin } from './editor-plugins/createShadcnCascaderEditorPlugin';
import { createShadcnTimePickerEditorPlugin } from './editor-plugins/createShadcnTimePickerEditorPlugin';
import { createShadcnTreeSelectEditorPlugin } from './editor-plugins/createShadcnTreeSelectEditorPlugin';
import { formatCascaderClipboardText, parseCascaderClipboardText } from './editor-plugins/cascaderValue';
import { CalendarIcon, ChevronDownIcon, ClockIcon } from './editing/editorIcons';
import {
  applyEditingDataChange,
  cloneEditingOrders,
  type EditingOrder,
  withEditingCellClasses,
} from './editing/shared';
import './editor-plugins/shadcnEditorPlugins.css';

type ExternalShadcnOrder = EditingOrder & {
  labelColor: string;
  categoryPath: string[];
  deliveryTime: string;
  organization: string;
};

const shadcnStatusEditor = createShadcnSelectEditorPlugin<ExternalShadcnOrder, EditingOrder['status']>({
  id: 'external-shadcn-status',
  ariaLabel: t('Shadcn UI 주문 상태 선택', 'Shadcn UI Select Order Status'),
  options: [
    { value: t('접수', 'Receipt'), label: t('접수', 'Receipt') },
    { value: t('진행', 'In Progress'), label: t('진행', 'In Progress') },
    { value: t('완료', 'Completed'), label: t('완료', 'Completed') },
  ],
});

const shadcnDeliveryDateEditor = createShadcnDatePickerEditorPlugin<ExternalShadcnOrder>({
  id: 'external-shadcn-delivery-date',
  ariaLabel: t('Shadcn UI 납기일 선택', 'Shadcn UI Select Delivery Date'),
});

const shadcnLabelColorEditor = createShadcnColorPickerEditorPlugin<ExternalShadcnOrder>({
  id: 'external-shadcn-label-color',
  ariaLabel: t('Shadcn UI 라벨 색상 선택', 'Shadcn UI Select Label Color'),
});

const shadcnCategoryEditor = createShadcnCascaderEditorPlugin<ExternalShadcnOrder>({
  id: 'external-shadcn-category',
  ariaLabel: t('Shadcn UI 분류 경로 선택', 'Shadcn UI Select Category Path'),
  options: [
    {
      value: t('국내', 'Domestic'),
      label: t('국내', 'Domestic'),
      children: [
        { value: t('서울', 'Seoul'), label: t('서울', 'Seoul') },
        { value: t('부산', 'Busan'), label: t('부산', 'Busan') },
        { value: t('제주', 'Jeju'), label: t('제주', 'Jeju') },
      ],
    },
    {
      value: t('해외', 'Overseas'),
      label: t('해외', 'Overseas'),
      children: [
        { value: t('아시아', 'Asia'), label: t('아시아', 'Asia') },
        { value: t('유럽', 'Europe'), label: t('유럽', 'Europe') },
        { value: t('북미', 'North America'), label: t('북미', 'North America') },
      ],
    },
  ],
});

const shadcnDeliveryTimeEditor = createShadcnTimePickerEditorPlugin<ExternalShadcnOrder>({
  id: 'external-shadcn-delivery-time',
  ariaLabel: t('Shadcn UI 배송 시간 선택', 'Shadcn UI Select Delivery Time'),
});

const shadcnOrganizationEditor = createShadcnTreeSelectEditorPlugin<ExternalShadcnOrder>({
  id: 'external-shadcn-organization',
  ariaLabel: t('Shadcn UI 담당 조직 선택', 'Shadcn UI Select Responsible Organization'),
  treeData: [
    {
      title: t('영업본부', 'Sales Headquarters'),
      children: [
        { title: t('서울 영업팀', 'Seoul Sales Team'), value: t('서울 영업팀', 'Seoul Sales Team') },
        { title: t('부산 영업팀', 'Busan Sales Team'), value: t('부산 영업팀', 'Busan Sales Team') },
      ],
    },
    {
      title: t('운영본부', 'Operations Headquarters'),
      children: [
        { title: t('물류팀', 'Logistics Team'), value: t('물류팀', 'Logistics Team') },
        { title: t('고객지원팀', 'Customer Support Team'), value: t('고객지원팀', 'Customer Support Team') },
      ],
    },
  ],
});

const initialColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
const initialCategoryPaths = [
  [t('국내', 'Domestic'), t('서울', 'Seoul')],
  [t('국내', 'Domestic'), t('부산', 'Busan')],
  [t('해외', 'Overseas'), t('아시아', 'Asia')],
  [t('해외', 'Overseas'), t('유럽', 'Europe')],
];
const initialDeliveryTimes = ['09:30', '11:00', '14:30', '16:00'];
const initialOrganizations = [t('서울 영업팀', 'Seoul Sales Team'), t('부산 영업팀', 'Busan Sales Team'), t('물류팀', 'Logistics Team'), t('고객지원팀', 'Customer Support Team')];

const cloneExternalShadcnOrders = (): BGridDataItem<ExternalShadcnOrder>[] =>
  cloneEditingOrders().map((item, index) => ({
    ...item,
    values: {
      ...item.values,
      labelColor: initialColors[index % initialColors.length],
      categoryPath: initialCategoryPaths[index % initialCategoryPaths.length],
      deliveryTime: initialDeliveryTimes[index % initialDeliveryTimes.length],
      organization: initialOrganizations[index % initialOrganizations.length],
    },
  }));

export default function ExternalShadcnEditorPluginExample() {
  const [data, setData] = React.useState(cloneExternalShadcnOrders);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  const columns = React.useMemo<BGridColumn<ExternalShadcnOrder>[]>(
    () => withEditingCellClasses<ExternalShadcnOrder>([
      { key: 'orderCode', label: t('주문 코드', 'Order Code'), width: 140, editable: false },
      { key: 'customerName', label: t('고객명', 'Customer Name'), width: 160, editable: false },
      {
        key: 'status',
        label: 'Shadcn UI Select',
        width: 180,
        editable: true,
        editor: shadcnStatusEditor,
        editorIcon: { render: <ChevronDownIcon />, ariaLabel: t('Shadcn UI 상태 선택', 'Shadcn UI Select Status') },
      },
      {
        key: 'deliveryDate',
        label: 'Shadcn UI DatePicker',
        width: 200,
        editable: true,
        editor: shadcnDeliveryDateEditor,
        editorIcon: { render: <CalendarIcon />, ariaLabel: t('Shadcn UI 납기일 선택', 'Shadcn UI Select Delivery Date') },
      },
      {
        key: 'labelColor',
        label: 'Shadcn UI ColorPicker',
        width: 210,
        editable: true,
        editor: shadcnLabelColorEditor,
        itemRender: ({ value }) => <>{String(value ?? '')}</>,
        editorIcon: {
          render: ({ value }) => (
            <span
              className='bgrid-color-swatch'
              style={{ backgroundColor: typeof value === 'string' ? value : 'transparent' }}
              aria-hidden='true'
            />
          ),
          ariaLabel: t('Shadcn UI 라벨 색상 선택', 'Shadcn UI Select Label Color'),
        },
      },
      {
        key: 'categoryPath',
        label: 'Shadcn UI Cascader',
        width: 200,
        editable: true,
        editor: shadcnCategoryEditor,
        itemRender: ({ value }) => <>{Array.isArray(value) ? value.join(' / ') : ''}</>,
        getClipboardText: ({ value }) => formatCascaderClipboardText(value),
        parseClipboardText: parseCascaderClipboardText,
        editorIcon: { render: <ChevronDownIcon />, ariaLabel: t('Shadcn UI 분류 경로 선택', 'Shadcn UI Select Category Path') },
      },
      {
        key: 'deliveryTime',
        label: 'Shadcn UI TimePicker',
        width: 190,
        editable: true,
        editor: shadcnDeliveryTimeEditor,
        editorIcon: { render: <ClockIcon />, ariaLabel: t('Shadcn UI 배송 시간 선택', 'Shadcn UI Select Delivery Time') },
      },
      {
        key: 'organization',
        label: 'Shadcn UI TreeSelect',
        width: 210,
        editable: true,
        editor: shadcnOrganizationEditor,
        editorIcon: { render: <ChevronDownIcon />, ariaLabel: t('Shadcn UI 담당 조직 선택', 'Shadcn UI Select Responsible Organization') },
      },
    ]),
    [],
  );

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <p className='m-0 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'>
        {t('Shadcn UI (Radix UI) 기반의 Select, DatePicker, ColorPicker, Cascader, TimePicker, TreeSelect 컴포넌트를', 'Shadcn UI (Radix UI) based Select, DatePicker, ColorPicker, Cascader, TimePicker, TreeSelect components connected via')}{' '}
        <code className="dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">defineEditorPlugin()</code>{t('으로 연결했습니다. 각 컴포넌트의 Portal 컨테이너로', '. By passing')} <code className="dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">getPortalContainer()</code>{t('를 전달하여 Grid의 가상 스크롤, 위치 계산, 바깥 클릭 판정 및 라이프사이클과 완벽히 동기화됩니다.', ' as the Portal container for each component, it perfectly synchronizes with the Grid\'s virtual scrolling, position calculation, outside click detection, and lifecycle.')}
      </p>
      <DataGridContainer ref={containerRef} style={{ height: 340 }}>
        <BGrid<ExternalShadcnOrder>
          width={width}
          height={height}
          data={data}
          columns={columns}
          rowKey='id'
          editable
          variant='vertical-bordered'
          onChangeData={(sourceIndex, _columnIndex, values, _column, meta) => {
            setData(current => applyEditingDataChange(current, sourceIndex, values, meta));
          }}
        />
      </DataGridContainer>
    </div>
  );
}
