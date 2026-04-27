/**
 * Generated Test Example (default config + Cursor agent for variations)
 *
 * Histórico: este exemplo usava um provedor LLM externo para "gerar"
 * variações da requisição. A política corporativa proíbe LLMs de terceiros,
 * então a geração agora usa um template padrão. Para variações criativas,
 * peça ao agente do Cursor diretamente no chat.
 *
 * Run with: ts-node tests/examples/03-ai-generated-test.perf.ts
 */

import '../../src/config/env';
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../../src/config/env';
import { httpEngine } from '../../src/engines/http-engine';
import { testGenerator } from '../../src/generators/test-generator';
import { resultParser } from '../../src/parsers/result-parser';
import { logger } from '../../src/utils/logger';

async function runAiGeneratedTest() {
  try {
    logger.title('Generated Performance Test (default config)');

    logger.section('Step 1: Generating default test request');
    logger.info('Using built-in default template (no third-party LLM).');

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

    logger.section('Step 3: Analysis of Results');

    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const sessionDir = path.join(config.resultsDir, 'api', `generated-${stamp}`);
    fs.mkdirSync(sessionDir, { recursive: true });

    const analysis = await resultParser.analyzeResults(
      result.stats,
      { scenario: 'load-test', apiEndpoint: 'http://localhost:3000/users/1' },
      { outputDir: sessionDir }
    );

    console.log(`\n📊 Analysis Summary:`);
    console.log(`${analysis.summary}\n`);

    if (analysis.issues.length > 0 && analysis.issues[0] !== 'None detected') {
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

    if (analysis.nextSteps.length > 0) {
      console.log('\n📋 Next steps:');
      analysis.nextSteps.forEach((s) => console.log(`   - ${s}`));
    }

    logger.success('Generated test completed!');
    process.exit(0);
  } catch (error) {
    logger.error('Test failed:', error);
    process.exit(1);
  }
}

runAiGeneratedTest();
