import { t } from './i18n';
import * as React from 'react';
import { BGrid, type BGridColumn, type BGridDataItem } from 'beautiful-grid';
import {
  createMantineColorPickerEditorPlugin,
  createMantineDatePickerEditorPlugin,
  createMantineSelectEditorPlugin,
  createMantineTimePickerEditorPlugin,
} from '@beautifuljs/grid-mantine';
import '@beautifuljs/grid-mantine/style.css';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import { CalendarIcon, ChevronDownIcon, ClockIcon } from './editing/editorIcons';
import {
  applyEditingDataChange,
  cloneEditingOrders,
  type EditingOrder,
  withEditingCellClasses,
} from './editing/shared';

type MantineEditorOrder = EditingOrder & {
  labelColor: string;
  deliveryTime: string;
};

const statusEditor = createMantineSelectEditorPlugin<MantineEditorOrder, EditingOrder['status']>({
  id: 'mantine-status',
  ariaLabel: t('Mantine 주문 상태 선택', 'Mantine Select Order Status'),
  searchable: true,
  options: [
    { value: t('접수', 'Receipt'), label: t('접수', 'Receipt') },
    { value: t('진행', 'In Progress'), label: t('진행', 'In Progress') },
    { value: t('완료', 'Completed'), label: t('완료', 'Completed') },
  ],
});

const deliveryDateEditor = createMantineDatePickerEditorPlugin<MantineEditorOrder>({
  id: 'mantine-delivery-date',
  ariaLabel: t('Mantine 납기일 선택', 'Mantine Select Delivery Date'),
});

const labelColorEditor = createMantineColorPickerEditorPlugin<MantineEditorOrder>({
  id: 'mantine-label-color',
  ariaLabel: t('Mantine 라벨 색상 선택', 'Mantine Select Label Color'),
  colors: ['#228BE6', '#12B886', '#7950F2', '#FD7E14'],
});

const deliveryTimeEditor = createMantineTimePickerEditorPlugin<MantineEditorOrder>({
  id: 'mantine-delivery-time',
  ariaLabel: t('Mantine 배송 시간 선택', 'Mantine Select Delivery Time'),
  minuteStep: 5,
});

const initialColors = ['#228BE6', '#12B886', '#7950F2', '#FD7E14'];
const initialDeliveryTimes = ['09:30', '11:00', '14:30', '16:00'];

const cloneMantineEditorOrders = (): BGridDataItem<MantineEditorOrder>[] =>
  cloneEditingOrders().map((item, index) => ({
    ...item,
    values: {
      ...item.values,
      labelColor: initialColors[index % initialColors.length],
      deliveryTime: initialDeliveryTimes[index % initialDeliveryTimes.length],
    },
  }));

export default function ExternalMantineEditorPluginExample() {
  const [data, setData] = React.useState(cloneMantineEditorOrders);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  const columns = React.useMemo<BGridColumn<MantineEditorOrder>[]>(
    () =>
      withEditingCellClasses<MantineEditorOrder>([
        { key: 'orderCode', label: t('주문 코드', 'Order Code'), width: 140, editable: false },
        {
          key: 'status',
          label: 'Mantine Select',
          width: 165,
          editable: true,
          editor: statusEditor,
          editorIcon: { render: <ChevronDownIcon />, ariaLabel: t('Mantine 상태 선택', 'Mantine Select Status') },
        },
        {
          key: 'deliveryDate',
          label: 'Mantine DatePicker',
          width: 175,
          editable: true,
          editor: deliveryDateEditor,
          editorIcon: { render: <CalendarIcon />, ariaLabel: t('Mantine 납기일 선택', 'Mantine Select Delivery Date') },
        },
        {
          key: 'labelColor',
          label: 'Mantine ColorPicker',
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
            ariaLabel: t('Mantine 라벨 색상 선택', 'Mantine Select Label Color'),
          },
        },
        {
          key: 'deliveryTime',
          label: 'Mantine TimePicker',
          width: 175,
          editable: true,
          editor: deliveryTimeEditor,
          editorIcon: { render: <ClockIcon />, ariaLabel: t('Mantine 배송 시간 선택', 'Mantine Select Delivery Time') },
        },
      ]),
    [],
  );

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <p className='m-0 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300'>
        <code>@beautifuljs/grid-mantine</code>
        {t(
          '의 Select, DatePicker, ColorPicker, TimePicker를 사용합니다. Cascader와 TreeSelect는 이 통합의 지원 범위에 포함되지 않습니다.',
          ' provides Select, DatePicker, ColorPicker, and TimePicker. Cascader and TreeSelect are outside this integration scope.',
        )}
      </p>
      <DataGridContainer ref={containerRef} style={{ height: 340 }}>
        <BGrid<MantineEditorOrder>
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
