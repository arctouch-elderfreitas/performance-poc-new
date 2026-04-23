import * as https from 'https';
import { config } from '../config/env';
import { logger } from '../utils/logger';
import { RequestConfig } from '../utils/http-client';

export interface TestGenerationRequest {
  apiEndpoint: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  description?: string;
  scenario?: 'load-test' | 'stress-test' | 'spike-test' | 'soak-test';
  targetRPS?: number;
}

export class TestGenerator {
  async generateTestRequest(request: TestGenerationRequest): Promise<RequestConfig> {
    logger.debug(`Generating test request for ${request.method} ${request.apiEndpoint}`);

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      logger.warn('ANTHROPIC_API_KEY not set. Using default configuration.');
      return this.getDefaultTestRequest(request);
    }

    try {
      const prompt = this.buildPrompt(request);
      const responseText = await this.callAnthropicAPI(apiKey, prompt);

      // Parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        logger.warn('Could not parse JSON from Claude response. Using default.');
        return this.getDefaultTestRequest(request);
      }

      const generatedConfig = JSON.parse(jsonMatch[0]);

      const testRequest: RequestConfig = {
        method: request.method,
        url: request.apiEndpoint,
        headers: generatedConfig.headers || {},
        data: generatedConfig.data || undefined,
      };

      logger.success(`Generated test request for ${request.apiEndpoint}`);
      return testRequest;
    } catch (error) {
      logger.warn(`Failed to generate with AI: ${error instanceof Error ? error.message : String(error)}`);
      return this.getDefaultTestRequest(request);
    }
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

  private callAnthropicAPI(apiKey: string, prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      });

      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            if (parsed.content && parsed.content[0] && parsed.content[0].text) {
              resolve(parsed.content[0].text);
            } else {
              reject(new Error('Unexpected API response format'));
            }
          } catch (e) {
            reject(e);
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  private buildPrompt(request: TestGenerationRequest): string {
    const scenario = request.scenario || 'load-test';
    const targetRPS = request.targetRPS || 100;

    return `You are a performance testing expert. Generate a realistic HTTP ${request.method} request configuration for performance testing.

API Endpoint: ${request.apiEndpoint}
HTTP Method: ${request.method}
Test Scenario: ${scenario}
Target RPS: ${targetRPS}
${request.description ? `Description: ${request.description}` : ''}

Generate a valid JSON object with the following structure (only return the JSON, no markdown):
{
  "headers": {
    "Content-Type": "application/json",
    "User-Agent": "performance-testing-poc"
  },
  "data": ${request.method !== 'GET' ? `{ "test": true }` : 'null'}
}`;
  }
}

export const testGenerator = new TestGenerator();
