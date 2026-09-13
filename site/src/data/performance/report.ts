import rawReport from './v1.0.10-vs-current.json';

export const performanceReport = rawReport;

export type PerformanceScenario = (typeof performanceReport.scenarios)[number];

export function getPerformanceScenario(id: string): PerformanceScenario {
  const scenario = performanceReport.scenarios.find(item => item.id === id);
  if (!scenario) throw new Error(`Missing performance scenario: ${id}`);
  return scenario;
}

export function formatMilliseconds(value: number, digits = 1): string {
  return `${value.toFixed(digits)}ms`;
}

export function formatPercent(value: number, digits = 1): string {
  return `${Math.abs(value).toFixed(digits)}%`;
}

export function formatMebibytes(value: number): string {
  return `${(value / 1024 / 1024).toFixed(1)} MiB`;
}

export function roundedDate(isoDate: string): string {
  return isoDate.slice(0, 10);
}
