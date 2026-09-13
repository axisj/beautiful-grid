export const DEFAULT_LATENCY_METRICS = [
  'mountMs',
  'scenarioMs',
  'avgStepMs',
  'worstFrameGap',
  'deltaTask',
  'deltaScript',
  'deltaLayout',
  'deltaRecalc',
];

export function percentile(values, percentileValue) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const rank = Math.max(0, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[Math.min(rank, sorted.length - 1)];
}

function metricValue(run, metric) {
  if (metric.startsWith('delta')) {
    const deltaKey = metric.slice('delta'.length);
    return run.delta[deltaKey];
  }
  return run[metric];
}

export function summarizeRuns(runs, metrics = [...DEFAULT_LATENCY_METRICS, 'heapUsed', 'nodes']) {
  return Object.fromEntries(
    metrics.map(metric => {
      const values = runs.map(run => metricValue(run, metric));
      return [
        metric,
        {
          median: percentile(values, 50),
          p95: percentile(values, 95),
          worst: Math.max(...values),
        },
      ];
    }),
  );
}

function percentChange(baseline, current) {
  if (baseline === 0) return current === 0 ? 0 : Number.POSITIVE_INFINITY;
  return ((current - baseline) / baseline) * 100;
}

export function compareSummaries({
  scenario,
  baseline,
  current,
  targetChecks,
  targetImprovementPercent,
  medianRegressionPercent,
  p95RegressionPercent,
  guardMetrics = ['mountMs', 'scenarioMs', 'avgStepMs', 'worstFrameGap'],
}) {
  const comparisons = {};
  for (const metric of DEFAULT_LATENCY_METRICS) {
    const target = targetChecks.some(check => check.scenario === scenario && check.metric === metric);
    const guarded = target || guardMetrics.includes(metric);
    const medianChangePercent = percentChange(baseline[metric].median, current[metric].median);
    const p95ChangePercent = percentChange(baseline[metric].p95, current[metric].p95);
    const worstChangePercent = percentChange(baseline[metric].worst, current[metric].worst);
    const passed = !guarded
      ? true
      : target
      ? medianChangePercent <= -targetImprovementPercent
      : medianChangePercent <= medianRegressionPercent && p95ChangePercent <= p95RegressionPercent;

    comparisons[metric] = {
      target,
      guarded,
      medianChangePercent,
      p95ChangePercent,
      worstChangePercent,
      passed,
    };
  }
  return comparisons;
}

export function reportPassed(results) {
  return Object.values(results).every(scenarioResult =>
    Object.values(scenarioResult.comparison).every(metric => metric.passed),
  );
}
