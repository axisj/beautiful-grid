import * as React from 'react';
import { useAppStore } from '../store';
import { getLineNumberWidth } from '../utils';

interface Props {}

function TableColGroupFrozen(props: Props) {
  const frozenColumnIndex = useAppStore(s => s.frozenColumnIndex);
  const data = useAppStore(s => s.data);
  const checkboxHeight = useAppStore(s => Math.min(15, s.itemHeight));
  const columns = useAppStore(s => s.columns);
  const hasRowChecked = useAppStore(s => !!s.rowChecked);
  const showLineNumber = useAppStore(s => s.showLineNumber);
  const reorderEnabled = useAppStore(s => !!s.reorder?.enabled);

  const rowCheckboxWidth = checkboxHeight + 7 * 2;
  const lineNumberWidth = getLineNumberWidth({ dataLength: data.length, reorderable: reorderEnabled });

  return (
    <colgroup>
      {showLineNumber && <col width={lineNumberWidth} />}
      {hasRowChecked && <col width={rowCheckboxWidth} />}
      {columns.slice(0, frozenColumnIndex).map((column, index) => (
        <col key={index} width={column.width ?? 100} />
      ))}
    </colgroup>
  );
}

export default TableColGroupFrozen;
