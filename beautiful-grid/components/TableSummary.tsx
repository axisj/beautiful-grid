import { useMemo } from 'react';
import * as React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store';
import { BGridProps } from '../types';
import { buildSummaryRowCells, normalizeSummaryRows } from '../utils';
import TableColGroup from './TableColGroup';

interface Props {
  position: NonNullable<BGridProps<any>['summary']>['position'];
}

export function TableSummary<T>({ position }: Props) {
  // [Selector Group 1] Summary Configuration - 요약 설정
  const { summaryHeight, summaryRowHeight, summary, columns, frozenColumnIndex, variant, data } =
    useAppStore(
      useShallow(s => ({
        summaryHeight: s.summaryHeight,
        summaryRowHeight: s.summaryRowHeight,
        summary: s.summary,
        columns: s.columns,
        frozenColumnIndex: s.frozenColumnIndex,
        variant: s.variant,
        data: s.data,
      })),
    );

  const summaryRows = useMemo(() => normalizeSummaryRows(summary), [summary]);

  const renderedRows = useMemo(() => {
    const targetColumns = columns.slice(frozenColumnIndex);
    return summaryRows.map((row, rowIndex) => ({
      row,
      rowIndex,
      cells: buildSummaryRowCells(targetColumns, row.columns, frozenColumnIndex),
    }));
  }, [summaryRows, columns, frozenColumnIndex]);

  return (
    <SummaryTable variant={variant} summaryHeight={summaryHeight} position={position}>
      <TableColGroup />
      <tbody role={'rfdg-summary'}>
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
              <td data-none />
            </tr>
          );
        })}
      </tbody>
    </SummaryTable>
  );
}

interface SummaryTableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  summaryHeight: number;
  variant: BGridProps<any>['variant'];
  position: NonNullable<BGridProps<any>['summary']>['position'];
}

export function SummaryTable({ summaryHeight, variant, position, className, children, ...rest }: SummaryTableProps) {
  return (
    <table
      className={[
        'bgrid-summary-table',
        position === 'top' ? 'bgrid-summary-position-top' : 'bgrid-summary-position-bottom',
        variant === 'vertical-bordered' ? 'bgrid-summary-vertical-bordered' : '',
        className ?? '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ height: summaryHeight }}
      {...rest}
    >
      {children}
    </table>
  );
}
