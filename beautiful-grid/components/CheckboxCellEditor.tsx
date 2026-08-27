import * as React from 'react';
import { BGridColumn, BGridDataItem, BGridDataItemStatus } from '../types';
import { useAppStore } from '../store';
import {
  createCheckboxEditorContext,
  getCheckboxAriaLabel,
  getCheckboxLabel,
  isCheckboxEditorDisabled,
  isCheckboxValueChecked,
} from '../utils';
import RowSelector from './RowSelector';

interface Props<T> {
  index: number;
  columnIndex: number;
  column: BGridColumn<T>;
  item: BGridDataItem<T>;
  value: unknown;
}

export function CheckboxCellEditor<T>({ index, columnIndex, column, item, value }: Props<T>) {
  const editable = useAppStore(state => state.editable);
  const sourceIndex = useAppStore(state => state.sourceIndexByVisibleIndex?.[index] ?? index);
  const commitCheckboxCell = useAppStore(state => state.commitCheckboxCell);
  const [pending, setPending] = React.useState(false);
  const config = column.editor?.type === 'checkbox' ? column.editor : undefined;

  if (!config) return null;

  const context = createCheckboxEditorContext({
    index,
    sourceIndex,
    columnIndex,
    column,
    item,
    value,
  });
  const checked = isCheckboxValueChecked(config, value);
  const disabled =
    pending ||
    !editable ||
    column.editable === false ||
    item.status === BGridDataItemStatus.remove ||
    isCheckboxEditorDisabled(config, context);
  const label = getCheckboxLabel(config, context);
  const alignment = column.align ?? 'left';

  const handleChange = async (nextChecked: boolean) => {
    if (disabled) return;
    setPending(true);
    try {
      await commitCheckboxCell(index, columnIndex, nextChecked);
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('[BGrid] Checkbox value commit failed.', error);
      }
    } finally {
      setPending(false);
    }
  };

  return (
    <span className={`bgrid-checkbox-editor bgrid-checkbox-editor--${alignment}`} data-bgrid-checkbox-editor='true'>
      <RowSelector
        checked={checked}
        disabled={disabled}
        busy={pending}
        ariaLabel={getCheckboxAriaLabel(config, context)}
        handleChange={nextChecked => void handleChange(nextChecked)}
      />
      {label != null && <span className='bgrid-checkbox-editor-label'>{label}</span>}
    </span>
  );
}
