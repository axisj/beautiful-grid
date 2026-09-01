import { describe, expect, it } from 'vitest';
import {
  BGRID_MAX_PHYSICAL_SCROLL_HEIGHT,
  getLogicalScrollTop,
  getVirtualScrollWindowMetrics,
  getVirtualScrollWindowPosition,
  rebaseVirtualScrollWindow,
} from '../beautiful-grid/utils/virtualScrollWindow';

describe('virtualScrollWindow', () => {
  const viewportHeight = 368;
  const logicalContentHeight = 1_000_000 * 29;
  const metrics = getVirtualScrollWindowMetrics({
    logicalContentHeight,
    viewportHeight,
    enabled: true,
  });

  it('caps the physical DOM height without reducing the logical range', () => {
    expect(metrics.enabled).toBe(true);
    expect(metrics.logicalContentHeight).toBe(logicalContentHeight);
    expect(metrics.physicalContentHeight).toBe(BGRID_MAX_PHYSICAL_SCROLL_HEIGHT);
    expect(metrics.logicalMaxScroll).toBe(logicalContentHeight - viewportHeight);
    expect(metrics.physicalMaxScroll).toBe(BGRID_MAX_PHYSICAL_SCROLL_HEIGHT - viewportHeight);
  });

  it.each([0, 29, 7_975_000, logicalContentHeight - viewportHeight])(
    'maps logical offset %s to a bounded physical position and back',
    logicalScrollTop => {
      const position = getVirtualScrollWindowPosition(logicalScrollTop, metrics);

      expect(position.base).toBeGreaterThanOrEqual(0);
      expect(position.physicalScrollTop).toBeGreaterThanOrEqual(0);
      expect(position.physicalScrollTop).toBeLessThanOrEqual(metrics.physicalMaxScroll);
      expect(getLogicalScrollTop(position.base, position.physicalScrollTop, metrics)).toBe(logicalScrollTop);
    },
  );

  it('rebases near a physical edge without changing the logical position', () => {
    const base = 4_000_000;
    const physicalScrollTop = metrics.physicalMaxScroll * 0.9;
    const logicalBefore = getLogicalScrollTop(base, physicalScrollTop, metrics);
    const position = rebaseVirtualScrollWindow(base, physicalScrollTop, metrics);

    expect(position.base).not.toBe(base);
    expect(position.physicalScrollTop).toBeGreaterThan(metrics.physicalMaxScroll * 0.25);
    expect(position.physicalScrollTop).toBeLessThan(metrics.physicalMaxScroll * 0.75);
    expect(position.logicalScrollTop).toBe(logicalBefore);
    expect(getLogicalScrollTop(position.base, position.physicalScrollTop, metrics)).toBe(logicalBefore);
  });

  it('keeps the legacy one-to-one coordinates when windowing is disabled', () => {
    const unboundedMetrics = getVirtualScrollWindowMetrics({
      logicalContentHeight,
      viewportHeight,
      enabled: false,
    });
    const position = getVirtualScrollWindowPosition(12_345, unboundedMetrics);

    expect(unboundedMetrics.enabled).toBe(false);
    expect(unboundedMetrics.physicalContentHeight).toBe(logicalContentHeight);
    expect(position).toEqual({ base: 0, physicalScrollTop: 12_345, logicalScrollTop: 12_345 });
  });

  it('keeps a ten-million-row logical range within the bounded physical window', () => {
    const tenMillionRowMetrics = getVirtualScrollWindowMetrics({
      logicalContentHeight: 10_000_000 * 29,
      viewportHeight,
      enabled: true,
    });
    const lastPosition = getVirtualScrollWindowPosition(
      tenMillionRowMetrics.logicalMaxScroll,
      tenMillionRowMetrics,
    );

    expect(tenMillionRowMetrics.logicalContentHeight).toBe(290_000_000);
    expect(tenMillionRowMetrics.physicalContentHeight).toBe(BGRID_MAX_PHYSICAL_SCROLL_HEIGHT);
    expect(lastPosition.logicalScrollTop).toBe(tenMillionRowMetrics.logicalMaxScroll);
    expect(lastPosition.physicalScrollTop).toBeLessThanOrEqual(tenMillionRowMetrics.physicalMaxScroll);
  });
});
