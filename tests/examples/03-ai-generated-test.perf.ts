/**
 * AI-Generated Test Example
 *
 * This example demonstrates:
 * - Using Claude to generate test requests
 * - Running generated tests
 * - Analyzing results with AI
 *
 * Run with: ts-node tests/examples/03-ai-generated-test.perf.ts
 */

import '../../src/config/env';
import { httpEngine } from '../../src/engines/http-engine';
import { testGenerator } from '../../src/generators/test-generator';
import { resultParser } from '../../src/parsers/result-parser';
import { logger } from '../../src/utils/logger';

async function runAiGeneratedTest() {
  try {
    logger.title('AI-Generated Performance Test');

    // Step 1: Generate test request using Claude
    logger.section('Step 1: Generating test request with AI');
    logger.info('Using Claude to generate optimal test configuration...');

    const generatedRequest = await testGenerator.generateTestRequest({
      apiEndpoint: 'http://localhost:3000/users/1',
      method: 'GET',
      description: 'Testing a REST API endpoint that returns a user by ID',
      scenario: 'load-test',
      targetRPS: 100,
    });

    console.log(`\n✓ Generated request configuration:`);
    console.log(`  - URL: ${generatedRequest.url}`);
    console.log(`  - Method: ${generatedRequest.method}`);
    console.log(`  - Headers: ${Object.keys(generatedRequest.headers || {}).join(', ')}`);

    // Step 2: Execute the generated test
    logger.section('Step 2: Executing generated test');

    const result = await httpEngine.executeTest({
      name: 'AI-Generated Load Test',
      description: 'Performance test with AI-generated request configuration',
      iterations: 50,
      concurrency: 15,
      warmupIterations: 5,
      requests: [generatedRequest],
    });

    // Step 3: Analyze results
    logger.section('Step 3: AI Analysis of Results');
    logger.info('Analyzing performance metrics with Claude...');

    const analysis = await resultParser.analyzeResults(result.stats, {
      scenario: 'load-test',
      apiEndpoint: 'http://localhost:3000/users/1',
    });

    console.log(`\n📊 Analysis Summary:`);
    console.log(`${analysis.summary}\n`);

    if (analysis.issues.length > 0) {
      console.log('⚠️  Identified Issues:');
      analysis.issues.forEach((issue, idx) => {
        console.log(`${idx + 1}. ${issue}`);
      });
      console.log();
    }

    console.log('💡 Recommendations:');
    analysis.recommendations.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec}`);
    });

    logger.success('AI-generated test completed!');
    process.exit(0);
  } catch (error) {
    logger.error('Test failed:', error);
    process.exit(1);
  }
}

runAiGeneratedTest();
