import { describe, expect, it } from 'vitest';
import type { AppModelColumn, BGridCellSelectionRange } from '../beautiful-grid/types';
import {
  clipCellSelectionFragment,
  getCellSelectionFragments,
} from '../beautiful-grid/utils/cellSelectionGeometry';

const columns: AppModelColumn<Record<string, unknown>>[] = [
  { columnId: 'id', key: 'id', label: 'ID', width: 60, left: -1 },
  { columnId: 'group', key: 'group', label: 'Group', width: 90, left: -1 },
  { columnId: 'name', key: 'name', label: 'Name', width: 120, left: 0 },
  { columnId: 'status', key: 'status', label: 'Status', width: 80, left: 120 },
];

function getFragments(ranges: BGridCellSelectionRange[], overrides: Partial<Parameters<typeof getCellSelectionFragments>[0]> = {}) {
  return getCellSelectionFragments({
    ranges,
    columns,
    rowCount: 20,
    rowHeight: 30,
    frozenColumnCount: 2,
    frozenRowCount: 3,
    frozenColumnsWidth: 190,
    ...overrides,
  });
}

describe('cell selection geometry', () => {
  it('splits a selection crossing frozen rows and columns into four seamless fragments', () => {
    const fragments = getFragments([
      { startRowIndex: 1, startColumnIndex: 1, endRowIndex: 5, endColumnIndex: 3 },
    ]);

    expect(fragments).toEqual([
      {
        rangeIndex: 0,
        quadrant: 'top-left',
        left: 100,
        top: 30,
        width: 90,
        height: 60,
        edges: { top: true, right: false, bottom: false, left: true },
      },
      {
        rangeIndex: 0,
        quadrant: 'top-main',
        left: 0,
        top: 30,
        width: 200,
        height: 60,
        edges: { top: true, right: true, bottom: false, left: false },
      },
      {
        rangeIndex: 0,
        quadrant: 'body-left',
        left: 100,
        top: 0,
        width: 90,
        height: 90,
        edges: { top: false, right: false, bottom: true, left: true },
      },
      {
        rangeIndex: 0,
        quadrant: 'body-main',
        left: 0,
        top: 0,
        width: 200,
        height: 90,
        edges: { top: false, right: true, bottom: true, left: false },
      },
    ]);
  });

  it('normalizes reverse drags and clips them to the grid bounds without inventing out-of-range cells', () => {
    expect(
      getFragments([
        { startRowIndex: 4, startColumnIndex: 3, endRowIndex: -2, endColumnIndex: 1 },
        { startRowIndex: -5, startColumnIndex: -3, endRowIndex: -1, endColumnIndex: -1 },
      ]),
    ).toEqual([
      {
        rangeIndex: 0,
        quadrant: 'top-left',
        left: 100,
        top: 0,
        width: 90,
        height: 90,
        edges: { top: true, right: false, bottom: false, left: true },
      },
      {
        rangeIndex: 0,
        quadrant: 'top-main',
        left: 0,
        top: 0,
        width: 200,
        height: 90,
        edges: { top: true, right: true, bottom: false, left: false },
      },
      {
        rangeIndex: 0,
        quadrant: 'body-left',
        left: 100,
        top: 0,
        width: 90,
        height: 60,
        edges: { top: false, right: false, bottom: true, left: true },
      },
      {
        rangeIndex: 0,
        quadrant: 'body-main',
        left: 0,
        top: 0,
        width: 200,
        height: 60,
        edges: { top: false, right: true, bottom: true, left: false },
      },
    ]);
  });

  it('uses the auxiliary frozen width as the data-column offset', () => {
    const fragments = getFragments([
      { startRowIndex: 0, startColumnIndex: 0, endRowIndex: 0, endColumnIndex: 0 },
    ]);

    expect(fragments).toEqual([
      {
        rangeIndex: 0,
        quadrant: 'top-left',
        left: 40,
        top: 0,
        width: 60,
        height: 30,
        edges: { top: true, right: true, bottom: true, left: true },
      },
    ]);
  });

  it('keeps both body quadrants in the shared native scroll-content space', () => {
    const fragments = getFragments([
      { startRowIndex: 8, startColumnIndex: 0, endRowIndex: 9, endColumnIndex: 2 },
    ]);

    expect(fragments.find(fragment => fragment.quadrant === 'body-left')?.top).toBe(150);
    expect(fragments.find(fragment => fragment.quadrant === 'body-main')?.top).toBe(150);
  });

  it('preserves multiple range indexes while rendering a bounded number of fragments', () => {
    const fragments = getFragments([
      { startRowIndex: 0, startColumnIndex: 0, endRowIndex: 19, endColumnIndex: 3 },
      { startRowIndex: 4, startColumnIndex: 2, endRowIndex: 4, endColumnIndex: 2 },
    ]);

    expect(fragments).toHaveLength(5);
    expect(fragments.filter(fragment => fragment.rangeIndex === 0)).toHaveLength(4);
    expect(fragments.filter(fragment => fragment.rangeIndex === 1)).toHaveLength(1);
  });

  it('clips visible geometry without adding borders at viewport cut edges', () => {
    const fragment = getFragments([
      { startRowIndex: 3, startColumnIndex: 2, endRowIndex: 10, endColumnIndex: 3 },
    ]).find(candidate => candidate.quadrant === 'body-main')!;

    expect(clipCellSelectionFragment(fragment, { left: 50, top: 60, width: 100, height: 90 })).toEqual({
      ...fragment,
      left: 50,
      top: 60,
      width: 100,
      height: 90,
      edges: { top: false, right: false, bottom: false, left: false },
    });
    expect(clipCellSelectionFragment(fragment, { left: 500, top: 500, width: 20, height: 20 })).toBeUndefined();
  });
});
