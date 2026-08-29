import * as React from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { BGrid } from '../beautiful-grid';
import { BGridColumn } from '../beautiful-grid/types';

describe('Toolbox Text & Number Filter Sections', () => {
  const sampleData = [{ values: { id: 1, name: 'Apple', price: 100 } }];

  const columns: BGridColumn<any>[] = [
    { id: 'name', key: 'name', label: 'Name', toolbox: true, filter: { type: 'text' } },
    { id: 'price', key: 'price', label: 'Price', toolbox: true, filter: { type: 'number' } },
  ];

  async function openToolbox(button: HTMLElement) {
    fireEvent.pointerEnter(button);
    fireEvent.click(button);
    return screen.findByRole('dialog');
  }

  it('tests ToolboxTextFilterSection buttons and inputs', async () => {
    let currentQuery = { sortParams: [], filterParams: [] };
    const onChange = vi.fn(q => { currentQuery = q; });
    const { rerender } = render(
      <BGrid data={sampleData} columns={columns} dataControl={{ mode: 'client', query: currentQuery, onChange }} />
    );
    
    const buttons = screen.getAllByTitle('컬럼 옵션 열기');
    await openToolbox(buttons[0]); // Name column

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'contains' } });
    
    const input = screen.getByPlaceholderText('검색어 입력...');
    fireEvent.change(input, { target: { value: 'App' } });

    const applyBtn = screen.getByRole('button', { name: '적용' });
    await act(async () => {
      fireEvent.click(applyBtn);
    });
    expect(currentQuery.filterParams.length).toBe(1);

    // Re-open and test clear
    await openToolbox(screen.getAllByTitle('컬럼 옵션 열기')[0]);
    const clearBtn = screen.getByRole('button', { name: '초기화' });
    await act(async () => {
      fireEvent.click(clearBtn);
    });
  });

  it('tests ToolboxNumberFilterSection buttons and inputs', async () => {
    let currentQuery = { sortParams: [], filterParams: [] };
    const onChange = vi.fn(q => { currentQuery = q; });
    render(
      <BGrid data={sampleData} columns={columns} dataControl={{ mode: 'client', query: currentQuery, onChange }} />
    );
    
    const buttons = screen.getAllByTitle('컬럼 옵션 열기');
    await openToolbox(buttons[1]); // Price column

    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'between' } });
    
    const minInput = screen.getByPlaceholderText('최소값');
    const maxInput = screen.getByPlaceholderText('최대값');
    
    fireEvent.change(minInput, { target: { value: '50' } });
    fireEvent.change(maxInput, { target: { value: '150' } });

    const applyBtn = screen.getByRole('button', { name: '적용' });
    await act(async () => {
      fireEvent.click(applyBtn);
    });
    expect(currentQuery.filterParams.length).toBe(1);

    await openToolbox(screen.getAllByTitle('컬럼 옵션 열기')[1]);
    const clearBtn = screen.getByRole('button', { name: '초기화' });
    await act(async () => {
      fireEvent.click(clearBtn);
    });
  });
});
