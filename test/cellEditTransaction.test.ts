import { describe, expect, it } from 'vitest';
import { BGridDataItemStatus, type AppModelColumn } from '../beautiful-grid/types';
import {
  applyChangesToItem,
  createNextValues,
  resolveCellValueChanges,
} from '../beautiful-grid/utils/cellEditTransaction';
import { getColumnKeyToken } from '../beautiful-grid/utils/getColumnId';
import { clearCellChangeState } from '../beautiful-grid/utils/cellEditState';

interface Row {
  id: number;
  customer: { code: string; name: string };
  amount: number;
}

function column(
  key: AppModelColumn<Row>['key'],
  columnId: string,
  editable = true,
): AppModelColumn<Row> {
  return {
    key,
    keyToken: getColumnKeyToken(key),
    columnId,
    label: columnId,
    width: 100,
    left: 0,
    editable,
  };
}

describe('cell edit transactions', () => {
  const columns = [
    column('id', 'id', false),
    column(['customer', 'code'], 'customer-code'),
    column(['customer', 'name'], 'customer-name'),
    column('amount', 'amount', false),
  ];

  it('resolves nested keys and applies immutable previews', () => {
    const values: Row = { id: 1, customer: { code: 'C001', name: 'Alpha' }, amount: 100 };
    const resolved = resolveCellValueChanges<Row>(
      [{ key: ['customer', 'name'], value: 'Beta' }],
      columns,
    );
    const nextValues = createNextValues(values, resolved);

    expect(nextValues).toEqual({ ...values, customer: { ...values.customer, name: 'Beta' } });
    expect(nextValues).not.toBe(values);
    expect(nextValues.customer).not.toBe(values.customer);
    expect(values.customer.name).toBe('Alpha');
  });

  it('uses the last change for the same target and allows derived read-only targets', () => {
    const item = { values: { id: 1, customer: { code: 'C001', name: 'Alpha' }, amount: 100 } };
    const resolved = resolveCellValueChanges<Row>(
      [
        { columnId: 'amount', value: 200 },
        { key: 'amount', value: 300 },
      ],
      columns,
    );
    const applied = applyChangesToItem(item, resolved);

    expect(applied.item.values.amount).toBe(300);
    expect(applied.item.status).toBe(BGridDataItemStatus.edit);
    expect(applied.item.editedColumnIds).toEqual(['key:string:amount']);
    expect(applied.item.changedKeys).toEqual(['key:string:amount']);
    expect(item.values.amount).toBe(100);
  });

  it('rejects unknown and ambiguous targets before changing rows', () => {
    expect(() => resolveCellValueChanges<Row>([{ key: 'missing', value: 1 }], columns)).toThrow(
      'Unknown cell change target',
    );

    const ambiguousColumns = [...columns, column('amount', 'second-amount')];
    expect(() => resolveCellValueChanges<Row>([{ key: 'amount', value: 1 }], ambiguousColumns)).toThrow(
      'Ambiguous cell change target',
    );
  });

  it('keeps a row wrapper unchanged for a no-op commit', () => {
    const item = { values: { id: 1, customer: { code: 'C001', name: 'Alpha' }, amount: 100 } };
    const resolved = resolveCellValueChanges<Row>([{ key: 'amount', value: 100 }], columns);
    const applied = applyChangesToItem(item, resolved);

    expect(applied.item).toBe(item);
    expect(applied.changes).toEqual([]);
  });

  it('clears edited column and changed data key state together after persistence', () => {
    const item = {
      values: { id: 1, customer: { code: 'C001', name: 'Alpha' }, amount: 100 },
      editedColumnIds: ['amount-editor'],
      changedKeys: ['key:string:amount'],
    };

    clearCellChangeState(item);

    expect(item.editedColumnIds).toBeUndefined();
    expect(item.changedKeys).toBeUndefined();
  });
});
