import Sortable from 'sortablejs';
import type { SortedColumn } from '../types';
import type { HeaderCellDescriptor } from '../utils/buildHeaderMatrix';

interface CreateColumnSortableInstancesOptions<T> {
  tbody: HTMLTableSectionElement;
  columnsTable: HeaderCellDescriptor<T>[][];
  nestedGroupsActive: boolean;
  sortColumn: (trLevel: number, oldColumn: SortedColumn, newColumn: SortedColumn) => void;
  onSorted: () => void;
}

export function createColumnSortableInstances<T>({
  tbody,
  columnsTable,
  nestedGroupsActive,
  sortColumn,
  onSorted,
}: CreateColumnSortableInstancesOptions<T>): Sortable[] {
  return columnsTable.flatMap((row, rowIndex) => {
    const element = tbody.querySelector(`[data-columns-tr="${rowIndex}"]`);
    if (!element) return [];

    const draggableCells = row.filter(cell => cell.type === 'column' || !nestedGroupsActive);

    return [
      Sortable.create(element as HTMLElement, {
        animation: 150,
        draggable: '.drag-item',
        handle: '.bgrid-column-drag-handle',
        filter: '.bgrid-toolbox-trigger-btn, .bgrid-col-resizer',
        preventOnFilter: false,
        forceFallback: true,
        fallbackOnBody: true,
        onSort: event => {
          const oldIndex = event.oldDraggableIndex ?? event.oldIndex;
          const newIndex = event.newDraggableIndex ?? event.newIndex;
          if (oldIndex === newIndex) return;
          if (oldIndex === undefined || newIndex === undefined) return;

          const oldCell = draggableCells[oldIndex];
          const newCell = draggableCells[newIndex];
          if (!oldCell || !newCell) return;
          if (nestedGroupsActive && oldCell.parentGroupId !== newCell.parentGroupId) {
            onSorted();
            return;
          }

          sortColumn(
            rowIndex,
            { index: oldIndex, columnIndex: oldCell.startColumnIndex },
            { index: newIndex, columnIndex: newCell.startColumnIndex },
          );
          onSorted();
        },
      }),
    ];
  });
}
