// A deduplicacao de formas compartilha o no-fit-polygon entre pecas. Se duas
// formas DIFERENTES forem agrupadas por engano, as pecas se sobrepoem na chapa
// e o preco sai menor que o real. Este teste procura sobreposicao de verdade.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('http://localhost:8080/dev-preview.html', { waitUntil: 'networkidle' });

const r = await p.evaluate(async ({ texto, giros }) => {
  const g = await import('/src/lib/nesting/geometria.ts');
  const svg = await import('/src/lib/nesting/svgParaPecas.ts');
  const dxf = await import('/src/lib/nesting/dxfParaPecas.ts');
  const lido = /^\s*<\?xml|<svg[\s>]/i.test(texto.slice(0, 400)) ? await svg.lerSvg(texto) : dxf.lerDxf(texto);
  // replica o jogo: a deducao de formas so entra em acao com peca repetida,
  // e e justamente ela que, se agrupar errado, sobrepoe peca e barateia o preco
  const base = g.escalarPecas(lido.pecas, 100 / lido.altura);
  const pecas = [];
  for (let k = 0; k < 9; k++) for (const x of base) pecas.push({ ...x, id: `${x.id}#${k}` });

  const dentro = (q, poly) => {
    let d = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, yi = poly[i].y, xj = poly[j].x, yj = poly[j].y;
      if ((yi > q.y) !== (yj > q.y) && q.x < ((xj-xi)*(q.y-yi))/(yj-yi)+xi) d = !d;
    }
    return d;
  };

  const saidas = [];
  for (const rot of giros) {
    const t0 = performance.now();
    const res = await new Promise((ok) => {
      const w = new Worker('/nesting/nest-worker.js');
      w.onmessage = (e) => { if (e.data.tipo !== 'progresso') { ok(e.data); w.terminate(); } };
      const desvio = 5 - 5, C = 2440, L = 1220;
      w.postMessage({
        bin: [{x:0,y:0},{x:C,y:0},{x:C,y:L},{x:0,y:L}],
        parts: pecas.map(x => x.contorno), furos: pecas.map(x => x.furos),
        sources: pecas.map(x => x.forma),
        config: { spacing: 10, margem: 5, chapaReal: { largura: L, comprimento: C },
                  tentativas: 4, rotations: rot, curveTolerance: 0.3,
                  exploreConcave: false, useHoles: false },
      });
      setTimeout(() => ok({ tipo: 'erro', mensagem: 'timeout 300s' }), 300000);
    });
    if (!res.resultado) { saidas.push({ rot: rot.join('/'), erro: res.mensagem }); continue; }
    let colisoes = 0;
    for (const folha of res.resultado.folhas) {
      for (let i = 0; i < folha.pecas.length; i++)
        for (let j = i+1; j < folha.pecas.length; j++) {
          const A = folha.pecas[i].pontos, B = folha.pecas[j].pontos;
          if (A.some(q => dentro(q, B)) || B.some(q => dentro(q, A))) colisoes++;
        }
    }
    saidas.push({ rot: rot.join('/'), s: +((performance.now()-t0)/1000).toFixed(1),
      pecas: res.resultado.totalPecas, colisoes,
      faixa: +(res.resultado.areaFaixaOcupada/1e6).toFixed(3) });
  }
  return { formas: new Set(pecas.map(x => x.forma)).size, total: pecas.length, saidas };
}, { texto: readFileSync(process.argv[2] || '.playwright/fixtures/letreiro.svg', 'utf8'),
     giros: [[0],[0,180],[0,90,180,270],[0,45,90,135,180,225,270,315]] });

console.log(`${r.total} pecas agrupadas em ${r.formas} formas distintas\n`);
let ruim = 0;
for (const s of r.saidas) {
  if (s.erro) { console.log(`giros ${s.rot}: ERRO ${s.erro}`); ruim++; continue; }
  // peca que entrou e nao saiu colocada tambem reprova: nao pode virar preco
  const ok = s.colisoes === 0 && s.pecas === r.total;
  if (!ok) ruim++;
  console.log(`giros ${s.rot.padEnd(22)} ${String(s.s).padStart(6)}s | ${s.pecas} pecas |`,
    `faixa ${s.faixa} m2 | sobreposicoes: ${s.colisoes} ${ok ? 'OK' : 'FALHOU'}`);
}
console.log(ruim === 0 ? '== SEM SOBREPOSICAO EM NENHUM GIRO ==' : `== ${ruim} CONJUNTOS DE GIRO COM PROBLEMA ==`);
await b.close();
// sai com codigo != 0 para o runner (executar.mjs) detectar a falha
process.exit(ruim === 0 ? 0 : 1);
