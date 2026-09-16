import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const typesPath = path.join(repositoryRoot, 'beautiful-grid/types.ts');
const readmePath = path.join(repositoryRoot, 'README.md');

const sourceFile = ts.createSourceFile(
  typesPath,
  readFileSync(typesPath, 'utf8'),
  ts.ScriptTarget.Latest,
  true,
);

const propsInTypes = new Set();
// Deprecated props that are superseded by modern equivalents in docs
const ignoredProps = new Set(['footerHeight', 'columnsGroup', 'ref']);

ts.forEachChild(sourceFile, node => {
  if (ts.isInterfaceDeclaration(node) && node.name.text === 'BGridProps') {
    node.members.forEach(member => {
      if (ts.isPropertySignature(member) && member.name) {
        propsInTypes.add(member.name.getText(sourceFile));
      }
    });
  }
});

const readmeContent = readFileSync(readmePath, 'utf8');
const documentedProps = new Set();
const propTableRegex = /\|\s*`([a-zA-Z0-9_-]+)`\s*\|/g;
let match;
while ((match = propTableRegex.exec(readmeContent)) !== null) {
  documentedProps.add(match[1]);
}

const missing = [];
for (const prop of propsInTypes) {
  if (ignoredProps.has(prop)) continue;
  if (!documentedProps.has(prop)) {
    missing.push(prop);
  }
}

if (missing.length > 0) {
  console.error('README props synchronization check FAILED:');
  console.error('The following props from BGridProps are missing in README.md Props Reference:');
  missing.forEach(p => console.error(`  - ${p}`));
  process.exit(1);
}

console.log(`README props synchronization check passed (${propsInTypes.size} props checked)`);
