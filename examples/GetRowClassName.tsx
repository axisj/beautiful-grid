import { t } from './i18n';
import * as React from 'react';
import { BGrid, BGridColumn, BGridDataItem } from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';

interface InventoryRisk {
  sku: string;
  productName: string;
  warehouse: string;
  stock: number;
  safetyStock: number;
  inboundDate: string;
}

const productNames = [t('고속 충전 어댑터 65W', 'Fast Charging Adapter 65W'), t('무선 블루투스 이어폰', 'Wireless Bluetooth Earbuds'), t('강화유리 필름', 'Tempered Glass Film'), t('태블릿 마그네틱 거치대', 'Tablet Magnetic Stand'), t('USB-C 케이블', 'USB-C Cable')];
const data: BGridDataItem<InventoryRisk>[] = Array.from({ length: 120 }, (_, index) => {
  const safetyStock = 10 + (index % 4) * 5;
  const stock = index % 13 === 0 ? 0 : (index * 7) % 65;
  return {
    values: {
      sku: `INV-${String(index + 1).padStart(5, '0')}`,
      productName: productNames[index % productNames.length],
      warehouse: `${t('센터', 'Center')} ${String.fromCharCode(65 + (index % 4))}`,
      stock,
      safetyStock,
      inboundDate: stock < safetyStock ? `2026-08-${String((index % 7) + 24).padStart(2, '0')}` : '-',
    },
  };
});

export default function GetRowClassName() {
  const [columns, setColumns] = React.useState<BGridColumn<InventoryRisk>[]>([
    { key: 'sku', label: t('품목코드', 'Item Code'), width: 110, align: 'center' },
    { key: 'productName', label: t('품목명', 'Item Name'), width: 240 },
    { key: 'warehouse', label: t('보관센터', 'Storage Center'), width: 100, align: 'center' },
    { key: 'stock', label: t('현재 재고', 'Current Stock'), width: 100, align: 'right', itemRender: ({ values }) => <strong>{values.stock}{t('개', 'ea')}</strong> },
    { key: 'safetyStock', label: t('안전 재고', 'Safety Stock'), width: 100, align: 'right', itemRender: ({ values }) => <>{values.safetyStock}{t('개', 'ea')}</> },
    {
      key: 'inboundDate',
      label: t('입고 예정일', 'Expected Arrival Date'),
      width: 120,
      align: 'center',
      itemRender: ({ values }) => <>{values.stock === 0 ? t('품절 · 긴급 발주', 'Out of stock · Emergency order') : values.inboundDate}</>,
    },
  ]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  return (
    <DataGridContainer ref={containerRef} className='get-row-class-example'>
      <BGrid<InventoryRisk>
        showLineNumber
        width={width}
        height={height}
        headerHeight={35}
        data={data}
        columns={columns}
        rowKey='sku'
        onChangeColumns={(_columnIndex, { columns }) => setColumns(columns)}
        getRowClassName={(_rowIndex, item) => {
          if (item.values.stock === 0) return 'row-out-of-stock';
          if (item.values.stock < item.values.safetyStock) return 'row-low-stock';
          return undefined;
        }}
      />
    </DataGridContainer>
  );
}
