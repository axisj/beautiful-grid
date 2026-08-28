import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store';
import TableColGroup from './TableColGroup';
import TableColGroupFrozen from './TableColGroupFrozen';
import {
  getCellValueByRowKey,
  getRowReorderOffset,
  getRowReorderRole,
  isCellEdited,
  isCellValueChanged,
  resolveLogicalCell,
  useBodyData,
} from '../utils';
import { TableBodyCell } from './TableBodyCell';
import { AppModelColumn, BGridDataItemStatus, BGridProps, BGridSearchMatch } from '../types';
import RowSelector from './RowSelector';
import { GripVertical } from './GripVertical';

export type BGridBodyRegion = 'left' | 'main';

export interface BGridBodyRowRange {
  startRowIndex: number;
  endRowIndex: number;
}

export interface BGridVisibleColumnRange {
  startColumnIndex: number;
  endColumnIndex: number;
}

export function getVisibleColumnRange(
  columns: Pick<AppModelColumn<any>, 'left' | 'width'>[],
  firstScrollableColumnIndex: number,
  scrollLeft: number,
  viewportWidth: number,
): BGridVisibleColumnRange {
  const lastColumnIndex = columns.length - 1;
  if (firstScrollableColumnIndex > lastColumnIndex) {
    return {
      startColumnIndex: firstScrollableColumnIndex,
      endColumnIndex: lastColumnIndex,
    };
  }

  const viewportStart = Math.max(scrollLeft, 0);
  const viewportEnd = viewportStart + Math.max(viewportWidth, 0);

  let low = firstScrollableColumnIndex;
  let high = lastColumnIndex;
  let firstVisibleColumnIndex = lastColumnIndex + 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const column = columns[middle];
    const columnLeft = column.left ?? 0;
    const columnRight = columnLeft + (column.width ?? 100);

    if (columnRight >= viewportStart) {
      firstVisibleColumnIndex = middle;
      high = middle - 1;
    } else {
      low = middle + 1;
    }
  }

  low = firstScrollableColumnIndex;
  high = lastColumnIndex;
  let lastVisibleColumnIndex = firstScrollableColumnIndex - 1;

  while (low <= high) {
    const middle = Math.floor((low + high) / 2);
    const columnLeft = columns[middle].left ?? 0;

    if (columnLeft < viewportEnd) {
      lastVisibleColumnIndex = middle;
      low = middle + 1;
    } else {
      high = middle - 1;
    }
  }

  if (firstVisibleColumnIndex > lastVisibleColumnIndex) {
    const nearestColumnIndex = Math.min(
      Math.max(firstVisibleColumnIndex, firstScrollableColumnIndex),
      lastColumnIndex,
    );
    firstVisibleColumnIndex = nearestColumnIndex;
    lastVisibleColumnIndex = nearestColumnIndex;
  }

  return {
    startColumnIndex: Math.max(firstScrollableColumnIndex, firstVisibleColumnIndex - 1),
    endColumnIndex: Math.min(lastColumnIndex, lastVisibleColumnIndex + 1),
  };
}

const searchMatchTokenCache = new WeakMap<BGridSearchMatch[], ReadonlySet<string>>();

function getSearchMatchTokens(matches: BGridSearchMatch[]) {
  const cached = searchMatchTokenCache.get(matches);
  if (cached) return cached;
  const tokens = new Set(matches.map(match => `${match.cell.rowIndex}:${match.cell.columnIndex}`));
  searchMatchTokenCache.set(matches, tokens);
  return tokens;
}

interface Props {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  region?: BGridBodyRegion;
  rowRange?: BGridBodyRowRange;
  style?: React.CSSProperties;
  role?: string;
  quadrant?: 'top-left' | 'top-main' | 'body-left' | 'body-main';
  allowRowReorder?: boolean;
  onRowReorderPointerDown?: (event: React.PointerEvent<HTMLButtonElement>, rowIndex: number) => void;
  onRowReorderKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>, rowIndex: number) => void;
}

function TableBody({
  region = 'main',
  rowRange,
  style,
  role,
  quadrant,
  allowRowReorder = true,
  onRowReorderPointerDown,
  onRowReorderKeyDown,
}: Props) {
  const isLeftRegion = region === 'left';
  // [Selector Group 1] Scroll & Dimensions - 스크롤 및 차원
  const { scrollTop, scrollLeft, width, frozenColumnsWidth, itemHeight, itemPadding, displayItemCount } = useAppStore(
    useShallow(s => ({
      scrollTop: rowRange ? 0 : s.scrollTop,
      scrollLeft: isLeftRegion ? 0 : s.scrollLeft,
      width: s.width,
      frozenColumnsWidth: s.frozenColumnsWidth,
      itemHeight: s.itemHeight,
      itemPadding: s.itemPadding,
      displayItemCount: s.displayItemCount,
    })),
  );

  // [Selector Group 2] Data & Columns - 데이터 및 열
  const { data, columns, frozenColumnIndex } = useAppStore(
    useShallow(s => ({
      data: s.data,
      columns: s.columns,
      frozenColumnIndex: s.frozenColumnIndex,
    })),
  );

  // [Selector Group 3] Row State - 행 상태
  const { rowKey, selectedRowKey, reorderingInfo, checkedIndexesMap, checkedAll, rowChecked, showLineNumber, reorder } =
    useAppStore(
      useShallow(s => ({
        rowKey: s.rowKey,
        selectedRowKey: s.selectedRowKey,
        reorderingInfo: s.reorderingInfo,
        checkedIndexesMap: s.checkedIndexesMap,
        checkedAll: s.checkedAll,
        rowChecked: s.rowChecked,
        showLineNumber: s.showLineNumber,
        reorder: s.reorder,
      })),
    );

  // [Selector Group 4] Edit State - 편집 상태
  const { editable, editTrigger, cellInteractionSession } = useAppStore(
    useShallow(s => ({
      editable: s.editable,
      editTrigger: s.editTrigger,
      cellInteractionSession: s.cellInteractionSession,
    })),
  );

  // [Selector Group 5] Display Options - 표시 옵션
  const { msg, getRowClassName, cellMergeOptions, variant, onClick, sourceIndexByVisibleIndex } = useAppStore(
    useShallow(s => ({
      msg: s.msg,
      getRowClassName: s.getRowClassName,
      cellMergeOptions: s.cellMergeOptions,
      variant: s.variant,
      onClick: s.onClick,
      sourceIndexByVisibleIndex: s.sourceIndexByVisibleIndex,
    })),
  );

  const { searchMatches, activeSearchMatchIndex } = useAppStore(
    useShallow(s => ({
      searchMatches: s.searchMatches,
      activeSearchMatchIndex: s.activeSearchMatchIndex,
    })),
  );

  const searchMatchTokens = getSearchMatchTokens(searchMatches);
  const currentSearchMatch =
    activeSearchMatchIndex === undefined ? undefined : searchMatches[activeSearchMatchIndex];
  const currentSearchToken = currentSearchMatch
    ? `${currentSearchMatch.cell.rowIndex}:${currentSearchMatch.cell.columnIndex}`
    : undefined;

  // [Selector Group 6] Action Setters - 액션 설정자
  const { handleClick, setEditItem } = useAppStore(
    useShallow(s => ({
      handleClick: s.handleClick,
      setEditItem: s.setEditItem,
    })),
  );

  const trHeight = itemHeight + itemPadding * 2;
  const startIdx = rowRange?.startRowIndex ?? Math.max(Math.floor(scrollTop / trHeight), 0);
  const endNumber = rowRange?.endRowIndex ?? Math.min(startIdx + displayItemCount, data.length);
  const mergeColumns = cellMergeOptions?.columnsMap;

  const {
    dataSet,
    setItemValue,
    handleMoveEditFocus,
    handleChangeChecked,
    handleChangeCheckedRadio,
    getRowSpan,
  } = useBodyData(startIdx, endNumber, data);

  const { startCIdx, endCIdx } = React.useMemo(() => {
    if (isLeftRegion) {
      return {
        startCIdx: 0,
        endCIdx: frozenColumnIndex - 1,
      };
    }

    const { startColumnIndex, endColumnIndex } = getVisibleColumnRange(
      columns,
      frozenColumnIndex,
      scrollLeft,
      width - (frozenColumnsWidth ?? 0),
    );

    return {
      startCIdx: startColumnIndex,
      endCIdx: endColumnIndex,
    };
  }, [scrollLeft, width, frozenColumnsWidth, columns, frozenColumnIndex, isLeftRegion]);
  const hasOnClick = !!onClick;
  const hasRowChecked = !!rowChecked;
  const isRadio = rowChecked?.isRadio;
  const rowReorderEnabled =
    isLeftRegion &&
    allowRowReorder &&
    !!reorder?.enabled &&
    !!onRowReorderPointerDown &&
    !!onRowReorderKeyDown;

  return (
    <BodyTable variant={variant} style={style} data-bgrid-quadrant={quadrant}>
      {isLeftRegion ? <TableColGroupFrozen /> : <TableColGroup />}
      <tbody role={role ?? (isLeftRegion ? 'rfdg-body-frozen' : 'rfdg-body')}>
        {dataSet.map((item, i) => {
          const ri = startIdx + i;
          const rowStatus = getRowStatusLabel(item.status);
          const sourceIndex = sourceIndexByVisibleIndex?.[ri] ?? ri;
          const trProps: Record<string, any> = {
            editable,
          };

          if (!mergeColumns) {
            trProps.odd = ri % 2 === 0;
          }

          const active =
            rowKey !== undefined && selectedRowKey !== undefined
              ? getCellValueByRowKey(rowKey, item.values) === selectedRowKey
              : false;
          const className = getRowClassName?.(sourceIndex, item) ?? '';
          const rowReorderRole = reorderingInfo?.fromIndex === undefined || reorderingInfo.toIndex === undefined
            ? undefined
            : getRowReorderRole({
                rowIndex: ri,
                fromIndex: reorderingInfo.fromIndex,
                toIndex: reorderingInfo.toIndex,
              });
          const rowReorderOffset = reorderingInfo?.fromIndex === undefined || reorderingInfo.toIndex === undefined
            ? 0
            : getRowReorderOffset({
                rowIndex: ri,
                fromIndex: reorderingInfo.fromIndex,
                toIndex: reorderingInfo.toIndex,
                rowHeight: trHeight,
              });
          const rowReorderDirection = reorderingInfo?.fromIndex === undefined || reorderingInfo.toIndex === undefined
            ? undefined
            : reorderingInfo.toIndex < reorderingInfo.fromIndex
            ? 'up'
            : reorderingInfo.toIndex > reorderingInfo.fromIndex
            ? 'down'
            : undefined;

          return (
            <TableBodyTr
              key={ri}
              itemHeight={itemHeight}
              itemPadding={itemPadding}
              active={active}
              hasOnClick={hasOnClick}
              className={className + (active ? ' active' : '')}
              data-ri={ri}
              data-bgrid-row-reorder-role={rowReorderRole}
              data-bgrid-row-reorder-phase={rowReorderRole ? reorderingInfo?.phase : undefined}
              data-bgrid-row-reorder-direction={rowReorderRole ? rowReorderDirection : undefined}
              style={
                rowReorderRole && rowReorderRole !== 'source'
                  ? ({ ['--bgrid-row-reorder-offset-y' as string]: `${rowReorderOffset}px` } as React.CSSProperties)
                  : undefined
              }
              {...trProps}
            >
              {isLeftRegion &&
                showLineNumber &&
                (rowReorderEnabled ? (
                  <LineNumberTd
                    bordered={!hasRowChecked && frozenColumnIndex > 0 && variant !== 'vertical-bordered'}
                    className='bgrid-line-number-drag'
                    rowStatus={rowStatus}
                    rowIndex={ri}
                  >
                    <button
                      type='button'
                      className='bgrid-row-reorder-handle drag-handle'
                      data-row-reorder-index={ri}
                      data-dragging={reorderingInfo?.fromIndex === ri ? 'true' : undefined}
                      aria-label={`Move row ${ri + 1}`}
                      disabled={!!cellInteractionSession}
                      onPointerDown={event => onRowReorderPointerDown?.(event, ri)}
                      onKeyDown={event => onRowReorderKeyDown?.(event, ri)}
                    >
                      {reorder?.handleIcon ?? <GripVertical />}
                    </button>
                    <span className='bgrid-line-number-value'>{rowStatus ?? ri + 1}</span>
                  </LineNumberTd>
                ) : (
                  <LineNumberTd
                    bordered={!hasRowChecked && frozenColumnIndex > 0 && variant !== 'vertical-bordered'}
                    rowStatus={rowStatus}
                    rowIndex={ri}
                  >
                    {rowStatus ?? ri + 1}
                  </LineNumberTd>
                ))}

              {isLeftRegion && hasRowChecked && (
                <td className={frozenColumnIndex > 0 ? 'bordered' : ''}>
                  <RowSelector
                    disabled={rowChecked.disabled?.(sourceIndex, item)}
                    checked={checkedAll === true || checkedIndexesMap.get(sourceIndex)}
                    handleChange={async checked => {
                      if (isRadio) await handleChangeCheckedRadio(ri);
                      else await handleChangeChecked(ri, checked);
                    }}
                    isRadio={isRadio}
                  />
                </td>
              )}

              {!isLeftRegion && startCIdx > frozenColumnIndex && <td colSpan={startCIdx - frozenColumnIndex} />}
              {Array.from({ length: Math.max(0, endCIdx - startCIdx + 1) }, (_, cidx) => {
                const columnIndex = startCIdx + cidx;
                const column = columns[columnIndex];
                const logicalCell = resolveLogicalCell(data, cellMergeOptions, { rowIndex: ri, columnIndex });
                const canonicalIndex = logicalCell.cell.rowIndex;
                const canonicalItem = data[canonicalIndex] ?? item;
                const isLogicalEditing =
                  cellInteractionSession?.kind === 'editor' &&
                  cellInteractionSession.cell.rowIndex === canonicalIndex &&
                  cellInteractionSession.cell.columnIndex === columnIndex;
                const isHostEditing =
                  isLogicalEditing &&
                  cellInteractionSession.hostCell.rowIndex === ri &&
                  cellInteractionSession.hostCell.columnIndex === columnIndex;
                const logicalRowsEditable = logicalCell.rowIndexes.every(
                  rowIndex => data[rowIndex]?.status !== BGridDataItemStatus.remove,
                );

                const tdEditable =
                  logicalRowsEditable &&
                  editable &&
                  column.editable !== false &&
                  isHostEditing;
                const rowSpan = mergeColumns?.[columnIndex] ? getRowSpan(ri, columnIndex) : 1;
                if (rowSpan === 0) return null;

                const tdProps: Record<string, any> = {};
                const cellEditable = logicalRowsEditable && editable && column.editable !== false;
                const isCheckboxEditor = column.editor?.type === 'checkbox';
                const resolvedEditTrigger = column.editTrigger ?? editTrigger ?? 'dblclick';
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

                const edited = isCellEdited(canonicalItem, column);
                const valueChanged = isCellValueChanged(canonicalItem, column);
                const editingType = isCheckboxEditor ? 'checkbox' : tdEditable ? column.editor?.type : undefined;
                const searchToken = `${canonicalIndex}:${columnIndex}`;
                const isSearchMatch = searchMatchTokens.has(searchToken);
                const isCurrentSearchMatch = currentSearchToken === searchToken;
                tdProps.className = [
                  column.getClassName ? column.getClassName(canonicalItem) : column.className ?? '',
                  mergeColumns?.[columnIndex] ? 'merged' : '',
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
                      valueByRowKey={getCellValueByRowKey(column.key, canonicalItem.values)}
                      {...{
                        handleSave: async (newValue, columnDirection, rowDirection) => {
                          await setItemValue(ri, columnIndex, column, newValue);
                          await handleMoveEditFocus(ri, columnIndex, columnDirection, rowDirection);
                        },
                        handleCancel: async () => {
                          setEditItem(-1, -1);
                        },
                        handleMove: async (columnDirection, rowDirection) => {
                          await handleMoveEditFocus(ri, columnIndex, columnDirection, rowDirection);
                        },
                        editable: tdEditable,
                        cellEditable,
                        interactionEditing: isLogicalEditing,
                        editSession:
                          tdEditable && cellInteractionSession?.kind === 'editor'
                            ? cellInteractionSession
                            : undefined,
                      }}
                    />
                  </td>
                );
              })}

              {!isLeftRegion && <td data-none onClick={() => handleClick(ri, -1)} />}
            </TableBodyTr>
          );
        })}

        {endNumber - startIdx < 1 &&
          (isLeftRegion ? (
            <NoDataTr itemHeight={itemHeight} itemPadding={itemPadding} />
          ) : (
            <NoDataTr itemHeight={itemHeight} itemPadding={itemPadding}>
              {msg?.emptyList && (
                <>
                  <td className={'bgrid-empty-cell'} colSpan={columns.slice(frozenColumnIndex).length}>
                    {msg?.emptyList}
                  </td>
                  <td data-none />
                </>
              )}
            </NoDataTr>
          ))}
      </tbody>
    </BodyTable>
  );
}

function LineNumberTd({
  bordered,
  rowStatus,
  rowIndex,
  active,
  className,
  children,
  ...rest
}: React.TdHTMLAttributes<HTMLTableCellElement> & {
  bordered?: boolean;
  rowStatus?: 'I' | 'U' | 'D';
  rowIndex?: number;
  active?: boolean;
}) {
  return (
    <td
      className={[
        'bgrid-line-number-cell',
        bordered ? 'bordered' : '',
        active ? 'bgrid-row-axis-active' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-bgrid-row-status={rowStatus}
      data-bgrid-axis-selectable='true'
      data-bgrid-row-axis-active={active ? 'true' : undefined}
      data-row-index={rowIndex}
      {...rest}
    >
      {children}
    </td>
  );
}

function getRowStatusLabel(status?: BGridDataItemStatus): 'I' | 'U' | 'D' | undefined {
  if (status === BGridDataItemStatus.new) return 'I';
  if (status === BGridDataItemStatus.edit) return 'U';
  if (status === BGridDataItemStatus.remove) return 'D';
  return undefined;
}

interface BodyTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  variant: BGridProps<any>['variant'];
}

export function BodyTable({ variant, className, children, ...rest }: BodyTableProps) {
  return (
    <table
      className={[
        'bgrid-body-table',
        variant === 'vertical-bordered' ? 'bgrid-body-vertical-bordered' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {children}
    </table>
  );
}

interface TableBodyTrProps extends React.HTMLAttributes<HTMLTableRowElement> {
  itemHeight: number;
  itemPadding: number;
  active?: boolean;
  editable?: boolean;
  odd?: boolean;
  hasOnClick?: boolean;
}

export function TableBodyTr({
  itemHeight,
  itemPadding,
  active,
  editable,
  odd,
  hasOnClick,
  className,
  children,
  style,
  ...rest
}: TableBodyTrProps) {
  const clickable = !editable && hasOnClick;
  const rowClassName = ['bgrid-body-row', active ? 'bgrid-row-active' : '', className ?? '']
    .filter(Boolean)
    .join(' ');

  return (
    <tr
      className={rowClassName}
      data-odd={odd ? 'true' : undefined}
      data-clickable={clickable ? 'true' : undefined}
      style={{
        ['--bgrid-item-line-height' as string]: `${itemHeight}px`,
        ['--bgrid-item-cell-height' as string]: `${itemHeight + itemPadding * 2}px`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </tr>
  );
}

interface NoDataTrProps extends React.HTMLAttributes<HTMLTableRowElement> {
  itemHeight: number;
  itemPadding: number;
}

export function NoDataTr({ children, className, itemHeight, itemPadding, style, ...rest }: NoDataTrProps) {
  return (
    <tr
      className={['bgrid-empty-row', className ?? ''].filter(Boolean).join(' ')}
      style={{
        ['--bgrid-item-line-height' as string]: `${itemHeight}px`,
        ['--bgrid-item-cell-height' as string]: `${itemHeight + itemPadding * 2}px`,
        ...style,
      }}
      {...rest}
    >
      {children}
    </tr>
  );
}

export default React.memo(TableBody);
