export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// ANSI Color codes
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  gray: '\x1b[90m',
  blue: '\x1b[36m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  cyan: '\x1b[36m',
};

const levels = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export class Logger {
  constructor(private currentLevel: LogLevel = 'info') {}

  private shouldLog(level: LogLevel): boolean {
    return levels[level] >= levels[this.currentLevel];
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog('debug')) {
      console.log(`${COLORS.gray}[DEBUG] ${message}${COLORS.reset}`, data ? data : '');
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog('info')) {
      console.log(`${COLORS.blue}[INFO] ${message}${COLORS.reset}`, data ? data : '');
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog('warn')) {
      console.log(`${COLORS.yellow}[WARN] ${message}${COLORS.reset}`, data ? data : '');
    }
  }

  error(message: string, error?: unknown): void {
    if (this.shouldLog('error')) {
      console.error(`${COLORS.red}[ERROR] ${message}${COLORS.reset}`, error ? error : '');
    }
  }

  success(message: string): void {
    console.log(`${COLORS.green}✓ ${message}${COLORS.reset}`);
  }

  title(message: string): void {
    console.log(`\n${COLORS.cyan}${COLORS.bright}=== ${message} ===${COLORS.reset}\n`);
  }

  section(message: string): void {
    console.log(`\n${COLORS.bright}${message}${COLORS.reset}`);
  }
}

export const logger = new Logger('info');
