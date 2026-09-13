import { createHash } from 'node:crypto';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { build } from 'esbuild';

const repositoryRoot = resolve(import.meta.dirname, '..');
const options = Object.fromEntries(
  process.argv.slice(2).map(argument => {
    const [key, ...value] = argument.replace(/^--/, '').split('=');
    return [key, value.length ? value.join('=') : true];
  }),
);
const baselineTag = String(options.baseline ?? 'v1.0.10');
const baselinePort = Number(options['baseline-port'] ?? 4174);
const currentPort = Number(options['current-port'] ?? 4173);
const temporaryRoot = mkdtempSync(join(tmpdir(), 'beautiful-grid-version-performance-'));
const baselineWorktree = join(temporaryRoot, 'baseline-source');
let worktreeAttached = false;

function run(command, args, capture = false) {
  const result = spawnSync(command, args, {
    cwd: repositoryRoot,
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
  });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed${result.stderr ? `: ${result.stderr.trim()}` : ''}`);
  }
  return capture ? result.stdout.trim() : '';
}

function git(...args) {
  return run('git', args, true);
}

function libraryFingerprint() {
  const diff = git('diff', '--binary', 'HEAD', '--', 'beautiful-grid');
  const untracked = git('ls-files', '--others', '--exclude-standard', '--', 'beautiful-grid');
  const digest = createHash('sha256').update(diff).update('\n').update(untracked);
  for (const file of untracked.split('\n').filter(Boolean)) {
    digest.update('\n').update(file).update('\n').update(readFileSync(join(repositoryRoot, file)));
  }
  return digest.digest('hex').slice(0, 12);
}

const fixtureSource = String.raw`
import React from 'react';
import { createRoot } from 'react-dom/client';
import { BGrid } from '@benchmark-grid';
import '@benchmark-style';

const params = new URLSearchParams(window.location.search);
const rowCount = Number(params.get('rows') || 10000);
const columnCount = Number(params.get('columns') || 20);
const frozenColumnIndex = Number(params.get('frozen') || 0);
const scenario = params.get('scenario') || 'fixed-10k';
const dataStartedAt = performance.now();
const data = new Array(rowCount);
for (let index = 0; index < rowCount; index += 1) {
  data[index] = { values: {
    id: index,
    value0: index,
    value1: 'Row ' + index,
    value2: (index * 17) % 10000,
    value3: 'Group ' + (index % 100),
    value4: index % 2 === 0 ? 'Active' : 'Paused',
    value5: (index * 31) % 100000,
    value6: 'Region ' + (index % 12),
    value7: (index * 13) % 997,
  } };
}
const dataGenerationMs = performance.now() - dataStartedAt;
const columns = Array.from({ length: columnCount }, (_, index) => ({
  id: 'column-' + index,
  key: index === 0 ? 'id' : 'value' + ((index - 1) % 8),
  label: 'Column ' + (index + 1),
  width: index === 0 ? 90 : 120,
}));
const mountStartedAt = performance.now();
createRoot(document.getElementById('root')).render(React.createElement(BGrid, {
  width: 1200,
  height: 620,
  data,
  columns,
  rowKey: 'id',
  frozenColumnIndex,
  showLineNumber: true,
}));

function markReadyWhenRendered() {
  const scroller = document.querySelector('[role="rfdg-scroll-container"]');
  const row = document.querySelector('[role="rfdg-body"] tr, [role="rfdg-body-frozen"] tr');
  if (!scroller || !row) {
    requestAnimationFrame(markReadyWhenRendered);
    return;
  }
  requestAnimationFrame(() => requestAnimationFrame(() => {
    window.__BGRID_BENCH__ = {
      scenario,
      rowCount,
      columnCount,
      frozenColumnIndex,
      dataGenerationMs,
      mountMs: performance.now() - mountStartedAt,
    };
    document.documentElement.dataset.benchmarkReady = 'true';
  }));
}
requestAnimationFrame(markReadyWhenRendered);
`;

const fixtureHtml = '<!doctype html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>BeautifulGrid version performance fixture</title></head><body><main id="root"></main><script type="module" src="/app.js"></script></body></html>';

async function buildFixture(name, libraryRoot) {
  const outputDirectory = join(temporaryRoot, name);
  mkdirSync(outputDirectory, { recursive: true });
  const entryFile = join(outputDirectory, 'entry.tsx');
  writeFileSync(entryFile, fixtureSource);
  writeFileSync(join(outputDirectory, 'index.html'), fixtureHtml);
  await build({
    entryPoints: [entryFile],
    outfile: join(outputDirectory, 'app.js'),
    bundle: true,
    minify: true,
    format: 'esm',
    platform: 'browser',
    target: ['chrome120'],
    jsx: 'automatic',
    nodePaths: [join(repositoryRoot, 'node_modules')],
    define: { 'process.env.NODE_ENV': JSON.stringify('production') },
    plugins: [{
      name: 'version-performance-alias',
      setup(buildContext) {
        buildContext.onResolve({ filter: /^@benchmark-grid$/ }, () => ({ path: join(libraryRoot, 'index.tsx') }));
        buildContext.onResolve({ filter: /^@benchmark-style$/ }, () => ({ path: join(libraryRoot, 'style.css') }));
      },
    }],
  });
  rmSync(entryFile);
  return outputDirectory;
}

function serve(directory, port) {
  const contentTypes = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8' };
  const server = createServer((request, response) => {
    const pathname = new URL(request.url ?? '/', `http://${request.headers.host}`).pathname;
    const requestedPath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
    const filePath = join(directory, requestedPath);
    if (!filePath.startsWith(`${directory}/`) || !existsSync(filePath) || !statSync(filePath).isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }
    response.writeHead(200, {
      'content-type': contentTypes[extname(filePath)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    createReadStream(filePath).pipe(response);
  });
  server.listen(port, '127.0.0.1');
  return server;
}

function detachWorktree() {
  if (!worktreeAttached) return;
  spawnSync('git', ['worktree', 'remove', '--force', baselineWorktree], { cwd: repositoryRoot, stdio: 'ignore' });
  worktreeAttached = false;
}

async function cleanup(servers = []) {
  for (const server of servers) await new Promise(resolveClose => server.close(resolveClose));
  detachWorktree();
  rmSync(temporaryRoot, { recursive: true, force: true });
}

async function main() {
  run('git', ['worktree', 'add', '--detach', baselineWorktree, baselineTag]);
  worktreeAttached = true;
  const baselineDirectory = await buildFixture('baseline', join(baselineWorktree, 'beautiful-grid'));
  detachWorktree();
  const fingerprint = libraryFingerprint();
  const currentDirectory = await buildFixture('current', join(repositoryRoot, 'beautiful-grid'));
  const servers = [serve(baselineDirectory, baselinePort), serve(currentDirectory, currentPort)];
  const metadata = {
    baseline: { label: baselineTag, gitSha: git('rev-list', '-n', '1', baselineTag) },
    current: {
      label: `working tree (${JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8')).version}+unreleased)`,
      gitSha: git('rev-parse', 'HEAD'),
      libraryDiffFingerprint: fingerprint,
    },
    urls: { baseline: `http://127.0.0.1:${baselinePort}`, current: `http://127.0.0.1:${currentPort}` },
  };
  console.log(`VERSION_PERFORMANCE_FIXTURES_READY ${JSON.stringify(metadata)}`);
  const stop = async () => { await cleanup(servers); process.exit(0); };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
}

main().catch(async error => {
  console.error(error);
  await cleanup();
  process.exit(1);
});
