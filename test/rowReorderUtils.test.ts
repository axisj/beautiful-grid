import { describe, expect, it } from 'vitest';
import {
  getMaxTransitionTimeMs,
  getRowReorderOffset,
  getRowReorderRole,
  getRowReorderTargetIndex,
  moveRowItem,
  remapCheckedIndexesMap,
  remapRowIndex,
} from '../beautiful-grid/utils/rowReorder';
import { BGridDataItemStatus } from '../beautiful-grid/types';

describe('row reorder utilities', () => {
  it('moves a row without mutating the input and marks only the moved wrapper as edited', () => {
    const input = ['A', 'B', 'C', 'D'].map(id => ({ values: { id } }));
    const result = moveRowItem(input, 0, 3);

    expect(result.map(item => item.values.id)).toEqual(['B', 'C', 'D', 'A']);
    expect(result[3]).not.toBe(input[0]);
    expect(result[3].status).toBe(BGridDataItemStatus.edit);
    expect(result.slice(0, 3)).toEqual(input.slice(1));
    expect(input.map(item => item.values.id)).toEqual(['A', 'B', 'C', 'D']);
  });

  it('remaps indexes in both directions', () => {
    expect([0, 1, 2, 3, 4].map(index => remapRowIndex(index, 0, 3))).toEqual([3, 0, 1, 2, 4]);
    expect([0, 1, 2, 3, 4].map(index => remapRowIndex(index, 3, 0))).toEqual([1, 2, 3, 0, 4]);
  });

  it('remaps checked rows with the same permutation', () => {
    const result = remapCheckedIndexesMap(new Map([[0, true], [2, 'selected'], [4, true]]), 0, 3);
    expect([...result.entries()]).toEqual([[3, true], [1, 'selected'], [4, true]]);
  });

  it('uses half-row thresholds and clamps the pointer-derived target', () => {
    expect(getRowReorderTargetIndex({ fromIndex: 2, pointerOffsetY: 13, rowHeight: 30, rowCount: 6 })).toBe(2);
    expect(getRowReorderTargetIndex({ fromIndex: 2, pointerOffsetY: 16, rowHeight: 30, rowCount: 6 })).toBe(3);
    expect(getRowReorderTargetIndex({ fromIndex: 2, pointerOffsetY: -1000, rowHeight: 30, rowCount: 6 })).toBe(0);
    expect(getRowReorderTargetIndex({ fromIndex: 2, pointerOffsetY: 1000, rowHeight: 30, rowCount: 6 })).toBe(5);
  });

  it('computes symmetric displacement and semantic roles', () => {
    expect([0, 1, 2, 3, 4].map(rowIndex => getRowReorderOffset({ rowIndex, fromIndex: 0, toIndex: 3, rowHeight: 30 }))).toEqual([0, -30, -30, -30, 0]);
    expect([0, 1, 2, 3, 4].map(rowIndex => getRowReorderOffset({ rowIndex, fromIndex: 3, toIndex: 0, rowHeight: 30 }))).toEqual([30, 30, 30, 0, 0]);
    expect([0, 1, 2, 3].map(rowIndex => getRowReorderRole({ rowIndex, fromIndex: 0, toIndex: 3 }))).toEqual(['source', 'shift', 'shift', 'target']);
  });

  it('parses combined CSS transition durations and delays', () => {
    expect(getMaxTransitionTimeMs({ transitionDuration: '0.15s, 40ms', transitionDelay: '10ms, 0s' } as CSSStyleDeclaration)).toBe(160);
    expect(getMaxTransitionTimeMs({ transitionDuration: '0s', transitionDelay: '0s' } as CSSStyleDeclaration)).toBe(0);
  });
});
