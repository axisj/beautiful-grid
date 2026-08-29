import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BGrid } from '../beautiful-grid';
import { BGridColumn, BGridDataControl } from '../beautiful-grid/types';

describe('Toolbox Component Coverage', () => {
  const sampleData = [
    { values: { id: 1, category: 'A', price: 100 } },
    { values: { id: 2, category: 'B', price: 200 } },
    { values: { id: 3, category: 'C', price: 300 } },
  ];

  const columns: BGridColumn<any>[] = [
    { id: 'id', key: 'id', label: 'ID', toolbox: true, filter: { type: 'number' } },
    { id: 'category', key: 'category', label: 'Category', toolbox: true, filter: { type: 'values' } },
    { id: 'price', key: 'price', label: 'Price', toolbox: true, filter: { type: 'number' } },
  ];

  async function openToolbox(button: HTMLElement) {
    fireEvent.pointerEnter(button);
    fireEvent.click(button);
    return screen.findByRole('dialog');
  }

  it('ToolboxSortSection - asc, desc, clear buttons', async () => {
    let currentQuery = { sortParams: [], filterParams: [] };
    const onChange = vi.fn(q => { currentQuery = q; });
    const { rerender } = render(
      <BGrid
        data={sampleData}
        columns={columns}
        dataControl={{ mode: 'client', query: currentQuery, onChange }}
      />
    );
    
    const buttons = screen.getAllByTitle('컬럼 옵션 열기');
    await openToolbox(buttons[0]); // ID column

    const ascBtn = screen.getByText('오름차순 정렬');

    await act(async () => {
      fireEvent.click(ascBtn);
    });

    rerender(
      <BGrid
        data={sampleData}
        columns={columns}
        dataControl={{ mode: 'client', query: currentQuery, onChange }}
      />
    );

    let triggerBtns = screen.getAllByTitle('컬럼 옵션 열기');
    await openToolbox(triggerBtns[0]);
    
    const newDescBtn = await screen.findByText('내림차순 정렬');
    await act(async () => {
      fireEvent.click(newDescBtn);
    });

    rerender(
      <BGrid
        data={sampleData}
        columns={columns}
        dataControl={{ mode: 'client', query: currentQuery, onChange }}
      />
    );

    triggerBtns = screen.getAllByTitle('컬럼 옵션 열기');
    await openToolbox(triggerBtns[0]);
    
    expect(currentQuery.sortParams[0].orderBy).toBe('desc');
  });

  it('ToolboxValueFilterSection - search, toggle, select all, clear, apply', async () => {
    let currentQuery = { sortParams: [], filterParams: [] };
    const onChange = vi.fn(q => { currentQuery = q; });
    render(
      <BGrid
        data={sampleData}
        columns={columns}
        dataControl={{ mode: 'client', query: currentQuery, onChange }}
      />
    );
    
    const buttons = screen.getAllByTitle('컬럼 옵션 열기');
    await openToolbox(buttons[1]); // Category column

    // Search
    const searchInput = screen.getByPlaceholderText('검색...');
    await act(async () => {
      fireEvent.change(searchInput, { target: { value: 'A' } });
    });
    // Wait for debounce
    await act(async () => {
      await new Promise(r => setTimeout(r, 200));
    });

    // Checkboxes (Select All + Value 'A')
    const checkboxes = screen.getAllByRole('checkbox');
    // First is select all, second is 'A' (because others are filtered out)
    const selectAllCb = checkboxes[0];
    
    // Toggle Select All
    await act(async () => {
      fireEvent.click(selectAllCb); // Unselect all
    });
    
    // Select just 'A'
    const valueACb = screen.getAllByRole('checkbox')[1]; // 'A'
    await act(async () => {
      fireEvent.click(valueACb);
    });

    const applyBtn = screen.getByRole('button', { name: '적용' });
    await act(async () => {
      fireEvent.click(applyBtn);
    });
    
    expect(onChange).toHaveBeenCalled();
    expect(currentQuery.filterParams.length).toBe(1);
    expect(currentQuery.filterParams[0].values).toEqual(['A']);

    // Clear
    await openToolbox(screen.getAllByTitle('컬럼 옵션 열기')[1]);
    const clearBtn = screen.getByRole('button', { name: '초기화' });
    await act(async () => {
      fireEvent.click(clearBtn);
    });

    expect(currentQuery.filterParams.length).toBe(0);
  });

  it('TableHeadToolbox - keyboard navigation (tab, arrows)', async () => {
    render(
      <BGrid
        data={sampleData}
        columns={columns}
        dataControl={{ mode: 'client', query: { sortParams: [], filterParams: [] }, onChange: vi.fn() }}
      />
    );
    const buttons = screen.getAllByTitle('컬럼 옵션 열기');
    const dialog = await openToolbox(buttons[0]); // ID column
    
    // Arrow keys
    await act(async () => {
      fireEvent.keyDown(document, { key: 'ArrowDown' });
      fireEvent.keyDown(document, { key: 'ArrowUp' });
      // Tab keys
      fireEvent.keyDown(document, { key: 'Tab' });
      fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    });
  });

  it('ToolboxValueFilterSection - manual mode empty state', async () => {
    render(
      <BGrid
        data={[]}
        columns={[{ id: 'cat2', key: 'cat2', label: 'C2', toolbox: true, filter: { type: 'values', values: [] } }]}
        dataControl={{ mode: 'manual', query: { sortParams: [], filterParams: [] }, onChange: vi.fn() }}
      />
    );
    const buttons = screen.getAllByTitle('컬럼 옵션 열기');
    await openToolbox(buttons[0]);
    expect(screen.getByText('사용 가능한 값 목록이 없습니다.')).toBeInTheDocument();
  });
});
