import { describe, expect, it } from 'vitest';
import { getTreeRowPath, projectTreeData } from '../beautiful-grid/utils/treeData';

const data = [
  { values: { id: 'g1', parentId: null, name: 'Group 1' } },
  { values: { id: 'p1', parentId: 'g1', name: 'Part 1' } },
  { values: { id: 'a1', parentId: 'p1', name: 'Agent 1' } },
  { values: { id: 'g2', parentId: null, name: 'Group 2' } },
];

describe('projectTreeData', () => {
  it('shows only roots when every branch is collapsed', () => {
    const result = projectTreeData({ data, rowKey: 'id', parentRowKey: 'parentId', expandedRowKeys: [] });
    expect(result.data.map(item => item.values.id)).toEqual(['g1', 'g2']);
    expect(result.sourceIndexByVisibleIndex).toEqual([0, 3]);
    expect(result.metaByRowKey.has('p1')).toBe(false);
  });

  it('shows expanded descendants and preserves source indexes', () => {
    const result = projectTreeData({
      data,
      rowKey: 'id',
      parentRowKey: 'parentId',
      expandedRowKeys: ['g1', 'p1'],
    });
    expect(result.data.map(item => item.values.id)).toEqual(['g1', 'p1', 'a1', 'g2']);
    expect(result.sourceIndexByVisibleIndex).toEqual([0, 1, 2, 3]);
    expect(result.metaByRowKey.get('a1')).toMatchObject({ depth: 2, hasChildren: false });
  });

  it('falls back to flat rows when a cycle is detected', () => {
    const malformed = [
      { values: { id: 'orphan', parentId: 'missing' } },
      { values: { id: 'a', parentId: 'b' } },
      { values: { id: 'b', parentId: 'a' } },
    ];
    const result = projectTreeData({
      data: malformed,
      rowKey: 'id',
      parentRowKey: 'parentId',
      expandedRowKeys: [],
    });
    expect(result.valid).toBe(false);
    expect(result.diagnostics).toContain('cycle');
    expect(result.data.map(item => item.values.id)).toEqual(['orphan', 'a', 'b']);
  });

  it('preserves matching descendant paths without changing controlled expansion', () => {
    const result = projectTreeData({
      data,
      rowKey: 'id',
      parentRowKey: 'parentId',
      expandedRowKeys: [],
      includedSourceIndexes: [2],
    });

    expect(result.data.map(item => item.values.id)).toEqual(['g1', 'p1', 'a1']);
    expect(result.metaByRowKey.get('g1')).toMatchObject({ expanded: false, hasChildren: true });
    expect(getTreeRowPath(result.metaBySourceIndex, 2)).toEqual(['g1', 'p1', 'a1']);
  });

  it('sorts only within sibling groups', () => {
    const siblingData = [
      { values: { id: 'root-a', parentId: null } },
      { values: { id: 'a-1', parentId: 'root-a' } },
      { values: { id: 'a-2', parentId: 'root-a' } },
      { values: { id: 'root-b', parentId: null } },
      { values: { id: 'b-1', parentId: 'root-b' } },
    ];
    const result = projectTreeData({
      data: siblingData,
      rowKey: 'id',
      parentRowKey: 'parentId',
      expandedRowKeys: ['root-a', 'root-b'],
      orderedSourceIndexes: [3, 4, 2, 1, 0],
    });

    expect(result.sourceIndexByVisibleIndex).toEqual([3, 4, 0, 2, 1]);
  });

  it.each([
    [[{ values: { id: 'same', parentId: null } }, { values: { id: 'same', parentId: null } }], 'duplicateRowKey'],
    [[{ values: { id: null, parentId: null } }], 'missingRowKey'],
  ])('falls back safely for invalid identities', (invalidData, diagnostic) => {
    const result = projectTreeData({
      data: invalidData,
      rowKey: 'id',
      parentRowKey: 'parentId',
      expandedRowKeys: [],
    });

    expect(result.valid).toBe(false);
    expect(result.diagnostics).toContain(diagnostic);
    expect(result.data).toBe(invalidData);
  });

  it('handles a deeply nested tree without recursive traversal', () => {
    const deepData = Array.from({ length: 5000 }, (_, index) => ({
      values: { id: index, parentId: index === 0 ? null : index - 1 },
    }));
    const result = projectTreeData({
      data: deepData,
      rowKey: 'id',
      parentRowKey: 'parentId',
      expandedRowKeys: deepData.map(item => item.values.id),
    });

    expect(result.data).toHaveLength(5000);
    expect(result.metaByRowKey.get(4999)?.depth).toBe(4999);
  });

  it('projects a fully expanded 10k-row hierarchy while preserving every source index', () => {
    const largeData: Array<{ values: { id: string; parentId: string | null } }> = [];
    const expandedRowKeys: string[] = [];

    for (let divisionIndex = 0; divisionIndex < 50; divisionIndex++) {
      const divisionId = `division-${divisionIndex}`;
      largeData.push({ values: { id: divisionId, parentId: null } });
      expandedRowKeys.push(divisionId);

      for (let teamIndex = 0; teamIndex < 10; teamIndex++) {
        const teamId = `${divisionId}-team-${teamIndex}`;
        largeData.push({ values: { id: teamId, parentId: divisionId } });
        expandedRowKeys.push(teamId);

        for (let projectIndex = 0; projectIndex < 20; projectIndex++) {
          largeData.push({ values: { id: `${teamId}-project-${projectIndex}`, parentId: teamId } });
        }
      }
    }

    const result = projectTreeData({
      data: largeData,
      rowKey: 'id',
      parentRowKey: 'parentId',
      expandedRowKeys,
    });

    expect(result.valid).toBe(true);
    expect(result.data).toHaveLength(10_550);
    expect(result.sourceIndexByVisibleIndex).toHaveLength(10_550);
    expect(result.sourceIndexByVisibleIndex.at(-1)).toBe(10_549);
    expect(result.metaByRowKey.get('division-49-team-9-project-19')?.depth).toBe(2);
  });
});
