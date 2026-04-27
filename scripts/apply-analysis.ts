/**
 * Apply Cursor Agent Analysis to a Web Performance Session Report
 *
 * Workflow:
 * 1. After running `npm run example:webpage`, the session dir contains:
 *    `pending-analysis/web-session-prompt.md` and/or `web-worst-prompt.md`.
 * 2. The user asks the Cursor agent in chat to analyze those prompts.
 * 3. The agent writes the structured response to:
 *    `pending-analysis/web-session-output.json` and/or `web-worst-output.json`.
 * 4. The user (or the agent) runs:
 *      npm run analysis:apply -- <session-dir>
 *    which re-renders `session-report.html` with the AI insights merged in.
 */

import * as fs from 'fs';
import * as path from 'path';
import { ResultParser, AnalysisInsight } from '../src/parsers/result-parser';
import { writeSessionHtmlReport } from '../src/utils/session-html-report';
import { WebPerfEntry, WebPerfSessionSummaryV1 } from '../src/engines/web-perf-runner';
import { LighthouseResult } from '../src/engines/lighthouse-engine';
import { logger } from '../src/utils/logger';

interface SessionContext {
  sessionDir: string;
  createdAt: string;
  entries: WebPerfEntry[];
  resolvedUrls: string[];
  discoveryLog?: string;
}

function loadSessionContext(sessionDir: string): SessionContext {
  const summaryPath = path.join(sessionDir, 'session-summary.json');
  if (!fs.existsSync(summaryPath)) {
    throw new Error(
      `session-summary.json não encontrado em ${sessionDir}. Esta pasta não parece uma sessão web-perf válida.`
    );
  }
  const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as WebPerfSessionSummaryV1;

  const entries: WebPerfEntry[] = summary.entries.map((e) => ({
    url: e.url,
    profileKey: e.profileKey,
    device: e.device,
    throttling: e.throttling,
    result: {
      url: e.url,
      device: e.device,
      throttling: e.throttling,
      runs: e.runs,
      aggregation: e.aggregation as LighthouseResult['aggregation'],
      labContext: e.labContext,
      metrics: e.metrics,
      opportunities: e.opportunities,
      diagnostics: e.diagnostics,
      runMetrics: e.runMetrics,
    },
  }));

  return {
    sessionDir,
    createdAt: summary.createdAt,
    entries,
    resolvedUrls: summary.resolvedUrls,
    discoveryLog: summary.discoveryLog,
  };
}

function loadInsightIfExists(filePath: string): AnalysisInsight | undefined {
  if (!fs.existsSync(filePath)) return undefined;
  try {
    return ResultParser.loadAgentInsight(filePath);
  } catch (error) {
    logger.warn(`Falha ao carregar ${filePath}: ${error instanceof Error ? error.message : String(error)}`);
    return undefined;
  }
}

function pickWorstEntry(entries: WebPerfEntry[]): WebPerfEntry {
  return entries.reduce((worst, current) =>
    current.result.metrics.performanceScore < worst.result.metrics.performanceScore ? current : worst
  , entries[0]);
}

function applyToSession(sessionDir: string): void {
  logger.title(`Aplicando análise IA do agente Cursor em ${sessionDir}`);

  const ctx = loadSessionContext(sessionDir);
  const pendingDir = path.join(sessionDir, 'pending-analysis');

  const sessionInsight = loadInsightIfExists(path.join(pendingDir, 'web-session-output.json'));
  const worstInsight = loadInsightIfExists(path.join(pendingDir, 'web-worst-output.json'));

  if (!sessionInsight && !worstInsight) {
    logger.warn('Nenhum arquivo de output do agente encontrado em pending-analysis/.');
    logger.info('Esperado: web-session-output.json e/ou web-worst-output.json');
    process.exit(1);
  }

  if (sessionInsight) logger.success('Análise de sessão (cross-URL) carregada');
  if (worstInsight) logger.success('Análise do pior cenário carregada');

  const worstEntry = worstInsight ? pickWorstEntry(ctx.entries) : undefined;

  const reportPath = writeSessionHtmlReport({
    sessionDir: ctx.sessionDir,
    createdAt: ctx.createdAt,
    entries: ctx.entries,
    resolvedUrls: ctx.resolvedUrls,
    discoveryLog: ctx.discoveryLog,
    sessionAnalysis: sessionInsight,
    worstAnalysis: worstInsight && worstEntry ? {
      insight: worstInsight,
      url: worstEntry.url,
      profileKey: worstEntry.profileKey,
      score: worstEntry.result.metrics.performanceScore,
    } : undefined,
  });

  logger.success(`Relatório atualizado: ${reportPath}`);
}

function main(): void {
  const sessionDir = process.argv[2];
  if (!sessionDir) {
    console.error('Uso: npm run analysis:apply -- <session-dir>');
    console.error('Exemplo: npm run analysis:apply -- results/web-perf/2026-04-27T15-00-00-000Z');
    process.exit(1);
  }
  if (!fs.existsSync(sessionDir)) {
    console.error(`Diretório não existe: ${sessionDir}`);
    process.exit(1);
  }

  applyToSession(sessionDir);
}

main();
