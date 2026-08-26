import * as React from 'react';
import { useAppStore } from '../store';

function TableColGroup() {
  const frozenColumnIndex = useAppStore(s => s.frozenColumnIndex);
  const columns = useAppStore(s => s.columns);

  return (
    <colgroup>
      {columns.slice(frozenColumnIndex).map((column, index) => (
        <col key={index} width={column.width ?? 100} />
      ))}
      <col />
    </colgroup>
  );
}

export default TableColGroup;
