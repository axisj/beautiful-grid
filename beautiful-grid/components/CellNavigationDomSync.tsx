import * as React from 'react';
import { BGridCellAddress, BGridCellSelectionRange } from '../types';

interface Props {
  containerRef: React.RefObject<HTMLElement | null>;
  activeCell?: BGridCellAddress;
  cellSelectionRanges: BGridCellSelectionRange[];
  hasMultiCellSelection: boolean;
  rowCount: number;
  columnCount: number;
}

/**
 * Keeps the compatibility classes/data attributes on rendered table cells and
 * axes without making every body/header subscribe to navigation state.
 * Selection geometry itself is rendered by the lightweight overlay layer.
 */
export function CellNavigationDomSync({
  containerRef,
  activeCell,
  cellSelectionRanges,
  hasMultiCellSelection,
  rowCount,
  columnCount,
}: Props) {
  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container
      .querySelectorAll<HTMLElement>(
        '[data-bgrid-cell-active="true"], [data-bgrid-cell-active-multi-selection="true"]',
      )
      .forEach(cell => {
        cell.classList.remove('bgrid-cell-active', 'bgrid-cell-active-multi-selection');
        cell.removeAttribute('data-bgrid-cell-active');
        cell.removeAttribute('data-bgrid-cell-active-multi-selection');
      });

    if (activeCell) {
      container
        .querySelectorAll<HTMLElement>(
          `td[data-bgrid-cell="true"][data-bgrid-logical-row-index="${activeCell.rowIndex}"][data-column-index="${activeCell.columnIndex}"]`,
        )
        .forEach(cell => {
          cell.classList.add('bgrid-cell-active');
          cell.setAttribute('data-bgrid-cell-active', 'true');
          if (hasMultiCellSelection) {
            cell.classList.add('bgrid-cell-active-multi-selection');
            cell.setAttribute('data-bgrid-cell-active-multi-selection', 'true');
          }
        });
    }

    const coversEveryColumn = cellSelectionRanges.some(
      range => coversCompleteAxis(range.startColumnIndex, range.endColumnIndex, columnCount),
    );
    const coversEveryRow = cellSelectionRanges.some(
      range => coversCompleteAxis(range.startRowIndex, range.endRowIndex, rowCount),
    );
    const wholeRowSelection = coversEveryColumn && !coversEveryRow;
    const wholeColumnSelection = coversEveryRow && !coversEveryColumn;

    container.querySelectorAll<HTMLElement>('.bgrid-line-number-cell[data-row-index]').forEach(cell => {
      const rowIndex = Number(cell.dataset.rowIndex);
      const active =
        !wholeColumnSelection &&
        Number.isFinite(rowIndex) &&
        isRowAxisActive(rowIndex, activeCell, cellSelectionRanges);
      cell.classList.toggle('bgrid-row-axis-active', active);
      if (active) cell.setAttribute('data-bgrid-row-axis-active', 'true');
      else cell.removeAttribute('data-bgrid-row-axis-active');
    });

    container.querySelectorAll<HTMLTableCellElement>('[data-header-cell-type][data-column-index]').forEach(cell => {
      const columnIndex = Number(cell.dataset.columnIndex);
      const active =
        cell.dataset.headerCellType === 'column' &&
        !wholeRowSelection &&
        Number.isFinite(columnIndex) &&
        isColumnAxisActive(columnIndex, activeCell, cellSelectionRanges);
      cell.classList.toggle('bgrid-column-axis-active', active);
      if (active) cell.setAttribute('data-bgrid-column-axis-active', 'true');
      else cell.removeAttribute('data-bgrid-column-axis-active');
    });
  });

  return null;
}

function coversCompleteAxis(first: number, second: number, length: number) {
  return length > 0 && Math.min(first, second) === 0 && Math.max(first, second) === length - 1;
}

function isRowAxisActive(
  rowIndex: number,
  activeCell: BGridCellAddress | undefined,
  ranges: BGridCellSelectionRange[],
) {
  if (activeCell?.rowIndex === rowIndex) return true;
  return ranges.some(range => isWithin(rowIndex, range.startRowIndex, range.endRowIndex));
}

function isColumnAxisActive(
  columnIndex: number,
  activeCell: BGridCellAddress | undefined,
  ranges: BGridCellSelectionRange[],
) {
  if (activeCell?.columnIndex === columnIndex) return true;
  return ranges.some(range => {
    const rangeStart = Math.min(range.startColumnIndex, range.endColumnIndex);
    const rangeEnd = Math.max(range.startColumnIndex, range.endColumnIndex);
    return columnIndex >= rangeStart && columnIndex <= rangeEnd;
  });
}

function isWithin(value: number, first: number, second: number) {
  return value >= Math.min(first, second) && value <= Math.max(first, second);
}
