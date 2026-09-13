import { useAppStore, useAppStoreApi } from '../store';
import * as React from 'react';
import { BGridColumn, BGridDataItem, DIRC_MAP, MoveDirection } from '../types';
import { getCellValueByRowKey } from './getCellValue';
import { getColumnId } from './getColumnId';

interface CellMergeColumn<T> {
  columnIndex: number;
  columnKey: string;
  mergeBy: string | string[];
}

type RowSpanMap = Map<number, Map<number, number>>;

const mergeRowSpanCache = new WeakMap<BGridDataItem<any>[], Map<string, RowSpanMap>>();

function getMergeCacheKey(
  startIdx: number,
  endNumber: number,
  mergeColumns: CellMergeColumn<any>[],
) {
  const columnsSignature = mergeColumns
    .map(
      rule =>
        `${rule.columnIndex}:${rule.columnKey}:${Array.isArray(rule.mergeBy) ? rule.mergeBy.join('.') : rule.mergeBy}`,
    )
    .join('|');
  return `${startIdx}:${endNumber}:${columnsSignature}`;
}

function computeMergeRowSpans(
  data: BGridDataItem<any>[],
  startIdx: number,
  endNumber: number,
  mergeColumns: CellMergeColumn<any>[],
): RowSpanMap {
  const rowSpanMap: RowSpanMap = new Map();

  const setRowSpan = (rowIndex: number, columnIndex: number, rowSpan: number) => {
    const rowMap = rowSpanMap.get(rowIndex);
    if (rowMap) {
      rowMap.set(columnIndex, rowSpan);
      return;
    }

    rowSpanMap.set(rowIndex, new Map([[columnIndex, rowSpan]]));
  };

  mergeColumns.forEach(rule => {
    let anchorRowIndex: number | undefined;
    let prevValue: any = undefined;

    for (let ri = startIdx; ri < endNumber; ri++) {
      const item = data[ri];
      const value = getCellValueByRowKey(rule.mergeBy, item.values);

      if (ri === startIdx || anchorRowIndex === undefined || !Object.is(prevValue, value)) {
        anchorRowIndex = ri;
        setRowSpan(ri, rule.columnIndex, 1);
      } else {
        setRowSpan(ri, rule.columnIndex, 0);

        if (anchorRowIndex !== undefined) {
          const anchorMap = rowSpanMap.get(anchorRowIndex);
          const anchorSpan = anchorMap?.get(rule.columnIndex) ?? 1;
          setRowSpan(anchorRowIndex, rule.columnIndex, anchorSpan + 1);
        }
      }

      prevValue = value;
    }
  });

  return rowSpanMap;
}

export function useBodyData(startIdx: number, endNumber: number, data: BGridDataItem<any>[]) {
  const store = useAppStoreApi();
  const columns = useAppStore(s => s.columns);
  const cellMergeOptions = useAppStore(s => s.cellMergeOptions);
  const setEditItem = useAppStore(s => s.setEditItem);
  const setActiveCell = useAppStore(s => s.setActiveCell);
  const selectedKeyMap = useAppStore(s => s.checkedIndexesMap);
  const setSelectedKeys = useAppStore(s => s.setCheckedIndexes);
  const sourceIndexByVisibleIndex = useAppStore(s => s.sourceIndexByVisibleIndex);

  const mergeColumns = React.useMemo(() => {
    const columnsMap = cellMergeOptions?.columnsMap;
    if (!columnsMap) return [] as CellMergeColumn<any>[];

    return Object.keys(columnsMap).map(k => {
      const columnIndex = Number(k);
      return {
        columnIndex,
        columnKey: columns[columnIndex].key.toString(),
        mergeBy: columnsMap[columnIndex].mergeBy,
      };
    });
  }, [cellMergeOptions?.columnsMap, columns]);

  const rowSpanMap = React.useMemo(() => {
    if (mergeColumns.length === 0) return new Map() as RowSpanMap;

    const cacheKey = getMergeCacheKey(startIdx, endNumber, mergeColumns);
    const cachedByRange = mergeRowSpanCache.get(data);
    const cached = cachedByRange?.get(cacheKey);
    if (cached) return cached;

    const computed = computeMergeRowSpans(data, startIdx, endNumber, mergeColumns);
    const rangeCache = cachedByRange ?? new Map<string, RowSpanMap>();
    rangeCache.set(cacheKey, computed);
    mergeRowSpanCache.set(data, rangeCache);

    return computed;
  }, [data, endNumber, mergeColumns, startIdx]);

  const dataSet = React.useMemo(() => {
    return data.slice(startIdx, endNumber);
  }, [data, endNumber, startIdx]);

  const getRowSpan = React.useCallback(
    (rowIndex: number, columnIndex: number) => {
      return rowSpanMap.get(rowIndex)?.get(columnIndex) ?? 1;
    },
    [rowSpanMap],
  );

  const setItemValue = React.useCallback(
    async (_ri: number, _ci: number, column: BGridColumn<any>, newValue: any) => {
      const state = store.getState();
      const session = state.cellInteractionSession;
      if (session?.kind !== 'editor') return;
      await state.requestCellCommit({
        sessionId: session.id,
        source: 'itemRender',
        changes: [{ columnId: getColumnId(column), value: newValue }],
      });
    },
    [store],
  );

  const handleMoveEditFocus = React.useCallback(
    async (rowIndex: number, columnIndex: number, columnDirection?: MoveDirection, rowDirection?: MoveDirection) => {
      if (columnDirection && rowDirection) {
        if (columns.length === 0 || data.length === 0) {
          setEditItem(-1, -1);
          return;
        }

        let _ci = columnIndex + DIRC_MAP[columnDirection];
        let _ri = rowIndex + DIRC_MAP[rowDirection];

        if (_ci > columns.length - 1) _ci = 0;
        if (_ci < 0) _ci = columns.length - 1;
        if (_ri > data.length - 1) _ri = 0;
        if (_ri < 0) _ri = data.length - 1;

        setActiveCell({ rowIndex: _ri, columnIndex: _ci });
        setEditItem(_ri, _ci);
      } else {
        setEditItem(-1, -1);
      }
    },
    [columns.length, data.length, setActiveCell, setEditItem],
  );

  const handleChangeChecked = React.useCallback(
    async (index: number, checked: boolean) => {
      const sourceIndex = sourceIndexByVisibleIndex?.[index] ?? index;
      const sourceItem = store.getState().sourceData[sourceIndex];
      if (sourceItem && sourceItem !== data[index]) sourceItem.checked = checked;
      if (data[index]) data[index].checked = checked;
      if (checked) {
        selectedKeyMap.set(sourceIndex, true);
      } else {
        selectedKeyMap.delete(sourceIndex);
      }
      setSelectedKeys([...selectedKeyMap.keys()]);
    },
    [data, selectedKeyMap, setSelectedKeys, sourceIndexByVisibleIndex, store],
  );

  const handleChangeCheckedRadio = React.useCallback(
    async (index: number) => {
      const sourceIndex = sourceIndexByVisibleIndex?.[index] ?? index;
      const sourceData = store.getState().sourceData;
      for (const previousSourceIndex of selectedKeyMap.keys()) {
        const previousItem = sourceData[previousSourceIndex];
        if (previousItem) previousItem.checked = false;
      }
      selectedKeyMap.clear();
      selectedKeyMap.set(sourceIndex, true);
      const sourceItem = sourceData[sourceIndex];
      if (sourceItem && sourceItem !== data[index]) sourceItem.checked = true;
      if (data[index]) data[index].checked = true;
      setSelectedKeys([sourceIndex]);
    },
    [data, selectedKeyMap, setSelectedKeys, sourceIndexByVisibleIndex, store],
  );

  return {
    dataSet,
    setItemValue,
    handleMoveEditFocus,
    handleChangeChecked,
    handleChangeCheckedRadio,
    getRowSpan,
  };
}
