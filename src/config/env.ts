// Load .env file manually if it exists
import * as fs from 'fs';
import * as path from 'path';

function loadEnvFile(): void {
  const envPath = path.resolve(process.cwd(), '.env');

  if (fs.existsSync(envPath)) {
    try {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');

      for (const line of lines) {
        // Skip comments and empty lines
        if (line.startsWith('#') || line.trim() === '') {
          continue;
        }

        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();

        // Remove quotes if present
        const cleanValue = value.replace(/^["']|["']$/g, '');

        // Only set if not already in process.env
        if (key && !process.env[key.trim()]) {
          process.env[key.trim()] = cleanValue;
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not read .env file at ${envPath}`);
    }
  }
}

loadEnvFile();

export const config = {
  // Anthropic API
  anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',

  // Google Gemini API
  geminiApiKey: process.env.GEMINI_API_KEY || '',

  // Groq API
  groqApiKey: process.env.GROQ_API_KEY || '',

  // Target API
  targetApiUrl: process.env.TARGET_API_URL || 'https://jsonplaceholder.typicode.com',
  targetApiTimeoutMs: parseInt(process.env.TARGET_API_TIMEOUT_MS || '10000', 10),

  // Performance Testing Defaults
  defaultIterations: parseInt(process.env.DEFAULT_ITERATIONS || '100', 10),
  defaultConcurrency: parseInt(process.env.DEFAULT_CONCURRENCY || '10', 10),
  defaultTimeoutMs: parseInt(process.env.DEFAULT_TIMEOUT_MS || '5000', 10),

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Output
  resultsDir: process.env.RESULTS_DIR || './results',

  // Validation
  validate(): void {
    if (!this.anthropicApiKey) {
      console.warn('⚠️  ANTHROPIC_API_KEY is not set. AI features will be disabled.');
      console.warn('   Set it in .env file or as environment variable.');
    }
  },
};
