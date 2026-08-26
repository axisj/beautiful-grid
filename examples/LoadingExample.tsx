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

const categories = ['디지털', '오피스', '생활가전', '홈카페'];
const productNames = ['프리미엄 무선 키보드', '인체공학 마우스', 'USB-C 멀티 허브', '온도조절 전기포트', '모션 데스크'];
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
    { key: 'productName', label: '상품명', width: 240 },
    { key: 'category', label: '카테고리', width: 110, align: 'center' },
    { key: 'salePrice', label: '판매가', width: 120, align: 'right', itemRender: ({ values }) => <>{values.salePrice.toLocaleString()}원</> },
    { key: 'availableStock', label: '판매가능 재고', width: 120, align: 'right', itemRender: ({ values }) => <>{values.availableStock}개</> },
    { key: 'syncedAt', label: '최종 동기화', width: 150, align: 'center' },
  ]);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  return (
    <div>
      <Space wrap style={{ padding: '10px 0' }}>
        <Button onClick={() => setLoading(true)}>전체 로딩 시작</Button>
        <Button onClick={() => setLoading(false)}>전체 로딩 종료</Button>
        <Button onClick={() => setSpinning(true)}>그리드 처리 시작</Button>
        <Button onClick={() => setSpinning(false)}>그리드 처리 종료</Button>
        <Button onClick={() => setData([])}>빈 검색 결과</Button>
        <Button onClick={() => setData(products)}>상품 데이터 복원</Button>
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
          msg={{ emptyList: '조회 조건에 일치하는 상품이 없습니다.' }}
        />
      </DataGridContainer>
    </div>
  );
}

export default LoadingExample;
