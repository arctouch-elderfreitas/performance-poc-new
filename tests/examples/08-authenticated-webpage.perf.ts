/**
 * Authenticated Webpage — Playwright + Lighthouse
 *
 * Faz login via Playwright em um site real, captura os cookies da sessão,
 * e roda o Lighthouse na página protegida usando esses cookies via extraHeaders.
 *
 * Sem Playwright, Lighthouse abre a página de login (sem conseguir entrar)
 * e mede a performance errada. Com este fluxo, medimos a página real do
 * usuário autenticado.
 *
 * Alvo padrão: https://the-internet.herokuapp.com — site público de testes
 * (usuário: tomsmith / senha: SuperSecretPassword!)
 *
 * Run with: npm run example:auth-webpage
 */

import '../../src/config/env';
import { runLighthouse } from '../../src/engines/lighthouse-engine';
import { resultParser } from '../../src/parsers/result-parser';
import { captureAuthCookies } from '../../src/utils/auth-capture';
import { logger } from '../../src/utils/logger';

async function runAuthenticatedTest() {
  try {
    logger.title('Autenticated Webpage — Playwright login + Lighthouse');

    // 1. Captura cookies via Playwright
    const auth = await captureAuthCookies({
      loginUrl: 'https://the-internet.herokuapp.com/login',
      usernameSelector: 'input#username',
      passwordSelector: 'input#password',
      submitSelector: 'button[type="submit"]',
      username: process.env.AUTH_USERNAME ?? 'tomsmith',
      password: process.env.AUTH_PASSWORD ?? 'SuperSecretPassword!',
      successIndicator: 'url:/secure',
    });

    // 2. Lighthouse na página protegida com o Cookie header
    logger.info('\nRodando Lighthouse na página autenticada...');
    const result = await runLighthouse({
      url: 'https://the-internet.herokuapp.com/secure',
      device: 'mobile',
      throttling: 'mobile3G',
      runs: 1,
      extraHeaders: { Cookie: auth.cookieHeader },
    });

    // 3. Relatório
    logger.section('Resultado — página autenticada (mobile 3G)');
    const m = result.metrics;
    console.log(`  Score: ${m.performanceScore}/100`);
    console.log(`  FCP:   ${m.fcpMs}ms`);
    console.log(`  LCP:   ${m.lcpMs}ms`);
    console.log(`  TBT:   ${m.tbtMs}ms`);
    console.log(`  TTFB:  ${m.ttfbMs}ms`);
    console.log(`  CLS:   ${m.cls.toFixed(3)}`);

    if (result.opportunities.length > 0) {
      console.log('\n  Oportunidades:');
      result.opportunities.forEach((o, i) => console.log(`    ${i + 1}. ${o}`));
    }

    // 4. Análise IA
    logger.section('Análise IA');
    logger.info('Enviando para análise...');
    const analysis = await resultParser.analyzeLighthouseResults(result);

    console.log(`\n📊 ${analysis.summary}\n`);
    if (analysis.issues.length) {
      console.log('⚠️  Issues:');
      analysis.issues.forEach((i) => console.log(`   - ${i}`));
    }
    if (analysis.recommendations.length) {
      console.log('\n💡 Recomendações:');
      analysis.recommendations.forEach((r) => console.log(`   - ${r}`));
    }

    logger.success(`\nFluxo autenticado concluído — ${auth.cookiesCount} cookie(s) usados na auditoria.`);
    process.exit(0);
  } catch (error) {
    logger.error('Teste falhou:', error);
    process.exit(1);
  }
}

runAuthenticatedTest();
