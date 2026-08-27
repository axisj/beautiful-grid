import * as React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BGrid, type BGridColumn, type BGridDataItem } from '../beautiful-grid';

interface PermissionRow {
  id: string;
  enabled: boolean;
  locked?: boolean;
  permission: 'Y' | 'N';
  audit: string;
}

function createRows(): BGridDataItem<PermissionRow>[] {
  return [
    { values: { id: 'alpha', enabled: true, permission: 'Y', audit: '' } },
    { values: { id: 'beta', enabled: false, permission: 'N', audit: '' } },
    { values: { id: 'locked', enabled: false, locked: true, permission: 'N', audit: '' } },
  ];
}

describe('built-in checkbox editor', () => {
  it('toggles cell values and lets an indeterminate header update every eligible row', async () => {
    const onChangeData = vi.fn();
    const columns: BGridColumn<PermissionRow>[] = [
      { key: 'id', label: 'Program', width: 130, editable: false },
      {
        key: 'enabled',
        label: 'Enabled',
        width: 150,
        align: 'center',
        editable: true,
        editor: {
          type: 'checkbox',
          header: { ariaLabel: 'Toggle all enabled permissions' },
          ariaLabel: ({ values }) => `Toggle ${values.id}`,
          label: ({ value }) => (value ? 'Allowed' : 'Blocked'),
          disabled: ({ values }) => values.locked === true,
        },
      },
    ];
    const { getByRole } = render(
      <BGrid<PermissionRow>
        width={360}
        height={220}
        columns={columns}
        data={createRows()}
        rowKey='id'
        editable
        onChangeData={onChangeData}
      />,
    );

    const headerCheckbox = getByRole('checkbox', { name: 'Toggle all enabled permissions' });
    const betaCheckbox = getByRole('checkbox', { name: 'Toggle beta' });
    const lockedCheckbox = getByRole('checkbox', { name: 'Toggle locked' });

    expect(headerCheckbox).toHaveAttribute('aria-checked', 'mixed');
    expect(betaCheckbox).toHaveAttribute('aria-checked', 'false');
    expect(lockedCheckbox).toHaveAttribute('aria-disabled', 'true');

    fireEvent.click(betaCheckbox);

    await waitFor(() => {
      expect(betaCheckbox).toHaveAttribute('aria-checked', 'true');
      expect(headerCheckbox).toHaveAttribute('aria-checked', 'true');
    });
    expect(onChangeData).toHaveBeenCalledTimes(1);
    expect(onChangeData.mock.calls[0][0]).toBe(1);
    expect(onChangeData.mock.calls[0][2]).toMatchObject({ id: 'beta', enabled: true });
    expect(onChangeData.mock.calls[0][4]).toMatchObject({ source: 'checkbox' });

    onChangeData.mockClear();
    fireEvent.click(headerCheckbox);

    await waitFor(() => {
      expect(headerCheckbox).toHaveAttribute('aria-checked', 'false');
      expect(getByRole('checkbox', { name: 'Toggle alpha' })).toHaveAttribute('aria-checked', 'false');
      expect(betaCheckbox).toHaveAttribute('aria-checked', 'false');
    });
    expect(onChangeData).toHaveBeenCalledTimes(2);
    expect(onChangeData.mock.calls.map(call => call[0])).toEqual([0, 1]);
    expect(lockedCheckbox).toHaveAttribute('aria-checked', 'false');
  });

  it('maps checked and unchecked states to domain values', async () => {
    const onChangeData = vi.fn();
    const columns: BGridColumn<PermissionRow>[] = [
      {
        key: 'permission',
        label: 'Permission',
        width: 180,
        editable: true,
        editor: {
          type: 'checkbox',
          trueValue: 'Y',
          falseValue: 'N',
          ariaLabel: ({ values }) => `Permission ${values.id}`,
        },
      },
    ];
    const { getByRole } = render(
      <BGrid<PermissionRow>
        width={240}
        height={180}
        columns={columns}
        data={createRows().slice(1, 2)}
        editable
        onChangeData={onChangeData}
      />,
    );

    fireEvent.click(getByRole('checkbox', { name: 'Permission beta' }));

    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeData.mock.calls[0][2].permission).toBe('Y');
  });

  it('passes checkbox changes through onChangeValue before committing related values', async () => {
    const onChangeData = vi.fn();
    const onChangeValue = vi.fn(({ source, changes, commit }) =>
      commit([...changes, { key: 'audit', value: source }]),
    );
    const columns: BGridColumn<PermissionRow>[] = [
      {
        key: 'enabled',
        label: 'Enabled',
        width: 150,
        editable: true,
        editor: { type: 'checkbox', ariaLabel: 'Toggle audited permission' },
        onChangeValue,
      },
      { key: 'audit', label: 'Audit', width: 150 },
    ];
    const { getByRole } = render(
      <BGrid<PermissionRow>
        width={360}
        height={180}
        columns={columns}
        data={createRows().slice(1, 2)}
        editable
        onChangeData={onChangeData}
      />,
    );

    fireEvent.click(getByRole('checkbox', { name: 'Toggle audited permission' }));

    await waitFor(() => expect(onChangeData).toHaveBeenCalledTimes(1));
    expect(onChangeValue).toHaveBeenCalledTimes(1);
    expect(onChangeValue.mock.calls[0][0]).toMatchObject({ source: 'checkbox' });
    expect(onChangeData.mock.calls[0][1]).toBeNull();
    expect(onChangeData.mock.calls[0][2]).toMatchObject({ enabled: true, audit: 'checkbox' });
  });

  it('toggles the active checkbox cell with Space, Enter, and F2', async () => {
    const onChangeData = vi.fn();
    const columns: BGridColumn<PermissionRow>[] = [
      {
        key: 'enabled',
        label: 'Enabled',
        width: 150,
        editable: true,
        editor: { type: 'checkbox', ariaLabel: 'Keyboard permission' },
      },
    ];
    const { container, getByRole } = render(
      <BGrid<PermissionRow>
        width={240}
        height={180}
        columns={columns}
        data={createRows().slice(0, 1)}
        editable
        cellNavigationOptions={{ defaultActiveCell: { rowIndex: 0, columnIndex: 0 } }}
        onChangeData={onChangeData}
      />,
    );
    const grid = container.querySelector('[role="grid"]') as HTMLElement;
    const checkbox = getByRole('checkbox', { name: 'Keyboard permission' });
    grid.focus();

    fireEvent.keyDown(grid, { key: ' ' });
    await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'false'));

    fireEvent.keyDown(grid, { key: 'Enter' });
    await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'true'));

    fireEvent.keyDown(grid, { key: 'F2' });
    await waitFor(() => expect(checkbox).toHaveAttribute('aria-checked', 'false'));
    expect(onChangeData).toHaveBeenCalledTimes(3);
  });

  it('renders cell and header controls as read-only when grid editing is disabled', () => {
    const columns: BGridColumn<PermissionRow>[] = [
      {
        key: 'enabled',
        label: 'Enabled',
        width: 150,
        editor: {
          type: 'checkbox',
          header: { ariaLabel: 'Toggle all read-only permissions' },
          ariaLabel: 'Read-only permission',
        },
      },
    ];
    const { getByRole } = render(
      <BGrid<PermissionRow> width={240} height={180} columns={columns} data={createRows().slice(0, 1)} />,
    );

    expect(getByRole('checkbox', { name: 'Toggle all read-only permissions' })).toHaveAttribute(
      'aria-disabled',
      'true',
    );
    expect(getByRole('checkbox', { name: 'Read-only permission' })).toHaveAttribute('aria-disabled', 'true');
  });
});
