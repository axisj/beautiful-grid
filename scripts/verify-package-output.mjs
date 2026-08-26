import { readFileSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const distPackage = JSON.parse(readFileSync(path.join(repositoryRoot, 'dist/package.json'), 'utf8'));

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

assert(distPackage.name === 'beautiful-grid', 'dist package name is incorrect');
assert(distPackage.version === '1.0.0-rc.1', 'dist package version is incorrect');
assert(distPackage.license === 'Apache-2.0', 'dist package license is incorrect');
assert(distPackage.homepage === 'https://bgrid.axisj.com', 'dist homepage is incorrect');
assert(distPackage.exports['.'].types === './types/index.d.ts', 'root type export is incorrect');
assert(distPackage.exports['./editors'], 'editor subpath export is missing');
assert(distPackage.exports['./style.css'] === './style.css', 'style export is incorrect');

const result = spawnSync('npm', ['pack', '--dry-run', '--json', './dist'], {
  cwd: repositoryRoot,
  encoding: 'utf8',
  env: {
    ...process.env,
    NPM_CONFIG_CACHE: path.join(os.tmpdir(), 'beautiful-grid-npm-cache'),
  },
});
assert(result.status === 0, 'npm pack dry-run failed:\n' + result.stderr);
const report = JSON.parse(result.stdout)[0];
const files = new Set(report.files.map(file => file.path));
for (const required of [
  'package.json',
  'README.md',
  'LICENSE',
  'NOTICE',
  'TRADEMARK.md',
  'style.css',
  'cjs/index.js',
  'esm/index.js',
  'types/index.d.ts',
  'types/BGrid.d.ts',
]) {
  assert(files.has(required), 'packed package is missing ' + required);
}
assert(!Array.from(files).some(file => file.includes('AXDataGrid') || file.includes('AXDG')), 'packed package contains a legacy filename');
console.log('BeautifulGrid package-output verification passed');
