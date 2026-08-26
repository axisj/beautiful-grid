import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { build } from 'esbuild';

const repositoryRoot = path.resolve(import.meta.dirname, '..');
const generatedMetricsPath = path.join(repositoryRoot, 'site/src/data/bundleMetrics.ts');
const virtualOutputDirectory = path.join(repositoryRoot, '.bundle-metric-output');
const initialBundleBudgetGzipKiB = 70;

const normalizePath = value => value.replaceAll(path.sep, '/').replace(/^\.\//, '');
const toKiB = bytes => Number((bytes / 1024).toFixed(1));
const gzipSize = contents => gzipSync(contents, { level: 9 }).byteLength;

function outputFileMap(outputFiles) {
  return new Map(
    outputFiles.map(file => [normalizePath(path.relative(repositoryRoot, file.path)), file.contents]),
  );
}

function collectStaticOutputs(outputs, entryOutputPath) {
  const collected = new Set();

  const visit = outputPath => {
    if (collected.has(outputPath)) return;
    collected.add(outputPath);

    for (const imported of outputs[outputPath]?.imports ?? []) {
      if (imported.external || imported.kind !== 'import-statement') continue;
      if (outputs[imported.path]) visit(imported.path);
    }
  };

  visit(entryOutputPath);
  return collected;
}

function collectLazyFeatureOutputs(outputs, entryPointSuffix, initialOutputs, featureName) {
  const entryOutputPath = Object.entries(outputs).find(([, value]) =>
    value.entryPoint?.endsWith(entryPointSuffix),
  )?.[0];
  if (!entryOutputPath || initialOutputs.has(entryOutputPath)) {
    throw new Error(`${featureName} is not isolated in a lazy ESM chunk.`);
  }

  const featureOutputs = collectStaticOutputs(outputs, entryOutputPath);
  initialOutputs.forEach(outputPath => featureOutputs.delete(outputPath));
  return featureOutputs;
}

function gzipOutputs(files, outputPaths) {
  return Array.from(outputPaths).reduce((total, outputPath) => {
    const contents = files.get(outputPath);
    if (!contents) throw new Error(`Missing JavaScript output: ${outputPath}`);
    return total + gzipSize(contents);
  }, 0);
}

async function measureBundle() {
  const javascriptBuild = await build({
    absWorkingDir: repositoryRoot,
    stdin: {
      contents: "export { BGrid } from './dist/esm/index.js';\n",
      resolveDir: repositoryRoot,
      sourcefile: 'bundle-size-consumer.js',
    },
    bundle: true,
    chunkNames: 'chunks/[name]-[hash]',
    define: { 'process.env.NODE_ENV': '"production"' },
    entryNames: 'index',
    external: ['react', 'react-dom'],
    format: 'esm',
    metafile: true,
    minify: true,
    outdir: virtualOutputDirectory,
    platform: 'browser',
    splitting: true,
    target: 'es2020',
    write: false,
  });

  const outputs = Object.fromEntries(
    Object.entries(javascriptBuild.metafile.outputs).map(([outputPath, value]) => [normalizePath(outputPath), value]),
  );
  const files = outputFileMap(javascriptBuild.outputFiles);
  const entryOutputPath = Object.entries(outputs).find(([, value]) => value.entryPoint === 'bundle-size-consumer.js')?.[0];
  if (!entryOutputPath) throw new Error('Unable to locate the measured ESM entry output.');

  const initialOutputs = collectStaticOutputs(outputs, entryOutputPath);
  const initialInputs = Array.from(initialOutputs).flatMap(outputPath => Object.keys(outputs[outputPath]?.inputs ?? {}));
  if (initialInputs.some(inputPath => inputPath.includes('node_modules/sortablejs/'))) {
    throw new Error('SortableJS leaked into the initial BGrid bundle.');
  }

  const columnReorderOutputs = collectLazyFeatureOutputs(
    outputs,
    'dist/esm/components/columnSortableRuntime.js',
    initialOutputs,
    'Column reordering',
  );
  const toolboxOutputs = collectLazyFeatureOutputs(
    outputs,
    'dist/esm/components/toolbox/TableHeadToolbox.js',
    initialOutputs,
    'Column toolbox',
  );
  const gridOptionalSurfacesOutputs = collectLazyFeatureOutputs(
    outputs,
    'dist/esm/components/GridOptionalSurfaces.js',
    initialOutputs,
    'Grid search and context menu',
  );

  const initialJavascriptGzipBytes = gzipOutputs(files, initialOutputs);
  const columnReorderJavascriptGzipBytes = gzipOutputs(files, columnReorderOutputs);
  const toolboxJavascriptGzipBytes = gzipOutputs(files, toolboxOutputs);
  const gridOptionalSurfacesJavascriptGzipBytes = gzipOutputs(files, gridOptionalSurfacesOutputs);

  const stylesheetBuild = await build({
    absWorkingDir: repositoryRoot,
    bundle: true,
    entryPoints: ['dist/style.css'],
    minify: true,
    outfile: path.join(virtualOutputDirectory, 'style.css'),
    write: false,
  });
  const stylesheetGzipBytes = gzipSize(stylesheetBuild.outputFiles[0].contents);

  const initialJsGzipKiB = toKiB(initialJavascriptGzipBytes);
  const cssGzipKiB = toKiB(stylesheetGzipBytes);
  const columnReorderJsGzipKiB = toKiB(columnReorderJavascriptGzipBytes);
  const toolboxJsGzipKiB = toKiB(toolboxJavascriptGzipBytes);
  const gridOptionalSurfacesJsGzipKiB = toKiB(gridOptionalSurfacesJavascriptGzipBytes);
  const initialTotalGzipKiB = toKiB(initialJavascriptGzipBytes + stylesheetGzipBytes);
  const allFeatureOutputs = new Set([
    ...initialOutputs,
    ...columnReorderOutputs,
    ...toolboxOutputs,
    ...gridOptionalSurfacesOutputs,
  ]);
  const fullFeatureTotalGzipKiB = toKiB(
    gzipOutputs(files, allFeatureOutputs) + stylesheetGzipBytes,
  );

  if (initialTotalGzipKiB > initialBundleBudgetGzipKiB) {
    throw new Error(
      `Initial bundle ${initialTotalGzipKiB} KiB exceeds the ${initialBundleBudgetGzipKiB} KiB budget.`,
    );
  }

  return {
    initialTotalGzipKiB,
    initialJsGzipKiB,
    cssGzipKiB,
    columnReorderJsGzipKiB,
    toolboxJsGzipKiB,
    gridOptionalSurfacesJsGzipKiB,
    fullFeatureTotalGzipKiB,
    initialBundleBudgetGzipKiB,
    measurement: {
      format: 'ESM',
      target: 'ES2020',
      compression: 'gzip level 9',
      excludesPeerDependencies: ['react', 'react-dom'],
    },
  };
}

function serializeMetrics(metrics) {
  return `// Generated by scripts/measure-library-bundle.mjs. Do not edit manually.\nexport const bundleMetrics = ${JSON.stringify(
    metrics,
    null,
    2,
  )} as const;\n`;
}

async function main() {
  const argumentsSet = new Set(process.argv.slice(2));
  if (argumentsSet.has('--write') && argumentsSet.has('--check')) {
    throw new Error('Use either --write or --check, not both.');
  }

  const metrics = await measureBundle();
  const generatedSource = serializeMetrics(metrics);

  if (argumentsSet.has('--write')) {
    await writeFile(generatedMetricsPath, generatedSource, 'utf8');
  } else if (argumentsSet.has('--check')) {
    const currentSource = await readFile(generatedMetricsPath, 'utf8');
    if (currentSource !== generatedSource) {
      throw new Error('Bundle metrics are stale. Run npm run update:library:bundle-metrics.');
    }
  }

  console.log(`Initial JS: ${metrics.initialJsGzipKiB} KiB gzip`);
  console.log(`CSS: ${metrics.cssGzipKiB} KiB gzip`);
  console.log(`Initial total: ${metrics.initialTotalGzipKiB} KiB gzip`);
  console.log(`Lazy column reordering: ${metrics.columnReorderJsGzipKiB} KiB gzip`);
  console.log(`Lazy column toolbox: ${metrics.toolboxJsGzipKiB} KiB gzip`);
  console.log(`Lazy search and context menu: ${metrics.gridOptionalSurfacesJsGzipKiB} KiB gzip`);
  console.log(`Full load with optional features: ${metrics.fullFeatureTotalGzipKiB} KiB gzip`);
}

await main();
