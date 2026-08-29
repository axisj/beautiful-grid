import { t } from './i18n';
import * as React from 'react';
import { BGrid, BGridColumn, BGridDataItem } from 'beautiful-grid';
import { Button, Space } from 'antd';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';

interface ProductSearchResult {
  sku: string;
  productName: string;
  category: string;
  salePrice: number;
  availableStock: number;
  syncedAt: string;
}

const categories = [t('디지털', 'Digital'), t('오피스', 'Office'), t('생활가전', 'Home Appliances'), t('홈카페', 'Home Cafe')];
const productNames = [t('프리미엄 무선 키보드', 'Premium Wireless Keyboard'), t('인체공학 마우스', 'Ergonomic Mouse'), t('USB-C 멀티 허브', 'USB-C Multi Hub'), t('온도조절 전기포트', 'Temperature Control Electric Kettle'), t('모션 데스크', 'Motion Desk')];
const products: BGridDataItem<ProductSearchResult>[] = Array.from({ length: 200 }, (_, index) => ({
  values: {
    sku: `SKU-${String(index + 1).padStart(5, '0')}`,
    productName: productNames[index % productNames.length],
    category: categories[index % categories.length],
    salePrice: 49_000 + (index % 8) * 25_000,
    availableStock: (index * 17) % 140,
    syncedAt: `2026-08-23 ${String(9 + (index % 9)).padStart(2, '0')}:${String(index % 60).padStart(2, '0')}`,
  },
}));

function LoadingExample() {
  const [loading, setLoading] = React.useState(false);
  const [spinning, setSpinning] = React.useState(false);
  const [data, setData] = React.useState(products);
  const [columns, setColumns] = React.useState<BGridColumn<ProductSearchResult>[]>([
    { key: 'sku', label: 'SKU', width: 110, align: 'center', sortDisable: true },
    { key: 'productName', label: t('상품명', 'Product Name'), width: 240 },
    { key: 'category', label: t('카테고리', 'Category'), width: 110, align: 'center' },
    { key: 'salePrice', label: t('판매가', 'Selling Price'), width: 120, align: 'right', itemRender: ({ values }) => <>{values.salePrice.toLocaleString()}{t('원', 'KRW')}</> },
    { key: 'availableStock', label: t('판매가능 재고', 'Sellable Stock'), width: 120, align: 'right', itemRender: ({ values }) => <>{values.availableStock}{t('개', 'ea')}</> },
    { key: 'syncedAt', label: t('최종 동기화', 'Last Synchronized'), width: 150, align: 'center' },
  ]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  return (
    <div>
      <Space wrap style={{ padding: '10px 0' }}>
        <Button onClick={() => setLoading(true)}>{t('전체 로딩 시작', 'Start Full Loading')}</Button>
        <Button onClick={() => setLoading(false)}>{t('전체 로딩 종료', 'End Full Loading')}</Button>
        <Button onClick={() => setSpinning(true)}>{t('그리드 처리 시작', 'Start Grid Processing')}</Button>
        <Button onClick={() => setSpinning(false)}>{t('그리드 처리 종료', 'End Grid Processing')}</Button>
        <Button onClick={() => setData([])}>{t('빈 검색 결과', 'Empty Search Results')}</Button>
        <Button onClick={() => setData(products)}>{t('상품 데이터 복원', 'Restore Product Data')}</Button>
      </Space>
      <DataGridContainer ref={containerRef}>
        <BGrid<ProductSearchResult>
          width={width}
          height={height}
          headerHeight={35}
          data={data}
          columns={columns}
          rowKey='sku'
          onChangeColumns={(_columnIndex, { columns }) => setColumns(columns)}
          loading={loading}
          spinning={spinning}
          msg={{ emptyList: t('조회 조건에 일치하는 상품이 없습니다.', 'No products match the search criteria.') }}
        />
      </DataGridContainer>
    </div>
  );
}

export default LoadingExample;
