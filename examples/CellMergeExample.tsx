import { t } from './i18n';
import * as React from 'react';
import { BGrid, BGridColumn, BGridDataItem } from 'beautiful-grid';
import { useContainerSize } from '../hooks/useContainerSize';
import DataGridContainer from '../components/DataGridContainer';

interface InventoryItem {
  mainCategory: string;
  subCategory: string;
  itemCode: string;
  itemName: string;
  unitPrice: number;
  stockQty: number;
  warehouse: string;
}

const inventoryRows: InventoryItem[] = [
  { mainCategory: '가전/디지털', subCategory: t('컴퓨터 주변기기', 'Computer Peripherals'), itemCode: 'IT-001', itemName: t('프리미엄 무선 키보드', 'Premium Wireless Keyboard'), unitPrice: 129000, stockQty: 84, warehouse: 'A-01' },
  { mainCategory: '가전/디지털', subCategory: t('컴퓨터 주변기기', 'Computer Peripherals'), itemCode: 'IT-002', itemName: t('인체공학 마우스', 'Ergonomic Mouse'), unitPrice: 69000, stockQty: 46, warehouse: 'A-01' },
  { mainCategory: '가전/디지털', subCategory: t('컴퓨터 주변기기', 'Computer Peripherals'), itemCode: 'IT-003', itemName: 'USB-C 멀티 허브', unitPrice: 89000, stockQty: 31, warehouse: 'A-02' },
  { mainCategory: '가전/디지털', subCategory: '모니터/디스플레이', itemCode: 'IT-004', itemName: t('27인치 QHD 모니터', '27-inch QHD Monitor'), unitPrice: 389000, stockQty: 18, warehouse: 'B-01' },
  { mainCategory: '가전/디지털', subCategory: '모니터/디스플레이', itemCode: 'IT-005', itemName: t('32인치 4K 모니터', '32-inch 4K Monitor'), unitPrice: 629000, stockQty: 9, warehouse: 'B-01' },
  { mainCategory: '가구/인테리어', subCategory: t('사무용 가구', 'Office Furniture'), itemCode: 'FN-001', itemName: t('모션 데스크 1400', 'Motion Desk 1400'), unitPrice: 459000, stockQty: 22, warehouse: 'C-01' },
  { mainCategory: '가구/인테리어', subCategory: t('사무용 가구', 'Office Furniture'), itemCode: 'FN-002', itemName: t('인체공학 메시 의자', 'Ergonomic Mesh Chair'), unitPrice: 329000, stockQty: 37, warehouse: 'C-01' },
  { mainCategory: '가구/인테리어', subCategory: t('수납 가구', 'Storage Furniture'), itemCode: 'FN-003', itemName: t('이동식 서랍장', 'Mobile Drawer'), unitPrice: 119000, stockQty: 41, warehouse: 'C-02' },
  { mainCategory: '가구/인테리어', subCategory: t('수납 가구', 'Storage Furniture'), itemCode: 'FN-004', itemName: t('5단 철제 선반', '5-tier steel shelf'), unitPrice: 149000, stockQty: 26, warehouse: 'C-02' },
  { mainCategory: '생활/주방', subCategory: t('홈카페', 'Home Cafe'), itemCode: 'KT-001', itemName: t('전자동 커피머신', 'Fully Automatic Coffee Machine'), unitPrice: 749000, stockQty: 12, warehouse: 'D-01' },
  { mainCategory: '생활/주방', subCategory: t('홈카페', 'Home Cafe'), itemCode: 'KT-002', itemName: t('온도조절 전기포트', 'Temperature Control Electric Kettle'), unitPrice: 99000, stockQty: 53, warehouse: 'D-01' },
  { mainCategory: '생활/주방', subCategory: t('조리도구', 'Cooking Utensils'), itemCode: 'KT-003', itemName: t('스테인리스 팬 세트', 'Stainless Steel Pan Set'), unitPrice: 189000, stockQty: 29, warehouse: 'D-02' },
];

const data: BGridDataItem<InventoryItem>[] = inventoryRows.map(values => ({ values }));

function CellMergeExample() {
  const [columns, setColumns] = React.useState<BGridColumn<InventoryItem>[]>([
    { key: 'mainCategory', label: t('대분류', 'Large Category'), width: 130, align: 'center' },
    { key: 'subCategory', label: t('중분류', 'Medium Category'), width: 150, align: 'center' },
    { key: 'itemCode', label: t('품목코드', 'Item Code'), width: 100, align: 'center' },
    { key: 'itemName', label: t('품목명', 'Item Name'), width: 220 },
    {
      key: 'unitPrice',
      label: t('단가', 'Unit Price'),
      width: 120,
      align: 'right',
      itemRender: ({ values }) => <>{values.unitPrice.toLocaleString()}원</>,
    },
    { key: 'stockQty', label: t('재고', 'Stock'), width: 80, align: 'right', itemRender: ({ values }) => <>{values.stockQty}개</> },
    { key: 'warehouse', label: t('창고', 'Warehouse'), width: 90, align: 'center' },
  ]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  return (
    <DataGridContainer ref={containerRef}>
      <BGrid<InventoryItem>
        showLineNumber
        frozenColumnIndex={2}
        width={width}
        height={height}
        data={data}
        columns={columns}
        rowKey='itemCode'
        onChangeColumns={(_columnIndex, { columns }) => setColumns(columns)}
        cellMergeOptions={{
          columnsMap: {
            0: { mergeBy: 'mainCategory' },
            1: { mergeBy: 'subCategory' },
          },
        }}
        variant='vertical-bordered'
      />
    </DataGridContainer>
  );
}

export default CellMergeExample;
