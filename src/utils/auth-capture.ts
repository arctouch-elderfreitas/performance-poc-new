import { chromium } from 'playwright';
import { logger } from './logger';

export interface AuthFlow {
  /** URL da página de login. */
  loginUrl: string;
  /** Seletor CSS do campo de usuário/email. */
  usernameSelector: string;
  /** Seletor CSS do campo de senha. */
  passwordSelector: string;
  /** Seletor CSS do botão de submit. */
  submitSelector: string;
  /** Valor do usuário/email. */
  username: string;
  /** Senha. */
  password: string;
  /**
   * Seletor CSS ou URL que indica login bem-sucedido.
   * - Se começar com "url:", espera a URL mudar para esse valor.
   * - Caso contrário, espera o seletor aparecer na página.
   */
  successIndicator: string;
  /** Timeout em ms para cada passo (padrão 15000). */
  timeoutMs?: number;
}

export interface CapturedAuth {
  /** String Cookie pronta para header HTTP (name=value; name2=value2). */
  cookieHeader: string;
  /** Cookies brutos capturados (debug). */
  cookiesCount: number;
  /** Origem logada. */
  origin: string;
}

/**
 * Faz login via Playwright e captura os cookies resultantes para serem usados
 * no Lighthouse via `extraHeaders`. Suporta apenas fluxos de login simples com
 * formulário — OAuth/SSO exigem adaptação.
 */
export async function captureAuthCookies(flow: AuthFlow): Promise<CapturedAuth> {
  const timeout = flow.timeoutMs ?? 15000;
  logger.info(`Autenticando via Playwright em ${flow.loginUrl}...`);

  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();

    await page.goto(flow.loginUrl, { timeout, waitUntil: 'networkidle' });
    await page.fill(flow.usernameSelector, flow.username, { timeout });
    await page.fill(flow.passwordSelector, flow.password, { timeout });
    await page.click(flow.submitSelector, { timeout });

    if (flow.successIndicator.startsWith('url:')) {
      const expectedUrl = flow.successIndicator.slice(4);
      await page.waitForURL((u) => u.toString().includes(expectedUrl), { timeout });
    } else {
      await page.waitForSelector(flow.successIndicator, { timeout, state: 'visible' });
    }

    const cookies = await context.cookies();
    if (cookies.length === 0) {
      throw new Error('Login aparentemente bem-sucedido, mas nenhum cookie foi setado.');
    }

    const cookieHeader = cookies
      .filter((c) => c.name && c.value)
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const origin = new URL(flow.loginUrl).origin;
    logger.success(`Autenticação concluída — ${cookies.length} cookie(s) capturado(s) para ${origin}`);

    return { cookieHeader, cookiesCount: cookies.length, origin };
  } finally {
    await browser.close().catch(() => { /* ignore */ });
  }
}
