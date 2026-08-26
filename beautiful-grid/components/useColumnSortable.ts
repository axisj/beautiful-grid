import { useEffect, type RefObject } from 'react';
import type { SortedColumn } from '../types';
import type { HeaderCellDescriptor } from '../utils/buildHeaderMatrix';

interface UseColumnSortableOptions<T> {
  enabled: boolean;
  tbodyRef: RefObject<HTMLTableSectionElement | null>;
  columnsTable: HeaderCellDescriptor<T>[][];
  nestedGroupsActive: boolean;
  sortColumn: (trLevel: number, oldColumn: SortedColumn, newColumn: SortedColumn) => void;
  onSorted: () => void;
}

export function useColumnSortable<T>({
  enabled,
  tbodyRef,
  columnsTable,
  nestedGroupsActive,
  sortColumn,
  onSorted,
}: UseColumnSortableOptions<T>) {
  useEffect(() => {
    if (!enabled) return;

    const tbody = tbodyRef.current;
    if (!tbody) return;

    let disposed = false;
    let instances: Array<{ destroy: () => void }> = [];

    void import('./columnSortableRuntime')
      .then(({ createColumnSortableInstances }) => {
        if (disposed || !tbody.isConnected) return;

        instances = createColumnSortableInstances({
          tbody,
          columnsTable,
          nestedGroupsActive,
          sortColumn,
          onSorted,
        });
      })
      .catch(error => {
        if (!disposed) {
          console.error('[BGrid] Failed to load column reordering.', error);
        }
      });

    return () => {
      disposed = true;
      instances.forEach(instance => instance.destroy());
    };
  }, [columnsTable, enabled, nestedGroupsActive, onSorted, sortColumn, tbodyRef]);
}
