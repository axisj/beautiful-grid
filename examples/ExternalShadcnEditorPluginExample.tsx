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
  ariaLabel: 'Shadcn UI 주문 상태 선택',
  options: [
    { value: '접수', label: '접수' },
    { value: '진행', label: '진행' },
    { value: '완료', label: '완료' },
  ],
});

const shadcnDeliveryDateEditor = createShadcnDatePickerEditorPlugin<ExternalShadcnOrder>({
  id: 'external-shadcn-delivery-date',
  ariaLabel: 'Shadcn UI 납기일 선택',
});

const shadcnLabelColorEditor = createShadcnColorPickerEditorPlugin<ExternalShadcnOrder>({
  id: 'external-shadcn-label-color',
  ariaLabel: 'Shadcn UI 라벨 색상 선택',
});

const shadcnCategoryEditor = createShadcnCascaderEditorPlugin<ExternalShadcnOrder>({
  id: 'external-shadcn-category',
  ariaLabel: 'Shadcn UI 분류 경로 선택',
  options: [
    {
      value: '국내',
      label: '국내',
      children: [
        { value: '서울', label: '서울' },
        { value: '부산', label: '부산' },
        { value: '제주', label: '제주' },
      ],
    },
    {
      value: '해외',
      label: '해외',
      children: [
        { value: '아시아', label: '아시아' },
        { value: '유럽', label: '유럽' },
        { value: '북미', label: '북미' },
      ],
    },
  ],
});

const shadcnDeliveryTimeEditor = createShadcnTimePickerEditorPlugin<ExternalShadcnOrder>({
  id: 'external-shadcn-delivery-time',
  ariaLabel: 'Shadcn UI 배송 시간 선택',
});

const shadcnOrganizationEditor = createShadcnTreeSelectEditorPlugin<ExternalShadcnOrder>({
  id: 'external-shadcn-organization',
  ariaLabel: 'Shadcn UI 담당 조직 선택',
  treeData: [
    {
      title: '영업본부',
      children: [
        { title: '서울 영업팀', value: '서울 영업팀' },
        { title: '부산 영업팀', value: '부산 영업팀' },
      ],
    },
    {
      title: '운영본부',
      children: [
        { title: '물류팀', value: '물류팀' },
        { title: '고객지원팀', value: '고객지원팀' },
      ],
    },
  ],
});

const initialColors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
const initialCategoryPaths = [
  ['국내', '서울'],
  ['국내', '부산'],
  ['해외', '아시아'],
  ['해외', '유럽'],
];
const initialDeliveryTimes = ['09:30', '11:00', '14:30', '16:00'];
const initialOrganizations = ['서울 영업팀', '부산 영업팀', '물류팀', '고객지원팀'];

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
      { key: 'orderCode', label: '주문 코드', width: 140, editable: false },
      { key: 'customerName', label: '고객명', width: 160, editable: false },
      {
        key: 'status',
        label: 'Shadcn UI Select',
        width: 180,
        editable: true,
        editor: shadcnStatusEditor,
        editorIcon: { render: <ChevronDownIcon />, ariaLabel: 'Shadcn UI 상태 선택' },
      },
      {
        key: 'deliveryDate',
        label: 'Shadcn UI DatePicker',
        width: 200,
        editable: true,
        editor: shadcnDeliveryDateEditor,
        editorIcon: { render: <CalendarIcon />, ariaLabel: 'Shadcn UI 납기일 선택' },
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
          ariaLabel: 'Shadcn UI 라벨 색상 선택',
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
        editorIcon: { render: <ChevronDownIcon />, ariaLabel: 'Shadcn UI 분류 경로 선택' },
      },
      {
        key: 'deliveryTime',
        label: 'Shadcn UI TimePicker',
        width: 190,
        editable: true,
        editor: shadcnDeliveryTimeEditor,
        editorIcon: { render: <ClockIcon />, ariaLabel: 'Shadcn UI 배송 시간 선택' },
      },
      {
        key: 'organization',
        label: 'Shadcn UI TreeSelect',
        width: 210,
        editable: true,
        editor: shadcnOrganizationEditor,
        editorIcon: { render: <ChevronDownIcon />, ariaLabel: 'Shadcn UI 담당 조직 선택' },
      },
    ]),
    [],
  );

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <p className='m-0 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'>
        Shadcn UI (Radix UI) 기반의 Select, DatePicker, ColorPicker, Cascader, TimePicker, TreeSelect 컴포넌트를{' '}
        <code className="dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">defineEditorPlugin()</code>으로 연결했습니다. 각 컴포넌트의 Portal 컨테이너로 <code className="dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">getPortalContainer()</code>를
        전달하여 Grid의 가상 스크롤, 위치 계산, 바깥 클릭 판정 및 라이프사이클과 완벽히 동기화됩니다.
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
