import * as React from 'react';
import { BGridCellEditSession, BGridColumn, BGridDataItem, MoveDirection } from '../types';
import { PluginCellEditor } from './PluginCellEditor';
import { CellEditorIcon } from './CellEditorIcon';
import { CheckboxCellEditor } from './CheckboxCellEditor';

interface Props<T> {
  index: number;
  hostIndex?: number;
  columnIndex: number;
  column: BGridColumn<T>;
  item: BGridDataItem<any>;
  valueByRowKey: any;
  handleSave?: (value: any, columnDirection?: MoveDirection, rowDirection?: MoveDirection) => void;
  handleCancel?: () => void;
  handleMove?: (columnDirection: MoveDirection, rowDirection: MoveDirection) => void;
  editable?: boolean;
  cellEditable?: boolean;
  interactionEditing?: boolean;
  editSession?: BGridCellEditSession;
}

function Cell({
  index,
  hostIndex = index,
  columnIndex,
  column,
  item,
  valueByRowKey,
  handleSave,
  handleCancel,
  handleMove,
  editable,
  cellEditable,
  interactionEditing = false,
  editSession,
}: Props<any>): React.ReactElement {
  const isPluginEditorActive = Boolean(editable && editSession && column.editor?.type === 'plugin');
  let content: React.ReactNode;
  if (column.editor?.type === 'checkbox') {
    content = (
      <CheckboxCellEditor
        index={index}
        columnIndex={columnIndex}
        column={column}
        item={item}
        value={valueByRowKey}
      />
    );
  } else if (isPluginEditorActive && editSession) {
    content = (
      <PluginCellEditor
        session={editSession}
        index={index}
        columnIndex={columnIndex}
        column={column}
        item={item}
        value={valueByRowKey}
        handleCancel={handleCancel}
      />
    );
  } else if (column.itemRender) {
    const renderProps = {
      item,
      values: item.values,
      value: valueByRowKey,
      column,
      index,
      columnIndex,
      handleSave,
      handleCancel,
      handleMove,
      editable: column.editor ? false : editable,
    };

    // Guard itemRender output so plain objects do not hit React reconciliation as children.
    try {
      content = renderSafeCellValue(column.itemRender(renderProps as any), true);
    } catch {
      content = renderSafeCellValue(valueByRowKey);
    }
  } else {
    content = renderSafeCellValue(valueByRowKey);
  }

  return (
    <div
      className={
        isPluginEditorActive ? 'bgrid-cell-content bgrid-cell-content-plugin-editor' : 'bgrid-cell-content'
      }
    >
      <div className='bgrid-cell-value'>{content}</div>
      {column.editorIcon && column.editor?.type !== 'checkbox' && cellEditable && (
        <CellEditorIcon
          hostCell={{ rowIndex: hostIndex, columnIndex }}
          index={index}
          columnIndex={columnIndex}
          column={column}
          item={item}
          value={valueByRowKey}
          editing={interactionEditing}
        />
      )}
    </div>
  );
}

function renderSafeCellValue(value: unknown, preserveRenderableArrays = false): React.ReactNode {
  if (value == null) return '';
  if (React.isValidElement(value)) return value;
  if (Array.isArray(value)) {
    if (preserveRenderableArrays) {
      return value.map(entry => renderSafeCellValue(entry, preserveRenderableArrays));
    }

    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  if (
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'symbol' ||
    typeof value === 'function'
  ) {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();

  try {
    const stringified = JSON.stringify(value);
    return stringified ?? String(value);
  } catch {
    return String(value);
  }
}

const TableBodyCell = React.memo(Cell);

export { TableBodyCell };
