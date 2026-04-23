/**
 * Public API Performance Test — JSONPlaceholder
 *
 * Testa endpoints reais da internet e compara com a API local.
 *
 * Run with: npm run example:public
 */

import '../../src/config/env';
import { httpEngine } from '../../src/engines/http-engine';
import { resultParser } from '../../src/parsers/result-parser';
import { logger } from '../../src/utils/logger';
import { PerformanceStats } from '../../src/utils/metrics-processor';

const PUBLIC_BASE = 'https://jsonplaceholder.typicode.com';
const LOCAL_BASE = 'http://localhost:3000';

const HEADERS = { 'User-Agent': 'performance-testing-poc/0.1.0' };

const TEST_CONFIG = {
  iterations: 30,
  concurrency: 5, // conservador para não sobrecarregar API pública
  warmupIterations: 3,
};

function printComparison(results: { label: string; stats: PerformanceStats }[]): void {
  logger.section('Comparativo: API Pública vs Local');
  const header = 'Endpoint'.padEnd(22) + 'Avg'.padStart(10) + 'P95'.padStart(10) + 'P99'.padStart(10) + 'Erro%'.padStart(8) + 'RPS'.padStart(8);
  console.log(header);
  console.log('─'.repeat(header.length));
  for (const { label, stats } of results) {
    console.log(
      label.padEnd(22) +
      `${stats.avgResponseTimeMs.toFixed(1)}ms`.padStart(10) +
      `${stats.p95.toFixed(1)}ms`.padStart(10) +
      `${stats.p99.toFixed(1)}ms`.padStart(10) +
      `${(stats.errorRate * 100).toFixed(1)}%`.padStart(8) +
      `${stats.throughput.toFixed(0)}`.padStart(8)
    );
  }
}

async function runPublicApiTest() {
  try {
    logger.title('Public API Test — JSONPlaceholder vs Local');

    const results: { label: string; stats: PerformanceStats }[] = [];

    // --- API Pública ---
    logger.section('Testando JSONPlaceholder (internet)');

    const publicResult = await httpEngine.executeTest({
      name: 'JSONPlaceholder — GET /posts/1',
      description: 'Teste contra API pública real',
      requests: [
        { method: 'GET', url: `${PUBLIC_BASE}/posts/1`, headers: HEADERS },
        { method: 'GET', url: `${PUBLIC_BASE}/users/1`, headers: HEADERS },
        { method: 'GET', url: `${PUBLIC_BASE}/comments/1`, headers: HEADERS },
      ],
      ...TEST_CONFIG,
    });

    results.push({ label: 'JSONPlaceholder', stats: publicResult.stats });
    console.log(`  Avg: ${publicResult.stats.avgResponseTimeMs.toFixed(1)}ms | P95: ${publicResult.stats.p95.toFixed(1)}ms | RPS: ${publicResult.stats.throughput.toFixed(0)}`);

    // --- API Local (baseline de comparação) ---
    logger.section('Testando API Local (localhost)');

    const localResult = await httpEngine.executeTest({
      name: 'Local API — GET /users /products /orders',
      description: 'Baseline local para comparação',
      requests: [
        { method: 'GET', url: `${LOCAL_BASE}/users/1`, headers: HEADERS },
        { method: 'GET', url: `${LOCAL_BASE}/products/1`, headers: HEADERS },
        { method: 'GET', url: `${LOCAL_BASE}/orders/1`, headers: HEADERS },
      ],
      ...TEST_CONFIG,
    });

    results.push({ label: 'Local API', stats: localResult.stats });
    console.log(`  Avg: ${localResult.stats.avgResponseTimeMs.toFixed(1)}ms | P95: ${localResult.stats.p95.toFixed(1)}ms | RPS: ${localResult.stats.throughput.toFixed(0)}`);

    // --- Comparativo ---
    printComparison(results);

    // --- Análise IA da API pública ---
    logger.section('Análise IA — JSONPlaceholder');
    logger.info('Enviando para análise...');

    const analysis = await resultParser.analyzeResults(publicResult.stats, {
      scenario: 'public-api-test',
      apiEndpoint: PUBLIC_BASE,
    });

    console.log(`\n📊 ${analysis.summary}\n`);
    if (analysis.issues[0] !== 'None detected') {
      console.log('⚠️  Issues:');
      analysis.issues.forEach((i) => console.log(`   - ${i}`));
    }
    console.log('\n💡 Recomendações:');
    analysis.recommendations.forEach((r) => console.log(`   - ${r}`));

    logger.success('Teste concluído!');
    process.exit(0);
  } catch (error) {
    logger.error('Teste falhou:', error);
    process.exit(1);
  }
}

runPublicApiTest();
