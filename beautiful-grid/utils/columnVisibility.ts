import type {
  BGridColumn,
  BGridColumnGroup,
  BGridColumnGroupNode,
  BGridColumnWithOptionalWidth,
  BGridProps,
  BGridSummaryColumn,
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

function projectSummaryColumn<T>(
  sc: BGridSummaryColumn<T>,
  vMap: Map<number, number>,
): BGridSummaryColumn<T>[] {
  const end = sc.columnIndex + (sc.colSpan ?? 1);
  const idxs: number[] = [];
  for (let i = sc.columnIndex; i < end; i++) {
    const v = vMap.get(i);
    if (v !== undefined) idxs.push(v);
  }
  return idxs.length ? [{ ...sc, columnIndex: idxs[0], colSpan: idxs.length }] : [];
}

function projectSummary<T>(
  summary: BGridProps<T>['summary'],
  vMap: Map<number, number>,
): BGridProps<T>['summary'] {
  if (!summary) return undefined;
  const projectCols = (cols: BGridSummaryColumn<T>[]) => cols.flatMap(c => projectSummaryColumn(c, vMap));
  return {
    ...summary,
    ...(summary.columns ? { columns: projectCols(summary.columns) } : {}),
    ...(summary.rows
      ? {
          rows: summary.rows.map(r => (Array.isArray(r) ? projectCols(r) : { ...r, columns: projectCols(r.columns) })),
        }
      : {}),
  };
}
