/**
 * Load Test Example
 *
 * This example demonstrates a more comprehensive load test with:
 * - Multiple endpoints
 * - Realistic payload
 * - Higher concurrent load
 * - Results analysis with AI
 *
 * Run with: npm run example:load
 */

import '../../src/config/env';
import { httpEngine } from '../../src/engines/http-engine';
import { resultParser } from '../../src/parsers/result-parser';
import { logger } from '../../src/utils/logger';

async function runLoadTest() {
  try {
    logger.title('Load Testing - Local API');

    const result = await httpEngine.executeTest({
      name: 'Local API Load Test',
      description: 'Testing multiple endpoints with realistic load (users, products and orders)',
      iterations: 100,
      concurrency: 20,
      warmupIterations: 10,
      requests: [
        {
          method: 'GET',
          url: 'http://localhost:3000/users/1',
          headers: {
            'User-Agent': 'performance-testing-poc/0.1.0',
          },
        },
        {
          method: 'GET',
          url: 'http://localhost:3000/products/1',
          headers: {
            'User-Agent': 'performance-testing-poc/0.1.0',
          },
        },
        {
          method: 'GET',
          url: 'http://localhost:3000/orders/1',
          headers: {
            'User-Agent': 'performance-testing-poc/0.1.0',
          },
        },
      ],
    });

    // Display summary
    logger.section('Test Results Summary');
    console.log(`✓ Test Name: ${result.name}`);
    console.log(`✓ Total Requests: ${result.stats.totalRequests}`);
    console.log(`✓ Success Rate: ${((result.stats.successfulRequests / result.stats.totalRequests) * 100).toFixed(2)}%`);
    console.log(`✓ Average Response Time: ${result.stats.avgResponseTimeMs.toFixed(2)}ms`);
    console.log(`✓ P95: ${result.stats.p95.toFixed(2)}ms`);
    console.log(`✓ P99: ${result.stats.p99.toFixed(2)}ms`);
    console.log(`✓ Throughput: ${result.stats.throughput.toFixed(2)} req/sec`);
    console.log(`✓ Test Duration: ${result.durationMs}ms`);

    // AI Analysis
    logger.section('AI-Powered Analysis');
    logger.info('Analyzing results with Claude AI...');

    const analysis = await resultParser.analyzeResults(result.stats, {
      scenario: 'load-test',
      apiEndpoint: 'http://localhost:3000',
    });

    console.log(`\n📊 Summary: ${analysis.summary}\n`);

    if (analysis.issues.length > 0) {
      console.log('⚠️  Issues Identified:');
      analysis.issues.forEach((issue) => console.log(`   - ${issue}`));
      console.log();
    }

    if (analysis.recommendations.length > 0) {
      console.log('💡 Recommendations:');
      analysis.recommendations.forEach((rec) => console.log(`   - ${rec}`));
      console.log();
    }

    if (analysis.nextSteps.length > 0) {
      console.log('📋 Next Steps:');
      analysis.nextSteps.forEach((step) => console.log(`   - ${step}`));
    }

    logger.success('Load test completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Load test failed:', error);
    process.exit(1);
  }
}

runLoadTest();
