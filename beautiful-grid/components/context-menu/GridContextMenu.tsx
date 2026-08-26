import * as React from 'react';
import { createPortal } from 'react-dom';
import { useAppStore } from '../../store';
import { BGridContextMenuItem } from '../../types';
import { EditorPortalContext, syncEditorPortalTheme } from '../EditorPortalRoot';

interface Props {
  gridRef: React.RefObject<HTMLDivElement | null>;
}

export function GridContextMenu({ gridRef }: Props) {
  const state = useAppStore(s => s.contextMenuState);
  const closeContextMenu = useAppStore(s => s.closeContextMenu);
  const floatingPortal = React.useContext(EditorPortalContext);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const [position, setPosition] = React.useState({ left: -9999, top: -9999 });
  const [activeItemIndex, setActiveItemIndex] = React.useState(0);

  const updatePosition = React.useCallback(() => {
    if (!state || !menuRef.current || typeof window === 'undefined') return;
    const rect = menuRef.current.getBoundingClientRect();
    const padding = 8;
    const left = Math.min(
      Math.max(state.clientX, padding),
      Math.max(padding, window.innerWidth - rect.width - padding),
    );
    const top = Math.min(
      Math.max(state.clientY, padding),
      Math.max(padding, window.innerHeight - rect.height - padding),
    );
    setPosition({ left, top });
  }, [state]);

  React.useLayoutEffect(() => {
    if (state && gridRef.current && floatingPortal?.portalRef.current) {
      syncEditorPortalTheme(gridRef.current, floatingPortal.portalRef.current);
    }
    updatePosition();
  }, [floatingPortal, gridRef, state, updatePosition]);

  React.useEffect(() => {
    if (!state) return;
    const menu = menuRef.current;
    const gridRoot = gridRef.current;
    const firstItemIndex = state.items.findIndex(item => item.type !== 'separator' && !item.disabled);
    setActiveItemIndex(Math.max(firstItemIndex, 0));
    const first = menu?.querySelector<HTMLButtonElement>('button:not(:disabled)');
    first?.focus({ preventScroll: true });

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) closeContextMenu();
    };
    const handleScroll = (event: Event) => {
      if (!menuRef.current?.contains(event.target as Node)) closeContextMenu();
    };
    const handleResize = () => closeContextMenu();

    document.addEventListener('mousedown', handlePointerDown, true);
    document.addEventListener('touchstart', handlePointerDown, true);
    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown, true);
      document.removeEventListener('touchstart', handlePointerDown, true);
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      const activeElement = document.activeElement;
      const shouldRestore =
        state.keyboard &&
        (!activeElement ||
          activeElement === document.body ||
          !activeElement.isConnected ||
          menu?.contains(activeElement));
      if (shouldRestore && gridRoot?.isConnected) {
        gridRoot.focus({ preventScroll: true });
      }
    };
  }, [closeContextMenu, gridRef, state]);

  if (!state || typeof document === 'undefined') return null;

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const buttons = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? []);
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      closeContextMenu();
      return;
    }
    if (event.key === 'Tab') {
      closeContextMenu();
      return;
    }
    if (buttons.length === 0) return;
    const current = buttons.indexOf(document.activeElement as HTMLButtonElement);
    let next: number | undefined;
    if (event.key === 'ArrowDown') next = current < 0 ? 0 : (current + 1) % buttons.length;
    if (event.key === 'ArrowUp')
      next = current < 0 ? buttons.length - 1 : (current - 1 + buttons.length) % buttons.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = buttons.length - 1;
    if (next === undefined) return;
    event.preventDefault();
    const nextButton = buttons[next];
    const nextItemIndex = Number(nextButton?.dataset.menuIndex);
    if (Number.isFinite(nextItemIndex)) setActiveItemIndex(nextItemIndex);
    nextButton?.focus({ preventScroll: true });
  };

  const selectItem = (item: Extract<BGridContextMenuItem<any>, { type?: 'item' }>) => {
    if (item.disabled) return;
    const target = state.target;
    closeContextMenu();
    Promise.resolve(item.onSelect(target)).catch(error => {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[BGrid] Context menu item "${item.id}" failed.`, error);
      }
    });
  };

  return createPortal(
    <div
      ref={menuRef}
      role='menu'
      aria-label='DataGrid 셀 메뉴'
      className='bgrid-context-menu'
      style={{ left: position.left, top: position.top }}
      onKeyDown={handleKeyDown}
      onContextMenu={event => event.preventDefault()}
    >
      {state.items.map((item, itemIndex) =>
        item.type === 'separator' ? (
          <div key={item.id} role='separator' className='bgrid-context-menu-separator' />
        ) : (
          <button
            key={item.id}
            type='button'
            role='menuitem'
            data-menu-index={itemIndex}
            tabIndex={itemIndex === activeItemIndex ? 0 : -1}
            disabled={item.disabled}
            aria-disabled={item.disabled || undefined}
            className='bgrid-context-menu-item'
            onFocus={() => setActiveItemIndex(itemIndex)}
            onClick={() => selectItem(item)}
          >
            {item.icon && <span className='bgrid-context-menu-icon'>{item.icon}</span>}
            <span className='bgrid-context-menu-label'>{item.label}</span>
            {item.shortcut && <span className='bgrid-context-menu-shortcut'>{item.shortcut}</span>}
          </button>
        ),
      )}
    </div>,
    floatingPortal?.portalRef.current ?? document.body,
  );
}
