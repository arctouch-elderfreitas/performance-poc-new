const pptxgen = require("pptxgenjs");

// ============================================================
// COLORS
// ============================================================
const C = {
  navyDark:  "0F2744",
  navy:      "1E3A5F",
  blue:      "0EA5E9",
  emerald:   "10B981",
  amber:     "F59E0B",
  red:       "EF4444",
  white:     "FFFFFF",
  nearWhite: "F8FAFC",
  textDark:  "1E293B",
  textMid:   "334155",
  textLight: "64748B",
};

const pres = new pptxgen();
pres.layout  = "LAYOUT_16x9";
pres.author  = "Elder Freitas";
pres.title   = "Testes de Performance com IA";

const makeShadow = () => ({ type: "outer", blur: 8, offset: 3, angle: 135, color: "000000", opacity: 0.12 });

function addLeftAccent(slide, color) {
  slide.addShape(pres.shapes.RECTANGLE, {
    x: 0, y: 0, w: 0.12, h: 5.625,
    fill: { color }, line: { color, width: 0 }
  });
}

// ============================================================
// SLIDE 1 — COVER
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.navyDark };

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.blue }, line: { color: C.blue, width: 0 } });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.6, y: 1.4, w: 3.0, h: 0.38, fill: { color: C.blue }, line: { color: C.blue, width: 0 } });
  s.addText("PERFORMANCE + INTELIGÊNCIA ARTIFICIAL", { x: 0.6, y: 1.4, w: 3.0, h: 0.38, fontSize: 8, bold: true, color: C.white, align: "center", valign: "middle", margin: 0, charSpacing: 1 });

  s.addText("Testes de Performance", { x: 0.6, y: 1.95, w: 8.8, h: 0.95, fontSize: 42, bold: true, color: C.white, fontFace: "Calibri" });
  s.addText("com Inteligência Artificial", { x: 0.6, y: 2.85, w: 8.8, h: 0.9, fontSize: 42, bold: true, color: C.blue, fontFace: "Calibri" });
  s.addText("Do zero ao ciclo completo: geração, execução e análise automatizados", { x: 0.6, y: 3.85, w: 8.2, h: 0.5, fontSize: 15, color: "94A3B8", fontFace: "Calibri" });

  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 5.1, w: 10, h: 0.525, fill: { color: "0A1F38" }, line: { color: "0A1F38", width: 0 } });
  s.addText("Elder Freitas  •  QA Analyst  •  Junho 2026", { x: 0.6, y: 5.1, w: 9, h: 0.525, fontSize: 12, color: "94A3B8", fontFace: "Calibri", valign: "middle" });
}

// ============================================================
// SLIDE 2 — A PERGUNTA
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.navyDark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.amber }, line: { color: C.amber, width: 0 } });

  s.addText('"Quando foi a última vez que você testou performance antes de ir pra produção?"', {
    x: 0.8, y: 0.7, w: 8.4, h: 1.9, fontSize: 26, bold: true, color: C.white, fontFace: "Calibri", italic: true,
  });

  const boxes = [
    { icon: "⚙", text: "Ferramentas\ncomplexas" },
    { icon: "⏱", text: "Configuração\nmanual" },
    { icon: "📊", text: "Interpretação\ndifícil" },
  ];
  const bw = 2.5, gap = 0.35;
  const startX = (10 - (3 * bw + 2 * gap)) / 2;
  boxes.forEach((b, i) => {
    const x = startX + i * (bw + gap);
    s.addShape(pres.shapes.RECTANGLE, { x, y: 2.9, w: bw, h: 1.7, fill: { color: "1E3A5F" }, line: { color: C.blue, width: 1 } });
    s.addText(b.icon, { x, y: 2.95, w: bw, h: 0.6, fontSize: 24, align: "center", color: C.blue });
    s.addText(b.text, { x, y: 3.55, w: bw, h: 0.9, fontSize: 14, align: "center", color: "CBD5E1", fontFace: "Calibri" });
  });

  s.addText("Resultado: performance só vira pauta quando o usuário reclama", {
    x: 0.6, y: 4.9, w: 8.8, h: 0.45, fontSize: 14, color: C.amber, align: "center", italic: true,
  });
}

// ============================================================
// SLIDE 3 — O CUSTO REAL
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.nearWhite };
  addLeftAccent(s, C.red);

  s.addText("Performance ruim tem custo real", { x: 0.35, y: 0.28, w: 9.3, h: 0.65, fontSize: 30, bold: true, color: C.textDark, fontFace: "Calibri" });

  const stats = [
    { num: "-7%", label: "em conversão por cada\n+1 segundo de carregamento", src: "Amazon", color: C.red },
    { num: "53%", label: "dos usuários mobile abandonam\npáginas com mais de 3 segundos", src: "Google", color: C.amber },
    { num: "~0", label: "testes de performance rodando\nantes da produção na maioria dos times", src: "Realidade", color: C.navy },
  ];

  stats.forEach((st, i) => {
    const x = 0.35 + i * 3.15;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.15, w: 2.9, h: 3.0, fill: { color: C.white }, shadow: makeShadow(), line: { color: "E2E8F0", width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.15, w: 2.9, h: 0.12, fill: { color: st.color }, line: { color: st.color, width: 0 } });
    s.addText(st.num, { x, y: 1.35, w: 2.9, h: 1.0, fontSize: 48, bold: true, color: st.color, align: "center", fontFace: "Calibri" });
    s.addText(st.label, { x: x + 0.1, y: 2.4, w: 2.7, h: 1.1, fontSize: 13, color: C.textMid, align: "center", fontFace: "Calibri" });
    s.addText(st.src, { x, y: 3.6, w: 2.9, h: 0.4, fontSize: 11, color: C.textLight, align: "center", italic: true });
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: 4.45, w: 9.3, h: 0.7, fill: { color: "FEF3C7" }, line: { color: C.amber, width: 1 } });
  s.addText("Prevenir é mais barato que remediar — e com as ferramentas certas, é simples.", {
    x: 0.35, y: 4.45, w: 9.3, h: 0.7, fontSize: 14, bold: true, color: "92400E", align: "center", valign: "middle",
  });
}

// ============================================================
// SLIDE 4 — VOCABULÁRIO: APIs
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.nearWhite };
  addLeftAccent(s, C.blue);

  s.addText("O que estamos medindo: APIs", { x: 0.35, y: 0.22, w: 9.3, h: 0.62, fontSize: 28, bold: true, color: C.textDark, fontFace: "Calibri" });

  const metrics = [
    { label: "P50", desc: "Experiência típica do usuário", detail: "Metade das requisições responde abaixo desse tempo", color: C.emerald },
    { label: "P95", desc: "Referência para o SLA", detail: "95% das requisições respondem abaixo — o que você promete ao cliente", color: C.blue },
    { label: "P99", desc: "A cauda longa", detail: "Experiência do usuário mais lento — dispositivo ruim, conexão instável", color: C.amber },
    { label: "Throughput", desc: "Capacidade máxima", detail: "Quantas requisições por segundo o sistema aguenta antes de degradar", color: C.navy },
    { label: "Error Rate", desc: "Taxa de falha", detail: "Percentual de requisições que retornam erro — deve ser próximo de 0%", color: C.red },
  ];

  metrics.forEach((m, i) => {
    const y = 1.02 + i * 0.84;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y, w: 9.3, h: 0.75, fill: { color: i % 2 === 0 ? C.white : "F1F5F9" }, line: { color: "E2E8F0", width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y, w: 1.6, h: 0.75, fill: { color: m.color }, line: { color: m.color, width: 0 } });
    s.addText(m.label, { x: 0.35, y, w: 1.6, h: 0.75, fontSize: 15, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
    s.addText(m.desc, { x: 2.1, y: y + 0.05, w: 3.0, h: 0.35, fontSize: 13, bold: true, color: C.textDark });
    s.addText(m.detail, { x: 2.1, y: y + 0.4, w: 7.4, h: 0.3, fontSize: 11, color: C.textLight });
  });
}

// ============================================================
// SLIDE 5 — VOCABULÁRIO: WEBPAGES
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.nearWhite };
  addLeftAccent(s, C.emerald);

  s.addText("O que estamos medindo: páginas web", { x: 0.35, y: 0.22, w: 9.3, h: 0.62, fontSize: 28, bold: true, color: C.textDark, fontFace: "Calibri" });
  s.addText("Core Web Vitals — padrão do Google para experiência do usuário (impacta SEO)", { x: 0.35, y: 0.8, w: 9.3, h: 0.35, fontSize: 13, color: C.textLight, italic: true });

  const vitals = [
    { name: "FCP",  full: "First Contentful Paint",    goal: "< 1.8s",  what: "Primeiro conteúdo visível na tela" },
    { name: "LCP",  full: "Largest Contentful Paint",  goal: "< 2.5s",  what: "Maior elemento visível carregado" },
    { name: "TTI",  full: "Time to Interactive",       goal: "< 3.8s",  what: "Quando a página ficou interativa" },
    { name: "TBT",  full: "Total Blocking Time",       goal: "< 200ms", what: "Tempo em que o usuário ficou bloqueado" },
    { name: "CLS",  full: "Cumulative Layout Shift",   goal: "< 0.1",   what: "Estabilidade visual — layout não pula" },
    { name: "TTFB", full: "Time to First Byte",        goal: "< 200ms", what: "Tempo de resposta inicial do servidor" },
  ];

  vitals.forEach((v, i) => {
    const col = i < 3 ? 0 : 1;
    const row = i % 3;
    const x = 0.35 + col * 4.8;
    const y = 1.28 + row * 1.38;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.55, h: 1.22, fill: { color: C.white }, shadow: makeShadow(), line: { color: "E2E8F0", width: 1 } });
    s.addShape(pres.shapes.OVAL, { x: x + 0.2, y: y + 0.42, w: 0.28, h: 0.28, fill: { color: C.emerald }, line: { color: C.emerald, width: 0 } });
    s.addText(v.name, { x: x + 0.6, y: y + 0.1, w: 1.3, h: 0.42, fontSize: 18, bold: true, color: C.blue, fontFace: "Calibri" });
    s.addText(v.goal, { x: x + 3.1, y: y + 0.12, w: 1.3, h: 0.38, fontSize: 14, bold: true, color: C.emerald, align: "right" });
    s.addText(v.full, { x: x + 0.6, y: y + 0.48, w: 3.8, h: 0.28, fontSize: 10, color: C.textLight, italic: true });
    s.addText(v.what, { x: x + 0.15, y: y + 0.82, w: 4.2, h: 0.32, fontSize: 12, color: C.textMid });
  });
}

// ============================================================
// SLIDE 6 — CICLO SEM IA vs COM IA
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.nearWhite };

  s.addText("O que muda com IA no ciclo", { x: 0.4, y: 0.2, w: 9.2, h: 0.62, fontSize: 28, bold: true, color: C.textDark, fontFace: "Calibri" });

  // SEM IA
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.0, w: 4.3, h: 4.2, fill: { color: C.white }, shadow: makeShadow(), line: { color: "E2E8F0", width: 1 } });
  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 1.0, w: 4.3, h: 0.5, fill: { color: "EF4444" }, line: { color: "EF4444", width: 0 } });
  s.addText("Sem IA", { x: 0.4, y: 1.0, w: 4.3, h: 0.5, fontSize: 16, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });

  ["1. Escrever script manualmente", "2. Configurar parâmetros", "3. Executar", "4. Interpretar os números", "5. Descobrir se é bom ou ruim", "6. Escrever o relatório"].forEach((t, i) => {
    s.addText(t, { x: 0.65, y: 1.65 + i * 0.53, w: 3.85, h: 0.45, fontSize: 13, color: i >= 3 ? "EF4444" : C.textMid, bold: i >= 3 });
  });

  // COM IA
  s.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: 1.0, w: 4.3, h: 4.2, fill: { color: C.white }, shadow: makeShadow(), line: { color: "E2E8F0", width: 1 } });
  s.addShape(pres.shapes.RECTANGLE, { x: 5.3, y: 1.0, w: 4.3, h: 0.5, fill: { color: C.emerald }, line: { color: C.emerald, width: 0 } });
  s.addText("Com IA", { x: 5.3, y: 1.0, w: 4.3, h: 0.5, fontSize: 16, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });

  // vertically center 3 items in the card (card starts at y=1.5, h=4.2, content area ~3.7)
  [
    { t: "1. Apontar para o endpoint", big: false },
    { t: "2. Executar", big: false },
    { t: "✅  Análise pronta", big: true },
  ].forEach((item, i) => {
    s.addText(item.t, { x: 5.55, y: 2.0 + i * 0.75, w: 3.85, h: 0.6, fontSize: item.big ? 18 : 13, color: item.big ? C.emerald : C.textMid, bold: item.big });
  });

  s.addText("A IA não substitui expertise — elimina a barreira de interpretação dos números.", {
    x: 0.4, y: 5.22, w: 9.2, h: 0.32, fontSize: 12, color: C.textLight, align: "center", italic: true,
  });
}

// ============================================================
// SLIDE 7 — ARQUITETURA
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.nearWhite };
  addLeftAccent(s, C.blue);

  s.addText("Como o framework funciona", { x: 0.35, y: 0.2, w: 9.3, h: 0.62, fontSize: 28, bold: true, color: C.textDark, fontFace: "Calibri" });

  const steps = [
    { num: "1", title: "Geração", desc: "IA cria a configuração\notimizada do teste", color: C.blue },
    { num: "2", title: "Execução", desc: "Engine dispara requests\nem paralelo", color: C.navy },
    { num: "3", title: "Cálculo", desc: "P50, P95, P99,\nthroughput, error rate", color: C.textMid },
    { num: "4", title: "Análise", desc: "IA interpreta e\nentrega diagnóstico", color: C.emerald },
  ];

  steps.forEach((step, i) => {
    const x = 0.5 + i * 2.35;
    s.addShape(pres.shapes.RECTANGLE, { x, y: 1.1, w: 2.1, h: 2.75, fill: { color: C.white }, shadow: makeShadow(), line: { color: "E2E8F0", width: 1 } });
    s.addShape(pres.shapes.OVAL, { x: x + 0.65, y: 1.25, w: 0.8, h: 0.8, fill: { color: step.color }, line: { color: step.color, width: 0 } });
    s.addText(step.num, { x: x + 0.65, y: 1.25, w: 0.8, h: 0.8, fontSize: 22, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
    s.addText(step.title, { x, y: 2.2, w: 2.1, h: 0.42, fontSize: 16, bold: true, color: step.color, align: "center" });
    s.addText(step.desc, { x: x + 0.1, y: 2.65, w: 1.9, h: 0.9, fontSize: 12, color: C.textMid, align: "center" });
    if (i < 3) {
      s.addShape(pres.shapes.RECTANGLE, { x: x + 2.1, y: 2.4, w: 0.25, h: 0.1, fill: { color: "CBD5E1" }, line: { color: "CBD5E1", width: 0 } });
    }
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.4, y: 4.1, w: 9.2, h: 1.1, fill: { color: "EFF6FF" }, line: { color: C.blue, width: 1 } });
  s.addText("IA entra em dois momentos: geração e análise. O meio (execução e cálculo) é determinístico — sem variância, sem interpretação.", {
    x: 0.6, y: 4.15, w: 8.8, h: 1.0, fontSize: 13, color: C.navy, valign: "middle",
  });
}

// ============================================================
// SLIDE 8 — CHAOS ENGINEERING
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.nearWhite };
  addLeftAccent(s, C.amber);

  s.addText("Chaos Engineering: testando o pior cenário", { x: 0.35, y: 0.2, w: 9.3, h: 0.62, fontSize: 26, bold: true, color: C.textDark, fontFace: "Calibri" });
  s.addText("API mock local com comportamento controlável — latência, taxa de erros e timeout configuráveis por endpoint", { x: 0.35, y: 0.78, w: 9.3, h: 0.35, fontSize: 12, color: C.textLight, italic: true });

  const colW = [2.6, 1.68, 1.68, 1.68, 1.66];
  let ty = 1.32; // more gap after subtitle

  s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: ty, w: 9.3, h: 0.5, fill: { color: C.navy }, line: { color: C.navy, width: 0 } });
  let cx = 0.35;
  ["Cenário", "Avg", "P95", "Erro%", "RPS"].forEach((h, i) => {
    s.addText(h, { x: cx, y: ty, w: colW[i], h: 0.5, fontSize: 13, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
    cx += colW[i];
  });

  [
    { cells: ["Baseline",       "3.3ms",   "5.0ms",   "0%",    "2.813"], bg: C.white,   bad: false },
    { cells: ["Latência 200ms", "208.9ms", "249.0ms", "0%",    "60"],    bg: "FEF3C7",  bad: true },
    { cells: ["Erros 20%",      "3.4ms",   "6.0ms",   "18.3%", "2.687"], bg: "FEE2E2",  bad: true },
    { cells: ["Combinado",      "141.4ms", "186.0ms", "10.6%", "81"],    bg: "FEE2E2",  bad: true },
  ].forEach((row) => {
    ty += 0.5;
    cx = 0.35;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: ty, w: 9.3, h: 0.5, fill: { color: row.bg }, line: { color: "E2E8F0", width: 1 } });
    row.cells.forEach((cell, ci) => {
      s.addText(cell, {
        x: cx, y: ty, w: colW[ci], h: 0.5,
        fontSize: 13, color: (row.bad && ci > 0) ? "B91C1C" : C.textDark,
        bold: !row.bad,
        align: ci === 0 ? "left" : "center", valign: "middle", margin: ci === 0 ? 8 : 0,
      });
      cx += colW[ci];
    });
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: 4.55, w: 9.3, h: 0.65, fill: { color: "FFFBEB" }, line: { color: C.amber, width: 1.5 } });
  s.addText("⚡  Latência de 200ms derrubou o throughput de 2.813 para 60 RPS — queda de 97%", {
    x: 0.55, y: 4.55, w: 9.0, h: 0.65, fontSize: 14, bold: true, color: "92400E", valign: "middle",
  });
}

// ============================================================
// SLIDE 9 — DEMO
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.navyDark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.blue }, line: { color: C.blue, width: 0 } });

  s.addText("DEMO", { x: 0.5, y: 0.7, w: 9, h: 1.6, fontSize: 80, bold: true, color: C.blue, align: "center", fontFace: "Calibri", charSpacing: 20 });

  [
    { num: "01", text: "API Mock rodando em localhost:3000" },
    { num: "02", text: "example:simple — GET básico com métricas" },
    { num: "03", text: "example:chaos — comparativo dos 4 cenários" },
    { num: "04", text: "example:webpage — Lighthouse no arctouch.com" },
  ].forEach((step, i) => {
    const y = 2.55 + i * 0.7;
    s.addShape(pres.shapes.RECTANGLE, { x: 2.5, y, w: 0.56, h: 0.5, fill: { color: C.blue }, line: { color: C.blue, width: 0 } });
    s.addText(step.num, { x: 2.5, y, w: 0.56, h: 0.5, fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
    s.addText(step.text, { x: 3.22, y, w: 5.5, h: 0.5, fontSize: 16, color: "CBD5E1", valign: "middle" });
  });
}

// ============================================================
// SLIDE 10 — RESULTADOS ARCTOUCH.COM
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.nearWhite };
  addLeftAccent(s, C.red);

  s.addText("Resultados reais: arctouch.com", { x: 0.35, y: 0.2, w: 9.3, h: 0.62, fontSize: 28, bold: true, color: C.textDark, fontFace: "Calibri" });

  const cw = [2.5, 1.5, 1.5];
  let ty = 0.95;
  s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: ty, w: 5.5, h: 0.45, fill: { color: C.navy }, line: { color: C.navy, width: 0 } });
  let cx = 0.35;
  ["Métrica", "Mobile 3G", "Desktop"].forEach((h, i) => {
    s.addText(h, { x: cx, y: ty, w: cw[i], h: 0.45, fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
    cx += cw[i];
  });

  const rowH = 0.54;
  [
    ["Performance Score", "30 / 100",  "76 / 100"],
    ["LCP",               "8.857ms",   "1.932ms"],
    ["TTI",               "16.433ms",  "2.078ms"],
    ["TBT",               "1.628ms",   "227ms"],
    ["TTFB",              "1.203ms",   "1.127ms"],
  ].forEach((row, ri) => {
    ty += rowH;
    cx = 0.35;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y: ty, w: 5.5, h: rowH, fill: { color: ri % 2 === 0 ? C.white : "F1F5F9" }, line: { color: "E2E8F0", width: 1 } });
    row.forEach((cell, ci) => {
      s.addText(cell, {
        x: cx, y: ty, w: cw[ci], h: rowH,
        fontSize: 12, color: (ci === 1 && ri > 0) ? "DC2626" : C.textDark,
        bold: ci === 1 && ri > 0,
        align: ci === 0 ? "left" : "center", valign: "middle", margin: ci === 0 ? 6 : 0,
        autoFit: false,
      });
      cx += cw[ci];
    });
  });

  // right panel aligned to same top as table header (ty_header = 0.95) and same bottom as last row
  const rightPanelBottom = ty + rowH;
  const rightPanelTop = 0.95;
  const rightH = (rightPanelBottom - rightPanelTop - 0.42 - 0.1) / 3; // 3 cards

  s.addText("Diagnóstico da IA:", { x: 6.1, y: rightPanelTop, w: 3.6, h: 0.42, fontSize: 14, bold: true, color: C.textDark });

  [
    "JS não utilizado: 3.810ms de\neconomia potencial",
    "TTFB 1.200ms: ausência de\nCDN ou cache no servidor",
    "Site otimizado para desktop —\nmobile está crítico",
  ].forEach((ins, i) => {
    const cardY = rightPanelTop + 0.45 + i * (rightH + 0.05);
    s.addShape(pres.shapes.RECTANGLE, { x: 6.1, y: cardY, w: 3.6, h: rightH, fill: { color: C.white }, shadow: makeShadow(), line: { color: "E2E8F0", width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x: 6.1, y: cardY, w: 0.1, h: rightH, fill: { color: C.red }, line: { color: C.red, width: 0 } });
    s.addText(ins, { x: 6.3, y: cardY + 0.05, w: 3.3, h: rightH - 0.1, fontSize: 12, color: C.textMid, valign: "middle" });
  });
}

// ============================================================
// SLIDE 11 — STACK
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.nearWhite };
  addLeftAccent(s, C.navy);

  s.addText("Por que essa stack?", { x: 0.35, y: 0.2, w: 9.3, h: 0.62, fontSize: 28, bold: true, color: C.textDark, fontFace: "Calibri" });
  s.addText("Princípio: funcionar em ambientes corporativos com restrições de rede e zero custo", { x: 0.35, y: 0.78, w: 9.3, h: 0.35, fontSize: 13, color: C.textLight, italic: true });

  [
    { role: "Runtime",    tech: "Node.js + TypeScript",     reason: "Familiaridade da equipe, tipagem forte, fácil onboarding" },
    { role: "HTTP",       tech: "Módulos nativos do Node",  reason: "Zero dependências externas — sem problemas de proxy corporativo" },
    { role: "IA",         tech: "Groq (LLaMA)",             reason: "Gratuito, sem cartão de crédito, baixa latência de resposta" },
    { role: "Webpages",   tech: "Lighthouse v9",            reason: "Padrão do mercado para Core Web Vitals, integra com Chrome" },
    { role: "API Mock",   tech: "Express",                  reason: "Simples, amplamente conhecido e fácil de estender" },
  ].forEach((item, i) => {
    const y = 1.24 + i * 0.84;
    s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y, w: 9.3, h: 0.75, fill: { color: i % 2 === 0 ? C.white : "F8FAFC" }, line: { color: "E2E8F0", width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x: 0.35, y, w: 1.55, h: 0.75, fill: { color: C.navy }, line: { color: C.navy, width: 0 } });
    s.addText(item.role, { x: 0.35, y, w: 1.55, h: 0.75, fontSize: 12, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
    s.addText(item.tech, { x: 2.05, y: y + 0.06, w: 3.2, h: 0.32, fontSize: 14, bold: true, color: C.textDark });
    s.addText(item.reason, { x: 2.05, y: y + 0.4, w: 7.5, h: 0.28, fontSize: 11, color: C.textLight });
  });
}

// ============================================================
// SLIDE 12 — O QUE FALTA
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.nearWhite };
  addLeftAccent(s, "94A3B8");

  s.addText("O que o framework ainda não faz", { x: 0.35, y: 0.2, w: 9.3, h: 0.62, fontSize: 28, bold: true, color: C.textDark, fontFace: "Calibri" });
  s.addText("Honestidade sobre limitações — e o roadmap para v1.0", { x: 0.35, y: 0.78, w: 9.3, h: 0.35, fontSize: 13, color: C.textLight, italic: true });

  [
    { title: "Autenticação dinâmica",       desc: "OAuth, refresh token, sessões. Hoje tokens são passados manualmente nos headers." },
    { title: "Testes de fluxo encadeado",   desc: "Resultado de A alimenta B. Ex: criar pedido → buscar → cancelar." },
    { title: "Relatório HTML exportável",   desc: "Hoje os resultados ficam no terminal. Falta um formato visual compartilhável." },
    { title: "Integração CI/CD",            desc: "Rodar em pull requests com thresholds de aprovação configuráveis." },
  ].forEach((item, i) => {
    const x = i % 2 === 0 ? 0.35 : 5.2;
    const y = i < 2 ? 1.3 : 3.5;
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.55, h: 2.0, fill: { color: C.white }, shadow: makeShadow(), line: { color: "E2E8F0", width: 1 } });
    s.addShape(pres.shapes.RECTANGLE, { x, y, w: 4.55, h: 0.1, fill: { color: "94A3B8" }, line: { color: "94A3B8", width: 0 } });
    s.addText(item.title, { x: x + 0.2, y: y + 0.18, w: 4.2, h: 0.42, fontSize: 15, bold: true, color: C.textDark });
    s.addText(item.desc, { x: x + 0.2, y: y + 0.65, w: 4.15, h: 1.2, fontSize: 12, color: C.textMid });
  });
}

// ============================================================
// SLIDE 13 — COMO COMEÇAR HOJE
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.nearWhite };
  addLeftAccent(s, C.emerald);

  s.addText("Como começar hoje", { x: 0.35, y: 0.2, w: 9.3, h: 0.62, fontSize: 28, bold: true, color: C.textDark, fontFace: "Calibri" });

  [
    { num: "1", step: "Clone o repositório",             detail: "git clone github.com/elder-freitas/performance-testing-poc" },
    { num: "2", step: "Crie uma chave gratuita do Groq", detail: "Acesse console.groq.com — sem cartão de crédito necessário" },
    { num: "3", step: "Configure o .env",                detail: "GROQ_API_KEY=sua-chave  •  TARGET_API_URL=http://localhost:3000" },
    { num: "4", step: "Suba a API mock",                 detail: "cd api && npm run dev" },
    { num: "5", step: "Execute o chaos test",            detail: "npm run example:chaos  →  comparativo completo em ~30 segundos" },
  ].forEach((step, i) => {
    const y = 1.05 + i * 0.9;
    s.addShape(pres.shapes.OVAL, { x: 0.35, y: y + 0.16, w: 0.56, h: 0.56, fill: { color: C.emerald }, line: { color: C.emerald, width: 0 } });
    s.addText(step.num, { x: 0.35, y: y + 0.16, w: 0.56, h: 0.56, fontSize: 16, bold: true, color: C.white, align: "center", valign: "middle", margin: 0 });
    s.addText(step.step, { x: 1.1, y: y + 0.08, w: 8.5, h: 0.36, fontSize: 15, bold: true, color: C.textDark });
    s.addText(step.detail, { x: 1.1, y: y + 0.46, w: 8.5, h: 0.34, fontSize: 12, color: C.textLight, fontFace: "Consolas" });
  });
}

// ============================================================
// SLIDE 14 — FECHAMENTO
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.navyDark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.emerald }, line: { color: C.emerald, width: 0 } });

  s.addText("Performance não precisa ser\nassunto de especialista", { x: 0.7, y: 0.7, w: 8.6, h: 2.1, fontSize: 36, bold: true, color: C.white, fontFace: "Calibri" });

  [
    "Qualquer QA roda um teste significativo em minutos",
    "A IA elimina a barreira de interpretação dos números",
    "O objetivo é performance no fluxo normal — não como exceção",
  ].forEach((c, i) => {
    s.addShape(pres.shapes.OVAL, { x: 0.7, y: 3.0 + i * 0.6, w: 0.28, h: 0.28, fill: { color: C.emerald }, line: { color: C.emerald, width: 0 } });
    s.addText(c, { x: 1.15, y: 2.96 + i * 0.6, w: 8.0, h: 0.36, fontSize: 15, color: "CBD5E1" });
  });

  s.addShape(pres.shapes.RECTANGLE, { x: 0.7, y: 4.72, w: 8.6, h: 0.55, fill: { color: "0A1F38" }, line: { color: C.emerald, width: 1 } });
  s.addText('"Teste um endpoint que você conhece. Veja o que os números dizem."', {
    x: 0.7, y: 4.72, w: 8.6, h: 0.55, fontSize: 14, italic: true, color: C.emerald, align: "center", valign: "middle",
  });
}

// ============================================================
// SLIDE 15 — Q&A
// ============================================================
{
  const s = pres.addSlide();
  s.background = { color: C.navyDark };
  s.addShape(pres.shapes.RECTANGLE, { x: 0, y: 0, w: 10, h: 0.08, fill: { color: C.blue }, line: { color: C.blue, width: 0 } });

  s.addText("Perguntas?", { x: 0.7, y: 0.9, w: 8.6, h: 1.5, fontSize: 60, bold: true, color: C.white, fontFace: "Calibri", align: "center" });

  [
    { label: "Repositório",     val: "github.com/elder-freitas/performance-testing-poc" },
    { label: "IA gratuita",     val: "console.groq.com" },
    { label: "Core Web Vitals", val: "web.dev/vitals" },
  ].forEach((link, i) => {
    s.addShape(pres.shapes.RECTANGLE, { x: 1.5, y: 2.75 + i * 0.75, w: 7.0, h: 0.6, fill: { color: "1E3A5F" }, line: { color: C.blue, width: 1 } });
    s.addText([
      { text: link.label + ": ", options: { bold: true, color: C.blue } },
      { text: link.val,          options: { color: "CBD5E1" } },
    ], { x: 1.5, y: 2.75 + i * 0.75, w: 7.0, h: 0.6, fontSize: 13, align: "center", valign: "middle" });
  });

  s.addText("Elder Freitas  •  QA Analyst", { x: 0.5, y: 5.15, w: 9, h: 0.38, fontSize: 12, color: "64748B", align: "center" });
}

// ============================================================
// SAVE
// ============================================================
pres.writeFile({ fileName: "C:/Users/elder/OneDrive/Documentos/Projetos/performance-testing-poc/docs/Performance-Testing-com-IA.pptx" })
  .then(() => console.log("✅  Slides criados: docs/Performance-Testing-com-IA.pptx"))
  .catch((err) => { console.error("❌  Erro:", err); process.exit(1); });
