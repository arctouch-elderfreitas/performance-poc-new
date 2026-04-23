# IDP Context — Performance Testing POC

**Author**: Elder Freitas — QA Analyst  
**Period**: April—June 2026  
**Goal**: Build AI-powered performance testing framework for QA team presentation  
**Status**: ✅ MVP Complete — Ready for Cursor migration

---

## Project Overview

Framework automatiza o ciclo completo de testes de performance:
1. **Generate** test configs via IA (opcional)
2. **Execute** HTTP requests in parallel + collect metrics
3. **Analyze** results with IA → actionable insights

Plus:
- **Mock API** (local, controllable) with chaos middleware
- **Lighthouse** integration for webpage Core Web Vitals
- **Groq** (free LLaMA) for AI analysis

---

## What's Done ✅

### Core Framework
- `src/engines/http-engine.ts` — HTTP load testing orchestrator
- `src/engines/lighthouse-engine.ts` — Webpage testing via Lighthouse
- `src/generators/test-generator.ts` — AI-powered test config generation
- `src/parsers/result-parser.ts` — AI analysis with Groq fallback chain (Groq → Gemini → Anthropic → rules)
- `src/utils/` — HTTP client, metrics processor, logger

### Mock API
- `api/src/server.ts` — Express on port 3000
- `api/src/middleware/chaos.ts` — Latency + error injection + timeout control
- `api/src/routes/control.ts` — Dynamic chaos config via HTTP
- `api/src/store/memory-store.ts` — In-memory users/products/orders + seed data

### Tests/Examples
All 6 examples working and integrated:
1. `01-simple-get.perf.ts` — Basic GET metrics
2. `02-load-test.perf.ts` — Multi-endpoint parallel load
3. `03-ai-generated-test.perf.ts` — IA gera config
4. `04-chaos-test.perf.ts` — 4 cenários (baseline, latency 200ms, errors 20%, combined)
5. `05-public-api-test.perf.ts` — JSONPlaceholder vs local comparison
6. `06-webpage-test.perf.ts` — Lighthouse on arctouch.com (mobile 3G + desktop)

All examples:
- Import `../../src/config/env` at top (loads GROQ_API_KEY)
- Target localhost:3000 or arctouch.com
- Full AI analysis + comparison tables

### Documentation
- `README.md` — Setup, examples, metrics reference
- `docs/NOTION_ARTICLE.md` — ~1500-word Notion article
- `docs/SLIDES_OUTLINE.md` — 15-slide talk structure + presenter notes
- `docs/create-slides.js` — pptxgenjs script (15 slides, color palette, all content)
- `docs/Performance-Testing-com-IA.pptx` — Final PPTX ready for presentation

### Configuration
- `.env` — GROQ_API_KEY + TARGET_API_URL (both required)
- `tsconfig.json` — Node.js 18+, ES2020, strict mode, Jest types removed
- `package.json` — All deps installed (pptxgenjs, lighthouse@9, chrome-launcher, groq, etc)

---

## Technical Decisions

| Choice | Why |
|--------|-----|
| Node.js 18+ + TypeScript | Team familiarity, type safety |
| Groq (free) over ChatGPT | No billing, fast inference, good for team |
| Lighthouse v9 (not v10+) | CommonJS compatibility, Chrome integration |
| Mock API (Express) | Simple, widely known, chaos middleware easy to add |
| CommonJS modules | Stable ecosystem for Node.js projects |

---

## Groq Setup (Critical)

1. Visit [console.groq.com](https://console.groq.com)
2. Create free account
3. Generate API key
4. Add to `.env`: `GROQ_API_KEY=gsk_...`
5. Model: `llama-3.1-8b-instant` (hardcoded in result-parser.ts)

---

## Running the Project

### Terminal 1: Mock API
```bash
cd api
npm run dev
# Runs on http://localhost:3000
```

### Terminal 2: Tests
```bash
npm run example:simple    # Quick test
npm run example:chaos     # Best demo — 4 scenarios
npm run example:webpage   # Lighthouse test
npm run example:public    # JSONPlaceholder vs local
```

---

## Remaining Gaps (for v1.0)

- [ ] OAuth / dynamic auth (refresh tokens)
- [ ] Test chaining (result of A feeds into B)
- [ ] HTML report export
- [ ] CI/CD integration with thresholds
- [ ] Advanced chaos patterns (network jitter, partial timeouts)

---

## Talk Details (June 2026)

**Audience**: QA Team (8–12 people)  
**Duration**: 1 hour  
**Format**: Slides + live demo (terminal)

**Structure**:
1. Abertura (10 min) — Slide 1–2
2. O que é performance (10 min) — Slide 3–5
3. Como funciona (10 min) — Slide 6–8
4. Demo ao vivo (20 min) — Terminal (examples 1, 4, 6)
5. Resultados (5 min) — Slide 10
6. Q&A (5 min) — Slide 15

**Key points**:
- Performance não é especialista → IA elimina barreira de interpretação
- Testes rodam em minutos, resultados prontos
- Aplica-se desde hoje em endpoints reais

**Demo fallback**: Screenshots pré-capturados (no internet dependency)

---

## File Structure

```
performance-testing-poc/
├── src/
│   ├── config/env.ts              # Env vars (GROQ_API_KEY, etc)
│   ├── engines/
│   │   ├── http-engine.ts         # Load test orchestrator
│   │   └── lighthouse-engine.ts   # Webpage testing
│   ├── generators/
│   │   └── test-generator.ts      # AI test config generation
│   ├── parsers/
│   │   └── result-parser.ts       # Groq + fallback analysis
│   └── utils/
│       ├── http-client.ts         # HTTP + timing
│       ├── metrics-processor.ts   # P50/P95/P99 calc
│       └── logger.ts              # Terminal UI
├── tests/examples/
│   ├── 01-simple-get.perf.ts
│   ├── 02-load-test.perf.ts
│   ├── 03-ai-generated-test.perf.ts
│   ├── 04-chaos-test.perf.ts
│   ├── 05-public-api-test.perf.ts
│   └── 06-webpage-test.perf.ts
├── api/
│   ├── src/
│   │   ├── server.ts              # Express port 3000
│   │   ├── middleware/chaos.ts    # Latency + error injection
│   │   ├── routes/control.ts      # Dynamic config endpoints
│   │   └── store/memory-store.ts  # In-memory data + seed
│   └── package.json
├── docs/
│   ├── NOTION_ARTICLE.md          # ~1500 words
│   ├── SLIDES_OUTLINE.md          # 15-slide outline
│   ├── create-slides.js           # pptxgenjs script
│   └── Performance-Testing-com-IA.pptx (FINAL)
├── .env                           # GROQ_API_KEY, TARGET_API_URL
├── README.md                      # Setup + reference
├── package.json                   # Root deps
├── tsconfig.json
└── IDP_CONTEXT.md                 # This file
```

---

## Known Issues & Fixes Applied

| Issue | Solution |
|-------|----------|
| ANTHROPIC_API_KEY billing | Switched to Groq (free) |
| Groq JSON parse errors | Multi-attempt parser (raw → sanitize → regex) |
| Lighthouse EPERM on Windows | try/catch `chrome.kill()`, ignore code==='EPERM' |
| pptxgenjs module not found | npm init + npm install in docs/ |
| Options mutation in pptxgenjs | Use factory function `makeShadow()` per call |
| TypeScript jest types conflict | Removed from tsconfig types array |

---

## Next Steps (for Cursor)

1. Clone repo
2. Ensure Node.js 18+ installed
3. Create/get Groq API key (free at console.groq.com)
4. Add `.env`:
   ```
   GROQ_API_KEY=gsk_...
   TARGET_API_URL=http://localhost:3000
   ```
5. `npm install`
6. `cd api && npm install && cd ..`
7. Run examples: `npm run example:chaos`

---

## Metrics Reference

### API Metrics
- **P50/P95/P99** — Response time percentiles
- **Throughput** — Requests per second
- **Error Rate** — % of failed requests

### Core Web Vitals (Lighthouse)
- **FCP** — First Contentful Paint (< 1.8s)
- **LCP** — Largest Contentful Paint (< 2.5s)
- **TTI** — Time to Interactive (< 3.8s)
- **TBT** — Total Blocking Time (< 200ms)
- **CLS** — Cumulative Layout Shift (< 0.1)
- **TTFB** — Time to First Byte (< 200ms)

---

**Last updated**: 2026-04-16  
**Ready for**: Cursor IDE + corporate account migration
