import { writeFile } from 'node:fs/promises';
import { arch, platform, release } from 'node:os';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const repositoryRoot = resolve(import.meta.dirname, '..');
const options = Object.fromEntries(
  process.argv.slice(2).map(argument => {
    const [key, ...value] = argument.replace(/^--/, '').split('=');
    return [key, value.length ? value.join('=') : true];
  }),
);
const baselineUrl = String(options.baseline ?? 'http://127.0.0.1:4174');
const currentUrl = String(options.current ?? 'http://127.0.0.1:4173');
const baselineLabel = String(options['baseline-label'] ?? 'v1.0.10');
const baselineSha = String(options['baseline-sha'] ?? 'unspecified');
const currentLabel = String(options['current-label'] ?? 'working tree (1.0.10+unreleased)');
const currentSha = String(options['current-sha'] ?? 'unspecified');
const currentFingerprint = String(options['current-fingerprint'] ?? 'unspecified');
const outputPath = resolve(repositoryRoot, String(options.output ?? 'site/src/data/performance/v1.0.10-vs-current.json'));
const measuredRuns = Number(options.runs ?? 7);
const warmupRuns = Number(options.warmups ?? 1);
const cpuThrottle = Number(options.cpu ?? 4);
const scrollSteps = Number(options['scroll-steps'] ?? 120);
const viewport = { width: 1440, height: 1000, deviceScaleFactor: 1 };
const scenarios = [
  { id: 'fixed-10k', label: '10,000 rows × 20 columns', rows: 10_000, columns: 20, frozen: 0, axis: 'vertical' },
  { id: 'fixed-100k', label: '100,000 rows × 20 columns', rows: 100_000, columns: 20, frozen: 0, axis: 'vertical' },
  { id: 'fixed-1m', label: '1,000,000 rows × 20 columns', rows: 1_000_000, columns: 20, frozen: 0, axis: 'vertical' },
  { id: 'frozen-100-columns', label: '10,000 rows × 100 columns, 3 frozen', rows: 10_000, columns: 100, frozen: 3, axis: 'horizontal' },
];

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

function summary(runs) {
  const result = {};
  for (const key of [
    'mountMs',
    'scrollDurationMs',
    'taskDurationMs',
    'scriptDurationMs',
    'layoutDurationMs',
    'recalcStyleDurationMs',
    'heapUsedBytes',
    'domNodeCount',
    'domRows',
    'domCells',
  ]) {
    result[`${key}Median`] = percentile(runs.map(run => run[key]), 0.5);
  }
  const frameGaps = runs.flatMap(run => run.frameGaps);
  result.frameGapMedian = percentile(frameGaps, 0.5);
  result.frameGapP95 = percentile(frameGaps, 0.95);
  result.worstFrameGap = Math.max(...frameGaps);
  return result;
}

function improvement(before, after) {
  return ((before - after) / before) * 100;
}

function comparison(baseline, current) {
  return {
    mountMedianImprovementPct: improvement(baseline.mountMsMedian, current.mountMsMedian),
    frameGapP95ImprovementPct: improvement(baseline.frameGapP95, current.frameGapP95),
    worstFrameGapImprovementPct: improvement(baseline.worstFrameGap, current.worstFrameGap),
    taskDurationMedianImprovementPct: improvement(baseline.taskDurationMsMedian, current.taskDurationMsMedian),
    heapMedianImprovementPct: improvement(baseline.heapUsedBytesMedian, current.heapUsedBytesMedian),
    domNodeMedianImprovementPct: improvement(baseline.domNodeCountMedian, current.domNodeCountMedian),
  };
}

function performanceMap(metrics) {
  return Object.fromEntries(metrics.map(metric => [metric.name, metric.value]));
}

async function measure(browser, targetUrl, scenario) {
  const context = await browser.newContext({ viewport });
  try {
    const page = await context.newPage();
    const client = await context.newCDPSession(page);
    await client.send('Performance.enable');
    await client.send('Emulation.setCPUThrottlingRate', { rate: cpuThrottle });
    const query = new URLSearchParams({
      scenario: scenario.id,
      rows: String(scenario.rows),
      columns: String(scenario.columns),
      frozen: String(scenario.frozen),
    });
    await page.goto(`${targetUrl}/?${query}`, { waitUntil: 'domcontentloaded', timeout: 120_000 });
    await page.waitForSelector('html[data-benchmark-ready="true"]', { timeout: 120_000 });
    const fixture = await page.evaluate(() => window.__BGRID_BENCH__);
    const before = performanceMap((await client.send('Performance.getMetrics')).metrics);
    const scroll = await page.evaluate(async ({ axis, steps }) => {
      const scroller = document.querySelector('[role="rfdg-scroll-container"]');
      if (!scroller) throw new Error('scroll container not found');
      const horizontal = axis === 'horizontal';
      const extent = horizontal ? scroller.scrollWidth - scroller.clientWidth : scroller.scrollHeight - scroller.clientHeight;
      const gaps = [];
      let previous = performance.now();
      const startedAt = previous;
      for (let index = 0; index < steps; index += 1) {
        const half = Math.max(1, Math.floor(steps / 2));
        const progress = index < half ? index / (half - 1) : 1 - (index - half) / Math.max(1, steps - half - 1);
        if (horizontal) scroller.scrollLeft = extent * progress;
        else scroller.scrollTop = extent * progress;
        await new Promise(resolveFrame => requestAnimationFrame(resolveFrame));
        const now = performance.now();
        gaps.push(now - previous);
        previous = now;
      }
      return { scrollDurationMs: performance.now() - startedAt, frameGaps: gaps, scrollExtent: extent };
    }, { axis: scenario.axis, steps: scrollSteps });
    const after = performanceMap((await client.send('Performance.getMetrics')).metrics);
    const dom = await page.evaluate(() => ({
      domRows: document.querySelectorAll('[role="rfdg-body"] tr, [role="rfdg-body-frozen"] tr').length,
      domCells: document.querySelectorAll('[role="rfdg-body"] td, [role="rfdg-body-frozen"] td').length,
    }));
    return {
      mountMs: fixture.mountMs,
      dataGenerationMs: fixture.dataGenerationMs,
      ...scroll,
      taskDurationMs: (after.TaskDuration - before.TaskDuration) * 1000,
      scriptDurationMs: (after.ScriptDuration - before.ScriptDuration) * 1000,
      layoutDurationMs: (after.LayoutDuration - before.LayoutDuration) * 1000,
      recalcStyleDurationMs: (after.RecalcStyleDuration - before.RecalcStyleDuration) * 1000,
      heapUsedBytes: after.JSHeapUsedSize,
      domNodeCount: after.Nodes,
      ...dom,
    };
  } finally {
    await context.close();
  }
}

async function main() {
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  try {
    const userAgentContext = await browser.newContext();
    const userAgentPage = await userAgentContext.newPage();
    const userAgent = await userAgentPage.evaluate(() => navigator.userAgent);
    await userAgentContext.close();
    const results = [];
    for (const scenario of scenarios) {
      const runs = { baseline: [], current: [] };
      for (let runIndex = 0; runIndex < warmupRuns + measuredRuns; runIndex += 1) {
        for (const targetName of runIndex % 2 === 0 ? ['baseline', 'current'] : ['current', 'baseline']) {
          const run = await measure(browser, targetName === 'baseline' ? baselineUrl : currentUrl, scenario);
          if (runIndex >= warmupRuns) runs[targetName].push(run);
          console.log(`${scenario.id} ${targetName} ${runIndex < warmupRuns ? 'warm-up' : `${runIndex}/${measuredRuns}`} complete`);
        }
      }
      const baselineSummary = summary(runs.baseline);
      const currentSummary = summary(runs.current);
      results.push({
        ...scenario,
        targets: {
          baseline: { runs: runs.baseline, summary: baselineSummary },
          current: { runs: runs.current, summary: currentSummary },
        },
        comparison: comparison(baselineSummary, currentSummary),
      });
    }
    const report = {
      schemaVersion: 3,
      benchmarkId: 'v1.0.10-vs-current-unreleased',
      generatedAt: new Date().toISOString(),
      environment: {
        node: process.version,
        platform: platform(),
        architecture: arch(),
        osRelease: release(),
        browser: browser.version(),
        userAgent,
        viewport,
        cpuThrottle,
        warmupRuns,
        measuredRuns,
        scrollSteps,
        tabIsolation: 'fresh browser context per run',
        grid: { width: 1200, height: 620, itemHeight: 'library default' },
      },
      targets: {
        baseline: { label: baselineLabel, gitSha: baselineSha, baseUrl: baselineUrl },
        current: {
          label: currentLabel,
          gitSha: currentSha,
          libraryDiffFingerprint: currentFingerprint,
          baseUrl: currentUrl,
        },
      },
      scenarios: results,
    };
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(`VERSION_PERFORMANCE_MEASUREMENT_COMPLETE ${outputPath}`);
  } finally {
    await browser.close();
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
