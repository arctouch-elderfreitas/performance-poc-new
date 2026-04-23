/**
 * Chaos × Web — Impacto de condições adversas da API no Lighthouse
 *
 * Mede como a injeção de chaos na API local afeta o LCP/TTI/TBT da página web
 * que consome essa API. Fluxo:
 *   1. Reset do chaos — Lighthouse na /demo (baseline)
 *   2. Injeta 300ms de latência + 10% de erros — Lighthouse de novo
 *   3. Reset — comparação lado a lado
 *   4. Análise IA do delta
 *
 * Pré-requisito: mock API rodando em http://localhost:3000 (cd api && npm run dev)
 *
 * Run with: npm run example:chaos-web
 */

import '../../src/config/env';
import * as http from 'http';
import { runLighthouse, LighthouseResult } from '../../src/engines/lighthouse-engine';
import { resultParser } from '../../src/parsers/result-parser';
import { logger } from '../../src/utils/logger';

const DEMO_URL = 'http://localhost:3000/demo/';

function postJSON(path: string, body: object): Promise<void> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      {
        hostname: 'localhost',
        port: 3000,
        path,
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) },
      },
      (res) => { res.resume(); res.on('end', resolve); }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function checkApiReady(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get({ hostname: 'localhost', port: 3000, path: '/health', timeout: 2000 }, (res) => {
      res.resume();
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

function metricTone(v: number, good: number, poor: number): string {
  if (v <= good) return '🟢';
  if (v <= poor) return '🟡';
  return '🔴';
}

function printMetrics(label: string, result: LighthouseResult): void {
  const m = result.metrics;
  logger.section(label);
  console.log(`  Score: ${m.performanceScore}/100`);
  console.log(`  ${metricTone(m.fcpMs, 1800, 3000)} FCP: ${m.fcpMs}ms`);
  console.log(`  ${metricTone(m.lcpMs, 2500, 4000)} LCP: ${m.lcpMs}ms`);
  console.log(`  ${metricTone(m.tbtMs, 200, 600)} TBT: ${m.tbtMs}ms`);
  console.log(`  ${metricTone(m.ttfbMs, 200, 600)} TTFB: ${m.ttfbMs}ms`);
  console.log(`  ${metricTone(m.speedIndexMs, 3400, 5800)} Speed Index: ${m.speedIndexMs}ms`);
}

function printDelta(baseline: LighthouseResult, chaos: LighthouseResult): void {
  logger.section('Delta — Baseline vs Chaos');
  const b = baseline.metrics;
  const c = chaos.metrics;

  const rows: [string, number, number][] = [
    ['Score',            b.performanceScore, c.performanceScore],
    ['FCP (ms)',         b.fcpMs,             c.fcpMs],
    ['LCP (ms)',         b.lcpMs,             c.lcpMs],
    ['TBT (ms)',         b.tbtMs,             c.tbtMs],
    ['TTFB (ms)',        b.ttfbMs,            c.ttfbMs],
    ['Speed Index (ms)', b.speedIndexMs,      c.speedIndexMs],
  ];

  const header = 'Métrica'.padEnd(20) + 'Baseline'.padStart(12) + 'Chaos'.padStart(12) + 'Δ'.padStart(12);
  console.log('\n' + header);
  console.log('─'.repeat(header.length));
  rows.forEach(([label, bv, cv]) => {
    const delta = cv - bv;
    const sign = delta > 0 ? '+' : '';
    console.log(label.padEnd(20) + String(bv).padStart(12) + String(cv).padStart(12) + `${sign}${delta}`.padStart(12));
  });
}

async function runChaosWebTest() {
  try {
    logger.title('Chaos × Web — Impacto da API no desempenho da página');

    const apiUp = await checkApiReady();
    if (!apiUp) {
      logger.error('API mock não respondeu em http://localhost:3000. Rode "cd api && npm run dev" primeiro.');
      process.exit(1);
    }

    // --- Cenário 1: Baseline ---
    logger.info('\n[1/2] Baseline — sem chaos');
    await postJSON('/control/reset', {});
    const baseline = await runLighthouse({
      url: DEMO_URL,
      device: 'mobile',
      throttling: 'mobile3G',
      runs: 1,
    });
    printMetrics('Baseline', baseline);

    // --- Cenário 2: Chaos ativado ---
    logger.info('\n[2/2] Chaos — latência 300ms + 10% de erros na API');
    await postJSON('/control/config', {
      global: { latencyMs: 300, latencyJitterMs: 50, errorRate: 0.1 },
    });
    const chaos = await runLighthouse({
      url: DEMO_URL,
      device: 'mobile',
      throttling: 'mobile3G',
      runs: 1,
    });
    printMetrics('Chaos', chaos);

    // Reset final — importante para não deixar o mock degradado
    await postJSON('/control/reset', {});

    printDelta(baseline, chaos);

    // --- Análise IA ---
    logger.section('Análise IA — impacto do chaos');
    logger.info('Enviando para análise...');

    const fakeResult: LighthouseResult = {
      ...chaos,
      labContext:
        chaos.labContext +
        ` Baseline (sem chaos): score ${baseline.metrics.performanceScore}, LCP ${baseline.metrics.lcpMs}ms, TTFB ${baseline.metrics.ttfbMs}ms. ` +
        `Chaos injetado: +300ms latência + 10% erros na API consumida pela página. ` +
        `Foque a análise em explicar qual parte do chaos causou qual variação (LCP vs TTFB vs TBT).`,
    };

    const analysis = await resultParser.analyzeLighthouseResults(fakeResult);

    console.log(`\n📊 ${analysis.summary}\n`);
    if (analysis.issues.length) {
      console.log('⚠️  Impactos detectados:');
      analysis.issues.forEach((i) => console.log(`   - ${i}`));
    }
    if (analysis.recommendations.length) {
      console.log('\n💡 Recomendações:');
      analysis.recommendations.forEach((r) => console.log(`   - ${r}`));
    }

    logger.success('\nChaos × Web concluído!');
    process.exit(0);
  } catch (error) {
    // Tentar resetar o chaos mesmo em caso de erro
    try { await postJSON('/control/reset', {}); } catch { /* ignore */ }
    logger.error('Teste falhou:', error);
    process.exit(1);
  }
}

runChaosWebTest();
