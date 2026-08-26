import { BGridDataItem, BGridDataItemStatus } from '../types';

export type BGridRowReorderPhase = 'dragging' | 'settling' | 'cancelling';

export type BGridRowReorderRole = 'source' | 'shift' | 'target' | undefined;

export function moveRowItem<T>(
  items: readonly BGridDataItem<T>[],
  fromIndex: number,
  toIndex: number,
): BGridDataItem<T>[] {
  if (
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length ||
    fromIndex === toIndex
  ) {
    return [...items];
  }

  const nextItems = [...items];
  const source = nextItems.splice(fromIndex, 1)[0];
  nextItems.splice(toIndex, 0, { ...source, status: BGridDataItemStatus.edit });
  return nextItems;
}

export function remapRowIndex(index: number, fromIndex: number, toIndex: number): number {
  if (index === fromIndex) return toIndex;
  if (fromIndex < toIndex && index > fromIndex && index <= toIndex) return index - 1;
  if (toIndex < fromIndex && index >= toIndex && index < fromIndex) return index + 1;
  return index;
}

export function remapCheckedIndexesMap(
  checkedIndexesMap: ReadonlyMap<number, any>,
  fromIndex: number,
  toIndex: number,
): Map<number, any> {
  const next = new Map<number, any>();
  checkedIndexesMap.forEach((value, index) => {
    next.set(remapRowIndex(index, fromIndex, toIndex), value);
  });
  return next;
}

export function getRowReorderTargetIndex(params: {
  fromIndex: number;
  pointerOffsetY: number;
  rowHeight: number;
  rowCount: number;
}): number {
  const { fromIndex, pointerOffsetY, rowHeight, rowCount } = params;
  if (rowCount <= 0 || rowHeight <= 0) return -1;
  return clamp(Math.round(fromIndex + pointerOffsetY / rowHeight), 0, rowCount - 1);
}

export function getRowReorderOffset(params: {
  rowIndex: number;
  fromIndex: number;
  toIndex: number;
  rowHeight: number;
}): number {
  const { rowIndex, fromIndex, toIndex, rowHeight } = params;
  if (rowIndex === fromIndex) return 0;
  if (fromIndex < toIndex && rowIndex > fromIndex && rowIndex <= toIndex) return -rowHeight;
  if (toIndex < fromIndex && rowIndex >= toIndex && rowIndex < fromIndex) return rowHeight;
  return 0;
}

export function getRowReorderRole(params: {
  rowIndex: number;
  fromIndex: number;
  toIndex: number;
}): BGridRowReorderRole {
  const { rowIndex, fromIndex, toIndex } = params;
  if (rowIndex === fromIndex) return 'source';
  if (rowIndex === toIndex && toIndex !== fromIndex) return 'target';
  if (fromIndex < toIndex && rowIndex > fromIndex && rowIndex < toIndex) return 'shift';
  if (toIndex < fromIndex && rowIndex > toIndex && rowIndex < fromIndex) return 'shift';
  return undefined;
}

export function getMaxTransitionTimeMs(style: Pick<CSSStyleDeclaration, 'transitionDelay' | 'transitionDuration'>) {
  const durations = parseTimeList(style.transitionDuration);
  const delays = parseTimeList(style.transitionDelay);
  const count = Math.max(durations.length, delays.length);
  let maximum = 0;

  for (let index = 0; index < count; index++) {
    const duration = durations[index % Math.max(durations.length, 1)] ?? 0;
    const delay = delays[index % Math.max(delays.length, 1)] ?? 0;
    maximum = Math.max(maximum, duration + delay);
  }
  return maximum;
}

function parseTimeList(value: string): number[] {
  if (!value.trim()) return [0];
  return value.split(',').map(part => {
    const token = part.trim();
    if (token.endsWith('ms')) return Number.parseFloat(token) || 0;
    if (token.endsWith('s')) return (Number.parseFloat(token) || 0) * 1000;
    return Number.parseFloat(token) || 0;
  });
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}
