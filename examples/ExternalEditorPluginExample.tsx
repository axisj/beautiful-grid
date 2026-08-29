import { t } from './i18n';
import * as React from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import { createAntdCascaderEditorPlugin } from './editor-plugins/createAntdCascaderEditorPlugin';
import { createAntdColorPickerEditorPlugin } from './editor-plugins/createAntdColorPickerEditorPlugin';
import { createAntdDatePickerEditorPlugin } from './editor-plugins/createAntdDatePickerEditorPlugin';
import { createAntdSelectEditorPlugin } from './editor-plugins/createAntdSelectEditorPlugin';
import { createAntdTimePickerEditorPlugin } from './editor-plugins/createAntdTimePickerEditorPlugin';
import { createAntdTreeSelectEditorPlugin } from './editor-plugins/createAntdTreeSelectEditorPlugin';
import { formatCascaderClipboardText, parseCascaderClipboardText } from './editor-plugins/cascaderValue';
import { CalendarIcon, ChevronDownIcon, ClockIcon } from './editing/editorIcons';
import {
  applyEditingDataChange,
  cloneEditingOrders,
  type EditingOrder,
  withEditingCellClasses,
} from './editing/shared';

type ExternalEditorOrder = EditingOrder & {
  labelColor: string;
  categoryPath: string[];
  deliveryTime: string;
  organization: string;
};

const antdStatusEditor = createAntdSelectEditorPlugin<ExternalEditorOrder, EditingOrder['status']>({
  id: 'external-antd-status',
  ariaLabel: t('Ant Design 주문 상태 선택', 'Ant Design Select Order Status'),
  options: [
    { value: t('접수', 'Receipt'), label: t('접수', 'Receipt') },
    { value: t('진행', 'In Progress'), label: t('진행', 'In Progress') },
    { value: t('완료', 'Completed'), label: t('완료', 'Completed') },
  ],
});

const antdDeliveryDateEditor = createAntdDatePickerEditorPlugin<ExternalEditorOrder>({
  id: 'external-antd-delivery-date',
  ariaLabel: t('Ant Design 납기일 선택', 'Ant Design Select Delivery Date'),
});

const antdLabelColorEditor = createAntdColorPickerEditorPlugin<ExternalEditorOrder>({
  id: 'external-antd-label-color',
  ariaLabel: t('Ant Design 라벨 색상 선택', 'Ant Design Select Label Color'),
});

const antdCategoryEditor = createAntdCascaderEditorPlugin<ExternalEditorOrder>({
  id: 'external-antd-category',
  ariaLabel: t('Ant Design 분류 경로 선택', 'Ant Design Select Category Path'),
  options: [
    {
      value: t('국내', 'Domestic'),
      label: t('국내', 'Domestic'),
      children: [
        { value: t('서울', 'Seoul'), label: t('서울', 'Seoul') },
        { value: t('부산', 'Busan'), label: t('부산', 'Busan') },
      ],
    },
    {
      value: t('해외', 'Overseas'),
      label: t('해외', 'Overseas'),
      children: [
        { value: t('아시아', 'Asia'), label: t('아시아', 'Asia') },
        { value: t('유럽', 'Europe'), label: t('유럽', 'Europe') },
      ],
    },
  ],
});

const antdDeliveryTimeEditor = createAntdTimePickerEditorPlugin<ExternalEditorOrder>({
  id: 'external-antd-delivery-time',
  ariaLabel: t('Ant Design 배송 시간 선택', 'Ant Design Select Delivery Time'),
});

const antdOrganizationEditor = createAntdTreeSelectEditorPlugin<ExternalEditorOrder>({
  id: 'external-antd-organization',
  ariaLabel: t('Ant Design 담당 조직 선택', 'Ant Design Select Responsible Organization'),
  treeData: [
    {
      value: t('영업본부', 'Sales Headquarters'),
      title: t('영업본부', 'Sales Headquarters'),
      children: [
        { value: t('서울 영업팀', 'Seoul Sales Team'), title: t('서울 영업팀', 'Seoul Sales Team') },
        { value: t('부산 영업팀', 'Busan Sales Team'), title: t('부산 영업팀', 'Busan Sales Team') },
      ],
    },
    {
      value: t('운영본부', 'Operations Headquarters'),
      title: t('운영본부', 'Operations Headquarters'),
      children: [
        { value: t('물류팀', 'Logistics Team'), title: t('물류팀', 'Logistics Team') },
        { value: t('고객지원팀', 'Customer Support Team'), title: t('고객지원팀', 'Customer Support Team') },
      ],
    },
  ],
});

const initialColors = ['#1677FF', '#13C2C2', '#52C41A', '#FA8C16'];
const initialCategoryPaths = [
  [t('국내', 'Domestic'), t('서울', 'Seoul')],
  [t('국내', 'Domestic'), t('부산', 'Busan')],
  [t('해외', 'Overseas'), t('아시아', 'Asia')],
  [t('해외', 'Overseas'), t('유럽', 'Europe')],
];
const initialDeliveryTimes = ['09:30', '11:00', '14:30', '16:00'];
const initialOrganizations = [t('서울 영업팀', 'Seoul Sales Team'), t('부산 영업팀', 'Busan Sales Team'), t('물류팀', 'Logistics Team'), t('고객지원팀', 'Customer Support Team')];

const cloneExternalEditorOrders = (): BGridDataItem<ExternalEditorOrder>[] =>
  cloneEditingOrders().map((item, index) => ({
    ...item,
    values: {
      ...item.values,
      labelColor: initialColors[index],
      categoryPath: initialCategoryPaths[index],
      deliveryTime: initialDeliveryTimes[index],
      organization: initialOrganizations[index],
    },
  }));

export default function ExternalEditorPluginExample() {
  const [data, setData] = React.useState(cloneExternalEditorOrders);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  const columns = React.useMemo<BGridColumn<ExternalEditorOrder>[]>(
    () => withEditingCellClasses<ExternalEditorOrder>([
      { key: 'orderCode', label: t('주문 코드', 'Order Code'), width: 140, editable: false },
      { key: 'customerName', label: t('고객명', 'Customer Name'), width: 160, editable: false },
      {
        key: 'status',
        label: 'Ant Design Select',
        width: 180,
        editable: true,
        editor: antdStatusEditor,
        editorIcon: { render: <ChevronDownIcon />, ariaLabel: t('Ant Design 상태 선택', 'Ant Design Select Status') },
      },
      {
        key: 'deliveryDate',
        label: 'Ant Design DatePicker',
        width: 200,
        editable: true,
        editor: antdDeliveryDateEditor,
        editorIcon: { render: <CalendarIcon />, ariaLabel: t('Ant Design 납기일 선택', 'Ant Design Select Delivery Date') },
      },
      {
        key: 'labelColor',
        label: 'Ant Design ColorPicker',
        width: 210,
        editable: true,
        editor: antdLabelColorEditor,
        itemRender: ({ value }) => <>{String(value ?? '')}</>,
        editorIcon: {
          render: ({ value }) => (
            <span
              className='bgrid-color-swatch'
              style={{ backgroundColor: typeof value === 'string' ? value : 'transparent' }}
              aria-hidden='true'
            />
          ),
          ariaLabel: t('Ant Design 라벨 색상 선택', 'Ant Design Select Label Color'),
        },
      },
      {
        key: 'categoryPath',
        label: 'Ant Design Cascader',
        width: 200,
        editable: true,
        editor: antdCategoryEditor,
        itemRender: ({ value }) => <>{Array.isArray(value) ? value.join(' / ') : ''}</>,
        getClipboardText: ({ value }) => formatCascaderClipboardText(value),
        parseClipboardText: parseCascaderClipboardText,
        editorIcon: { render: <ChevronDownIcon />, ariaLabel: t('Ant Design 분류 경로 선택', 'Ant Design Select Category Path') },
      },
      {
        key: 'deliveryTime',
        label: 'Ant Design TimePicker',
        width: 190,
        editable: true,
        editor: antdDeliveryTimeEditor,
        editorIcon: { render: <ClockIcon />, ariaLabel: t('Ant Design 배송 시간 선택', 'Ant Design Select Delivery Time') },
      },
      {
        key: 'organization',
        label: 'Ant Design TreeSelect',
        width: 210,
        editable: true,
        editor: antdOrganizationEditor,
        editorIcon: { render: <ChevronDownIcon />, ariaLabel: t('Ant Design 담당 조직 선택', 'Ant Design Select Responsible Organization') },
      },
    ]),
    [],
  );

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <p className='m-0 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700'>
        Ant Design Select, DatePicker, ColorPicker, Cascader, TimePicker, TreeSelect를{' '}
        <code>defineEditorPlugin()</code>으로 연결했습니다. 셀을 더블클릭하거나 각 아이콘과 ColorPicker 색상 박스를 클릭해
        편집을 시작합니다. popup은 plugin의 <code>getPortalContainer()</code>에 렌더링하고 값 선택 시{' '}
        <code>commit(changes[])</code>을 호출합니다.
      </p>
      <DataGridContainer ref={containerRef} style={{ height: 340 }}>
        <BGrid<ExternalEditorOrder>
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
