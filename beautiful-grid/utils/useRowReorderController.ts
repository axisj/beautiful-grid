import * as React from 'react';
import { BGridCellSelectionRange, BGridDataItem } from '../types';
import { useAppStoreApi } from '../store';
import { getCellValueByRowKey } from './getCellValue';
import {
  getMaxTransitionTimeMs,
  getRowReorderTargetIndex,
  moveRowItem,
  remapCheckedIndexesMap,
  remapRowIndex,
} from './rowReorder';

const POINTER_DRAG_THRESHOLD = 3;
const EDGE_SCROLL_ZONE = 36;
const MAX_EDGE_SCROLL_PER_FRAME = 14;
const TRANSITION_FALLBACK_BUFFER = 48;

export interface BGridRowReorderPreviewState {
  text: string;
  visible: boolean;
  phase: 'dragging' | 'settling' | 'cancelling';
}

interface RowReorderSession<T> {
  id: number;
  input: 'pointer' | 'keyboard';
  pointerId?: number;
  pointerTarget?: HTMLButtonElement;
  fromIndex: number;
  toIndex: number;
  rowHeight: number;
  startClientY: number;
  latestClientY: number;
  startScrollTop: number;
  dataReference: BGridDataItem<T>[];
  sourceItem: BGridDataItem<T>;
  rowKeys?: unknown[];
  rowKeyDefinition?: React.Key | React.Key[];
  selectionRanges: BGridCellSelectionRange[];
  dragging: boolean;
  previewText: string;
  previewVisible: boolean;
  forcePreview: boolean;
  motionCleanup?: () => void;
  removePointerListeners?: () => void;
}

interface UseRowReorderControllerParams {
  containerRef: React.RefObject<HTMLDivElement | null>;
  bodyContainerRef: React.RefObject<HTMLDivElement | null>;
  scrollContainerRef: React.RefObject<HTMLDivElement | null>;
  rowHeight: number;
}

export function useRowReorderController<T>({
  containerRef,
  bodyContainerRef,
  scrollContainerRef,
  rowHeight,
}: UseRowReorderControllerParams) {
  const store = useAppStoreApi<T>();
  const sessionRef = React.useRef<RowReorderSession<T> | null>(null);
  const generationRef = React.useRef(0);
  const pointerFrameRef = React.useRef<number | null>(null);
  const [preview, setPreview] = React.useState<BGridRowReorderPreviewState>();
  const [announcement, setAnnouncement] = React.useState('');

  const clearRuntimeStyles = React.useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    container.style.removeProperty('--bgrid-row-drag-offset-y');
    container.style.removeProperty('--bgrid-row-reorder-preview-y');
    container.style.removeProperty('--bgrid-row-reorder-height');
    container.removeAttribute('data-bgrid-row-reordering');
    container.removeAttribute('data-bgrid-row-reorder-phase');
    container.removeAttribute('data-bgrid-row-reorder-fallback');
  }, [containerRef]);

  const removePointerListeners = React.useCallback(() => {
    const session = sessionRef.current;
    session?.removePointerListeners?.();
    if (session) session.removePointerListeners = undefined;
  }, []);

  const releasePointerCapture = React.useCallback((session: RowReorderSession<T>) => {
    if (
      session.pointerId !== undefined &&
      session.pointerTarget?.hasPointerCapture?.(session.pointerId)
    ) {
      session.pointerTarget.releasePointerCapture(session.pointerId);
    }
  }, []);

  const finishSession = React.useCallback(
    (session: RowReorderSession<T>, options?: { restoreSelection?: boolean; focusIndex?: number }) => {
      if (sessionRef.current?.id !== session.id) return;

      session.motionCleanup?.();
      removePointerListeners();
      releasePointerCapture(session);
      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = null;
      }

      const state = store.getState();
      sessionRef.current = null;
      store.setState({
        reorderingInfo: undefined,
        ...(options?.restoreSelection
          ? {
              cellSelectionRange: session.selectionRanges[session.selectionRanges.length - 1],
              cellSelectionRanges: session.selectionRanges,
              cellSelecting: false,
            }
          : {}),
      });
      clearRuntimeStyles();
      setPreview(undefined);

      if (options?.focusIndex !== undefined) {
        const focusIndex = options.focusIndex;
        requestAnimationFrame(() => {
          containerRef.current
            ?.querySelector<HTMLButtonElement>(`.bgrid-row-reorder-handle[data-row-reorder-index='${focusIndex}']`)
            ?.focus({ preventScroll: true });
        });
      } else if (state.reorderingInfo?.input === 'keyboard') {
        requestAnimationFrame(() => session.pointerTarget?.focus({ preventScroll: true }));
      }
    },
    [clearRuntimeStyles, containerRef, releasePointerCapture, removePointerListeners, store],
  );

  const isSessionCurrent = React.useCallback(
    (session: RowReorderSession<T>) => {
      const state = store.getState();
      if (!state.reorder?.enabled || state.frozenRowCount > 0 || state.data.length !== session.dataReference.length) {
        return false;
      }
      const hasActiveClientQuery =
        state.dataControl?.mode === 'client' &&
        ((state.dataQuery?.sortParams.length ?? 0) > 0 || (state.dataQuery?.filterParams.length ?? 0) > 0);
      if (hasActiveClientQuery || state.itemHeight + state.itemPadding * 2 !== session.rowHeight) return false;

      if (session.rowKeyDefinition !== undefined && session.rowKeys) {
        return state.data.every((item, index) =>
          Object.is(getCellValueByRowKey(session.rowKeyDefinition!, item.values), session.rowKeys?.[index]),
        );
      }
      return state.data === session.dataReference && state.data[session.fromIndex] === session.sourceItem;
    },
    [store],
  );

  const getMotionElement = React.useCallback(
    (session: RowReorderSession<T>) => {
      if (session.previewVisible) {
        return bodyContainerRef.current?.querySelector<HTMLElement>('.bgrid-row-reorder-preview') ?? undefined;
      }
      return (
        containerRef.current?.querySelector<HTMLElement>(
          `tr[data-ri='${session.fromIndex}'][data-bgrid-row-reorder-role='source'] > td`,
        ) ?? undefined
      );
    },
    [bodyContainerRef, containerRef],
  );

  const waitForMotion = React.useCallback(
    (session: RowReorderSession<T>, done: () => void) => {
      let firstFrame = 0;
      let secondFrame = 0;
      let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
      let motionElement: HTMLElement | undefined;
      let completed = false;

      const complete = () => {
        if (completed) return;
        completed = true;
        if (fallbackTimer !== undefined) clearTimeout(fallbackTimer);
        motionElement?.removeEventListener('transitionend', onTransitionEnd);
        done();
      };
      const onTransitionEnd = (event: TransitionEvent) => {
        if (event.target !== motionElement || (event.propertyName !== 'transform' && event.propertyName !== 'translate')) {
          return;
        }
        complete();
      };

      firstFrame = requestAnimationFrame(() => {
        secondFrame = requestAnimationFrame(() => {
          if (sessionRef.current?.id !== session.id) return;
          motionElement = getMotionElement(session);
          const duration = motionElement ? getMaxTransitionTimeMs(getComputedStyle(motionElement)) : 0;
          if (!motionElement || duration <= 0) {
            complete();
            return;
          }
          motionElement.addEventListener('transitionend', onTransitionEnd);
          fallbackTimer = setTimeout(complete, duration + TRANSITION_FALLBACK_BUFFER);
        });
      });

      session.motionCleanup = () => {
        cancelAnimationFrame(firstFrame);
        cancelAnimationFrame(secondFrame);
        if (fallbackTimer !== undefined) clearTimeout(fallbackTimer);
        motionElement?.removeEventListener('transitionend', onTransitionEnd);
      };
    },
    [getMotionElement],
  );

  const commitSession = React.useCallback(
    (session: RowReorderSession<T>) => {
      if (sessionRef.current?.id !== session.id) return;
      if (!isSessionCurrent(session)) {
        finishSession(session);
        return;
      }

      const state = store.getState();
      const previousData = state.data;
      const previousSourceData = state.sourceData;
      const previousCheckedIndexesMap = state.checkedIndexesMap;
      const previousActiveCell = state.activeCell;
      const nextData = moveRowItem(state.data, session.fromIndex, session.toIndex);
      const nextCheckedIndexesMap = remapCheckedIndexesMap(
        state.checkedIndexesMap,
        session.fromIndex,
        session.toIndex,
      );
      const nextActiveCell = state.activeCell
        ? {
            ...state.activeCell,
            rowIndex: remapRowIndex(state.activeCell.rowIndex, session.fromIndex, session.toIndex),
          }
        : undefined;
      const activeCellControlled = state.cellNavigationOptions?.activeCell !== undefined;

      sessionRef.current = null;
      session.motionCleanup?.();
      removePointerListeners();
      releasePointerCapture(session);
      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = null;
      }
      clearRuntimeStyles();
      setPreview(undefined);

      store.setState({
        data: nextData,
        sourceData: nextData,
        checkedIndexesMap: nextCheckedIndexesMap,
        reorderingInfo: undefined,
        cellSelectionRange: undefined,
        cellSelectionRanges: [],
        cellSelecting: false,
        searchMatches: [],
        activeSearchMatchIndex: undefined,
        searchStatus: state.searchOpen && state.searchQuery ? 'searching' : 'idle',
        ...(!activeCellControlled ? { activeCell: nextActiveCell } : {}),
      });

      let callbackResult: void | boolean = undefined;
      let callbackError: unknown;
      try {
        callbackResult = state.reorder?.onReorder?.(nextData);
      } catch (error) {
        callbackError = error;
      }

      if (callbackResult === false || callbackError !== undefined) {
        store.setState({
          data: previousData,
          sourceData: previousSourceData,
          checkedIndexesMap: previousCheckedIndexesMap,
          activeCell: previousActiveCell,
          cellSelectionRange: session.selectionRanges[session.selectionRanges.length - 1],
          cellSelectionRanges: session.selectionRanges,
          searchMatches: [],
          activeSearchMatchIndex: undefined,
          searchStatus: state.searchOpen && state.searchQuery ? 'searching' : 'idle',
        });
        setAnnouncement('Row move cancelled.');
      } else {
        state.cellNavigationOptions?.onActiveCellChange?.(nextActiveCell);
        setAnnouncement(`Row moved to position ${session.toIndex + 1}.`);
      }

      if (session.input === 'keyboard') {
        requestAnimationFrame(() => {
          containerRef.current
            ?.querySelector<HTMLButtonElement>(
              `.bgrid-row-reorder-handle[data-row-reorder-index='${
                callbackResult === false || callbackError !== undefined ? session.fromIndex : session.toIndex
              }']`,
            )
            ?.focus({ preventScroll: true });
        });
      }

      if (callbackError !== undefined) {
        setTimeout(() => {
          throw callbackError;
        }, 0);
      }
    },
    [clearRuntimeStyles, containerRef, finishSession, isSessionCurrent, releasePointerCapture, removePointerListeners, store],
  );

  const setPreviewPosition = React.useCallback(
    (session: RowReorderSession<T>, clientY: number) => {
      const body = bodyContainerRef.current;
      const container = containerRef.current;
      if (!body || !container) return;
      const bodyRect = body.getBoundingClientRect();
      const y = Math.min(Math.max(clientY - bodyRect.top - session.rowHeight / 2, 0), Math.max(bodyRect.height - session.rowHeight, 0));
      container.style.setProperty('--bgrid-row-reorder-preview-y', `${y}px`);
    },
    [bodyContainerRef, containerRef],
  );

  const settleSession = React.useCallback(
    (session: RowReorderSession<T>, commit: boolean) => {
      if (sessionRef.current?.id !== session.id) return;
      removePointerListeners();
      releasePointerCapture(session);
      if (pointerFrameRef.current !== null) {
        cancelAnimationFrame(pointerFrameRef.current);
        pointerFrameRef.current = null;
      }

      const nextIndex = commit ? session.toIndex : session.fromIndex;
      const nextPhase = commit ? 'settling' : 'cancelling';
      store.setState({
        reorderingInfo: {
          fromIndex: session.fromIndex,
          toIndex: nextIndex,
          phase: nextPhase,
          input: session.input,
        },
      });
      containerRef.current?.setAttribute('data-bgrid-row-reorder-phase', nextPhase);
      setPreview(current => (current ? { ...current, phase: nextPhase } : current));

      requestAnimationFrame(() => {
        if (sessionRef.current?.id !== session.id) return;
        const container = containerRef.current;
        if (container) {
          container.style.setProperty(
            '--bgrid-row-drag-offset-y',
            `${commit ? (session.toIndex - session.fromIndex) * session.rowHeight : 0}px`,
          );
        }
        if (session.previewVisible) {
          const targetRow = containerRef.current?.querySelector<HTMLElement>(
            `tr[data-ri='${nextIndex}'][data-bgrid-quadrant='body-main'], [data-bgrid-quadrant='body-main'] tr[data-ri='${nextIndex}']`,
          );
          const bodyRect = bodyContainerRef.current?.getBoundingClientRect();
          if (targetRow && bodyRect && container) {
            container.style.setProperty(
              '--bgrid-row-reorder-preview-y',
              `${targetRow.getBoundingClientRect().top - bodyRect.top}px`,
            );
          }
        }
        waitForMotion(session, () => {
          if (commit) commitSession(session);
          else finishSession(session, { restoreSelection: true });
        });
      });
    },
    [
      bodyContainerRef,
      commitSession,
      containerRef,
      finishSession,
      releasePointerCapture,
      removePointerListeners,
      store,
      waitForMotion,
    ],
  );

  const cancelSession = React.useCallback(
    (options?: { immediate?: boolean; restoreSelection?: boolean }) => {
      const session = sessionRef.current;
      if (!session) return;
      if (options?.immediate || !session.dragging) {
        finishSession(session, { restoreSelection: options?.restoreSelection ?? session.dragging });
        return;
      }
      settleSession(session, false);
    },
    [finishSession, settleSession],
  );

  const flushPointerFrame = React.useCallback(() => {
    const session = sessionRef.current;
    const scrollContainer = scrollContainerRef.current;
    const container = containerRef.current;
    if (!session || session.input !== 'pointer' || !scrollContainer || !container) return;
    if (!isSessionCurrent(session)) {
      cancelSession({ immediate: true });
      return;
    }

    const scrollRect = scrollContainer.getBoundingClientRect();
    const pointerY = session.latestClientY;
    let scrollDelta = 0;
    if (pointerY < scrollRect.top + EDGE_SCROLL_ZONE) {
      const ratio = Math.min(Math.max((scrollRect.top + EDGE_SCROLL_ZONE - pointerY) / EDGE_SCROLL_ZONE, 0), 1);
      scrollDelta = -Math.max(1, Math.round(MAX_EDGE_SCROLL_PER_FRAME * ratio));
    } else if (pointerY > scrollRect.bottom - EDGE_SCROLL_ZONE) {
      const ratio = Math.min(Math.max((pointerY - (scrollRect.bottom - EDGE_SCROLL_ZONE)) / EDGE_SCROLL_ZONE, 0), 1);
      scrollDelta = Math.max(1, Math.round(MAX_EDGE_SCROLL_PER_FRAME * ratio));
    }

    if (session.dragging && scrollDelta !== 0) {
      const maxScrollTop = Math.max(scrollContainer.scrollHeight - scrollContainer.clientHeight, 0);
      const nextScrollTop = Math.min(Math.max(scrollContainer.scrollTop + scrollDelta, 0), maxScrollTop);
      if (nextScrollTop !== scrollContainer.scrollTop) scrollContainer.scrollTop = nextScrollTop;
      else scrollDelta = 0;
    }

    const rawOffset =
      session.latestClientY - session.startClientY + (scrollContainer.scrollTop - session.startScrollTop);
    const minimumOffset = -session.fromIndex * session.rowHeight;
    const maximumOffset = (store.getState().data.length - 1 - session.fromIndex) * session.rowHeight;
    const pointerOffset = Math.min(Math.max(rawOffset, minimumOffset), maximumOffset);

    if (!session.dragging && Math.abs(pointerOffset) < POINTER_DRAG_THRESHOLD) return;
    if (!session.dragging) {
      session.dragging = true;
      container.setAttribute('data-bgrid-row-reordering', 'true');
      container.setAttribute('data-bgrid-row-reorder-phase', 'dragging');
      if (session.forcePreview) container.setAttribute('data-bgrid-row-reorder-fallback', 'true');
      container.style.setProperty('--bgrid-row-reorder-height', `${session.rowHeight}px`);
      store.getState().clearCellSelection();
      store.getState().closeTransientSurfaces();
      container.querySelectorAll('.bgrid-row-hover').forEach(element => element.classList.remove('bgrid-row-hover'));
      store.setState({
        reorderingInfo: {
          fromIndex: session.fromIndex,
          toIndex: session.toIndex,
          phase: 'dragging',
          input: 'pointer',
        },
      });
      setAnnouncement(`Moving row ${session.fromIndex + 1}.`);
    }

    container.style.setProperty('--bgrid-row-drag-offset-y', `${pointerOffset}px`);
    const toIndex = getRowReorderTargetIndex({
      fromIndex: session.fromIndex,
      pointerOffsetY: pointerOffset,
      rowHeight: session.rowHeight,
      rowCount: store.getState().data.length,
    });
    if (toIndex !== session.toIndex) {
      session.toIndex = toIndex;
      store.setState({
        reorderingInfo: {
          fromIndex: session.fromIndex,
          toIndex,
          phase: 'dragging',
          input: 'pointer',
        },
      });
      setAnnouncement(`Row position ${toIndex + 1} of ${store.getState().data.length}.`);
    }

    const sourceVisible = !!container.querySelector(
      `[data-bgrid-quadrant='body-main'] tr[data-ri='${session.fromIndex}']`,
    );
    const previewVisible = session.forcePreview || !sourceVisible;
    if (previewVisible !== session.previewVisible) {
      session.previewVisible = previewVisible;
      setPreview({
        text: session.previewText,
        visible: previewVisible,
        phase: 'dragging',
      });
    }
    if (previewVisible) setPreviewPosition(session, session.latestClientY);

    if (scrollDelta !== 0 && sessionRef.current?.id === session.id) {
      pointerFrameRef.current = requestAnimationFrame(() => {
        pointerFrameRef.current = null;
        flushPointerFrame();
      });
    }
  }, [cancelSession, containerRef, isSessionCurrent, scrollContainerRef, setPreviewPosition, store]);

  const schedulePointerFrame = React.useCallback(() => {
    if (pointerFrameRef.current !== null) return;
    pointerFrameRef.current = requestAnimationFrame(() => {
      pointerFrameRef.current = null;
      flushPointerFrame();
    });
  }, [flushPointerFrame]);

  const createSession = React.useCallback(
    (rowIndex: number, input: 'pointer' | 'keyboard', pointer?: { id: number; clientY: number; target: HTMLButtonElement }) => {
      const state = store.getState();
      const sourceItem = state.data[rowIndex];
      const hasActiveClientQuery =
        state.dataControl?.mode === 'client' &&
        ((state.dataQuery?.sortParams.length ?? 0) > 0 || (state.dataQuery?.filterParams.length ?? 0) > 0);
      if (
        sessionRef.current ||
        !state.reorder?.enabled ||
        state.frozenRowCount > 0 ||
        hasActiveClientQuery ||
        state.cellInteractionSession ||
        !sourceItem
      ) {
        return undefined;
      }

      const mainRow = containerRef.current?.querySelector<HTMLElement>(
        `[data-bgrid-quadrant='body-main'] tr[data-ri='${rowIndex}']`,
      );
      const rowKeyDefinition = state.rowKey;
      const session: RowReorderSession<T> = {
        id: ++generationRef.current,
        input,
        pointerId: pointer?.id,
        pointerTarget: pointer?.target,
        fromIndex: rowIndex,
        toIndex: rowIndex,
        rowHeight,
        startClientY: pointer?.clientY ?? 0,
        latestClientY: pointer?.clientY ?? 0,
        startScrollTop: scrollContainerRef.current?.scrollTop ?? 0,
        dataReference: state.data,
        sourceItem,
        rowKeys: rowKeyDefinition !== undefined
          ? state.data.map(item => getCellValueByRowKey(rowKeyDefinition, item.values))
          : undefined,
        rowKeyDefinition,
        selectionRanges: state.cellSelectionRanges,
        dragging: input === 'keyboard',
        previewText: mainRow?.textContent?.replace(/\s+/g, ' ').trim() || `Row ${rowIndex + 1}`,
        previewVisible: false,
        forcePreview: Object.keys(state.cellMergeOptions?.columnsMap ?? {}).length > 0,
      };
      sessionRef.current = session;
      return session;
    },
    [containerRef, rowHeight, scrollContainerRef, store],
  );

  const onPointerDown = React.useCallback(
    (event: React.PointerEvent<HTMLButtonElement>, rowIndex: number) => {
      if (event.button !== 0) return;
      const session = createSession(rowIndex, 'pointer', {
        id: event.pointerId,
        clientY: event.clientY,
        target: event.currentTarget,
      });
      if (!session) return;

      event.preventDefault();
      event.stopPropagation();
      event.currentTarget.setPointerCapture?.(event.pointerId);

      const onPointerMove = (pointerEvent: PointerEvent) => {
        if (sessionRef.current?.id !== session.id || pointerEvent.pointerId !== session.pointerId) return;
        session.latestClientY = pointerEvent.clientY;
        if (session.dragging) pointerEvent.preventDefault();
        schedulePointerFrame();
      };
      const onPointerUp = (pointerEvent: PointerEvent) => {
        if (sessionRef.current?.id !== session.id || pointerEvent.pointerId !== session.pointerId) return;
        session.latestClientY = pointerEvent.clientY;
        if (pointerFrameRef.current !== null) {
          cancelAnimationFrame(pointerFrameRef.current);
          pointerFrameRef.current = null;
        }
        flushPointerFrame();
        if (!session.dragging) finishSession(session);
        else settleSession(session, session.fromIndex !== session.toIndex);
      };
      const onPointerCancel = (pointerEvent: PointerEvent) => {
        if (sessionRef.current?.id !== session.id || pointerEvent.pointerId !== session.pointerId) return;
        cancelSession({ restoreSelection: true });
      };
      const onLostPointerCapture = (pointerEvent: PointerEvent) => {
        if (sessionRef.current?.id !== session.id || pointerEvent.pointerId !== session.pointerId) return;
        cancelSession({ immediate: true, restoreSelection: true });
      };
      const onKeyDown = (keyEvent: KeyboardEvent) => {
        if (keyEvent.key !== 'Escape' || sessionRef.current?.id !== session.id) return;
        keyEvent.preventDefault();
        cancelSession({ restoreSelection: true });
      };
      const onWindowBlur = () => cancelSession({ immediate: true });
      const onVisibilityChange = () => {
        if (document.visibilityState === 'hidden') cancelSession({ immediate: true });
      };

      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerCancel);
      session.pointerTarget?.addEventListener('lostpointercapture', onLostPointerCapture);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('blur', onWindowBlur);
      document.addEventListener('visibilitychange', onVisibilityChange);
      session.removePointerListeners = () => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);
        window.removeEventListener('pointercancel', onPointerCancel);
        session.pointerTarget?.removeEventListener('lostpointercapture', onLostPointerCapture);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('blur', onWindowBlur);
        document.removeEventListener('visibilitychange', onVisibilityChange);
      };
    },
    [cancelSession, createSession, finishSession, flushPointerFrame, schedulePointerFrame, settleSession],
  );

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLButtonElement>, rowIndex: number) => {
      let session = sessionRef.current;
      if (!session) {
        if (event.key !== ' ' && event.key !== 'Enter') return;
        const createdSession = createSession(rowIndex, 'keyboard');
        if (!createdSession) return;
        session = createdSession;
        session.pointerTarget = event.currentTarget;
        event.preventDefault();
        event.stopPropagation();
        store.getState().clearCellSelection();
        store.getState().closeTransientSurfaces();
        const container = containerRef.current;
        container?.setAttribute('data-bgrid-row-reordering', 'true');
        container?.setAttribute('data-bgrid-row-reorder-phase', 'dragging');
        if (session.forcePreview) container?.setAttribute('data-bgrid-row-reorder-fallback', 'true');
        container?.style.setProperty('--bgrid-row-reorder-height', `${session.rowHeight}px`);
        if (session.forcePreview) {
          session.previewVisible = true;
          const sourceRow = container?.querySelector<HTMLElement>(
            `[data-bgrid-quadrant='body-main'] tr[data-ri='${session.fromIndex}']`,
          );
          const bodyRect = bodyContainerRef.current?.getBoundingClientRect();
          if (sourceRow && bodyRect) {
            container?.style.setProperty(
              '--bgrid-row-reorder-preview-y',
              `${sourceRow.getBoundingClientRect().top - bodyRect.top}px`,
            );
          }
          setPreview({ text: session.previewText, visible: true, phase: 'dragging' });
        }
        store.setState({
          reorderingInfo: {
            fromIndex: rowIndex,
            toIndex: rowIndex,
            phase: 'dragging',
            input: 'keyboard',
          },
        });
        setAnnouncement(`Moving row ${rowIndex + 1}. Use arrow keys, then Enter to drop or Escape to cancel.`);
        return;
      }
      if (session.input !== 'keyboard' || session.fromIndex !== rowIndex) return;

      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        event.preventDefault();
        event.stopPropagation();
        const direction = event.key === 'ArrowUp' ? -1 : 1;
        const nextIndex = Math.min(Math.max(session.toIndex + direction, 0), store.getState().data.length - 1);
        if (nextIndex === session.toIndex) return;
        session.toIndex = nextIndex;
        containerRef.current?.style.setProperty(
          '--bgrid-row-drag-offset-y',
          `${(nextIndex - session.fromIndex) * session.rowHeight}px`,
        );
        if (session.previewVisible) {
          const targetRow = containerRef.current?.querySelector<HTMLElement>(
            `[data-bgrid-quadrant='body-main'] tr[data-ri='${nextIndex}']`,
          );
          const bodyRect = bodyContainerRef.current?.getBoundingClientRect();
          if (targetRow && bodyRect) {
            containerRef.current?.style.setProperty(
              '--bgrid-row-reorder-preview-y',
              `${targetRow.getBoundingClientRect().top - bodyRect.top}px`,
            );
          }
        }
        store.setState({
          reorderingInfo: {
            fromIndex: session.fromIndex,
            toIndex: nextIndex,
            phase: 'dragging',
            input: 'keyboard',
          },
        });
        setAnnouncement(`Row position ${nextIndex + 1} of ${store.getState().data.length}.`);
        return;
      }

      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        cancelSession({ restoreSelection: true });
        return;
      }
      if (event.key === ' ' || event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        settleSession(session, session.fromIndex !== session.toIndex);
      }
    },
    [bodyContainerRef, cancelSession, containerRef, createSession, settleSession, store],
  );

  React.useEffect(() => {
    return store.subscribe(() => {
      const session = sessionRef.current;
      if (!session || isSessionCurrent(session)) return;
      cancelSession({ immediate: true });
    });
  }, [cancelSession, isSessionCurrent, store]);

  React.useEffect(() => () => cancelSession({ immediate: true }), [cancelSession]);

  return {
    announcement,
    onKeyDown,
    onPointerDown,
    preview,
  };
}
