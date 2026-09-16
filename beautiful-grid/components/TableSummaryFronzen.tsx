import * as React from 'react';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store';
import { BGridProps } from '../types';
import { buildSummaryRowCells, normalizeSummaryRows } from '../utils';
import TableColGroupFrozen from './TableColGroupFrozen';
import { HeadTd } from './TableHead';
import { SummaryTable } from './TableSummary';

interface Props {
  position: NonNullable<BGridProps<any>['summary']>['position'];
}

export function TableSummaryFrozen({ position }: Props) {
  // [Selector Group 1] Summary Configuration - 요약 설정
  const {
    summaryHeight,
    summaryRowHeight,
    summary,
    columns,
    frozenColumnIndex,
    variant,
    data,
    showLineNumber,
    rowChecked,
  } = useAppStore(
    useShallow(s => ({
      summaryHeight: s.summaryHeight,
      summaryRowHeight: s.summaryRowHeight,
      summary: s.summary,
      columns: s.columns,
      frozenColumnIndex: s.frozenColumnIndex,
      variant: s.variant,
      data: s.data,
      showLineNumber: s.showLineNumber,
      rowChecked: s.rowChecked,
    })),
  );

  const hasRowSelection = !!rowChecked;

  const summaryRows = useMemo(() => normalizeSummaryRows(summary), [summary]);

  const renderedRows = useMemo(() => {
    const targetColumns = columns.slice(0, frozenColumnIndex);
    return summaryRows.map((row, rowIndex) => ({
      row,
      rowIndex,
      cells: buildSummaryRowCells(targetColumns, row.columns, 0),
    }));
  }, [summaryRows, columns, frozenColumnIndex]);

  return (
    <SummaryTable variant={variant} summaryHeight={summaryHeight} position={position}>
      <TableColGroupFrozen />
      <tbody role={'rfdg-summay-frozen'}>
        {renderedRows.map(({ row, rowIndex, cells }) => {
          const rowHeight = row.height ?? summaryRowHeight;
          return (
            <tr
              key={row.id ?? rowIndex}
              className={['bgrid-summary-row', row.className ?? ''].filter(Boolean).join(' ')}
              style={{
                ...(rowHeight !== undefined ? { height: rowHeight } : {}),
                ...row.style,
              }}
            >
              {showLineNumber && <HeadTd className={!hasRowSelection ? 'bordered' : ''}>&nbsp;</HeadTd>}
              {hasRowSelection && <td className={'bordered'}>&nbsp;</td>}
              {cells.map((cell, index) => {
                if (!cell || !cell.column) return null;
                const { column, summaryColumn, columnIndex } = cell;
                if (!summaryColumn) return <td key={index}></td>;
                return (
                  <td
                    key={index}
                    className={summaryColumn.className}
                    style={{
                      textAlign: summaryColumn.align,
                      ...summaryColumn.style,
                    }}
                    colSpan={summaryColumn.colSpan ?? 1}
                  >
                    {summaryColumn.itemRender?.({
                      column,
                      columnIndex,
                      rowIndex,
                      data,
                    })}
                  </td>
                );
              })}
            </tr>
          );
        })}
      </tbody>
    </SummaryTable>
  );
}
