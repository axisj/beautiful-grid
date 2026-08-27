import * as React from 'react';
import { AppModelColumn, BGridDataItemStatus } from '../types';
import { useAppStore } from '../store';
import {
  createCheckboxEditorContext,
  getCellValueByRowKey,
  getColumnId,
  isCheckboxEditorDisabled,
  isCheckboxValueChecked,
} from '../utils';
import RowSelector from './RowSelector';

interface Props<T> {
  column: AppModelColumn<T>;
  columnIndex: number;
}

export function CheckboxHeaderControl<T>({ column, columnIndex }: Props<T>) {
  const data = useAppStore(state => state.data);
  const editable = useAppStore(state => state.editable);
  const sourceIndexByVisibleIndex = useAppStore(state => state.sourceIndexByVisibleIndex);
  const commitCheckboxColumn = useAppStore(state => state.commitCheckboxColumn);
  const [pending, setPending] = React.useState(false);
  const config = column.editor?.type === 'checkbox' ? column.editor : undefined;

  if (!config?.header) return null;

  const eligibleRows = data.flatMap((item, index) => {
    if (item.status === BGridDataItemStatus.remove) return [];
    const value = getCellValueByRowKey(column.key, item.values);
    const context = createCheckboxEditorContext({
      index,
      sourceIndex: sourceIndexByVisibleIndex?.[index] ?? index,
      columnIndex,
      column,
      item,
      value,
    });
    return isCheckboxEditorDisabled(config, context) ? [] : [{ value }];
  });
  const checkedCount = eligibleRows.reduce(
    (count, row) => count + (isCheckboxValueChecked(config, row.value) ? 1 : 0),
    0,
  );
  const checked = eligibleRows.length > 0 && checkedCount === eligibleRows.length;
  const indeterminate = checkedCount > 0 && checkedCount < eligibleRows.length;
  const headerConfig = typeof config.header === 'object' ? config.header : undefined;
  const disabled =
    pending || !editable || column.editable === false || headerConfig?.disabled === true || eligibleRows.length === 0;

  const handleChange = async () => {
    if (disabled) return;
    setPending(true);
    try {
      await commitCheckboxColumn(columnIndex, !checked);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[BGrid] Checkbox header commit failed.', error);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <span className='bgrid-checkbox-header-control' data-bgrid-checkbox-header='true'>
      <RowSelector
        checked={checked}
        indeterminate={indeterminate}
        disabled={disabled}
        busy={pending}
        ariaLabel={headerConfig?.ariaLabel ?? `Select all ${getColumnId(column)}`}
        handleChange={() => void handleChange()}
      />
    </span>
  );
}
