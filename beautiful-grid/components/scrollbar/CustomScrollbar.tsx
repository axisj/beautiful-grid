import * as React from 'react';
import { BGridAxisMetrics } from './useScrollbarMetrics';
import { ScrollbarTrack } from './ScrollbarTrack';
import { ScrollbarButton } from './ScrollbarButton';

interface Props {
  orientation: 'horizontal' | 'vertical';
  variant: 'classic' | 'modern';
  metrics: BGridAxisMetrics;
  scrollOffset: number;
  onScrollChange: (offset: number) => void;
}

export function CustomScrollbar({
  orientation,
  variant,
  metrics,
  scrollOffset,
  onScrollChange,
}: Props) {
  const isHorizontal = orientation === 'horizontal';

  const handleButtonClick = (direction: 'up' | 'down' | 'left' | 'right') => {
    const step = 40;
    let newScroll = scrollOffset;
    if (direction === 'up' || direction === 'left') {
      newScroll -= step;
    } else {
      newScroll += step;
    }
    onScrollChange(Math.max(0, Math.min(newScroll, metrics.maxScroll)));
  };

  return (
    <div
      className={`bgrid-custom-scrollbar bgrid-custom-scrollbar-${orientation} bgrid-custom-scrollbar-${variant}`}
      data-orientation={orientation}
      data-overflow={metrics.hasOverflow ? 'true' : 'false'}
    >
      <ScrollbarButton
        direction={isHorizontal ? 'left' : 'up'}
        variant={variant}
        disabled={!metrics.hasOverflow}
        onClick={handleButtonClick}
      />
      <ScrollbarTrack
        orientation={orientation}
        variant={variant}
        metrics={metrics}
        scrollOffset={scrollOffset}
        onScrollChange={onScrollChange}
      />
      <ScrollbarButton
        direction={isHorizontal ? 'right' : 'down'}
        variant={variant}
        disabled={!metrics.hasOverflow}
        onClick={handleButtonClick}
      />
    </div>
  );
}
