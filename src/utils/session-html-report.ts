import * as fs from 'fs';
import * as path from 'path';
import { WebPerfEntry } from '../engines/web-perf-runner';
import { LighthouseMetrics } from '../engines/lighthouse-engine';
import { AnalysisInsight } from '../parsers/result-parser';

interface SessionReportInput {
  sessionDir: string;
  createdAt: string;
  entries: WebPerfEntry[];
  resolvedUrls: string[];
  discoveryLog?: string;
  /** Análise IA da sessão inteira (padrões cross-URL). */
  sessionAnalysis?: AnalysisInsight;
  /** Análise IA do pior cenário individual. */
  worstAnalysis?: { insight: AnalysisInsight; url: string; profileKey: string; score: number };
  /** Mensagens de regressão detectadas contra baseline. */
  baselineRegressions?: string[];
  /** Caminho do baseline comparado (para exibir origem). */
  baselinePath?: string;
  /** Falhas de threshold (WEB_PERF_STRICT). */
  thresholdFailures?: string[];
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function tone(v: number, good: number, poor: number): 'good' | 'warn' | 'bad' {
  if (v <= good) return 'good';
  if (v <= poor) return 'warn';
  return 'bad';
}

function scoreTone(v: number): 'good' | 'warn' | 'bad' {
  if (v >= 90) return 'good';
  if (v >= 50) return 'warn';
  return 'bad';
}

function metricCell(
  label: string,
  value: number | string,
  toneClass: 'good' | 'warn' | 'bad',
  unit = 'ms'
): string {
  const display = typeof value === 'number' && unit === 'ms' ? `${value}${unit}` : String(value);
  return `<div class="metric ${toneClass}"><span class="m-label">${label}</span><span class="m-value">${display}</span></div>`;
}

function buildEntryBlock(entry: WebPerfEntry, slug: string): string {
  const m = entry.result.metrics;
  const opps = entry.result.opportunities.length
    ? `<ul class="opps">${entry.result.opportunities.map((o) => `<li>${escapeHtml(o)}</li>`).join('')}</ul>`
    : '<p class="muted">Nenhuma oportunidade relevante</p>';

  const perRun = entry.result.runMetrics
    ? `<p class="muted">Per-run LCP (ms): ${entry.result.runMetrics.map((r) => r.lcpMs).join(', ')}</p>`
    : '';

  return `<section class="entry">
    <header>
      <h3><a href="${escapeHtml(entry.url)}" target="_blank" rel="noopener">${escapeHtml(entry.url)}</a></h3>
      <span class="profile">${escapeHtml(entry.profileKey)} · ${escapeHtml(entry.device)} / ${escapeHtml(entry.throttling)}</span>
    </header>
    <div class="metrics">
      ${metricCell('Score', `${m.performanceScore}/100`, scoreTone(m.performanceScore), '')}
      ${metricCell('FCP', m.fcpMs, tone(m.fcpMs, 1800, 3000))}
      ${metricCell('LCP', m.lcpMs, tone(m.lcpMs, 2500, 4000))}
      ${metricCell('TTI', m.ttiMs, tone(m.ttiMs, 3800, 7300))}
      ${metricCell('TBT', m.tbtMs, tone(m.tbtMs, 200, 600))}
      ${metricCell('CLS', m.cls.toFixed(3), tone(m.cls, 0.1, 0.25), '')}
      ${metricCell('Speed Index', m.speedIndexMs, tone(m.speedIndexMs, 3400, 5800))}
      ${metricCell('TTFB', m.ttfbMs, tone(m.ttfbMs, 200, 600))}
    </div>
    ${perRun}
    <h4>Top opportunities</h4>
    ${opps}
    <p class="muted">
      Artefatos:
      <a href="./${slug}.report.html" target="_blank">HTML</a> ·
      <a href="./${slug}.metrics.json" target="_blank">metrics.json</a> ·
      <a href="./${slug}.lhr.json" target="_blank">lhr.json</a>
    </p>
  </section>`;
}

function buildSummaryTable(entries: WebPerfEntry[]): string {
  const rows = entries
    .map((e) => {
      const m = e.result.metrics;
      return `<tr>
        <td>${escapeHtml(e.url)}</td>
        <td>${escapeHtml(e.profileKey)}</td>
        <td class="num ${scoreTone(m.performanceScore)}">${m.performanceScore}</td>
        <td class="num ${tone(m.lcpMs, 2500, 4000)}">${m.lcpMs}</td>
        <td class="num ${tone(m.tbtMs, 200, 600)}">${m.tbtMs}</td>
        <td class="num ${tone(m.ttfbMs, 200, 600)}">${m.ttfbMs}</td>
        <td class="num ${tone(m.cls, 0.1, 0.25)}">${m.cls.toFixed(3)}</td>
      </tr>`;
    })
    .join('');

  return `<table class="summary">
    <thead>
      <tr><th>URL</th><th>Perfil</th><th>Score</th><th>LCP (ms)</th><th>TBT (ms)</th><th>TTFB (ms)</th><th>CLS</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>`;
}

function slugForUrlProfile(url: string, profileKey: string): string {
  const hostPath = url
    .replace(/^https?:\/\//i, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 72);
  return `${hostPath || 'url'}__${profileKey}`.replace(/_+/g, '_');
}

function buildInsightBlock(title: string, insight: AnalysisInsight, subtitle?: string): string {
  const section = (label: string, items: string[], icon: string) => {
    if (!items || items.length === 0) return '';
    if (items.length === 1 && (items[0] === 'No critical issues detected' || items[0] === 'None detected')) return '';
    return `<div class="ai-section">
      <h4>${icon} ${label}</h4>
      <ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
    </div>`;
  };

  return `<section class="ai-block">
    <header>
      <h3>${escapeHtml(title)}</h3>
      ${subtitle ? `<span class="ai-sub">${escapeHtml(subtitle)}</span>` : ''}
    </header>
    <p class="ai-summary">${escapeHtml(insight.summary)}</p>
    ${section('Issues identificados', insight.issues, '⚠️')}
    ${section('Recomendações', insight.recommendations, '💡')}
    ${section('Próximos passos', insight.nextSteps, '📋')}
  </section>`;
}

function buildAlertBlock(title: string, items: string[], variant: 'error' | 'warn'): string {
  if (!items || items.length === 0) return '';
  return `<section class="alert ${variant}">
    <h3>${escapeHtml(title)}</h3>
    <ul>${items.map((i) => `<li>${escapeHtml(i)}</li>`).join('')}</ul>
  </section>`;
}

export function writeSessionHtmlReport(input: SessionReportInput): string {
  const {
    sessionDir, createdAt, entries, resolvedUrls, discoveryLog,
    sessionAnalysis, worstAnalysis, baselineRegressions, baselinePath, thresholdFailures,
  } = input;

  const urlsBlock = resolvedUrls.map((u, i) => `<li>${i + 1}. ${escapeHtml(u)}</li>`).join('');
  const entriesHtml = entries.map((e) => buildEntryBlock(e, slugForUrlProfile(e.url, e.profileKey))).join('\n');

  const avgScore = entries.length
    ? Math.round(entries.reduce((a, e) => a + e.result.metrics.performanceScore, 0) / entries.length)
    : 0;

  const thresholdBlock = buildAlertBlock(
    `Limites WEB_PERF_STRICT violados (${(thresholdFailures ?? []).length})`,
    thresholdFailures ?? [],
    'error'
  );

  const baselineBlock = (baselineRegressions && baselineRegressions.length > 0)
    ? buildAlertBlock(
        `Regressões contra baseline${baselinePath ? ` (${baselinePath})` : ''}`,
        baselineRegressions,
        'warn'
      )
    : baselinePath
      ? `<section class="alert ok"><h3>Baseline (${escapeHtml(baselinePath)})</h3><p>Nenhuma regressão detectada.</p></section>`
      : '';

  const aiBlocks = [
    sessionAnalysis ? buildInsightBlock('Análise IA — Sessão completa', sessionAnalysis, 'Padrões cross-URL') : '',
    worstAnalysis
      ? buildInsightBlock(
          'Análise IA — Pior cenário',
          worstAnalysis.insight,
          `${worstAnalysis.url} [${worstAnalysis.profileKey}] — ${worstAnalysis.score}/100`
        )
      : '',
  ].filter(Boolean).join('\n');

  const html = `<!doctype html>
<html lang="pt-br">
<head>
<meta charset="utf-8">
<title>Web Performance Session Report</title>
<style>
  :root {
    --good: #12a150; --warn: #d97706; --bad: #dc2626;
    --muted: #6b7280; --bg: #f8fafc; --card: #ffffff; --border: #e5e7eb;
  }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; background: var(--bg); color: #111827; line-height: 1.5; }
  header.page { background: #0f172a; color: white; padding: 24px 40px; }
  header.page h1 { margin: 0 0 8px; font-size: 22px; }
  header.page p { margin: 4px 0; color: #cbd5e1; font-size: 14px; }
  main { padding: 24px 40px; max-width: 1200px; margin: 0 auto; }
  h2 { font-size: 18px; border-bottom: 1px solid var(--border); padding-bottom: 6px; margin-top: 32px; }
  .muted { color: var(--muted); font-size: 13px; }
  ul.urls { columns: 2; column-gap: 32px; }
  table.summary { width: 100%; border-collapse: collapse; margin-top: 8px; background: var(--card); box-shadow: 0 1px 2px rgba(0,0,0,.05); border-radius: 8px; overflow: hidden; }
  table.summary th, table.summary td { padding: 10px 12px; text-align: left; border-bottom: 1px solid var(--border); font-size: 14px; }
  table.summary th { background: #f1f5f9; font-weight: 600; }
  table.summary td.num { text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
  table.summary td.good { color: var(--good); } table.summary td.warn { color: var(--warn); } table.summary td.bad { color: var(--bad); }
  section.entry { background: var(--card); border: 1px solid var(--border); border-radius: 8px; padding: 20px; margin-bottom: 16px; }
  section.entry header { display: flex; justify-content: space-between; align-items: baseline; gap: 16px; flex-wrap: wrap; }
  section.entry header h3 { margin: 0; font-size: 16px; word-break: break-all; }
  section.entry header h3 a { color: #2563eb; text-decoration: none; } section.entry header h3 a:hover { text-decoration: underline; }
  span.profile { font-size: 12px; color: var(--muted); background: #f1f5f9; padding: 4px 8px; border-radius: 4px; }
  .metrics { display: grid; grid-template-columns: repeat(auto-fill, minmax(130px, 1fr)); gap: 8px; margin: 16px 0; }
  .metric { background: #f8fafc; padding: 10px 12px; border-radius: 6px; border-left: 3px solid var(--muted); display: flex; flex-direction: column; }
  .metric.good { border-left-color: var(--good); } .metric.warn { border-left-color: var(--warn); } .metric.bad { border-left-color: var(--bad); }
  .m-label { font-size: 11px; text-transform: uppercase; color: var(--muted); letter-spacing: .04em; }
  .m-value { font-size: 16px; font-weight: 600; font-variant-numeric: tabular-nums; }
  .metric.good .m-value { color: var(--good); } .metric.warn .m-value { color: var(--warn); } .metric.bad .m-value { color: var(--bad); }
  h4 { margin: 12px 0 6px; font-size: 14px; }
  ul.opps { margin: 0; padding-left: 20px; font-size: 14px; }
  ul.opps li { margin: 2px 0; }
  .stat-strip { display: flex; gap: 16px; margin-top: 8px; flex-wrap: wrap; }
  .stat-strip .pill { background: #1e293b; color: white; padding: 6px 12px; border-radius: 999px; font-size: 13px; }
  .stat-strip .pill strong { font-variant-numeric: tabular-nums; }
  section.ai-block { background: var(--card); border: 1px solid var(--border); border-left: 4px solid #6366f1; border-radius: 8px; padding: 20px; margin-bottom: 16px; }
  section.ai-block header { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 12px; margin-bottom: 8px; }
  section.ai-block h3 { margin: 0; font-size: 16px; }
  section.ai-block .ai-sub { font-size: 13px; color: var(--muted); }
  section.ai-block .ai-summary { font-size: 15px; line-height: 1.6; margin: 0 0 12px; padding: 12px; background: #eef2ff; border-radius: 6px; color: #312e81; }
  .ai-section { margin-top: 10px; }
  .ai-section h4 { margin: 0 0 4px; font-size: 13px; color: #374151; }
  .ai-section ul { margin: 0; padding-left: 22px; font-size: 14px; }
  .ai-section li { margin: 3px 0; line-height: 1.5; }
  section.alert { border-radius: 8px; padding: 16px 20px; margin-bottom: 16px; border-left: 4px solid; }
  section.alert.error { background: #fef2f2; border-left-color: var(--bad); color: #7f1d1d; }
  section.alert.warn { background: #fffbeb; border-left-color: var(--warn); color: #78350f; }
  section.alert.ok { background: #ecfdf5; border-left-color: var(--good); color: #064e3b; }
  section.alert h3 { margin: 0 0 8px; font-size: 14px; }
  section.alert ul { margin: 0; padding-left: 22px; font-size: 14px; }
</style>
</head>
<body>
<header class="page">
  <h1>Web Performance Session Report</h1>
  <p><strong>Gerado em:</strong> ${escapeHtml(createdAt)}</p>
  ${discoveryLog ? `<p><strong>Descoberta:</strong> ${escapeHtml(discoveryLog)}</p>` : ''}
  <div class="stat-strip">
    <span class="pill">Cenários: <strong>${entries.length}</strong></span>
    <span class="pill">URLs: <strong>${resolvedUrls.length}</strong></span>
    <span class="pill">Score médio: <strong>${avgScore}/100</strong></span>
  </div>
</header>
<main>
  ${thresholdBlock}
  ${baselineBlock}
  ${aiBlocks ? `<h2>Análise por IA</h2>${aiBlocks}` : ''}

  <h2>URLs testadas</h2>
  <ul class="urls">${urlsBlock}</ul>

  <h2>Resumo (todos os cenários)</h2>
  ${buildSummaryTable(entries)}

  <h2>Detalhes por cenário</h2>
  ${entriesHtml}
</main>
</body>
</html>`;

  const reportPath = path.join(sessionDir, 'session-report.html');
  fs.writeFileSync(reportPath, html, 'utf8');
  return reportPath;
}
