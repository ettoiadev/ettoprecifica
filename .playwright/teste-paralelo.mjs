// Repartir as tentativas entre workers so e aceitavel se o resultado for o
// MESMO de rodar em serie — senao o preco mudaria sem motivo visivel para o
// cliente. Este teste roda os dois e compara area cobrada E posicao de cada
// peca, nao so o total.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const SVG = readFileSync(process.argv[2] || '.playwright/fixtures/letreiro.svg', 'utf8');
const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto('http://localhost:8080/dev-preview.html', { waitUntil: 'networkidle' });
if (process.env.CEN) await p.evaluate((c) => { window.__CEN__ = JSON.parse(c); }, process.env.CEN);
if (process.env.GIROS) await p.evaluate((g) => { window.__GIROS__ = JSON.parse(g); }, process.env.GIROS);
if (process.env.NS) await p.evaluate((n) => { window.__NS__ = JSON.parse(n); }, process.env.NS);

const r = await p.evaluate(async ({ svgTexto }) => {
  const g = await import('/src/lib/nesting/geometria.ts');
  const svg = await import('/src/lib/nesting/svgParaPecas.ts');
  const lido = await svg.lerSvg(svgTexto);

  const C = 2440, L = 1220;
  const corpo = (pecas, rotations) => ({
    bin: [{ x: 0, y: 0 }, { x: C, y: 0 }, { x: C, y: L }, { x: 0, y: L }],
    parts: pecas.map((x) => x.contorno), furos: pecas.map((x) => x.furos),
    sources: pecas.map((x) => x.forma),
    config: { spacing: 10, margem: 5, chapaReal: { largura: L, comprimento: C },
              tentativas: 20, rotations, curveTolerance: 0.3,
              exploreConcave: false, useHoles: false },
  });

  // um worker so, sem fatia nem fases: e a referencia
  const rodarSerie = (pecas, rotations) =>
    new Promise((ok) => {
      const w = new Worker('/nesting/nest-worker.js');
      w.onmessage = (e) => { if (e.data.tipo !== 'progresso') { ok(e.data); w.terminate(); } };
      w.postMessage(corpo(pecas, rotations));
    });

  // mesmo fluxo de duas fases do hook
  const rodarParalelo = (pecas, rotations, N) =>
    new Promise((ok) => {
      const base = corpo(pecas, rotations);
      const ws = Array.from({ length: N }, () => new Worker('/nesting/nest-worker.js'));
      const bases = {};
      let vindas = 0;
      const parciais = [];
      ws.forEach((w, k) => {
        w.onmessage = (e) => {
          const d = e.data;
          if (d.tipo === 'progresso') return;
          if (d.tipo === 'bases') {
            for (const [c, nfp] of d.entradas) bases[c] = nfp;
            if (++vindas === N)
              ws.forEach((x, j) => x.postMessage({ ...base, bases,
                config: { ...base.config, fatia: { indice: j, total: N } } }));
            return;
          }
          parciais.push({ resultado: d.resultado ?? null, tentativa: d.tentativa ?? -1 });
          if (parciais.length === N) { ws.forEach((x) => x.terminate()); ok(parciais); }
        };
        w.postMessage({ ...base, config: { ...base.config, fatia: { indice: k, total: N }, fase: 'bases' } });
      });
    });

  // mesma regra de desempate do hook
  const juntar = (ps) => {
    let m = null;
    for (const x of ps) {
      if (!x.resultado) continue;
      if (!m || x.resultado.pecasFora < m.resultado.pecasFora ||
          (x.resultado.pecasFora === m.resultado.pecasFora &&
           (x.resultado.areaFaixaOcupada < m.resultado.areaFaixaOcupada ||
            (x.resultado.areaFaixaOcupada === m.resultado.areaFaixaOcupada && x.tentativa < m.tentativa))))
        m = x;
    }
    return m;
  };

  const impressao = (res) => res.folhas.map((f) =>
    f.pecas.map((x) => `${x.id}@${x.rotation}:${x.pontos[0].x.toFixed(4)},${x.pontos[0].y.toFixed(4)}`).join('|')
  ).join('||');

  const saidas = [];
  const CEN = window.__CEN__ || [['5 pecas 40cm', 1, 400], ['15 pecas 20cm', 3, 200], ['45 pecas 10cm', 9, 100]];
  for (const [nome, copias, alturaMm] of CEN) {
    const base = g.escalarPecas(lido.pecas, alturaMm / lido.altura);
    const pecas = [];
    for (let k = 0; k < copias; k++) for (const x of base) pecas.push({ ...x, id: `${x.id}#${k}` });
    for (const [gn, rot] of (window.__GIROS__ || [['sem', [0]], ['180', [0, 180]], ['90', [0, 90, 180, 270]]])) {
      const t0 = performance.now();
      const serie = await rodarSerie(pecas, rot);
      const tSerie = performance.now() - t0;
      for (const N of (window.__NS__ || [3, 4])) {
        const t1 = performance.now();
        const ps = await rodarParalelo(pecas, rot, N);
        const tPar = performance.now() - t1;
        const junto = juntar(ps);
        saidas.push({
          cenario: `${nome} ${gn}`, N,
          sSerie: +(tSerie / 1000).toFixed(1), sPar: +(tPar / 1000).toFixed(1),
          m2Serie: +(serie.resultado.areaFaixaOcupada / 1e6).toFixed(6),
          m2Par: +(junto.resultado.areaFaixaOcupada / 1e6).toFixed(6),
          igual: impressao(serie.resultado) === impressao(junto.resultado),
        });
      }
    }
  }
  return saidas;
}, { svgTexto: SVG });

let ruim = 0;
console.log('cenario                 N |  serie |  paralelo | ganho | area serie = area paralelo | desenho identico');
for (const x of r) {
  const ok = x.m2Serie === x.m2Par && x.igual;
  if (!ok) ruim++;
  console.log(
    `${x.cenario.padEnd(22)} ${x.N} | ${String(x.sSerie).padStart(5)}s | ${String(x.sPar).padStart(8)}s |`,
    `${(x.sSerie / x.sPar).toFixed(1)}x |`,
    `${x.m2Serie} ${x.m2Serie === x.m2Par ? '=' : '!='} ${x.m2Par} |`,
    x.igual ? 'identico' : 'DIFERENTE'
  );
}
console.log(ruim === 0 ? '\n== PARALELO BATE COM A SERIE EM TUDO ==' : `\n== ${ruim} DIVERGENCIAS ==`);
await b.close();

// sai com codigo != 0 para o runner (executar.mjs) detectar a falha
process.exit(ruim === 0 ? 0 : 1);
