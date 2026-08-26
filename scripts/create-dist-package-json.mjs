import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

const rootPackagePath = path.join(rootDir, 'package.json');
const rootPackage = JSON.parse(await readFile(rootPackagePath, 'utf8'));

const normalizeDistPath = value => {
  if (typeof value !== 'string') return value;

  if (value.startsWith('./dist/')) {
    return `./${value.slice('./dist/'.length)}`;
  }

  if (value.startsWith('dist/')) {
    return `./${value.slice('dist/'.length)}`;
  }

  return value;
};

const normalizeExports = value => {
  if (typeof value === 'string') {
    return normalizeDistPath(value);
  }

  if (Array.isArray(value)) {
    return value.map(normalizeExports);
  }

  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, inner]) => [key, normalizeExports(inner)]));
  }

  return value;
};

const distPackage = {
  name: rootPackage.name,
  version: rootPackage.version,
  description: rootPackage.description,
  homepage: rootPackage.homepage,
  bugs: rootPackage.bugs,
  keywords: rootPackage.keywords,
  author: rootPackage.author,
  license: rootPackage.license,
  repository: rootPackage.repository,
  sideEffects: rootPackage.sideEffects,
  main: normalizeDistPath(rootPackage.main),
  module: normalizeDistPath(rootPackage.module),
  types: normalizeDistPath(rootPackage.types),
  exports: normalizeExports(rootPackage.exports),
  dependencies: rootPackage.dependencies,
  peerDependencies: rootPackage.peerDependencies,
  publishConfig: rootPackage.publishConfig,
};

const filteredDistPackage = Object.fromEntries(
  Object.entries(distPackage).filter(([, value]) => value !== undefined),
);

await mkdir(distDir, { recursive: true });
await writeFile(path.join(distDir, 'package.json'), `${JSON.stringify(filteredDistPackage, null, 2)}\n`, 'utf8');
await copyFile(path.join(rootDir, 'README.md'), path.join(distDir, 'README.md'));
await copyFile(path.join(rootDir, 'LICENSE'), path.join(distDir, 'LICENSE'));
await copyFile(path.join(rootDir, 'NOTICE'), path.join(distDir, 'NOTICE'));
await copyFile(path.join(rootDir, 'TRADEMARK.md'), path.join(distDir, 'TRADEMARK.md'));
