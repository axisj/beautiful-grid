import { describe, expect, it, vi } from 'vitest';
import { mouseEventSubscribe } from '../beautiful-grid/utils/mouseEventSubscribe';

function createPointerEvent(type: string, pointerId: number, clientX: number, clientY = 0) {
  const event = new Event(type) as PointerEvent;

  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    clientX: { value: clientX },
    clientY: { value: clientY },
    pageX: { value: clientX },
    pageY: { value: clientY },
  });

  return event;
}

function createMouseEvent(type: string, clientX: number, clientY = 0) {
  const event = new Event(type) as MouseEvent;

  Object.defineProperties(event, {
    clientX: { value: clientX },
    clientY: { value: clientY },
    pageX: { value: clientX },
    pageY: { value: clientY },
  });

  return event;
}

describe('mouseEventSubscribe', () => {
  it('tracks pointer moves on the owner window when pointer capture is rejected', () => {
    const target = document.createElement('div') as HTMLElement & {
      setPointerCapture: (pointerId: number) => void;
      releasePointerCapture: (pointerId: number) => void;
    };
    target.setPointerCapture = vi.fn(() => {
      throw new Error('pointer capture unavailable');
    });
    target.releasePointerCapture = vi.fn();
    document.body.appendChild(target);

    const onMove = vi.fn();
    const onEnd = vi.fn();

    mouseEventSubscribe(onMove, onEnd, {
      interval: 0,
      target,
      pointerId: 7,
    });

    window.dispatchEvent(createPointerEvent('pointermove', 7, 240));
    window.dispatchEvent(createPointerEvent('pointermove', 8, 360));
    window.dispatchEvent(createPointerEvent('pointerup', 7, 240));
    window.dispatchEvent(createPointerEvent('pointermove', 7, 420));

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith(
      {
        pageX: 240,
        pageY: 0,
        clientX: 240,
        clientY: 0,
      },
      expect.any(Function),
    );
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('falls back to mouse moves while pointer capture is active', () => {
    const target = document.createElement('div') as HTMLElement & {
      setPointerCapture: (pointerId: number) => void;
      releasePointerCapture: (pointerId: number) => void;
    };
    target.setPointerCapture = vi.fn();
    target.releasePointerCapture = vi.fn();
    document.body.appendChild(target);

    const onMove = vi.fn();
    const onEnd = vi.fn();

    mouseEventSubscribe(onMove, onEnd, {
      interval: 0,
      target,
      pointerId: 3,
    });

    window.dispatchEvent(createMouseEvent('mousemove', 312));
    window.dispatchEvent(createMouseEvent('mouseup', 312));
    window.dispatchEvent(createPointerEvent('pointerup', 3, 312));

    expect(target.setPointerCapture).toHaveBeenCalledWith(3);
    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith(
      {
        pageX: 312,
        pageY: 0,
        clientX: 312,
        clientY: 0,
      },
      expect.any(Function),
    );
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('keeps pointer subscriptions alive across owner window mouseleave events', () => {
    const target = document.createElement('div') as HTMLElement & {
      setPointerCapture: (pointerId: number) => void;
      releasePointerCapture: (pointerId: number) => void;
    };
    target.setPointerCapture = vi.fn();
    target.releasePointerCapture = vi.fn();
    document.body.appendChild(target);

    const onMove = vi.fn();
    const onEnd = vi.fn();

    mouseEventSubscribe(onMove, onEnd, {
      interval: 0,
      target,
      pointerId: 11,
    });

    window.dispatchEvent(createMouseEvent('mouseleave', 0));
    window.dispatchEvent(createPointerEvent('pointermove', 11, 420));
    window.dispatchEvent(createPointerEvent('pointerup', 11, 420));

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('uses the final pointerup position when no move event is delivered', () => {
    const target = document.createElement('div') as HTMLElement & {
      setPointerCapture: (pointerId: number) => void;
      releasePointerCapture: (pointerId: number) => void;
    };
    target.setPointerCapture = vi.fn();
    target.releasePointerCapture = vi.fn();
    document.body.appendChild(target);

    const onMove = vi.fn();
    const onEnd = vi.fn();

    mouseEventSubscribe(onMove, onEnd, {
      interval: 0,
      target,
      pointerId: 12,
      initialClientX: 200,
    });

    window.dispatchEvent(createPointerEvent('pointerup', 12, 360));

    expect(onMove).toHaveBeenCalledTimes(1);
    expect(onMove).toHaveBeenCalledWith(
      {
        pageX: 360,
        pageY: 0,
        clientX: 360,
        clientY: 0,
      },
      expect.any(Function),
    );
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('uses the final pointerup position after a throttled move event', () => {
    const target = document.createElement('div') as HTMLElement & {
      setPointerCapture: (pointerId: number) => void;
      releasePointerCapture: (pointerId: number) => void;
    };
    target.setPointerCapture = vi.fn();
    target.releasePointerCapture = vi.fn();
    document.body.appendChild(target);

    const onMove = vi.fn();
    const onEnd = vi.fn();

    mouseEventSubscribe(onMove, onEnd, {
      target,
      pointerId: 14,
      initialClientX: 200,
    });

    window.dispatchEvent(createPointerEvent('pointermove', 14, 240));
    window.dispatchEvent(createPointerEvent('pointerup', 14, 360));

    expect(onMove).toHaveBeenLastCalledWith(
      {
        pageX: 360,
        pageY: 0,
        clientX: 360,
        clientY: 0,
      },
      expect.any(Function),
    );
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('does not report a move for a pointer click without movement', () => {
    const target = document.createElement('div') as HTMLElement & {
      setPointerCapture: (pointerId: number) => void;
      releasePointerCapture: (pointerId: number) => void;
    };
    target.setPointerCapture = vi.fn();
    target.releasePointerCapture = vi.fn();
    document.body.appendChild(target);

    const onMove = vi.fn();
    const onEnd = vi.fn();

    mouseEventSubscribe(onMove, onEnd, {
      interval: 0,
      target,
      pointerId: 13,
      initialClientX: 200,
    });

    window.dispatchEvent(createPointerEvent('pointerup', 13, 200));

    expect(onMove).not.toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });

  it('still ends mouse-only subscriptions on owner window mouseleave events', () => {
    const onMove = vi.fn();
    const onEnd = vi.fn();

    mouseEventSubscribe(onMove, onEnd, {
      interval: 0,
    });

    window.dispatchEvent(createMouseEvent('mouseleave', 0));
    window.dispatchEvent(createMouseEvent('mousemove', 312));

    expect(onMove).not.toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalledTimes(1);
  });
});
