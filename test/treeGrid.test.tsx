import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BGrid } from '../beautiful-grid/BGrid';

const columns = [{ id: 'name', key: 'name', label: 'Name', width: 180 }];
const data = [
  { values: { id: 'root', parentId: null, name: 'Root' } },
  { values: { id: 'child', parentId: 'root', name: 'Child' } },
];

describe('BGrid tree mode', () => {
  it('supports uncontrolled expansion with an accessible toggle', () => {
    render(
      <BGrid
        width={400}
        height={240}
        columns={columns}
        data={data}
        rowKey='id'
        tree={{ parentRowKey: 'parentId', treeColumnId: 'name' }}
      />,
    );
    expect(screen.getByRole('treegrid')).toBeInTheDocument();
    expect(screen.queryByText('Child')).not.toBeInTheDocument();
    const rootRow = screen.getByText('Root').closest('tr')!;
    expect(rootRow).toHaveAttribute('aria-level', '1');
    expect(rootRow).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(within(rootRow).getByRole('button', { name: 'Expand row' }));
    expect(screen.getByText('Child')).toBeInTheDocument();
    expect(screen.getByText('Child').closest('tr')).toHaveAttribute('aria-level', '2');
  });

  it('emits controlled expansion changes', () => {
    const onChange = vi.fn();
    render(
      <BGrid
        width={400}
        height={240}
        columns={columns}
        data={data}
        rowKey='id'
        tree={{ parentRowKey: 'parentId', expandedRowKeys: [], onExpandedRowKeysChange: onChange }}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Expand row' }));
    expect(onChange).toHaveBeenCalledWith(['root'], {
      rowKey: 'root',
      expanded: true,
      item: data[0],
      sourceIndex: 0,
    });
    expect(screen.queryByText('Child')).not.toBeInTheDocument();
  });

  it('renders tree chrome only in treeColumnId and supports custom icons', () => {
    const { container } = render(
      <BGrid
        width={400}
        height={240}
        columns={[
          { id: 'code', key: 'id', label: 'Code', width: 100 },
          { id: 'name', key: 'name', label: 'Name', width: 180 },
        ]}
        data={data}
        rowKey='id'
        tree={{
          parentRowKey: 'parentId',
          treeColumnId: 'name',
          defaultExpandedRowKeys: ['root'],
          icons: { expanded: 'OPEN', collapsed: 'CLOSED', leaf: 'LEAF' },
        }}
      />,
    );

    expect(container.querySelector('td[data-row-index="0"][data-column-index="0"] .bgrid-tree-cell')).toBeNull();
    expect(container.querySelector('td[data-row-index="0"][data-column-index="1"] .bgrid-tree-cell')).toHaveTextContent(
      'OPENRoot',
    );
    expect(container.querySelector('td[data-row-index="1"][data-column-index="1"] .bgrid-tree-cell')).toHaveTextContent(
      'LEAFChild',
    );
  });

  it('keeps an ancestor path visible for a client-side child filter', () => {
    render(
      <BGrid
        width={400}
        height={240}
        columns={[{ id: 'name', key: 'name', label: 'Name', width: 180, filter: { type: 'text' } }]}
        data={data}
        rowKey='id'
        tree={{ parentRowKey: 'parentId' }}
        dataControl={{
          mode: 'client',
          query: {
            sortParams: [],
            filterParams: [{ type: 'text', columnId: 'name', key: 'name', operator: 'contains', value: 'Child' }],
          },
          onChange: () => undefined,
        }}
      />,
    );

    expect(screen.getByText('Root')).toBeInTheDocument();
    expect(screen.getByText('Child')).toBeInTheDocument();
    expect(screen.getByText('Root').closest('tr')).toHaveAttribute('aria-expanded', 'false');
  });

  it('reports the original source index and tree path after editing a projected child', async () => {
    const onChangeData = vi.fn();
    const reorderedData = [data[1], data[0]];
    const { container } = render(
      <BGrid
        width={400}
        height={240}
        columns={[
          {
            id: 'name',
            key: 'name',
            label: 'Name',
            width: 180,
            editable: true,
            editor: { type: 'text' },
          },
        ]}
        data={reorderedData}
        rowKey='id'
        editable
        tree={{ parentRowKey: 'parentId', defaultExpandedRowKeys: ['root'] }}
        onChangeData={onChangeData}
      />,
    );

    const childCell = container.querySelector('td[data-row-index="1"][data-column-index="0"]') as HTMLElement;
    fireEvent.doubleClick(childCell);
    const editor = container.querySelector('[data-bgrid-text-editor-gateway="true"]') as HTMLInputElement;
    await waitFor(() => expect(editor).toHaveClass('bgrid-text-editor-active'));
    fireEvent.input(editor, { target: { value: 'Changed child' } });
    fireEvent.keyDown(editor, { key: 'Enter' });

    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeData.mock.calls[0][0]).toBe(0);
    expect(onChangeData.mock.calls[0][4]?.tree).toEqual({
      rowKey: 'child',
      parentRowKey: 'root',
      sourceIndex: 0,
      depth: 1,
      path: ['root', 'child'],
    });
  });

  it('moves an active descendant to its parent when the branch collapses', async () => {
    const { container } = render(
      <BGrid
        width={400}
        height={240}
        columns={columns}
        data={data}
        rowKey='id'
        tree={{ parentRowKey: 'parentId', defaultExpandedRowKeys: ['root'] }}
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 1, columnIndex: 0 } }}
      />,
    );

    expect(container.querySelector('td[data-row-index="1"]')).toHaveClass('bgrid-cell-active');
    fireEvent.click(screen.getByRole('button', { name: 'Collapse row' }));
    await waitFor(() => expect(screen.queryByText('Child')).not.toBeInTheDocument());
    expect(container.querySelector('td[data-row-index="0"]')).toHaveClass('bgrid-cell-active');
  });
});
