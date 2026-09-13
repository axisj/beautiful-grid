import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import process from 'node:process';

const repositoryRoot = resolve(import.meta.dirname, '..');
const resultPath = join(repositoryRoot, 'site/src/data/performance/v1.0.10-vs-current.json');

function invariant(condition, message) {
  if (!condition) throw new Error(message);
}

function git(...args) {
  return execFileSync('git', args, { cwd: repositoryRoot, encoding: 'utf8' }).trim();
}

function currentLibraryFingerprint() {
  const diff = git('diff', '--binary', 'HEAD', '--', 'beautiful-grid');
  const untracked = git('ls-files', '--others', '--exclude-standard', '--', 'beautiful-grid');
  const digest = createHash('sha256').update(diff).update('\n').update(untracked);
  for (const file of untracked.split('\n').filter(Boolean)) {
    digest.update('\n').update(file).update('\n').update(readFileSync(join(repositoryRoot, file)));
  }
  return digest.digest('hex').slice(0, 12);
}

function percentile(values, fraction) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * fraction) - 1)];
}

function assertClose(actual, expected, label) {
  invariant(Number.isFinite(actual), `${label} must be finite`);
  invariant(Math.abs(actual - expected) < 0.000001, `${label} does not match raw runs`);
}

function readReport() {
  return JSON.parse(readFileSync(resultPath, 'utf8'));
}

function validateResults(report) {
  invariant(report.schemaVersion >= 3, 'performance report schema must include isolated-tab measurements');
  invariant(report.benchmarkId === 'v1.0.10-vs-current-unreleased', 'unexpected benchmark id');
  invariant(report.environment.measuredRuns >= 7, 'at least seven measured runs are required');
  invariant(report.environment.warmupRuns >= 1, 'at least one warm-up is required');
  invariant(report.environment.tabIsolation === 'fresh browser context per run', 'each run must use a fresh browser context');
  invariant(report.environment.cpuThrottle === 4, 'the published report must record the 4x CPU throttle');
  invariant(report.environment.viewport.width === 1440 && report.environment.viewport.height === 1000, 'unexpected viewport');
  invariant(report.targets.baseline.gitSha === git('rev-list', '-n', '1', 'v1.0.10'), 'baseline SHA does not resolve to v1.0.10');
  invariant(report.targets.current.gitSha === git('rev-parse', 'HEAD'), 'current HEAD changed after measurement');
  invariant(report.targets.current.libraryDiffFingerprint === currentLibraryFingerprint(), 'library working tree changed after measurement');

  const expectedScenarios = new Map([
    ['fixed-10k', [10000, 20, 0, 'vertical']],
    ['fixed-100k', [100000, 20, 0, 'vertical']],
    ['fixed-1m', [1000000, 20, 0, 'vertical']],
    ['frozen-100-columns', [10000, 100, 3, 'horizontal']],
  ]);
  invariant(report.scenarios.length === expectedScenarios.size, 'unexpected scenario count');

  for (const scenario of report.scenarios) {
    const expected = expectedScenarios.get(scenario.id);
    invariant(expected, `unexpected scenario: ${scenario.id}`);
    invariant(
      scenario.rows === expected[0] && scenario.columns === expected[1] && scenario.frozen === expected[2] && scenario.axis === expected[3],
      `${scenario.id} fixture changed`,
    );
    for (const targetName of ['baseline', 'current']) {
      const target = scenario.targets[targetName];
      invariant(target.runs.length === report.environment.measuredRuns, `${scenario.id}/${targetName} run count mismatch`);
      for (const [runIndex, run] of target.runs.entries()) {
        for (const key of ['mountMs', 'scrollDurationMs', 'heapUsedBytes', 'domNodeCount', 'domRows', 'domCells']) {
          invariant(Number.isFinite(run[key]) && run[key] > 0, `${scenario.id}/${targetName}/${runIndex} invalid ${key}`);
        }
        invariant(run.frameGaps.length === report.environment.scrollSteps, `${scenario.id}/${targetName}/${runIndex} frame count mismatch`);
        invariant(run.frameGaps.every(value => Number.isFinite(value) && value > 0), `${scenario.id}/${targetName}/${runIndex} invalid frame gap`);
      }

      const keys = ['mountMs', 'scrollDurationMs', 'taskDurationMs', 'scriptDurationMs', 'layoutDurationMs', 'recalcStyleDurationMs', 'heapUsedBytes', 'domNodeCount', 'domRows', 'domCells'];
      for (const key of keys) {
        assertClose(target.summary[`${key}Median`], percentile(target.runs.map(run => run[key]), 0.5), `${scenario.id}/${targetName}/${key} median`);
      }
      const allFrameGaps = target.runs.flatMap(run => run.frameGaps);
      assertClose(target.summary.frameGapMedian, percentile(allFrameGaps, 0.5), `${scenario.id}/${targetName} frame median`);
      assertClose(target.summary.frameGapP95, percentile(allFrameGaps, 0.95), `${scenario.id}/${targetName} frame p95`);
      assertClose(target.summary.worstFrameGap, Math.max(...allFrameGaps), `${scenario.id}/${targetName} worst frame`);
    }

    const baseline = scenario.targets.baseline.summary;
    const current = scenario.targets.current.summary;
    const comparisons = {
      mountMedianImprovementPct: [baseline.mountMsMedian, current.mountMsMedian],
      frameGapP95ImprovementPct: [baseline.frameGapP95, current.frameGapP95],
      worstFrameGapImprovementPct: [baseline.worstFrameGap, current.worstFrameGap],
      taskDurationMedianImprovementPct: [baseline.taskDurationMsMedian, current.taskDurationMsMedian],
      heapMedianImprovementPct: [baseline.heapUsedBytesMedian, current.heapUsedBytesMedian],
      domNodeMedianImprovementPct: [baseline.domNodeCountMedian, current.domNodeCountMedian],
    };
    for (const [key, [before, after]] of Object.entries(comparisons)) {
      assertClose(scenario.comparison[key], ((before - after) / before) * 100, `${scenario.id}/${key}`);
    }
  }

  const million = report.scenarios.find(scenario => scenario.id === 'fixed-1m');
  invariant(million.comparison.mountMedianImprovementPct > 15, 'one-million-row mount target did not improve by at least 15%');
  invariant(million.comparison.heapMedianImprovementPct > 0, 'one-million-row heap did not improve');
  invariant(report.scenarios.every(scenario => scenario.comparison.mountMedianImprovementPct > 0), 'every published scenario must improve initial rendering');
}

function verifyResults() {
  const report = readReport();
  validateResults(report);
  const tampered = structuredClone(report);
  tampered.scenarios[0].targets.current.summary.mountMsMedian += 1;
  let negativeControlFailed = false;
  try {
    validateResults(tampered);
  } catch {
    negativeControlFailed = true;
  }
  invariant(negativeControlFailed, 'tampered summary negative control was not rejected');
  console.log('performance result verification passed');
}

function verifyContent() {
  const component = readFileSync(join(repositoryRoot, 'site/src/components/performance/PerformanceReport.astro'), 'utf8');
  const reportModule = readFileSync(join(repositoryRoot, 'site/src/data/performance/report.ts'), 'utf8');
  const supportNav = readFileSync(join(repositoryRoot, 'site/src/components/support/SupportNav.astro'), 'utf8');
  const rawRoute = readFileSync(join(repositoryRoot, 'site/src/pages/performance/results.json.ts'), 'utf8');
  const header = readFileSync(join(repositoryRoot, 'site/src/components/layout/Header.astro'), 'utf8');
  const footer = readFileSync(join(repositoryRoot, 'site/src/components/layout/Footer.astro'), 'utf8');
  const environmentPage = readFileSync(join(repositoryRoot, 'site/src/pages/product-facts.astro'), 'utf8');

  for (const token of ['getPerformanceScenario', 'formatMilliseconds', 'formatPercent', 'formatMebibytes']) {
    invariant(component.includes(token), `performance page must derive values with ${token}`);
  }
  invariant(reportModule.includes("import rawReport from './v1.0.10-vs-current.json'"), 'report module must use stored raw evidence');
  invariant(component.includes('측정한 모든 구성에서 최초 렌더 개선') && component.includes('Initial rendering improved in every measured configuration'), 'bilingual result disclosure is missing');
  invariant(component.includes('현재 작업 트리') && component.includes('current working tree'), 'unreleased target disclosure is missing');
  invariant(component.includes('performanceReport.environment.warmupRuns') && component.includes('discarded warm-up'), 'bilingual method disclosure is missing or not data-backed');
  invariant(component.includes('performanceReport.environment.measuredRuns') && component.includes('performanceReport.environment.scrollSteps'), 'published run counts must be data-backed');
  invariant(component.includes('해석 범위') && component.includes('Scope and limitations'), 'bilingual limitations are missing');
  invariant(!/563\.2ms|107\.1ms|80\.9%/.test(component), 'measured values must not be copied into page source');
  invariant(supportNav.includes('/product-facts') && supportNav.includes('/performance'), 'support sub-navigation is incomplete');
  invariant(supportNav.includes('v1.0.10 대비 현재 작업 트리') && supportNav.includes('v1.0.10 vs current working tree'), 'support sub-navigation has a stale performance baseline');
  invariant(!supportNav.includes('v1.0.0'), 'support sub-navigation still references v1.0.0');
  invariant(rawRoute.includes('performanceReport'), 'raw results route is not data-backed');
  invariant(header.includes("localizePath('/performance', locale)"), 'desktop support navigation does not include performance route state');
  invariant(footer.includes('성능 리포트') && footer.includes('Performance report'), 'footer performance link is missing');
  invariant(environmentPage.includes('<SupportNav') && environmentPage.includes("localizePath('/performance', locale)"), 'environment page does not connect to the performance report');
  console.log('performance content verification passed');
}

function verifyWhitespace() {
  const result = spawnSync('git', ['diff', '--check'], { cwd: repositoryRoot, encoding: 'utf8' });
  if (result.status !== 0) throw new Error(result.stdout || result.stderr || 'git diff --check failed');
  console.log('performance whitespace verification passed');
}

const modes = new Set(process.argv.slice(2));
if (modes.size === 0) throw new Error('Pass --results, --content, or --whitespace');
if (modes.has('--results')) verifyResults();
if (modes.has('--content')) verifyContent();
if (modes.has('--whitespace')) verifyWhitespace();
