# Roteiro de ensaio — Demo Quarta-feira (29/abr) — 30 min

> Apresentação ao vivo para o time de QA. Sem slides. Apenas Cursor IDE, terminal e o chat com agente.

**Estrutura visual durante toda a apresentação:**

```
┌────────────────────────────────────────┬──────────────────┐
│                                        │                  │
│  Editor (arquivo de apoio do bloco)    │                  │
│                                        │   Chat Cursor    │
├────────────────────────────────────────┤                  │
│ Terminal 1: API mock rodando           │                  │
│ Terminal 2: onde você digita os demos  │                  │
│                                        │                  │
└────────────────────────────────────────┴──────────────────┘
```

**Notação:**
- 🕐 = duração estimada do bloco
- 📺 = o que mostrar na tela
- 🗣️ = discurso literal (pode adaptar)
- ⌨️ = ação que você executa
- 🤖 = o que o agente do Cursor está fazendo nos bastidores

---

## Bloco 1 — Abertura (🕐 2 min)

### 📺 Tela
Cursor IDE limpo. Apenas terminais visíveis. Sem nada extra.

### 🗣️ O que falar

> "Oi pessoal, obrigado pelo tempo. Nas últimas semanas eu venho construindo um framework que automatiza testes de performance — tanto de API quanto de páginas web — e quero mostrar pra vocês o estado atual.
>
> O diferencial principal é que toda a análise dos resultados é feita por IA, mas **não é Groq, não é OpenAI, não é Anthropic**. É a própria IA do Cursor que vocês já têm aberto. Os dados nunca saem da máquina. Compliance-clean.
>
> Vou rodar tudo ao vivo aqui — sem slides, sem deck. Só terminal e o chat do Cursor à direita. Em 25 minutos vocês vão ver o framework testando uma API com chaos engineering, testando uma página web com Lighthouse, e a IA fazendo análise contextual de tudo isso. No final, perguntas.
>
> Bora começar."

---

## Bloco 2 — O problema que estamos resolvendo (🕐 3 min)

### 📺 Tela
Abra o `README.md` no editor. Role até a seção **"O que este projeto faz"** (linhas 1–18).

### ⌨️ Ação
```
Cmd+P → README.md
```

### 🗣️ O que falar

> "Antes de mostrar o framework, deixa eu contextualizar o problema que ele resolve.
>
> Hoje, quando alguém vem dizer 'tá lento', o que a gente normalmente faz? Abre o Postman, dispara uma request, vê um número aleatório. Sem baseline, sem percentil, sem comparação. Cada um mede de um jeito diferente.
>
> Pra página web é pior ainda. Maioria do time testa em desktop com fibra de 1 GB e libera. Mas o usuário real está no 4G de uma cidade do interior — e a experiência dele é completamente diferente. Lighthouse extension do Chrome roda só no contexto do seu navegador atual, então nem ela resolve isso direito.
>
> E quando a gente consegue medir, vem o segundo problema: **interpretar**. Quem aqui sabe de cabeça se P95 de 2300ms é ruim? Quem sabe se LCP de 3.2 segundos passa o threshold do Google? Esse conhecimento tá espalhado, e quem não trabalha com performance todo dia esquece.
>
> O framework resolve esses três problemas: padroniza a medição, força perfil de rede mobile real, e usa IA pra traduzir os números em recomendações acionáveis. Vamos ver isso funcionando."

### 🤖 O que estou fazendo
Nada ainda — só observando. Mas já estou com o `.cursor/rules/perf-demo.mdc` carregado em memória, esperando o gatilho `/perf`.

---

## Bloco 3 — Visão rápida do framework (🕐 2 min)

### 📺 Tela
Expanda o painel de arquivos do Cursor (Cmd+B). Apenas mostre, sem abrir cada um:
- `src/engines/`
- `src/parsers/result-parser.ts`
- `tests/examples/` (8 arquivos)
- `api/` (a mock API)

### 🗣️ O que falar

> "Estrutura é simples — quatro engines independentes:
>
> A pasta `src/engines/` tem o motor de carga HTTP, o motor do Lighthouse, e um runner que orquestra Lighthouse multi-URL. Esse último é importante porque a gente roda **a mesma URL em múltiplos perfis de rede em paralelo**. Pega 1 site, testa em mobile 3G simulado e em desktop broadband, e compara.
>
> Em `src/parsers/result-parser.ts` tá o parser de resultados — é ele que monta os prompts pra IA analisar. Voltando pra ele daqui a pouco, porque é onde mora a parte interessante.
>
> Em `tests/examples/` tem 8 exemplos prontos cobrindo cenários diferentes — load test puro, chaos engineering, Lighthouse, fluxo autenticado com Playwright. Cada um é um arquivo TypeScript de 50 a 100 linhas. Pra adaptar pro seu projeto, copia, troca a URL, e roda.
>
> A pasta `api/` é uma API mock — Express na porta 3000 — com um middleware de chaos que injeta latência e erros artificiais sob demanda. Vou usar ela pra demonstrar agora.
>
> Bora pro primeiro demo."

---

## Bloco 4 — Demo Chaos: rodando o teste (🕐 5 min)

### 📺 Tela
Feche o painel de arquivos. Tela: editor com `tests/examples/04-chaos-test.perf.ts` aberto à esquerda, terminal embaixo.

### ⌨️ Ação
```
Cmd+P → 04-chaos-test.perf.ts
```

### 🗣️ O que falar (antes de rodar)

> "Esse é o arquivo de teste de chaos. 100 linhas, com comentários. Vou narrar rapidinho o que ele faz: ele roda quatro cenários sequenciais, cada um com 60 requisições paralelas a três endpoints da API mock.
>
> No primeiro, baseline — API normal, sem nada injetado. No segundo, eu programaticamente ligo 200 milissegundos de latência via o endpoint `/control/config` da mock API. No terceiro, 20% de taxa de erros. No quarto, latência mais erros combinados.
>
> Nenhum desses cenários muda código. Muda só o comportamento da API por baixo. É exatamente o tipo de regressão que vocês investigam quando algum dev mexe numa query mal indexada ou num timeout de pool."

### ⌨️ Ação
No Terminal 2:
```bash
npm run perf:reset
npm run perf:chaos
```

### 🗣️ O que falar (enquanto roda — uns 12 segundos)

> "O que tá acontecendo agora: 60 conexões paralelas pra cada cenário, coletando timestamp de cada request, calculando percentis, throughput, error rate. Tudo em memória, zero dependência externa pra rodar isso."

### 📺 Quando terminar
Aponte com o cursor pra tabela final:

```
Cenário                  Avg     P95     P99   Erro%       RPS
Baseline               3.4ms  13.0ms  15.0ms    0.0%      3000
Latência 200ms       203.6ms 248.0ms 251.0ms    0.0%        60
Erros 20%              1.6ms   3.0ms   3.0ms   18.9%      6000
Combinado            133.8ms 178.0ms 182.0ms   11.7%        85
```

### 🗣️ O que falar (interpretando a tabela)

> "Três coisas pra notar aqui — e essas três coisas são o tipo de insight que vocês esperam ter.
>
> Primeiro, olha o cenário 'Latência 200ms'. Eu injetei 200ms ± 50ms. O P95 medido foi 248ms. **Detecção precisa** — a injeção e a medição batem. Isso confirma que o framework é confiável: o que ele reporta é o que tá acontecendo de verdade.
>
> Segundo, olha o throughput — RPS. No baseline era 3000 RPS. Quando eu injetei latência, caiu pra 60. Cinquenta vezes menos. Por quê? Porque com 60 conexões paralelas, se cada uma fica bloqueada 200ms, o sistema inteiro estagna. Erros não derrubam throughput — a request falha rápido. Latência derruba.
>
> Terceiro, no cenário combinado, o P95 caiu pra 178ms — **menos** que latência sozinha — porque os 10% de erros falham instantaneamente e baixam a média. Esse é o tipo de gotcha que o framework deixa explícito.
>
> Mas até agora isso é só medição. A pergunta que importa é: **o que eu faço com isso?** É aí que entra a IA."

### 🤖 O que estou fazendo
Em paralelo a isso o framework já salvou um arquivo `pending-analysis/api-test-prompt.md` no diretório de resultados. Esse arquivo tem o prompt completo pronto pra eu analisar.

---

## Bloco 5 — Análise IA com `/perf` (🕐 5 min) ⭐ MOMENTO CHAVE

### 📺 Tela
Aponte pra última linha do output do terminal — o framework imprime o caminho exato do prompt salvo na sessão recém-criada (com timestamp atual). Algo como:

```
🤖 Análise IA: digite "/perf" no chat do Cursor
   (prompt salvo em results/api/chaos-<timestamp>/pending-analysis/api-test-prompt.md)
```

### 🗣️ O que falar (preparando o terreno)

> "Olha essa última linha. Em vez de mandar esses dados pra um LLM externo — Groq, OpenAI, Anthropic, qualquer coisa que precise chave de API — o framework fez uma coisa diferente: ele salvou um **arquivo de prompt** em disco, no diretório dos resultados.
>
> Aproveitando, vou abrir esse arquivo pra vocês verem o que tá nele."

### ⌨️ Ação
**Segure Cmd e clique no path que o terminal imprimiu** — o Cursor transforma paths em links clicáveis e abre direto no editor.

> **Dica de palco:** isso é mais limpo que abrir manualmente, e visualmente reforça a mensagem ("o framework te entrega o link, é só clicar"). Se por algum motivo o Cmd+click falhar (terminal externo, etc.), recorra ao plano B abaixo.
>
> **Plano B (fallback):** os arquivos em `results/` estão no `.gitignore` e não aparecem no Cmd+P por padrão. Use o **explorer lateral** (Cmd+B pra abrir): expanda `results/api/chaos-<recente>/pending-analysis/` e clique no `api-test-prompt.md`. Os arquivos gitignorados aparecem em opacidade reduzida mas são clicáveis.

### 🗣️ O que falar (mostrando o conteúdo do prompt)

> "Esse arquivo tem três coisas: contexto do que o framework tá pedindo, todas as métricas do teste — number of requests, success/failure, percentis, throughput — e instruções de **formato** do output esperado: um JSON com summary, issues, recomendações e próximos passos.
>
> Esse arquivo é a interface entre o framework e a IA. Aí vem a parte legal."

### ⌨️ Ação
Abra o chat do Cursor (Cmd+L se ainda não estiver aberto). Digite literalmente:

```
/perf
```

E pressione Enter.

### 🗣️ O que falar (enquanto eu trabalho — uns 20 segundos)

> "Esses três caracteres — barra-perf — são tudo que eu preciso digitar pro agente do Cursor entender que: 'olha, tem um teste rodado recentemente, vai lá nos resultados, encontra os prompts pendentes, analisa e me devolve a resposta'.
>
> Isso funciona porque eu defini um arquivo de regra do projeto, em `.cursor/rules/perf-demo.mdc`, que ensina o agente o que fazer quando vê esse gatilho. É uma skill personalizada por projeto.
>
> Enquanto ele tá processando: o que ele tá fazendo é literalmente ler aquele arquivo de prompt que eu mostrei, gerar uma análise contextual seguindo o schema, e salvar o resultado como JSON no mesmo diretório. **Nada disso saiu da minha máquina.** É o modelo do Cursor — Opus, no meu caso — rodando localmente. Mais robusto que llama-3.1-8b do Groq, e compliance-clean pra nossa empresa."

### 🤖 O que estou fazendo nos bastidores

Quando você digita `/perf`, eu:
1. Faço `Glob` em `results/api/*` e `results/web-perf/*` pra achar a sessão mais recente
2. Faço `Glob` por `pending-analysis/*-prompt.md` nessa sessão
3. Para cada prompt, leio o conteúdo todo (Read tool)
4. **Gero a análise** — interpreto métricas, conecto patterns, formulo recomendações específicas pra esse cenário
5. Salvo o JSON resultante (Write tool) como `*-output.json`
6. Te respondo com 1 linha de confirmação + o summary

### 📺 Quando eu terminar
Vai aparecer no chat algo como:
> ✅ Análise aplicada em `results/api/chaos-...` (1 prompt processado)
>
> "Latência injetada de 200ms se traduziu fielmente no P95 medido (248ms)..."
>
> Output: `results/api/chaos-.../pending-analysis/api-test-output.json`

### ⌨️ Ação
No chat, eu (agente) já te respondi com o caminho do output entre crases (ex: `results/api/chaos-.../pending-analysis/api-test-output.json`). **Cmd+click nesse path** no chat — abre direto no editor.

> **Dica de palco:** paths em mensagens do chat também são clicáveis. Se preferir o explorer lateral, é o mesmo `pending-analysis/` da etapa anterior.

### 🗣️ O que falar (mostrando a análise)

> "Olha o summary que ele me deu — leiam comigo: '[lê o summary que apareceu]'. E aqui embaixo, três issues, três recomendações, três próximos passos. Tudo contextual ao teste que acabei de rodar.
>
> Repara que ele detectou coisas que requereriam um especialista pra ver: ele percebeu que o P95 e o P99 estão muito próximos, o que indica latência **determinística** — não saturação real. Ele percebeu que o piso mínimo medido foi 155ms, o que confirma que o chaos middleware tá respeitando o variance de 50ms. Esse é o tipo de leitura que eu não esperaria de um QA que não vive em performance — e agora você tem isso de graça em cada teste."

---

## Bloco 6 — Demo Web: rodando o Lighthouse (🕐 5 min)

### 📺 Tela
Abra `tests/config/web-perf.json` no editor.

### ⌨️ Ação
```
Cmd+P → web-perf.json
```

### 🗣️ O que falar (mostrando o JSON)

> "Mudando de cenário. Agora performance de **página web**. Toda a config tá nesse JSON: a URL, os perfis de rede, e quantos runs por perfil.
>
> Hoje tô testando uma URL em dois perfis: mobile-3g — que aplica throttling realista de 3G mais CPU 4× mais lento, simulando um celular médio em rede ruim — e desktop-broadband, que é o cenário ideal. Em produção a gente roda 3 runs por perfil e tira a mediana, mas pra demo simplifiquei pra 1 run cada, pra ficar em uns 40 segundos.
>
> Isso é fundamental: **vocês precisam testar mobile com perfil mobile**. Lighthouse extension do Chrome não força throttling de rede de verdade. O framework força. É a diferença entre achar que tá bom e saber que tá bom."

### ⌨️ Ação
No Terminal 2:
```bash
npm run perf:web
```

### 🗣️ O que falar (enquanto roda — uns 40 segundos)

> "Por baixo: o framework abre Chrome em modo headless, configura o emulador de rede com 1.6 megabits de banda e RTT de 150ms, navega até a página, deixa carregar até estar interativa, e captura todos os Web Vitals. FCP, LCP, TBT, CLS, TTFB. Depois faz a mesma coisa no perfil desktop, sem throttling, pra ter o ponto de comparação.
>
> Cada execução gera quatro arquivos: o `.lhr.json` que é o relatório bruto do Lighthouse com todas as auditorias, o `.metrics.json` com as métricas extraídas, o `.report.html` que é a tela visual padrão do Lighthouse, e — o mais importante pra gente — entradas no `session-summary.json` que é o resumo da sessão inteira."

### 📺 Quando terminar
Aponte pro output do terminal — deve aparecer um stat strip no final.

### 🗣️ O que falar (rapidamente, antes de chamar `/perf`)

> "Sessão pronta. Mas eu não vou ler número por número aqui pra vocês — seria chato e vocês esqueceriam. Vou pedir pra IA fazer a análise."

---

## Bloco 7 — `/perf` na sessão web (🕐 5 min) ⭐ MOMENTO CHAVE 2

### ⌨️ Ação
No chat do Cursor, digite:

```
/perf
```

### 🗣️ O que falar (enquanto eu trabalho — uns 30 segundos)

> "Mesmo gatilho, comportamento diferente — porque agora a sessão é de web-perf, não de API. O agente reconhece isso pelo path, e faz três coisas em vez de uma:
>
> Primeiro, ele analisa a **sessão inteira** — olha todas as URLs e perfis juntos, e procura padrões que repetem. Tipo 'TTFB acima de 600ms em todas as páginas → problema sistêmico de servidor, não de página individual'. Esse tipo de análise cross-URL é onde a IA brilha — ela conecta dots que vocês teriam que fazer manualmente abrindo arquivo por arquivo.
>
> Segundo, ele analisa **o pior cenário individual** — pega a URL com menor performance score e diagnostica em detalhe. Aqui ele considera o contexto de throttling: se o pior cenário é mobile3G, ele não vai julgar o LCP usando os mesmos critérios de desktop broadband.
>
> Terceiro, e isso é o que muda o jogo: ele **funde os dois insights no relatório HTML** automaticamente, rodando `npm run analysis:apply` por baixo, e abre o relatório no browser pra vocês verem o resultado final."

### 🤖 O que estou fazendo nos bastidores
1. Detecto que a sessão tá em `results/web-perf/...`
2. Encontro **dois** prompts: `web-session-prompt.md` (cross-URL) e `web-worst-prompt.md` (URL individual)
3. Leio cada um, gero análise específica pra cada tipo
4. Salvo `web-session-output.json` e `web-worst-output.json`
5. **Rodo `npm run analysis:apply -- <session-dir>`** via Shell tool
6. **Rodo `open <session-dir>/session-report.html`** pra abrir o browser
7. Te respondo confirmando

### 📺 Quando o browser abrir com o HTML
O `session-report.html` deve aparecer numa nova aba do browser.

### 🗣️ O que falar (mostrando o HTML)

> "Pronto. Olha esse relatório. Tudo que vocês estão vendo aqui foi gerado em runtime — não tem template estático.
>
> Em cima, o stat strip: total de cenários, total de URLs testadas, score médio. Isso é o snapshot rápido pra alguém que abre o relatório em 5 segundos.
>
> Logo abaixo, o **bloco 'Análise por IA'** — esse aqui [aponte com o cursor]. Esse bloco tem duas partes: a análise da sessão inteira, com aquele padrão cross-URL que eu mencionei, e a análise do pior cenário, com diagnóstico específico. Cada uma tem summary, issues identificados, recomendações concretas, e próximos passos numerados.
>
> Mais embaixo, a tabela resumo de todos os cenários — colorido em verde, amarelo e vermelho seguindo os thresholds do Google pra Web Vitals. E ainda mais embaixo, cards detalhados por cenário com cada métrica e os top 5 opportunities do Lighthouse.
>
> Tudo isso é **um arquivo HTML autossuficiente**. Dá pra anexar em ticket do Jira, mandar no Slack, abrir num PR, mandar pro time de dev. Eles abrem no browser e leem em 2 minutos. Não precisa instalar nada. Não precisa de credencial. E **agora vem com análise IA embutida sem ter mandado nada pra fora.**
>
> Esse é o ponto pra um QA que não conhece Web Vitals em profundidade: a IA traduz os números em ações. Você não precisa virar especialista em performance pra usar. Você roda o teste, digita `/perf`, e tem um relatório pronto pra encaminhar."

---

## Bloco 8 — Wrap-up (🕐 3 min)

### 📺 Tela
Feche o browser do HTML, volte pro Cursor com terminal vazio.

### 🗣️ O que falar

> "Recapitulando o que vocês acabaram de ver — em 25 minutos:
>
> Um framework que roda **load test de API com chaos engineering** numa direção, e **Lighthouse multi-perfil** noutra, ambos com **análise IA contextual** automática.
>
> Os dois pontos que diferenciam isso de qualquer ferramenta de mercado:
>
> Primeiro: **a IA roda dentro do Cursor**. Os dados de teste — métricas, payloads, configs — nunca saem da máquina de vocês. Não tem chave de API pra gerenciar, não tem custo, não tem governança extra. Compliance-clean.
>
> Segundo: **o esforço de uso é um comando + uma barra**. Roda `npm run perf:chaos`, digita `/perf`, recebe a análise. Roda `npm run perf:web`, digita `/perf`, recebe o relatório HTML pronto. Não tem ritual, não tem boilerplate.
>
> O que isso muda no dia a dia de vocês: hoje quando alguém vem 'tá lento', vocês vão poder responder com **número, contexto e recomendação** em 2 minutos, pra qualquer endpoint ou página. Pra cada PR de mudança de schema de banco, pra cada deploy de feature, pra cada investigação de incidente.
>
> O código tá no GitHub corporativo — link mando no chat depois. Quem quiser usar nos seus projetos eu ajudo a adaptar — começa com `npm install`, sobe a mock API ou aponta pra um endpoint real, e tá rodando em 5 minutos.
>
> Pra Junho — na talk completa que vou dar pro time inteiro de QA — eu pretendo ter encadeamento de testes onde o resultado de A alimenta B, gráfico de tendência entre sessões, e cruzamento com a CrUX API do Google pra combinar dado de lab com dado de field. Mas o que tá aqui hoje já é usável.
>
> Perguntas?"

---

## Anti-disaster — script de recuperação

Se algo travar durante a demo, **respira fundo** e use estas rotas:

| Falha | Resposta verbal | Ação |
|---|---|---|
| Mock API caiu | "Esquece, hoje a porta tá possuída — deixa eu subir de novo" | `cd api && npm run dev` em outro terminal |
| Porta 3000 ocupada | "Esse problema clássico, sempre tem algum chrome zumbi" | `lsof -i :3000` → mate o PID → relance |
| Internet caiu durante o web demo | "Na real, a parte mais legal é o chaos. Vou focar nele." | Fica no chaos, pula o web |
| `/perf` demorando muito | "Normalmente leva 20 segundos, mas tem dia que o modelo tá meio lento. Vou continuar falando." | Continue conversando, eu vou aparecer |
| Lighthouse trava (Chrome zombie) | "Chrome ficou preso, deixa eu matar." | `pkill -9 chrome` → relance |
| Tudo deu errado | "Deixa eu mostrar o que tinha rodado antes da reunião." | Abra os screenshots do `~/demo-fallback/` |

---

## Marcos de tempo durante a apresentação

Cole isso num post-it na tela ou tenha de cabeça:

| Minuto | Onde você devia estar |
|---|---|
| 00:00 → 02:00 | Abertura |
| 02:00 → 05:00 | O problema |
| 05:00 → 07:00 | Visão do framework |
| 07:00 → 12:00 | Chaos rodando + tabela explicada |
| 12:00 → 17:00 | `/perf` chaos + análise IA mostrada |
| 17:00 → 22:00 | Web rodando + JSON config explicado |
| 22:00 → 27:00 | `/perf` web + HTML aberto e mostrado |
| 27:00 → 30:00 | Wrap-up |

Se você tá em **22:00 ainda no chaos**, pula direto pro `/perf` web — não enrola. Se tá em **27:00 ainda mostrando o HTML**, encerra rápido e abre Q&A.

---

## Checklist final de Quarta de manhã (1h antes)

```
□ git pull origin main
□ npm install (root + api/)
□ npm run perf:reset
□ Terminal 1: cd api && npm run dev (deixar rodando)
□ Terminal 2: npm run example:simple (sanity check)
□ Cursor com chat aberto (Cmd+L)
□ Fonte do terminal aumentada (todos precisam ler)
□ Painel de arquivos colapsado
□ ~/demo-fallback/ com screenshots dos 2 outputs (chaos + web HTML)
□ README.md aberto numa tab pronto pro Bloco 2
□ web-perf.json aberto numa tab pronto pro Bloco 6
□ Aviso no Slack do time: "demo às X horas, link da call"
□ Webcam/microfone testados se for remoto
□ Garrafa de água do lado
```

---

## Comandos de referência rápida

```bash
npm run perf:reset       # limpa results/ e reseta chaos da API
npm run perf:chaos       # roda os 4 cenários de chaos
npm run perf:web         # roda Lighthouse multi-perfil
npm run perf:chaos-web   # combo (se quiser mostrar tudo junto)

# No chat do Cursor (Cmd+L):
/perf                    # analisa a sessão mais recente automaticamente
/perf:reset              # limpa todos os outputs (não os prompts)
```

### Como abrir arquivos em `results/` durante a demo

`results/` está no `.gitignore`, então **Cmd+P NÃO acha** os arquivos lá. Três jeitos práticos, em ordem de preferência:

| Cenário | Ação | Comentário |
|---|---|---|
| Path apareceu no terminal (após `npm run perf:*`) | **Cmd+click no path** | Mais elegante na demo |
| Path apareceu no chat (após `/perf`) | **Cmd+click no path entre crases** | Mesma lógica |
| Não tem path à mão | **Cmd+B → explorer → expandir `results/`** | Arquivos gitignorados aparecem com opacidade reduzida, mas são clicáveis |

> Se quiser que o Cmd+P passe a achar arquivos em `results/`, dá pra desligar `search.useIgnoreFiles` nas settings do Cursor — mas pra demo rápida, Cmd+click é mais limpo.

---

**Sugestão de ensaio**: rode o roteiro completo de ponta a ponta hoje ou amanhã, cronometrando. Se passar de 30 min, corte palavras dos discursos longos — não corte demos.
