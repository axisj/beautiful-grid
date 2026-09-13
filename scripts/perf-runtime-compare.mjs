import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { arch, cpus, platform, release, totalmem } from 'node:os';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
import { compareSummaries, reportPassed, summarizeRuns } from './perf-runtime-stats.mjs';

const HELP = `Usage: node scripts/perf-runtime-compare.mjs [options]

Options:
  --baseline=URL              baseline server (default http://127.0.0.1:4174)
  --current=URL               current server (default http://127.0.0.1:4173)
  --runs=N                    measured runs per target and scenario (default 7)
  --warmups=N                 discarded warm-up runs (default 1)
  --cpu=N                     Chromium CPU throttle rate (default 1)
  --scenarios=a,b             virtualScroll,reorder,columnSort by default
  --target=scenario:metric    primary improvement check; repeatable
  --target-improvement=N      required target median improvement percent (default 15)
  --median-regression=N       maximum non-target median regression percent (default 5)
  --p95-regression=N          maximum non-target p95 regression percent (default 10)
  --baseline-sha=SHA          baseline revision recorded in the report
  --current-sha=SHA           current revision recorded in the report
  --output=PATH               save the complete JSON report
  --report-only               emit failed verdicts without a non-zero exit
  --headed                    show Chromium
  --help                      print this help
`;

function parseNumber(value, option, { integer = false, minimum = 0 } = {}) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < minimum || (integer && !Number.isInteger(parsed))) {
    throw new Error(`${option} must be ${integer ? 'an integer' : 'a number'} >= ${minimum}`);
  }
  return parsed;
}

function parseTarget(value) {
  const [scenario, metric, ...rest] = value.split(':');
  if (!scenario || !metric || rest.length > 0) throw new Error(`Invalid --target value: ${value}`);
  return { scenario, metric };
}

function parseArgs(argv) {
  const args = {
    runs: 7,
    warmups: 1,
    headed: false,
    reportOnly: false,
    help: false,
    cpuThrottle: 1,
    baselineUrl: 'http://127.0.0.1:4174',
    currentUrl: 'http://127.0.0.1:4173',
    scenarios: ['virtualScroll', 'reorder', 'columnSort'],
    targetChecks: [],
    targetImprovementPercent: 15,
    medianRegressionPercent: 5,
    p95RegressionPercent: 10,
    baselineSha: 'unspecified',
    currentSha: undefined,
    output: undefined,
  };

  for (const arg of argv) {
    if (arg === '--headed') args.headed = true;
    else if (arg === '--report-only') args.reportOnly = true;
    else if (arg === '--help') args.help = true;
    else if (arg.startsWith('--runs=')) args.runs = parseNumber(arg.slice(7), '--runs', { integer: true, minimum: 1 });
    else if (arg.startsWith('--warmups='))
      args.warmups = parseNumber(arg.slice(10), '--warmups', { integer: true, minimum: 0 });
    else if (arg.startsWith('--cpu=')) args.cpuThrottle = parseNumber(arg.slice(6), '--cpu', { minimum: 1 });
    else if (arg.startsWith('--baseline=')) args.baselineUrl = arg.slice(11);
    else if (arg.startsWith('--current=')) args.currentUrl = arg.slice(10);
    else if (arg.startsWith('--scenarios=')) args.scenarios = arg.slice(12).split(',').filter(Boolean);
    else if (arg.startsWith('--target=')) args.targetChecks.push(parseTarget(arg.slice(9)));
    else if (arg.startsWith('--target-improvement='))
      args.targetImprovementPercent = parseNumber(arg.slice(21), '--target-improvement');
    else if (arg.startsWith('--median-regression='))
      args.medianRegressionPercent = parseNumber(arg.slice(20), '--median-regression');
    else if (arg.startsWith('--p95-regression='))
      args.p95RegressionPercent = parseNumber(arg.slice(17), '--p95-regression');
    else if (arg.startsWith('--baseline-sha=')) args.baselineSha = arg.slice(15);
    else if (arg.startsWith('--current-sha=')) args.currentSha = arg.slice(14);
    else if (arg.startsWith('--output=')) args.output = arg.slice(9);
    else throw new Error(`Unknown option: ${arg}`);
  }

  if (args.scenarios.length === 0) throw new Error('--scenarios must contain at least one scenario');
  if (args.targetChecks.length === 0) args.targetChecks.push({ scenario: 'virtualScroll', metric: 'mountMs' });
  return args;
}

function currentGitSha() {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
  } catch {
    return 'unavailable';
  }
}

async function getMetrics(client) {
  const data = await client.send('Performance.getMetrics');
  const map = Object.fromEntries(data.metrics.map(metric => [metric.name, metric.value]));
  return {
    TaskDuration: map.TaskDuration || 0,
    ScriptDuration: map.ScriptDuration || 0,
    LayoutDuration: map.LayoutDuration || 0,
    RecalcStyleDuration: map.RecalcStyleDuration || 0,
    Nodes: map.Nodes || 0,
    JSHeapUsedSize: map.JSHeapUsedSize || 0,
  };
}

async function gotoRoute(page, scenario, baseUrl) {
  const pathMap = {
    virtualScroll: '/virtualScroll',
    reorder: '/reorder',
    columnSort: '/columnSort',
  };
  if (!pathMap[scenario]) throw new Error(`Unknown scenario: ${scenario}`);
  const navStart = performance.now();
  await page.goto(`${baseUrl}${pathMap[scenario]}`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('[role="rfdg-scroll-container"]', { timeout: 20000 });
  await page.waitForSelector('[role="rfdg-body"] tr, [role="rfdg-body-frozen"] tr', { timeout: 20000 });
  await page.evaluate(
    () => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))),
  );
  return performance.now() - navStart;
}

async function runVirtualScroll(page) {
  return page.evaluate(async () => {
    const scrollContainer = document.querySelector('[role="rfdg-scroll-container"]');
    if (!scrollContainer) throw new Error('scroll container not found');
    const marks = [];
    const start = performance.now();
    for (let index = 0; index < 160; index++) {
      scrollContainer.scrollTop = index * 220;
      marks.push(performance.now());
      await new Promise(resolveFrame => requestAnimationFrame(resolveFrame));
    }
    const end = performance.now();
    const gaps = marks.slice(1).map((mark, index) => mark - marks[index]);
    return {
      scenarioMs: end - start,
      avgStepMs: (end - start) / 160,
      worstFrameGap: Math.max(0, ...gaps),
    };
  });
}

async function runReorder(page) {
  const handles = page.locator('.drag-handle');
  const count = await handles.count();
  if (count < 3) throw new Error(`not enough drag handles: ${count}`);
  const sourceBox = await handles.nth(0).boundingBox();
  const destinationBox = await handles.nth(Math.min(4, count - 1)).boundingBox();
  if (!sourceBox || !destinationBox) throw new Error('drag handle bbox not found');

  const marks = [];
  const start = performance.now();
  await page.mouse.move(sourceBox.x + sourceBox.width / 2, sourceBox.y + sourceBox.height / 2);
  marks.push(performance.now());
  await page.mouse.down();
  marks.push(performance.now());
  await page.mouse.move(destinationBox.x + destinationBox.width / 2, destinationBox.y + destinationBox.height / 2, {
    steps: 12,
  });
  marks.push(performance.now());
  await page.mouse.up();
  marks.push(performance.now());
  await page.evaluate(
    () => new Promise(resolveFrame => requestAnimationFrame(() => requestAnimationFrame(resolveFrame))),
  );
  const end = performance.now();
  const gaps = marks.slice(1).map((mark, index) => mark - marks[index]);
  return {
    scenarioMs: end - start,
    avgStepMs: gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length,
    worstFrameGap: Math.max(0, ...gaps),
  };
}

async function runColumnSort(page) {
  const headerCells = page.locator('[role="rfdg-head"] td.drag-item');
  const count = await headerCells.count();
  if (count < 3) throw new Error(`not enough sortable header cells: ${count}`);
  const marks = [];
  const start = performance.now();
  for (let index = 0; index < 20; index++) {
    await headerCells.nth((index % (count - 1)) + 1).click();
    marks.push(performance.now());
    await page.evaluate(() => new Promise(resolveFrame => requestAnimationFrame(resolveFrame)));
  }
  const end = performance.now();
  const gaps = marks.slice(1).map((mark, index) => mark - marks[index]);
  return {
    scenarioMs: end - start,
    avgStepMs: (end - start) / 20,
    worstFrameGap: Math.max(0, ...gaps),
  };
}

async function runScenario(browser, baseUrl, scenario, options) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  try {
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    await client.send('Performance.enable');
    if (options.cpuThrottle > 1) {
      await client.send('Emulation.setCPUThrottlingRate', { rate: options.cpuThrottle });
    }
    const mountMs = await gotoRoute(page, scenario, baseUrl);
    const before = await getMetrics(client);
    const scenarioResult =
      scenario === 'reorder'
        ? await runReorder(page)
        : scenario === 'columnSort'
        ? await runColumnSort(page)
        : await runVirtualScroll(page);
    const after = await getMetrics(client);
    return {
      scenario,
      mountMs,
      ...scenarioResult,
      delta: {
        Task: after.TaskDuration - before.TaskDuration,
        Script: after.ScriptDuration - before.ScriptDuration,
        Layout: after.LayoutDuration - before.LayoutDuration,
        Recalc: after.RecalcStyleDuration - before.RecalcStyleDuration,
      },
      heapUsed: after.JSHeapUsedSize,
      nodes: after.Nodes,
    };
  } finally {
    await context.close();
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    process.stdout.write(HELP);
    return;
  }
  args.currentSha ??= currentGitSha();
  const browser = await chromium.launch({ headless: !args.headed });
  const targets = { baseline: args.baselineUrl, current: args.currentUrl };
  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    revisions: { baseline: args.baselineSha, current: args.currentSha },
    environment: {
      node: process.version,
      chromium: browser.version(),
      platform: platform(),
      platformRelease: release(),
      architecture: arch(),
      cpuModel: cpus()[0]?.model ?? 'unknown',
      cpuCount: cpus().length,
      totalMemoryBytes: totalmem(),
      viewport: { width: 1440, height: 900 },
      cpuThrottle: args.cpuThrottle,
    },
    options: {
      runs: args.runs,
      warmups: args.warmups,
      scenarios: args.scenarios,
      targets,
      targetChecks: args.targetChecks,
      targetImprovementPercent: args.targetImprovementPercent,
      medianRegressionPercent: args.medianRegressionPercent,
      p95RegressionPercent: args.p95RegressionPercent,
    },
    results: {},
    passed: false,
  };

  try {
    for (const scenario of args.scenarios) {
      report.results[scenario] = { baseline: {}, current: {}, comparison: {} };
      for (let warmup = 0; warmup < args.warmups; warmup++) {
        for (const [name, url] of Object.entries(targets)) {
          process.stderr.write(`warm-up ${warmup + 1}/${args.warmups} ${scenario} ${name}\n`);
          await runScenario(browser, url, scenario, args);
        }
      }

      const raw = { baseline: [], current: [] };
      for (let run = 0; run < args.runs; run++) {
        const orderedTargets = run % 2 === 0 ? Object.entries(targets) : Object.entries(targets).reverse();
        for (const [name, url] of orderedTargets) {
          process.stderr.write(`run ${run + 1}/${args.runs} ${scenario} ${name}\n`);
          raw[name].push(await runScenario(browser, url, scenario, args));
        }
      }

      const baselineSummary = summarizeRuns(raw.baseline);
      const currentSummary = summarizeRuns(raw.current);
      report.results[scenario] = {
        baseline: { raw: raw.baseline, summary: baselineSummary },
        current: { raw: raw.current, summary: currentSummary },
        comparison: compareSummaries({
          scenario,
          baseline: baselineSummary,
          current: currentSummary,
          targetChecks: args.targetChecks,
          targetImprovementPercent: args.targetImprovementPercent,
          medianRegressionPercent: args.medianRegressionPercent,
          p95RegressionPercent: args.p95RegressionPercent,
        }),
      };
    }
  } finally {
    await browser.close();
  }

  report.passed = reportPassed(report.results);
  const json = `${JSON.stringify(report, null, 2)}\n`;
  if (args.output) {
    const outputPath = resolve(args.output);
    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, json, 'utf8');
  }
  process.stdout.write(json);
  if (!report.passed && !args.reportOnly) process.exitCode = 1;
}

main().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
