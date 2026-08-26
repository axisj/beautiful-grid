import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const siteSourceRoot = path.join(repositoryRoot, 'site/src');
const supportedExtensions = new Set(['.astro', '.css', '.js', '.jsx', '.md', '.mdx', '.ts', '.tsx']);
const minimumFontSizePx = 13;

async function collectFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const resolvedPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await collectFiles(resolvedPath));
    if (entry.isFile() && supportedExtensions.has(path.extname(entry.name))) files.push(resolvedPath);
  }

  return files;
}

function lineNumberAt(source, index) {
  return source.slice(0, index).split('\n').length;
}

function toPixels(value, unit) {
  const numericValue = Number(value);
  if (unit === 'rem') return numericValue * 16;
  if (unit === 'em') return numericValue * minimumFontSizePx;
  return numericValue;
}

function findViolations(source, filePath) {
  const violations = [];
  const patterns = [
    { kind: 'CSS font-size', expression: /font-size[^:]*:\s*[^;}\n]*?([0-9]*\.?[0-9]+)(px|rem|em)\b/gi },
    { kind: 'JS fontSize', expression: /fontSize\s*:\s*['"]([0-9]*\.?[0-9]+)(px|rem|em)['"]/g },
    { kind: 'Tailwind arbitrary text', expression: /\btext-\[([0-9]*\.?[0-9]+)px\]/g },
  ];

  for (const { kind, expression } of patterns) {
    for (const match of source.matchAll(expression)) {
      const unit = kind === 'Tailwind arbitrary text' ? 'px' : match[2];
      const pixels = toPixels(match[1], unit);
      if (pixels > 0 && pixels < minimumFontSizePx) {
        violations.push({ filePath, kind, line: lineNumberAt(source, match.index), pixels, source: match[0] });
      }
    }
  }

  for (const match of source.matchAll(/\btext-xs\b/g)) {
    violations.push({ filePath, kind: 'Tailwind text-xs', line: lineNumberAt(source, match.index), pixels: 12, source: match[0] });
  }

  return violations;
}

const positiveControl = findViolations('.fixture { font-size: 12px; }', 'positive-control.css');
if (positiveControl.length !== 1 || positiveControl[0].pixels !== 12) {
  throw new Error('Font-size verifier positive control failed.');
}

const files = await collectFiles(siteSourceRoot);
const violations = [];

for (const filePath of files) {
  const source = await readFile(filePath, 'utf8');
  const relativePath = path.relative(repositoryRoot, filePath);
  violations.push(...findViolations(source, relativePath));
}

if (violations.length > 0) {
  const details = violations
    .sort((left, right) => left.filePath.localeCompare(right.filePath) || left.line - right.line)
    .map(violation => `${violation.filePath}:${violation.line} ${violation.source} (${violation.pixels}px)`)
    .join('\n');
  throw new Error(`Found ${violations.length} site font-size declarations below ${minimumFontSizePx}px:\n${details}`);
}

console.log(`Site font-size verification passed (${files.length} source files, minimum ${minimumFontSizePx}px).`);
