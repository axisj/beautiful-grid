import * as React from 'react';
import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '../store';
import { BGridProps } from '../types';
import TableColGroupFrozen from './TableColGroupFrozen';
import { HeadTd } from './TableHead';
import { SummaryTable } from './TableSummary';

interface Props {
  position: NonNullable<BGridProps<any>['summary']>['position'];
}

export function TableSummaryFrozen({ position }: Props) {
  // [Selector Group 1] Summary Configuration - 요약 설정
  const { summaryHeight, summary, columns, columnsGroup, frozenColumnIndex, variant, data, showLineNumber, rowChecked } = useAppStore(
    useShallow(s => ({
      summaryHeight: s.summaryHeight,
      summary: s.summary,
      columns: s.columns,
      columnsGroup: s.columnsGroup,
      frozenColumnIndex: s.frozenColumnIndex,
      variant: s.variant,
      data: s.data,
      showLineNumber: s.showLineNumber,
      rowChecked: s.rowChecked,
    }))
  );

  const hasRowSelection = !!rowChecked;

  const summaryColumns = useMemo(() => {
    let ignoreColumnCnt = 0;
    return columns.slice(0, frozenColumnIndex).map((column, index) => {
      const columnIndex = index;
      const summaryColumn = summary?.columns?.find(sc => sc.columnIndex === columnIndex);

      if (summaryColumn && (summaryColumn.colSpan ?? 1) > 1) {
        ignoreColumnCnt = (summaryColumn.colSpan ?? 1) - 1;
      } else {
        if (ignoreColumnCnt > 0) {
          ignoreColumnCnt--;
          return {};
        }
      }

      return {
        column,
        columnIndex,
        summaryColumn,
      };
    });
  }, [columns, frozenColumnIndex, summary]);

  return (
    <SummaryTable variant={variant} summaryHeight={summaryHeight} position={position}>
      <TableColGroupFrozen />
      <tbody role={'rfdg-summay-frozen'}>
        <tr>
          {showLineNumber && <HeadTd className={!hasRowSelection ? 'bordered' : ''}>&nbsp;</HeadTd>}
          {hasRowSelection && <td className={'bordered'}>&nbsp;</td>}
          {summaryColumns.map(({ column, summaryColumn, columnIndex }, index) => {
            if (!column) return null;
            if (!summaryColumn) return <td key={index}></td>;
            return (
              <td
                key={index}
                style={{
                  textAlign: summaryColumn.align,
                }}
                colSpan={summaryColumn.colSpan ?? 1}
              >
                {summaryColumn.itemRender?.({
                  column,
                  columnIndex,
                  data,
                })}
              </td>
            );
          })}
        </tr>
      </tbody>
    </SummaryTable>
  );
}
