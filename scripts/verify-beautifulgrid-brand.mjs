import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function read(relativePath) {
  return readFileSync(path.join(repositoryRoot, relativePath), 'utf8');
}

function verifyIdentity() {
  const packageJson = JSON.parse(read('package.json'));
  const sourceIndex = read('beautiful-grid/index.tsx');
  const sourceEntry = read('beautiful-grid/BGrid.tsx');
  const sourceTypes = read('beautiful-grid/types.ts');
  const style = read('beautiful-grid/style.css');
  const homepage = read('site/src/pages/index.astro');
  const productFacts = read('site/src/data/productFacts.ts');

  assert(packageJson.name === 'beautiful-grid', 'package name must be beautiful-grid');
  assert(packageJson.version === '1.0.0-rc.1', 'initial version must be 1.0.0-rc.1');
  assert(packageJson.license === 'Apache-2.0', 'package license must be Apache-2.0');
  assert(packageJson.homepage === 'https://bgrid.axisj.com', 'homepage must use bgrid.axisj.com');
  assert(sourceIndex.includes("export * from './BGrid'"), 'library index must export BGrid');
  assert(sourceEntry.includes('export function BGrid<'), 'component entry must define BGrid');
  assert(sourceEntry.includes('BGridProps<T>'), 'component entry must use BGridProps');
  assert(sourceTypes.includes('export interface BGridColumn<'), 'public types must expose BGridColumn');
  assert(style.includes('.bgrid-root'), 'library CSS must expose bgrid-* classes');
  assert(style.includes('--bgrid-primary-color'), 'library CSS must expose --bgrid-* variables');
  assert(homepage.includes('아름답게, 강력하게.'), 'homepage must contain the approved Korean headline');
  assert(homepage.includes('Beautiful. Powerful.'), 'homepage must contain the approved English headline');
  assert(productFacts.includes("licenseName: 'Apache-2.0'"), 'site facts must publish Apache-2.0');
  console.log('BeautifulGrid identity verification passed');
}

const excludedDirectories = new Set(['.git', 'node_modules', 'dist', '.demo-dist', 'coverage', 'playwright-report']);
const excludedFiles = new Set([
  'package-lock.json',
  'GATES.md',
  'verify-beautifulgrid-brand.mjs',
  'verify-package-output.mjs',
]);
const forbiddenPatterns = [
  /AXDataGrid/,
  /AXDG/,
  /axdg/,
  /@axboot(?:\/|-)datagrid/i,
  /AXBOOT DataGrid/i,
  /AXBoot DataGrid/,
  /ax-datagrid/,
  /datagrid\.axboot\.dev/,
  /AXBoot Datagrid Commercial License/,
];

function detectLegacyIdentity(text) {
  return forbiddenPatterns.filter(pattern => pattern.test(text)).map(pattern => pattern.source);
}

function collectTextFiles(directory, results = []) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectTextFiles(absolutePath, results);
      continue;
    }
    if (entry.isFile() && !excludedFiles.has(entry.name)) results.push(absolutePath);
  }
  return results;
}

function verifyLegacyNames() {
  const positiveControl = 'AXDataGrid AXDG axdg @axboot/datagrid AXBOOT DataGrid ax-datagrid datagrid.axboot.dev';
  assert(detectLegacyIdentity(positiveControl).length >= 7, 'legacy detector positive control failed');

  const findings = [];
  for (const absolutePath of collectTextFiles(repositoryRoot)) {
    const buffer = readFileSync(absolutePath);
    if (buffer.includes(0)) continue;
    const matches = detectLegacyIdentity(buffer.toString('utf8'));
    if (matches.length) findings.push(path.relative(repositoryRoot, absolutePath) + ': ' + matches.join(', '));
  }
  assert(findings.length === 0, 'legacy BeautifulGrid identity remains:\n' + findings.join('\n'));
  console.log('BeautifulGrid legacy-name verification passed');
}

const mode = process.argv[2];
if (mode === 'identity') verifyIdentity();
else if (mode === 'legacy') verifyLegacyNames();
else throw new Error('Usage: node scripts/verify-beautifulgrid-brand.mjs <identity|legacy>');
