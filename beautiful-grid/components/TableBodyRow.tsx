import * as React from 'react';
import {
  AppModelColumn,
  BGridCellInteractionSession,
  BGridDataItem,
  BGridDataItemStatus,
  BGridProps,
  MoveDirection,
} from '../types';
import {
  getCellValueByRowKey,
  isCellEdited,
  isCellValueChanged,
  resolveLogicalCell,
  type BGridRowReorderRole,
} from '../utils';
import { TableBodyCell } from './TableBodyCell';
import RowSelector from './RowSelector';
import { GripVertical } from './GripVertical';

export interface TableBodyRowProps<T> {
  item: BGridDataItem<T>;
  data: BGridDataItem<T>[];
  ri: number;
  sourceIndex: number;
  columns: AppModelColumn<T>[];
  startCIdx: number;
  endCIdx: number;
  frozenColumnIndex: number;
  isLeftRegion: boolean;
  showLineNumber: boolean;
  hasRowChecked: boolean;
  isRadio: boolean;
  checked: boolean;
  rowCheckedDisabled: boolean;
  rowStatus?: 'I' | 'U' | 'D';
  active: boolean;
  className: string;
  resolvedRowHeight: number;
  itemHeight: number;
  itemPadding: number;
  editable: boolean;
  disabled: boolean;
  editTrigger?: 'click' | 'dblclick';
  hasOnClick: boolean;
  cellMergeOptions?: BGridProps<T>['cellMergeOptions'];
  mergeColumns?: Record<number, any>;
  odd?: boolean;
  variant?: BGridProps<T>['variant'];
  rowReorderEnabled: boolean;
  rowReorderRole?: BGridRowReorderRole;
  rowReorderPhase?: string;
  rowReorderDirection?: 'up' | 'down';
  rowReorderOffset?: number;
  reorder?: any;
  reorderingInfo?: any;
  searchMatchTokens: ReadonlySet<string>;
  currentSearchToken?: string;
  isRowEditing: boolean;
  cellInteractionSession?: BGridCellInteractionSession;
  handleClick: (rowIndex: number, columnIndex: number) => void;
  setEditItem: (rowIndex: number, columnIndex: number) => void;
  setItemValue: (rowIndex: number, columnIndex: number, column: any, value: any) => Promise<void>;
  handleMoveEditFocus: (rowIndex: number, columnIndex: number, columnDirection?: any, rowDirection?: any) => Promise<void>;
  handleChangeChecked: (rowIndex: number, checked: boolean) => Promise<void>;
  handleChangeCheckedRadio: (rowIndex: number) => Promise<void>;
  getRowSpan: (rowIndex: number, columnIndex: number) => number;
  onRowReorderPointerDown?: (event: React.PointerEvent<HTMLButtonElement>, rowIndex: number) => void;
  onRowReorderKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>, rowIndex: number) => void;
}

interface CellItemProps<T> {
  ri: number;
  columnIndex: number;
  column: AppModelColumn<T>;
  canonicalIndex: number;
  canonicalItem: BGridDataItem<T>;
  valueByRowKey: any;
  isLeftRegion: boolean;
  editable: boolean;
  disabled: boolean;
  editTrigger?: 'click' | 'dblclick';
  rowSpan: number;
  isMerged: boolean;
  tdEditable: boolean;
  cellEditable: boolean;
  isLogicalEditing: boolean;
  isCheckboxEditor: boolean;
  isSearchMatch: boolean;
  isCurrentSearchMatch: boolean;
  cellInteractionSession?: BGridCellInteractionSession;
  handleClick: (rowIndex: number, columnIndex: number) => void;
  setEditItem: (rowIndex: number, columnIndex: number) => void;
  setItemValue: (rowIndex: number, columnIndex: number, column: any, value: any) => Promise<void>;
  handleMoveEditFocus: (rowIndex: number, columnIndex: number, columnDirection?: any, rowDirection?: any) => Promise<void>;
}

function TableBodyCellItemInner<T>({
  ri,
  columnIndex,
  column,
  canonicalIndex,
  canonicalItem,
  valueByRowKey,
  editable,
  disabled,
  editTrigger,
  rowSpan,
  isMerged,
  tdEditable,
  cellEditable,
  isLogicalEditing,
  isCheckboxEditor,
  isSearchMatch,
  isCurrentSearchMatch,
  cellInteractionSession,
  handleClick,
  setEditItem,
  setItemValue,
  handleMoveEditFocus,
}: CellItemProps<T>) {
  const resolvedEditTrigger = column.editTrigger ?? editTrigger ?? 'dblclick';
  const edited = isCellEdited(canonicalItem, column);
  const valueChanged = isCellValueChanged(canonicalItem, column);
  const editingType = isCheckboxEditor ? 'checkbox' : tdEditable ? column.editor?.type : undefined;

  const handleSave = React.useCallback(
    async (newValue: any, columnDirection?: MoveDirection, rowDirection?: MoveDirection) => {
      await setItemValue(ri, columnIndex, column, newValue);
      await handleMoveEditFocus(ri, columnIndex, columnDirection, rowDirection);
    },
    [ri, columnIndex, column, setItemValue, handleMoveEditFocus],
  );

  const handleCancel = React.useCallback(async () => {
    setEditItem(-1, -1);
  }, [setEditItem]);

  const handleMove = React.useCallback(
    async (columnDirection: MoveDirection, rowDirection: MoveDirection) => {
      await handleMoveEditFocus(ri, columnIndex, columnDirection, rowDirection);
    },
    [ri, columnIndex, handleMoveEditFocus],
  );

  const tdProps: React.TdHTMLAttributes<HTMLTableCellElement> = {};
  if (cellEditable && !isCheckboxEditor) {
    if (resolvedEditTrigger === 'dblclick') {
      tdProps.onDoubleClick = () => setEditItem(ri, columnIndex);
      tdProps.onClick = () => handleClick(canonicalIndex, columnIndex);
    } else {
      tdProps.onClick = () => {
        setEditItem(ri, columnIndex);
        handleClick(canonicalIndex, columnIndex);
      };
    }
  } else {
    tdProps.onClick = () => handleClick(canonicalIndex, columnIndex);
  }

  tdProps.className = [
    column.getClassName ? column.getClassName(canonicalItem) : column.className ?? '',
    isMerged ? 'merged' : '',
    valueChanged ? 'bgrid-cell-value-changed' : '',
    edited ? 'bgrid-cell-edited' : '',
    tdEditable ? 'bgrid-cell-editing' : '',
    isSearchMatch ? 'bgrid-cell-search-match' : '',
    isCurrentSearchMatch ? 'bgrid-cell-search-current' : '',
    editingType === 'text' ? 'bgrid-cell-editing-text' : '',
    isCheckboxEditor ? 'bgrid-cell-checkbox' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <td
      key={columnIndex}
      data-bgrid-cell={'true'}
      data-bgrid-logical-row-index={canonicalIndex}
      data-bgrid-cell-value-changed={valueChanged ? 'true' : undefined}
      data-bgrid-cell-edited={edited ? 'true' : undefined}
      data-bgrid-cell-editing={tdEditable ? 'true' : undefined}
      data-bgrid-search-match={isSearchMatch ? 'true' : undefined}
      data-bgrid-search-current={isCurrentSearchMatch ? 'true' : undefined}
      data-bgrid-editor-type={editingType}
      data-row-index={ri}
      data-column-index={columnIndex}
      style={{
        textAlign: column.align,
      }}
      rowSpan={rowSpan > 1 ? rowSpan : undefined}
      {...tdProps}
    >
      <TableBodyCell
        index={canonicalIndex}
        hostIndex={ri}
        columnIndex={columnIndex}
        column={column}
        item={canonicalItem}
        valueByRowKey={valueByRowKey}
        handleSave={handleSave}
        handleCancel={handleCancel}
        handleMove={handleMove}
        editable={tdEditable}
        cellEditable={cellEditable}
        interactionEditing={isLogicalEditing}
        editSession={tdEditable && cellInteractionSession?.kind === 'editor' ? cellInteractionSession : undefined}
      />
    </td>
  );
}

const TableBodyCellItem = React.memo(TableBodyCellItemInner) as typeof TableBodyCellItemInner;

function TableBodyRowInner<T>({
  item,
  data,
  ri,
  sourceIndex,
  columns,
  startCIdx,
  endCIdx,
  frozenColumnIndex,
  isLeftRegion,
  showLineNumber,
  hasRowChecked,
  isRadio,
  checked,
  rowCheckedDisabled,
  rowStatus,
  active,
  className,
  resolvedRowHeight,
  itemHeight,
  itemPadding,
  editable,
  disabled,
  editTrigger,
  hasOnClick,
  cellMergeOptions,
  mergeColumns,
  odd,
  variant,
  rowReorderEnabled,
  rowReorderRole,
  rowReorderPhase,
  rowReorderDirection,
  rowReorderOffset,
  reorder,
  reorderingInfo,
  searchMatchTokens,
  currentSearchToken,
  isRowEditing,
  cellInteractionSession,
  handleClick,
  setEditItem,
  setItemValue,
  handleMoveEditFocus,
  handleChangeChecked,
  handleChangeCheckedRadio,
  getRowSpan,
  onRowReorderPointerDown,
  onRowReorderKeyDown,
}: TableBodyRowProps<T>) {
  const clickable = !editable && hasOnClick;
  const rowClassName = ['bgrid-body-row', active ? 'bgrid-row-active' : '', className].filter(Boolean).join(' ');

  return (
    <tr
      className={rowClassName}
      data-ri={ri}
      data-odd={!mergeColumns && odd ? 'true' : undefined}
      data-clickable={clickable ? 'true' : undefined}
      data-bgrid-row-reorder-role={rowReorderRole}
      data-bgrid-row-reorder-phase={rowReorderRole ? rowReorderPhase : undefined}
      data-bgrid-row-reorder-direction={rowReorderRole ? rowReorderDirection : undefined}
      style={{
        ['--bgrid-item-line-height' as string]: `${itemHeight}px`,
        ['--bgrid-item-cell-height' as string]: `${resolvedRowHeight}px`,
        ...(rowReorderRole && rowReorderRole !== 'source'
          ? ({ ['--bgrid-row-reorder-offset-y' as string]: `${rowReorderOffset ?? 0}px` } as React.CSSProperties)
          : undefined),
      }}
    >
      {isLeftRegion &&
        showLineNumber &&
        (rowReorderEnabled ? (
          <td
            className={[
              'bgrid-line-number-cell',
              !hasRowChecked && frozenColumnIndex > 0 && variant !== 'vertical-bordered' ? 'bordered' : '',
              'bgrid-line-number-drag',
            ]
              .filter(Boolean)
              .join(' ')}
            data-bgrid-row-status={rowStatus}
            data-bgrid-axis-selectable='true'
            data-row-index={ri}
          >
            <button
              type='button'
              className='bgrid-row-reorder-handle drag-handle'
              data-row-reorder-index={ri}
              data-dragging={reorderingInfo?.fromIndex === ri ? 'true' : undefined}
              aria-label={`Move row ${ri + 1}`}
              disabled={!!disabled || isRowEditing}
              onPointerDown={event => onRowReorderPointerDown?.(event, ri)}
              onKeyDown={event => onRowReorderKeyDown?.(event, ri)}
            >
              {reorder?.handleIcon ?? <GripVertical />}
            </button>
            <span className='bgrid-line-number-value'>{rowStatus ?? ri + 1}</span>
          </td>
        ) : (
          <td
            className={[
              'bgrid-line-number-cell',
              !hasRowChecked && frozenColumnIndex > 0 && variant !== 'vertical-bordered' ? 'bordered' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            data-bgrid-row-status={rowStatus}
            data-bgrid-axis-selectable='true'
            data-row-index={ri}
          >
            {rowStatus ?? ri + 1}
          </td>
        ))}

      {isLeftRegion && hasRowChecked && (
        <td className={frozenColumnIndex > 0 ? 'bordered' : ''}>
          <RowSelector
            disabled={rowCheckedDisabled}
            checked={checked}
            handleChange={async checkedValue => {
              if (isRadio) await handleChangeCheckedRadio(ri);
              else await handleChangeChecked(ri, checkedValue);
            }}
            isRadio={isRadio}
          />
        </td>
      )}

      {!isLeftRegion && startCIdx > frozenColumnIndex && <td colSpan={startCIdx - frozenColumnIndex} />}

      {Array.from({ length: Math.max(0, endCIdx - startCIdx + 1) }, (_, cidx) => {
        const columnIndex = startCIdx + cidx;
        const column = columns[columnIndex];
        if (!column) return null;

        const logicalCell = resolveLogicalCell(data, cellMergeOptions, { rowIndex: ri, columnIndex });
        const canonicalIndex = logicalCell.cell.rowIndex;
        const canonicalItem = data[canonicalIndex] ?? item;

        const isLogicalEditing =
          isRowEditing &&
          cellInteractionSession?.kind === 'editor' &&
          cellInteractionSession.cell.rowIndex === canonicalIndex &&
          cellInteractionSession.cell.columnIndex === columnIndex;

        const isHostEditing =
          isLogicalEditing &&
          cellInteractionSession?.hostCell.rowIndex === ri &&
          cellInteractionSession?.hostCell.columnIndex === columnIndex;

        const logicalRowsEditable = logicalCell.rowIndexes.every(
          rowIndex => data[rowIndex]?.status !== BGridDataItemStatus.remove,
        );

        const tdEditable = logicalRowsEditable && editable && column.editable !== false && isHostEditing;
        const rowSpan = mergeColumns?.[columnIndex] ? getRowSpan(ri, columnIndex) : 1;
        if (rowSpan === 0) return null;

        const cellEditable = logicalRowsEditable && editable && column.editable !== false;
        const isCheckboxEditor = column.editor?.type === 'checkbox';

        const searchToken = `${canonicalIndex}:${columnIndex}`;
        const isSearchMatch = searchMatchTokens.has(searchToken);
        const isCurrentSearchMatch = currentSearchToken === searchToken;
        const valueByRowKey = getCellValueByRowKey(column.key, canonicalItem.values);

        return (
          <TableBodyCellItem
            key={columnIndex}
            ri={ri}
            columnIndex={columnIndex}
            column={column}
            canonicalIndex={canonicalIndex}
            canonicalItem={canonicalItem}
            valueByRowKey={valueByRowKey}
            isLeftRegion={isLeftRegion}
            editable={editable}
            disabled={disabled}
            editTrigger={editTrigger}
            rowSpan={rowSpan}
            isMerged={Boolean(mergeColumns?.[columnIndex])}
            tdEditable={tdEditable}
            cellEditable={cellEditable}
            isLogicalEditing={isLogicalEditing}
            isCheckboxEditor={isCheckboxEditor}
            isSearchMatch={isSearchMatch}
            isCurrentSearchMatch={isCurrentSearchMatch}
            cellInteractionSession={isRowEditing ? cellInteractionSession : undefined}
            handleClick={handleClick}
            setEditItem={setEditItem}
            setItemValue={setItemValue}
            handleMoveEditFocus={handleMoveEditFocus}
          />
        );
      })}

      {!isLeftRegion && <td data-none onClick={() => handleClick(ri, -1)} />}
    </tr>
  );
}

export const TableBodyRow = React.memo(TableBodyRowInner) as typeof TableBodyRowInner;
