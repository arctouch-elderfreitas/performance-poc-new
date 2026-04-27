# START HERE — Cursor IDE entry point

Acabou de clonar o projeto no Cursor? Este é o roteiro mais curto para virar produtivo.

---

## Context Files (leia nesta ordem)

### 1. **IDP_CONTEXT.md** (5 min — comece aqui)
Visão completa do projeto: o que está feito, o que falta, estrutura de arquivos, como rodar, fluxo de análise via Cursor agent.

### 2. **.cursorrules** (auto-carregado pelo Cursor)
Resumo do tech stack + tarefas comuns + como me invocar para análise IA. **Não edite** a menos que queira mudar como o agente interpreta o projeto.

### 3. **CURSOR_SETUP.md** (5 min)
Setup passo-a-passo no Cursor: clonar, dependências, primeira execução.

### 4. **SESSION_LOG.md** (opcional, 10 min)
Timeline de desenvolvimento. Útil para entender por que algumas decisões foram tomadas.

---

## Quick Start (2 min)

```bash
# 1. (Opcional) .env apenas se quiser overrides
cp .env.example .env

# 2. Install
npm install
cd api && npm install && cd ..

# 3. Terminal 1: Mock API
cd api && npm run dev

# 4. Terminal 2: Test
npm run example:simple
```

Se você ver métricas no terminal → **tudo funcionando**. Nenhuma chave de API é necessária — toda análise IA acontece no chat do Cursor.

---

## Project Map

```
performance-poc-new/
├── IDP_CONTEXT.md            👈 referência principal (leia primeiro)
├── CURSOR_SETUP.md           👈 setup detalhado
├── SESSION_LOG.md            👈 como o projeto foi construído
├── .cursorrules              👈 auto-carregado pelo Cursor
├── README.md                 👈 referência completa de features
│
├── src/                      framework
│   ├── config/env.ts         env vars (sem chaves de IA)
│   ├── engines/              load testing + Lighthouse
│   ├── parsers/              salva prompts pro Cursor agent + fallback
│   ├── generators/           geração de testes (template padrão)
│   └── utils/                helpers
│
├── scripts/
│   └── apply-analysis.ts     funde análise IA do agente no HTML
│
├── tests/examples/           8 exemplos prontos
│   ├── 01-simple-get.perf.ts
│   ├── 02-load-test.perf.ts
│   ├── 03-ai-generated-test.perf.ts
│   ├── 04-chaos-test.perf.ts          👈 melhor demo
│   ├── 05-public-api-test.perf.ts
│   ├── 06-webpage-test.perf.ts        👈 Lighthouse
│   ├── 07-chaos-web-test.perf.ts      👈 chaos × web
│   └── 08-authenticated-webpage.perf.ts
│
├── api/                      mock server (porta 3000)
│   └── src/
│       ├── server.ts         Express + chaos middleware
│       ├── middleware/chaos.ts
│       ├── routes/control.ts
│       └── store/memory-store.ts
│
└── docs/                     documentação
    ├── NOTION_ARTICLE.md
    ├── SLIDES_OUTLINE.md
    ├── create-slides.js
    └── Performance-Testing-com-IA.pptx 👈 SLIDES FINAIS
```

---

## Análise IA — workflow em 2 etapas

1. Você roda um exemplo (ex: `npm run example:chaos`)
2. O script salva um prompt em `results/.../pending-analysis/<kind>-prompt.md`
3. **No chat do Cursor**: peça `"Analise <caminho-do-prompt>"`
4. O agente do Cursor lê, analisa e salva como `<kind>-output.json`
5. Para sessões web, em seguida rode: `npm run analysis:apply -- <session-dir>`

Nada deixa sua máquina. Nenhuma chave de API. Modelo do Cursor (Opus/Sonnet) é mais robusto que LLMs gratuitos.

---

## Next Steps

### Imediato
- [ ] `npm install` em root + `cd api && npm install`
- [ ] `npm run example:simple` para validar setup
- [ ] Ler `IDP_CONTEXT.md`

### Para a talk de junho
- [ ] Revisar `docs/Performance-Testing-com-IA.pptx` (15 slides)
- [ ] Praticar: `simple` → `chaos` → análise no chat → `webpage` → `analysis:apply`
- [ ] Capturar screenshots de fallback

### Pós-talk (v1.0)
- [ ] OAuth / refresh tokens automáticos
- [ ] Encadeamento de testes (resultado de A alimenta B)
- [ ] Tendência entre sessões (gráfico)

---

## FAQ rápido

**P: Onde estão os slides?**  
R: `docs/Performance-Testing-com-IA.pptx`.

**P: Como rodar a demo principal?**  
R: Terminal 1: `cd api && npm run dev`. Terminal 2: `npm run example:chaos`. Depois peça no chat: `"Analise o prompt em pending-analysis"`.

**P: Preciso de alguma chave de API?**  
R: Não. A análise IA roda dentro do próprio Cursor (sem Groq, Gemini, OpenAI ou Anthropic).

**P: Como atualizo os slides?**  
R: Edite `docs/create-slides.js`, rode `node create-slides.js` na pasta `docs/`.

**P: Mock API na porta 3000 ocupada?**  
R: Mate o processo: `lsof -i :3000` (macOS/Linux) e mate o PID.

---

**Cloned on**: 2026-04-27  
**Ready for**: presentation prep (compliance-clean, sem LLMs externos)  
**Talk date**: June 27, 2026
