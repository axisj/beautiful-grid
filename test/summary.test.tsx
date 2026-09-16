import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';
import { BGrid } from '../beautiful-grid/BGrid';
import { BGridProps, BGridDataItem } from '../beautiful-grid/types';
import { computeSummaryHeight, normalizeSummaryRows } from '../beautiful-grid/utils/summary';

interface TestRow {
  id: number;
  name: string;
  count: number;
  rate: number;
}

const testData: BGridDataItem<TestRow>[] = [
  { values: { id: 1, name: '인바운드팀', count: 116, rate: 100 } },
  { values: { id: 2, name: '홈쇼핑', count: 8, rate: 100 } },
  { values: { id: 3, name: '다이슨', count: 40, rate: 100 } },
  { values: { id: 4, name: '로보락', count: 88, rate: 100 } },
];

const testColumns: BGridProps<TestRow>['columns'] = [
  { key: 'name', label: '그룹명', width: 120 },
  { key: 'count', label: '총건수', width: 100 },
  { key: 'rate', label: '완료율', width: 100 },
];

describe('Summary utilities', () => {
  it('normalizes legacy single-row summary (columns) into rows array', () => {
    const legacySummary: BGridProps<TestRow>['summary'] = {
      position: 'bottom',
      columns: [
        { columnIndex: 0, itemRender: () => '합계' },
        { columnIndex: 1, itemRender: () => '252' },
      ],
    };

    const rows = normalizeSummaryRows(legacySummary);
    expect(rows).toHaveLength(1);
    expect(rows[0].columns).toHaveLength(2);
  });

  it('normalizes multi-row summary (rows)', () => {
    const multiRowSummary: BGridProps<TestRow>['summary'] = {
      position: 'bottom',
      rows: [
        {
          className: 'summary-avg-row',
          columns: [
            { columnIndex: 0, itemRender: () => '평균' },
            { columnIndex: 1, itemRender: () => '63' },
          ],
        },
        {
          className: 'summary-sum-row',
          columns: [
            { columnIndex: 0, itemRender: () => '합계' },
            { columnIndex: 1, itemRender: () => '252' },
          ],
        },
      ],
    };

    const rows = normalizeSummaryRows(multiRowSummary);
    expect(rows).toHaveLength(2);
    expect(rows[0].className).toBe('summary-avg-row');
    expect(rows[1].className).toBe('summary-sum-row');
  });

  it('normalizes 2D array rows shorthand', () => {
    const shorthandSummary: BGridProps<TestRow>['summary'] = {
      position: 'bottom',
      rows: [
        [{ columnIndex: 0, itemRender: () => '평균' }],
        [{ columnIndex: 0, itemRender: () => '합계' }],
      ],
    };

    const rows = normalizeSummaryRows(shorthandSummary);
    expect(rows).toHaveLength(2);
    expect(rows[0].columns[0].columnIndex).toBe(0);
    expect(rows[1].columns[0].columnIndex).toBe(0);
  });

  it('computes summary height correctly for multiple rows', () => {
    const summary: BGridProps<TestRow>['summary'] = {
      position: 'bottom',
      rows: [
        { columns: [] },
        { columns: [] },
      ],
    };

    // Default row height is 30 -> 30 * 2 = 60
    expect(computeSummaryHeight({ summary })).toBe(60);

    // Custom summaryRowHeight
    expect(computeSummaryHeight({ summary, summaryRowHeight: 40 })).toBe(80);

    // Explicit summaryHeight overrides row height calculation
    expect(computeSummaryHeight({ summary, summaryHeight: 100 })).toBe(100);

    // Row-level explicit height
    const customRowSummary: BGridProps<TestRow>['summary'] = {
      position: 'bottom',
      rows: [
        { height: 35, columns: [] },
        { height: 45, columns: [] },
      ],
    };
    expect(computeSummaryHeight({ summary: customRowSummary })).toBe(80);
  });
});

describe('BGrid Multi-row Summary Component Rendering', () => {
  it('renders legacy single-row summary for backward compatibility', () => {
    const { container } = render(
      <BGrid<TestRow>
        width={600}
        height={400}
        data={testData}
        columns={testColumns}
        summary={{
          position: 'bottom',
          columns: [
            { columnIndex: 0, itemRender: () => '총계' },
            {
              columnIndex: 1,
              itemRender: ({ data }) => {
                const total = data.reduce((sum, item) => sum + item.values.count, 0);
                return `${total}건`;
              },
            },
          ],
        }}
      />,
    );

    expect(screen.getByText('총계')).toBeInTheDocument();
    expect(screen.getByText('252건')).toBeInTheDocument();

    const summaryTbody = container.querySelector('tbody[role="rfdg-summary"]');
    expect(summaryTbody).not.toBeNull();
    const trList = summaryTbody!.querySelectorAll('tr');
    expect(trList).toHaveLength(1);
  });

  it('renders multiple summary rows (e.g. Average & Sum) with row styling and rowIndex', () => {
    const capturedRowIndexes: number[] = [];

    const { container } = render(
      <BGrid<TestRow>
        width={600}
        height={400}
        data={testData}
        columns={testColumns}
        summary={{
          position: 'bottom',
          rows: [
            {
              id: 'row-avg',
              className: 'custom-avg-class',
              columns: [
                {
                  columnIndex: 0,
                  itemRender: ({ rowIndex }) => {
                    if (rowIndex !== undefined) capturedRowIndexes.push(rowIndex);
                    return '평균';
                  },
                },
                {
                  columnIndex: 1,
                  itemRender: ({ data, rowIndex }) => {
                    if (rowIndex !== undefined) capturedRowIndexes.push(rowIndex);
                    const avg = data.reduce((sum, item) => sum + item.values.count, 0) / data.length;
                    return `${avg}`;
                  },
                },
              ],
            },
            {
              id: 'row-sum',
              className: 'custom-sum-class',
              columns: [
                {
                  columnIndex: 0,
                  itemRender: ({ rowIndex }) => {
                    if (rowIndex !== undefined) capturedRowIndexes.push(rowIndex);
                    return '합계';
                  },
                },
                {
                  columnIndex: 1,
                  itemRender: ({ data, rowIndex }) => {
                    if (rowIndex !== undefined) capturedRowIndexes.push(rowIndex);
                    const total = data.reduce((sum, item) => sum + item.values.count, 0);
                    return `${total}`;
                  },
                },
              ],
            },
          ],
        }}
      />,
    );

    // Verify both rows are rendered
    expect(screen.getByText('평균')).toBeInTheDocument();
    expect(screen.getByText('63')).toBeInTheDocument();
    expect(screen.getByText('합계')).toBeInTheDocument();
    expect(screen.getByText('252')).toBeInTheDocument();

    // Verify row index passed to itemRender
    expect(capturedRowIndexes).toContain(0);
    expect(capturedRowIndexes).toContain(1);

    // Verify summary table has 2 rows with custom classes
    const summaryTbody = container.querySelector('tbody[role="rfdg-summary"]');
    expect(summaryTbody).not.toBeNull();
    const trList = summaryTbody!.querySelectorAll('tr');
    expect(trList).toHaveLength(2);
    expect(trList[0]).toHaveClass('custom-avg-class');
    expect(trList[1]).toHaveClass('custom-sum-class');
  });

  it('renders multi-row summary correctly with frozen columns', () => {
    const { container } = render(
      <BGrid<TestRow>
        width={600}
        height={400}
        data={testData}
        columns={testColumns}
        frozenColumnIndex={1}
        summary={{
          position: 'bottom',
          rows: [
            {
              className: 'frozen-avg-row',
              columns: [
                { columnIndex: 0, itemRender: () => '평균라벨' },
                { columnIndex: 1, itemRender: () => '63' },
              ],
            },
            {
              className: 'frozen-sum-row',
              columns: [
                { columnIndex: 0, itemRender: () => '합계라벨' },
                { columnIndex: 1, itemRender: () => '252' },
              ],
            },
          ],
        }}
      />,
    );

    // Frozen summary container check
    const frozenSummaryTbody = container.querySelector('tbody[role="rfdg-summay-frozen"]');
    expect(frozenSummaryTbody).not.toBeNull();
    const frozenTrs = frozenSummaryTbody!.querySelectorAll('tr');
    expect(frozenTrs).toHaveLength(2);
    expect(frozenTrs[0]).toHaveClass('frozen-avg-row');
    expect(frozenTrs[1]).toHaveClass('frozen-sum-row');

    // Body summary container check
    const mainSummaryTbody = container.querySelector('tbody[role="rfdg-summary"]');
    expect(mainSummaryTbody).not.toBeNull();
    const mainTrs = mainSummaryTbody!.querySelectorAll('tr');
    expect(mainTrs).toHaveLength(2);
  });

  it('handles colSpan properly across multi-row summary', () => {
    const { container } = render(
      <BGrid<TestRow>
        width={600}
        height={400}
        data={testData}
        columns={testColumns}
        summary={{
          position: 'bottom',
          rows: [
            {
              columns: [
                { columnIndex: 0, colSpan: 2, itemRender: () => '평균 및 건수 합계' },
                { columnIndex: 2, align: 'right', itemRender: () => '100%' },
              ],
            },
          ],
        }}
      />,
    );

    const summaryTbody = container.querySelector('tbody[role="rfdg-summary"]');
    expect(summaryTbody).not.toBeNull();
    const cells = summaryTbody!.querySelectorAll('tr > td:not([data-none])');
    expect(cells).toHaveLength(2);
    expect(cells[0]).toHaveAttribute('colspan', '2');
    expect(cells[0]).toHaveTextContent('평균 및 건수 합계');
    expect(cells[1]).toHaveTextContent('100%');
  });

  it('renders multi-row summary at position top', () => {
    const { container } = render(
      <BGrid<TestRow>
        width={600}
        height={400}
        data={testData}
        columns={testColumns}
        summary={{
          position: 'top',
          rows: [
            { columns: [{ columnIndex: 0, itemRender: () => '상단 1행' }] },
            { columns: [{ columnIndex: 0, itemRender: () => '상단 2행' }] },
          ],
        }}
      />,
    );

    const topSummaryContainer = container.querySelector('.bgrid-summary-position-top');
    expect(topSummaryContainer).not.toBeNull();
    expect(screen.getByText('상단 1행')).toBeInTheDocument();
    expect(screen.getByText('상단 2행')).toBeInTheDocument();
  });
});
