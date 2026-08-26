import * as React from 'react';
import { Card, Select, Space } from 'antd';
import {
  BGrid,
  BGridColumn,
  BGridPivotAggregate,
  BGridPivotField,
  BGridPivotValueClipboardTextParams,
  BGridPivotValueItemRenderProps,
} from 'beautiful-grid';
import { useContainerSize } from '../hooks/useContainerSize';
import DataGridContainer from '../components/DataGridContainer';

type FieldKey = 'region' | 'channel' | 'product' | 'quarter' | 'month' | 'sales' | 'quantity';

interface SalesItem {
  region: string;
  channel: string;
  product: string;
  quarter: string;
  month: string;
  sales: number;
  quantity: number;
}

const fieldMap: Record<FieldKey, BGridPivotField> = {
  region: { key: 'region', label: 'Region', width: 120 },
  channel: { key: 'channel', label: 'Channel', width: 120 },
  product: { key: 'product', label: 'Product', width: 140 },
  quarter: { key: 'quarter', label: 'Quarter', width: 110 },
  month: { key: 'month', label: 'Month', width: 110 },
  sales: { key: 'sales', label: 'Sales', width: 120, align: 'right' },
  quantity: { key: 'quantity', label: 'Quantity', width: 120, align: 'right' },
};

const dimensionOptions: { label: string; value: FieldKey }[] = [
  { label: 'Region', value: 'region' },
  { label: 'Channel', value: 'channel' },
  { label: 'Product', value: 'product' },
  { label: 'Quarter', value: 'quarter' },
  { label: 'Month', value: 'month' },
];

const valueOptions: { label: string; value: FieldKey }[] = [
  { label: 'Sales', value: 'sales' },
  { label: 'Quantity', value: 'quantity' },
];

const aggregateOptions: { label: string; value: BGridPivotAggregate<SalesItem> }[] = [
  { label: 'Sum', value: 'sum' },
  { label: 'Count', value: 'count' },
  { label: 'Average', value: 'avg' },
  { label: 'Min', value: 'min' },
  { label: 'Max', value: 'max' },
];

const data = createSalesData();

const columns: BGridColumn<SalesItem>[] = [
  { key: 'region', label: 'Region', width: 120 },
  { key: 'channel', label: 'Channel', width: 120 },
  { key: 'product', label: 'Product', width: 140 },
  { key: 'quarter', label: 'Quarter', width: 110 },
  { key: 'month', label: 'Month', width: 110 },
  { key: 'sales', label: 'Sales', width: 120, align: 'right' },
  { key: 'quantity', label: 'Quantity', width: 120, align: 'right' },
];

function PivotExample() {
  const [rowKeys, setRowKeys] = React.useState<FieldKey[]>(['region', 'product']);
  const [columnKeys, setColumnKeys] = React.useState<FieldKey[]>(['quarter']);
  const [valueKeys, setValueKeys] = React.useState<FieldKey[]>(['sales']);
  const [aggregate, setAggregate] = React.useState<BGridPivotAggregate<SalesItem>>('sum');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width: containerWidth, height: containerHeight } = useContainerSize(containerRef);

  const pivot = React.useMemo(
    () => ({
      rows: rowKeys.map(key => fieldMap[key]),
      columns: columnKeys.map(key => fieldMap[key]),
      values: valueKeys.map(key => ({
        ...fieldMap[key],
        label: `${getAggregateLabel(aggregate)} ${fieldMap[key].label}`,
        aggregate,
        itemRender: (params: BGridPivotValueItemRenderProps<SalesItem>) => renderPivotValue(key, params),
        getClipboardText: ({ value, aggregate: valueAggregate }: BGridPivotValueClipboardTextParams<SalesItem>) =>
          formatPivotValue(key, value, valueAggregate),
      })),
      emptyValue: 0,
    }),
    [aggregate, columnKeys, rowKeys, valueKeys],
  );

  return (
    <>
      <Card size={'small'} style={{ marginBottom: 12 }}>
        <Space wrap>
          <FieldSelect label={'Rows'} value={rowKeys} options={dimensionOptions} onChange={setRowKeys} />
          <FieldSelect label={'Columns'} value={columnKeys} options={dimensionOptions} onChange={setColumnKeys} />
          <FieldSelect label={'Values'} value={valueKeys} options={valueOptions} onChange={setValueKeys} />
          <ControlLabel label={'Aggregate'}>
            <Select style={{ width: 130 }} value={aggregate} options={aggregateOptions} onChange={setAggregate} />
          </ControlLabel>
        </Space>
      </Card>

      <DataGridContainer
        ref={containerRef}
        style={{ height: 560 }}
      >
        <BGrid<SalesItem>
          width={containerWidth}
          height={containerHeight}
          headerHeight={50}
          data={data}
          columns={columns}
          pivot={pivot}
          frozenColumnIndex={2}
          showLineNumber
          columnSortable
          sort={{
            sortParams: [{ key: 'region', orderBy: 'asc' }],
            onChange: params => console.log('sort disabled while pivoting', params),
          }}
          variant={'vertical-bordered'}
        />
      </DataGridContainer>
    </>
  );
}

function FieldSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: FieldKey[];
  options: { label: string; value: FieldKey }[];
  onChange: (value: FieldKey[]) => void;
}) {
  return (
    <ControlLabel label={label}>
      <Select mode={'multiple'} style={{ minWidth: 220 }} value={value} options={options} onChange={onChange} />
    </ControlLabel>
  );
}

function ControlLabel({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Space size={6}>
      <span className={'text-[12px] text-gray-500'}>{label}</span>
      {children}
    </Space>
  );
}

function getAggregateLabel(aggregate: BGridPivotAggregate<SalesItem>) {
  if (aggregate === 'avg') return 'Avg';
  if (typeof aggregate === 'string') return aggregate[0].toUpperCase() + aggregate.slice(1);
  return 'Custom';
}

function formatPivotValue(key: FieldKey, value: any, aggregate?: BGridPivotAggregate<SalesItem>) {
  const numberValue = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numberValue)) return value ?? '';
  if (aggregate === 'count') return numberValue.toLocaleString();
  if (key === 'sales') return `$${numberValue.toLocaleString()}`;
  if (key === 'quantity') return `${numberValue.toLocaleString()} ea`;
  return numberValue.toLocaleString();
}

function renderPivotValue(
  key: FieldKey,
  { value, columnValues, sourceItems, aggregate }: BGridPivotValueItemRenderProps<SalesItem>,
) {
  const text = formatPivotValue(key, value, aggregate);
  const title = `${sourceItems.length} source rows`;

  if (key === 'sales' && columnValues[0] === 'West') {
    return <strong title={title}>{text}</strong>;
  }

  return <span title={title}>{text}</span>;
}

function createSalesData() {
  const regions = ['North', 'South', 'East', 'West'];
  const channels = ['Online', 'Retail'];
  const products = ['Desk', 'Chair', 'Lamp'];
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4'];

  return regions.flatMap((region, regionIndex) =>
    channels.flatMap((channel, channelIndex) =>
      products.flatMap((product, productIndex) =>
        quarters.flatMap((quarter, quarterIndex) =>
          Array.from({ length: 3 }, (_, monthIndex) => {
            const base = (regionIndex + 1) * 100 + (productIndex + 1) * 30 + (quarterIndex + 1) * 15;
            return {
              values: {
                region,
                channel,
                product,
                quarter,
                month: `${quarter}-M${monthIndex + 1}`,
                sales: base + channelIndex * 17 + monthIndex * 6,
                quantity: (productIndex + 1) * 3 + quarterIndex + monthIndex + channelIndex,
              },
            };
          }),
        ),
      ),
    ),
  );
}

export default PivotExample;
