import React from 'react';
import { act, fireEvent, render, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BGrid } from '../beautiful-grid';
import { AppStoreProvider, useAppStoreApi } from '../beautiful-grid/store';

const range = { startRowIndex: 0, startColumnIndex: 0, endRowIndex: 1, endColumnIndex: 0 };

function renderStore() {
  return renderHook(() => useAppStoreApi(), {
    wrapper: ({ children }) => <AppStoreProvider>{children}</AppStoreProvider>,
  }).result.current;
}

describe('clearCellSelection', () => {
  it('preserves the state reference and skips subscriber notifications when already clear', () => {
    const store = renderStore();
    const before = store.getState();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    before.clearCellSelection();
    before.clearCellSelection();

    expect(store.getState()).toBe(before);
    expect(store.getState().cellSelectionRanges).toBe(before.cellSelectionRanges);
    expect(listener).not.toHaveBeenCalled();
    unsubscribe();
  });

  it.each([
    { name: 'a current range', selection: { cellSelectionRange: range } },
    { name: 'multiple ranges', selection: { cellSelectionRanges: [range, range] } },
    { name: 'an active drag without ranges', selection: { cellSelecting: true } },
    {
      name: 'ranges and an active drag',
      selection: { cellSelectionRange: range, cellSelectionRanges: [range], cellSelecting: true },
    },
  ])('clears $name once without changing the active cell or data', ({ selection }) => {
    const store = renderStore();
    store.setState({ ...selection, activeCell: { rowIndex: 0, columnIndex: 0 } });
    const before = store.getState();
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    before.clearCellSelection();

    const cleared = store.getState();
    expect(cleared.cellSelectionRange).toBeUndefined();
    expect(cleared.cellSelectionRanges).toEqual([]);
    expect(cleared.cellSelecting).toBe(false);
    expect(cleared.activeCell).toBe(before.activeCell);
    expect(cleared.data).toBe(before.data);
    expect(listener).toHaveBeenCalledTimes(1);

    cleared.clearCellSelection();
    expect(store.getState()).toBe(cleared);
    expect(listener).toHaveBeenCalledTimes(1);
    unsubscribe();
  });

  it('clears only the selected grid on an outside click and leaves an empty hidden grid unchanged', () => {
    const stores: ReturnType<typeof useAppStoreApi>[] = [];
    function Inspector({ index }: { index: number }) {
      stores[index] = useAppStoreApi();
      return null;
    }
    render(
      <>
        {[0, 1].map(index => (
          <div key={index} style={{ display: index === 1 ? 'none' : undefined }}>
            <BGrid
              width={300}
              height={200}
              data={[{ values: { name: 'Alpha' } }, { values: { name: 'Beta' } }]}
              columns={[{ key: 'name', label: 'Name', width: 100 }]}
              cellSelection
              status={{ content: () => <Inspector index={index} /> }}
            />
          </div>
        ))}
      </>,
    );
    act(() => stores[0].getState().setCellSelectionRange(range));
    const hiddenState = stores[1].getState();
    const listeners = stores.map(() => vi.fn());
    const unsubscribes = stores.map((store, index) => store.subscribe(listeners[index]));

    fireEvent.pointerDown(document.body, { clientX: -100, clientY: -100 });

    expect(stores[0].getState().cellSelectionRanges).toEqual([]);
    expect(listeners[0]).toHaveBeenCalledTimes(1);
    expect(stores[1].getState()).toBe(hiddenState);
    expect(listeners[1]).not.toHaveBeenCalled();

    fireEvent.pointerDown(document.body, { clientX: -100, clientY: -100 });
    expect(listeners[0]).toHaveBeenCalledTimes(1);
    expect(listeners[1]).not.toHaveBeenCalled();
    unsubscribes.forEach(unsubscribe => unsubscribe());
  });
});
