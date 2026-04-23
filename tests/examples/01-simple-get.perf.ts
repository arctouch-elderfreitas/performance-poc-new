/**
 * Simple GET Request Performance Test
 *
 * This example runs a basic performance test against JSONPlaceholder API.
 * It demonstrates:
 * - Simple GET request test
 * - Basic metrics collection
 * - Results reporting
 *
 * Run with: npm run example:simple
 */

import '../../src/config/env';
import { httpEngine } from '../../src/engines/http-engine';
import { logger } from '../../src/utils/logger';

async function runSimpleGetTest() {
  try {
    logger.title('Simple GET Request Performance Test');

    const result = await httpEngine.executeTest({
      name: 'Local API - Users Endpoint',
      description: 'Testing GET /users/1 endpoint performance',
      iterations: 50,
      concurrency: 10,
      warmupIterations: 5,
      requests: [
        {
          method: 'GET',
          url: 'http://localhost:3000/users/1',
          headers: {
            'User-Agent': 'performance-testing-poc/0.1.0',
          },
        },
      ],
    });

    // Display summary
    logger.section('Test Summary');
    console.log(`✓ Test Name: ${result.name}`);
    console.log(`✓ Success Rate: ${((result.stats.successfulRequests / result.stats.totalRequests) * 100).toFixed(2)}%`);
    console.log(`✓ Avg Response Time: ${result.stats.avgResponseTimeMs.toFixed(2)}ms`);
    console.log(`✓ P95: ${result.stats.p95.toFixed(2)}ms`);
    console.log(`✓ Throughput: ${result.stats.throughput.toFixed(2)} req/sec`);

    logger.success('Test completed successfully!');
    process.exit(0);
  } catch (error) {
    logger.error('Test failed:', error);
    process.exit(1);
  }
}

runSimpleGetTest();
