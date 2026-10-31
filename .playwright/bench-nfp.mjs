// Onde o tempo do encaixe realmente vai. Roda os cenarios com os DEFAULTS de
// producao (20 tentativas, giro 180) e imprime o diagnostico do worker:
// quantos NFP foram calculados, quantos vieram do cache e quanto tempo o NFP
// consumiu do total.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const SVG = readFileSync(process.argv[2] || '.playwright/fixtures/letreiro.svg', 'utf8');
const GIROS = process.env.CENARIOS === 'frase' ? [['sem', [0]], ['180', [0, 180]]] : [['sem', [0]], ['180', [0, 180]], ['90', [0, 90, 180, 270]]];
const CENARIOS = process.env.CENARIOS === 'frase'
  ? [{ nome: 'frase 36 pecas 13 formas', copias: 1, alturaMm: 102 }]
  : [
      { nome: 'letreiro 1x (40cm)', copias: 1, alturaMm: 400 },
      { nome: 'letreiro 3x (20cm)', copias: 3, alturaMm: 200 },
      { nome: 'letreiro 9x (10cm)', copias: 9, alturaMm: 100 },
    ];

const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto('http://localhost:8080/dev-preview.html', { waitUntil: 'networkidle' });

const r = await p.evaluate(async ({ svgTexto, cenarios, giros }) => {
  const g = await import('/src/lib/nesting/geometria.ts');
  const svg = await import('/src/lib/nesting/svgParaPecas.ts');
  const saidas = [];
  for (const c of cenarios) {
    const lido = await svg.lerSvg(svgTexto);
    let pecas = c.alturaMm ? g.escalarPecas(lido.pecas, c.alturaMm / lido.altura) : lido.pecas;
    // replica o jogo de letras: e o caso real (varios jogos do mesmo letreiro)
    const base = pecas;
    pecas = [];
    for (let k = 0; k < c.copias; k++) {
      for (const x of base) pecas.push({ ...x, id: `${x.id}#${k}` });
    }
    pecas = g.agruparFormas ? g.agruparFormas(pecas) : pecas;
    const linha = { cenario: c.nome, pecas: pecas.length, formas: new Set(pecas.map((x) => x.forma)).size, r: {} };
    for (const [nome, rot] of giros) {
      const t0 = performance.now();
      const res = await new Promise((ok) => {
        const w = new Worker('/nesting/nest-worker.js');
        w.onmessage = (e) => { if (e.data.tipo !== 'progresso') { ok(e.data); w.terminate(); } };
        const C = 2440, L = 1220;
        w.postMessage({
          bin: [{ x: 0, y: 0 }, { x: C, y: 0 }, { x: C, y: L }, { x: 0, y: L }],
          parts: pecas.map((x) => x.contorno), furos: pecas.map((x) => x.furos), sources: pecas.map((x) => x.forma),
          config: { spacing: 10, margem: 5, chapaReal: { largura: L, comprimento: C },
                    tentativas: 20, rotations: rot, curveTolerance: 0.3,
                    exploreConcave: false, useHoles: false },
        });
        setTimeout(() => ok({ tipo: 'erro', mensagem: 'timeout' }), 600000);
      });
      const ms = performance.now() - t0;
      const d = res.diagnostico || {};
      linha.r[nome] = res.resultado
        ? { s: +(ms / 1000).toFixed(1), m2: +(res.resultado.areaFaixaOcupada / 1e6).toFixed(3),
            calc: d.calculados, deriv: d.derivados, esp: d.espelhados, cache: d.reaproveitados, msNfp: Math.round(d.msNfp),
            pctNfp: Math.round((d.msNfp / ms) * 100) }
        : { s: +(ms / 1000).toFixed(1), erro: res.mensagem };
    }
    saidas.push(linha);
  }
  return saidas;
}, { svgTexto: SVG, cenarios: CENARIOS, giros: GIROS });

for (const l of r) {
  console.log(`\n=== ${l.cenario} — ${l.pecas} pecas, ${l.formas} formas ===`);
  for (const [nome] of GIROS) {
    const x = l.r[nome];
    if (!x) continue;
    if (x.erro) { console.log(`  ${nome.padEnd(4)} ${String(x.s).padStart(7)}s  ERRO ${x.erro}`); continue; }
    console.log(`  ${nome.padEnd(4)} ${String(x.s).padStart(7)}s | ${x.m2.toFixed(3)} m2 |`,
      `NFP calc ${String(x.calc).padStart(4)} girados ${String(x.deriv).padStart(4)} espelhados ${String(x.esp).padStart(4)} |`,
      `${String(Math.round(x.msNfp / 1000)).padStart(4)}s em NFP = ${x.pctNfp}%`);
  }
}
await b.close();
