import * as React from 'react';
import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { AppModelColumn, BGridToolboxConfig } from '../../types';
import { useAppStore } from '../../store';
import { ToolboxSortSection } from './ToolboxSortSection';
import { ToolboxValueFilterSection } from './ToolboxValueFilterSection';
import { ToolboxTextFilterSection } from './ToolboxTextFilterSection';
import { ToolboxNumberFilterSection } from './ToolboxNumberFilterSection';
import { ToolboxCustomSection } from './ToolboxCustomSection';
import { EditorPortalContext } from '../EditorPortalRoot';

interface Props<T> {
  anchorEl: HTMLElement | null;
  column: AppModelColumn<T>;
  columnId: string;
  columnIndex: number;
  dialogId: string;
  triggerId: string;
  onClose: () => void;
}

function readToolboxTheme(anchorEl: HTMLElement | null): React.CSSProperties {
  if (!anchorEl || typeof window === 'undefined') return {};
  const names = [
    '--bgrid-primary-color',
    '--bgrid-header-bg',
    '--bgrid-header-color',
    '--bgrid-header-hover-bg',
    '--bgrid-body-bg',
    '--bgrid-body-color',
    '--bgrid-body-hover-bg',
    '--bgrid-body-active-bg',
    '--bgrid-border-color-base',
    '--bgrid-border-color-subtle',
    '--bgrid-toolbox-bg',
    '--bgrid-toolbox-color',
    '--bgrid-toolbox-muted-color',
    '--bgrid-toolbox-control-bg',
    '--bgrid-toolbox-control-color',
    '--bgrid-toolbox-control-border-color',
    '--bgrid-toolbox-control-placeholder-color',
    '--bgrid-toolbox-hover-bg',
    '--bgrid-toolbox-active-bg',
    '--bgrid-toolbox-danger-color',
    '--bgrid-toolbox-danger-bg',
    '--bgrid-toolbox-button-bg',
    '--bgrid-toolbox-primary-hover-color',
    '--bgrid-toolbox-primary-contrast-color',
    '--bgrid-toolbox-notice-bg',
    '--bgrid-toolbox-scroll-thumb-bg',
    '--bgrid-toolbox-scroll-track-bg',
    '--bgrid-toolbox-focus-ring-color',
  ];

  const gridRoot = anchorEl.closest<HTMLElement>("[role='grid']");
  const target = gridRoot ?? anchorEl;
  const computed = window.getComputedStyle(target);

  const theme: Record<string, string> = {};
  for (const name of names) {
    let val = computed?.getPropertyValue?.(name)?.trim();
    if (!val) {
      let curr: HTMLElement | null = target;
      while (curr) {
        const inlineVal = curr.style?.getPropertyValue?.(name)?.trim();
        if (inlineVal) {
          val = inlineVal;
          break;
        }
        curr = curr.parentElement;
      }
    }
    if (val) {
      theme[name] = val;
    }
  }

  return theme as React.CSSProperties;
}

export function TableHeadToolbox<T>({
  anchorEl,
  column,
  columnId,
  columnIndex,
  dialogId,
  triggerId,
  onClose,
}: Props<T>) {
  const popoverRef = useRef<HTMLDivElement>(null);
  const floatingPortal = React.useContext(EditorPortalContext);
  const [position, setPosition] = useState<{ top: number; left: number }>({ top: -9999, left: -9999 });
  const toolboxThemeStyle = React.useMemo(() => readToolboxTheme(anchorEl), [anchorEl]);

  const toolboxConfig: BGridToolboxConfig<T> | undefined =
    typeof column.toolbox === 'object' ? column.toolbox : undefined;

  const showSort =
    column.sortDisable !== true &&
    (column.toolbox === true || toolboxConfig?.sort === true);

  const filterType =
    typeof column.filter === 'object' && column.filter?.type ? column.filter.type : 'values';

  const showFilter =
    column.filter !== false &&
    (column.toolbox === true || toolboxConfig?.filter === true);

  // Position calculation with boundary adjustments
  const updatePosition = React.useCallback(() => {
    if (!anchorEl || !anchorEl.isConnected || !popoverRef.current) {
      onClose();
      return;
    }

    const anchorRect = anchorEl.getBoundingClientRect();
    const popoverRect = popoverRef.current.getBoundingClientRect();

    const padding = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default: bottom-aligned with right edge aligned to anchor's right edge
    let left = anchorRect.right - popoverRect.width;
    let top = anchorRect.bottom + 4;

    // Flip to top if overflowing bottom
    if (top + popoverRect.height > viewportHeight - padding) {
      const topSpace = anchorRect.top - 4 - popoverRect.height;
      if (topSpace >= padding) {
        top = topSpace;
      } else {
        top = Math.max(padding, viewportHeight - padding - popoverRect.height);
      }
    }

    // Shift if overflowing left or right
    if (left < padding) {
      left = padding;
    } else if (left + popoverRect.width > viewportWidth - padding) {
      left = viewportWidth - padding - popoverRect.width;
    }

    setPosition({ top, left });
  }, [anchorEl, onClose]);

  useLayoutEffect(() => {
    updatePosition();
  }, [updatePosition]);

  useEffect(() => {
    if (typeof ResizeObserver === 'undefined') return;

    const observer = new ResizeObserver(updatePosition);
    if (popoverRef.current) observer.observe(popoverRef.current);
    if (anchorEl) observer.observe(anchorEl);

    return () => observer.disconnect();
  }, [anchorEl, updatePosition]);

  // Event listeners for outside click, escape, tab wrap, arrow key navigation, resize, scroll
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onClose();
        return;
      }

      const popoverEl = popoverRef.current;
      if (!popoverEl) return;

      const focusableEls = Array.from(
        popoverEl.querySelectorAll<HTMLElement>(
          'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]:not(:disabled)',
        ),
      ).filter(el => el.offsetParent !== null);

      if (focusableEls.length === 0) return;

      if (e.key === 'Tab') {
        const firstEl = focusableEls[0];
        const lastEl = focusableEls[focusableEls.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstEl || !popoverEl.contains(document.activeElement)) {
            e.preventDefault();
            lastEl.focus();
          }
        } else {
          if (document.activeElement === lastEl || !popoverEl.contains(document.activeElement)) {
            e.preventDefault();
            firstEl.focus();
          }
        }
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        const currentIndex = focusableEls.indexOf(document.activeElement as HTMLElement);
        if (currentIndex !== -1) {
          // If active inside a text input or select, let native arrow keys work
          const hasNativeArrowBehavior =
            document.activeElement instanceof HTMLSelectElement ||
            (document.activeElement instanceof HTMLInputElement &&
              (document.activeElement.type === 'text' || document.activeElement.type === 'number'));
          if (!hasNativeArrowBehavior) {
            e.preventDefault();
            const nextIndex =
              e.key === 'ArrowDown'
                ? (currentIndex + 1) % focusableEls.length
                : (currentIndex - 1 + focusableEls.length) % focusableEls.length;
            focusableEls[nextIndex]?.focus();
          }
        }
      }
    };

    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        anchorEl &&
        !anchorEl.contains(target)
      ) {
        onClose();
      }
    };

    const handleScroll = (e: Event) => {
      if (popoverRef.current && popoverRef.current.contains(e.target as Node)) {
        return;
      }
      updatePosition();
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('mousedown', handlePointerDown, true);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('mousedown', handlePointerDown, true);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [anchorEl, onClose, updatePosition]);

  // Focus management: focus popover when mounted, restore focus to anchor when closed
  useEffect(() => {
    const popoverEl = popoverRef.current;
    if (popoverEl) {
      const focusable = popoverEl.querySelector<HTMLElement>(
        'button:not(:disabled), input:not(:disabled), select:not(:disabled), [tabindex="0"]',
      );
      focusable?.focus();
    }

    return () => {
      if (anchorEl && anchorEl.isConnected) {
        anchorEl.focus();
      }
    };
  }, [anchorEl]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      ref={popoverRef}
      id={dialogId}
      role="dialog"
      aria-modal="true"
      aria-labelledby={triggerId}
      className="bgrid-toolbox-popover"
      style={{
        ...toolboxThemeStyle,
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
      onClick={e => e.stopPropagation()}
    >
      {showSort && <ToolboxSortSection column={column} columnId={columnId} />}

      {showFilter && (
        <>
          {filterType === 'values' && (
            <ToolboxValueFilterSection column={column} columnId={columnId} />
          )}
          {filterType === 'text' && (
            <ToolboxTextFilterSection column={column} columnId={columnId} />
          )}
          {filterType === 'number' && (
            <ToolboxNumberFilterSection column={column} columnId={columnId} />
          )}
        </>
      )}

      {toolboxConfig && (
        <ToolboxCustomSection
          column={column}
          columnId={columnId}
          columnIndex={columnIndex}
          config={toolboxConfig}
          close={onClose}
        />
      )}
    </div>,
    floatingPortal?.portalRef.current ?? document.body,
  );
}
