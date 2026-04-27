/**
 * Chaos Engineering Test
 *
 * Demonstra o impacto de condições adversas no desempenho da API:
 * 1. Baseline — sem chaos (comportamento normal)
 * 2. Latência — adiciona 200ms ± 50ms de delay
 * 3. Erros — 20% de taxa de erros simulada
 * 4. Combinado — latência + erros ao mesmo tempo
 *
 * Run with: npm run example:chaos
 */

import '../../src/config/env';
import * as fs from 'fs';
import * as http from 'http';
import * as path from 'path';
import { config } from '../../src/config/env';
import { httpEngine } from '../../src/engines/http-engine';
import { resultParser } from '../../src/parsers/result-parser';
import { logger } from '../../src/utils/logger';
import { PerformanceStats } from '../../src/utils/metrics-processor';

const API_BASE = 'http://localhost:3000';

const TEST_REQUESTS = [
  { method: 'GET' as const, url: `${API_BASE}/users/1` },
  { method: 'GET' as const, url: `${API_BASE}/products/1` },
  { method: 'GET' as const, url: `${API_BASE}/orders/1` },
];

const TEST_CONFIG = {
  iterations: 60,
  concurrency: 15,
  warmupIterations: 5,
};

// --- Helpers ---

function postJSON(path: string, body: object): Promise<void> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const req = http.request(
      { hostname: 'localhost', port: 3000, path, method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } },
      (res) => { res.resume(); res.on('end', resolve); }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function resetChaos(): Promise<void> {
  await postJSON('/control/reset', {});
}

async function setChaos(config: object): Promise<void> {
  await postJSON('/control/config', { global: config });
}

function printComparison(results: { label: string; stats: PerformanceStats }[]): void {
  logger.section('Comparativo dos Cenários');
  const header = 'Cenário'.padEnd(20) + 'Avg'.padStart(8) + 'P95'.padStart(8) + 'P99'.padStart(8) + 'Erro%'.padStart(8) + 'RPS'.padStart(10);
  console.log(header);
  console.log('─'.repeat(header.length));
  for (const { label, stats } of results) {
    console.log(
      label.padEnd(20) +
      `${stats.avgResponseTimeMs.toFixed(1)}ms`.padStart(8) +
      `${stats.p95.toFixed(1)}ms`.padStart(8) +
      `${stats.p99.toFixed(1)}ms`.padStart(8) +
      `${(stats.errorRate * 100).toFixed(1)}%`.padStart(8) +
      `${stats.throughput.toFixed(0)}`.padStart(10)
    );
  }
}

// --- Scenarios ---

async function runScenario(name: string, description: string): Promise<PerformanceStats> {
  logger.section(`Cenário: ${name}`);
  const result = await httpEngine.executeTest({
    name,
    description,
    requests: TEST_REQUESTS,
    ...TEST_CONFIG,
  });
  console.log(`  Avg: ${result.stats.avgResponseTimeMs.toFixed(1)}ms | P95: ${result.stats.p95.toFixed(1)}ms | Erro: ${(result.stats.errorRate * 100).toFixed(1)}% | RPS: ${result.stats.throughput.toFixed(0)}`);
  return result.stats;
}

// --- Main ---

async function runChaosTest() {
  try {
    logger.title('Chaos Engineering - Performance Testing');
    await resetChaos();

    const results: { label: string; stats: PerformanceStats }[] = [];

    // 1. Baseline
    results.push({ label: 'Baseline', stats: await runScenario('Baseline', 'Sem chaos — comportamento normal') });

    // 2. Latência
    await setChaos({ latencyMs: 200, latencyVariance: 50 });
    results.push({ label: 'Latência 200ms', stats: await runScenario('Latência', 'Delay artificial de 200ms ± 50ms') });
    await resetChaos();

    // 3. Erros
    await setChaos({ errorRate: 0.2 });
    results.push({ label: 'Erros 20%', stats: await runScenario('Erros', '20% das requisições retornam erro') });
    await resetChaos();

    // 4. Combinado
    await setChaos({ latencyMs: 150, latencyVariance: 30, errorRate: 0.1 });
    results.push({ label: 'Combinado', stats: await runScenario('Combinado', 'Latência 150ms + 10% de erros') });
    await resetChaos();

    // Comparativo
    printComparison(results);

    // Pior cenário: salvar contexto + prompt para análise pelo agente Cursor
    const worst = results.reduce((a, b) => a.stats.p95 > b.stats.p95 ? a : b);

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sessionDir = path.join(config.resultsDir, 'api', `chaos-${stamp}`);
    fs.mkdirSync(sessionDir, { recursive: true });
    fs.writeFileSync(
      path.join(sessionDir, 'comparativo.json'),
      JSON.stringify(results.map((r) => ({ label: r.label, stats: r.stats })), null, 2),
      'utf8'
    );

    logger.section(`Análise — Pior cenário: ${worst.label}`);
    const analysis = await resultParser.analyzeResults(
      worst.stats,
      { scenario: 'chaos-test', apiEndpoint: API_BASE },
      { outputDir: sessionDir }
    );

    console.log(`\n📊 ${analysis.summary}\n`);
    if (analysis.issues[0] !== 'None detected') {
      console.log('⚠️  Issues (regras automatizadas):');
      analysis.issues.forEach((i) => console.log(`   - ${i}`));
    }
    if (analysis.recommendations.length > 0) {
      console.log('\n💡 Recomendações:');
      analysis.recommendations.forEach((r) => console.log(`   - ${r}`));
    }
    if (analysis.nextSteps.length > 0) {
      console.log('\n📋 Próximos passos:');
      analysis.nextSteps.forEach((s) => console.log(`   - ${s}`));
    }

    logger.success('Chaos test concluído!');
    process.exit(0);
  } catch (error) {
    logger.error('Chaos test falhou:', error);
    process.exit(1);
  }
}

runChaosTest();
