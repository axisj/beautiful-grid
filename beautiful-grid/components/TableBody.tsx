import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store';
import TableColGroup from './TableColGroup';
import TableColGroupFrozen from './TableColGroupFrozen';
import {
  getCellValueByRowKey,
  getRowReorderOffset,
  getRowReorderRole,
  type BGridRowHeightMetrics,
  useBodyData,
} from '../utils';
import { TableBodyRow } from './TableBodyRow';
import { MasterDetailRow } from './MasterDetailCell';
import { AppModelColumn, BGridDataItem, BGridDataItemStatus, BGridProps, BGridSearchMatch } from '../types';

type BGridBodyRegion = 'left' | 'main';

export interface BGridBodyRowRange {
  startRowIndex: number;
  endRowIndex: number;
}

interface BGridVisibleColumnRange {
  startColumnIndex: number;
  endColumnIndex: number;
}

function getVisibleColumnRange(
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
    const nearestColumnIndex = Math.min(Math.max(firstVisibleColumnIndex, firstScrollableColumnIndex), lastColumnIndex);
    firstVisibleColumnIndex = nearestColumnIndex;
    lastVisibleColumnIndex = nearestColumnIndex;
  }

  return {
    startColumnIndex: Math.max(firstScrollableColumnIndex, firstVisibleColumnIndex - 1),
    endColumnIndex: Math.min(lastColumnIndex, lastVisibleColumnIndex + 1),
  };
}

const searchMatchTokenCache = new WeakMap<BGridSearchMatch[], ReadonlySet<string>>();

export interface RowKeyRegistry {
  firstSourceIndexByValue: Map<string, number>;
  warnedDuplicateValues: Set<string>;
  warnedMissingValue: boolean;
}

function encodeKeyPart(value: unknown): string {
  const valueType = typeof value;
  const stringValue = String(value);
  return `${valueType}:${stringValue.length}:${stringValue}`;
}

export function createRowKeyRegistry(): RowKeyRegistry {
  return {
    firstSourceIndexByValue: new Map(),
    warnedDuplicateValues: new Set(),
    warnedMissingValue: false,
  };
}

function getSearchMatchTokens(matches: BGridSearchMatch[]) {
  const cached = searchMatchTokenCache.get(matches);
  if (cached) return cached;
  const tokens = new Set(matches.map(match => `${match.cell.rowIndex}:${match.cell.columnIndex}`));
  searchMatchTokenCache.set(matches, tokens);
  return tokens;
}

interface Props {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  rowKeyRegistry: RowKeyRegistry;
  region?: BGridBodyRegion;
  rowRange?: BGridBodyRowRange;
  style?: React.CSSProperties;
  role?: string;
  quadrant?: 'top-left' | 'top-main' | 'body-left' | 'body-main';
  allowRowReorder?: boolean;
  onRowReorderPointerDown?: (event: React.PointerEvent<HTMLButtonElement>, rowIndex: number) => void;
  onRowReorderKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>, rowIndex: number) => void;
  rowHeightMetrics?: BGridRowHeightMetrics;
  viewportWidth?: number;
}

function getRowReactKey<T>(
  item: BGridDataItem<T> | undefined,
  sourceIndex: number,
  rowKey: React.Key | React.Key[] | undefined,
  registry: RowKeyRegistry,
): React.Key {
  if (rowKey !== undefined && item?.values) {
    const rawValue = getCellValueByRowKey(rowKey, item.values);
    if (rawValue !== undefined && rawValue !== null) {
      const encodedValue = encodeKeyPart(rawValue);
      const firstSourceIndex = registry.firstSourceIndexByValue.get(encodedValue);
      if (firstSourceIndex === undefined) {
        registry.firstSourceIndexByValue.set(encodedValue, sourceIndex);
        return `bgrid-row-key:${encodedValue}`;
      }
      if (firstSourceIndex === sourceIndex) return `bgrid-row-key:${encodedValue}`;

      if (process.env.NODE_ENV !== 'production' && !registry.warnedDuplicateValues.has(encodedValue)) {
        registry.warnedDuplicateValues.add(encodedValue);
        console.warn(
          `[BGrid] Duplicate rowKey detected: "${String(
            rawValue,
          )}". Falling back to a source-index key for duplicates.`,
        );
      }
      return `bgrid-row-key:${encodedValue}:duplicate-source:${sourceIndex}`;
    }

    if (process.env.NODE_ENV !== 'production' && !registry.warnedMissingValue) {
      registry.warnedMissingValue = true;
      console.warn('[BGrid] Missing rowKey value detected. Falling back to a source-index key.');
    }
  }
  return `bgrid-row-source:${sourceIndex}`;
}

function TableBody({
  rowKeyRegistry,
  region = 'main',
  rowRange,
  style,
  role,
  quadrant,
  allowRowReorder = true,
  onRowReorderPointerDown,
  onRowReorderKeyDown,
  rowHeightMetrics,
  viewportWidth,
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
  const { editable, editTrigger, disabled, cellInteractionSession } = useAppStore(
    useShallow(s => ({
      editable: s.editable,
      editTrigger: s.editTrigger,
      disabled: s.disabled,
      cellInteractionSession: s.cellInteractionSession,
    })),
  );

  // [Selector Group 5] Display Options - 표시 옵션
  const { getRowClassName, cellMergeOptions, variant, onClick, sourceIndexByVisibleIndex } = useAppStore(
    useShallow(s => ({
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
  const currentSearchMatch = activeSearchMatchIndex === undefined ? undefined : searchMatches[activeSearchMatchIndex];
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

  const { dataSet, setItemValue, handleMoveEditFocus, handleChangeChecked, handleChangeCheckedRadio, getRowSpan } =
    useBodyData(startIdx, endNumber, data);

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
  const hasOnClick = !!onClick && !disabled;
  const hasRowChecked = !!rowChecked;
  const isRadio = rowChecked?.isRadio;
  const rowReorderEnabled =
    !disabled &&
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
          const resolvedRowHeight = rowHeightMetrics?.heights[ri] ?? trHeight;
          const rowStatus = getRowStatusLabel(item.status);
          const sourceIndex = sourceIndexByVisibleIndex?.[ri] ?? ri;

          const active =
            rowKey !== undefined && selectedRowKey !== undefined
              ? getCellValueByRowKey(rowKey, item.values) === selectedRowKey
              : false;
          const className = getRowClassName?.(sourceIndex, item) ?? '';
          const rowReorderRole =
            reorderingInfo?.fromIndex === undefined || reorderingInfo.toIndex === undefined
              ? undefined
              : getRowReorderRole({
                  rowIndex: ri,
                  fromIndex: reorderingInfo.fromIndex,
                  toIndex: reorderingInfo.toIndex,
                });
          const rowReorderOffset =
            reorderingInfo?.fromIndex === undefined || reorderingInfo.toIndex === undefined
              ? 0
              : getRowReorderOffset({
                  rowIndex: ri,
                  fromIndex: reorderingInfo.fromIndex,
                  toIndex: reorderingInfo.toIndex,
                  rowHeight: trHeight,
                });
          const rowReorderDirection =
            reorderingInfo?.fromIndex === undefined || reorderingInfo.toIndex === undefined
              ? undefined
              : reorderingInfo.toIndex < reorderingInfo.fromIndex
              ? 'up'
              : reorderingInfo.toIndex > reorderingInfo.fromIndex
              ? 'down'
              : undefined;

          const isRowEditing =
            cellInteractionSession?.kind === 'editor' &&
            (cellInteractionSession.cell.rowIndex === ri || cellInteractionSession.hostCell.rowIndex === ri);

          const rowReactKey = getRowReactKey(item, sourceIndex, rowKey, rowKeyRegistry);

          const detailHeight = rowHeightMetrics?.detailHeights?.[ri] ?? 0;

          return (
            <React.Fragment key={rowReactKey}>
              <TableBodyRow
                item={item}
                data={data}
                ri={ri}
                sourceIndex={sourceIndex}
                columns={columns}
                startCIdx={startCIdx}
                endCIdx={endCIdx}
                frozenColumnIndex={frozenColumnIndex}
                isLeftRegion={isLeftRegion}
                showLineNumber={showLineNumber ?? false}
                hasRowChecked={hasRowChecked}
                isRadio={Boolean(isRadio)}
                checked={checkedAll === true || checkedIndexesMap.get(sourceIndex)}
                rowCheckedDisabled={Boolean(disabled || rowChecked?.disabled?.(sourceIndex, item))}
                rowStatus={rowStatus}
                active={active}
                className={className}
                resolvedRowHeight={resolvedRowHeight}
                itemHeight={itemHeight}
                itemPadding={itemPadding}
                editable={Boolean(editable)}
                disabled={Boolean(disabled)}
                editTrigger={editTrigger}
                hasOnClick={hasOnClick}
                cellMergeOptions={cellMergeOptions}
                mergeColumns={mergeColumns}
                odd={!mergeColumns ? ri % 2 === 0 : undefined}
                variant={variant}
                rowReorderEnabled={rowReorderEnabled}
                rowReorderRole={rowReorderRole}
                rowReorderPhase={reorderingInfo?.phase}
                rowReorderDirection={rowReorderDirection}
                rowReorderOffset={rowReorderOffset}
                reorder={reorder}
                reorderingInfo={reorderingInfo}
                searchMatchTokens={searchMatchTokens}
                currentSearchToken={currentSearchToken}
                isRowEditing={isRowEditing}
                cellInteractionSession={isRowEditing ? cellInteractionSession : undefined}
                handleClick={handleClick}
                setEditItem={setEditItem}
                setItemValue={setItemValue}
                handleMoveEditFocus={handleMoveEditFocus}
                handleChangeChecked={handleChangeChecked}
                handleChangeCheckedRadio={handleChangeCheckedRadio}
                getRowSpan={getRowSpan}
                onRowReorderPointerDown={onRowReorderPointerDown}
                onRowReorderKeyDown={onRowReorderKeyDown}
              />
              {detailHeight > 0 && (
                <MasterDetailRow
                  item={item}
                  sourceIndex={sourceIndex}
                  visibleIndex={ri}
                  detailHeight={detailHeight}
                  isLeftRegion={isLeftRegion}
                  viewportWidth={viewportWidth ?? Math.max(width - (frozenColumnsWidth ?? 0), 0)}
                  frozenColumnsWidth={frozenColumnsWidth ?? 0}
                  colSpan={isLeftRegion ? Math.max(frozenColumnIndex, 1) : Math.max(columns.length - frozenColumnIndex, 1)}
                />
              )}
            </React.Fragment>
          );
        })}

        {endNumber - startIdx < 1 && <NoDataTr itemHeight={itemHeight} itemPadding={itemPadding} aria-hidden='true' />}
      </tbody>
    </BodyTable>
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

function BodyTable({ variant, className, children, ...rest }: BodyTableProps) {
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

interface NoDataTrProps extends React.HTMLAttributes<HTMLTableRowElement> {
  itemHeight: number;
  itemPadding: number;
}

function NoDataTr({ children, className, itemHeight, itemPadding, style, ...rest }: NoDataTrProps) {
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
