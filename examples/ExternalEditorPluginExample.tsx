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
  ariaLabel: 'Ant Design 주문 상태 선택',
  options: [
    { value: '접수', label: '접수' },
    { value: '진행', label: '진행' },
    { value: '완료', label: '완료' },
  ],
});

const antdDeliveryDateEditor = createAntdDatePickerEditorPlugin<ExternalEditorOrder>({
  id: 'external-antd-delivery-date',
  ariaLabel: 'Ant Design 납기일 선택',
});

const antdLabelColorEditor = createAntdColorPickerEditorPlugin<ExternalEditorOrder>({
  id: 'external-antd-label-color',
  ariaLabel: 'Ant Design 라벨 색상 선택',
});

const antdCategoryEditor = createAntdCascaderEditorPlugin<ExternalEditorOrder>({
  id: 'external-antd-category',
  ariaLabel: 'Ant Design 분류 경로 선택',
  options: [
    {
      value: '국내',
      label: '국내',
      children: [
        { value: '서울', label: '서울' },
        { value: '부산', label: '부산' },
      ],
    },
    {
      value: '해외',
      label: '해외',
      children: [
        { value: '아시아', label: '아시아' },
        { value: '유럽', label: '유럽' },
      ],
    },
  ],
});

const antdDeliveryTimeEditor = createAntdTimePickerEditorPlugin<ExternalEditorOrder>({
  id: 'external-antd-delivery-time',
  ariaLabel: 'Ant Design 배송 시간 선택',
});

const antdOrganizationEditor = createAntdTreeSelectEditorPlugin<ExternalEditorOrder>({
  id: 'external-antd-organization',
  ariaLabel: 'Ant Design 담당 조직 선택',
  treeData: [
    {
      value: '영업본부',
      title: '영업본부',
      children: [
        { value: '서울 영업팀', title: '서울 영업팀' },
        { value: '부산 영업팀', title: '부산 영업팀' },
      ],
    },
    {
      value: '운영본부',
      title: '운영본부',
      children: [
        { value: '물류팀', title: '물류팀' },
        { value: '고객지원팀', title: '고객지원팀' },
      ],
    },
  ],
});

const initialColors = ['#1677FF', '#13C2C2', '#52C41A', '#FA8C16'];
const initialCategoryPaths = [
  ['국내', '서울'],
  ['국내', '부산'],
  ['해외', '아시아'],
  ['해외', '유럽'],
];
const initialDeliveryTimes = ['09:30', '11:00', '14:30', '16:00'];
const initialOrganizations = ['서울 영업팀', '부산 영업팀', '물류팀', '고객지원팀'];

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
      { key: 'orderCode', label: '주문 코드', width: 140, editable: false },
      { key: 'customerName', label: '고객명', width: 160, editable: false },
      {
        key: 'status',
        label: 'Ant Design Select',
        width: 180,
        editable: true,
        editor: antdStatusEditor,
        editorIcon: { render: <ChevronDownIcon />, ariaLabel: 'Ant Design 상태 선택' },
      },
      {
        key: 'deliveryDate',
        label: 'Ant Design DatePicker',
        width: 200,
        editable: true,
        editor: antdDeliveryDateEditor,
        editorIcon: { render: <CalendarIcon />, ariaLabel: 'Ant Design 납기일 선택' },
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
          ariaLabel: 'Ant Design 라벨 색상 선택',
        },
      },
      {
        key: 'categoryPath',
        label: 'Ant Design Cascader',
        width: 200,
        editable: true,
        editor: antdCategoryEditor,
        itemRender: ({ value }) => <>{Array.isArray(value) ? value.join(' / ') : ''}</>,
        editorIcon: { render: <ChevronDownIcon />, ariaLabel: 'Ant Design 분류 경로 선택' },
      },
      {
        key: 'deliveryTime',
        label: 'Ant Design TimePicker',
        width: 190,
        editable: true,
        editor: antdDeliveryTimeEditor,
        editorIcon: { render: <ClockIcon />, ariaLabel: 'Ant Design 배송 시간 선택' },
      },
      {
        key: 'organization',
        label: 'Ant Design TreeSelect',
        width: 210,
        editable: true,
        editor: antdOrganizationEditor,
        editorIcon: { render: <ChevronDownIcon />, ariaLabel: 'Ant Design 담당 조직 선택' },
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
