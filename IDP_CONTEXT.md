# IDP Context — Performance Testing POC

**Author**: Elder Freitas — QA Analyst  
**Period**: April—June 2026  
**Goal**: Build AI-powered performance testing framework for QA team presentation  
**Status**: ✅ MVP Complete — análise IA migrada para o agente do Cursor

---

## Project Overview

Framework automatiza o ciclo de testes de performance:
1. **Generate** — config padrão por template (variações via Cursor agent)
2. **Execute** — HTTP requests em paralelo + coleta de métricas
3. **Analyze** — análise IA via **agente do Cursor** (sem LLMs externos) + fallback por regras

Plus:
- **Mock API** local controlável com chaos middleware
- **Lighthouse** para Core Web Vitals
- **Cursor agent** como motor de análise (modelo Opus/Sonnet do próprio IDE)

---

## What's Done ✅

### Core Framework
- `src/engines/http-engine.ts` — orquestrador de carga HTTP
- `src/engines/lighthouse-engine.ts` — Lighthouse com múltiplos runs e mediana
- `src/engines/web-perf-runner.ts` — orquestra URLs × perfis e persiste artefatos
- `src/generators/test-generator.ts` — config padrão (template puro, sem LLM)
- `src/parsers/result-parser.ts` — salva prompts em `pending-analysis/` e retorna fallback por regras
- `scripts/apply-analysis.ts` — aplica output do agente Cursor no `session-report.html`
- `src/utils/` — HTTP client, metrics processor, logger, session HTML report, web-vitals assert, baseline diff, sitemap discovery, Playwright auth capture

### Mock API
- `api/src/server.ts` — Express na porta 3000
- `api/src/middleware/chaos.ts` — injeção de latência/erros
- `api/src/routes/control.ts` — config dinâmica via HTTP
- `api/src/store/memory-store.ts` — dados em memória com seed
- `api/public/demo/` — página HTML que consome `/products` (usada no chaos × web)

### Tests/Examples
8 exemplos funcionando:
1. `01-simple-get.perf.ts` — GET básico
2. `02-load-test.perf.ts` — carga em múltiplos endpoints
3. `03-ai-generated-test.perf.ts` — config padrão + análise via Cursor agent
4. `04-chaos-test.perf.ts` — 4 cenários (baseline, latência, erros, combinado)
5. `05-public-api-test.perf.ts` — JSONPlaceholder vs API local
6. `06-webpage-test.perf.ts` — Lighthouse multi-URL × perfis com sessão completa
7. `07-chaos-web-test.perf.ts` — chaos × web (API degradada vs página)
8. `08-authenticated-webpage.perf.ts` — Playwright + Lighthouse autenticado

### Documentation
- `README.md` — setup, exemplos, fluxo de análise via Cursor agent
- `docs/NOTION_ARTICLE.md` — artigo Notion
- `docs/SLIDES_OUTLINE.md` — outline da talk
- `docs/create-slides.js` — pptxgenjs (15 slides)
- `docs/Performance-Testing-com-IA.pptx` — slides finais

### Configuration
- `.env` — apenas `TARGET_API_URL` e overrides opcionais (zero chaves de API)
- `tsconfig.json` — Node 18+, ES2020, strict
- `package.json` — script `analysis:apply` adicionado

---

## Technical Decisions

| Choice | Why |
|--------|-----|
| Node.js 18+ + TypeScript | Familiaridade do time, type safety |
| Cursor agent over external LLM | Política corporativa proíbe envio de dados a terceiros |
| Lighthouse v9 | Compatibilidade CommonJS, integração Chrome estável |
| Mock API (Express) | Simples, conhecido, chaos middleware fácil |
| Workflow 2 etapas (script → agente) | Trade-off automação × compliance |

---

## Cursor Agent Setup (Critical)

Nada precisa ser instalado fora do IDE. O fluxo é:

1. Você roda um exemplo: `npm run example:chaos`
2. O script salva um prompt em `results/.../pending-analysis/<kind>-prompt.md`
3. No chat do Cursor: `"Analise <caminho-do-prompt>"`
4. O agente lê, gera análise estruturada e salva como `<kind>-output.json`
5. Para web-perf, rode `npm run analysis:apply -- <session-dir>` para fundir no HTML

Nenhuma chave de API é necessária. Os dados nunca saem da sua máquina.

---

## Running the Project

### Terminal 1: Mock API
```bash
cd api && npm run dev
# http://localhost:3000
```

### Terminal 2: Tests
```bash
npm run example:simple    # smoke test
npm run example:chaos     # melhor demo — 4 cenários
npm run example:webpage   # Lighthouse (mobile 3G + desktop)
npm run example:public    # JSONPlaceholder vs local
```

### Análise IA (passo manual)
Abra o chat do Cursor e peça:
> "Analise os arquivos pendentes em `results/.../pending-analysis/`"

Para sessões web, em seguida:
```bash
npm run analysis:apply -- results/web-perf/<timestamp>
```

---

## Remaining Gaps (for v1.0)

- [ ] OAuth / refresh tokens automáticos
- [ ] Encadeamento de testes (resultado de A alimenta B)
- [ ] Tendência entre sessões (gráfico de evolução)
- [ ] Cruzamento com CrUX API (lab + field)
- [ ] Visual regression por screenshot
- [ ] Padrões avançados de chaos (jitter, timeouts parciais)

---

## Talk Details (June 2026)

**Audience**: QA Team (8–12 pessoas)  
**Duration**: 1 hora  
**Format**: Slides + demo ao vivo (terminal + Cursor chat)

**Structure**:
1. Abertura (10 min) — Slide 1–2
2. O que é performance (10 min) — Slide 3–5
3. Como funciona (10 min) — Slide 6–8
4. Demo ao vivo (20 min) — Terminal + Cursor agent (examples 4, 6)
5. Resultados (5 min) — Slide 10
6. Q&A (5 min) — Slide 15

**Key points**:
- Performance não é especialista → IA do próprio Cursor elimina barreira
- Testes rodam em minutos, análise em segundos via chat
- Aplica-se desde hoje em endpoints/páginas reais
- Sem dependência de serviços externos — compliance corporativa garantida

**Demo fallback**: Screenshots pré-capturados (no internet dependency)

---

## File Structure

```
performance-poc-new/
├── src/
│   ├── config/
│   │   ├── env.ts                   # Env vars (sem chaves de IA)
│   │   └── web-perf.ts              # Plano + thresholds + baseline
│   ├── engines/
│   │   ├── http-engine.ts           # Load test orchestrator
│   │   ├── lighthouse-engine.ts     # Lighthouse com múltiplos runs
│   │   └── web-perf-runner.ts       # URL × perfil + artefatos
│   ├── generators/
│   │   └── test-generator.ts        # Template padrão (sem LLM)
│   ├── parsers/
│   │   └── result-parser.ts         # Salva prompts pro Cursor agent + fallback
│   └── utils/
│       ├── http-client.ts           # HTTP + timing
│       ├── metrics-processor.ts     # P50/P95/P99
│       ├── logger.ts                # Terminal UI
│       ├── web-vitals-assert.ts     # Threshold checks
│       ├── url-discovery.ts         # Sitemap discovery
│       ├── session-html-report.ts   # Relatório HTML consolidado
│       └── auth-capture.ts          # Playwright para login antes do Lighthouse
├── scripts/
│   └── apply-analysis.ts            # Aplica output do agente no relatório HTML
├── tests/
│   ├── examples/                    # 01–08
│   └── config/web-perf.json         # Plano de execução
├── api/                             # Mock Express (porta 3000)
├── docs/                            # Notion, slides, PPTX
├── results/                         # gerado em runtime (gitignored)
├── .env / .env.example              # apenas overrides opcionais
├── README.md
├── package.json
├── tsconfig.json
└── IDP_CONTEXT.md                   # this file
```

---

## Known Issues & Fixes Applied

| Issue | Solution |
|-------|----------|
| Política corporativa bloqueia LLMs externos | Migração para análise via Cursor agent (Opus) |
| Pessoal GitHub aparecia como collaborator | Repositório limpo `performance-poc-new` com history rewrite |
| Lighthouse EPERM no Windows | try/catch em `chrome.kill()` |
| pptxgenjs module not found | npm init + npm install em docs/ |
| Mutation em options do pptxgenjs | Factory `makeShadow()` por chamada |
| TypeScript jest types conflict | Removido do tsconfig types array |

---

## Metrics Reference

### API Metrics
- **P50/P95/P99** — percentis de tempo de resposta
- **Throughput** — req/seg
- **Error Rate** — % de falhas

### Core Web Vitals (Lighthouse)
- **FCP** — First Contentful Paint (< 1.8s)
- **LCP** — Largest Contentful Paint (< 2.5s)
- **TTI** — Time to Interactive (< 3.8s)
- **TBT** — Total Blocking Time (< 200ms)
- **CLS** — Cumulative Layout Shift (< 0.1)
- **TTFB** — Time to First Byte (< 200ms)

---

**Last updated**: 2026-04-27  
**Ready for**: presentation prep + corporate demos (compliance-clean)
