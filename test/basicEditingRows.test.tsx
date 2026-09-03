import * as React from 'react';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import BasicEditingExample from '../examples/BasicEditingExample';

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(1000);
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(340);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('basic editing row actions', () => {
  it('deletes only checked rows, clears selection, handles an empty grid and adds unique rows', () => {
    const { container, getByRole, getAllByRole } = render(<BasicEditingExample />);
    const remove = getByRole('button', { name: '행삭제' });
    const add = getByRole('button', { name: '행추가' });
    expect(remove).toBeDisabled();
    fireEvent.click(getAllByRole('checkbox')[1]);
    fireEvent.click(getAllByRole('checkbox')[3]);
    expect(container).toHaveTextContent('선택 2개 / 전체 4개');
    fireEvent.click(remove);
    expect(container).not.toHaveTextContent('ORD-2601');
    expect(container).not.toHaveTextContent('ORD-2603');
    expect(container).toHaveTextContent('ORD-2602');
    expect(container).toHaveTextContent('ORD-2604');
    expect(remove).toBeDisabled();
    fireEvent.click(getAllByRole('checkbox')[0]);
    fireEvent.click(remove);
    expect(container).toHaveTextContent('선택 0개 / 전체 0개');
    expect(container).toHaveTextContent('활성 셀: 없음');
    fireEvent.click(add);
    expect(container).toHaveTextContent('ORD-2605');
    fireEvent.click(getAllByRole('checkbox')[0]);
    fireEvent.click(remove);
    fireEvent.click(add);
    expect(container).toHaveTextContent('ORD-2606');
    expect(container).not.toHaveTextContent('ORD-2605');
    const cell = container.querySelector('td[data-row-index="0"][data-column-index="1"]')!;
    fireEvent.doubleClick(cell);
    const editor = container.querySelector('[data-bgrid-text-editor-gateway="true"]')!;
    fireEvent.change(editor, { target: { value: '새 고객' } });
    fireEvent.keyDown(editor, { key: 'Enter' });
    expect(cell).toHaveTextContent('새 고객');
  });

  it('scrolls to each new row after overflow while retaining the existing active cell', () => {
    const { container, getByRole } = render(
      <React.StrictMode>
        <BasicEditingExample />
      </React.StrictMode>,
    );
    for (let i = 0; i < 20; i += 1) fireEvent.click(getByRole('button', { name: '행추가' }));
    expect(container).toHaveTextContent('ORD-2624');
    expect(
      Number(container.querySelector('.bgrid-scroll-plane')?.getAttribute('data-bgrid-logical-scroll-top')),
    ).toBeGreaterThan(0);
    expect(container).toHaveTextContent('활성 셀: 행 1, 열 2');
    expect(container).toHaveTextContent('선택 0개 / 전체 24개');
  });
});
