import { t } from '../i18n';
import type { BGridChangeDataMeta, BGridColumn, BGridDataItem } from 'beautiful-grid';
import './editingExamples.css';

export interface EditingOrder {
  id: string;
  orderCode: string;
  customerCode: string;
  customerName: string;
  customerGrade: string;
  status: string;
  deliveryDate: string;
  approved: boolean;
  quantity: number;
  unitPrice: number;
  amount: number;
  note: string;
  mergeGroup: string;
}

export const editingOrders: BGridDataItem<EditingOrder>[] = [
  {
    values: {
      id: 'ORDER-001',
      orderCode: 'ORD-2601',
      customerCode: 'C001',
      customerName: t('서울상사', 'Seoul Sangsa'),
      customerGrade: 'VIP',
      status: t('접수', 'Receipt'),
      deliveryDate: '2026-08-25',
      approved: true,
      quantity: 2,
      unitPrice: 12000,
      amount: 24000,
      note: t('오전 배송', 'Morning Delivery'),
      mergeGroup: 'A',
    },
  },
  {
    values: {
      id: 'ORDER-002',
      orderCode: 'ORD-2602',
      customerCode: 'C001',
      customerName: t('서울상사', 'Seoul Sangsa'),
      customerGrade: 'VIP',
      status: t('진행', 'In Progress'),
      deliveryDate: '2026-08-26',
      approved: false,
      quantity: 3,
      unitPrice: 18000,
      amount: 54000,
      note: t('담당자 확인', 'Assignee Confirmation'),
      mergeGroup: 'A',
    },
  },
  {
    values: {
      id: 'ORDER-003',
      orderCode: 'ORD-2603',
      customerCode: 'C002',
      customerName: t('한빛물산', 'Hanbit Mulsan'),
      customerGrade: t('우수', 'Excellent'),
      status: t('완료', 'Completed'),
      deliveryDate: '2026-08-28',
      approved: true,
      quantity: 1,
      unitPrice: 32000,
      amount: 32000,
      note: '',
      mergeGroup: 'B',
    },
  },
  {
    values: {
      id: 'ORDER-004',
      orderCode: 'ORD-2604',
      customerCode: 'C003',
      customerName: 'Northwind',
      customerGrade: t('일반', 'General'),
      status: t('접수', 'Receipt'),
      deliveryDate: '2026-09-01',
      approved: false,
      quantity: 5,
      unitPrice: 9000,
      amount: 45000,
      note: '영문 송장',
      mergeGroup: 'C',
    },
  },
];

export const cloneEditingOrders = () =>
  editingOrders.map(item => ({
    ...item,
    values: { ...item.values },
    editedColumnIds: item.editedColumnIds ? [...item.editedColumnIds] : undefined,
    changedKeys: item.changedKeys ? [...item.changedKeys] : undefined,
  }));

export const applyEditingDataChange = <T,>(
  current: BGridDataItem<T>[],
  sourceIndex: number,
  values: T,
  meta?: BGridChangeDataMeta<T>,
): BGridDataItem<T>[] =>
  current.map((item, index) =>
    index === sourceIndex ? meta?.dataItem ?? { ...item, values } : item,
  );

export const withEditingCellClasses = <T,>(columns: BGridColumn<T>[]): BGridColumn<T>[] =>
  columns.map(column => ({
    ...column,
    className: [
      column.className,
      column.editable === false ? 'editing-example-cell-readonly' : 'editing-example-cell-editable',
    ]
      .filter(Boolean)
      .join(' '),
  }));
