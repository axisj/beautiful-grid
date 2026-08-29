import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { BGrid } from '../beautiful-grid';

const data = [
  { values: { id: 1, name: 'Apple', category: 'Fruit' } },
  { values: { id: 2, name: 'Pineapple', category: 'Fruit' } },
  { values: { id: 3, name: 'Carrot', category: 'Vegetable' } },
];

const columns = [
  { id: 'id', key: 'id', label: 'ID', width: 80 },
  { id: 'name', key: 'name', label: 'Name', width: 140 },
  { id: 'category', key: 'category', label: 'Category', width: 140 },
];

function focusGrid(container: HTMLElement) {
  const grid = container.querySelector<HTMLElement>("[role='grid']")!;
  grid.focus();
  return grid;
}

describe('BGrid search and context menu', () => {
  it('opens with Ctrl+F, highlights matches and cycles with Enter and Shift+Enter', async () => {
    const { container } = render(
      <BGrid width={500} height={260} data={data} columns={columns} searchOptions={{}} />,
    );
    focusGrid(container);
    fireEvent.keyDown(document, { key: 'f', ctrlKey: true });

    const input = await screen.findByRole('textbox', { name: '그리드 데이터 찾기' });
    fireEvent.change(input, { target: { value: 'apple' } });

    await waitFor(() => expect(screen.getByText('1 / 2')).toHaveClass('bgrid-search-result-status'));
    expect(container.querySelectorAll('[data-bgrid-search-match="true"]')).toHaveLength(2);
    expect(container.querySelector('[data-bgrid-search-current="true"]')).toHaveAttribute('data-row-index', '0');

    fireEvent.keyDown(input, { key: 'Enter' });
    expect(container.querySelector('[data-bgrid-search-current="true"]')).toHaveAttribute('data-row-index', '1');
    fireEvent.keyDown(input, { key: 'Enter', shiftKey: true });
    expect(container.querySelector('[data-bgrid-search-current="true"]')).toHaveAttribute('data-row-index', '0');

    fireEvent.keyDown(input, { key: 'Escape' });
    expect(screen.queryByRole('textbox', { name: '그리드 데이터 찾기' })).not.toBeInTheDocument();
    expect(container.querySelector('[data-bgrid-search-match="true"]')).toBeNull();
  });

  it('opens search from the body cell context menu', async () => {
    const { container } = render(
      <BGrid width={500} height={260} data={data} columns={columns} searchOptions={{}} />,
    );
    const apple = screen.getByText('Apple');
    fireEvent.contextMenu(apple, { clientX: 80, clientY: 90 });

    const menu = await screen.findByRole('menu', { name: 'DataGrid 셀 메뉴' });
    expect(menu).toBeInTheDocument();
    expect(menu.parentElement).toHaveAttribute('data-bgrid-floating-portal-root', 'true');
    fireEvent.click(screen.getByRole('menuitem', { name: /검색/ }));
    expect(document.activeElement).toBe(await screen.findByRole('textbox', { name: '그리드 데이터 찾기' }));
    expect(container.querySelector("[role='grid']")).toBeInTheDocument();
  });

  it('selects a right-clicked cell before opening the menu and closes it when another cell is selected', async () => {
    const interactionOrder: string[] = [];
    render(
      <BGrid
        width={500}
        height={260}
        data={data}
        columns={columns}
        contextMenuOptions={{
          items: () => [{ id: 'inspect', label: '행 확인', onSelect: vi.fn() }],
          onOpenChange: open => interactionOrder.push(open ? 'menu:open' : 'menu:close'),
        }}
        cellNavigationOptions={{
          onActiveCellChange: cell => interactionOrder.push(`cell:${cell?.rowIndex}:${cell?.columnIndex}`),
        }}
      />,
    );

    const targetCell = screen.getByText('Pineapple').closest('td')!;
    fireEvent.contextMenu(targetCell, { clientX: 80, clientY: 90 });

    expect(await screen.findByRole('menu', { name: 'DataGrid 셀 메뉴' })).toBeInTheDocument();
    expect(targetCell).toHaveClass('bgrid-cell-active');
    expect(document.querySelectorAll('[data-bgrid-selection-fragment="true"]')).toHaveLength(1);
    expect(interactionOrder.slice(0, 2)).toEqual(['cell:1:1', 'menu:open']);

    const otherCell = screen.getByText('Carrot').closest('td')!;
    fireEvent.pointerDown(otherCell, { button: 0, clientX: 100, clientY: 120 });

    expect(screen.queryByRole('menu', { name: 'DataGrid 셀 메뉴' })).not.toBeInTheDocument();
    expect(otherCell).toHaveClass('bgrid-cell-active');
    expect(document.querySelectorAll('[data-bgrid-selection-fragment="true"]')).toHaveLength(1);
    expect(interactionOrder).toContain('menu:close');
  });

  it('passes visible and source indexes to custom context menu items after client sorting', async () => {
    const onSelect = vi.fn();
    const query = {
      sortParams: [{ columnId: 'name', key: 'name', orderBy: 'desc' as const }],
      filterParams: [],
    };
    render(
      <BGrid
        width={500}
        height={260}
        data={data}
        columns={columns}
        dataControl={{ mode: 'client', query, onChange: vi.fn() }}
        contextMenuOptions={{
          items: target => [{ id: 'inspect', label: '행 확인', onSelect: () => onSelect(target) }],
        }}
      />,
    );

    fireEvent.contextMenu(screen.getByText('Pineapple'), { clientX: 40, clientY: 60 });
    fireEvent.click(await screen.findByRole('menuitem', { name: '행 확인' }));
    expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ visibleIndex: 0, sourceIndex: 1 }));
  });

  it('does not intercept Ctrl+F outside the grid or while a text edit session is active', async () => {
    const { container } = render(
      <div>
        <button type='button'>Outside</button>
        <BGrid
          width={500}
          height={260}
          data={data}
          columns={columns.map(column => ({ ...column, editable: true, editor: { type: 'text' as const } }))}
          editable
          searchOptions={{}}
          cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 1 } }}
        />
      </div>,
    );

    const outside = screen.getByRole('button', { name: 'Outside' });
    outside.focus();
    const outsideFind = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true });
    act(() => {
      document.dispatchEvent(outsideFind);
    });
    expect(outsideFind.defaultPrevented).toBe(false);

    focusGrid(container);
    fireEvent.keyDown(document, { key: 'F2' });
    const editor = screen.getByRole('textbox', { name: /텍스트 편집/ });
    expect(document.activeElement).toBe(editor);
    const editingFind = new KeyboardEvent('keydown', { key: 'f', ctrlKey: true, bubbles: true, cancelable: true });
    act(() => {
      editor.dispatchEvent(editingFind);
    });
    expect(editingFind.defaultPrevented).toBe(false);
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
    fireEvent.keyDown(editor, { key: 'Escape' });
  });

  it('supports controlled open and query state from an external toolbar', async () => {
    const openChanges = vi.fn();
    const queryChanges = vi.fn();

    function ControlledSearchGrid() {
      const [open, setOpen] = React.useState(false);
      const [query, setQuery] = React.useState('');
      return (
        <div>
          <button type='button' onClick={() => setOpen(true)}>
            외부 검색
          </button>
          <BGrid
            width={500}
            height={260}
            data={data}
            columns={columns}
            searchOptions={{
              open,
              query,
              onOpenChange: (nextOpen, reason) => {
                openChanges(nextOpen, reason);
                setOpen(nextOpen);
              },
              onQueryChange: nextQuery => {
                queryChanges(nextQuery);
                setQuery(nextQuery);
              },
            }}
          />
        </div>
      );
    }

    render(<ControlledSearchGrid />);
    fireEvent.click(screen.getByRole('button', { name: '외부 검색' }));
    const input = await screen.findByRole('textbox', { name: '그리드 데이터 찾기' });
    fireEvent.change(input, { target: { value: 'fruit' } });
    await waitFor(() => expect(screen.getByText('1 / 2')).toBeInTheDocument());
    expect(queryChanges).toHaveBeenLastCalledWith('fruit');

    fireEvent.click(screen.getByRole('button', { name: '검색 닫기' }));
    expect(openChanges).toHaveBeenLastCalledWith(false, 'closeButton');
    expect(screen.queryByRole('search')).not.toBeInTheDocument();
  });

  it('keeps search state isolated across multiple grid instances', async () => {
    const { container } = render(
      <div>
        <section aria-label='첫 번째 그리드'>
          <BGrid width={500} height={260} data={data} columns={columns} searchOptions={{}} />
        </section>
        <section aria-label='두 번째 그리드'>
          <BGrid width={500} height={260} data={data} columns={columns} searchOptions={{}} />
        </section>
      </div>,
    );
    const grids = container.querySelectorAll<HTMLElement>("[role='grid']");

    grids[0].focus();
    fireEvent.keyDown(document, { key: 'f', ctrlKey: true });
    const firstSearch = await within(screen.getByRole('region', { name: '첫 번째 그리드' })).findByRole('search');
    fireEvent.change(within(firstSearch).getByRole('textbox'), { target: { value: 'apple' } });
    await waitFor(() => expect(within(firstSearch).getByText('1 / 2')).toBeInTheDocument());

    grids[1].focus();
    fireEvent.keyDown(document, { key: 'f', ctrlKey: true });
    const secondSearch = await within(screen.getByRole('region', { name: '두 번째 그리드' })).findByRole('search');
    expect(within(secondSearch).getByRole('textbox')).toHaveValue('');
    expect(within(firstSearch).getByRole('textbox')).toHaveValue('apple');
  });

  it('supports keyboard context menu navigation and restores focus on Escape', async () => {
    const { container } = render(
      <BGrid
        width={500}
        height={260}
        data={data}
        columns={columns}
        searchOptions={{}}
        contextMenuOptions={{
          items: () => [{ id: 'inspect', label: '행 확인', onSelect: vi.fn() }],
        }}
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 1 } }}
      />,
    );
    const grid = focusGrid(container);
    fireEvent.keyDown(document, { key: 'F10', shiftKey: true });

    const menu = await screen.findByRole('menu');
    expect(document.activeElement).toBe(within(menu).getByRole('menuitem', { name: /검색/ }));
    fireEvent.keyDown(menu, { key: 'ArrowDown' });
    expect(document.activeElement).toBe(within(menu).getByRole('menuitem', { name: '행 확인' }));
    fireEvent.keyDown(menu, { key: 'Escape' });
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
    expect(grid.contains(document.activeElement)).toBe(true);
  });

  it('ignores Enter during IME composition and disables navigation with no results', async () => {
    const { container } = render(
      <BGrid width={500} height={260} data={data} columns={columns} searchOptions={{}} />,
    );
    focusGrid(container);
    fireEvent.keyDown(document, { key: 'f', metaKey: true });
    const input = await screen.findByRole('textbox', { name: '그리드 데이터 찾기' });
    fireEvent.change(input, { target: { value: 'apple' } });
    await waitFor(() => expect(screen.getByText('1 / 2')).toBeInTheDocument());
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });
    expect(container.querySelector('[data-bgrid-search-current="true"]')).toHaveAttribute('data-row-index', '0');

    fireEvent.change(input, { target: { value: 'missing' } });
    await waitFor(() => expect(screen.getByText('결과 없음')).toBeInTheDocument());
    expect(screen.getByRole('button', { name: '이전 검색 결과' })).toBeDisabled();
    expect(screen.getByRole('button', { name: '다음 검색 결과' })).toBeDisabled();
  });

  it('keeps a controlled Hangul draft stable until IME composition ends', async () => {
    const onQueryChange = vi.fn();

    function ControlledSearchGrid() {
      const [query, setQuery] = React.useState('');
      return (
        <BGrid
          width={500}
          height={260}
          data={[...data, { values: { id: 4, name: '한글 검색', category: 'Language' } }]}
          columns={columns}
          searchOptions={{
            query,
            onQueryChange: nextQuery => {
              onQueryChange(nextQuery);
              setQuery(nextQuery);
            },
          }}
        />
      );
    }

    const { container } = render(<ControlledSearchGrid />);
    focusGrid(container);
    fireEvent.keyDown(document, { key: 'f', ctrlKey: true });
    const input = await screen.findByRole('textbox', { name: '그리드 데이터 찾기' });

    fireEvent.compositionStart(input);
    fireEvent.change(input, { target: { value: 'ㅎ' } });
    fireEvent.change(input, { target: { value: '한글' } });

    expect(input).toHaveValue('한글');
    expect(onQueryChange).not.toHaveBeenCalled();

    fireEvent.compositionEnd(input, { data: '한글' });

    await waitFor(() => expect(onQueryChange).toHaveBeenCalledWith('한글'));
    await waitFor(() => expect(screen.getByText('1 / 1')).toBeInTheDocument());
    expect(input).toHaveValue('한글');
  });

  it('shares a themed floating portal per grid and removes it on unmount', async () => {
    const { unmount } = render(
      <BGrid
        width={500}
        height={260}
        data={data}
        columns={columns.map((column, index) => (index === 0 ? { ...column, toolbox: true } : column))}
        dataControl={{ mode: 'client', query: { sortParams: [], filterParams: [] }, onChange: vi.fn() }}
        searchOptions={{}}
        style={{ '--bgrid-context-menu-bg': 'rgb(1, 2, 3)' } as React.CSSProperties}
      />,
    );

    const portalRoot = await waitFor(() => {
      const root = document.body.querySelector<HTMLElement>('[data-bgrid-floating-portal-root="true"]');
      expect(root).not.toBeNull();
      return root!;
    });
    expect(portalRoot.style.getPropertyValue('--bgrid-context-menu-bg')).toBe('rgb(1, 2, 3)');

    const toolboxButton = screen.getByTitle('컬럼 옵션 열기');
    fireEvent.pointerEnter(toolboxButton);
    fireEvent.click(toolboxButton);
    expect((await screen.findByRole('dialog')).parentElement).toBe(portalRoot);
    fireEvent.keyDown(document, { key: 'Escape' });

    unmount();
    expect(document.body).not.toContainElement(portalRoot);
  });

  it('cancels a stale chunked scan when a large-grid query changes', async () => {
    const largeColumns = Array.from({ length: 20 }, (_, index) => ({
      id: `field-${index}`,
      key: `field${index}`,
      label: `Field ${index}`,
      width: 100,
    }));
    const largeData = Array.from({ length: 10_000 }, (_, rowIndex) => ({
      values: Object.fromEntries(
        largeColumns.map((_, columnIndex) => [
          `field${columnIndex}`,
          rowIndex === 9_999 && columnIndex === 19 ? 'latest needle' : `row-${rowIndex}-col-${columnIndex}`,
        ]),
      ),
    }));
    const { container } = render(
      <BGrid width={500} height={260} data={largeData} columns={largeColumns} searchOptions={{}} />,
    );
    focusGrid(container);
    fireEvent.keyDown(document, { key: 'f', ctrlKey: true });
    const input = await screen.findByRole('textbox', { name: '그리드 데이터 찾기' });

    fireEvent.change(input, { target: { value: 'needle' } });
    fireEvent.change(input, { target: { value: 'definitely-missing' } });

    await waitFor(() => expect(screen.getByText('결과 없음')).toBeInTheDocument(), { timeout: 5_000 });
    expect(container.querySelector('[data-bgrid-search-match="true"]')).toBeNull();
  });

  it('preserves the native menu when no enabled item exists and closes stale menus after data changes', async () => {
    const openChanges = vi.fn();
    const { rerender } = render(
      <BGrid
        width={500}
        height={260}
        data={data}
        columns={columns}
        contextMenuOptions={{
          items: () => [{ id: 'disabled', label: '사용 불가', disabled: true, onSelect: vi.fn() }],
        }}
      />,
    );
    const disabledEvent = new MouseEvent('contextmenu', { bubbles: true, cancelable: true });
    act(() => {
      screen.getByText('Apple').dispatchEvent(disabledEvent);
    });
    expect(disabledEvent.defaultPrevented).toBe(false);
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();

    rerender(
      <BGrid
        width={500}
        height={260}
        data={data}
        columns={columns}
        contextMenuOptions={{
          items: () => [{ id: 'inspect', label: '행 확인', onSelect: vi.fn() }],
          onOpenChange: openChanges,
        }}
      />,
    );
    fireEvent.contextMenu(screen.getByText('Apple'));
    expect(await screen.findByRole('menu')).toBeInTheDocument();

    rerender(
      <BGrid
        width={500}
        height={260}
        data={[...data]}
        columns={columns}
        contextMenuOptions={{
          items: () => [{ id: 'inspect', label: '행 확인', onSelect: vi.fn() }],
          onOpenChange: openChanges,
        }}
      />,
    );
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument());
    expect(openChanges).toHaveBeenLastCalledWith(false, expect.objectContaining({ visibleIndex: 0 }));
  });
});
