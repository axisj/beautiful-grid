import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BGrid } from '../beautiful-grid';

const sortableMocks = vi.hoisted(() => ({
  create: vi.fn(() => ({ destroy: vi.fn() })),
}));

vi.mock('sortablejs', () => ({
  default: { create: sortableMocks.create },
}));

afterEach(() => {
  sortableMocks.create.mockClear();
});

describe('column sortable loading', () => {
  const columns = [
    { key: 'id', label: 'ID', width: 100 },
    { key: 'name', label: 'Name', width: 140 },
  ];
  const data = [{ values: { id: 1, name: 'Alpha' } }];

  it('initializes Sortable only after column reordering is enabled and destroys it on cleanup', async () => {
    const { rerender, unmount } = render(
      <BGrid width={300} height={140} columns={columns} data={data} columnSortable={false} />,
    );

    await Promise.resolve();
    expect(sortableMocks.create).not.toHaveBeenCalled();

    rerender(<BGrid width={300} height={140} columns={columns} data={data} columnSortable />);

    await waitFor(() => expect(sortableMocks.create).toHaveBeenCalledTimes(1));
    expect(sortableMocks.create).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        draggable: '.drag-item',
        handle: '.bgrid-column-drag-handle',
        filter: '.bgrid-toolbox-trigger-btn, .bgrid-col-resizer',
        preventOnFilter: false,
      }),
    );

    const instance = sortableMocks.create.mock.results[0].value;
    unmount();
    expect(instance.destroy).toHaveBeenCalledTimes(1);
  });

  it('keeps SortableJS behind the shared dynamic runtime boundary', () => {
    const componentsDirectory = resolve(import.meta.dirname, '../beautiful-grid/components');
    const tableHead = readFileSync(resolve(componentsDirectory, 'TableHead.tsx'), 'utf8');
    const frozenTableHead = readFileSync(resolve(componentsDirectory, 'TableHeadFrozen.tsx'), 'utf8');
    const loader = readFileSync(resolve(componentsDirectory, 'useColumnSortable.ts'), 'utf8');
    const runtime = readFileSync(resolve(componentsDirectory, 'columnSortableRuntime.ts'), 'utf8');

    expect(tableHead).not.toContain("from 'sortablejs'");
    expect(frozenTableHead).not.toContain("from 'sortablejs'");
    expect(loader).toContain("import('./columnSortableRuntime')");
    expect(runtime).toContain("import Sortable from 'sortablejs'");
  });
});
