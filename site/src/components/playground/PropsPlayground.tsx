import * as React from 'react';
import { BGrid, BGridDataItemStatus } from 'beautiful-grid';
import type {
  BGridCellAddress,
  BGridColumn,
  BGridColumnGroup,
  BGridColumnGroupNode,
  BGridDataControl,
  BGridDataItem,
  BGridDataQuery,
  BGridPivotOptions,
  BGridProps,
  BGridSortParam,
  BGridScrollbarVariant,
} from 'beautiful-grid';
import { Collapse, Form, Input, InputNumber, Select, Switch } from 'antd';
import { useMemo, useState } from 'react';
import { playgroundManagers } from './mockData';
import { PlaygroundWorkspace } from './PlaygroundWorkspace';
import type { Locale } from '../../i18n';

interface ProductRow {
  id: string;
  product: string;
  category: string;
  supplier: string;
  salesStatus: string;
  registeredAt: string;
  updatedAt: string;
  quantity: number;
  safetyStock: number;
  price: number;
  warehouse: string;
  manager: string;
}

type GroupMode = 'none' | 'columnGroups' | 'columnsGroup';
type RowCheckedMode = 'none' | 'indexes' | 'rowKeys' | 'radio';

const categories = ['Office', 'Device', 'Software'];
const warehouses = ['Seoul', 'Busan', 'Daejeon'];
const suppliers = ['AXISJ', '한빛테크', '모노웍스', '스튜디오랩', '오피스허브'];
const salesStatuses = ['판매 중', '입고 예정', '품절', '판매 중지'];

const primaryData: BGridDataItem<ProductRow>[] = Array.from({ length: 500 }, (_, index) => ({
  values: {
    id: `SKU-${String(index + 1).padStart(4, '0')}`,
    product: `Workspace item ${index + 1}`,
    category: categories[index % categories.length],
    supplier: suppliers[index % suppliers.length],
    salesStatus: salesStatuses[index % salesStatuses.length],
    registeredAt: `2026-07-${String((index % 28) + 1).padStart(2, '0')}`,
    updatedAt: `2026-08-${String(((index * 3) % 28) + 1).padStart(2, '0')}`,
    quantity: ((index * 17) % 96) + 4,
    safetyStock: ((index * 5) % 24) + 6,
    price: 12000 + ((index * 7919) % 180000),
    warehouse: warehouses[index % warehouses.length],
    manager: playgroundManagers[index % playgroundManagers.length],
  },
}));

const compactData = primaryData.slice(0, 40).map((item, index) => ({
  ...item,
  values: { ...item.values, id: `SAMPLE-${index + 1}` },
}));

const englishPrimaryData: BGridDataItem<ProductRow>[] = primaryData.map((item, index) => ({
  ...item,
  values: {
    ...item.values,
    supplier: ['AXISJ', 'Hanbit Tech', 'Mono Works', 'Studio Lab', 'Office Hub'][index % 5],
    salesStatus: ['On sale', 'Incoming', 'Sold out', 'Paused'][index % 4],
    manager: ['Jordan Jang', 'Ian Kook', 'Dylan Jung', 'Avery Yang', 'Sora Koo', 'Sam Jang', 'Helen Park', 'Daniel Kim'][index % 8],
  },
}));
const englishCompactData = englishPrimaryData.slice(0, 40).map((item, index) => ({
  ...item, values: { ...item.values, id: `SAMPLE-${index + 1}` },
}));

const initialColumns: BGridColumn<ProductRow>[] = [
  { id: 'id', key: 'id', label: '상품 코드', width: 112, toolbox: true, filter: { type: 'text' } },
  {
    id: 'product',
    key: 'product',
    label: '상품명',
    width: 210,
    editable: true,
    toolbox: true,
    filter: { type: 'text' },
    editor: {
      type: 'text',
      ariaLabel: '상품명 편집',
      inputProps: { maxLength: 100, autoComplete: 'off' },
    },
  },
  { id: 'category', key: 'category', label: '분류', width: 104, toolbox: true, filter: { type: 'values' } },
  { id: 'supplier', key: 'supplier', label: '공급사', width: 120, toolbox: true, filter: { type: 'values' } },
  { id: 'salesStatus', key: 'salesStatus', label: '판매 상태', width: 104, toolbox: true, filter: { type: 'values' } },
  { id: 'registeredAt', key: 'registeredAt', label: '등록일', width: 112, toolbox: true, filter: { type: 'text' } },
  { id: 'updatedAt', key: 'updatedAt', label: '수정일', width: 112, toolbox: true, filter: { type: 'text' } },
  {
    id: 'quantity',
    key: 'quantity',
    label: '수량',
    width: 88,
    align: 'right',
    toolbox: true,
    filter: { type: 'number' },
  },
  {
    id: 'safetyStock',
    key: 'safetyStock',
    label: '안전 재고',
    width: 96,
    align: 'right',
    toolbox: true,
    filter: { type: 'number' },
  },
  {
    id: 'price',
    key: 'price',
    label: '가격',
    width: 120,
    align: 'right',
    toolbox: true,
    filter: { type: 'number' },
    itemRender: ({ value }) => <>{Number(value).toLocaleString()}원</>,
  },
  { id: 'warehouse', key: 'warehouse', label: '창고', width: 100, toolbox: true, filter: { type: 'values' } },
  { id: 'manager', key: 'manager', label: '담당자', width: 96, toolbox: true, filter: { type: 'values' } },
];

const nestedColumnGroups: BGridColumnGroupNode[] = [
  { id: 'product-group', label: '상품 정보', children: ['id', 'product', 'category', 'supplier', 'salesStatus'] },
  { id: 'date-group', label: '일정', children: ['registeredAt', 'updatedAt'] },
  { id: 'stock-group', label: '재고 및 가격', children: ['quantity', 'safetyStock', 'price', 'warehouse', 'manager'] },
];

const legacyColumnGroups: BGridColumnGroup[] = [
  { label: '상품 정보', groupStartIndex: 0, groupEndIndex: 4 },
  { label: '일정', groupStartIndex: 5, groupEndIndex: 6 },
  { label: '재고 및 가격', groupStartIndex: 7, groupEndIndex: 11 },
];

const englishPriceRender: NonNullable<BGridColumn<ProductRow>['itemRender']> = ({ value }) => (
  <>{Number(value).toLocaleString('en-US')} KRW</>
);

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className='playground-toggle-row'>
      <span>{label}</span>
      <Switch checked={checked} onChange={onChange} />
    </div>
  );
}

function NumberField({
  label,
  value,
  min = 0,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
}) {
  return (
    <Form.Item label={label}>
      <InputNumber value={value} min={min} max={max} onChange={next => onChange(Number(next ?? min))} />
    </Form.Item>
  );
}

export default function PropsPlayground({ locale = 'ko' }: { locale?: Locale }) {
  const isEn = locale === 'en';
  const t = (ko: string, en: string) => isEn ? en : ko;
  const localizedInitialColumns = useMemo(() => isEn ? initialColumns.map(column => ({
    ...column,
    label: ({ id: 'Product code', product: 'Product', category: 'Category', supplier: 'Supplier', salesStatus: 'Sales status', registeredAt: 'Registered', updatedAt: 'Updated', quantity: 'Quantity', safetyStock: 'Safety stock', price: 'Price', warehouse: 'Warehouse', manager: 'Manager' } as Record<string, string>)[String(column.id)] ?? column.label,
    editor: column.id === 'product' ? { type: 'text' as const, ariaLabel: 'Edit product name', inputProps: { maxLength: 100, autoComplete: 'off' } } : column.editor,
    itemRender: column.id === 'price' ? englishPriceRender : column.itemRender,
  })) : initialColumns, [isEn]);
  const [data, setData] = useState(isEn ? englishPrimaryData : primaryData);
  const [dataset, setDataset] = useState<'primary' | 'compact'>('primary');
  const [columns, setColumns] = useState(localizedInitialColumns);
  const [emptyData, setEmptyData] = useState(false);
  const [width, setWidth] = useState(960);
  const [height, setHeight] = useState(520);
  const [headerHeight, setHeaderHeight] = useState(38);
  const [footerHeight, setFooterHeight] = useState(34);
  const [bottomBarHeight, setBottomBarHeight] = useState(34);
  const [useLegacyFooter, setUseLegacyFooter] = useState(false);
  const [summaryHeight, setSummaryHeight] = useState(34);
  const [itemHeight, setItemHeight] = useState(18);
  const [itemPadding, setItemPadding] = useState(7);
  const [frozenColumnIndex, setFrozenColumnIndex] = useState(1);
  const [frozenRowCount, setFrozenRowCount] = useState(0);
  const [variant, setVariant] = useState<'default' | 'vertical-bordered'>('vertical-bordered');
  const [groupMode, setGroupMode] = useState<GroupMode>('none');
  const [loading, setLoading] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [customClassName, setCustomClassName] = useState(false);
  const [customStyle, setCustomStyle] = useState(false);
  const [pageEnabled, setPageEnabled] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(30);
  const [totalPages, setTotalPages] = useState(4);
  const [paginationLength, setPaginationLength] = useState(5);
  const [pageLoading, setPageLoading] = useState(false);
  const [statusVisible, setStatusVisible] = useState(true);
  const [customStatus, setCustomStatus] = useState(true);
  const [paginationVisible, setPaginationVisible] = useState(true);
  const [scrollbarVariant, setScrollbarVariant] = useState<BGridScrollbarVariant>('modern');
  const [horizontalScrollbar, setHorizontalScrollbar] = useState(true);
  const [verticalScrollbar, setVerticalScrollbar] = useState(true);
  const [loadMoreEnabled, setLoadMoreEnabled] = useState(false);
  const [rowCheckedMode, setRowCheckedMode] = useState<RowCheckedMode>('indexes');
  const [checkedIndexes, setCheckedIndexes] = useState<number[]>([1, 3]);
  const [checkedRowKeys, setCheckedRowKeys] = useState<React.Key[]>([]);
  const [sortParams, setSortParams] = useState<BGridSortParam[]>([]);
  const [multiSort, setMultiSort] = useState(true);
  const [selectedRowKey, setSelectedRowKey] = useState<React.Key>();
  const [editable, setEditable] = useState(false);
  const [editTrigger, setEditTrigger] = useState<'click' | 'dblclick'>('dblclick');
  const [showLineNumber, setShowLineNumber] = useState(true);
  const [emptyMessage, setEmptyMessage] = useState(t('표시할 데이터가 없습니다.', 'No data to display.'));
  const [rowClassNameEnabled, setRowClassNameEnabled] = useState(false);
  const [cellMergeEnabled, setCellMergeEnabled] = useState(false);
  const [cellSelectionEnabled, setCellSelectionEnabled] = useState(true);
  const [clearOnEscape, setClearOnEscape] = useState(true);
  const [clearOnOutsideClick, setClearOnOutsideClick] = useState(true);
  const [maxClipboardCells, setMaxClipboardCells] = useState(10000);
  const [maxClipboardTextLength, setMaxClipboardTextLength] = useState(1000000);
  const [createRowOnPaste, setCreateRowOnPaste] = useState(false);
  const [navigationEnabled, setNavigationEnabled] = useState(true);
  const [navigationWrap, setNavigationWrap] = useState(false);
  const [editOnEnter, setEditOnEnter] = useState(true);
  const [activeCell, setActiveCell] = useState<BGridCellAddress | undefined>({ rowIndex: 0, columnIndex: 0 });
  const [summaryPosition, setSummaryPosition] = useState<'none' | 'top' | 'bottom'>('none');
  const [columnSortable, setColumnSortable] = useState(true);
  const [reorderEnabled, setReorderEnabled] = useState(false);
  const [reorderingInfoEnabled, setReorderingInfoEnabled] = useState(false);
  const [pivotEnabled, setPivotEnabled] = useState(false);
  const [dataControlEnabled, setDataControlEnabled] = useState(false);
  const [customIcons, setCustomIcons] = useState(false);
  const [query, setQuery] = useState<BGridDataQuery>({ sortParams: [], filterParams: [] });
  const [lastEvent, setLastEvent] = useState('Ready');

  const gridData = emptyData ? [] : data;
  const effectiveColumns = useMemo(
    () => columns.map(column => ({ ...column, toolbox: dataControlEnabled ? true : column.toolbox })),
    [columns, dataControlEnabled],
  );

  const dataControl = useMemo<BGridDataControl | undefined>(
    () =>
      dataControlEnabled
        ? {
            mode: 'client',
            multiSort,
            query,
            onChange: (nextQuery, event) => {
              setQuery(nextQuery);
              setLastEvent(`dataControl.${event.type}: ${event.columnId} / ${event.action}`);
            },
          }
        : undefined,
    [dataControlEnabled, multiSort, query],
  );

  const pivot = useMemo<BGridPivotOptions<ProductRow> | undefined>(
    () =>
      pivotEnabled
        ? {
            enabled: true,
            rows: [{ key: 'category', label: isEn ? 'Category' : '분류', width: 130 }],
            columns: [{ key: 'warehouse', label: isEn ? 'Warehouse' : '창고' }],
            values: [{ key: 'quantity', label: isEn ? 'Quantity total' : '수량 합계', aggregate: 'sum', width: 120, align: 'right' }],
            emptyValue: 0,
          }
        : undefined,
    [isEn, pivotEnabled],
  );

  const summary: BGridProps<ProductRow>['summary'] =
    summaryPosition === 'none'
      ? undefined
      : {
          position: summaryPosition,
          columns: [
            { columnIndex: 0, itemRender: () => <>{t('합계', 'Total')}</> },
            {
              columnIndex: 7,
              align: 'right',
              itemRender: ({ data }) => <>{data.reduce((total, item) => total + item.values.quantity, 0)}</>,
            },
          ],
        };

  const rowChecked: BGridProps<ProductRow>['rowChecked'] =
    rowCheckedMode === 'none'
      ? undefined
      : {
          isRadio: rowCheckedMode === 'radio',
          checkedIndexes: rowCheckedMode === 'indexes' || rowCheckedMode === 'radio' ? checkedIndexes : undefined,
          checkedRowKeys: rowCheckedMode === 'rowKeys' ? checkedRowKeys : undefined,
          onChange: (indexes, keys, checkedAll) => {
            setCheckedIndexes(indexes);
            setCheckedRowKeys(keys);
            setLastEvent(`rowChecked.onChange: ${indexes.join(', ') || '-'} / ${checkedAll}`);
          },
        };

  const source = useMemo(
    () => `import { BGrid } from 'beautiful-grid';
import 'beautiful-grid/style.css';

export function ProductGrid() {
  return (
    <BGrid
      width={${width}}
      height={${height}}
      headerHeight={${headerHeight}}
      ${useLegacyFooter ? `footerHeight={${footerHeight}}` : `bottomBarHeight={${bottomBarHeight}}`}
      summaryHeight={${summaryHeight}}
      itemHeight={${itemHeight}}
      itemPadding={${itemPadding}}
      frozenColumnIndex={${frozenColumnIndex}}
      frozenRowCount={${frozenRowCount}}
      columns={columns}
      data={data}
      variant="${variant}"
      loading={${loading}}
      spinning={${spinning}}
      showLineNumber={${showLineNumber}}
      editable={${editable}}
      editTrigger="${editTrigger}"
      columnSortable={${columnSortable}}
      scrollbar={{ variant: '${scrollbarVariant}', horizontal: { visible: ${horizontalScrollbar} }, vertical: { visible: ${verticalScrollbar} } }}
      status={{ visible: ${statusVisible} }}
      pagination={{ visible: ${paginationVisible} }}
      cellSelectionOptions={{ enabled: ${cellSelectionEnabled}, clearOnEscape: ${clearOnEscape}, clearOnOutsideClick: ${clearOnOutsideClick} }}
      cellNavigationOptions={{ enabled: ${navigationEnabled}, wrap: ${navigationWrap}, editOnEnter: ${editOnEnter} }}
      onChangeColumns={handleColumnsChange}
      onChangeData={handleDataChange}
      onClick={handleCellClick}
    />
  );
}`,
    [
      bottomBarHeight,
      cellSelectionEnabled,
      clearOnEscape,
      clearOnOutsideClick,
      columnSortable,
      editOnEnter,
      editTrigger,
      editable,
      footerHeight,
      frozenColumnIndex,
      frozenRowCount,
      headerHeight,
      height,
      horizontalScrollbar,
      itemHeight,
      itemPadding,
      loading,
      navigationEnabled,
      navigationWrap,
      paginationVisible,
      scrollbarVariant,
      showLineNumber,
      spinning,
      statusVisible,
      summaryHeight,
      useLegacyFooter,
      variant,
      verticalScrollbar,
      width,
    ],
  );

  const controls = (
    <Form className='playground-control-form' layout='vertical' size='middle'>
      <div className='playground-event-log' aria-live='polite'>
        <strong>Last event</strong>
        {lastEvent}
      </div>
      <Collapse
        defaultActiveKey={['layout', 'data']}
        items={[
          {
            key: 'layout',
            label: 'Layout & dimensions',
            children: (
              <div className='playground-field-grid'>
                <NumberField label='width' value={width} min={280} max={1600} onChange={setWidth} />
                <NumberField label='height' value={height} min={240} max={900} onChange={setHeight} />
                <NumberField label='headerHeight' value={headerHeight} min={24} onChange={setHeaderHeight} />
                <NumberField label='summaryHeight' value={summaryHeight} min={22} onChange={setSummaryHeight} />
                <NumberField label='bottomBarHeight' value={bottomBarHeight} min={22} onChange={setBottomBarHeight} />
                <NumberField
                  label='footerHeight (deprecated)'
                  value={footerHeight}
                  min={22}
                  onChange={setFooterHeight}
                />
                <NumberField label='itemHeight' value={itemHeight} min={10} onChange={setItemHeight} />
                <NumberField label='itemPadding' value={itemPadding} min={0} onChange={setItemPadding} />
                <NumberField
                  label='frozenColumnIndex'
                  value={frozenColumnIndex}
                  min={0}
                  max={6}
                  onChange={setFrozenColumnIndex}
                />
                <NumberField
                  label='frozenRowCount'
                  value={frozenRowCount}
                  min={0}
                  max={8}
                  onChange={setFrozenRowCount}
                />
                <Form.Item className='playground-field-wide' label='variant'>
                  <Select
                    value={variant}
                    onChange={setVariant}
                    options={[
                      { value: 'default', label: 'default' },
                      { value: 'vertical-bordered', label: 'vertical-bordered' },
                    ]}
                  />
                </Form.Item>
                <div className='playground-field-wide'>
                  <ToggleField
                    label={t('footerHeight를 대신 사용', 'Use footerHeight instead')}
                    checked={useLegacyFooter}
                    onChange={setUseLegacyFooter}
                  />
                </div>
              </div>
            ),
          },
          {
            key: 'data',
            label: 'Data, columns & advanced modes',
            children: (
              <div className='playground-field-grid'>
                <Form.Item className='playground-field-wide' label='data'>
                  <Select
                    value={dataset}
                    onChange={value => {
                      setDataset(value);
                      setData(value === 'primary' ? (isEn ? englishPrimaryData : primaryData) : (isEn ? englishCompactData : compactData));
                      setLastEvent(`data changed: ${value}`);
                    }}
                    options={[
                      { value: 'primary', label: '500 rows' },
                      { value: 'compact', label: '40 rows' },
                    ]}
                  />
                </Form.Item>
                <Form.Item className='playground-field-wide' label='columnsGroup / columnGroups'>
                  <Select
                    value={groupMode}
                    onChange={setGroupMode}
                    options={[
                      { value: 'none', label: 'None' },
                      { value: 'columnGroups', label: 'columnGroups (nested)' },
                      { value: 'columnsGroup', label: 'columnsGroup (deprecated)' },
                    ]}
                  />
                </Form.Item>
                <ToggleField label={t('빈 data', 'Empty data')} checked={emptyData} onChange={setEmptyData} />
                <ToggleField label='pivot' checked={pivotEnabled} onChange={setPivotEnabled} />
                <ToggleField label='dataControl' checked={dataControlEnabled} onChange={setDataControlEnabled} />
                <ToggleField label='icons' checked={customIcons} onChange={setCustomIcons} />
              </div>
            ),
          },
          {
            key: 'state',
            label: 'State, message & styles',
            children: (
              <div className='playground-field-grid'>
                <ToggleField label='loading' checked={loading} onChange={setLoading} />
                <ToggleField label='spinning' checked={spinning} onChange={setSpinning} />
                <NumberField label='scrollTop' value={scrollTop} min={0} onChange={setScrollTop} />
                <NumberField label='scrollLeft' value={scrollLeft} min={0} onChange={setScrollLeft} />
                <Form.Item className='playground-field-wide' label='msg.emptyList'>
                  <Input value={emptyMessage} onChange={event => setEmptyMessage(event.target.value)} />
                </Form.Item>
                <Form.Item className='playground-field-wide' label='rowKey / selectedRowKey'>
                  <Select
                    allowClear
                    placeholder={t('선택 행 없음', 'No selected row')}
                    value={selectedRowKey}
                    onChange={setSelectedRowKey}
                    options={data.slice(0, 12).map(item => ({ value: item.values.id, label: item.values.id }))}
                  />
                </Form.Item>
                <ToggleField label='className' checked={customClassName} onChange={setCustomClassName} />
                <ToggleField label='style' checked={customStyle} onChange={setCustomStyle} />
              </div>
            ),
          },
          {
            key: 'bars',
            label: 'Page, status & scrollbars',
            children: (
              <div className='playground-field-grid'>
                <ToggleField label='page' checked={pageEnabled} onChange={setPageEnabled} />
                <ToggleField label='page.loading' checked={pageLoading} onChange={setPageLoading} />
                <NumberField label='currentPage' value={currentPage} min={1} onChange={setCurrentPage} />
                <NumberField label='pageSize' value={pageSize} min={1} onChange={setPageSize} />
                <NumberField label='totalPages' value={totalPages} min={1} onChange={setTotalPages} />
                <NumberField
                  label='displayPaginationLength'
                  value={paginationLength}
                  min={1}
                  onChange={setPaginationLength}
                />
                <Form.Item className='playground-field-wide' label='scrollbar.variant'>
                  <Select
                    value={scrollbarVariant}
                    onChange={setScrollbarVariant}
                    options={['native', 'classic', 'modern'].map(value => ({ value, label: value }))}
                  />
                </Form.Item>
                <ToggleField label='status.visible' checked={statusVisible} onChange={setStatusVisible} />
                <ToggleField label='status.content' checked={customStatus} onChange={setCustomStatus} />
                <ToggleField label='pagination.visible' checked={paginationVisible} onChange={setPaginationVisible} />
                <ToggleField
                  label='horizontal.visible'
                  checked={horizontalScrollbar}
                  onChange={setHorizontalScrollbar}
                />
                <ToggleField label='vertical.visible' checked={verticalScrollbar} onChange={setVerticalScrollbar} />
                <ToggleField label='enableLoadMore' checked={loadMoreEnabled} onChange={setLoadMoreEnabled} />
              </div>
            ),
          },
          {
            key: 'interaction',
            label: 'Selection, editing & row behavior',
            children: (
              <div className='playground-field-grid'>
                <Form.Item className='playground-field-wide' label='rowChecked'>
                  <Select
                    value={rowCheckedMode}
                    onChange={setRowCheckedMode}
                    options={[
                      { value: 'none', label: 'none' },
                      { value: 'indexes', label: 'checkedIndexes' },
                      { value: 'rowKeys', label: 'checkedRowKeys' },
                      { value: 'radio', label: 'radio' },
                    ]}
                  />
                </Form.Item>
                <ToggleField label='showLineNumber' checked={showLineNumber} onChange={setShowLineNumber} />
                <ToggleField label='editable' checked={editable} onChange={setEditable} />
                <Form.Item className='playground-field-wide' label='editTrigger'>
                  <Select
                    value={editTrigger}
                    onChange={setEditTrigger}
                    options={[
                      { value: 'click', label: 'click' },
                      { value: 'dblclick', label: 'dblclick' },
                    ]}
                  />
                </Form.Item>
                <ToggleField label='getRowClassName' checked={rowClassNameEnabled} onChange={setRowClassNameEnabled} />
                <ToggleField label='cellMergeOptions' checked={cellMergeEnabled} onChange={setCellMergeEnabled} />
                <ToggleField label='columnSortable' checked={columnSortable} onChange={setColumnSortable} />
                <ToggleField label='sort.multiSort' checked={multiSort} onChange={setMultiSort} />
                <ToggleField label='reorder' checked={reorderEnabled} onChange={setReorderEnabled} />
                <ToggleField
                  label='reorderingInfo'
                  checked={reorderingInfoEnabled}
                  onChange={setReorderingInfoEnabled}
                />
                <Form.Item className='playground-field-wide' label='summary'>
                  <Select
                    value={summaryPosition}
                    onChange={setSummaryPosition}
                    options={[
                      { value: 'none', label: 'none' },
                      { value: 'top', label: 'top' },
                      { value: 'bottom', label: 'bottom' },
                    ]}
                  />
                </Form.Item>
              </div>
            ),
          },
          {
            key: 'navigation',
            label: 'Cell navigation & clipboard',
            children: (
              <div className='playground-field-grid'>
                <ToggleField
                  label='selection.enabled'
                  checked={cellSelectionEnabled}
                  onChange={setCellSelectionEnabled}
                />
                <ToggleField label='clearOnEscape' checked={clearOnEscape} onChange={setClearOnEscape} />
                <ToggleField
                  label='clearOnOutsideClick'
                  checked={clearOnOutsideClick}
                  onChange={setClearOnOutsideClick}
                />
                <ToggleField label='createRowOnPaste' checked={createRowOnPaste} onChange={setCreateRowOnPaste} />
                <NumberField
                  label='maxClipboardCells'
                  value={maxClipboardCells}
                  min={1}
                  onChange={setMaxClipboardCells}
                />
                <NumberField
                  label='maxClipboardTextLength'
                  value={maxClipboardTextLength}
                  min={1}
                  onChange={setMaxClipboardTextLength}
                />
                <ToggleField label='navigation.enabled' checked={navigationEnabled} onChange={setNavigationEnabled} />
                <ToggleField label='navigation.wrap' checked={navigationWrap} onChange={setNavigationWrap} />
                <ToggleField label='editOnEnter' checked={editOnEnter} onChange={setEditOnEnter} />
                <NumberField
                  label='activeCell.rowIndex'
                  value={activeCell?.rowIndex ?? 0}
                  min={0}
                  onChange={rowIndex =>
                    setActiveCell(current => ({ rowIndex, columnIndex: current?.columnIndex ?? 0 }))
                  }
                />
                <NumberField
                  label='activeCell.columnIndex'
                  value={activeCell?.columnIndex ?? 0}
                  min={0}
                  max={6}
                  onChange={columnIndex =>
                    setActiveCell(current => ({ rowIndex: current?.rowIndex ?? 0, columnIndex }))
                  }
                />
              </div>
            ),
          },
        ]}
      />
    </Form>
  );

  const preview = (
    <div className='playground-preview-grid'>
      <div className='props-preview-note'>
        <strong>Product inventory</strong>
        <span>
          {width} × {height}px
        </span>
      </div>
      <BGrid<ProductRow>
        width={width}
        height={height}
        headerHeight={headerHeight}
        footerHeight={useLegacyFooter ? footerHeight : undefined}
        bottomBarHeight={useLegacyFooter ? undefined : bottomBarHeight}
        summaryHeight={summaryHeight}
        itemHeight={itemHeight}
        itemPadding={itemPadding}
        frozenColumnIndex={frozenColumnIndex}
        frozenRowCount={frozenRowCount}
        columns={effectiveColumns}
        columnsGroup={groupMode === 'columnsGroup' ? legacyColumnGroups.map(group => ({ ...group, label: isEn ? ({ '상품 정보': 'Product information', '일정': 'Schedule', '재고 및 가격': 'Inventory and price' } as Record<string, string>)[String(group.label ?? '')] : group.label })) : undefined}
        columnGroups={groupMode === 'columnGroups' ? nestedColumnGroups.map(group => ({ ...group, label: isEn ? ({ '상품 정보': 'Product information', '일정': 'Schedule', '재고 및 가격': 'Inventory and price' } as Record<string, string>)[String(group.label)] : group.label })) : undefined}
        onChangeColumns={(columnIndex, info) => {
          setColumns(info.columns);
          setLastEvent(`onChangeColumns: ${columnIndex ?? 'all'} / ${info.width ?? '-'}`);
        }}
        data={gridData}
        onChangeData={(index, columnIndex, values) => {
          setData(current => current.map((item, rowIndex) => (rowIndex === index ? { ...item, values } : item)));
          setLastEvent(`onChangeData: row ${index}, column ${columnIndex ?? '-'}`);
        }}
        page={
          pageEnabled
            ? {
                currentPage,
                pageSize,
                totalPages,
                totalElements: gridData.length,
                loading: pageLoading,
                displayPaginationLength: paginationLength,
                onChange: (pageNo, nextPageSize) => {
                  setCurrentPage(pageNo);
                  if (nextPageSize) setPageSize(nextPageSize);
                  setLastEvent(`page.onChange: ${pageNo} / ${nextPageSize ?? pageSize}`);
                },
              }
            : undefined
        }
        enableLoadMore={loadMoreEnabled}
        onLoadMore={({ scrollTop, scrollLeft }) => setLastEvent(`onLoadMore: ${scrollTop} / ${scrollLeft}`)}
        endLoadMoreRender={loadMoreEnabled ? () => <>{t('마지막 데이터입니다.', 'End of data.')}</> : undefined}
        scrollbar={{
          variant: scrollbarVariant,
          horizontal: { visible: horizontalScrollbar },
          vertical: { visible: verticalScrollbar },
        }}
        status={{
          visible: statusVisible,
          content: customStatus
            ? ({ totalItems, visibleItems }) => isEn ? `${totalItems} total · ${visibleItems} visible` : `전체 ${totalItems}개 · 화면 ${visibleItems}개`
            : undefined,
        }}
        pagination={{ visible: paginationVisible }}
        className={customClassName ? 'props-change-grid-custom' : undefined}
        style={customStyle ? { boxShadow: '0 0 0 3px rgba(37, 99, 235, .18)' } : undefined}
        loading={loading}
        spinning={spinning}
        scrollTop={scrollTop}
        scrollLeft={scrollLeft}
        rowChecked={rowChecked}
        sort={{
          multiSort,
          sortParams,
          onChange: next => {
            setSortParams(next);
            setLastEvent(`sort.onChange: ${next.map(item => `${item.key}:${item.orderBy}`).join(', ') || 'clear'}`);
          },
        }}
        onClick={({ index, columnIndex, item }) => {
          setSelectedRowKey(item.id);
          setLastEvent(`onClick: ${index} / ${columnIndex} / ${item.id}`);
        }}
        msg={{ emptyList: emptyMessage }}
        rowKey='id'
        selectedRowKey={selectedRowKey}
        editable={editable}
        editTrigger={editTrigger}
        showLineNumber={showLineNumber}
        getRowClassName={
          rowClassNameEnabled
            ? (rowIndex, item) => (rowIndex < 2 ? 'notice-tr' : item.values.quantity > 80 ? 'high-qty-tr' : undefined)
            : undefined
        }
        cellMergeOptions={cellMergeEnabled ? { columnsMap: { 2: { mergeBy: 'category' } } } : undefined}
        cellSelectionOptions={{
          enabled: cellSelectionEnabled,
          clearOnEscape,
          clearOnOutsideClick,
          maxClipboardCells,
          maxClipboardTextLength,
          onCopyError: error => setLastEvent(`cellSelection.onCopyError: ${error.reason}`),
          onPasteError: error => setLastEvent(`cellSelection.onPasteError: ${error.reason}`),
          createRowOnPaste: createRowOnPaste
            ? ({ rowIndex }) => ({
                status: BGridDataItemStatus.new,
                values: {
                  id: `PASTE-${rowIndex + 1}`,
                  product: '',
                  category: 'Office',
                  supplier: 'AXISJ',
                  salesStatus: t('입고 예정', 'Incoming'),
                  registeredAt: '2026-08-19',
                  updatedAt: '2026-08-19',
                  quantity: 0,
                  safetyStock: 10,
                  price: 0,
                  warehouse: 'Seoul',
                  manager: isEn ? ['Jordan Jang', 'Ian Kook', 'Dylan Jung', 'Avery Yang'][rowIndex % 4] : playgroundManagers[rowIndex % playgroundManagers.length],
                },
              })
            : undefined,
        }}
        cellNavigationOptions={{
          enabled: navigationEnabled,
          activeCell,
          wrap: navigationWrap,
          editOnEnter,
          onActiveCellChange: cell => {
            setActiveCell(cell);
            if (cell) setLastEvent(`activeCell: ${cell.rowIndex} / ${cell.columnIndex}`);
          },
        }}
        variant={variant}
        summary={summary}
        columnSortable={columnSortable}
        reorder={
          reorderEnabled
            ? {
                enabled: true,
                onReorder: nextData => {
                  setData(nextData);
                  setLastEvent(`reorder.onReorder: ${nextData.length} rows`);
                  return true;
                },
              }
            : undefined
        }
        reorderingInfo={reorderingInfoEnabled ? { fromIndex: 1, toIndex: 4 } : undefined}
        pivot={pivot}
        dataControl={dataControl}
        icons={
          customIcons
            ? {
                sortAsc: <span aria-hidden='true'>↑</span>,
                sortDesc: <span aria-hidden='true'>↓</span>,
                filter: <span aria-hidden='true'>◇</span>,
                dropdown: <span aria-hidden='true'>⋯</span>,
              }
            : undefined
        }
      />
    </div>
  );

  return (
    <PlaygroundWorkspace
      eyebrow='Props studio'
      title={t('데이터 그리드 설정', 'DataGrid configuration')}
      description={t('공개 props를 기능별로 조정하고 이벤트와 렌더링 결과를 함께 확인합니다.', 'Adjust public props by feature and inspect events and rendered results together.')}
      controls={controls}
      preview={preview}
      source={source}
      sourceTitle={t('현재 Props 소스 코드', 'Current props source')}
      locale={locale}
    />
  );
}
