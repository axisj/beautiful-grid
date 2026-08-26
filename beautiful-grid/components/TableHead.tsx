import * as React from 'react';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store';
import TableColGroup from './TableColGroup';
import ColResizer from './ColResizer';
import TableHeadColumn from './TableHeadColumn';
import { buildHeaderMatrix } from '../utils/buildHeaderMatrix';
import { useColumnSortable } from './useColumnSortable';

interface Props {
  container: React.RefObject<HTMLDivElement | null>;
}

function TableHead({ container }: Props) {
  // [Selector Group 1] State & Configuration - 상태 및 설정
  const {
    sort,
    dataControl,
    headerHeight,
    columns,
    columnsGroup,
    columnGroups,
    frozenColumnIndex,
    columnResizing,
    columnSortable,
  } = useAppStore(
    useShallow(s => ({
      sort: s.sort,
      dataControl: s.dataControl,
      headerHeight: s.headerHeight,
      columns: s.columns,
      columnsGroup: s.columnsGroup,
      columnGroups: s.columnGroups,
      frozenColumnIndex: s.frozenColumnIndex,
      columnResizing: s.columnResizing,
      columnSortable: s.columnSortable,
    })),
  );

  // [Selector Group 2] Action Setters - 액션 설정자
  const { toggleColumnSort, sortColumn } = useAppStore(
    useShallow(s => ({
      toggleColumnSort: s.toggleColumnSort,
      sortColumn: s.sortColumn,
    })),
  );

  const [sorted, setSorted] = useState(false);
  const tbodyRef = React.useRef<HTMLTableSectionElement>(null);

  const columnsTable = React.useMemo(
    () =>
      buildHeaderMatrix({
        columns,
        columnsGroup,
        columnGroups,
        startColumnIndex: frozenColumnIndex,
        endColumnIndex: columns.length,
      }).rows,
    [columnGroups, columns, columnsGroup, frozenColumnIndex],
  );
  const nestedGroupsActive = columnGroups.length > 0;
  const handleSorted = React.useCallback(() => setSorted(true), []);

  useColumnSortable({
    enabled: !!columnSortable && !sorted,
    tbodyRef,
    columnsTable,
    nestedGroupsActive,
    sortColumn,
    onSorted: handleSorted,
  });

  useEffect(() => {
    setSorted(false);
  }, [sorted]);

  if (sorted) {
    return null;
  }

  return (
    <HeadTable headerHeight={headerHeight} hasGroup={columnsTable.length > 1} rowLength={columnsTable.length}>
      <TableColGroup />
      <tbody role={'rfdg-head'} ref={tbodyRef}>
        {columnsTable.map((row, ri) => {
          return (
            <tr key={ri} data-columns-tr={ri}>
              {row.map(c => {
                if (c.type === 'group') {
                  return (
                    <HeadGroupTd
                      key={c.key}
                      data-column-index={c.startColumnIndex}
                      data-group-id={c.groupId}
                      data-header-cell-type='group'
                      data-bgrid-axis-selectable='true'
                      colSpan={c.colSpan}
                      className={[
                        columnSortable && !nestedGroupsActive ? 'drag-item' : '',
                        c.className ?? '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      style={{
                        ...c.headerStyle,
                        textAlign: c.headerAlign ?? c.headerStyle?.textAlign ?? 'center',
                      }}
                    >
                      <span className='bgrid-column-drag-handle'>{c.label}</span>
                    </HeadGroupTd>
                  );
                }
                const sortEnabled = !c.column?.sortDisable && (!!sort || !!dataControl);
                return (
                  <HeadTd
                    data-column-index={c.columnIndex}
                    data-header-cell-type='column'
                    data-bgrid-axis-selectable={!sortEnabled ? 'true' : undefined}
                    data-parent-group-id={c.parentGroupId}
                    key={c.key}
                    rowSpan={c.rowSpan}
                    bottomBorder={isHeadCellOnBottomRow(ri, c.rowSpan, columnsTable.length)}
                    style={{
                      ...c.headerStyle,
                      textAlign: c.headerAlign ?? c.headerStyle?.textAlign ?? 'center',
                    }}
                    className={[
                      columnSortable ? 'drag-item' : '',
                      c.className ?? '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                    hasOnClick={sortEnabled}
                    columnResizing={columnResizing}
                    onClick={(evt: React.MouseEvent<HTMLTableCellElement>) => {
                      evt.preventDefault();
                      if (sortEnabled) toggleColumnSort(c.columnIndex!);
                    }}
                  >
                    <TableHeadColumn column={c.column!} columnIndex={c.columnIndex!} />
                    <ColResizer columnIndex={c.columnIndex!} container={container} bordered={columnsTable.length > 1} />
                  </HeadTd>
                );
              })}
              {ri === 0 && <HeadTd data-none rowSpan={columnsTable.length} bottomBorder />}
            </tr>
          );
        })}
      </tbody>
    </HeadTable>
  );
}

interface HeadTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  headerHeight: number;
  hasGroup: boolean;
  rowLength: number;
}

export function HeadTable({ headerHeight, hasGroup, rowLength, className, children, ...rest }: HeadTableProps) {
  void hasGroup;
  return (
    <table
      className={['bgrid-head-table', className ?? ''].filter(Boolean).join(' ')}
      style={{ height: headerHeight }}
      {...rest}
    >
      {children}
      <style>{`[role='rfdg-head'] > tr, [role='rfdg-head-frozen'] > tr { height: ${100 / rowLength}%; }`}</style>
    </table>
  );
}

export function HeadGroupTd({ className, ...rest }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={['bgrid-head-group-cell', className ?? ''].filter(Boolean).join(' ')} {...rest} />;
}

interface HeadTdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  hasOnClick?: boolean;
  columnResizing?: boolean;
  bottomBorder?: boolean;
}

export function HeadTd({ hasOnClick, columnResizing, bottomBorder, className, ...rest }: HeadTdProps) {
  const clickable = hasOnClick && !columnResizing;
  const bordered = className?.includes('bordered');
  return (
    <td
      className={[
        'bgrid-head-cell',
        bottomBorder ? 'bgrid-head-bottom-border' : '',
        bordered ? 'bgrid-head-right-border' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      data-clickable={clickable ? 'true' : undefined}
      {...rest}
    />
  );
}

export function isHeadCellOnBottomRow(rowIndex: number, rowSpan: number | undefined, rowLength: number) {
  return rowIndex + (rowSpan ?? 1) >= rowLength;
}

export default React.memo(TableHead);
