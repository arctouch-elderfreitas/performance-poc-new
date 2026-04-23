import { Request, Response, NextFunction } from 'express';
import { chaosConfig } from '../store/memory-store';
import { EndpointChaosConfig } from '../types';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function resolveConfig(path: string): Required<EndpointChaosConfig> {
  const endpointOverride = chaosConfig.endpoints[path] ?? {};
  return {
    latencyMs:       endpointOverride.latencyMs       ?? chaosConfig.global.latencyMs,
    latencyVariance: endpointOverride.latencyVariance ?? chaosConfig.global.latencyVariance,
    errorRate:       endpointOverride.errorRate       ?? chaosConfig.global.errorRate,
    timeoutMs:       endpointOverride.timeoutMs       ?? chaosConfig.global.timeoutMs,
  };
}

function applyJitter(base: number, variance: number): number {
  if (variance <= 0) return base;
  const jitter = (Math.random() * 2 - 1) * variance; // [-variance, +variance]
  return Math.max(0, base + jitter);
}

export async function chaosMiddleware(req: Request, res: Response, next: NextFunction): Promise<void> {
  const cfg = resolveConfig(req.path);

  // 1. Simula timeout (responde após timeoutMs sem processar)
  if (cfg.timeoutMs > 0) {
    await sleep(cfg.timeoutMs);
    res.status(504).json({
      error: 'Gateway Timeout',
      message: `Simulated timeout after ${cfg.timeoutMs}ms`,
      path: req.path,
    });
    return;
  }

  // 2. Injeta erro aleatório
  if (cfg.errorRate > 0 && Math.random() < cfg.errorRate) {
    const errorCodes = [500, 502, 503];
    const status = errorCodes[Math.floor(Math.random() * errorCodes.length)];
    res.status(status).json({
      error: 'Simulated Error',
      message: `Chaos error injection (rate: ${(cfg.errorRate * 100).toFixed(0)}%)`,
      path: req.path,
    });
    return;
  }

  // 3. Adiciona latência com jitter
  const delay = applyJitter(cfg.latencyMs, cfg.latencyVariance);
  if (delay > 0) {
    await sleep(delay);
  }

  next();
}
