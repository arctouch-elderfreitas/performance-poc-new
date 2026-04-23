import { Router, Request, Response } from 'express';
import { chaosConfig } from '../store/memory-store';

const router = Router();

/**
 * GET /control/config
 * Retorna a configuração atual do chaos
 */
router.get('/config', (_req: Request, res: Response) => {
  res.json(chaosConfig);
});

/**
 * POST /control/config
 * Atualiza configuração de chaos globalmente ou por endpoint.
 *
 * Exemplo de body:
 * {
 *   "global": { "latencyMs": 200, "latencyVariance": 50, "errorRate": 0.1 },
 *   "endpoints": {
 *     "/users": { "latencyMs": 500 },
 *     "/orders": { "errorRate": 0.3, "timeoutMs": 3000 }
 *   }
 * }
 */
router.post('/config', (req: Request, res: Response) => {
  const { global: globalCfg, endpoints } = req.body;

  if (globalCfg) {
    if (globalCfg.latencyMs != null)       chaosConfig.global.latencyMs       = Number(globalCfg.latencyMs);
    if (globalCfg.latencyVariance != null) chaosConfig.global.latencyVariance = Number(globalCfg.latencyVariance);
    if (globalCfg.errorRate != null)       chaosConfig.global.errorRate       = Number(globalCfg.errorRate);
    if (globalCfg.timeoutMs != null)       chaosConfig.global.timeoutMs       = Number(globalCfg.timeoutMs);
  }

  if (endpoints && typeof endpoints === 'object') {
    for (const [path, cfg] of Object.entries(endpoints)) {
      chaosConfig.endpoints[path] = { ...chaosConfig.endpoints[path], ...(cfg as object) };
    }
  }

  res.json({ message: 'Chaos config updated', current: chaosConfig });
});

/**
 * POST /control/reset
 * Reseta toda a configuração de chaos para os valores padrão (sem efeito)
 */
router.post('/reset', (_req: Request, res: Response) => {
  chaosConfig.global = { latencyMs: 0, latencyVariance: 0, errorRate: 0, timeoutMs: 0 };
  chaosConfig.endpoints = {};
  res.json({ message: 'Chaos config reset to defaults', current: chaosConfig });
});

export default router;
