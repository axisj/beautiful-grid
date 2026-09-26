import { t } from './i18n';
import * as React from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';
import {
  createMuiColorPickerEditorPlugin,
  createMuiDatePickerEditorPlugin,
  createMuiSelectEditorPlugin,
  createMuiTimePickerEditorPlugin,
} from '@beautifuljs/grid-mui';
import '@beautifuljs/grid-mui/style.css';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import { CalendarIcon, ChevronDownIcon, ClockIcon } from './editing/editorIcons';
import {
  applyEditingDataChange,
  cloneEditingOrders,
  type EditingOrder,
  withEditingCellClasses,
} from './editing/shared';

type MuiEditorOrder = EditingOrder & {
  labelColor: string;
  deliveryTime: string;
};

const statusEditor = createMuiSelectEditorPlugin<MuiEditorOrder, EditingOrder['status']>({
  id: 'mui-status',
  ariaLabel: t('MUI 주문 상태 선택', 'MUI Select Order Status'),
  options: [
    { value: t('접수', 'Receipt'), label: t('접수', 'Receipt') },
    { value: t('진행', 'In Progress'), label: t('진행', 'In Progress') },
    { value: t('완료', 'Completed'), label: t('완료', 'Completed') },
  ],
});

const deliveryDateEditor = createMuiDatePickerEditorPlugin<MuiEditorOrder>({
  id: 'mui-delivery-date',
  ariaLabel: t('MUI 납기일 선택', 'MUI Select Delivery Date'),
});

const labelColorEditor = createMuiColorPickerEditorPlugin<MuiEditorOrder>({
  id: 'mui-label-color',
  ariaLabel: t('MUI 라벨 색상 선택', 'MUI Select Label Color'),
  colors: ['#1976D2', '#00897B', '#7B1FA2', '#ED6C02'],
});

const deliveryTimeEditor = createMuiTimePickerEditorPlugin<MuiEditorOrder>({
  id: 'mui-delivery-time',
  ariaLabel: t('MUI 배송 시간 선택', 'MUI Select Delivery Time'),
  minuteStep: 5,
});

const initialColors = ['#1976D2', '#00897B', '#7B1FA2', '#ED6C02'];
const initialDeliveryTimes = ['09:30', '11:00', '14:30', '16:00'];

const cloneMuiEditorOrders = (): BGridDataItem<MuiEditorOrder>[] =>
  cloneEditingOrders().map((item, index) => ({
    ...item,
    values: {
      ...item.values,
      labelColor: initialColors[index % initialColors.length],
      deliveryTime: initialDeliveryTimes[index % initialDeliveryTimes.length],
    },
  }));

export default function ExternalMuiEditorPluginExample() {
  const [data, setData] = React.useState(cloneMuiEditorOrders);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  const columns = React.useMemo<BGridColumn<MuiEditorOrder>[]>(
    () =>
      withEditingCellClasses<MuiEditorOrder>([
        { key: 'orderCode', label: t('주문 코드', 'Order Code'), width: 140, editable: false },
        {
          key: 'status',
          label: 'MUI Select',
          width: 165,
          editable: true,
          editor: statusEditor,
          editorIcon: { render: <ChevronDownIcon />, ariaLabel: t('MUI 상태 선택', 'MUI Select Status') },
        },
        {
          key: 'deliveryDate',
          label: 'MUI DatePicker',
          width: 175,
          editable: true,
          editor: deliveryDateEditor,
          editorIcon: { render: <CalendarIcon />, ariaLabel: t('MUI 납기일 선택', 'MUI Select Delivery Date') },
        },
        {
          key: 'labelColor',
          label: 'MUI ColorPicker',
          width: 175,
          editable: true,
          editor: labelColorEditor,
          editorIcon: {
            render: ({ value }) => (
              <span
                className='bgrid-color-swatch'
                style={{ backgroundColor: typeof value === 'string' ? value : 'transparent' }}
                aria-hidden='true'
              />
            ),
            ariaLabel: t('MUI 라벨 색상 선택', 'MUI Select Label Color'),
          },
        },
        {
          key: 'deliveryTime',
          label: 'MUI TimePicker',
          width: 165,
          editable: true,
          editor: deliveryTimeEditor,
          editorIcon: { render: <ClockIcon />, ariaLabel: t('MUI 배송 시간 선택', 'MUI Select Delivery Time') },
        },
      ]),
    [],
  );

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <p className='m-0 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'>
        <code>@beautifuljs/grid-mui</code>
        {t(
          '의 Select, DatePicker, ColorPicker, TimePicker를 사용합니다. 셀을 더블클릭하거나 아이콘을 누르면 Grid 전용 portal 안에서 편집기가 열립니다.',
          ' provides Select, DatePicker, ColorPicker, and TimePicker. Double-click a cell or use its icon to open the editor in the Grid portal.',
        )}
      </p>
      <DataGridContainer ref={containerRef} style={{ height: 340 }}>
        <BGrid<MuiEditorOrder>
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
