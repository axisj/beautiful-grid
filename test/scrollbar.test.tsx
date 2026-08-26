import {
  resolveStatusOptions,
  resolvePaginationViewOptions,
  resolveScrollbarOptions,
  shouldRenderBottomBar,
} from '../beautiful-grid/utils/scrollbar';

describe('Scrollbar Options Normalization', () => {
  it('should resolve default options', () => {
    const scrollbar = resolveScrollbarOptions(undefined);
    expect(scrollbar.variant).toBe('modern');
    expect(scrollbar.horizontal).not.toHaveProperty('position');
    expect(scrollbar.horizontal.visible).toBe(true);
    expect(scrollbar.vertical.visible).toBe(true);

    const status = resolveStatusOptions(undefined);
    expect(status.visible).toBe(true);
    expect(status.configured).toBe(false);

    const pagination = resolvePaginationViewOptions(undefined);
    expect(pagination.visible).toBe(true);
  });

  it('normalizes classic without a configurable horizontal position', () => {
    const scrollbar = resolveScrollbarOptions({ variant: 'classic' });
    expect(scrollbar.variant).toBe('classic');
    expect(scrollbar.horizontal).not.toHaveProperty('position');
  });

  it('normalizes modern without a configurable horizontal position', () => {
    const scrollbar = resolveScrollbarOptions({ variant: 'modern' });
    expect(scrollbar.variant).toBe('modern');
    expect(scrollbar.horizontal).not.toHaveProperty('position');
  });

  it('keeps native scrollbar browser-managed without a position option', () => {
    const scrollbar = resolveScrollbarOptions({ variant: 'native' });
    expect(scrollbar.variant).toBe('native');
    expect(scrollbar.horizontal).not.toHaveProperty('position');
  });
});

describe('shouldRenderBottomBar', () => {
  const getParams = (
    hasPage: boolean,
    scrollbarVariant: 'native' | 'classic' = 'native',
    statusVisible = true,
    statusConfigured = false,
    paginationVisible = true,
    horizontalVisible = true,
    hasHorizontalOverflow = true,
  ) => ({
    hasPage,
    hasHorizontalOverflow,
    scrollbar: {
      variant: scrollbarVariant,
      horizontal: { visible: horizontalVisible },
      vertical: { visible: true },
    } as any,
    status: { visible: statusVisible, configured: statusConfigured } as any,
    pagination: { visible: paginationVisible } as any,
  });

  it('should render when page is present and pagination is visible', () => {
    expect(shouldRenderBottomBar(getParams(true))).toBe(true);
  });

  it('should render when page is present and status is visible, even if pagination is hidden', () => {
    expect(shouldRenderBottomBar(getParams(true, 'native', true, false, false))).toBe(true);
  });

  it('should not render for page but both status and pagination hidden', () => {
    expect(shouldRenderBottomBar(getParams(true, 'native', false, false, false))).toBe(false);
  });

  it('should render for custom scrollbar fixed to bottom', () => {
    expect(shouldRenderBottomBar(getParams(false, 'classic'))).toBe(true);
  });

  it('should not render for a custom horizontal scrollbar without overflow', () => {
    expect(shouldRenderBottomBar(getParams(false, 'classic', false, false, false, true, false))).toBe(false);
  });

  it('should not render for custom scrollbar if horizontal scrollbar is hidden', () => {
    expect(shouldRenderBottomBar(getParams(false, 'classic', false, false, false, false))).toBe(false);
  });

  it('should render for custom status even without page', () => {
    expect(shouldRenderBottomBar(getParams(false, 'native', true, true))).toBe(true);
  });

  it('should render the default item count status without page', () => {
    expect(shouldRenderBottomBar(getParams(false, 'native', true, false))).toBe(true);
  });
});

import * as React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { CustomScrollbar } from '../beautiful-grid/components/scrollbar/CustomScrollbar';
import { useScrollbarMetrics } from '../beautiful-grid/components/scrollbar/useScrollbarMetrics';

function ScrollbarMetricsProbe({
  horizontalContentSize,
  clientWidth,
  scrollWidth,
}: {
  horizontalContentSize: number;
  clientWidth: number;
  scrollWidth: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const metrics = useScrollbarMetrics(ref, [], horizontalContentSize);

  return (
    <div
      ref={(element) => {
        if (element) {
          Object.defineProperty(element, 'clientWidth', { configurable: true, value: clientWidth });
          Object.defineProperty(element, 'scrollWidth', { configurable: true, value: scrollWidth });
        }
        ref.current = element;
      }}
    >
      <span data-testid="horizontal-content-size">{metrics.horizontal.contentSize}</span>
      <span data-testid="horizontal-max-scroll">{metrics.horizontal.maxScroll}</span>
    </div>
  );
}

describe('useScrollbarMetrics', () => {
  it('includes the vertical scrollbar gutter measured by the browser in horizontal overflow', () => {
    render(<ScrollbarMetricsProbe horizontalContentSize={600} clientWidth={300} scrollWidth={624} />);

    expect(screen.getByTestId('horizontal-content-size')).toHaveTextContent('624');
    expect(screen.getByTestId('horizontal-max-scroll')).toHaveTextContent('324');
  });
});

describe('CustomScrollbar Component', () => {
  it('renders track, thumb, and buttons for classic variant', () => {
    const handleScrollChange = vi.fn();
    const metrics = {
      contentSize: 1000,
      viewportSize: 200,
      maxScroll: 800,
      hasOverflow: true,
    };

    render(
      <CustomScrollbar
        orientation="horizontal"
        variant="classic"
        metrics={metrics}
        scrollOffset={0}
        onScrollChange={handleScrollChange}
      />
    );

    const buttons = document.querySelectorAll('.bgrid-scrollbar-button');
    expect(buttons.length).toBe(2);

    const track = document.querySelector('.bgrid-scrollbar-track-classic');
    expect(track).toBeInTheDocument();

    const thumb = document.querySelector('.bgrid-scrollbar-thumb-classic');
    expect(thumb).toBeInTheDocument();
  });

  it('renders minimal arrow buttons and a rounded track for modern variant', () => {
    const metrics = {
      contentSize: 1000,
      viewportSize: 200,
      maxScroll: 800,
      hasOverflow: true,
    };

    render(
      <CustomScrollbar
        orientation="vertical"
        variant="modern"
        metrics={metrics}
        scrollOffset={120}
        onScrollChange={() => {}}
      />
    );

    expect(document.querySelectorAll('.bgrid-scrollbar-button-modern')).toHaveLength(2);
    expect(document.querySelector('.bgrid-scrollbar-track-modern')).toHaveAttribute('role', 'scrollbar');
    expect(document.querySelector('.bgrid-scrollbar-track-modern')).toHaveAttribute('aria-orientation', 'vertical');
    expect(document.querySelector('.bgrid-scrollbar-thumb-modern')).toBeInTheDocument();
  });

  it('scrolls by 40px when a button is clicked', () => {
    const handleScrollChange = vi.fn();
    const metrics = {
      contentSize: 1000,
      viewportSize: 200,
      maxScroll: 800,
      hasOverflow: true,
    };

    render(
      <CustomScrollbar
        orientation="horizontal"
        variant="classic"
        metrics={metrics}
        scrollOffset={0}
        onScrollChange={handleScrollChange}
      />
    );

    const buttons = document.querySelectorAll('.bgrid-scrollbar-button');

    // Right button
    fireEvent.pointerDown(buttons[1]);
    expect(handleScrollChange).toHaveBeenCalledWith(40);
  });

  it('drags the thumb to update scrollOffset', () => {
    const handleScrollChange = vi.fn();
    const metrics = {
      contentSize: 1000,
      viewportSize: 200,
      maxScroll: 800,
      hasOverflow: true,
    };

    render(
      <CustomScrollbar
        orientation="horizontal"
        variant="classic"
        metrics={metrics}
        scrollOffset={0}
        onScrollChange={handleScrollChange}
      />
    );

    const track = document.querySelector('.bgrid-scrollbar-track')!;

    // Simulate setting track width
    Object.defineProperty(track, 'clientWidth', { value: 200, configurable: true });

    // Click track
    fireEvent.pointerDown(track, { clientX: 100 });
    // Track click moves by viewportSize
    expect(handleScrollChange).toHaveBeenCalledWith(200);
  });
});
