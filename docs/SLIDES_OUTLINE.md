# Talk: Testes de Performance com IA
**Duração**: 1 hora
**Audiência**: Equipe de QA
**Formato**: Slides + Demo ao vivo

---

## Estrutura geral

| Bloco | Tempo | Tipo |
|---|---|---|
| Abertura e contexto | 10 min | Slides |
| O que é performance | 10 min | Slides |
| Como o framework funciona | 10 min | Slides |
| Demo ao vivo | 20 min | Terminal |
| Resultados reais e aprendizados | 5 min | Slides |
| Q&A | 5 min | Aberto |

---

## Slide a slide

---

### Slide 1 — Capa
**Título**: Testes de Performance com IA: do zero ao ciclo completo
**Subtítulo**: Como automatizamos geração, execução e análise de testes
**Autor**: Elder Freitas — QA Analyst
**Data**: Junho 2026

---

### Slide 2 — A pergunta que todo mundo já teve
**Título**: "Quando foi a última vez que você testou performance antes de ir pra prod?"

**Conteúdo**:
- [Silêncio constrangedor]
- Não é falta de vontade — é barreira de entrada
- Ferramentas complexas, configuração manual, interpretação difícil
- Resultado: performance vira pauta quando o usuário reclama

**Nota do apresentador**: Abrir com pergunta direta para engajar. Pausar para deixar a audiência pensar.

---

### Slide 3 — O custo de ignorar
**Título**: Performance ruim tem custo real

**Conteúdo** (bullets):
- 1 segundo a mais no carregamento = -7% em conversão (Amazon, 2006)
- 53% dos usuários mobile abandonam páginas que demoram mais de 3s (Google)
- Performance degradada em produção = incidente = madrugada acordada

**Nota do apresentador**: Números conhecidos, mas impactantes. O ponto é mostrar que isso tem custo de negócio, não só técnico.

---

### Slide 4 — O vocabulário (APIs)
**Título**: O que estamos medindo: APIs

**Conteúdo** (tabela simples):
```
P50  → experiência típica
P95  → o que você promete no SLA
P99  → experiência do usuário com pior sorte
Throughput → quantas req/segundo o sistema aguenta
Error Rate → % de falhas
```

**Nota do apresentador**: Enfatizar que média é enganosa. Uma API com P50 de 50ms e P99 de 8s parece ótima nas médias.

---

### Slide 5 — O vocabulário (Webpages)
**Título**: O que estamos medindo: páginas web

**Conteúdo** (Core Web Vitals com semáforos):
```
🟢 FCP  < 1.8s   → primeiro conteúdo visível
🟢 LCP  < 2.5s   → maior elemento carregado
🟢 TTI  < 3.8s   → página ficou interativa
🟢 TBT  < 200ms  → tempo bloqueando o usuário
🟢 CLS  < 0.1    → layout não "pulou"
🟢 TTFB < 200ms  → servidor respondeu
```

**Nota do apresentador**: Mostrar que o Google usa isso para ranking. SEO e UX estão conectados.

---

### Slide 6 — O ciclo sem IA vs com IA
**Título**: O que muda com IA no ciclo

**Conteúdo** (dois lados lado a lado):

Sem IA:
1. Escrever script manualmente
2. Configurar parâmetros
3. Executar
4. Interpretar números (o que é bom?)
5. Escrever relatório

Com IA:
1. Apontar para o endpoint
2. Executar
3. ✅ Análise pronta

**Nota do apresentador**: O ponto não é substituir expertise — é eliminar a barreira de interpretação que trava a adoção.

---

### Slide 7 — Arquitetura do framework
**Título**: Como o framework funciona

**Conteúdo** (diagrama de fluxo):
```
[IA gera config]
      ↓
[Engine HTTP dispara requests paralelos]
      ↓
[Coleta: tempo, status, tamanho]
      ↓
[Calcula P50/P95/P99/Throughput]
      ↓
[IA analisa e entrega diagnóstico]
```

**Nota do apresentador**: Mostrar que a IA entra em dois momentos — geração e análise. O meio (execução e métricas) é determinístico.

---

### Slide 8 — A API Mock e o Chaos
**Título**: Testando o pior cenário com Chaos Engineering

**Conteúdo**:
- API mock local com comportamento controlável
- Você define: latência, taxa de erro, timeout
- Compara baseline vs condições adversas automaticamente

Resultado real:
```
Baseline       → 3ms avg,  2813 RPS
Latência 200ms → 209ms avg,  60 RPS  (-97%)
Erros 20%      → 3ms avg, 2687 RPS
Combinado      → 141ms avg,  81 RPS
```

**Nota do apresentador**: O número mais impactante é a queda de 97% no throughput com apenas 200ms de latência. Latência mata throughput.

---

### Slide 9 — Demo ao vivo (20 min)
**Título**: Demo

**Sequência**:
1. `cd api && npm run dev` → sobe a API mock
2. `npm run example:simple` → GET básico, mostrar métricas
3. `npm run example:chaos` → mostrar comparativo dos 4 cenários
4. `npm run example:webpage` → Lighthouse no arctouch.com

**Fallback** (se internet falhar): screenshots dos outputs já capturados

**Nota do apresentador**: Ter terminal aberto antes da demo. Deixar o chaos test rodar enquanto comenta o que está acontecendo.

---

### Slide 10 — Resultados reais: arctouch.com
**Título**: O que encontramos no arctouch.com

**Conteúdo** (tabela):
```
             Mobile    Desktop
Score         30/100    76/100
LCP          8857ms    1932ms
TTI         16433ms    2078ms
TBT          1628ms     227ms
```

**Diagnóstico da IA**:
- JS não utilizado: 3810ms de economia potencial
- TTFB 1200ms: ausência de CDN
- Site otimizado para desktop, mobile crítico

**Nota do apresentador**: Nenhuma dessas conclusões exigiu expertise manual. A IA interpretou os números e entregou o diagnóstico.

---

### Slide 11 — Stack e decisões
**Título**: Por que essa stack?

**Conteúdo**:
- Node.js + TypeScript → familiaridade da equipe
- Módulos nativos do Node → zero dependências HTTP externas
- Groq (LLaMA) → gratuito, sem cartão de crédito
- Lighthouse → padrão do mercado para web vitals
- Express na mock API → simples, amplamente conhecido

**Princípio**: funcionar em ambientes corporativos com restrições de rede.

---

### Slide 12 — O que ainda falta (honestidade)
**Título**: O que o framework ainda não faz

**Conteúdo**:
- Autenticação dinâmica (OAuth, refresh token)
- Testes de fluxo encadeado (resultado de A alimenta B)
- Relatório HTML exportável
- Integração com CI/CD com thresholds de aprovação

**Nota do apresentador**: Ser honesto sobre limitações aumenta credibilidade. Esses são os itens do roadmap para v1.0.

---

### Slide 13 — Como usar agora
**Título**: Como começar hoje

**Conteúdo** (passo a passo):
1. Clone o repositório
2. Crie uma chave gratuita no [console.groq.com](https://console.groq.com)
3. Configure o `.env`
4. `npm run example:chaos`

**Nota do apresentador**: O chaos test é o melhor ponto de entrada — ele sozinho conta uma história completa sem precisar de configuração.

---

### Slide 14 — Fechamento
**Título**: Performance não precisa ser assunto de especialista

**Conteúdo**:
- Qualquer QA consegue rodar um teste significativo em minutos
- A IA elimina a barreira de interpretação
- O objetivo é que performance entre no fluxo normal — não como exceção

**Call to action**: "Teste um endpoint que você conhece. Veja o que os números dizem."

---

### Slide 15 — Q&A
**Título**: Perguntas?

**Conteúdo**:
- Repositório: github.com/elder-freitas/performance-testing-poc
- Groq: console.groq.com
- Contato: [seu email]

---

## Perguntas prováveis e respostas

**"Isso substitui o k6 ou o Gatling?"**
Não. Para testes de carga em escala real (milhares de usuários), k6 e Gatling são mais adequados. O framework é focado em ser acessível para QAs sem experiência em performance — e em integrar IA na análise.

**"A análise da IA é confiável?"**
É um ponto de partida, não uma verdade absoluta. O LLaMA identifica padrões bem conhecidos corretamente — TTFB alto, JS excessivo, P99 anômalo. Para diagnósticos mais profundos, o julgamento humano ainda é necessário.

**"Por que Groq e não ChatGPT?"**
Groq é gratuito sem cartão de crédito e tem latência muito baixa. Para um uso interno de equipe, faz mais sentido do que depender de uma API paga.

**"Dá para integrar no CI?"**
Ainda não tem suporte nativo, mas é um dos itens do roadmap. A ideia é rodar em pull requests com thresholds configuráveis.

**"Como testar APIs autenticadas?"**
Hoje você passa o token manualmente nos headers. Para OAuth com refresh token automático, precisaria de extensão — está no backlog.
