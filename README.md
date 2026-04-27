# Performance Testing POC — AI-Powered Framework

Framework de testes de performance com geração e análise por IA, desenvolvido como parte do IDP de Elder Freitas (QA Analyst).

---

## O que este projeto faz

O framework automatiza o ciclo completo de testes de performance em três etapas:

1. **Gera** configurações de teste usando IA (opcional)
2. **Executa** requisições HTTP em paralelo e coleta métricas
3. **Analisa** os resultados com IA e entrega insights acionáveis

Além disso oferece:
- **API mock controlável** com chaos middleware (latência, erros, timeouts)
- **Testes de webpage** via Lighthouse: múltiplas URLs, múltiplos perfis de rede, mediana entre runs, artefatos HTML/JSON e comparação com baseline

---

## Requisitos

- Node.js 18+
- Google Chrome instalado (para testes de webpage com Lighthouse)
- Cursor IDE — a análise IA roda dentro do agente do Cursor (sem chaves de API externas)

---

## Setup

```bash
# 1. Clonar o repositório
git clone https://github.com/arctouch-elderfreitas/performance-poc-new.git
cd performance-poc-new

# 2. Instalar dependências do framework
npm install

# 3. Instalar dependências da API mock
cd api && npm install && cd ..

# 4. Criar o arquivo de ambiente
cp .env.example .env
# Edite .env apenas se precisar mudar TARGET_API_URL ou outros overrides
```

---

## Configuração

### `.env` — o que você pode preencher

Copie `.env.example` para `.env`. **Nenhuma chave de API externa é necessária** — toda análise IA acontece dentro do Cursor.

```env
TARGET_API_URL=http://localhost:3000 # usado pelos exemplos de API
```

**Nada de performance web é configurado aqui.** Vai tudo no JSON abaixo.

### `tests/config/web-perf.json` — o único lugar para configurar os testes web

Este arquivo é a fonte única de verdade para URLs, perfis, runs, aggregation e descoberta por sitemap. Mantenha commitado — todo o time usa o mesmo plano.

```json
{
  "urls": ["https://minha-empresa.com/"],
  "profiles": [
    { "key": "mobile-3g",         "device": "mobile",  "throttling": "mobile3G" },
    { "key": "desktop-broadband", "device": "desktop", "throttling": "broadband" }
  ],
  "runs": 3,
  "aggregation": "median",
  "saveHtml": true,
  "discover": {
    "baseUrl": "https://minha-empresa.com",
    "maxUrls": 10,
    "filterPattern": "^https://minha-empresa\\.com/",
    "merge": "replace"
  }
}
```

**Para mudar a URL/páginas testadas, edite apenas esse arquivo.** Commit → todo mundo usa o novo plano.

### Escape hatches (testes pontuais)

Se precisar **sobrescrever** o JSON sem editá-lo (ex: investigação rápida em outra URL), use variáveis de ambiente listadas em `.env.example`:

- `TARGET_WEB_URL` / `TARGET_WEB_URLS` — sobrescreve a lista de URLs
- `WEB_PERF_CONFIG` — aponta para outro JSON (ex: `plans/staging.json`)
- `LIGHTHOUSE_RUNS`, `LIGHTHOUSE_AGGREGATION`, `LIGHTHOUSE_SAVE_HTML` — overrides por execução
- `WEB_PERF_STRICT`, `WEB_PERF_MAX_LCP_MS`, ... — thresholds de validação
- `WEB_PERF_BASELINE_PATH`, `WEB_PERF_FAIL_ON_BASELINE_REGRESSION`, `WEB_PERF_REGRESSION_TOLERANCE_PCT` — regressão

Exemplo de uso pontual:

```bash
# Não edita o JSON, só sobrescreve nesta execução
TARGET_WEB_URL=https://staging.empresa.com/ npm run example:webpage
```

---

## Como rodar

### Terminal 1 — API mock

```bash
cd api
npm run dev
# Disponível em http://localhost:3000
```

### Terminal 2 — Exemplos

```bash
npm run example:simple    # GET básico com métricas
npm run example:load      # Carga em múltiplos endpoints
npm run example:ai        # Geração de teste via IA
npm run example:chaos     # Chaos engineering (4 cenários)
npm run example:public    # API pública vs local
npm run example:webpage   # Lighthouse em página web
```

---

## Exemplos disponíveis

| Script | Arquivo | O que faz |
|---|---|---|
| `example:simple` | `01-simple-get.perf.ts` | GET em `/users/1` — 50 iterações, métricas básicas |
| `example:load` | `02-load-test.perf.ts` | Carga paralela em múltiplos endpoints |
| `example:ai` | `03-ai-generated-test.perf.ts` | Config padrão + análise pelo Cursor agent |
| `example:chaos` | `04-chaos-test.perf.ts` | 4 cenários: baseline, latência, erros, combinado |
| `example:public` | `05-public-api-test.perf.ts` | JSONPlaceholder (internet) vs API local |
| `example:webpage` | `06-webpage-test.perf.ts` | Lighthouse: URLs × perfis, mediana, artefatos, baseline, descoberta via sitemap, análise cross-URL, relatório HTML consolidado |
| `example:chaos-web` | `07-chaos-web-test.perf.ts` | **Chaos × Web** — compara LCP/FCP da página `/demo` com e sem latência/erros na API consumida |
| `example:auth-webpage` | `08-authenticated-webpage.perf.ts` | **Playwright + Lighthouse** — login automatizado, captura de cookies, auditoria de página autenticada |

---

## Testes de performance web (Lighthouse)

### Plano de execução (`tests/config/web-perf.json`)

```json
{
  "urls": ["https://arctouch.com/"],
  "profiles": [
    { "key": "mobile-3g",         "device": "mobile",  "throttling": "mobile3G"  },
    { "key": "desktop-broadband", "device": "desktop", "throttling": "broadband" }
  ],
  "runs": 3,
  "aggregation": "median",
  "saveHtml": true
}
```

Cada combinação URL × perfil executa `runs` vezes e agrega por **mediana** (ou `mean`). O Chrome é instanciado separadamente por run para evitar conflitos de aba.

### Artefatos gerados

Após cada execução os arquivos ficam em `results/web-perf/<timestamp>/`:

```
results/web-perf/2026-04-16T15-21-00-873Z/
├── session-report.html                       # Relatório consolidado (abra no browser)
├── session-summary.json                      # Resumo em JSON (usado como baseline)
├── arctouch_com__mobile-3g.lhr.json          # LHR completo do run representativo
├── arctouch_com__mobile-3g.metrics.json      # Métricas agregadas + por run
├── arctouch_com__mobile-3g.report.html       # Relatório visual do Lighthouse
├── arctouch_com__desktop-broadband.lhr.json
├── arctouch_com__desktop-broadband.metrics.json
└── arctouch_com__desktop-broadband.report.html
```

### Relatório consolidado (`session-report.html`)

Página HTML autossuficiente com **tudo** da sessão — pronta para compartilhar em PR, Slack ou Notion:

- Stat strip com total de URLs, cenários e score médio
- **Análise IA embutida**: padrões cross-URL (sessão) + diagnóstico do pior cenário
- **Alertas de baseline** (regressões vs. versão anterior) e **de thresholds** (`WEB_PERF_STRICT`)
- Tabela resumo de todos os cenários com tons good/warn/bad
- Cards por cenário com Core Web Vitals e top 5 oportunidades
- Links para os `.lhr.json`, `.metrics.json` e relatório visual do Lighthouse de cada execução

```bash
# Abrir no browser (macOS)
open results/web-perf/<timestamp>/session-report.html
```

### Descoberta automática de URLs via sitemap

Ao adicionar `discover` em `tests/config/web-perf.json`, o framework busca o `sitemap.xml`, segue sitemap index, filtra por regex e limita ao `maxUrls`:

```json
{
  "discover": {
    "baseUrl": "https://arctouch.com",
    "maxUrls": 10,
    "filterPattern": "^https://arctouch\\.com/",
    "followIndex": true,
    "merge": "replace"
  }
}
```

### Análise IA em dois níveis (via Cursor agent)

Ao final da sessão, o framework prepara dois prompts em `pending-analysis/`:

1. **`web-session-prompt.md`** — análise da sessão inteira (padrões cross-URL).
2. **`web-worst-prompt.md`** — diagnóstico detalhado do pior cenário individual.

Para gerar a análise:

```bash
# 1. Abra o chat do Cursor e peça:
#    "Analise results/web-perf/<timestamp>/pending-analysis/web-session-prompt.md
#     e em seguida web-worst-prompt.md"
#
# 2. O agente salva os outputs em:
#    pending-analysis/web-session-output.json
#    pending-analysis/web-worst-output.json
#
# 3. Aplique a análise no relatório consolidado:
npm run analysis:apply -- results/web-perf/<timestamp>
```

O HTML final (`session-report.html`) inclui o bloco "Análise por IA" com summary, issues, recomendações e próximos passos. Nenhum dado deixa sua máquina — toda inferência roda dentro do Cursor.

### Comparação com baseline

```bash
# 1. Salvar um session-summary.json de referência
cp results/web-perf/<timestamp>/session-summary.json tests/config/web-perf.baseline.json

# 2. Rodar com comparação ativada
WEB_PERF_BASELINE_PATH=tests/config/web-perf.baseline.json npm run example:webpage

# 3. Falhar o processo se houver regressão
WEB_PERF_BASELINE_PATH=tests/config/web-perf.baseline.json \
WEB_PERF_FAIL_ON_BASELINE_REGRESSION=1 \
npm run example:webpage
```

### Thresholds estritos

```bash
WEB_PERF_STRICT=1 \
WEB_PERF_MIN_SCORE=60 \
WEB_PERF_MAX_LCP_MS=3000 \
npm run example:webpage
```

---

## Métricas coletadas

### Testes de API

| Métrica | O que significa |
|---|---|
| **P50** | Metade das requisições respondeu abaixo desse tempo |
| **P95** | 95% responderam abaixo — referência de SLA |
| **P99** | Cauda longa — experiência dos usuários mais lentos |
| **Throughput** | Requisições por segundo |
| **Error Rate** | % de requisições com falha |

### Testes de Webpage (Lighthouse)

| Métrica | Descrição | Meta (mobile 3G) |
|---|---|---|
| **Performance Score** | Score geral 0–100 | ≥ 90 (Good) |
| **FCP** | First Contentful Paint — primeiro conteúdo visível | < 1800ms |
| **LCP** | Largest Contentful Paint — maior elemento carregado | < 2500ms |
| **TTI** | Time to Interactive — página totalmente interativa | < 3800ms |
| **TBT** | Total Blocking Time — tempo bloqueando o usuário | < 200ms |
| **CLS** | Cumulative Layout Shift — estabilidade visual | < 0.1 |
| **Speed Index** | Velocidade de carregamento visual geral | < 3400ms |
| **TTFB** | Time to First Byte — resposta inicial do servidor | < 200ms |

---

## Fluxos autenticados (Playwright + Lighthouse)

O Lighthouse sozinho não consegue auditar páginas atrás de login. A combinação com Playwright resolve isso:

1. **Playwright** abre o browser, preenche o formulário de login e captura os cookies da sessão
2. **Lighthouse** roda na URL protegida com esses cookies via `extraHeaders`

```bash
# Exemplo pronto usando the-internet.herokuapp.com
npm run example:auth-webpage
```

Para adaptar a outro site, edite `tests/examples/08-authenticated-webpage.perf.ts` com os seletores CSS e credenciais da sua aplicação.

---

## Chaos × Web

Demonstra como condições adversas da API (latência, erros) afetam as métricas da página que a consome:

```bash
# 1. Sobe o mock API
cd api && npm run dev

# 2. Em outro terminal
npm run example:chaos-web
```

O exemplo roda o Lighthouse em `http://localhost:3000/demo/` duas vezes: **sem** chaos e **com** chaos (300ms de latência + 10% de erros). Em seguida compara os deltas de FCP/LCP/Speed Index lado a lado e manda para a IA.

É um diferencial real frente à extensão do Lighthouse: **nenhuma ferramenta de mercado permite simular backend degradado e medir impacto no frontend no mesmo ciclo**.

---

## API Mock

Simula um sistema CRUD com usuários, produtos e pedidos. O **chaos middleware** permite injetar latência e erros dinamicamente via HTTP:

```bash
# Injeta 200ms de latência e 10% de erros
curl -X POST http://localhost:3000/control/config \
  -H "Content-Type: application/json" \
  -d '{"global":{"latencyMs":200,"errorRate":0.1}}'

# Remove todos os efeitos de chaos
curl -X POST http://localhost:3000/control/reset
```

### Endpoints disponíveis

```
GET  /health
GET/POST/PUT/DELETE  /users/:id?
GET/POST/PUT/DELETE  /products/:id?
GET/POST/PUT/DELETE  /orders/:id?
GET/POST             /control/config
POST                 /control/reset
GET                  /demo/                 # Página HTML que consome /products
```

---

## Integração com IA — Cursor agent

Em vez de chamar provedores LLM externos (Groq, Gemini, OpenAI, Anthropic), o framework delega a análise ao **agente do Cursor IDE** que você já tem aberto. Isso atende à política corporativa que proíbe envio de dados para serviços de terceiros.

**Fluxo em 3 etapas:**

1. **Script roda o teste** e salva um arquivo `*-prompt.md` em `pending-analysis/`. Esse arquivo contém:
   - O prompt completo (com contexto de emulação de rede para Lighthouse)
   - As instruções de formato de saída (JSON)
   - O caminho onde o agente deve salvar o output
2. **Você pede ao agente do Cursor**: `"Analise <caminho-do-prompt>"`. O agente lê o prompt, gera a análise estruturada e salva como `*-output.json`.
3. **(Apenas web-perf)** Você roda `npm run analysis:apply -- <session-dir>` para fundir a análise no `session-report.html`.

Vantagens:

- Zero chave de API — sem custo, sem governança extra
- Os dados de teste **nunca saem da sua máquina**
- O modelo do Cursor (Opus, Sonnet etc.) é mais robusto que llama-3.1-8b-instant
- Os prompts continuam versionados em `pending-analysis/` para auditoria

Trade-off: a análise não é mais 100% headless dentro de um único `npm run`. É um passo manual a mais para invocar o agente.

Se nenhuma análise IA for produzida, o framework cai automaticamente em uma análise **baseada em regras** (thresholds de Web Vitals e SLA), garantindo que o relatório nunca fique vazio.

---

## Estrutura do projeto

```
performance-poc/
├── src/
│   ├── config/
│   │   ├── env.ts                   # Carrega variáveis de ambiente
│   │   └── web-perf.ts              # Plano, thresholds e baseline de testes web
│   ├── engines/
│   │   ├── http-engine.ts           # Orquestra testes de carga em APIs
│   │   ├── lighthouse-engine.ts     # Executa Lighthouse com múltiplos runs e mediana
│   │   └── web-perf-runner.ts       # Orquestra URLs × perfis e persiste artefatos
│   ├── generators/
│   │   └── test-generator.ts        # Gera configurações de teste via IA
│   ├── parsers/
│   │   └── result-parser.ts         # Salva prompts para o agente Cursor + fallback por regras
│   └── utils/
│       ├── http-client.ts           # Executa requisições HTTP com timing
│       ├── metrics-processor.ts     # Calcula P50/P95/P99 e throughput
│       ├── logger.ts                # Output colorido no terminal
│       ├── web-vitals-assert.ts     # Validação de thresholds de Web Vitals
│       ├── url-discovery.ts         # Descoberta de URLs via sitemap.xml
│       ├── session-html-report.ts   # Relatório HTML consolidado da sessão
│       └── auth-capture.ts          # Captura cookies via Playwright para Lighthouse
│
├── tests/
│   ├── examples/
│   │   ├── 01-simple-get.perf.ts
│   │   ├── 02-load-test.perf.ts
│   │   ├── 03-ai-generated-test.perf.ts
│   │   ├── 04-chaos-test.perf.ts
│   │   ├── 05-public-api-test.perf.ts
│   │   ├── 06-webpage-test.perf.ts
│   │   ├── 07-chaos-web-test.perf.ts          # Chaos × Web
│   │   └── 08-authenticated-webpage.perf.ts   # Playwright + Lighthouse
│   └── config/
│       ├── web-perf.json                      # Plano de execução Lighthouse
│       └── web-perf.baseline.example.json     # Modelo de baseline para CI
│
├── scripts/
│   └── apply-analysis.ts              # Aplica output IA do agente Cursor no session-report.html
│
├── api/                               # API mock Express (porta 3000)
│   ├── public/demo/                   # Página HTML que consome /products
│   └── src/
│       ├── server.ts
│       ├── middleware/chaos.ts        # Injeção de latência e erros
│       ├── routes/                    # users, products, orders, control
│       └── store/memory-store.ts     # Dados em memória com seed
│
├── docs/
│   ├── NOTION_ARTICLE.md            # Artigo para publicação no Notion
│   ├── SLIDES_OUTLINE.md            # Estrutura dos 15 slides da talk
│   ├── create-slides.js             # Script pptxgenjs para gerar o PPTX
│   └── Performance-Testing-com-IA.pptx
│
├── results/                         # Gerado em runtime — ignorado pelo git
│   └── web-perf/<timestamp>/        # Artefatos por sessão de testes
│
├── .env.example                     # Modelo de variáveis de ambiente
├── .env                             # Suas chaves (não vai ao git)
└── IDP_CONTEXT.md                   # Contexto completo do IDP
```

---

## Roadmap

| Status | Item |
|---|---|
| ✅ | Engine HTTP com P50/P95/P99, throughput, error rate |
| ✅ | API mock com chaos middleware dinâmico |
| ✅ | Análise de resultados via Cursor agent + fallback por regras |
| ✅ | Geração de configs de teste padrão (variações via Cursor agent) |
| ✅ | Testes de webpage com Lighthouse v9 |
| ✅ | Múltiplos runs com agregação por mediana |
| ✅ | Múltiplas URLs × perfis em uma sessão |
| ✅ | Artefatos HTML/JSON por cenário |
| ✅ | Comparação com baseline + detecção de regressão |
| ✅ | Thresholds por variável de ambiente (modo estrito) |
| ✅ | Prompts de IA com contexto de emulação de rede |
| ✅ | Descoberta automática de URLs via sitemap (subdomínios/subpastas) |
| ✅ | Análise IA da sessão inteira (padrões cross-URL) |
| ✅ | Relatório HTML consolidado (`session-report.html`) |
| ✅ | Chaos × Web: API degradada vs métricas da página |
| ✅ | Playwright para fluxos autenticados antes do Lighthouse |
| ⬜ | OAuth / refresh tokens automáticos |
| ⬜ | Encadeamento de testes (resultado de A alimenta B) |
| ⬜ | Tendência entre sessões (gráfico de evolução) |
| ⬜ | Cruzamento com CrUX API (lab + field data) |
| ⬜ | Visual regression por screenshot |

---

**Autor**: Elder Freitas — QA Analyst  
**Repositório**: [github.com/arctouch-elderfreitas/performance-poc-new](https://github.com/arctouch-elderfreitas/performance-poc-new)  
**Versão**: 0.4.0
