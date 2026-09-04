import { describe, expect, it } from 'vitest';
import {
  clamp,
  clampCellAddress,
  getColumnLeft,
  getColumnRight,
  getRowTop,
  getRowBottom,
  ensureCellVisible,
} from '../beautiful-grid/utils/coordinate';
import { AppModelColumn } from '../beautiful-grid/types';

describe('Coordinate & Viewport Utilities', () => {
  describe('clamp', () => {
    it('keeps value within range', () => {
      expect(clamp(5, 0, 10)).toBe(5);
    });

    it('clamps to min when value is below min', () => {
      expect(clamp(-5, 0, 10)).toBe(0);
    });

    it('clamps to max when value is above max', () => {
      expect(clamp(15, 0, 10)).toBe(10);
    });

    it('handles min === max', () => {
      expect(clamp(5, 3, 3)).toBe(3);
    });
  });

  describe('clampCellAddress', () => {
    it('keeps valid cell address as-is', () => {
      const address = { rowIndex: 4, columnIndex: 2 };
      expect(clampCellAddress(address, 10, 5)).toEqual({ rowIndex: 4, columnIndex: 2 });
    });

    it('clamps negative coordinates to 0', () => {
      const address = { rowIndex: -3, columnIndex: -1 };
      expect(clampCellAddress(address, 10, 5)).toEqual({ rowIndex: 0, columnIndex: 0 });
    });

    it('clamps coordinates exceeding total row and column counts', () => {
      const address = { rowIndex: 20, columnIndex: 10 };
      expect(clampCellAddress(address, 10, 5)).toEqual({ rowIndex: 9, columnIndex: 4 });
    });

    it('handles empty grid with 0 rows and 0 columns', () => {
      const address = { rowIndex: 5, columnIndex: 3 };
      expect(clampCellAddress(address, 0, 0)).toEqual({ rowIndex: 0, columnIndex: 0 });
    });

    it('handles single cell grid (1x1)', () => {
      const address = { rowIndex: 10, columnIndex: 10 };
      expect(clampCellAddress(address, 1, 1)).toEqual({ rowIndex: 0, columnIndex: 0 });
    });
  });

  describe('getColumnLeft & getColumnRight', () => {
    const computedColumns: AppModelColumn<any>[] = [
      { columnId: 'col0', key: 'col0', label: 'Col 0', width: 50, left: -1 }, // frozen 0
      { columnId: 'col1', key: 'col1', label: 'Col 1', width: 70, left: -1 }, // frozen 1
      { columnId: 'col2', key: 'col2', label: 'Col 2', width: 120, left: 0 },  // scrollable 0
      { columnId: 'col3', key: 'col3', label: 'Col 3', width: 200, left: 120 },// scrollable 1
    ];

    it('uses scroll-container coordinates from computed columns', () => {
      expect(getColumnLeft(2, computedColumns)).toBe(0);
      expect(getColumnRight(2, computedColumns)).toBe(120);

      expect(getColumnLeft(3, computedColumns)).toBe(120);
      expect(getColumnRight(3, computedColumns)).toBe(320);
    });

    it('calculates left within frozen section for frozen columns (left = -1)', () => {
      expect(getColumnLeft(0, computedColumns)).toBe(0);
      expect(getColumnRight(0, computedColumns)).toBe(50);

      expect(getColumnLeft(1, computedColumns)).toBe(50);
      expect(getColumnRight(1, computedColumns)).toBe(120);
    });

    it('returns 0 for out of bounds column index or an empty array', () => {
      expect(getColumnLeft(-1, computedColumns)).toBe(0);
      expect(getColumnLeft(10, computedColumns)).toBe(0);
      expect(getColumnRight(-1, computedColumns)).toBe(0);
      expect(getColumnRight(10, computedColumns)).toBe(0);
      expect(getColumnLeft(0, [])).toBe(0);
      expect(getColumnRight(0, [])).toBe(0);
    });
  });

  describe('getRowTop & getRowBottom', () => {
    const rowHeight = 30;

    it('calculates top and bottom for rows', () => {
      expect(getRowTop(0, rowHeight)).toBe(0);
      expect(getRowBottom(0, rowHeight)).toBe(30);

      expect(getRowTop(1, rowHeight)).toBe(30);
      expect(getRowBottom(1, rowHeight)).toBe(60);

      expect(getRowTop(5, rowHeight)).toBe(150);
      expect(getRowBottom(5, rowHeight)).toBe(180);
    });

    it('handles zero or negative row index and row height', () => {
      expect(getRowTop(-1, rowHeight)).toBe(0);
      expect(getRowBottom(-1, rowHeight)).toBe(0);
      expect(getRowTop(2, 0)).toBe(0);
      expect(getRowBottom(2, 0)).toBe(0);
    });
  });

  describe('ensureCellVisible', () => {
    const columns: AppModelColumn<any>[] = [
      { columnId: 'c0', key: 'c0', label: 'C0', width: 60, left: -1 },  // frozen col 0
      { columnId: 'c1', key: 'c1', label: 'C1', width: 100, left: 0 },   // scrollable col 1
      { columnId: 'c2', key: 'c2', label: 'C2', width: 150, left: 100 }, // scrollable col 2
      { columnId: 'c3', key: 'c3', label: 'C3', width: 200, left: 250 }, // scrollable col 3
      { columnId: 'c4', key: 'c4', label: 'C4', width: 120, left: 450 }, // scrollable col 4
    ];
    const rowHeight = 30;

    function createMockScrollContainer(opts: {
      scrollTop?: number;
      scrollLeft?: number;
      clientWidth?: number;
      clientHeight?: number;
      scrollWidth?: number;
      scrollHeight?: number;
    }) {
      const el = document.createElement('div');
      let st = opts.scrollTop ?? 0;
      let sl = opts.scrollLeft ?? 0;

      Object.defineProperty(el, 'scrollTop', {
        get: () => st,
        set: v => {
          st = v;
        },
      });
      Object.defineProperty(el, 'scrollLeft', {
        get: () => sl,
        set: v => {
          sl = v;
        },
      });
      Object.defineProperty(el, 'clientWidth', {
        get: () => opts.clientWidth ?? 300,
      });
      Object.defineProperty(el, 'clientHeight', {
        get: () => opts.clientHeight ?? 200,
      });
      Object.defineProperty(el, 'scrollWidth', {
        get: () => opts.scrollWidth ?? 800,
      });
      Object.defineProperty(el, 'scrollHeight', {
        get: () => opts.scrollHeight ?? 1000,
      });

      return el;
    }

    it('does not scroll when cell is already within visible viewport', () => {
      const container = createMockScrollContainer({
        scrollTop: 60,
        scrollLeft: 100,
        clientWidth: 300,
        clientHeight: 200,
      });

      // Cell at row 3 (top: 90, bottom: 120), col 2 (left: 100, right: 250)
      const res = ensureCellVisible({
        cell: { rowIndex: 3, columnIndex: 2 },
        scrollContainer: container,
        columns,
        rowHeight,
        frozenColumnCount: 1,
        frozenRowCount: 0,
      });

      expect(res.didScroll).toBe(false);
      expect(res.scrollTop).toBe(60);
      expect(res.scrollLeft).toBe(100);
      expect(container.scrollTop).toBe(60);
      expect(container.scrollLeft).toBe(100);
    });

    it('scrolls down when cell is below the viewport', () => {
      const container = createMockScrollContainer({
        scrollTop: 0,
        scrollLeft: 0,
        clientWidth: 300,
        clientHeight: 120, // 4 rows visible (0..120)
      });

      // Cell at row 6 (top: 180, bottom: 210)
      const res = ensureCellVisible({
        cell: { rowIndex: 6, columnIndex: 1 },
        scrollContainer: container,
        columns,
        rowHeight,
        frozenColumnCount: 1,
        frozenRowCount: 0,
      });

      expect(res.didScrollTop).toBe(true);
      expect(res.scrollTop).toBe(210 - 120); // 90
      expect(container.scrollTop).toBe(90);
    });

    it('uses the logical maximum when sticky chrome is included in the viewport height', () => {
      const container = createMockScrollContainer({
        scrollTop: 1770,
        clientWidth: 300,
        clientHeight: 230,
      });

      const res = ensureCellVisible({
        cell: { rowIndex: 99, columnIndex: 1 },
        scrollContainer: container,
        columns,
        rowHeight: 20,
        verticalScrollState: {
          scrollTop: 1770,
          scrollHeight: 2000,
          maxScrollTop: 1800,
        },
        viewportInsets: { bottom: 30 },
      });

      expect(res.didScrollTop).toBe(true);
      expect(res.scrollTop).toBe(1800);
    });

    it('scrolls up when cell is above the viewport', () => {
      const container = createMockScrollContainer({
        scrollTop: 200,
        scrollLeft: 0,
        clientWidth: 300,
        clientHeight: 150,
      });

      // Cell at row 2 (top: 60, bottom: 90)
      const res = ensureCellVisible({
        cell: { rowIndex: 2, columnIndex: 1 },
        scrollContainer: container,
        columns,
        rowHeight,
        frozenColumnCount: 1,
        frozenRowCount: 0,
      });

      expect(res.didScrollTop).toBe(true);
      expect(res.scrollTop).toBe(60);
      expect(container.scrollTop).toBe(60);
    });

    it('scrolls right when cell is to the right of the viewport', () => {
      const container = createMockScrollContainer({
        scrollTop: 0,
        scrollLeft: 0,
        clientWidth: 200,
        clientHeight: 200,
      });

      // Cell at col 3 (left: 250, right: 450)
      const res = ensureCellVisible({
        cell: { rowIndex: 0, columnIndex: 3 },
        scrollContainer: container,
        columns,
        rowHeight,
        frozenColumnCount: 1,
        frozenRowCount: 0,
      });

      expect(res.didScrollLeft).toBe(true);
      expect(res.scrollLeft).toBe(450 - 200); // 250
      expect(container.scrollLeft).toBe(250);
    });

    it('scrolls left when cell is to the left of the viewport', () => {
      const container = createMockScrollContainer({
        scrollTop: 0,
        scrollLeft: 300,
        clientWidth: 200,
        clientHeight: 200,
      });

      // Cell at col 1 (left: 0, right: 100)
      const res = ensureCellVisible({
        cell: { rowIndex: 0, columnIndex: 1 },
        scrollContainer: container,
        columns,
        rowHeight,
        frozenColumnCount: 1,
        frozenRowCount: 0,
      });

      expect(res.didScrollLeft).toBe(true);
      expect(res.scrollLeft).toBe(0);
      expect(container.scrollLeft).toBe(0);
    });

    it('aligns to colLeft when column width exceeds viewport width', () => {
      const container = createMockScrollContainer({
        scrollTop: 0,
        scrollLeft: 0,
        clientWidth: 150,
        clientHeight: 200,
      });

      // Cell at col 3 (width: 200 > clientWidth 150, left: 250)
      const res = ensureCellVisible({
        cell: { rowIndex: 0, columnIndex: 3 },
        scrollContainer: container,
        columns,
        rowHeight,
        frozenColumnCount: 1,
        frozenRowCount: 0,
      });

      expect(res.didScrollLeft).toBe(true);
      expect(res.scrollLeft).toBe(250);
    });

    it('does not scroll horizontally for frozen columns', () => {
      const container = createMockScrollContainer({
        scrollTop: 0,
        scrollLeft: 200,
        clientWidth: 300,
        clientHeight: 200,
      });

      // Cell in frozen column 0 (frozenColumnCount: 1)
      const res = ensureCellVisible({
        cell: { rowIndex: 0, columnIndex: 0 },
        scrollContainer: container,
        columns,
        rowHeight,
        frozenColumnCount: 1,
        frozenRowCount: 0,
      });

      expect(res.didScrollLeft).toBe(false);
      expect(res.scrollLeft).toBe(200);
      expect(container.scrollLeft).toBe(200);
    });

    it('does not scroll vertically for frozen rows', () => {
      const container = createMockScrollContainer({
        scrollTop: 300,
        scrollLeft: 0,
        clientWidth: 300,
        clientHeight: 200,
      });

      // Cell in frozen row 1 (frozenRowCount: 2)
      const res = ensureCellVisible({
        cell: { rowIndex: 1, columnIndex: 1 },
        scrollContainer: container,
        columns,
        rowHeight,
        frozenColumnCount: 1,
        frozenRowCount: 2,
      });

      expect(res.didScrollTop).toBe(false);
      expect(res.scrollTop).toBe(300);
      expect(container.scrollTop).toBe(300);
    });

    it('handles null scrollContainer gracefully', () => {
      const res = ensureCellVisible({
        cell: { rowIndex: 5, columnIndex: 2 },
        scrollContainer: null,
        columns,
        rowHeight,
      });

      expect(res.didScroll).toBe(false);
      expect(res.scrollTop).toBe(0);
      expect(res.scrollLeft).toBe(0);
    });

    it('reserves search overlay insets while revealing a result cell', () => {
      const container = createMockScrollContainer({
        scrollTop: 0,
        scrollLeft: 0,
        clientWidth: 300,
        clientHeight: 120,
      });

      const res = ensureCellVisible({
        cell: { rowIndex: 4, columnIndex: 2 },
        scrollContainer: container,
        columns,
        rowHeight,
        frozenColumnCount: 1,
        viewportInsets: { bottom: 30, right: 80 },
      });

      expect(res.scrollTop).toBe(60);
      expect(res.scrollLeft).toBe(30);
    });

    it('clamps oversized overlay insets without producing invalid scroll positions', () => {
      const container = createMockScrollContainer({
        scrollTop: 100,
        scrollLeft: 100,
        clientWidth: 200,
        clientHeight: 100,
      });

      const res = ensureCellVisible({
        cell: { rowIndex: 2, columnIndex: 2 },
        scrollContainer: container,
        columns,
        rowHeight,
        frozenColumnCount: 1,
        viewportInsets: { top: 500, right: 500, bottom: 500, left: 500 },
      });

      expect(res.scrollTop).toBeGreaterThanOrEqual(0);
      expect(res.scrollLeft).toBeGreaterThanOrEqual(0);
      expect(res.scrollTop).toBeLessThanOrEqual(900);
      expect(res.scrollLeft).toBeLessThanOrEqual(600);
    });
  });
});
