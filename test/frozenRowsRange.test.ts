import { describe, expect, it } from 'vitest';
import { getVisibleScrollableRowRange } from '../beautiful-grid/utils/getVisibleScrollableRowRange';

describe('getVisibleScrollableRowRange', () => {
  it('excludes frozen rows from the scroll content and logical range', () => {
    expect(
      getVisibleScrollableRowRange({
        scrollTop: 0,
        viewportHeight: 90,
        rowHeight: 30,
        frozenRowCount: 2,
        totalRowCount: 100,
        overscan: 0,
      }),
    ).toEqual({
      startRowIndex: 2,
      endRowIndex: 5,
      paddingTop: 0,
      scrollContentHeight: 2940,
    });
  });

  it('maps physical scrolling to rows after the frozen boundary', () => {
    expect(
      getVisibleScrollableRowRange({
        scrollTop: 75,
        viewportHeight: 60,
        rowHeight: 30,
        frozenRowCount: 2,
        totalRowCount: 10,
        overscan: 1,
      }),
    ).toMatchObject({
      startRowIndex: 4,
      endRowIndex: 7,
      paddingTop: 60,
    });
  });

  it('clamps the frozen count and empty ranges', () => {
    expect(
      getVisibleScrollableRowRange({
        scrollTop: 500,
        viewportHeight: 120,
        rowHeight: 30,
        frozenRowCount: 20,
        totalRowCount: 3,
      }),
    ).toEqual({
      startRowIndex: 3,
      endRowIndex: 3,
      paddingTop: 0,
      scrollContentHeight: 0,
    });
  });

  it('keeps a stable rendered row window across adjacent scroll positions', () => {
    const first = getVisibleScrollableRowRange({
      scrollTop: 120,
      viewportHeight: 300,
      rowHeight: 30,
      frozenRowCount: 2,
      totalRowCount: 500,
      windowSize: 8,
    });
    const adjacent = getVisibleScrollableRowRange({
      scrollTop: 210,
      viewportHeight: 300,
      rowHeight: 30,
      frozenRowCount: 2,
      totalRowCount: 500,
      windowSize: 8,
    });
    const nextWindow = getVisibleScrollableRowRange({
      scrollTop: 240,
      viewportHeight: 300,
      rowHeight: 30,
      frozenRowCount: 2,
      totalRowCount: 500,
      windowSize: 8,
    });

    expect(adjacent).toEqual(first);
    expect(nextWindow.startRowIndex).toBe(first.startRowIndex + 8);
    expect(nextWindow.paddingTop).toBe(first.paddingTop + 240);
  });

  it('keeps rows mounted above and below the viewport for fast bidirectional scrolling', () => {
    expect(
      getVisibleScrollableRowRange({
        scrollTop: 600,
        viewportHeight: 300,
        rowHeight: 30,
        frozenRowCount: 2,
        totalRowCount: 500,
        overscan: 10,
        leadingOverscan: 10,
        windowSize: 8,
      }),
    ).toMatchObject({
      startRowIndex: 8,
      endRowIndex: 45,
      paddingTop: 180,
    });
  });
});
