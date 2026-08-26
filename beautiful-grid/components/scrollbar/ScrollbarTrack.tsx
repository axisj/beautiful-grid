import * as React from 'react';
import { BGridAxisMetrics } from './useScrollbarMetrics';

const { useRef, useCallback, useEffect } = React;

interface Props {
  orientation: 'horizontal' | 'vertical';
  variant: 'classic' | 'modern';
  metrics: BGridAxisMetrics;
  scrollOffset: number;
  onScrollChange: (offset: number) => void;
}

export function ScrollbarTrack({
  orientation,
  variant,
  metrics,
  scrollOffset,
  onScrollChange,
}: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ isDragging: boolean; startPos: number; startScroll: number } | null>(null);

  const isHorizontal = orientation === 'horizontal';

  const minThumbSize = 24;
  const rawTrackLength = isHorizontal ? trackRef.current?.clientWidth ?? 0 : trackRef.current?.clientHeight ?? 0;

  const rawThumbLength = metrics.contentSize > 0 ? rawTrackLength * (metrics.viewportSize / metrics.contentSize) : rawTrackLength;
  const thumbLength = Math.min(
    rawTrackLength,
    Math.max(rawThumbLength, minThumbSize),
  );

  const thumbTravel = Math.max(rawTrackLength - thumbLength, 0);
  const thumbOffset =
    metrics.maxScroll > 0
      ? Math.min(thumbTravel, Math.max(0, (scrollOffset / metrics.maxScroll) * thumbTravel))
      : 0;

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.target === trackRef.current) {
      e.preventDefault();
      const rect = trackRef.current.getBoundingClientRect();
      const clickPos = isHorizontal ? e.clientX - rect.left : e.clientY - rect.top;

      const isBeforeThumb = clickPos < thumbOffset;
      const moveAmount = metrics.viewportSize;
      const newScroll = scrollOffset + (isBeforeThumb ? -moveAmount : moveAmount);
      onScrollChange(Math.max(0, Math.min(newScroll, metrics.maxScroll)));
      return;
    }

    e.preventDefault();
    document.body.style.userSelect = 'none';
    dragRef.current = {
      isDragging: true,
      startPos: isHorizontal ? e.clientX : e.clientY,
      startScroll: scrollOffset,
    };
  }, [isHorizontal, thumbOffset, metrics.viewportSize, scrollOffset, metrics.maxScroll, onScrollChange]);

  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!dragRef.current?.isDragging) return;

    e.preventDefault();
    const currentPos = isHorizontal ? e.clientX : e.clientY;
    const deltaPos = currentPos - dragRef.current.startPos;

    if (thumbTravel > 0) {
      const scrollDelta = (deltaPos / thumbTravel) * metrics.maxScroll;
      const newScroll = dragRef.current.startScroll + scrollDelta;
      onScrollChange(Math.max(0, Math.min(newScroll, metrics.maxScroll)));
    }
  }, [isHorizontal, thumbTravel, metrics.maxScroll, onScrollChange]);

  const handlePointerUp = useCallback(() => {
    if (dragRef.current?.isDragging) {
      dragRef.current = null;
      document.body.style.userSelect = '';
    }
  }, []);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      document.body.style.userSelect = '';
    };
  }, [handlePointerMove, handlePointerUp]);

  return (
    <div
      ref={trackRef}
      className={`bgrid-scrollbar-track bgrid-scrollbar-track-${variant}`}
      role="scrollbar"
      aria-orientation={orientation}
      aria-valuemin={0}
      aria-valuemax={metrics.maxScroll}
      aria-valuenow={Math.round(scrollOffset)}
      aria-disabled={!metrics.hasOverflow}
      onPointerDown={metrics.hasOverflow ? handlePointerDown : undefined}
    >
      {metrics.hasOverflow && (
        <div
          className={`bgrid-scrollbar-thumb bgrid-scrollbar-thumb-${variant}`}
          style={{
            width: isHorizontal ? thumbLength : undefined,
            height: isHorizontal ? undefined : thumbLength,
            transform: isHorizontal ? `translateX(${thumbOffset}px)` : `translateY(${thumbOffset}px)`,
          }}
        />
      )}
    </div>
  );
}
