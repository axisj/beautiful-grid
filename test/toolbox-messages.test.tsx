import * as React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BGrid, BGridColumn } from '../beautiful-grid';

const columns: BGridColumn<{ name: string }>[] = [
  { key: 'name', label: 'Name', width: 160, toolbox: true, filter: { type: 'text' } },
];
const data = [{ values: { name: 'Alice' } }];

describe('toolbox messages', () => {
  it('supports partial translations and changing language without losing draft input', async () => {
    const { rerender } = render(
      <BGrid width={500} height={300} columns={columns} data={data} msg={{ toolbox: { textFilter: '文本筛选' } }} />,
    );
    fireEvent.click(screen.getByTitle('컬럼 옵션 열기'));
    const menu = within(await screen.findByRole('dialog'));
    expect(menu.getByText('文本筛选')).toBeVisible();
    expect(menu.getByRole('button', { name: '적용' })).toBeVisible();
    fireEvent.change(menu.getByPlaceholderText('검색어 입력...'), { target: { value: 'Alice' } });

    rerender(<BGrid width={500} height={300} columns={columns} data={data} msg={{ toolbox: { textFilter: 'Text filter', apply: 'Apply' } }} />);
    expect(menu.getByText('Text filter')).toBeVisible();
    expect(menu.getByDisplayValue('Alice')).toBeVisible();
    expect(menu.getByRole('button', { name: 'Apply' })).toBeVisible();

    rerender(<BGrid width={500} height={300} columns={columns} data={data} />);
    expect(menu.getByText('텍스트 필터')).toBeVisible();
  });

  it('keeps translated tooltips scoped to each grid', () => {
    render(<>
      <BGrid width={500} height={300} columns={columns} data={data} msg={{ toolbox: {
        openColumnOptions: '打开列选项',
      } }} />
      <BGrid width={500} height={300} columns={columns} data={data} />
    </>);
    expect(screen.getAllByRole('button', { name: 'Name 컬럼 메뉴' })[0]).toHaveAttribute('title', '打开列选项');
    expect(screen.getAllByRole('button', { name: 'Name 컬럼 메뉴' })[1]).toHaveAttribute('title', '컬럼 옵션 열기');
  });
});
