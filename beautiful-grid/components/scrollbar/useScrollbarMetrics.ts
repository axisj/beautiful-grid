import { useLayoutEffect, useState, RefObject } from 'react';

export interface BGridAxisMetrics {
  viewportSize: number;
  contentSize: number;
  maxScroll: number;
  hasOverflow: boolean;
}

export interface BGridScrollbarMetrics {
  horizontal: BGridAxisMetrics;
  vertical: BGridAxisMetrics;
}

const defaultAxis: BGridAxisMetrics = {
  viewportSize: 0,
  contentSize: 0,
  maxScroll: 0,
  hasOverflow: false,
};

const defaultMetrics: BGridScrollbarMetrics = {
  horizontal: defaultAxis,
  vertical: defaultAxis,
};

export function useScrollbarMetrics(
  scrollContainerRef: RefObject<HTMLElement | null>,
  dependencyKeys: any[],
  horizontalContentSize?: number,
  verticalFixedSize = 0,
): BGridScrollbarMetrics {
  const [metrics, setMetrics] = useState<BGridScrollbarMetrics>(defaultMetrics);

  useLayoutEffect(() => {
    const element = scrollContainerRef.current;
    if (!element) return;

    let rafId: number | undefined;

    const measure = () => {
      const horizontalViewport = element.clientWidth;
      // The scroll plane can reserve extra inline space for an overlaid custom
      // vertical scrollbar. Keep the explicit column width as a stable baseline,
      // but never discard the browser's measured scroll width (which includes
      // that reserved gutter).
      const horizontalContent = Math.max(horizontalContentSize ?? 0, element.scrollWidth, horizontalViewport);
      const verticalViewport = Math.max(element.clientHeight - verticalFixedSize, 0);
      const verticalContent = Math.max(element.scrollHeight - verticalFixedSize, verticalViewport);

      const horizontalMax = Math.max(horizontalContent - horizontalViewport, 0);
      const verticalMax = Math.max(verticalContent - verticalViewport, 0);

      const hasHorizontalOverflow = horizontalMax > 1;
      const hasVerticalOverflow = verticalMax > 1;

      setMetrics((prev) => {
        if (
          prev.horizontal.viewportSize === horizontalViewport &&
          prev.horizontal.contentSize === horizontalContent &&
          prev.vertical.viewportSize === verticalViewport &&
          prev.vertical.contentSize === verticalContent
        ) {
          return prev;
        }

        return {
          horizontal: {
            viewportSize: horizontalViewport,
            contentSize: horizontalContent,
            maxScroll: horizontalMax,
            hasOverflow: hasHorizontalOverflow,
          },
          vertical: {
            viewportSize: verticalViewport,
            contentSize: verticalContent,
            maxScroll: verticalMax,
            hasOverflow: hasVerticalOverflow,
          },
        };
      });
    };

    const scheduleMeasure = () => {
      if (rafId !== undefined) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(measure);
    };

    measure();

    const observer = new ResizeObserver(scheduleMeasure);
    observer.observe(element);
    if (element.firstElementChild) {
      observer.observe(element.firstElementChild);
    }

    return () => {
      observer.disconnect();
      if (rafId !== undefined) cancelAnimationFrame(rafId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scrollContainerRef, horizontalContentSize, verticalFixedSize, ...dependencyKeys]);

  return metrics;
}
