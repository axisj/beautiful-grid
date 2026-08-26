import { throttle } from './common';

export interface IMousePosition {
  pageX: number;
  pageY: number;
  clientX: number;
  clientY: number;
}

export type MouseEventSubscribeCallbackFn = (mousePosition: IMousePosition, stopEvent: () => void) => void;

export interface IMouseEventSubscribeOptions {
  interval?: number;
  target?: EventTarget & {
    ownerDocument?: Document;
    setPointerCapture?: (pointerId: number) => void;
    releasePointerCapture?: (pointerId: number) => void;
  };
  pointerId?: number;
  initialClientX?: number;
}

export const mouseEventSubscribe = (
  callBack: MouseEventSubscribeCallbackFn,
  onEnd?: () => void,
  options?: IMouseEventSubscribeOptions,
): void => {
  const { interval = 30, target, pointerId, initialClientX } = options || {};
  const ownerDocument = target?.ownerDocument ?? document;
  const ownerWindow = ownerDocument.defaultView ?? window;
  const ownerBody = ownerDocument.body;
  const canUsePointerCapture = typeof pointerId === 'number' && !!target?.setPointerCapture;
  let ended = false;
  let hasMoveEvent = false;
  let lastEmittedClientX: number | undefined;
  let lastEmittedClientY: number | undefined;
  const emitMove = (e: MouseEvent | PointerEvent): void => {
    lastEmittedClientX = e.clientX;
    lastEmittedClientY = e.clientY;
    callBack(
      {
        pageX: e.pageX,
        pageY: e.pageY,
        clientX: e.clientX,
        clientY: e.clientY,
      },
      () => {
        onMouseupWindow();
      },
    );
  };
  const throttledCallBack =
    interval <= 0
      ? Object.assign((e: MouseEvent | PointerEvent) => emitMove(e), {
          cancel: () => undefined,
          flush: () => undefined,
        })
      : throttle(emitMove, interval);

  const onMousemoveWindow = (e: MouseEvent): void => {
    hasMoveEvent = true;
    throttledCallBack(e);
  };

  const onPointermoveWindow = (e: PointerEvent): void => {
    if (typeof pointerId === 'number' && e.pointerId !== pointerId) return;
    hasMoveEvent = true;
    throttledCallBack(e);
  };

  const onMouseleaveWindow = (e: MouseEvent): void => {
    if (typeof pointerId === 'number') return;
    onMouseupWindow(e);
  };

  const shouldUseEndEventAsMove = (e: MouseEvent | PointerEvent): boolean => {
    if (e.clientX === lastEmittedClientX && e.clientY === lastEmittedClientY) return false;
    if (hasMoveEvent) return true;
    if (typeof initialClientX !== 'number') return false;
    return e.clientX !== initialClientX;
  };

  const onMouseupWindow = (e?: MouseEvent | PointerEvent): void => {
    if (ended) return;
    ended = true;
    ownerWindow.removeEventListener('mousemove', onMousemoveWindow, true);
    ownerWindow.removeEventListener('mouseup', onMouseupWindow, true);
    ownerWindow.removeEventListener('mouseleave', onMouseleaveWindow, true);
    ownerWindow.removeEventListener('pointermove', onPointermoveWindow as EventListener, true);
    ownerWindow.removeEventListener('pointerup', onPointerupWindow as EventListener, true);
    ownerWindow.removeEventListener('pointercancel', onPointerupWindow as EventListener, true);
    if (typeof pointerId === 'number') {
      try {
        target?.releasePointerCapture?.(pointerId);
      } catch {
        // Pointer capture can already be lost in Electron popup windows.
      }
    }
    if (ownerBody) {
      ownerBody.style.userSelect = 'inherit';
      ownerBody.style.webkitUserSelect = 'inherit';
    }
    if (e && shouldUseEndEventAsMove(e)) {
      throttledCallBack.cancel();
      emitMove(e);
    } else {
      throttledCallBack.flush?.();
    }
    throttledCallBack.cancel();
    onEnd?.();
  };

  const onPointerupWindow = (e: PointerEvent): void => {
    if (typeof pointerId === 'number' && e.pointerId !== pointerId) return;
    onMouseupWindow(e);
  };

  if (ownerBody) {
    ownerBody.style.userSelect = 'none';
    ownerBody.style.webkitUserSelect = 'none';
  }

  if (canUsePointerCapture && typeof pointerId === 'number') {
    try {
      target?.setPointerCapture?.(pointerId);
    } catch {
      // Continue with ownerWindow listeners when capture is unavailable or rejected.
    }
    ownerWindow.addEventListener('mousemove', onMousemoveWindow, true);
    ownerWindow.addEventListener('mouseup', onMouseupWindow, true);
    ownerWindow.addEventListener('mouseleave', onMouseleaveWindow, true);
    ownerWindow.addEventListener('pointermove', onPointermoveWindow as EventListener, true);
    ownerWindow.addEventListener('pointerup', onPointerupWindow as EventListener, true);
    ownerWindow.addEventListener('pointercancel', onPointerupWindow as EventListener, true);
    return;
  }

  ownerWindow.addEventListener('mousemove', onMousemoveWindow, true);
  ownerWindow.addEventListener('mouseup', onMouseupWindow, true);
  ownerWindow.addEventListener('mouseleave', onMouseleaveWindow, true);
};
