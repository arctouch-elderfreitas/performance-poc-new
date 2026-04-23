import * as https from 'https';
import { logger } from '../utils/logger';
import { PerformanceStats } from '../utils/metrics-processor';
import { LighthouseResult } from '../engines/lighthouse-engine';

export interface AnalysisInsight {
  summary: string;
  issues: string[];
  recommendations: string[];
  nextSteps: string[];
}

export class ResultParser {
  async analyzeResults(
    stats: PerformanceStats,
    context?: { apiEndpoint?: string; scenario?: string }
  ): Promise<AnalysisInsight> {
    logger.debug('Analyzing performance results with AI...');

    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    const prompt = this.buildAnalysisPrompt(stats, context);

    if (groqKey) {
      try {
        logger.info('Using Groq AI for analysis...');
        const responseText = await this.callGroqAPI(groqKey, prompt);
        return this.parseAnalysisResponse(responseText);
      } catch (error) {
        logger.warn(`Groq analysis failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (geminiKey) {
      try {
        logger.info('Using Gemini AI for analysis...');
        const responseText = await this.callGeminiAPI(geminiKey, prompt);
        return this.parseAnalysisResponse(responseText);
      } catch (error) {
        logger.warn(`Gemini analysis failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (anthropicKey) {
      try {
        logger.info('Using Anthropic Claude for analysis...');
        const responseText = await this.callAnthropicAPI(anthropicKey, prompt);
        return this.parseAnalysisResponse(responseText);
      } catch (error) {
        logger.warn(`Anthropic analysis failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (!groqKey && !geminiKey && !anthropicKey) {
      logger.warn('No AI API key set (GROQ_API_KEY, GEMINI_API_KEY or ANTHROPIC_API_KEY). Using default analysis.');
    }

    return this.getDefaultAnalysis(stats);
  }

  async analyzeSession(
    entries: Array<{
      url: string;
      profileKey: string;
      device: string;
      throttling: string;
      metrics: LighthouseResult['metrics'];
      opportunities: string[];
    }>
  ): Promise<AnalysisInsight> {
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    const prompt = this.buildSessionPrompt(entries);

    if (groqKey) {
      try {
        logger.info('Using Groq AI for session analysis...');
        const responseText = await this.callGroqAPI(groqKey, prompt);
        return this.parseAnalysisResponse(responseText);
      } catch (error) {
        logger.warn(`Groq session analysis failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (geminiKey) {
      try {
        logger.info('Using Gemini AI for session analysis...');
        const responseText = await this.callGeminiAPI(geminiKey, prompt);
        return this.parseAnalysisResponse(responseText);
      } catch (error) {
        logger.warn(`Gemini session analysis failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (anthropicKey) {
      try {
        logger.info('Using Anthropic Claude for session analysis...');
        const responseText = await this.callAnthropicAPI(anthropicKey, prompt);
        return this.parseAnalysisResponse(responseText);
      } catch (error) {
        logger.warn(`Anthropic session analysis failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return this.getDefaultSessionAnalysis(entries);
  }

  private buildSessionPrompt(
    entries: Array<{
      url: string;
      profileKey: string;
      device: string;
      throttling: string;
      metrics: LighthouseResult['metrics'];
      opportunities: string[];
    }>
  ): string {
    const rows = entries
      .map((e, i) => {
        const top = e.opportunities.slice(0, 3).join(' | ') || '(none)';
        return `${i + 1}. ${e.url} [${e.profileKey}] — score ${e.metrics.performanceScore}/100, LCP ${e.metrics.lcpMs}ms, TBT ${e.metrics.tbtMs}ms, TTFB ${e.metrics.ttfbMs}ms, CLS ${e.metrics.cls} | Top savings: ${top}`;
      })
      .join('\n');

    const byProfile = entries.reduce((acc, e) => {
      (acc[e.profileKey] ||= []).push(e);
      return acc;
    }, {} as Record<string, typeof entries>);

    const profileSummary = Object.entries(byProfile)
      .map(([key, list]) => {
        const scores = list.map((l) => l.metrics.performanceScore);
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        return `- ${key}: ${list.length} URL(s), avg score ${avg}`;
      })
      .join('\n');

    return `You are a web performance expert reviewing a full Lighthouse test session (multiple URLs × multiple network profiles).

Your job is to find CROSS-URL PATTERNS, not re-describe individual pages.
Examples of patterns: "6 of 8 URLs share the same Unused JS issue → bundle-level problem", "TTFB consistently > 1s across all pages → backend/CDN issue", "/checkout is 3x slower than any other page → isolated regression".

Aggregate profile summary:
${profileSummary}

Session entries (all URL × profile results):
${rows}

Compare mobile-throttled numbers only to other mobile-throttled runs; compare desktop broadband only to desktop. Do not mix.

Respond with ONLY a JSON object — no extra text, no markdown fences.
Every array item MUST be a plain string (no nested objects or sub-keys).

{
  "summary": "2-3 sentences describing the health of the session as a whole (not individual URLs) and the biggest systemic issue",
  "issues": [
    "Unused JavaScript is flagged on 6/8 mobile runs — likely shared bundle issue, not page-specific",
    "TTFB > 1000ms on every page — server/CDN problem, not content problem"
  ],
  "recommendations": [
    "Audit the main JS bundle (one fix helps all pages) before touching individual components",
    "Add a CDN or edge cache layer — biggest single win across the whole site"
  ],
  "nextSteps": [
    "1. Run webpack-bundle-analyzer to find what to remove from the shared bundle",
    "2. Compare TTFB from an edge location vs current origin to confirm CDN impact"
  ]
}`;
  }

  private getDefaultSessionAnalysis(
    entries: Array<{
      url: string;
      metrics: LighthouseResult['metrics'];
      opportunities: string[];
    }>
  ): AnalysisInsight {
    const n = entries.length;
    const avgScore = Math.round(entries.reduce((acc, e) => acc + e.metrics.performanceScore, 0) / n);
    const highTtfb = entries.filter((e) => e.metrics.ttfbMs > 600).length;
    const highLcp = entries.filter((e) => e.metrics.lcpMs > 4000).length;

    const issues: string[] = [];
    if (highTtfb > n / 2) issues.push(`TTFB > 600ms em ${highTtfb}/${n} páginas — problema sistêmico de servidor/CDN`);
    if (highLcp > n / 2) issues.push(`LCP > 4000ms em ${highLcp}/${n} páginas — conteúdo principal lento`);

    return {
      summary: `Sessão com ${n} cenário(s), score médio ${avgScore}/100.`,
      issues: issues.length ? issues : ['Sem padrões críticos detectados entre as páginas'],
      recommendations: ['Configure GROQ_API_KEY para análise cross-URL com IA'],
      nextSteps: ['Repita a sessão após a próxima build para comparar'],
    };
  }

  async analyzeLighthouseResults(result: LighthouseResult): Promise<AnalysisInsight> {
    const groqKey = process.env.GROQ_API_KEY;
    const geminiKey = process.env.GEMINI_API_KEY;
    const anthropicKey = process.env.ANTHROPIC_API_KEY;

    const prompt = this.buildLighthousePrompt(result);

    if (groqKey) {
      try {
        logger.info('Using Groq AI for Lighthouse analysis...');
        const responseText = await this.callGroqAPI(groqKey, prompt);
        return this.parseAnalysisResponse(responseText);
      } catch (error) {
        logger.warn(`Groq analysis failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (geminiKey) {
      try {
        logger.info('Using Gemini AI for Lighthouse analysis...');
        const responseText = await this.callGeminiAPI(geminiKey, prompt);
        return this.parseAnalysisResponse(responseText);
      } catch (error) {
        logger.warn(`Gemini analysis failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (anthropicKey) {
      try {
        logger.info('Using Anthropic Claude for Lighthouse analysis...');
        const responseText = await this.callAnthropicAPI(anthropicKey, prompt);
        return this.parseAnalysisResponse(responseText);
      } catch (error) {
        logger.warn(`Anthropic analysis failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return this.getDefaultLighthouseAnalysis(result);
  }

  private buildLighthousePrompt(result: LighthouseResult): string {
    const { metrics, opportunities, diagnostics } = result;
    const runDetail =
      result.runMetrics && result.runMetrics.length > 1
        ? `\nPer-run LCP (ms): ${result.runMetrics.map((m) => m.lcpMs).join(', ')}\nPer-run performance score: ${result.runMetrics.map((m) => m.performanceScore).join(', ')}`
        : '';

    return `You are a web performance expert. Analyze the following Lighthouse lab results and provide actionable insights.

Lab context (read carefully — do not compare mobile-throttled ms to desktop broadband as if they were the same environment):
${result.labContext}
${runDetail}

URL: ${result.url}
Device: ${result.device}
Throttling profile: ${result.throttling}
Runs: ${result.runs} | Aggregated metrics (${result.aggregation})

Performance Score: ${metrics.performanceScore}/100

Core Web Vitals (aggregated):
- FCP (First Contentful Paint): ${metrics.fcpMs}ms
- LCP (Largest Contentful Paint): ${metrics.lcpMs}ms
- TTI (Time to Interactive): ${metrics.ttiMs}ms
- TBT (Total Blocking Time): ${metrics.tbtMs}ms
- CLS (Cumulative Layout Shift): ${metrics.cls}
- Speed Index: ${metrics.speedIndexMs}ms
- TTFB (Time to First Byte): ${metrics.ttfbMs}ms

When judging severity, use targets appropriate to this device + throttling (e.g. stricter LCP on real mobile 3G lab runs than on simulated desktop broadband). Do not call a desktop LCP "good" or "bad" using the same absolute thresholds you use for mobile3G.

Top Opportunities (savings):
${opportunities.map((o, i) => `${i + 1}. ${o}`).join('\n')}

Diagnostics:
${diagnostics.map((d, i) => `${i + 1}. ${d}`).join('\n')}

Respond with ONLY a JSON object — no extra text, no markdown fences.
Every array item MUST be a plain string (no nested objects or sub-keys).

{
  "summary": "Brief overall assessment focusing on the performance score and most critical issues (1-2 sentences)",
  "issues": [
    "LCP 9286ms is well above the 2500ms target for mobile — page takes too long to show main content",
    "TTFB 1172ms suggests slow server response or lack of CDN"
  ],
  "recommendations": [
    "Reduce unused JavaScript (~3760ms saved) — use tree-shaking and code splitting",
    "Enable text compression (gzip/brotli) for HTML, CSS, JS (~1360ms saved)"
  ],
  "nextSteps": [
    "1. Fix TTFB: add CDN or edge cache (biggest bang for mobile users)",
    "2. Remove unused JS bundles via bundle analysis (webpack-bundle-analyzer)"
  ]
}`;
  }

  private getDefaultLighthouseAnalysis(result: LighthouseResult): AnalysisInsight {
    const { metrics } = result;
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (metrics.performanceScore < 50)  issues.push(`Low performance score: ${metrics.performanceScore}/100`);
    if (metrics.lcpMs > 4000)           issues.push(`Poor LCP: ${metrics.lcpMs}ms (should be < 2500ms)`);
    if (metrics.tbtMs > 600)            issues.push(`High TBT: ${metrics.tbtMs}ms (should be < 200ms)`);
    if (metrics.cls > 0.25)             issues.push(`Poor CLS: ${metrics.cls} (should be < 0.1)`);
    if (metrics.ttfbMs > 600)           issues.push(`Slow TTFB: ${metrics.ttfbMs}ms (should be < 200ms)`);
    if (metrics.ttiMs > 7300)           issues.push(`Slow TTI: ${metrics.ttiMs}ms (should be < 3800ms)`);

    if (metrics.lcpMs > 2500)           recommendations.push('Optimize images and largest content element');
    if (metrics.tbtMs > 200)            recommendations.push('Reduce JavaScript execution time and third-party scripts');
    if (metrics.ttfbMs > 200)           recommendations.push('Improve server response time and consider CDN');
    if (result.opportunities.length > 0) recommendations.push(...result.opportunities.slice(0, 3).map((o) => `Fix: ${o}`));

    return {
      summary: `Performance score: ${metrics.performanceScore}/100. LCP: ${metrics.lcpMs}ms, TBT: ${metrics.tbtMs}ms, CLS: ${metrics.cls}.`,
      issues: issues.length > 0 ? issues : ['No critical issues detected'],
      recommendations: recommendations.length > 0 ? recommendations : ['Performance is within acceptable thresholds'],
      nextSteps: ['Run tests on mobile and desktop separately', 'Compare results after each optimization', 'Monitor Core Web Vitals in production'],
    };
  }

  private flattenItem(item: unknown): string {
    if (typeof item === 'string') return item;
    if (typeof item !== 'object' || item === null) return String(item);

    const obj = item as Record<string, unknown>;

    // Prefer explicit prose fields first
    const prose =
      obj['description'] ??
      obj['text'] ??
      obj['action'] ??
      obj['title'] ??
      obj['message'] ??
      obj['step'] ??
      obj['issue'] ??
      obj['opportunity'] ??
      obj['recommendation'];

    const priority = obj['priority'] ?? obj['severeness'] ?? obj['severity'] ?? obj['urgency'];
    const metric = obj['metric'];
    const value = obj['value'];
    const threshold = obj['threshold'];
    const savings =
      obj['savings'] ??
      obj['estimatedImpact'] ??
      obj['impact'] ??
      obj['estimated time'] ??
      obj['estimatedTime'];

    const parts: string[] = [];

    if (priority) parts.push(`[${priority}]`);
    if (metric && !prose) {
      const metricStr = `${metric}${value ? `: ${value}` : ''}${threshold ? ` (threshold ${threshold})` : ''}`;
      parts.push(metricStr);
    }
    if (prose) parts.push(String(prose));
    if (savings && String(savings) !== String(prose)) parts.push(`— ${savings}`);

    if (parts.length > 0) return parts.join(' ');

    // Last resort: join all non-empty string values
    return Object.values(obj)
      .filter((v) => typeof v === 'string' && v.trim())
      .join(' — ');
  }

  private normalizeInsight(raw: AnalysisInsight): AnalysisInsight {
    const toStringArray = (arr: unknown): string[] => {
      if (!Array.isArray(arr)) return [];
      return arr.map((item) => this.flattenItem(item)).filter(Boolean);
    };
    return {
      summary:         typeof raw.summary === 'string' ? raw.summary : String(raw.summary),
      issues:          toStringArray(raw.issues),
      recommendations: toStringArray(raw.recommendations),
      nextSteps:       toStringArray(raw.nextSteps),
    };
  }

  private parseAnalysisResponse(responseText: string): AnalysisInsight {
    const stripped = responseText
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    const jsonMatch = stripped.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error(`Could not find JSON in AI response: ${responseText.slice(0, 200)}`);
    }

    // Attempt 1: parse as-is
    try {
      const analysis = JSON.parse(jsonMatch[0]) as AnalysisInsight;
      logger.success('AI Analysis completed');
      return this.normalizeInsight(analysis);
    } catch { /* continue */ }

    // Attempt 2: sanitize control characters inside string values
    try {
      const sanitized = jsonMatch[0].replace(
        /"((?:[^"\\]|\\.)*)"/g,
        (_match, content: string) =>
          `"${content.replace(/[\n\r\t]/g, ' ').replace(/[\x00-\x1F\x7F]/g, '')}"`
      );
      const analysis = JSON.parse(sanitized) as AnalysisInsight;
      logger.success('AI Analysis completed');
      return this.normalizeInsight(analysis);
    } catch { /* continue */ }

    // Attempt 3: extract fields via regex (last resort)
    const extract = (key: string): string => {
      const m = stripped.match(new RegExp(`"${key}"\\s*:\\s*"([^"]*?)"`));
      return m ? m[1] : '';
    };
    const extractArray = (key: string): string[] => {
      const block = stripped.match(new RegExp(`"${key}"\\s*:\\s*\\[([\\s\\S]*?)\\]`));
      if (!block) return [];
      return [...block[1].matchAll(/"([^"]+)"/g)].map((m) => m[1]);
    };

    const analysis: AnalysisInsight = {
      summary:         extract('summary'),
      issues:          extractArray('issues'),
      recommendations: extractArray('recommendations'),
      nextSteps:       extractArray('nextSteps'),
    };

    if (!analysis.summary) throw new Error(`Failed to extract fields from AI response: ${stripped.slice(0, 200)}`);

    logger.success('AI Analysis completed (extracted via regex)');
    return analysis;
  }

  private getDefaultAnalysis(stats: PerformanceStats): AnalysisInsight {
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (stats.errorRate > 0.05) {
      issues.push(`High error rate: ${(stats.errorRate * 100).toFixed(2)}%`);
      recommendations.push('Investigate failed requests for patterns or issues');
    }

    if (stats.p95 > 5000) {
      issues.push(`High P95 latency: ${stats.p95.toFixed(0)}ms`);
      recommendations.push('Consider optimizing backend response time or scaling resources');
    }

    if (stats.avgResponseTimeMs > 2000) {
      recommendations.push('Average response time exceeds 2 seconds - investigate performance bottlenecks');
    }

    return {
      summary: `Test completed with ${stats.successfulRequests} successful requests and ${stats.failedRequests} failures. Average response time: ${stats.avgResponseTimeMs.toFixed(0)}ms.`,
      issues: issues.length > 0 ? issues : ['None detected'],
      recommendations: recommendations.length > 0 ? recommendations : ['Baseline performance acceptable'],
      nextSteps: [
        'Run additional tests with different load profiles',
        'Compare results with baseline metrics',
        'Monitor production metrics for validation',
      ],
    };
  }

  private callGroqAPI(apiKey: string, prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
          'Authorization': `Bearer ${apiKey}`,
        },
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            const text = parsed?.choices?.[0]?.message?.content;
            if (text) {
              resolve(text);
            } else {
              reject(new Error(`Groq API error ${res.statusCode}: ${JSON.stringify(parsed)}`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse Groq response: ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  private callGeminiAPI(apiKey: string, prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 1500, temperature: 0.3 },
      });

      const options = {
        hostname: 'generativelanguage.googleapis.com',
        path: `/v1beta/models/gemini-1.5-flash-8b:generateContent?key=${apiKey}`,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(data),
        },
      };

      const req = https.request(options, (res) => {
        let responseData = '';
        res.on('data', (chunk) => { responseData += chunk; });
        res.on('end', () => {
          try {
            const parsed = JSON.parse(responseData);
            const text = parsed?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (text) {
              resolve(text);
            } else {
              reject(new Error(`Gemini API error ${res.statusCode}: ${JSON.stringify(parsed)}`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse Gemini response: ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  private callAnthropicAPI(apiKey: string, prompt: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1500,
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
              reject(new Error(`API error ${res.statusCode}: ${JSON.stringify(parsed)}`));
            }
          } catch (e) {
            reject(new Error(`Failed to parse response: ${responseData}`));
          }
        });
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  private buildAnalysisPrompt(stats: PerformanceStats, context?: any): string {
    return `You are a performance testing expert. Analyze the following performance test results and provide actionable insights.

Test Results:
- Total Requests: ${stats.totalRequests}
- Successful: ${stats.successfulRequests}
- Failed: ${stats.failedRequests}
- Error Rate: ${(stats.errorRate * 100).toFixed(2)}%
- Average Response Time: ${stats.avgResponseTimeMs.toFixed(2)}ms
- Min Response Time: ${stats.minResponseTimeMs.toFixed(2)}ms
- Max Response Time: ${stats.maxResponseTimeMs.toFixed(2)}ms
- P50 (Median): ${stats.p50.toFixed(2)}ms
- P95 Percentile: ${stats.p95.toFixed(2)}ms
- P99 Percentile: ${stats.p99.toFixed(2)}ms
- Throughput: ${stats.throughput.toFixed(2)} req/sec
- Test Duration: ${stats.duration}ms
- Average Content Length: ${(stats.avgContentLength / 1024).toFixed(2)} KB

${context?.apiEndpoint ? `API Endpoint: ${context.apiEndpoint}` : ''}
${context?.scenario ? `Test Scenario: ${context.scenario}` : ''}

Respond with ONLY a JSON object — no extra text, no markdown fences.
Every array item MUST be a plain string (no nested objects or sub-keys).

{
  "summary": "Brief overall assessment (1-2 sentences)",
  "issues": [
    "Error rate 5.2% is above the 1% acceptable threshold",
    "P99 latency 2300ms suggests occasional timeouts under load"
  ],
  "recommendations": [
    "Investigate the 5% failed requests — check logs for patterns",
    "Add connection pooling to reduce P99 spikes"
  ],
  "nextSteps": [
    "1. Profile the slowest 1% of requests to find root cause",
    "2. Run a soak test to verify stability over 30 minutes"
  ]
}`;
  }
}

export const resultParser = new ResultParser();
