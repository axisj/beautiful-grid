import { t } from './i18n';
import * as React from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { BGridChangeDataMeta, BGridColumn, BGridColumnGroup, BGridDataItem } from 'beautiful-grid';
import { BGridDataItemStatus } from 'beautiful-grid';
import { createDateEditorPlugin, createSelectEditorPlugin } from 'beautiful-grid/editors';
import { createAntdSelectEditorPlugin } from './editor-plugins/createAntdSelectEditorPlugin';

export interface Item {
  uuid: string;
  code: string;
  customerName: string;
  useYn: 'Y' | 'N';
  deliveryDate: string;
  priority: 'low' | 'normal' | 'high';
}

const useYnEditor = createSelectEditorPlugin<Item, Item['useYn']>({
  id: 'use-yn',
  ariaLabel: t('사용 여부 편집', 'Edit Usage Status'),
  options: [
    { value: 'Y', label: t('사용', 'Used') },
    { value: 'N', label: t('사용 안 함', 'Not Used') },
  ],
});

const deliveryDateEditor = createDateEditorPlugin<Item>({
  id: 'delivery-date',
  ariaLabel: t('납기일 편집', 'Edit Delivery Date'),
});

const priorityEditor = createAntdSelectEditorPlugin<Item, Item['priority']>({
  id: 'priority-antd',
  ariaLabel: t('우선순위 편집', 'Edit Priority'),
  options: [
    { value: 'low', label: t('낮음', 'Low') },
    { value: 'normal', label: t('보통', 'Normal') },
    { value: 'high', label: t('높음', 'High') },
  ],
});

function createInitialData(): BGridDataItem<Item>[] {
  return [
    {
      values: {
        uuid: uuidv4(),
        code: 'ORD-2401',
        customerName: t('서울상사', 'Seoul Sangsa'),
        useYn: 'Y',
        deliveryDate: '2026-08-21',
        priority: 'high',
      },
    },
    {
      values: {
        uuid: uuidv4(),
        code: 'ORD-2402',
        customerName: t('한빛물산', 'Hanbit Mulsan'),
        useYn: 'Y',
        deliveryDate: '2026-08-25',
        priority: 'normal',
      },
    },
    {
      values: {
        uuid: uuidv4(),
        code: 'ORD-2403',
        customerName: 'Northwind',
        useYn: 'N',
        deliveryDate: '2026-09-02',
        priority: 'low',
      },
    },
  ];
}

export default function useEditorGrid() {
  const [list, setList] = React.useState<BGridDataItem<Item>[]>(createInitialData);
  const [colWidths, setColWidths] = React.useState<number[]>([]);
  const [checkedKeys, setCheckedKeys] = React.useState<React.Key[]>([]);
  const [selectedRowKey, setSelectedRowKey] = React.useState('');

  const handleColumnsChange = React.useCallback(
    (
      _columnIndex: number | null,
      { columns }: { width?: number; columns: BGridColumn<any>[]; columnsGroup?: BGridColumnGroup[] },
    ) => {
      setColWidths(columns.map(column => column.width));
    },
    [],
  );

  const handleAddList = React.useCallback(() => {
    setList(current => [
      ...current,
      {
        status: BGridDataItemStatus.new,
        values: {
          uuid: uuidv4(),
          code: `ORD-${2401 + current.length}`,
          customerName: t('새 고객', 'New Customer'),
          useYn: 'Y',
          deliveryDate: '2026-09-10',
          priority: 'normal',
        },
      },
    ]);
  }, []);

  const handleRemoveList = React.useCallback(() => {
    setList(
      current =>
        current
          .map(item => {
            if (!checkedKeys.includes(item.values.uuid)) return item;
            if (item.status === BGridDataItemStatus.new) return false;
            return { ...item, status: BGridDataItemStatus.remove };
          })
          .filter(Boolean) as BGridDataItem<Item>[],
    );
    setCheckedKeys([]);
  }, [checkedKeys]);

  const handleCommitList = React.useCallback(() => {
    setList(current =>
      current
        .filter(item => item.status !== BGridDataItemStatus.remove)
        .map(item =>
          item.status === undefined &&
          item.editedColumnIds === undefined &&
          item.changedKeys === undefined
            ? item
            : { ...item, status: undefined, editedColumnIds: undefined, changedKeys: undefined },
        ),
    );
    setCheckedKeys([]);
  }, []);

  const createRowOnPaste = React.useCallback(
    (): BGridDataItem<Item> => ({
      status: BGridDataItemStatus.new,
      values: {
        uuid: uuidv4(),
        code: '',
        customerName: '',
        useYn: 'Y',
        deliveryDate: '2026-09-10',
        priority: 'normal',
      },
    }),
    [],
  );

  const handleDataChange = React.useCallback((index: number, values: Item, meta?: BGridChangeDataMeta<Item>) => {
    setList(current => {
      const next = [...current];
      if (index < next.length) {
        next[index] = meta?.dataItem ?? { ...next[index], values };
      } else if (index === next.length) {
        next.push(meta?.dataItem ?? { status: BGridDataItemStatus.new, values });
      }
      return next;
    });
  }, []);

  const columns = React.useMemo(
    () =>
      (
        [
          {
            key: 'code',
            label: '주문 코드 · 내장 text',
            width: 170,
            editable: true,
            editor: {
              type: 'text',
              inputProps: { maxLength: 20, autoComplete: 'off' },
            },
          },
          {
            key: 'customerName',
            label: '고객명 · 한글 직접 입력',
            width: 190,
            editable: true,
            editor: {
              type: 'text',
              inputProps: { maxLength: 50, autoComplete: 'off' },
            },
          },
          {
            key: 'useYn',
            label: '사용 여부 · 기본 plugin',
            width: 160,
            editable: true,
            editor: useYnEditor,
            itemRender: ({ value }) => (value === 'Y' ? t('사용', 'Used') : t('사용 안 함', 'Not Used')),
          },
          {
            key: 'deliveryDate',
            label: '납기일 · 기본 plugin',
            width: 170,
            editable: true,
            editor: deliveryDateEditor,
          },
          {
            key: 'priority',
            label: '우선순위 · AntD plugin',
            width: 180,
            editable: true,
            editor: priorityEditor,
            itemRender: ({ value }) =>
              ({ low: t('낮음', 'Low'), normal: t('보통', 'Normal'), high: t('높음', 'High') })[value as 'low' | 'normal' | 'high'] ?? value,
          },
          {
            key: 'uuid',
            label: t('읽기 전용 UUID', 'Read-only UUID'),
            width: 250,
            editable: false,
          },
        ] as BGridColumn<Item>[]
      ).map((column, columnIndex) => ({
        ...column,
        width: colWidths[columnIndex] ?? column.width,
      })),
    [colWidths],
  );

  return {
    handleColumnsChange,
    columns,
    list,
    handleAddList,
    checkedKeys,
    setCheckedKeys,
    selectedRowKey,
    setSelectedRowKey,
    handleRemoveList,
    handleCommitList,
    createRowOnPaste,
    handleDataChange,
  };
}
