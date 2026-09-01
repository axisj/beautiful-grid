export const BGRID_MAX_PHYSICAL_SCROLL_HEIGHT = 1_000_000;

export interface VirtualScrollWindowMetrics {
  enabled: boolean;
  logicalContentHeight: number;
  physicalContentHeight: number;
  logicalMaxScroll: number;
  physicalMaxScroll: number;
}

interface GetVirtualScrollWindowMetricsParams {
  logicalContentHeight: number;
  viewportHeight: number;
  enabled: boolean;
  maxPhysicalHeight?: number;
}

export interface VirtualScrollWindowPosition {
  base: number;
  physicalScrollTop: number;
  logicalScrollTop: number;
}

export function getVirtualScrollWindowMetrics({
  logicalContentHeight,
  viewportHeight,
  enabled,
  maxPhysicalHeight = BGRID_MAX_PHYSICAL_SCROLL_HEIGHT,
}: GetVirtualScrollWindowMetricsParams): VirtualScrollWindowMetrics {
  const safeViewportHeight = Math.max(viewportHeight, 0);
  const safeLogicalContentHeight = Math.max(logicalContentHeight, safeViewportHeight);
  const safeMaxPhysicalHeight = Math.max(maxPhysicalHeight, safeViewportHeight);
  const windowingEnabled = enabled && safeLogicalContentHeight > safeMaxPhysicalHeight;
  const physicalContentHeight = windowingEnabled ? safeMaxPhysicalHeight : safeLogicalContentHeight;

  return {
    enabled: windowingEnabled,
    logicalContentHeight: safeLogicalContentHeight,
    physicalContentHeight,
    logicalMaxScroll: Math.max(safeLogicalContentHeight - safeViewportHeight, 0),
    physicalMaxScroll: Math.max(physicalContentHeight - safeViewportHeight, 0),
  };
}

export function getLogicalScrollTop(
  base: number,
  physicalScrollTop: number,
  metrics: VirtualScrollWindowMetrics,
): number {
  return clamp(base + physicalScrollTop, 0, metrics.logicalMaxScroll);
}

export function getVirtualScrollWindowPosition(
  logicalScrollTop: number,
  metrics: VirtualScrollWindowMetrics,
): VirtualScrollWindowPosition {
  const logicalTop = clamp(logicalScrollTop, 0, metrics.logicalMaxScroll);
  if (!metrics.enabled) {
    return {
      base: 0,
      physicalScrollTop: logicalTop,
      logicalScrollTop: logicalTop,
    };
  }

  const preferredPhysicalTop = metrics.physicalMaxScroll / 2;
  const maxBase = Math.max(metrics.logicalMaxScroll - metrics.physicalMaxScroll, 0);
  const base = clamp(logicalTop - preferredPhysicalTop, 0, maxBase);

  return {
    base,
    physicalScrollTop: logicalTop - base,
    logicalScrollTop: logicalTop,
  };
}

export function rebaseVirtualScrollWindow(
  base: number,
  physicalScrollTop: number,
  metrics: VirtualScrollWindowMetrics,
): VirtualScrollWindowPosition {
  const logicalScrollTop = getLogicalScrollTop(base, physicalScrollTop, metrics);
  if (!metrics.enabled || metrics.physicalMaxScroll <= 0) {
    return getVirtualScrollWindowPosition(logicalScrollTop, metrics);
  }

  const lowerGuard = metrics.physicalMaxScroll * 0.25;
  const upperGuard = metrics.physicalMaxScroll * 0.75;
  const maxBase = Math.max(metrics.logicalMaxScroll - metrics.physicalMaxScroll, 0);
  const canMoveBackward = base > 0;
  const canMoveForward = base < maxBase;

  if (
    (physicalScrollTop < lowerGuard && canMoveBackward) ||
    (physicalScrollTop > upperGuard && canMoveForward)
  ) {
    return getVirtualScrollWindowPosition(logicalScrollTop, metrics);
  }

  return {
    base,
    physicalScrollTop: clamp(physicalScrollTop, 0, metrics.physicalMaxScroll),
    logicalScrollTop,
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
