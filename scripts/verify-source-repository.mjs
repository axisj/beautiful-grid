import { spawnSync } from 'node:child_process';

const sourceRepository = '/Users/tom/Development/axisj/axboot/axboot-datagrid';
const expectedHead = 'ccde7a60176bb14073560b5cfd7b6960573129f9';
const expectedTree = '6334efa85bf3628c7d98a6f9471d6b4ed999b1e6';

function git(...args) {
  const result = spawnSync('git', args, { cwd: sourceRepository, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stderr || 'git command failed');
  return result.stdout.trim();
}

if (git('rev-parse', 'HEAD') !== expectedHead) throw new Error('source repository HEAD changed');
if (git('rev-parse', 'HEAD^{tree}') !== expectedTree) throw new Error('source repository tree changed');
if (git('status', '--porcelain=v1', '--untracked-files=all') !== '') throw new Error('source repository working tree changed');

console.log('BeautifulGrid source-repository verification passed');
