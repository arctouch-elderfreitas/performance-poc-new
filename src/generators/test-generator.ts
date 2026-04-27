import { logger } from '../utils/logger';
import { RequestConfig } from '../utils/http-client';

export interface TestGenerationRequest {
  apiEndpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description?: string;
  scenario?: 'load-test' | 'stress-test' | 'spike-test' | 'soak-test';
  targetRPS?: number;
}

/**
 * Generates a default request configuration for a given API endpoint.
 *
 * The previous version relied on an external AI provider (Anthropic/Groq) to
 * "generate" the request body and headers. That dependency was removed to
 * comply with the corporate policy that bans third-party LLM APIs. The Cursor
 * agent is now the source of any creative test design — call this generator
 * for the boilerplate config, and ask the agent for variations when needed.
 */
export class TestGenerator {
  async generateTestRequest(request: TestGenerationRequest): Promise<RequestConfig> {
    logger.debug(`Generating default test request for ${request.method} ${request.apiEndpoint}`);
    return this.getDefaultTestRequest(request);
  }

  private getDefaultTestRequest(request: TestGenerationRequest): RequestConfig {
    return {
      method: request.method,
      url: request.apiEndpoint,
      headers: {
        'User-Agent': 'performance-testing-poc/0.1.0',
        'Content-Type': 'application/json',
      },
      data: request.method !== 'GET' ? { test: true } : undefined,
    };
  }
}

export const testGenerator = new TestGenerator();
