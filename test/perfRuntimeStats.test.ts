import { describe, expect, it } from 'vitest';
import { compareSummaries, percentile, reportPassed, summarizeRuns } from '../scripts/perf-runtime-stats.mjs';

function makeRun(value: number) {
  return {
    mountMs: value,
    scenarioMs: value * 2,
    avgStepMs: value / 2,
    worstFrameGap: value * 3,
    delta: { Task: value, Script: value, Layout: value, Recalc: value },
    heapUsed: value * 100,
    nodes: value * 10,
  };
}

describe('runtime performance statistics', () => {
  it('uses nearest-rank percentiles and retains worst values', () => {
    const values = [5, 1, 7, 3, 4, 2, 6];
    expect(percentile(values, 50)).toBe(4);
    expect(percentile(values, 95)).toBe(7);

    const summary = summarizeRuns(values.map(makeRun));
    expect(summary.mountMs).toEqual({ median: 4, p95: 7, worst: 7 });
    expect(summary.deltaTask).toEqual({ median: 4, p95: 7, worst: 7 });
  });

  it('passes a target only when its median improves by at least fifteen percent', () => {
    const baseline = summarizeRuns([10, 10, 10, 10, 10, 10, 10].map(makeRun));
    const current = summarizeRuns([8, 8, 8, 8, 8, 8, 8].map(makeRun));
    const comparison = compareSummaries({
      scenario: 'virtualScroll',
      baseline,
      current,
      targetChecks: [{ scenario: 'virtualScroll', metric: 'mountMs' }],
      targetImprovementPercent: 15,
      medianRegressionPercent: 5,
      p95RegressionPercent: 10,
    });

    expect(comparison.mountMs).toMatchObject({ target: true, guarded: true, passed: true });
    expect(comparison.mountMs.medianChangePercent).toBe(-20);
  });

  it('fails guarded non-target median and p95 regressions but only reports diagnostic metrics', () => {
    const baseline = summarizeRuns([10, 10, 10, 10, 10, 10, 10].map(makeRun));
    const current = summarizeRuns([10, 10, 10, 10, 10, 12, 12].map(makeRun));
    const comparison = compareSummaries({
      scenario: 'reorder',
      baseline,
      current,
      targetChecks: [{ scenario: 'virtualScroll', metric: 'mountMs' }],
      targetImprovementPercent: 15,
      medianRegressionPercent: 5,
      p95RegressionPercent: 10,
    });
    const results = { reorder: { comparison } };

    expect(comparison.mountMs).toMatchObject({ guarded: true, passed: false });
    expect(comparison.deltaTask).toMatchObject({ guarded: false, passed: true });
    expect(reportPassed(results)).toBe(false);
  });
});
