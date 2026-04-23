import * as fs from 'fs';
import * as path from 'path';
import { WebPerfPlan } from '../config/web-perf';
import { logger } from '../utils/logger';
import { discoverFromSitemap, detectSitemapUrl } from '../utils/url-discovery';
import { writeSessionHtmlReport } from '../utils/session-html-report';
import { LighthouseResult, runLighthouse } from './lighthouse-engine';

export interface WebPerfEntry {
  url: string;
  profileKey: string;
  device: string;
  throttling: string;
  result: LighthouseResult;
}

export interface WebPerfSessionSummaryV1 {
  version: 1;
  createdAt: string;
  entries: Array<{
    url: string;
    profileKey: string;
    device: string;
    throttling: string;
    metrics: LighthouseResult['metrics'];
    runs: number;
    aggregation: string;
  }>;
}

export interface WebPerfSession {
  sessionDir: string;
  entries: WebPerfEntry[];
  /** URLs efetivamente testadas (após descoberta + merge) */
  resolvedUrls: string[];
  discoveryLog?: string;
  createdAt: string;
}

function slugForUrlProfile(url: string, profileKey: string): string {
  const hostPath = url
    .replace(/^https?:\/\//i, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 72);
  return `${hostPath || 'url'}__${profileKey}`.replace(/_+/g, '_');
}

async function resolveUrls(plan: WebPerfPlan): Promise<{ urls: string[]; log: string }> {
  if (!plan.discover) {
    return { urls: plan.urls, log: '' };
  }

  const cfg = plan.discover;
  const merge = cfg.merge ?? 'prepend';

  logger.section('Descoberta de URLs via Sitemap');

  let sitemapUrl = cfg.sitemapUrl;

  if (!sitemapUrl) {
    const base = cfg.baseUrl ?? plan.urls[0];
    if (!base) {
      logger.warn('Nenhuma baseUrl ou sitemapUrl configurada para descoberta. Ignorando.');
      return { urls: plan.urls, log: 'Sem URL base para descoberta.' };
    }
    sitemapUrl = await detectSitemapUrl(base) ?? undefined;
    if (!sitemapUrl) {
      logger.warn(`Sitemap não encontrado em ${base}. Usando URLs explícitas.`);
      return { urls: plan.urls, log: `Sitemap não detectado em ${base}.` };
    }
  }

  const result = await discoverFromSitemap({
    url: sitemapUrl,
    maxUrls: cfg.maxUrls ?? 10,
    filterPattern: cfg.filterPattern,
    followIndex: cfg.followIndex !== false,
  });

  const discovered = result.urls;

  let merged: string[];
  if (merge === 'replace') {
    merged = discovered;
  } else if (merge === 'append') {
    merged = [...plan.urls, ...discovered.filter((u) => !plan.urls.includes(u))];
  } else {
    merged = [...discovered, ...plan.urls.filter((u) => !discovered.includes(u))];
  }

  const log =
    `Sitemap: ${sitemapUrl} | Descobertas: ${result.discovered} | ` +
    `Filtradas: ${result.filtered} | Limitadas: ${result.limited} | ` +
    `Testando: ${merged.length} URL(s) [merge: ${merge}]`;

  logger.success(log);
  return { urls: merged, log };
}

export async function runWebPerfSession(plan: WebPerfPlan, baseResultsDir: string): Promise<WebPerfSession> {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const sessionDir = path.join(baseResultsDir, 'web-perf', stamp);
  fs.mkdirSync(sessionDir, { recursive: true });

  const { urls: resolvedUrls, log: discoveryLog } = await resolveUrls(plan);

  const entries: WebPerfEntry[] = [];

  for (const url of resolvedUrls) {
    for (const profile of plan.profiles) {
      const basename = slugForUrlProfile(url, profile.key);
      logger.info(`\n▶ ${url} — profile "${profile.key}" (${profile.device} / ${profile.throttling})`);

      const result = await runLighthouse(
        {
          url,
          device: profile.device,
          throttling: profile.throttling,
          runs: plan.runs,
          extraHeaders: plan.extraHeaders,
        },
        {
          aggregation: plan.aggregation,
          persist: {
            dir: sessionDir,
            basename,
            includeHtml: plan.saveHtml,
          },
        }
      );

      entries.push({
        url,
        profileKey: profile.key,
        device: profile.device,
        throttling: profile.throttling,
        result,
      });
    }
  }

  const summary: WebPerfSessionSummaryV1 = {
    version: 1,
    createdAt: new Date().toISOString(),
    entries: entries.map((e) => ({
      url: e.url,
      profileKey: e.profileKey,
      device: e.device,
      throttling: e.throttling,
      metrics: e.result.metrics,
      runs: e.result.runs,
      aggregation: e.result.aggregation,
    })),
  };

  fs.writeFileSync(path.join(sessionDir, 'session-summary.json'), JSON.stringify(summary, null, 2), 'utf8');

  const reportPath = writeSessionHtmlReport({
    sessionDir,
    createdAt: summary.createdAt,
    entries,
    resolvedUrls,
    discoveryLog,
  });
  logger.info(`  Relatório consolidado: ${reportPath}`);

  return { sessionDir, entries, resolvedUrls, discoveryLog, createdAt: summary.createdAt };
}

/** Higher-is-worse metrics: flag when current > baseline * (1 + tolerancePct/100). */
export function compareSessionToBaseline(
  current: WebPerfSessionSummaryV1,
  baselinePath: string,
  tolerancePct: number
): string[] {
  const messages: string[] = [];
  if (!fs.existsSync(baselinePath)) {
    return [`Baseline file not found: ${baselinePath}`];
  }

  let baseline: WebPerfSessionSummaryV1;
  try {
    baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8')) as WebPerfSessionSummaryV1;
  } catch {
    return [`Could not parse baseline JSON: ${baselinePath}`];
  }

  if (baseline.version !== 1 || !Array.isArray(baseline.entries)) {
    return ['Invalid baseline: expected { version: 1, entries: [...] }'];
  }

  const factor = 1 + Math.max(0, tolerancePct) / 100;

  for (const b of baseline.entries) {
    const cur = current.entries.find((c) => c.url === b.url && c.profileKey === b.profileKey);
    if (!cur) {
      messages.push(`Missing current entry for baseline: ${b.url} / ${b.profileKey}`);
      continue;
    }

    const bm = b.metrics;
    const cm = cur.metrics;

    const checkHigher = (name: keyof typeof bm, base: number, now: number) => {
      if (base <= 0) return;
      if (now > base * factor) {
        messages.push(
          `Regression ${name} @ ${b.url} [${b.profileKey}]: baseline ${base}, current ${now} (limit ${Math.round(base * factor)})`
        );
      }
    };

    checkHigher('lcpMs', bm.lcpMs, cm.lcpMs);
    checkHigher('fcpMs', bm.fcpMs, cm.fcpMs);
    checkHigher('ttiMs', bm.ttiMs, cm.ttiMs);
    checkHigher('tbtMs', bm.tbtMs, cm.tbtMs);
    checkHigher('ttfbMs', bm.ttfbMs, cm.ttfbMs);
    checkHigher('speedIndexMs', bm.speedIndexMs, cm.speedIndexMs);

    if (cm.cls > Math.max(bm.cls + 0.05, bm.cls * factor)) {
      messages.push(
        `Regression CLS @ ${b.url} [${b.profileKey}]: baseline ${bm.cls}, current ${cm.cls}`
      );
    }

    if (cm.performanceScore < bm.performanceScore - 10) {
      messages.push(
        `Regression performance score @ ${b.url} [${b.profileKey}]: baseline ${bm.performanceScore}, current ${cm.performanceScore}`
      );
    }
  }

  return messages;
}
