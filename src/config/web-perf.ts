import * as fs from 'fs';
import * as path from 'path';
import { WebVitalsThresholds } from '../utils/web-vitals-assert';

export type WebPerfAggregation = 'median' | 'mean';

export interface WebPerfProfile {
  key: string;
  device: 'mobile' | 'desktop';
  throttling: 'mobile3G' | 'mobile4G' | 'broadband' | 'none';
}

export interface SitemapDiscoverConfig {
  /**
   * URL explícita do sitemap. Se omitida, o runner tenta detectar automaticamente
   * a partir de `baseUrl` (verifica /sitemap.xml, /sitemap_index.xml, etc.).
   */
  sitemapUrl?: string;
  /**
   * URL base do site quando sitemapUrl não é fornecido.
   * Ex: "https://arctouch.com"
   */
  baseUrl?: string;
  /** Máximo de URLs a testar. Padrão: 10 */
  maxUrls?: number;
  /**
   * Regex para filtrar URLs descobertas.
   * Ex: "^https://arctouch\\.com/" — exclui subdomínios externos.
   */
  filterPattern?: string;
  /** Seguir sitemap index e carregar sub-sitemaps. Padrão: true */
  followIndex?: boolean;
  /**
   * Como combinar as URLs descobertas com as explícitas em `urls`.
   * - "prepend": coloca descobertas antes das explícitas (padrão)
   * - "append":  coloca depois
   * - "replace": substitui completamente a lista explícita
   */
  merge?: 'prepend' | 'append' | 'replace';
}

export interface WebPerfPlan {
  urls: string[];
  profiles: WebPerfProfile[];
  runs: number;
  aggregation: WebPerfAggregation;
  saveHtml: boolean;
  /** Quando presente, descobre URLs via sitemap antes de executar o Lighthouse. */
  discover?: SitemapDiscoverConfig;
  /** Headers extras enviados em todas as requisições (ex: Cookie para páginas autenticadas). */
  extraHeaders?: Record<string, string>;
}

const DEFAULT_PLAN: WebPerfPlan = {
  urls: ['https://arctouch.com/'],
  profiles: [
    { key: 'mobile-3g', device: 'mobile', throttling: 'mobile3G' },
    { key: 'desktop-broadband', device: 'desktop', throttling: 'broadband' },
  ],
  runs: 3,
  aggregation: 'median',
  saveHtml: true,
};

function parseIntEnv(key: string, fallback: number): number {
  const v = parseInt(process.env[key] || '', 10);
  return Number.isFinite(v) && v >= 1 ? v : fallback;
}

export function loadWebPerfPlan(): WebPerfPlan {
  const plan: WebPerfPlan = {
    urls: [...DEFAULT_PLAN.urls],
    profiles: DEFAULT_PLAN.profiles.map((p) => ({ ...p })),
    runs: DEFAULT_PLAN.runs,
    aggregation: DEFAULT_PLAN.aggregation,
    saveHtml: DEFAULT_PLAN.saveHtml,
  };

  const configPath =
    process.env.WEB_PERF_CONFIG || path.join(process.cwd(), 'tests/config/web-perf.json');

  if (fs.existsSync(configPath)) {
    try {
      const raw = JSON.parse(fs.readFileSync(configPath, 'utf8')) as Partial<WebPerfPlan>;
      if (Array.isArray(raw.urls) && raw.urls.length > 0) {
        plan.urls = raw.urls.map((u) => String(u).trim()).filter(Boolean);
      }
      if (Array.isArray(raw.profiles) && raw.profiles.length > 0) {
        plan.profiles = raw.profiles.map((p) => ({
          key: String(p.key),
          device: p.device,
          throttling: p.throttling,
        }));
      }
      if (typeof raw.runs === 'number' && raw.runs >= 1) plan.runs = Math.floor(raw.runs);
      if (raw.aggregation === 'mean' || raw.aggregation === 'median') plan.aggregation = raw.aggregation;
      if (typeof raw.saveHtml === 'boolean') plan.saveHtml = raw.saveHtml;
      if (raw.discover && typeof raw.discover === 'object') plan.discover = raw.discover;
    } catch {
      // keep defaults
    }
  }

  const multi = process.env.TARGET_WEB_URLS?.trim();
  if (multi) {
    plan.urls = multi.split(',').map((u) => u.trim()).filter(Boolean);
  }

  const single = process.env.TARGET_WEB_URL?.trim();
  if (single && !multi) {
    plan.urls = [single];
  }

  plan.runs = parseIntEnv('LIGHTHOUSE_RUNS', plan.runs);

  const agg = process.env.LIGHTHOUSE_AGGREGATION;
  if (agg === 'mean' || agg === 'median') plan.aggregation = agg;

  if (process.env.LIGHTHOUSE_SAVE_HTML === '0') plan.saveHtml = false;
  if (process.env.LIGHTHOUSE_SAVE_HTML === '1') plan.saveHtml = true;

  return plan;
}

function numEnv(key: string, fallback: number): number {
  const v = parseInt(process.env[key] || '', 10);
  return Number.isFinite(v) ? v : fallback;
}

function floatEnv(key: string, fallback: number): number {
  const v = parseFloat(process.env[key] || '');
  return Number.isFinite(v) ? v : fallback;
}

/** When WEB_PERF_STRICT=1, thresholds apply to every URL × profile result. */
export function getWebPerfThresholds(): WebVitalsThresholds | null {
  if (process.env.WEB_PERF_STRICT !== '1') return null;

  return {
    minPerformanceScore: numEnv('WEB_PERF_MIN_SCORE', 50),
    maxLcpMs: numEnv('WEB_PERF_MAX_LCP_MS', 4000),
    maxFcpMs: numEnv('WEB_PERF_MAX_FCP_MS', 3000),
    maxTbtMs: numEnv('WEB_PERF_MAX_TBT_MS', 600),
    maxTtfbMs: numEnv('WEB_PERF_MAX_TTFB_MS', 600),
    maxTtiMs: numEnv('WEB_PERF_MAX_TTI_MS', 7300),
    maxCls: floatEnv('WEB_PERF_MAX_CLS', 0.25),
    maxSpeedIndexMs: numEnv('WEB_PERF_MAX_SPEED_INDEX_MS', 5800),
  };
}

/** Percent tolerance for LCP/FCP/TTI/TBT/TTFB/SpeedIndex regressions (default 10). */
export function getWebPerfRegressionTolerancePct(): number {
  const v = floatEnv('WEB_PERF_REGRESSION_TOLERANCE_PCT', 10);
  return Math.max(0, v);
}

export function getWebPerfBaselinePath(): string | null {
  const p = process.env.WEB_PERF_BASELINE_PATH?.trim();
  return p || null;
}

/** When set with WEB_PERF_BASELINE_PATH, exit code 1 if any regression is detected. */
export function shouldFailOnBaselineRegression(): boolean {
  return process.env.WEB_PERF_FAIL_ON_BASELINE_REGRESSION === '1';
}

export function webPerfSessionDir(baseResultsDir: string): string {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return path.join(baseResultsDir, 'web-perf', stamp);
}
