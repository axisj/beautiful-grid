import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BGrid, type BGridColumn, type BGridDataItem, type BGridSortParam } from '../beautiful-grid';

interface Row {
  id: number;
  name: string;
  enabled: boolean;
}

const data: BGridDataItem<Row>[] = [
  { values: { id: 1, name: 'one', enabled: true } },
  { values: { id: 2, name: 'two', enabled: false } },
];

const columns: BGridColumn<Row>[] = [
  { key: 'id', label: 'ID', width: 80 },
  { key: 'name', label: 'Name', width: 120, editable: true, editor: { type: 'text' } },
  {
    key: 'enabled',
    label: 'Enabled',
    width: 100,
    editable: true,
    editor: {
      type: 'checkbox',
      header: { ariaLabel: 'Toggle all enabled' },
      ariaLabel: ({ values }) => `Toggle ${values.name}`,
    },
  },
];

describe('BGrid disabled state', () => {
  it('marks the root as disabled and suppresses cell clicks', () => {
    const onClick = vi.fn();
    const { container } = render(
      <BGrid<Row> width={360} height={180} columns={columns} data={data} disabled onClick={onClick} />,
    );

    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    expect(grid).toHaveAttribute('aria-disabled', 'true');
    expect(grid).toHaveAttribute('data-bgrid-disabled', 'true');

    fireEvent.click(screen.getByText('one'));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders row and editor checkboxes as unavailable', () => {
    const onRowCheckedChange = vi.fn();
    const onChangeData = vi.fn();
    render(
      <BGrid<Row>
        width={400}
        height={180}
        columns={columns}
        data={data}
        rowKey='id'
        rowChecked={{ checkedRowKeys: [], onChange: onRowCheckedChange }}
        editable
        disabled
        onChangeData={onChangeData}
      />,
    );

    const rowCheckbox = screen.getAllByRole('checkbox').find(checkbox => !checkbox.getAttribute('aria-label'));
    const cellCheckbox = screen.getByRole('checkbox', { name: 'Toggle one' });
    const headerCheckbox = screen.getByRole('checkbox', { name: 'Toggle all enabled' });

    expect(rowCheckbox).toHaveAttribute('aria-disabled', 'true');
    expect(cellCheckbox).toHaveAttribute('aria-disabled', 'true');
    expect(headerCheckbox).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(rowCheckbox as HTMLElement);
    fireEvent.click(cellCheckbox);
    fireEvent.click(headerCheckbox);

    expect(onRowCheckedChange).not.toHaveBeenCalled();
    expect(onChangeData).not.toHaveBeenCalled();
  });

  it('prevents text editing and keyboard activation', async () => {
    const onChangeData = vi.fn();
    const { container } = render(
      <BGrid<Row>
        width={360}
        height={180}
        columns={columns}
        data={data}
        editable
        disabled
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 1 } }}
        onChangeData={onChangeData}
      />,
    );

    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    const nameCell = container.querySelector('td[data-row-index="0"][data-column-index="1"]') as HTMLElement;
    const gateway = container.querySelector('[data-bgrid-text-editor-gateway="true"]');

    fireEvent.doubleClick(nameCell);
    grid.focus();
    fireEvent.keyDown(grid, { key: 'F2' });
    fireEvent.keyDown(grid, { key: 'Enter' });
    fireEvent.keyDown(grid, { key: ' ' });

    await waitFor(() => {
      expect(gateway).not.toHaveClass('bgrid-text-editor-active');
    });
    expect(nameCell).not.toHaveClass('bgrid-cell-active');
    expect(onChangeData).not.toHaveBeenCalled();
  });

  it('blocks header sort, toolbox, column resize, and pagination callbacks', () => {
    const onSortChange = vi.fn();
    const onChangeColumns = vi.fn();
    const onPageChange = vi.fn();
    const sortParams: BGridSortParam[] = [];
    const { container } = render(
      <BGrid<Row>
        width={360}
        height={180}
        columns={[{ ...columns[0], toolbox: true }, ...columns.slice(1)]}
        data={data}
        disabled
        sort={{ sortParams, onChange: onSortChange }}
        onChangeColumns={onChangeColumns}
        page={{ currentPage: 1, pageSize: 10, totalPages: 2, totalElements: 20, onChange: onPageChange }}
      />,
    );

    const headerCell = container.querySelector("[role='rfdg-head'] [data-column-index='0']") as HTMLElement;
    const resizeHandle = headerCell.querySelector('.bgrid-col-resizer-handle') as HTMLElement;

    fireEvent.click(headerCell);
    fireEvent.pointerDown(resizeHandle, { pointerId: 1, clientX: 80, clientY: 10 });
    const nextPage = Array.from(container.querySelectorAll('.bgrid-page-no')).find(
      pageNumber => pageNumber.textContent === '2',
    ) as HTMLElement;
    fireEvent.click(nextPage);

    expect(screen.queryByTitle('컬럼 옵션 열기')).not.toBeInTheDocument();
    expect(onSortChange).not.toHaveBeenCalled();
    expect(onChangeColumns).not.toHaveBeenCalled();
    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('restores interactions after disabled is cleared', async () => {
    const onClick = vi.fn();
    const onChangeData = vi.fn();
    const { container, rerender } = render(
      <BGrid<Row>
        width={360}
        height={180}
        columns={columns}
        data={data}
        editable
        disabled
        onClick={onClick}
        onChangeData={onChangeData}
      />,
    );

    rerender(
      <BGrid<Row>
        width={360}
        height={180}
        columns={columns}
        data={data}
        editable
        onClick={onClick}
        onChangeData={onChangeData}
      />,
    );

    fireEvent.click(screen.getByText('one'));
    expect(onClick).toHaveBeenCalledTimes(1);

    const nameCell = container.querySelector('td[data-row-index="0"][data-column-index="1"]') as HTMLElement;
    const gateway = container.querySelector('[data-bgrid-text-editor-gateway="true"]');
    fireEvent.doubleClick(nameCell);

    await waitFor(() => {
      expect(gateway).toHaveClass('bgrid-text-editor-active');
    });
  });
});
