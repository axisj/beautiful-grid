import * as React from 'react';
import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store';
import RowSelector from './RowSelector';
import TableColGroupFrozen from './TableColGroupFrozen';
import { HeadGroupTd, HeadTable, HeadTd, isHeadCellOnBottomRow } from './TableHead';
import ColResizer from './ColResizer';
import TableHeadColumn from './TableHeadColumn';
import { buildHeaderMatrix } from '../utils/buildHeaderMatrix';
import { useColumnSortable } from './useColumnSortable';

interface Props {
  container: React.RefObject<HTMLDivElement | null>;
}

function TableHeadFrozen({ container }: Props) {
  // [Selector Group 1] Sort & Layout - 정렬 및 레이아웃
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

  // [Selector Group 2] Selection State - 선택 상태
  const { rowChecked, showLineNumber, checkedAll } = useAppStore(
    useShallow(s => ({
      rowChecked: s.rowChecked,
      showLineNumber: s.showLineNumber,
      checkedAll: s.checkedAll,
    })),
  );

  // [Selector Group 3] Action Setters - 액션 설정자
  const { toggleColumnSort, sortColumn, setCheckedAll } = useAppStore(
    useShallow(s => ({
      toggleColumnSort: s.toggleColumnSort,
      sortColumn: s.sortColumn,
      setCheckedAll: s.setCheckedAll,
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
        startColumnIndex: 0,
        endColumnIndex: frozenColumnIndex,
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
      <TableColGroupFrozen />
      <tbody role={'rfdg-head-frozen'} ref={tbodyRef}>
        {columnsTable.map((row, ri) => {
          return (
            <tr key={ri} data-columns-tr={ri}>
              {ri === 0 && showLineNumber && (
                <HeadTd
                  className={['rfdg-tr-line-number', !rowChecked ? 'bordered' : ''].filter(Boolean).join(' ')}
                  rowSpan={columnsTable.length}
                  bottomBorder
                >
                  &nbsp;
                </HeadTd>
              )}
              {ri === 0 && !!rowChecked && (
                <HeadTd rowSpan={columnsTable.length} className={'bordered'} bottomBorder>
                  {!rowChecked?.isRadio && (
                    <RowSelector
                      checked={checkedAll === true}
                      indeterminate={checkedAll === 'indeterminate'}
                      handleChange={checked => {
                        setCheckedAll(checked);
                      }}
                    />
                  )}
                </HeadTd>
              )}

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
                    <ColResizer
                      columnIndex={c.columnIndex!}
                      container={container}
                      bordered={columnsTable.length > 1}
                      frozenBoundary={c.columnIndex === frozenColumnIndex - 1}
                    />
                  </HeadTd>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </HeadTable>
  );
}

export default React.memo(TableHeadFrozen);
