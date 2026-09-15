import { t } from './i18n';
import * as React from 'react';
import { Button, Space, Tag } from 'antd';
import { Download, FileSpreadsheet } from 'lucide-react';
import {
  BGrid,
  type BGridColumn,
  type BGridDataItem,
  type BGridRef,
} from 'beautiful-grid';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';

interface Order {
  orderNo: string;
  customer: string;
  product: string;
  category: string;
  price: number;
  quantity: number;
  status: string;
  orderDate: string;
}

const customers = ['AxisJ Studio', 'Northwind', t('서울 물류', 'Seoul Logistics'), 'Mono Office', 'Global Tech'];
const products = [
  t('클라우드 서버 패키지', 'Cloud Server Package'),
  t('데이터베이스 라이선스', 'Database License'),
  t('보안 컨설팅 서비스', 'Security Consulting'),
  t('엔터프라이즈 모니터링', 'Enterprise Monitoring'),
  t('네트워크 방화벽 장비', 'Network Firewall Unit'),
];
const categories = ['Infrastructure', 'Software', 'Security', 'DevOps', 'Hardware'];
const statuses = [t('결제 완료', 'Paid'), t('배송 중', 'Shipping'), t('처리 완료', 'Completed'), t('보류', 'Pending')];

const data: BGridDataItem<Order>[] = Array.from({ length: 40 }, (_, index) => {
  const price = (index % 5 + 1) * 150000;
  const quantity = (index % 4) + 1;
  const month = String((index % 12) + 1).padStart(2, '0');
  const day = String((index % 28) + 1).padStart(2, '0');

  return {
    values: {
      orderNo: `ORD-2026-${String(index + 1).padStart(4, '0')}`,
      customer: customers[index % customers.length],
      product: products[index % products.length],
      category: categories[index % categories.length],
      price,
      quantity,
      status: statuses[index % statuses.length],
      orderDate: `2026-${month}-${day}`,
    },
  };
});

const columns: BGridColumn<Order>[] = [
  {
    id: 'orderNo',
    key: 'orderNo',
    label: t('주문 번호', 'Order No'),
    width: 140,
    exportHeader: 'Order Number',
    toolbox: true,
  },
  {
    id: 'customer',
    key: 'customer',
    label: t('고객사', 'Customer'),
    width: 140,
    toolbox: true,
  },
  {
    id: 'product',
    key: 'product',
    label: t('주문 품목', 'Product'),
    width: 180,
    toolbox: true,
  },
  {
    id: 'category',
    key: 'category',
    label: t('분류', 'Category'),
    width: 120,
    toolbox: true,
  },
  {
    id: 'price',
    key: 'price',
    label: t('단가', 'Unit Price'),
    width: 120,
    align: 'right',
    toolbox: true,
    itemRender: ({ value }) => `₩${Number(value).toLocaleString()}`,
    getExportValue: ({ value }) => Number(value),
  },
  {
    id: 'quantity',
    key: 'quantity',
    label: t('수량', 'Quantity'),
    width: 80,
    align: 'right',
    toolbox: true,
  },
  {
    id: 'status',
    key: 'status',
    label: t('상태', 'Status'),
    width: 110,
    align: 'center',
    toolbox: true,
    exportHeader: col => `${String(col.id).toUpperCase()} (STATUS)`,
  },
  {
    id: 'orderDate',
    key: 'orderDate',
    label: t('주문 일자', 'Order Date'),
    width: 120,
    toolbox: true,
  },
];

export default function ExportExample() {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);
  const gridRef = React.useRef<BGridRef<Order>>(null);
  const [checkedRowKeys, setCheckedRowKeys] = React.useState<React.Key[]>([]);

  const handleExportAllExcel = React.useCallback(() => {
    gridRef.current?.exportExcel({
      fileName: 'all-orders.xlsx',
      rows: 'source',
      columns: 'all',
    });
  }, []);

  const handleExportAllCsv = React.useCallback(() => {
    gridRef.current?.exportCsv({
      fileName: 'all-orders.csv',
      rows: 'source',
      columns: 'all',
    });
  }, []);

  const handleExportCheckedExcel = React.useCallback(() => {
    gridRef.current?.exportExcel({
      fileName: 'selected-orders.xlsx',
      rows: 'checked',
      columns: 'visible',
    });
  }, []);

  const handleExportCheckedCsv = React.useCallback(() => {
    gridRef.current?.exportCsv({
      fileName: 'selected-orders.csv',
      rows: 'checked',
      columns: 'visible',
    });
  }, []);

  return (
    <div className='flex min-h-0 flex-col gap-3'>
      <div className='flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700'>
        <Space wrap>
          <Button icon={<FileSpreadsheet size={14} />} type='primary' onClick={handleExportAllExcel}>
            {t('전체 로드 데이터 Excel', 'Export all loaded rows (Excel)')}
          </Button>
          <Button icon={<Download size={14} />} onClick={handleExportAllCsv}>
            {t('전체 로드 데이터 CSV', 'Export all loaded rows (CSV)')}
          </Button>
          <Button
            icon={<FileSpreadsheet size={14} />}
            disabled={checkedRowKeys.length === 0}
            onClick={handleExportCheckedExcel}
          >
            {t('선택 행 Excel', 'Export checked rows (Excel)')} ({checkedRowKeys.length})
          </Button>
          <Button
            icon={<Download size={14} />}
            disabled={checkedRowKeys.length === 0}
            onClick={handleExportCheckedCsv}
          >
            {t('선택 행 CSV', 'Export checked rows (CSV)')} ({checkedRowKeys.length})
          </Button>
        </Space>

        <div className='flex items-center gap-2'>
          <Tag color='blue'>{t('우클릭 메뉴 지원', 'Context Menu Supported')}</Tag>
          <span className='text-xs text-slate-500'>
            {t('툴박스 필터·정렬 및 컬럼 표시 설정 반영', 'Reflects toolbox filters, sorting, and visibility')}
          </span>
        </div>
      </div>

      <DataGridContainer ref={containerRef} minHeight={480}>
        <BGrid<Order>
          ref={gridRef}
          width={width}
          height={height}
          columns={columns}
          data={data}
          rowKey='orderNo'
          rowChecked={{
            checkedRowKeys,
            onChange: (_indexes, keys) => setCheckedRowKeys(keys),
          }}
          columnVisibility={true}
          contextMenuOptions={{
            items: () => [
              {
                id: 'export-all-excel',
                label: t('전체 로드 행 Excel 내보내기', 'Export all loaded rows to Excel'),
                icon: <FileSpreadsheet size={14} />,
                onSelect: () => handleExportAllExcel(),
              },
              {
                id: 'export-all-csv',
                label: t('전체 로드 행 CSV 내보내기', 'Export all loaded rows to CSV'),
                icon: <Download size={14} />,
                onSelect: () => handleExportAllCsv(),
              },
              {
                type: 'separator',
                id: 'export-sep',
              },
              {
                id: 'export-checked-excel',
                label: t('체크된 행 Excel 내보내기', 'Export checked rows to Excel'),
                icon: <FileSpreadsheet size={14} />,
                disabled: checkedRowKeys.length === 0,
                onSelect: () => handleExportCheckedExcel(),
              },
              {
                id: 'export-checked-csv',
                label: t('체크된 행 CSV 내보내기', 'Export checked rows to CSV'),
                icon: <Download size={14} />,
                disabled: checkedRowKeys.length === 0,
                onSelect: () => handleExportCheckedCsv(),
              },
            ],
          }}
        />
      </DataGridContainer>
    </div>
  );
}
