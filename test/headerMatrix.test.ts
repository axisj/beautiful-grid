import { describe, expect, it } from 'vitest';
import type { AppModelColumn, BGridColumnGroupNode } from '../beautiful-grid/types';
import { buildHeaderMatrix } from '../beautiful-grid/utils/buildHeaderMatrix';

interface Row {
  [key: string]: string;
}

function createColumns(ids: string[]): AppModelColumn<Row>[] {
  return ids.map((id, index) => ({
    id,
    columnId: id,
    key: id,
    label: id.toUpperCase(),
    width: 100,
    left: index * 100,
  }));
}

describe('buildHeaderMatrix', () => {
  it('creates one row for a flat column list', () => {
    const matrix = buildHeaderMatrix({ columns: createColumns(['a', 'b', 'c']) });

    expect(matrix.errors).toEqual([]);
    expect(matrix.rowCount).toBe(1);
    expect(matrix.rows[0].map(cell => [cell.type, cell.columnIndex, cell.rowSpan])).toEqual([
      ['column', 0, 1],
      ['column', 1, 1],
      ['column', 2, 1],
    ]);
  });

  it('supports uneven groups nested beyond two levels', () => {
    const columnGroups: BGridColumnGroupNode[] = [
      {
        id: 'business',
        label: 'Business',
        children: [
          'a',
          {
            id: 'sales',
            label: 'Sales',
            children: [
              {
                id: 'domestic',
                label: 'Domestic',
                children: ['b', 'c'],
              },
              'd',
            ],
          },
        ],
      },
    ];

    const matrix = buildHeaderMatrix({ columns: createColumns(['a', 'b', 'c', 'd', 'e']), columnGroups });

    expect(matrix.errors).toEqual([]);
    expect(matrix.rowCount).toBe(4);
    expect(matrix.rows.map(row => row.map(cell => `${cell.type}:${cell.groupId ?? cell.columnIndex}`))).toEqual([
      ['group:business', 'column:4'],
      ['column:0', 'group:sales'],
      ['group:domestic', 'column:3'],
      ['column:1', 'column:2'],
    ]);
    expect(matrix.rows[1][0].rowSpan).toBe(3);
    expect(matrix.rows[0][1].rowSpan).toBe(4);
  });

  it('clips a group that crosses the frozen column boundary', () => {
    const columns = createColumns(['a', 'b', 'c', 'd', 'e']);
    const columnGroups: BGridColumnGroupNode[] = [
      { id: 'cross-boundary', label: 'Cross boundary', children: ['b', 'c', 'd', 'e'] },
    ];

    const frozen = buildHeaderMatrix({ columns, columnGroups, startColumnIndex: 0, endColumnIndex: 3 });
    const scrolling = buildHeaderMatrix({ columns, columnGroups, startColumnIndex: 3, endColumnIndex: 5 });

    expect(frozen.rows[0].find(cell => cell.type === 'group')).toMatchObject({
      startColumnIndex: 1,
      endColumnIndex: 2,
      colSpan: 2,
    });
    expect(scrolling.rows[0][0]).toMatchObject({
      type: 'group',
      startColumnIndex: 3,
      endColumnIndex: 4,
      colSpan: 2,
    });
  });

  it('keeps the legacy range API and clips its frozen colspan correctly', () => {
    const matrix = buildHeaderMatrix({
      columns: createColumns(['a', 'b', 'c', 'd', 'e']),
      columnsGroup: [{ label: 'Legacy', groupStartIndex: 2, groupEndIndex: 4 }],
      startColumnIndex: 0,
      endColumnIndex: 3,
    });

    expect(matrix.rowCount).toBe(2);
    expect(matrix.rows[0].find(cell => cell.type === 'group')).toMatchObject({
      startColumnIndex: 2,
      endColumnIndex: 2,
      colSpan: 1,
    });
  });

  it('falls back to flat headers for invalid group trees', () => {
    const matrix = buildHeaderMatrix({
      columns: createColumns(['a', 'b', 'c']),
      columnGroups: [
        { id: 'invalid', label: 'Invalid', children: ['a', 'missing', 'a'] },
        { id: 'invalid', label: 'Duplicate group', children: ['c'] },
      ],
    });

    expect(matrix.rowCount).toBe(1);
    expect(matrix.rows[0]).toHaveLength(3);
    expect(matrix.errors).toEqual(
      expect.arrayContaining([
        'unknown-column-id:missing',
        'duplicate-column-reference:a',
        'duplicate-group-id:invalid',
      ]),
    );
  });
});
