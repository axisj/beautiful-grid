import * as React from 'react';
import TableBody, { BGridBodyRowRange, RowKeyRegistry } from './TableBody';
import type { BGridRowHeightMetrics } from '../utils';

interface Props {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  rowKeyRegistry: RowKeyRegistry;
  style?: React.CSSProperties;
  rowRange?: BGridBodyRowRange;
  role?: string;
  quadrant?: 'top-left' | 'body-left';
  allowRowReorder?: boolean;
  onRowReorderPointerDown?: (event: React.PointerEvent<HTMLButtonElement>, rowIndex: number) => void;
  onRowReorderKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>, rowIndex: number) => void;
  rowHeightMetrics?: BGridRowHeightMetrics;
}

function TableBodyFrozen(props: Props) {
  return (
    <TableBody
      scrollContainerRef={props.scrollContainerRef}
      rowKeyRegistry={props.rowKeyRegistry}
      region='left'
      style={props.style}
      rowRange={props.rowRange}
      role={props.role}
      quadrant={props.quadrant}
      allowRowReorder={props.allowRowReorder}
      onRowReorderPointerDown={props.onRowReorderPointerDown}
      onRowReorderKeyDown={props.onRowReorderKeyDown}
      rowHeightMetrics={props.rowHeightMetrics}
    />
  );
}

export default React.memo(TableBodyFrozen);
