import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

function run(command, args, options = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: 'pipe',
    encoding: 'utf8',
    ...options,
  });

  if (result.status !== 0) {
    const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
    throw new Error(`Command failed: ${command} ${args.join(' ')}\n${output}`);
  }

  return (result.stdout || '').trim();
}

function writeProjectFile(projectDir, relativePath, content) {
  const fullPath = path.join(projectDir, relativePath);
  mkdirSync(path.dirname(fullPath), { recursive: true });
  writeFileSync(fullPath, content);
}

function installAndRun({ name, projectDir, installPackages, runCommand, runArgs }) {
  console.log(`\n[${name}] installing packages...`);
  run('npm', ['install', '--no-audit', '--no-fund', '--prefix', projectDir, ...installPackages]);

  console.log(`[${name}] running check...`);
  run(runCommand, runArgs, { cwd: projectDir });
  console.log(`[${name}] OK`);
}

function verifyEsmBundleSplit(projectDir) {
  const metafile = JSON.parse(readFileSync(path.join(projectDir, 'dist/meta.json'), 'utf8'));
  const outputs = metafile.outputs;
  const entryOutput = Object.entries(outputs).find(([, value]) => value.entryPoint === 'index.mjs')?.[0];
  if (!entryOutput) throw new Error('Failed to find the installed-package ESM entry output.');

  const initialOutputs = new Set();
  const visitStaticOutput = outputPath => {
    if (initialOutputs.has(outputPath)) return;
    initialOutputs.add(outputPath);
    for (const imported of outputs[outputPath]?.imports ?? []) {
      if (!imported.external && imported.kind === 'import-statement' && outputs[imported.path]) {
        visitStaticOutput(imported.path);
      }
    }
  };
  visitStaticOutput(entryOutput);

  const lazyFeatures = [
    {
      name: 'SortableJS',
      matches: inputPath => inputPath.includes('node_modules/sortablejs/'),
    },
    {
      name: 'column toolbox',
      matches: inputPath => inputPath.endsWith('/components/toolbox/TableHeadToolbox.js'),
    },
    {
      name: 'search and context menu surfaces',
      matches: inputPath => inputPath.endsWith('/components/GridOptionalSurfaces.js'),
    },
  ];

  for (const feature of lazyFeatures) {
    const featureOutput = Object.entries(outputs).find(([, value]) =>
      Object.keys(value.inputs ?? {}).some(feature.matches),
    )?.[0];
    if (!featureOutput) throw new Error(`Installed-package ESM bundle is missing the ${feature.name} lazy chunk.`);
    if (initialOutputs.has(featureOutput)) {
      throw new Error(`${feature.name} leaked into the installed-package initial ESM bundle.`);
    }
  }

  console.log('[esm] installed package keeps optional feature runtimes in lazy chunks');
}

function main() {
  console.log('Building publishable library...');
  run('npm', ['run', 'build:library']);

  console.log('Packing dist package...');
  const packOutput = run('npm', ['pack', './dist', '--json']);
  const packInfo = JSON.parse(packOutput);
  const tarballName = packInfo?.[0]?.filename;
  if (!tarballName) {
    throw new Error(`Failed to parse npm pack output: ${packOutput}`);
  }

  const tarballPath = path.join(repoRoot, tarballName);
  const tmpBase = mkdtempSync(path.join(tmpdir(), 'beautiful-grid-consumers-'));

  try {
    const cjsDir = path.join(tmpBase, 'cjs');
    mkdirSync(cjsDir, { recursive: true });
    writeProjectFile(
      cjsDir,
      'package.json',
      JSON.stringify(
        {
          name: 'beautiful-grid-consumer-cjs',
          private: true,
        },
        null,
        2,
      ),
    );
    writeProjectFile(
      cjsDir,
      'index.cjs',
      "const pkg = require('beautiful-grid');\nconst editors = require('beautiful-grid/editors');\nif (typeof pkg.BGrid !== 'function') throw new Error('BGrid export is missing');\nif (typeof editors.defineEditorPlugin !== 'function') throw new Error('editor subpath export is missing');\nconst loadedFiles = Object.keys(require.cache);\nif (loadedFiles.some(file => file.includes('/sortablejs/') || file.includes('\\\\sortablejs\\\\'))) throw new Error('SortableJS loaded during the initial CJS import');\nif (loadedFiles.some(file => file.endsWith('/components/toolbox/TableHeadToolbox.js') || file.endsWith('\\\\components\\\\toolbox\\\\TableHeadToolbox.js'))) throw new Error('Column toolbox loaded during the initial CJS import');\nif (loadedFiles.some(file => file.endsWith('/components/GridOptionalSurfaces.js') || file.endsWith('\\\\components\\\\GridOptionalSurfaces.js'))) throw new Error('Search and context menu surfaces loaded during the initial CJS import');\nrequire.resolve('beautiful-grid/style.css');\nconsole.log('cjs import check passed without loading optional runtimes');\n",
    );

    installAndRun({
      name: 'cjs',
      projectDir: cjsDir,
      installPackages: [tarballPath, 'react@19.2', 'react-dom@19.2'],
      runCommand: 'node',
      runArgs: ['index.cjs'],
    });

    const esmDir = path.join(tmpBase, 'esm');
    mkdirSync(esmDir, { recursive: true });
    writeProjectFile(
      esmDir,
      'package.json',
      JSON.stringify(
        {
          name: 'beautiful-grid-consumer-esm',
          private: true,
          type: 'module',
        },
        null,
        2,
      ),
    );
    writeProjectFile(
      esmDir,
      'index.mjs',
      "import { BGrid } from 'beautiful-grid';\nimport { createSelectEditorPlugin } from 'beautiful-grid/editors';\nimport 'beautiful-grid/style.css';\nif (typeof BGrid !== 'function') throw new Error('BGrid export is missing');\nif (typeof createSelectEditorPlugin !== 'function') throw new Error('editor subpath export is missing');\nconsole.log('esm import check passed');\n",
    );

    installAndRun({
      name: 'esm',
      projectDir: esmDir,
      installPackages: [tarballPath, 'react@19.2', 'react-dom@19.2', 'esbuild'],
      runCommand: 'npx',
      runArgs: [
        'esbuild',
        'index.mjs',
        '--bundle',
        '--platform=browser',
        '--format=esm',
        '--splitting',
        '--outdir=dist',
        '--metafile=dist/meta.json',
      ],
    });
    verifyEsmBundleSplit(esmDir);

    const typesDir = path.join(tmpBase, 'types');
    mkdirSync(typesDir, { recursive: true });
    writeProjectFile(
      typesDir,
      'package.json',
      JSON.stringify(
        {
          name: 'beautiful-grid-consumer-types',
          private: true,
        },
        null,
        2,
      ),
    );
    writeProjectFile(
      typesDir,
      'tsconfig.json',
      JSON.stringify(
        {
          compilerOptions: {
            target: 'ES2019',
            module: 'ESNext',
            moduleResolution: 'Bundler',
            strict: true,
            skipLibCheck: true,
            noEmit: true,
            esModuleInterop: true,
          },
          include: ['src/**/*'],
        },
        null,
        2,
      ),
    );
    writeProjectFile(
      typesDir,
      'src/index.ts',
      "import type { BGridColumn, BGridColumnGroupNode, BGridContextMenuItem, BGridDataItem, BGridEditorPluginProps, BGridProps, BGridSearchOptions } from 'beautiful-grid';\nimport { createSelectEditorPlugin } from 'beautiful-grid/editors';\n\ninterface Row {\n  id: string;\n  name: string;\n  status: 'ready' | 'done';\n  meta: { score: number };\n}\n\nconst statusEditor = createSelectEditorPlugin<Row, Row['status']>({\n  id: 'status',\n  options: [{ value: 'ready', label: 'Ready' }, { value: 'done', label: 'Done' }],\n});\n\nconst columns: BGridColumn<Row>[] = [\n  { id: 'id', key: 'id', label: 'ID', width: 120 },\n  { id: 'name', key: 'name', label: 'Name', width: 160, editable: true, editor: { type: 'text' }, getSearchText: ({ value }) => String(value) },\n  {\n    id: 'status',\n    key: 'status',\n    label: 'Status',\n    width: 120,\n    editable: true,\n    editTrigger: 'click',\n    editor: statusEditor,\n    editorIcon: { render: '⌄', ariaLabel: 'Select status' },\n    onChangeValue: ({ changes, commit }) => commit(changes),\n  },\n  { id: 'score', key: ['meta', 'score'], label: 'Score', width: 120, searchable: false },\n];\n\nfunction commitFromPlugin(props: BGridEditorPluginProps<Row>) {\n  void props.commit([{ key: 'status', value: 'done' }]);\n  // @ts-expect-error plugin commit requires a change array, not a single cell value\n  void props.commit('done');\n}\n\nconst columnGroups: BGridColumnGroupNode[] = [{\n  id: 'identity',\n  label: 'Identity',\n  children: ['id', { id: 'details', label: 'Details', children: ['name', 'status', 'score'] }],\n}];\n\nconst data: BGridDataItem<Row>[] = [{ values: { id: '1', name: 'Tom', status: 'ready', meta: { score: 10 } } }];\nconst searchOptions: BGridSearchOptions<Row> = { defaultQuery: 'Tom', onQueryChange: query => void query };\nconst contextItems: BGridContextMenuItem<Row>[] = [{ id: 'inspect', label: 'Inspect', onSelect: target => void target.sourceIndex }];\n\nconst props: BGridProps<Row> = {\n  width: 640,\n  height: 320,\n  columns,\n  columnGroups,\n  data,\n  rowKey: 'id',\n  searchOptions,\n  contextMenuOptions: { items: () => contextItems },\n};\n\nvoid props;\nvoid commitFromPlugin;\n",
    );

    installAndRun({
      name: 'types',
      projectDir: typesDir,
      installPackages: [
        tarballPath,
        'react@19.2',
        'react-dom@19.2',
        'typescript',
        '@types/react@19.2',
        '@types/react-dom@19.2',
      ],
      runCommand: 'npx',
      runArgs: ['tsc', '--project', 'tsconfig.json', '--noEmit'],
    });

    console.log('\nAll consumer checks passed (cjs, esm, types).');
    console.log(`Temporary test workspace: ${tmpBase}`);
  } finally {
    rmSync(tarballPath, { force: true });
    if (process.env.KEEP_LIBRARY_CONSUMER_TMP !== '1') {
      rmSync(tmpBase, { recursive: true, force: true });
    }
  }
}

main();
