import type { BGridChangeDataMeta, BGridColumn, BGridDataItem } from 'beautiful-grid';
import './editingExamples.css';

export interface EditingOrder {
  id: string;
  orderCode: string;
  customerCode: string;
  customerName: string;
  customerGrade: '일반' | '우수' | 'VIP';
  status: '접수' | '진행' | '완료';
  deliveryDate: string;
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
      customerName: '서울상사',
      customerGrade: 'VIP',
      status: '접수',
      deliveryDate: '2026-08-25',
      quantity: 2,
      unitPrice: 12000,
      amount: 24000,
      note: '오전 배송',
      mergeGroup: 'A',
    },
  },
  {
    values: {
      id: 'ORDER-002',
      orderCode: 'ORD-2602',
      customerCode: 'C001',
      customerName: '서울상사',
      customerGrade: 'VIP',
      status: '진행',
      deliveryDate: '2026-08-26',
      quantity: 3,
      unitPrice: 18000,
      amount: 54000,
      note: '담당자 확인',
      mergeGroup: 'A',
    },
  },
  {
    values: {
      id: 'ORDER-003',
      orderCode: 'ORD-2603',
      customerCode: 'C002',
      customerName: '한빛물산',
      customerGrade: '우수',
      status: '완료',
      deliveryDate: '2026-08-28',
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
      customerGrade: '일반',
      status: '접수',
      deliveryDate: '2026-09-01',
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
