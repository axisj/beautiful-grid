import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = relativePath => readFileSync(path.join(repositoryRoot, relativePath), 'utf8');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

const license = read('LICENSE');
const notice = read('NOTICE');
const trademark = read('TRADEMARK.md');
const readme = read('README.md');
const packageJson = JSON.parse(read('package.json'));

assert(license.includes('Apache License') && license.includes('Version 2.0, January 2004'), 'official Apache-2.0 text is missing');
assert(packageJson.license === 'Apache-2.0', 'package SPDX license is not Apache-2.0');
assert(notice.includes('Copyright 2022-2026 AXISJ and BeautifulGrid contributors'), 'NOTICE copyright is missing');
assert(notice.includes('Noel Kim'), 'original external contribution notice is missing');
assert(trademark.includes('does not grant permission to use AXISJ trademarks'), 'trademark separation is missing');
assert(trademark.includes('Forks should use a clearly different product name'), 'fork naming guidance is missing');
assert(readme.includes('Apache License 2.0'), 'README license disclosure is missing');

for (const legalFile of ['LICENSE', 'NOTICE', 'TRADEMARK.md']) {
  assert(read('dist/' + legalFile) === read(legalFile), 'dist/' + legalFile + ' does not match the repository file');
}
console.log('BeautifulGrid legal verification passed');
