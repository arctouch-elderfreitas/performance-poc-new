import * as fs from 'fs';
import * as path from 'path';
import * as chromeLauncher from 'chrome-launcher';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const lighthouse = require('lighthouse');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const ReportGenerator = require('lighthouse/report/generator/report-generator.js');
import { logger } from '../utils/logger';

export type LighthouseAggregation = 'median' | 'mean';

export interface LighthouseConfig {
  url: string;
  device: 'mobile' | 'desktop';
  throttling: 'mobile3G' | 'mobile4G' | 'broadband' | 'none';
  runs: number;
  /**
   * Headers extras enviados em cada requisição.
   * Útil para auditar páginas autenticadas (ex: { Cookie: "session=..." }).
   */
  extraHeaders?: Record<string, string>;
}

export interface LighthouseMetrics {
  performanceScore: number;
  fcpMs: number;
  lcpMs: number;
  ttiMs: number;
  tbtMs: number;
  cls: number;
  speedIndexMs: number;
  ttfbMs: number;
}

export interface LighthouseResult {
  url: string;
  device: string;
  throttling: string;
  metrics: LighthouseMetrics;
  opportunities: string[];
  diagnostics: string[];
  runs: number;
  aggregation: LighthouseAggregation;
  /** Context for AI prompts (network emulation, aggregation). */
  labContext: string;
  /** Present when runs > 1 */
  runMetrics?: LighthouseMetrics[];
}

export interface RunLighthouseOptions {
  /** Defaults: median when runs > 1, mean when runs === 1 */
  aggregation?: LighthouseAggregation;
  persist?: {
    dir: string;
    basename: string;
    includeHtml?: boolean;
  };
}

const THROTTLING_PRESETS: Record<string, object> = {
  mobile3G: {
    rttMs: 150,
    throughputKbps: 1638.4,
    cpuSlowdownMultiplier: 4,
    requestLatencyMs: 562.5,
    downloadThroughputKbps: 1474.56,
    uploadThroughputKbps: 675,
  },
  mobile4G: {
    rttMs: 40,
    throughputKbps: 10240,
    cpuSlowdownMultiplier: 2,
    requestLatencyMs: 0,
    downloadThroughputKbps: 9216,
    uploadThroughputKbps: 9216,
  },
  broadband: {
    rttMs: 10,
    throughputKbps: 40960,
    cpuSlowdownMultiplier: 1,
    requestLatencyMs: 0,
    downloadThroughputKbps: 36864,
    uploadThroughputKbps: 36864,
  },
  none: undefined as unknown as object,
};

function buildLighthouseFlags(config: LighthouseConfig, port: number) {
  const flags: Record<string, unknown> = {
    logLevel: 'error',
    output: 'json',
    port,
    formFactor: config.device,
    screenEmulation:
      config.device === 'mobile'
        ? { mobile: true, width: 375, height: 812, deviceScaleFactor: 3, disabled: false }
        : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false },
    throttling: THROTTLING_PRESETS[config.throttling],
    throttlingMethod: config.throttling === 'none' ? 'provided' : 'simulate',
  };
  if (config.extraHeaders && Object.keys(config.extraHeaders).length > 0) {
    flags.extraHeaders = config.extraHeaders;
  }
  return flags;
}

function extractMetrics(lhr: any): LighthouseMetrics {
  const audits = lhr.audits;
  const categories = lhr.categories;

  return {
    performanceScore: Math.round((categories?.performance?.score ?? 0) * 100),
    fcpMs: Math.round(audits['first-contentful-paint']?.numericValue ?? 0),
    lcpMs: Math.round(audits['largest-contentful-paint']?.numericValue ?? 0),
    ttiMs: Math.round(audits['interactive']?.numericValue ?? 0),
    tbtMs: Math.round(audits['total-blocking-time']?.numericValue ?? 0),
    cls: audits['cumulative-layout-shift']?.numericValue ?? 0,
    speedIndexMs: Math.round(audits['speed-index']?.numericValue ?? 0),
    ttfbMs: Math.round(audits['server-response-time']?.numericValue ?? 0),
  };
}

function extractOpportunities(lhr: any): string[] {
  return Object.values(lhr.audits as Record<string, any>)
    .filter((a) => a.details?.type === 'opportunity' && a.score !== null && a.score < 0.9)
    .sort((a, b) => (b.details?.overallSavingsMs ?? 0) - (a.details?.overallSavingsMs ?? 0))
    .slice(0, 5)
    .map((a) => {
      const saving = a.details?.overallSavingsMs ? ` (~${Math.round(a.details.overallSavingsMs)}ms saved)` : '';
      return `${a.title}${saving}`;
    });
}

function extractDiagnostics(lhr: any): string[] {
  return Object.values(lhr.audits as Record<string, any>)
    .filter((a) => a.details?.type === 'table' && a.score !== null && a.score < 0.9)
    .slice(0, 3)
    .map((a) => a.title);
}

function fromLhr(lhr: any): {
  metrics: LighthouseMetrics;
  opportunities: string[];
  diagnostics: string[];
} {
  return {
    metrics: extractMetrics(lhr),
    opportunities: extractOpportunities(lhr),
    diagnostics: extractDiagnostics(lhr),
  };
}

async function runWithPort(config: LighthouseConfig, port: number): Promise<any> {
  const flags = buildLighthouseFlags(config, port);
  const runnerResult = await lighthouse(config.url, flags, null);
  return runnerResult.lhr;
}

function medianOfSorted(sorted: number[]): number {
  const n = sorted.length;
  if (n === 0) return 0;
  const mid = Math.floor(n / 2);
  if (n % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function medianMetrics(results: LighthouseMetrics[]): LighthouseMetrics {
  const keys: (keyof LighthouseMetrics)[] = [
    'performanceScore',
    'fcpMs',
    'lcpMs',
    'ttiMs',
    'tbtMs',
    'cls',
    'speedIndexMs',
    'ttfbMs',
  ];
  const out = {} as LighthouseMetrics;
  for (const key of keys) {
    const vals = results
      .map((r) => r[key] as number)
      .slice()
      .sort((a, b) => a - b);
    const m = medianOfSorted(vals);
    if (key === 'cls') {
      out[key] = Math.round(m * 1000) / 1000;
    } else {
      out[key] = Math.round(m);
    }
  }
  return out;
}

function averageMetrics(results: LighthouseMetrics[]): LighthouseMetrics {
  const n = results.length;
  const sum = (key: keyof LighthouseMetrics) => results.reduce((acc, r) => acc + (r[key] as number), 0);

  return {
    performanceScore: Math.round(sum('performanceScore') / n),
    fcpMs: Math.round(sum('fcpMs') / n),
    lcpMs: Math.round(sum('lcpMs') / n),
    ttiMs: Math.round(sum('ttiMs') / n),
    tbtMs: Math.round(sum('tbtMs') / n),
    cls: Math.round((sum('cls') / n) * 1000) / 1000,
    speedIndexMs: Math.round(sum('speedIndexMs') / n),
    ttfbMs: Math.round(sum('ttfbMs') / n),
  };
}

function buildLabContext(
  config: LighthouseConfig,
  runs: number,
  aggregation: LighthouseAggregation
): string {
  const throttleLines: Record<string, string> = {
    mobile3G:
      'Simulated slow mobile (3G-like RTT/throughput + CPU slowdown). Compare these numbers only to other mobile-throttled lab runs, not to desktop broadband.',
    mobile4G: 'Simulated LTE-like conditions with moderate CPU slowdown.',
    broadband: 'Fast connection similar to wired desktop; raw ms are expected to look much better than mobile3G — do not judge mobile runs against this profile.',
    none: 'No network throttling applied.',
  };
  const t = config.throttling;
  return (
    `${runs} Lighthouse run(s), metrics aggregated by ${aggregation}. ` +
    `Device form factor: ${config.device}. ` +
    (throttleLines[t] || '')
  );
}

function pickRepresentativeIndex(metricsList: LighthouseMetrics[], aggregated: LighthouseMetrics): number {
  const target = aggregated.lcpMs;
  let bestIdx = 0;
  let bestDist = Infinity;
  metricsList.forEach((m, idx) => {
    const d = Math.abs(m.lcpMs - target);
    if (d < bestDist) {
      bestDist = d;
      bestIdx = idx;
    }
  });
  return bestIdx;
}

function persistArtifacts(
  lhr: any,
  aggregated: LighthouseMetrics,
  allMetrics: LighthouseMetrics[],
  runs: number,
  aggregation: LighthouseAggregation,
  persist: { dir: string; basename: string; includeHtml?: boolean }
): void {
  const { dir, basename, includeHtml = true } = persist;
  fs.mkdirSync(dir, { recursive: true });
  const safeBase = basename.replace(/[^a-zA-Z0-9._-]+/g, '_');

  fs.writeFileSync(path.join(dir, `${safeBase}.lhr.json`), JSON.stringify(lhr, null, 2), 'utf8');

  const metricsPayload = {
    runs,
    aggregation,
    metrics: aggregated,
    runMetrics: allMetrics,
  };
  fs.writeFileSync(path.join(dir, `${safeBase}.metrics.json`), JSON.stringify(metricsPayload, null, 2), 'utf8');

  if (includeHtml) {
    const html = ReportGenerator.generateReport(lhr, 'html') as string;
    fs.writeFileSync(path.join(dir, `${safeBase}.report.html`), html, 'utf8');
  }
}

export async function runLighthouse(
  config: LighthouseConfig,
  options?: RunLighthouseOptions
): Promise<LighthouseResult> {
  const runs = Math.max(1, config.runs);
  const aggregation: LighthouseAggregation =
    options?.aggregation ?? (runs > 1 ? 'median' : 'mean');

  logger.info(
    `Running Lighthouse on ${config.url} (${config.device}, ${config.throttling}, ${runs} run${runs > 1 ? 's' : ''}, ${aggregation})...`
  );

  // One Chrome instance per Lighthouse run: after an audit Lighthouse often closes the
  // last tab; reusing the same port causes "Cannot create new tab, and no tabs already open."
  const lhrs: any[] = [];
  for (let i = 0; i < runs; i++) {
    if (runs > 1) logger.info(`  Run ${i + 1}/${runs}...`);
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'] });
    try {
      const lhr = await runWithPort(config, chrome.port);
      lhrs.push(lhr);
    } finally {
      try {
        await chrome.kill();
      } catch (e: any) {
        if (e?.code !== 'EPERM') throw e;
      }
    }
  }

  const perRun = lhrs.map((lhr) => fromLhr(lhr));
  const allMetrics = perRun.map((p) => p.metrics);

  let aggregated: LighthouseMetrics;
  if (runs === 1) {
    aggregated = allMetrics[0];
  } else if (aggregation === 'median') {
    aggregated = medianMetrics(allMetrics);
  } else {
    aggregated = averageMetrics(allMetrics);
  }

  const repIdx = pickRepresentativeIndex(allMetrics, aggregated);
  const repLhr = lhrs[repIdx];
  const rep = perRun[repIdx];

  if (options?.persist) {
    persistArtifacts(repLhr, aggregated, allMetrics, runs, aggregation, options.persist);
  }

  const labContext = buildLabContext(config, runs, aggregation);

  return {
    url: config.url,
    device: config.device,
    throttling: config.throttling,
    metrics: aggregated,
    opportunities: rep.opportunities,
    diagnostics: rep.diagnostics,
    runs,
    aggregation,
    labContext,
    runMetrics: runs > 1 ? allMetrics : undefined,
  };
}
