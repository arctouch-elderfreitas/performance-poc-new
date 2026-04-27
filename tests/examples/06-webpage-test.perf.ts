/**
 * Webpage Performance Test — Lighthouse
 *
 * - Plan from tests/config/web-perf.json + env overrides (URLs, runs, aggregation)
 * - Multiple URLs × profiles, Chrome reused within each Lighthouse batch
 * - Median/mean across runs; artifacts: .lhr.json, .metrics.json, .report.html
 * - session-summary.json for baselines / CI
 * - Optional WEB_PERF_STRICT thresholds; optional baseline regression check
 *
 * Run with: npm run example:webpage
 */

import * as fs from 'fs';
import * as path from 'path';
import '../../src/config/env';
import { config } from '../../src/config/env';
import {
  getWebPerfBaselinePath,
  getWebPerfRegressionTolerancePct,
  getWebPerfThresholds,
  loadWebPerfPlan,
  shouldFailOnBaselineRegression,
  WebPerfProfile,
} from '../../src/config/web-perf';
import { LighthouseResult } from '../../src/engines/lighthouse-engine';
import { compareSessionToBaseline, WebPerfEntry, WebPerfSessionSummaryV1, runWebPerfSession } from '../../src/engines/web-perf-runner';
import { resultParser, AnalysisInsight } from '../../src/parsers/result-parser';
import { logger } from '../../src/utils/logger';
import { checkWebVitals } from '../../src/utils/web-vitals-assert';
import { writeSessionHtmlReport } from '../../src/utils/session-html-report';

function scoreLabel(score: number): string {
  if (score >= 90) return '🟢 Good';
  if (score >= 50) return '🟡 Needs Improvement';
  return '🔴 Poor';
}

function metricLabel(value: number, good: number, poor: number): string {
  if (value <= good) return '🟢';
  if (value <= poor) return '🟡';
  return '🔴';
}

function printResults(result: LighthouseResult, titleExtra: string): void {
  const { metrics } = result;

  logger.section(`Lighthouse — ${titleExtra}`);
  console.log(`  ${result.labContext}`);
  console.log(`\n  Performance Score: ${metrics.performanceScore}/100  ${scoreLabel(metrics.performanceScore)}\n`);

  console.log('  Core Web Vitals (aggregated):');
  console.log(`    ${metricLabel(metrics.fcpMs, 1800, 3000)} FCP  (First Contentful Paint):  ${metrics.fcpMs}ms`);
  console.log(`    ${metricLabel(metrics.lcpMs, 2500, 4000)} LCP  (Largest Contentful Paint): ${metrics.lcpMs}ms`);
  console.log(`    ${metricLabel(metrics.ttiMs, 3800, 7300)} TTI  (Time to Interactive):      ${metrics.ttiMs}ms`);
  console.log(`    ${metricLabel(metrics.tbtMs, 200, 600)} TBT  (Total Blocking Time):      ${metrics.tbtMs}ms`);
  console.log(`    ${metricLabel(metrics.cls, 0.1, 0.25)} CLS  (Layout Shift):             ${metrics.cls.toFixed(3)}`);
  console.log(`    ${metricLabel(metrics.speedIndexMs, 3400, 5800)} Speed Index:                   ${metrics.speedIndexMs}ms`);
  console.log(`    ${metricLabel(metrics.ttfbMs, 200, 600)} TTFB (Time to First Byte):      ${metrics.ttfbMs}ms`);

  if (result.runMetrics && result.runMetrics.length > 1) {
    console.log(`\n  Per-run LCP (ms): ${result.runMetrics.map((m) => m.lcpMs).join(', ')}`);
  }

  if (result.opportunities.length > 0) {
    console.log('\n  Oportunidades de melhoria:');
    result.opportunities.forEach((o, i) => console.log(`    ${i + 1}. ${o}`));
  }
}

function printComparativeForUrl(
  url: string,
  profiles: WebPerfProfile[],
  entries: WebPerfEntry[]
): void {
  const ordered = profiles
    .map((p) => entries.find((e) => e.url === url && e.profileKey === p.key))
    .filter((e): e is WebPerfEntry => Boolean(e));
  if (ordered.length < 2) return;

  const a = ordered[0].result;
  const b = ordered[1].result;
  const labelA = ordered[0].profileKey;
  const labelB = ordered[1].profileKey;

  logger.section(`Comparativo — ${url}`);
  const cw = 20;
  const head = (s: string) => (s.length > cw ? `${s.slice(0, cw - 1)}…` : s).padEnd(cw);
  const header = 'Métrica'.padEnd(28) + head(labelA) + head(labelB);
  console.log('\n' + header);
  console.log('─'.repeat(header.length));

  const cell = (v: number, clsRow: boolean) => {
    const t = clsRow ? v.toFixed(3) : String(v);
    return t.padStart(cw);
  };

  const rows: [string, number, number, boolean][] = [
    ['Performance Score', a.metrics.performanceScore, b.metrics.performanceScore, false],
    ['FCP (ms)', a.metrics.fcpMs, b.metrics.fcpMs, false],
    ['LCP (ms)', a.metrics.lcpMs, b.metrics.lcpMs, false],
    ['TTI (ms)', a.metrics.ttiMs, b.metrics.ttiMs, false],
    ['TBT (ms)', a.metrics.tbtMs, b.metrics.tbtMs, false],
    ['CLS', a.metrics.cls, b.metrics.cls, true],
    ['Speed Index (ms)', a.metrics.speedIndexMs, b.metrics.speedIndexMs, false],
    ['TTFB (ms)', a.metrics.ttfbMs, b.metrics.ttfbMs, false],
  ];

  rows.forEach(([label, va, vb, isCls]) => {
    console.log(label.padEnd(28) + cell(va, isCls) + cell(vb, isCls));
  });
}

function pickWorstForAnalysis(entries: WebPerfEntry[]): LighthouseResult {
  let worst = entries[0].result;
  for (const e of entries) {
    if (e.result.metrics.performanceScore < worst.metrics.performanceScore) {
      worst = e.result;
    }
  }
  return worst;
}

async function runWebpageTest() {
  try {
    const plan = loadWebPerfPlan();
    const urlLabel = plan.discover
      ? `${plan.urls.length} URL(s) explícita(s) + descoberta via sitemap`
      : `${plan.urls.length} URL(s)`;
    logger.title(`Webpage performance — ${urlLabel}, ${plan.profiles.length} profile(s), ${plan.runs} run(s) (${plan.aggregation})`);

    const session = await runWebPerfSession(plan, config.resultsDir);

    if (session.discoveryLog) {
      logger.section('URLs descobertas via Sitemap');
      session.resolvedUrls.forEach((u, i) => console.log(`  ${i + 1}. ${u}`));
    }

    logger.success(`Artifacts: ${session.sessionDir}`);

    for (const e of session.entries) {
      printResults(e.result, `${e.url} — ${e.profileKey}`);
    }

    for (const url of plan.urls) {
      printComparativeForUrl(url, plan.profiles, session.entries);
    }

    // Coletar todos os dados que devem entrar no HTML final
    let thresholdFailures: string[] = [];
    let baselineRegressions: string[] = [];
    let sessionAnalysis: AnalysisInsight | undefined;
    let worstAnalysis: AnalysisInsight | undefined;
    let worstResult: Awaited<ReturnType<typeof pickWorstForAnalysis>> | undefined;
    let failAtEnd = false;

    const thresholds = getWebPerfThresholds();
    if (thresholds) {
      logger.section('Checagem WEB_PERF_STRICT=1');
      for (const e of session.entries) {
        thresholdFailures.push(...checkWebVitals(e.result.metrics, thresholds, `${e.url} [${e.profileKey}]`));
      }
      if (thresholdFailures.length > 0) {
        thresholdFailures.forEach((f) => console.error(f));
        logger.error('Limites de Web Vitals violados.');
        failAtEnd = true;
      } else {
        logger.success('Todos os cenários dentro dos limites configurados.');
      }
    }

    const baselinePath = getWebPerfBaselinePath();
    if (baselinePath) {
      const summaryPath = path.join(session.sessionDir, 'session-summary.json');
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as WebPerfSessionSummaryV1;
      baselineRegressions = compareSessionToBaseline(summary, baselinePath, getWebPerfRegressionTolerancePct());
      if (baselineRegressions.length > 0) {
        logger.section('Comparação com baseline');
        baselineRegressions.forEach((m) => console.warn(`⚠️  ${m}`));
        if (shouldFailOnBaselineRegression()) failAtEnd = true;
      } else {
        logger.success('Nenhuma regressão detectada contra o baseline.');
      }
    }

    const printInsight = (label: string, scoreSuffix: string, insight: AnalysisInsight) => {
      logger.section(`${label}${scoreSuffix}`);
      console.log(`\n📊 ${insight.summary}\n`);
      if (insight.issues[0] !== 'No critical issues detected' && insight.issues.length) {
        console.log('⚠️  Issues:');
        insight.issues.forEach((i) => console.log(`   - ${i}`));
      }
      if (insight.recommendations.length) {
        console.log('\n💡 Recomendações:');
        insight.recommendations.forEach((r) => console.log(`   - ${r}`));
      }
      if (insight.nextSteps.length) {
        console.log('\n📋 Próximos passos:');
        insight.nextSteps.forEach((s) => console.log(`   - ${s}`));
      }
    };

    if (session.entries.length > 1) {
      logger.info('\nPreparando análise de sessão (cross-URL)...');
      sessionAnalysis = await resultParser.analyzeSession(
        session.entries.map((e) => ({
          url: e.url,
          profileKey: e.profileKey,
          device: e.device,
          throttling: e.throttling,
          metrics: e.result.metrics,
          opportunities: e.result.opportunities,
        })),
        { outputDir: session.sessionDir }
      );
      printInsight('Análise — Sessão completa', '', sessionAnalysis);
    }

    worstResult = pickWorstForAnalysis(session.entries);
    logger.info('\nPreparando análise do pior cenário individual...');
    worstAnalysis = await resultParser.analyzeLighthouseResults(
      worstResult,
      { outputDir: session.sessionDir }
    );
    printInsight('Análise — pior cenário', ` (${worstResult.metrics.performanceScore}/100)`, worstAnalysis);

    // Reescrever o HTML consolidado com análise IA + baseline + thresholds
    const worstEntry = session.entries.find((e) => e.result === worstResult);
    const reportPath = writeSessionHtmlReport({
      sessionDir: session.sessionDir,
      createdAt: session.createdAt,
      entries: session.entries,
      resolvedUrls: session.resolvedUrls,
      discoveryLog: session.discoveryLog,
      sessionAnalysis,
      worstAnalysis: worstAnalysis && worstEntry ? {
        insight: worstAnalysis,
        url: worstEntry.url,
        profileKey: worstEntry.profileKey,
        score: worstResult.metrics.performanceScore,
      } : undefined,
      thresholdFailures,
      baselineRegressions,
      baselinePath: baselinePath ?? undefined,
    });
    logger.success(`\nRelatório final: ${reportPath}`);

    if (failAtEnd) {
      logger.error('Execução terminou com falhas (thresholds/baseline).');
      process.exit(1);
    }

    logger.success('Webpage test concluído!');
    process.exit(0);
  } catch (error) {
    logger.error('Teste falhou:', error);
    process.exit(1);
  }
}

runWebpageTest();
