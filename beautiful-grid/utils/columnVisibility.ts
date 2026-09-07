import type {
  BGridColumn,
  BGridColumnGroup,
  BGridColumnGroupNode,
  BGridColumnWithOptionalWidth,
  BGridProps,
} from '../types';
import { getColumnId } from './getColumnId';

interface ProjectColumnVisibilityOptions<T> {
  columns: BGridColumnWithOptionalWidth<T>[];
  hiddenColumnIds: ReadonlySet<string>;
  frozenColumnIndex: number;
  columnsGroup?: BGridColumnGroup[];
  columnGroups?: BGridColumnGroupNode[];
  cellMergeOptions?: BGridProps<T>['cellMergeOptions'];
  summary?: BGridProps<T>['summary'];
}

export interface ColumnVisibilityProjection<T> {
  columns: BGridColumnWithOptionalWidth<T>[];
  visibleOriginalIndexes: number[];
  frozenColumnIndex: number;
  columnsGroup: BGridColumnGroup[];
  columnGroups: BGridColumnGroupNode[];
  cellMergeOptions?: BGridProps<T>['cellMergeOptions'];
  summary?: BGridProps<T>['summary'];
}

export function projectColumnVisibility<T>({
  columns,
  hiddenColumnIds,
  frozenColumnIndex,
  columnsGroup = [],
  columnGroups = [],
  cellMergeOptions,
  summary,
}: ProjectColumnVisibilityOptions<T>): ColumnVisibilityProjection<T> {
  const visibleOriginalIndexes = columns.reduce<number[]>((indexes, column, originalIndex) => {
    if (!hiddenColumnIds.has(getColumnId(column as BGridColumn<T>))) indexes.push(originalIndex);
    return indexes;
  }, []);
  if (visibleOriginalIndexes.length === columns.length) {
    return {
      columns,
      visibleOriginalIndexes,
      frozenColumnIndex,
      columnsGroup,
      columnGroups,
      cellMergeOptions,
      summary,
    };
  }
  const visibleColumnIds = new Set(
    visibleOriginalIndexes.map(index => getColumnId(columns[index] as BGridColumn<T>)),
  );
  const visibleIndexByOriginalIndex = new Map(
    visibleOriginalIndexes.map((originalIndex, visibleIndex) => [originalIndex, visibleIndex]),
  );

  return {
    columns: visibleOriginalIndexes.map(index => columns[index]),
    visibleOriginalIndexes,
    frozenColumnIndex: visibleOriginalIndexes.filter(index => index < frozenColumnIndex).length,
    columnsGroup: projectLegacyGroups(columnsGroup, visibleIndexByOriginalIndex),
    columnGroups: projectNestedGroups(columnGroups, visibleColumnIds),
    cellMergeOptions: projectCellMergeOptions(cellMergeOptions, visibleIndexByOriginalIndex),
    summary: projectSummary(summary, visibleIndexByOriginalIndex),
  };
}

function projectLegacyGroups(
  groups: BGridColumnGroup[],
  visibleIndexByOriginalIndex: Map<number, number>,
): BGridColumnGroup[] {
  return groups.flatMap(group => {
    const visibleIndexes: number[] = [];
    for (let index = group.groupStartIndex; index <= group.groupEndIndex; index += 1) {
      const visibleIndex = visibleIndexByOriginalIndex.get(index);
      if (visibleIndex !== undefined) visibleIndexes.push(visibleIndex);
    }
    if (!visibleIndexes.length) return [];
    return [{
      ...group,
      groupStartIndex: visibleIndexes[0],
      groupEndIndex: visibleIndexes[visibleIndexes.length - 1],
    }];
  });
}

function projectNestedGroups(
  groups: BGridColumnGroupNode[],
  visibleColumnIds: Set<string>,
): BGridColumnGroupNode[] {
  return groups.flatMap(group => {
    const children = group.children.flatMap<string | BGridColumnGroupNode>(child => {
      if (typeof child === 'string') return visibleColumnIds.has(child) ? [child] : [];
      return projectNestedGroups([child], visibleColumnIds);
    });
    return children.length ? [{ ...group, children }] : [];
  });
}

function projectCellMergeOptions<T>(
  options: BGridProps<T>['cellMergeOptions'],
  visibleIndexByOriginalIndex: Map<number, number>,
): BGridProps<T>['cellMergeOptions'] {
  if (!options) return undefined;
  const columnsMap = Object.entries(options.columnsMap).reduce<Record<number, typeof options.columnsMap[number]>>(
    (nextMap, [originalIndexText, config]) => {
      const visibleIndex = visibleIndexByOriginalIndex.get(Number(originalIndexText));
      if (visibleIndex !== undefined) nextMap[visibleIndex] = config;
      return nextMap;
    },
    {},
  );
  return { ...options, columnsMap };
}

function projectSummary<T>(
  summary: BGridProps<T>['summary'],
  visibleIndexByOriginalIndex: Map<number, number>,
): BGridProps<T>['summary'] {
  if (!summary) return undefined;
  const columns = summary.columns.flatMap(summaryColumn => {
    const originalEnd = summaryColumn.columnIndex + (summaryColumn.colSpan ?? 1);
    const visibleIndexes: number[] = [];
    for (let index = summaryColumn.columnIndex; index < originalEnd; index += 1) {
      const visibleIndex = visibleIndexByOriginalIndex.get(index);
      if (visibleIndex !== undefined) visibleIndexes.push(visibleIndex);
    }
    if (!visibleIndexes.length) return [];
    return [{
      ...summaryColumn,
      columnIndex: visibleIndexes[0],
      colSpan: visibleIndexes.length,
    }];
  });
  return { ...summary, columns };
}
