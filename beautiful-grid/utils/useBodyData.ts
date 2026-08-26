import { useAppStore } from '../store';
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
  const columns = useAppStore(s => s.columns);
  const cellMergeOptions = useAppStore(s => s.cellMergeOptions);
  const setData = useAppStore(s => s.setData);
  const setEditItem = useAppStore(s => s.setEditItem);
  const setActiveCell = useAppStore(s => s.setActiveCell);
  const selectedKeyMap = useAppStore(s => s.checkedIndexesMap);
  const setSelectedKeys = useAppStore(s => s.setCheckedIndexes);
  const cellInteractionSession = useAppStore(s => s.cellInteractionSession);
  const requestCellCommit = useAppStore(s => s.requestCellCommit);
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
      if (cellInteractionSession?.kind !== 'editor') return;
      await requestCellCommit({
        sessionId: cellInteractionSession.id,
        source: 'itemRender',
        changes: [{ columnId: getColumnId(column), value: newValue }],
      });
    },
    [cellInteractionSession, requestCellCommit],
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
      if (checked) {
        data[index].checked = true;
        selectedKeyMap.set(sourceIndex, true);
      } else {
        data[index].checked = false;
        selectedKeyMap.delete(sourceIndex);
      }
      setSelectedKeys([...selectedKeyMap.keys()]);
      setData([...data]);
    },
    [data, selectedKeyMap, setData, setSelectedKeys, sourceIndexByVisibleIndex],
  );

  const handleChangeCheckedRadio = React.useCallback(
    async (index: number) => {
      const sourceIndex = sourceIndexByVisibleIndex?.[index] ?? index;
      selectedKeyMap.clear();
      selectedKeyMap.set(sourceIndex, true);
      setSelectedKeys([sourceIndex]);
      data.forEach((n, idx) => {
        n.checked = idx === index;
      });
      setData([...data]);
    },
    [data, selectedKeyMap, setData, setSelectedKeys, sourceIndexByVisibleIndex],
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
