import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import ts from 'typescript';

const typesPath = [
  resolve(process.cwd(), 'beautiful-grid/types.ts'),
  resolve(process.cwd(), '../beautiful-grid/types.ts'),
].find(existsSync);

if (!typesPath) {
  throw new Error('beautiful-grid/types.ts was not found from the repository or site root');
}

const sourceText = readFileSync(typesPath, 'utf8');
const sourceFile = ts.createSourceFile(typesPath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
const propsInterface = sourceFile.statements.find(
  (statement): statement is ts.InterfaceDeclaration =>
    ts.isInterfaceDeclaration(statement) && statement.name.text === 'BGridProps',
);

if (!propsInterface) {
  throw new Error('BGridProps interface was not found in beautiful-grid/types.ts');
}

const propMembers = propsInterface.members.filter(ts.isPropertySignature);
const deprecatedPropCount = propMembers.filter((member) =>
  ts.getJSDocTags(member).some((tag) => tag.tagName.text === 'deprecated'),
).length;

export const publicApiMetrics = Object.freeze({
  totalGridPropCount: propMembers.length,
  deprecatedGridPropCount: deprecatedPropCount,
  currentGridPropCount: propMembers.length - deprecatedPropCount,
});
