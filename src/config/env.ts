import * as fs from 'fs';
import * as path from 'path';

function loadEnvFile(): void {
  const envPath = path.resolve(process.cwd(), '.env');

  if (fs.existsSync(envPath)) {
    try {
      const envContent = fs.readFileSync(envPath, 'utf-8');
      const lines = envContent.split('\n');

      for (const line of lines) {
        if (line.startsWith('#') || line.trim() === '') {
          continue;
        }

        const [key, ...valueParts] = line.split('=');
        const value = valueParts.join('=').trim();

        const cleanValue = value.replace(/^["']|["']$/g, '');

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
};
