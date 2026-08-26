import * as React from 'react';
import { AutoComplete, Input, Modal } from 'antd';
import {
  BGrid,
  type BGridColumn,
  type BGridDataItem,
  type BGridEditorIconClickParams,
  type BGridEditorPluginProps,
} from 'beautiful-grid';
import { defineEditorPlugin } from 'beautiful-grid/editors';
import DataGridContainer from '../components/DataGridContainer';
import { useContainerSize } from '../hooks/useContainerSize';
import { SearchIcon } from './editing/editorIcons';
import {
  applyEditingDataChange,
  cloneEditingOrders,
  type EditingOrder,
  withEditingCellClasses,
} from './editing/shared';
import './LookupEditorExample.css';

type Customer = Pick<EditingOrder, 'customerCode' | 'customerName' | 'customerGrade'>;

const customers: Customer[] = [
  { customerCode: 'C001', customerName: '서울상사', customerGrade: 'VIP' },
  { customerCode: 'C002', customerName: '한빛물산', customerGrade: '우수' },
  { customerCode: 'C003', customerName: 'Northwind', customerGrade: '일반' },
  { customerCode: 'C004', customerName: 'AxisJ Studio', customerGrade: '우수' },
];

const customerRows: BGridDataItem<Customer>[] = customers.map(customer => ({ values: customer }));

const toCustomerChanges = (customer: Customer) => [
  { key: 'customerCode', value: customer.customerCode },
  { key: 'customerName', value: customer.customerName },
  { key: 'customerGrade', value: customer.customerGrade },
];

function CustomerAutocompleteEditor({ value, commit, cancel, getPortalContainer }: BGridEditorPluginProps<EditingOrder>) {
  const [text, setText] = React.useState(String(value ?? ''));
  const normalizedText = text.trim().toLocaleLowerCase();
  const options = customers
    .filter(customer => {
      if (!normalizedText) return true;
      return [customer.customerName, customer.customerCode, customer.customerGrade].some(candidate =>
        candidate.toLocaleLowerCase().includes(normalizedText),
      );
    })
    .map(customer => ({
      value: customer.customerName,
      customerCode: customer.customerCode,
      label: (
        <span className='lookup-editor-autocomplete-option'>
          <strong>{customer.customerName}</strong>
          <small>{customer.customerCode} · {customer.customerGrade}</small>
        </span>
      ),
    }));

  return (
    <AutoComplete
      aria-label='고객 자동완성'
      autoFocus
      className='lookup-editor-autocomplete'
      classNames={{ popup: { root: 'lookup-editor-autocomplete-popup' } }}
      defaultActiveFirstOption
      open={options.length > 0}
      options={options}
      popupMatchSelectWidth
      size='small'
      value={text}
      variant='borderless'
      getPopupContainer={getPortalContainer}
      onChange={setText}
      onSelect={(_nextValue, option) => {
        const customer = customers.find(candidate => candidate.customerCode === option.customerCode);
        if (customer) void commit(toCustomerChanges(customer));
      }}
      onKeyDown={event => {
        if (event.key === 'Escape' || event.key === 'Esc') {
          event.preventDefault();
          cancel();
        }
      }}
    />
  );
}

const customerAutocompleteEditor = defineEditorPlugin<EditingOrder>({
  id: 'customer-autocomplete',
  component: CustomerAutocompleteEditor,
});

interface CustomerLookupModalProps {
  lookup: BGridEditorIconClickParams<EditingOrder>;
}

function CustomerLookupModal({ lookup }: CustomerLookupModalProps) {
  const [query, setQuery] = React.useState('');
  const [selectedCode, setSelectedCode] = React.useState<string>(() => String(lookup.values.customerCode ?? ''));
  const [confirming, setConfirming] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  const filteredRows = React.useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    if (!normalizedQuery) return customerRows;
    return customerRows.filter(({ values }) =>
      [values.customerName, values.customerCode, values.customerGrade].some(candidate =>
        candidate.toLocaleLowerCase().includes(normalizedQuery),
      ),
    );
  }, [query]);

  const columns = React.useMemo<BGridColumn<Customer>[]>(
    () => [
      { key: 'customerCode', label: '고객 코드', width: 130 },
      { key: 'customerName', label: '고객명', width: 260 },
      { key: 'customerGrade', label: '고객 등급', width: 120 },
    ],
    [],
  );

  const confirmSelection = async () => {
    const customer = customers.find(candidate => candidate.customerCode === selectedCode);
    if (!customer) return;
    setConfirming(true);
    try {
      await lookup.commit(toCustomerChanges(customer));
    } finally {
      setConfirming(false);
    }
  };

  return (
    <Modal
      open
      title='고객 선택'
      width={720}
      className='lookup-editor-modal'
      okText='확인'
      cancelText='취소'
      okButtonProps={{ disabled: !selectedCode }}
      confirmLoading={confirming}
      onCancel={lookup.cancel}
      onOk={() => void confirmSelection()}
    >
      <div className='lookup-editor-modal-content'>
        <Input.Search
          allowClear
          autoFocus
          aria-label='고객 검색'
          placeholder='고객명, 고객 코드 또는 등급 검색'
          value={query}
          onChange={event => setQuery(event.currentTarget.value)}
        />
        <DataGridContainer ref={containerRef} className='lookup-editor-grid' style={{ height: 280 }}>
          <BGrid<Customer>
            width={width}
            height={height}
            data={filteredRows}
            columns={columns}
            rowKey='customerCode'
            selectedRowKey={selectedCode}
            rowChecked={{
              isRadio: true,
              checkedRowKeys: selectedCode ? [selectedCode] : [],
              onChange: (_checkedIndexes, checkedRowKeys) => {
                const nextCode = checkedRowKeys[0];
                setSelectedCode(nextCode === undefined ? '' : String(nextCode));
              },
            }}
            onClick={({ item }) => setSelectedCode(item.customerCode)}
            variant='vertical-bordered'
            msg={{ emptyList: '검색 결과가 없습니다.' }}
          />
        </DataGridContainer>
      </div>
    </Modal>
  );
}

export default function LookupEditorExample() {
  const [data, setData] = React.useState(cloneEditingOrders);
  const [lookup, setLookup] = React.useState<BGridEditorIconClickParams<EditingOrder> | null>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const { width, height } = useContainerSize(containerRef);

  const columns = React.useMemo<BGridColumn<EditingOrder>[]>(
    () => withEditingCellClasses<EditingOrder>([
      { key: 'orderCode', label: '주문 코드', width: 145, editable: false },
      { key: 'customerCode', label: '고객 코드', width: 130, editable: false },
      {
        key: 'customerName',
        label: '고객명 · 자동완성/lookup',
        width: 240,
        editable: true,
        editTrigger: 'click',
        editor: customerAutocompleteEditor,
        editorIcon: {
          render: <SearchIcon />,
          ariaLabel: ({ values }) => `${values.orderCode} 고객 lookup 열기`,
          visibility: 'always',
          onClick: params => {
            setLookup(params);
            return () => setLookup(null);
          },
        },
        onChangeValue: async ({ changes, commit }) => {
          await commit(changes);
        },
      },
      { key: 'customerGrade', label: '고객 등급', width: 130, editable: false },
    ]),
    [],
  );

  return (
    <div className='relative flex min-h-0 flex-col gap-3'>
      <p className='m-0 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm leading-6 text-slate-700'>
        고객명 셀을 클릭하면 Ant Design AutoComplete가 열리고, 같은 셀의 검색 아이콘은 검색과 단일 선택 그리드를 갖춘
        Ant Design Modal을 엽니다. 고객을 확정하면 코드·이름·등급을 하나의 변경 목록으로 원자적으로 저장합니다.
      </p>
      <DataGridContainer ref={containerRef} style={{ height: 340 }}>
        <BGrid<EditingOrder>
          width={width}
          height={height}
          data={data}
          columns={columns}
          rowKey='id'
          editable
          variant='vertical-bordered'
          onChangeData={(sourceIndex, _columnIndex, values, _column, meta) => {
            setData(current => applyEditingDataChange(current, sourceIndex, values, meta));
          }}
        />
      </DataGridContainer>

      {lookup && <CustomerLookupModal lookup={lookup} />}
    </div>
  );
}
