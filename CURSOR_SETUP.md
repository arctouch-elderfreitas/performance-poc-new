# Cursor Setup Guide

Guia rápido de setup do projeto no Cursor IDE (conta corporativa).

---

## Step 1: Clone & Open in Cursor

```bash
git clone https://github.com/arctouch-elderfreitas/performance-poc-new.git
cd performance-poc-new
cursor .
```

O Cursor lê automaticamente o `.cursorrules` e carrega o contexto do projeto.

---

## Step 2: Environment Setup

**Não é necessário criar `.env`** para a maioria dos casos. O projeto não usa chaves de API externas — toda análise IA roda dentro do agente do Cursor.

Se quiser overrides pontuais (URL alternativa, thresholds estritos, etc.), copie o exemplo:

```bash
cp .env.example .env
```

E edite as variáveis comentadas conforme necessário.

---

## Step 3: Dependencies

```bash
npm install
cd api && npm install && cd ..
```

Verifique a versão do Node:

```bash
node --version  # deve ser 18+
```

---

## Step 4: First Run

Terminal 1 (Mock API):

```bash
cd api && npm run dev
# Roda em http://localhost:3000
```

Terminal 2 (Test):

```bash
npm run example:simple
# Métricas em ~5 segundos
```

Se você ver as métricas no terminal → **tudo funcionando**.

---

## Step 5: Análise IA via Cursor agent

Para gerar análise IA dos resultados:

1. Rode um exemplo que produza prompt (`example:chaos`, `example:webpage`, `example:ai`)
2. O terminal mostrará algo como:
   ```
   🤖 Para análise IA detalhada via Cursor agent, peça no chat:
      "Analise results/api/chaos-2026-04-27.../pending-analysis/api-test-prompt.md"
   ```
3. Abra o chat do Cursor (Cmd+L) e peça exatamente isso
4. O agente lê o prompt, gera análise estruturada e salva como `<kind>-output.json`
5. **Para sessões web**, em seguida rode:
   ```bash
   npm run analysis:apply -- results/web-perf/<timestamp>
   ```
   para fundir a análise no `session-report.html`

---

## Cursor + Git

```bash
git add .
git commit -m "feat: <change>"
git push origin main
```

---

## Talk Presentation (June 27, 2026)

**Demo sequence** (20 min):

1. `npm run example:simple` — métricas básicas (2 min)
2. `npm run example:chaos` — comparação de 4 cenários (5 min)
3. **No chat do Cursor**: "Analise o prompt em pending-analysis" → mostrar análise (3 min)
4. `npm run example:webpage` — Lighthouse (5 min)
5. **No chat do Cursor**: analisar a sessão web → `npm run analysis:apply` → abrir HTML (5 min)

**Slides**: `docs/Performance-Testing-com-IA.pptx` (15 slides).

**Fallback**: Se algo falhar ao vivo, screenshots dos exemplos já estão em `results/`.

---

## Quick Reference

| Task | Command |
|------|---------|
| Run simple test | `npm run example:simple` |
| Chaos engineering | `npm run example:chaos` |
| Lighthouse | `npm run example:webpage` |
| Comparar APIs | `npm run example:public` |
| Aplicar análise IA | `npm run analysis:apply -- <session-dir>` |
| Regerar slides | `cd docs && node create-slides.js` |
| Matar mock API | `lsof -i :3000` (macOS/Linux) |

---

## Troubleshooting

**P: "Port 3000 already in use"**  
R: Mate o processo na 3000 ou rode em outra porta editando `api/src/server.ts`.

**P: "Chrome not found" (erro do Lighthouse)**  
R: O Lighthouse precisa do Chrome instalado. Instale em google.com/chrome.

**P: "Module not found" (TypeScript)**  
R: Rode `npm install` em root e em `api/`.

**P: O agente do Cursor não está respondendo a "Analise X"**  
R: Verifique se você abriu o chat do Cursor (Cmd+L) e se o caminho do arquivo está correto. O agente lê arquivos relativos ao workspace root.

---

## Next Development Steps

Pós-talk (após 27 de junho):

1. **OAuth / refresh tokens**: bearer + refresh logic, headers configuráveis
2. **Test chaining**: passar resposta de teste A para teste B
3. **Tendência entre sessões**: agregar `session-summary.json` ao longo do tempo
4. **Cruzamento com CrUX**: combinar lab data (Lighthouse) com field data (Chrome UX Report)

---

**See IDP_CONTEXT.md for full project details.**
