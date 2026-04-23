import * as https from 'https';
import * as http from 'http';
import { URL } from 'url';
import { config } from '../config/env';
import { logger } from './logger';

export interface RequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  url: string;
  headers?: Record<string, string>;
  data?: unknown;
  timeout?: number;
}

export interface PerformanceMetrics {
  statusCode: number;
  responseTimeMs: number;
  contentLengthBytes: number;
  timestamp: Date;
  success: boolean;
  error?: string;
}

export class HttpClient {
  async executeRequest(requestConfig: RequestConfig): Promise<PerformanceMetrics> {
    const startTime = Date.now();

    try {
      const url = new URL(requestConfig.url);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const responseData = await this.makeRequest(client, {
        hostname: url.hostname,
        port: url.port,
        path: url.pathname + url.search,
        method: requestConfig.method,
        headers: {
          'User-Agent': 'performance-testing-poc/0.1.0',
          ...requestConfig.headers,
        },
        timeout: requestConfig.timeout || config.defaultTimeoutMs,
      }, requestConfig.data);

      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;
      const contentLengthBytes = responseData.body.length;

      return {
        statusCode: responseData.statusCode,
        responseTimeMs,
        contentLengthBytes,
        timestamp: new Date(),
        success: responseData.statusCode >= 200 && responseData.statusCode < 300,
      };
    } catch (error) {
      const endTime = Date.now();
      const responseTimeMs = endTime - startTime;

      return {
        statusCode: 0,
        responseTimeMs,
        contentLengthBytes: 0,
        timestamp: new Date(),
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private makeRequest(
    client: typeof https | typeof http,
    options: https.RequestOptions,
    data?: unknown
  ): Promise<{ statusCode: number; body: string }> {
    return new Promise((resolve, reject) => {
      const request = client.request(options, (response) => {
        let body = '';

        response.on('data', (chunk) => {
          body += chunk;
        });

        response.on('end', () => {
          resolve({
            statusCode: response.statusCode || 0,
            body: body,
          });
        });
      });

      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });

      if (data) {
        const dataStr = typeof data === 'string' ? data : JSON.stringify(data);
        request.write(dataStr);
      }

      request.end();
    });
  }

  async executeParallel(
    requests: RequestConfig[],
    options: { concurrency?: number } = {}
  ): Promise<PerformanceMetrics[]> {
    const { concurrency = 10 } = options;
    const results: PerformanceMetrics[] = [];
    const batches = [];

    for (let i = 0; i < requests.length; i += concurrency) {
      batches.push(requests.slice(i, i + concurrency));
    }

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      logger.debug(
        `Executing batch ${batchIndex + 1}/${batches.length} (${batch.length} requests)`
      );

      const batchResults = await Promise.all(
        batch.map((request) => this.executeRequest(request))
      );
      results.push(...batchResults);
    }

    return results;
  }
}

export const httpClient = new HttpClient();
