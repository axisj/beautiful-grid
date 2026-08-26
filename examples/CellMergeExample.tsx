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
  { mainCategory: '가전/디지털', subCategory: '컴퓨터 주변기기', itemCode: 'IT-001', itemName: '프리미엄 무선 키보드', unitPrice: 129000, stockQty: 84, warehouse: 'A-01' },
  { mainCategory: '가전/디지털', subCategory: '컴퓨터 주변기기', itemCode: 'IT-002', itemName: '인체공학 마우스', unitPrice: 69000, stockQty: 46, warehouse: 'A-01' },
  { mainCategory: '가전/디지털', subCategory: '컴퓨터 주변기기', itemCode: 'IT-003', itemName: 'USB-C 멀티 허브', unitPrice: 89000, stockQty: 31, warehouse: 'A-02' },
  { mainCategory: '가전/디지털', subCategory: '모니터/디스플레이', itemCode: 'IT-004', itemName: '27인치 QHD 모니터', unitPrice: 389000, stockQty: 18, warehouse: 'B-01' },
  { mainCategory: '가전/디지털', subCategory: '모니터/디스플레이', itemCode: 'IT-005', itemName: '32인치 4K 모니터', unitPrice: 629000, stockQty: 9, warehouse: 'B-01' },
  { mainCategory: '가구/인테리어', subCategory: '사무용 가구', itemCode: 'FN-001', itemName: '모션 데스크 1400', unitPrice: 459000, stockQty: 22, warehouse: 'C-01' },
  { mainCategory: '가구/인테리어', subCategory: '사무용 가구', itemCode: 'FN-002', itemName: '인체공학 메시 의자', unitPrice: 329000, stockQty: 37, warehouse: 'C-01' },
  { mainCategory: '가구/인테리어', subCategory: '수납 가구', itemCode: 'FN-003', itemName: '이동식 서랍장', unitPrice: 119000, stockQty: 41, warehouse: 'C-02' },
  { mainCategory: '가구/인테리어', subCategory: '수납 가구', itemCode: 'FN-004', itemName: '5단 철제 선반', unitPrice: 149000, stockQty: 26, warehouse: 'C-02' },
  { mainCategory: '생활/주방', subCategory: '홈카페', itemCode: 'KT-001', itemName: '전자동 커피머신', unitPrice: 749000, stockQty: 12, warehouse: 'D-01' },
  { mainCategory: '생활/주방', subCategory: '홈카페', itemCode: 'KT-002', itemName: '온도조절 전기포트', unitPrice: 99000, stockQty: 53, warehouse: 'D-01' },
  { mainCategory: '생활/주방', subCategory: '조리도구', itemCode: 'KT-003', itemName: '스테인리스 팬 세트', unitPrice: 189000, stockQty: 29, warehouse: 'D-02' },
];

const data: BGridDataItem<InventoryItem>[] = inventoryRows.map(values => ({ values }));

function CellMergeExample() {
  const [columns, setColumns] = React.useState<BGridColumn<InventoryItem>[]>([
    { key: 'mainCategory', label: '대분류', width: 130, align: 'center' },
    { key: 'subCategory', label: '중분류', width: 150, align: 'center' },
    { key: 'itemCode', label: '품목코드', width: 100, align: 'center' },
    { key: 'itemName', label: '품목명', width: 220 },
    {
      key: 'unitPrice',
      label: '단가',
      width: 120,
      align: 'right',
      itemRender: ({ values }) => <>{values.unitPrice.toLocaleString()}원</>,
    },
    { key: 'stockQty', label: '재고', width: 80, align: 'right', itemRender: ({ values }) => <>{values.stockQty}개</> },
    { key: 'warehouse', label: '창고', width: 90, align: 'center' },
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
