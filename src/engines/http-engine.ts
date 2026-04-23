import { httpClient, RequestConfig, PerformanceMetrics } from '../utils/http-client';
import { MetricsProcessor, PerformanceStats } from '../utils/metrics-processor';
import { logger } from '../utils/logger';

export interface PerformanceTestConfig {
  name: string;
  description?: string;
  requests: RequestConfig[];
  iterations: number;
  concurrency: number;
  warmupIterations?: number;
}

export interface PerformanceTestResult {
  name: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  durationMs: number;
  stats: PerformanceStats;
  metrics: PerformanceMetrics[];
}

export class HttpEngine {
  async executeTest(config: PerformanceTestConfig): Promise<PerformanceTestResult> {
    logger.title(`Performance Test: ${config.name}`);

    if (config.description) {
      logger.section(config.description);
    }

    // Warmup iterations (optional)
    if (config.warmupIterations && config.warmupIterations > 0) {
      logger.info(`Running ${config.warmupIterations} warmup iterations...`);
      const warmupRequests = this.generateRequestBatch(
        config.requests,
        config.warmupIterations
      );
      await httpClient.executeParallel(warmupRequests, {
        concurrency: config.concurrency,
      });
      logger.success(`Warmup completed`);
    }

    // Main test
    logger.info(`Running ${config.iterations} iterations with ${config.concurrency} concurrency...`);

    const startTime = new Date();
    const allRequests = this.generateRequestBatch(config.requests, config.iterations);
    const metrics = await httpClient.executeParallel(allRequests, {
      concurrency: config.concurrency,
    });
    const endTime = new Date();
    const durationMs = endTime.getTime() - startTime.getTime();

    // Process stats
    const stats = MetricsProcessor.process(metrics, durationMs);

    // Log results
    logger.success(`Test completed!`);
    console.log(MetricsProcessor.formatStats(stats));

    return {
      name: config.name,
      description: config.description,
      startTime,
      endTime,
      durationMs,
      stats,
      metrics,
    };
  }

  async executeLoadTest(config: {
    name: string;
    baseUrl: string;
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    iterations: number;
    concurrency: number;
    headers?: Record<string, string>;
    body?: unknown;
  }): Promise<PerformanceTestResult> {
    const requests: RequestConfig[] = [];

    for (let i = 0; i < config.iterations; i++) {
      requests.push({
        method: config.method,
        url: `${config.baseUrl}${config.endpoint}`,
        headers: config.headers,
        data: config.body,
      });
    }

    return this.executeTest({
      name: config.name,
      requests,
      iterations: config.iterations,
      concurrency: config.concurrency,
      warmupIterations: 5, // Default warmup
    });
  }

  private generateRequestBatch(
    requests: RequestConfig[],
    iterations: number
  ): RequestConfig[] {
    const batch: RequestConfig[] = [];

    for (let i = 0; i < iterations; i++) {
      for (const request of requests) {
        batch.push(request);
      }
    }

    return batch;
  }
}

export const httpEngine = new HttpEngine();
