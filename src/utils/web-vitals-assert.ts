import { LighthouseMetrics } from '../engines/lighthouse-engine';

export interface WebVitalsThresholds {
  minPerformanceScore?: number;
  maxLcpMs?: number;
  maxFcpMs?: number;
  maxTbtMs?: number;
  maxTtfbMs?: number;
  maxTtiMs?: number;
  maxCls?: number;
  maxSpeedIndexMs?: number;
}

export function checkWebVitals(
  metrics: LighthouseMetrics,
  thresholds: WebVitalsThresholds,
  label?: string
): string[] {
  const prefix = label ? `[${label}] ` : '';
  const failures: string[] = [];

  if (thresholds.minPerformanceScore !== undefined && metrics.performanceScore < thresholds.minPerformanceScore) {
    failures.push(`${prefix}Performance score ${metrics.performanceScore} < ${thresholds.minPerformanceScore}`);
  }
  if (thresholds.maxLcpMs !== undefined && metrics.lcpMs > thresholds.maxLcpMs) {
    failures.push(`${prefix}LCP ${metrics.lcpMs}ms > ${thresholds.maxLcpMs}ms`);
  }
  if (thresholds.maxFcpMs !== undefined && metrics.fcpMs > thresholds.maxFcpMs) {
    failures.push(`${prefix}FCP ${metrics.fcpMs}ms > ${thresholds.maxFcpMs}ms`);
  }
  if (thresholds.maxTbtMs !== undefined && metrics.tbtMs > thresholds.maxTbtMs) {
    failures.push(`${prefix}TBT ${metrics.tbtMs}ms > ${thresholds.maxTbtMs}ms`);
  }
  if (thresholds.maxTtfbMs !== undefined && metrics.ttfbMs > thresholds.maxTtfbMs) {
    failures.push(`${prefix}TTFB ${metrics.ttfbMs}ms > ${thresholds.maxTtfbMs}ms`);
  }
  if (thresholds.maxTtiMs !== undefined && metrics.ttiMs > thresholds.maxTtiMs) {
    failures.push(`${prefix}TTI ${metrics.ttiMs}ms > ${thresholds.maxTtiMs}ms`);
  }
  if (thresholds.maxCls !== undefined && metrics.cls > thresholds.maxCls) {
    failures.push(`${prefix}CLS ${metrics.cls} > ${thresholds.maxCls}`);
  }
  if (thresholds.maxSpeedIndexMs !== undefined && metrics.speedIndexMs > thresholds.maxSpeedIndexMs) {
    failures.push(`${prefix}Speed Index ${metrics.speedIndexMs}ms > ${thresholds.maxSpeedIndexMs}ms`);
  }

  return failures;
}

export function assertWebVitals(metrics: LighthouseMetrics, thresholds: WebVitalsThresholds, label?: string): void {
  const failures = checkWebVitals(metrics, thresholds, label);
  if (failures.length > 0) {
    throw new Error(`Web Vitals thresholds failed:\n${failures.join('\n')}`);
  }
}
