import { config } from './config/env';
import { httpEngine } from './engines/http-engine';
import { testGenerator } from './generators/test-generator';
import { resultParser } from './parsers/result-parser';

export {
  // Config
  config,
  // Engines
  httpEngine,
  // Generators
  testGenerator,
  // Parsers
  resultParser,
};

export type { PerformanceTestConfig, PerformanceTestResult } from './engines/http-engine';
export type { TestGenerationRequest } from './generators/test-generator';
export type { AnalysisInsight } from './parsers/result-parser';
export type { PerformanceStats } from './utils/metrics-processor';
export type { PerformanceMetrics, RequestConfig } from './utils/http-client';

// Export utilities
export { logger, Logger } from './utils/logger';
export { MetricsProcessor } from './utils/metrics-processor';
export { httpClient, HttpClient } from './utils/http-client';

// Version
export const version = '0.1.0';
