import * as React from 'react';
import TableBody, { BGridBodyRowRange } from './TableBody';

interface Props {
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  style?: React.CSSProperties;
  rowRange?: BGridBodyRowRange;
  role?: string;
  quadrant?: 'top-left' | 'body-left';
  allowRowReorder?: boolean;
  onRowReorderPointerDown?: (event: React.PointerEvent<HTMLButtonElement>, rowIndex: number) => void;
  onRowReorderKeyDown?: (event: React.KeyboardEvent<HTMLButtonElement>, rowIndex: number) => void;
}

function TableBodyFrozen(props: Props) {
  return (
    <TableBody
      scrollContainerRef={props.scrollContainerRef}
      region='left'
      style={props.style}
      rowRange={props.rowRange}
      role={props.role}
      quadrant={props.quadrant}
      allowRowReorder={props.allowRowReorder}
      onRowReorderPointerDown={props.onRowReorderPointerDown}
      onRowReorderKeyDown={props.onRowReorderKeyDown}
    />
  );
}

export default React.memo(TableBodyFrozen);
