import { PerformanceMetrics } from './http-client';

export interface PerformanceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number;
  avgResponseTimeMs: number;
  minResponseTimeMs: number;
  maxResponseTimeMs: number;
  p50: number;
  p95: number;
  p99: number;
  throughput: number; // requests per second
  avgContentLength: number;
  duration: number; // total time in ms
}

export class MetricsProcessor {
  static process(metrics: PerformanceMetrics[], durationMs: number): PerformanceStats {
    if (metrics.length === 0) {
      return this.emptyStats(durationMs);
    }

    const responseTimes = metrics.map((m) => m.responseTimeMs).sort((a, b) => a - b);
    const contentLengths = metrics.map((m) => m.contentLengthBytes);

    const successCount = metrics.filter((m) => m.success).length;
    const failureCount = metrics.length - successCount;

    return {
      totalRequests: metrics.length,
      successfulRequests: successCount,
      failedRequests: failureCount,
      errorRate: failureCount / metrics.length,
      avgResponseTimeMs: responseTimes.reduce((a, b) => a + b, 0) / metrics.length,
      minResponseTimeMs: Math.min(...responseTimes),
      maxResponseTimeMs: Math.max(...responseTimes),
      p50: this.calculatePercentile(responseTimes, 50),
      p95: this.calculatePercentile(responseTimes, 95),
      p99: this.calculatePercentile(responseTimes, 99),
      throughput: (metrics.length / durationMs) * 1000,
      avgContentLength: contentLengths.reduce((a, b) => a + b, 0) / metrics.length,
      duration: durationMs,
    };
  }

  private static calculatePercentile(sortedData: number[], percentile: number): number {
    const index = Math.ceil((percentile / 100) * sortedData.length) - 1;
    return sortedData[Math.max(0, index)];
  }

  private static emptyStats(durationMs: number): PerformanceStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      errorRate: 0,
      avgResponseTimeMs: 0,
      minResponseTimeMs: 0,
      maxResponseTimeMs: 0,
      p50: 0,
      p95: 0,
      p99: 0,
      throughput: 0,
      avgContentLength: 0,
      duration: durationMs,
    };
  }

  static formatStats(stats: PerformanceStats): string {
    return `
Performance Statistics
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Requests:     ${stats.totalRequests} total | ${stats.successfulRequests} success | ${stats.failedRequests} failed
Error Rate:   ${(stats.errorRate * 100).toFixed(2)}%
Throughput:   ${stats.throughput.toFixed(2)} req/sec
Duration:     ${stats.duration}ms

Response Times (milliseconds)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Average:      ${stats.avgResponseTimeMs.toFixed(2)}ms
Min:          ${stats.minResponseTimeMs.toFixed(2)}ms
Max:          ${stats.maxResponseTimeMs.toFixed(2)}ms
P50 (median): ${stats.p50.toFixed(2)}ms
P95:          ${stats.p95.toFixed(2)}ms
P99:          ${stats.p99.toFixed(2)}ms

Data Transfer
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Avg Content:  ${(stats.avgContentLength / 1024).toFixed(2)} KB
    `;
  }
}
