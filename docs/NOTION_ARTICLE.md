# Testes de Performance com IA: do zero ao ciclo completo

**Autor**: Elder Freitas — QA Analyst
**Publicado**: Maio 2026
**Leitura**: ~10 minutos

---

## Por que performance importa (e por que a gente ignora)

Quantas vezes você já viu um bug de performance chegar em produção?

Não é por falta de testes — é porque testes de performance têm uma barreira de entrada alta. Exigem ferramentas específicas, conhecimento de métricas, tempo para configurar e, no final, ainda é preciso interpretar os números manualmente.

O resultado é que na maioria dos projetos, performance só vira pauta quando o usuário reclama.

Esse artigo conta como construí um framework que reduz essa barreira: você aponta para um endpoint ou uma URL, e ele gera o teste, executa e entrega uma análise pronta — tudo com IA.

---

## O que é performance, afinal?

Antes de falar sobre ferramentas, vale alinhar o vocabulário. Quando falamos de performance, estamos medindo duas coisas diferentes dependendo do contexto:

### Para APIs

**Latência** é o tempo que o servidor leva para responder. Mas uma média não conta a história completa. O que importa são os **percentis**:

- **P50**: metade das requisições respondeu abaixo desse tempo. É a experiência típica.
- **P95**: 95% responderam abaixo. É o que você promete no SLA.
- **P99**: a cauda longa. É a experiência dos usuários com pior conexão, dispositivo mais lento, ou que caíram numa janela de instabilidade.

Uma API com P50 de 50ms e P99 de 8 segundos parece ótima nas médias — mas 1 em cada 100 usuários espera 8 segundos.

**Throughput** é quantas requisições por segundo o sistema aguenta. É o teto de capacidade.

### Para páginas web

Aqui as métricas são chamadas de **Core Web Vitals** — um padrão do Google que mede a experiência real do usuário:

| Métrica | O que mede | Meta |
|---|---|---|
| FCP | Quando o primeiro conteúdo aparece | < 1.8s |
| LCP | Quando o maior elemento visível carrega | < 2.5s |
| TTI | Quando a página fica interativa | < 3.8s |
| TBT | Quanto tempo o usuário ficou bloqueado | < 200ms |
| CLS | Se o layout "pulou" enquanto carregava | < 0.1 |
| TTFB | Quanto o servidor demorou para responder | < 200ms |

---

## O problema que o framework resolve

Ferramentas como k6, Gatling e JMeter são poderosas, mas exigem configuração manual para cada teste. Você precisa:

1. Escrever o script de teste
2. Configurar os parâmetros (concorrência, iterações, thresholds)
3. Executar
4. Interpretar os resultados (o que é bom? o que é ruim?)

O nosso framework automatiza as etapas 1 e 4. Você configura o alvo, e a IA cuida do resto.

---

## Como o framework funciona

O ciclo completo tem três etapas:

```
IA gera a configuração
        ↓
Engine executa os testes
        ↓
IA analisa os resultados
```

### Etapa 1: Geração por IA

Você informa o endpoint e o cenário desejado (carga, stress, spike). A IA gera a configuração otimizada do teste — quais headers usar, quantas iterações, qual concorrência faz sentido para o target RPS desejado.

### Etapa 2: Execução

O engine HTTP dispara as requisições em paralelo, com controle de concorrência. Para cada requisição, coleta tempo de resposta, status code e tamanho da resposta. Ao final, calcula automaticamente P50, P95, P99, throughput e error rate.

Para páginas web, o Lighthouse abre um Chrome headless, carrega a página simulando um dispositivo real (mobile 3G ou desktop broadband) e extrai os Core Web Vitals.

### Etapa 3: Análise por IA

Os números são enviados para o Groq (LLaMA), que os interpreta no contexto correto e entrega:
- Um resumo do que foi encontrado
- Os problemas identificados
- Recomendações específicas de melhoria
- Próximos passos priorizados

---

## Chaos Engineering: testando o pior cenário

Uma das funcionalidades mais úteis do framework é o **chaos middleware** — a capacidade de controlar o comportamento da API para simular condições adversas.

Com um único comando, você pode:
- Adicionar latência artificial (ex: 200ms com variância de ±50ms)
- Injetar erros aleatórios (ex: 20% das requisições retornam 500)
- Simular timeouts

Isso permite responder perguntas importantes:
- "Se a resposta do servidor degradar para 200ms, como o P95 muda?"
- "Com 10% de erros no pagamento, qual o impacto no throughput?"
- "Nosso sistema tem retry? Ele aguenta uma instabilidade de 30 segundos?"

### Resultado de um teste de chaos real

Executamos o mesmo teste em 4 cenários:

| Cenário | Avg | P95 | Erro% | RPS |
|---|---|---|---|---|
| Baseline | 3.3ms | 5.0ms | 0% | 2813 |
| Latência 200ms | 208.9ms | 249.0ms | 0% | 60 |
| Erros 20% | 3.4ms | 6.0ms | 18.3% | 2687 |
| Combinado | 141.4ms | 186.0ms | 10.6% | 81 |

**O que aprendemos:**
- Latência derruba throughput de 2813 para 60 RPS (queda de 97%)
- Erros sozinhos quase não impactam o tempo de resposta
- O cenário combinado é o mais próximo de uma degradação real em produção

---

## Teste de webpage: o que encontramos no arctouch.com

Para validar o suporte a páginas web, testamos o site da ArcTouch em mobile (3G) e desktop (broadband):

| Métrica | Mobile | Desktop |
|---|---|---|
| Score | 30/100 | 76/100 |
| LCP | 8857ms | 1932ms |
| TTI | 16433ms | 2078ms |
| TBT | 1628ms | 227ms |

**O que a IA identificou:**
- JavaScript não utilizado representa 3810ms de economia potencial
- TTFB de 1200ms aponta para ausência de CDN ou cache no servidor
- O site está otimizado para desktop — a experiência mobile é crítica

Nenhuma dessas conclusões exigiu expertise manual em performance. A IA interpretou os números e entregou um diagnóstico direto.

---

## A stack escolhida

O framework foi construído intencionalmente com dependências mínimas para funcionar em ambientes corporativos com restrições de rede:

| Componente | Tecnologia | Por quê |
|---|---|---|
| Runtime | Node.js + TypeScript | Familiaridade da equipe, tipagem forte |
| HTTP | Módulos nativos do Node | Sem dependências externas |
| IA | Groq (LLaMA) | Gratuito, sem cartão de crédito |
| Webpage | Lighthouse v9 | Padrão do mercado, integra com Chrome |
| API Mock | Express | Simples, amplamente conhecido |

---

## O que ainda falta

O framework está funcional, mas é um POC. Algumas lacunas para a v1.0:

- **Autenticação dinâmica**: OAuth, refresh token, sessões
- **Testes de fluxo**: encadear requisições onde o resultado de uma alimenta a próxima
- **Relatório HTML**: exportar os resultados em formato visual
- **Integração CI/CD**: rodar automaticamente em pull requests com thresholds de aprovação

---

## Como usar na sua equipe

1. Clone o repositório
2. Configure a chave do Groq (gratuita)
3. Aponte o `TARGET_API_URL` para sua API
4. Execute `npm run example:load`

O ponto de entrada mais simples é o `04-chaos-test.perf.ts` — ele compara baseline vs condições adversas automaticamente e entrega o comparativo pronto.

---

## Conclusão

Performance não precisa ser um assunto exclusivo de especialistas ou de pós-produção. Com as ferramentas certas, qualquer QA consegue rodar um teste significativo em minutos e obter um diagnóstico confiável.

A IA não substitui o julgamento humano — mas elimina a barreira de interpretação, que é o que mais trava a adoção de testes de performance no dia a dia.

O código está disponível no repositório. Contribuições são bem-vindas.

---

**Links:**
- Repositório: [github.com/elder-freitas/performance-testing-poc](#)
- Groq (IA gratuita): [console.groq.com](https://console.groq.com)
- Core Web Vitals: [web.dev/vitals](https://web.dev/vitals)
