// O parser de DXF e codigo PROPRIO (dxfParaPecas.ts, ~530 linhas) e ate aqui
// nao tinha teste nenhum. Confere cada caso dificil contra AREA EXATA, nao
// contra aparencia: area errada vira m2 errado, que vira preco errado.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';

const ARQ = process.argv[2] || '.playwright/fixtures/pecas.dxf';
const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto('http://localhost:8080/dev-preview.html', { waitUntil: 'networkidle' });

const r = await p.evaluate(async (texto) => {
  const d = await import('/src/lib/nesting/dxfParaPecas.ts');
  const g = await import('/src/lib/nesting/geometria.ts');
  const lido = d.lerDxf(texto);
  return {
    avisos: lido.avisos,
    pecas: lido.pecas.map((x) => ({
      area: Math.abs(g.areaPoligono(x.contorno)),
      furos: (x.furos || []).map((f) => Math.abs(g.areaPoligono(f))),
      pontos: x.contorno.length,
    })),
  };
}, readFileSync(ARQ, 'latin1'));

const PI = Math.PI;
/*
 * As areas esperadas das CURVAS sao as do poligono achatado, nao as da curva
 * exata: achatar com tolerancia de 0,8mm (TOLERANCIA_MM) corta para dentro, de
 * proposito. Um circulo de r=40 em 16 lados da 4898 mm2, nao os 5026 do
 * circulo. Conferir contra a curva exata reprovaria o parser por fazer
 * exatamente o que deve.
 */
const circuloAchatado = (r, n) => 0.5 * n * r * r * Math.sin((2 * PI) / n);
// corda reta do poligono do bulge (2250) + segmento do arco de 90 graus (256,9)
const AREA_BULGE = 2250 + ((30 * Math.SQRT2 / Math.SQRT2) ** 2 / 2) * (PI / 2 - 1);
const ESPERADO = [
  { nome: 'quadrado 100x100 (LWPOLYLINE)', area: 10000, tol: 0.5, furos: 0 },
  { nome: 'triangulo em 3 LINE soltas (costura)', area: 4500, tol: 0.5, furos: 0 },
  { nome: 'arruela r40 com furo r20 (CIRCLE)', area: circuloAchatado(40, 16), tol: 60, furos: 1,
    furo: circuloAchatado(20, 12), tolFuro: 60 },
  { nome: 'canto em arco de 90 graus (bulge)', area: AREA_BULGE, tol: 20, furos: 0,
    // prova que o arco virou arco mesmo: a corda reta daria 2250
    minimo: 2300 },
  { nome: 'bloco 20x20 via INSERT', area: 400, tol: 0.5, furos: 0 },
];

console.log(`${r.pecas.length} pecas lidas do DXF` + (r.avisos.length ? ` · avisos: ${r.avisos.join('; ')}` : ''));
console.log('');
let ruim = 0;
const achadas = r.pecas.slice().sort((a, b) => b.area - a.area);
for (const esp of ESPERADO) {
  // casa pela area, sem depender da ordem em que o parser devolve
  let i = -1, melhor = Infinity;
  achadas.forEach((x, k) => { const dif = Math.abs(x.area - esp.area); if (x.usada !== true && dif < melhor) { melhor = dif; i = k; } });
  const achou = i >= 0 ? achadas[i] : null;
  if (achou) achou.usada = true;
  const okArea = achou && Math.abs(achou.area - esp.area) <= esp.tol;
  const okFuros = achou && achou.furos.length === esp.furos &&
    (esp.furos === 0 || Math.abs(achou.furos[0] - esp.furo) <= (esp.tolFuro || 1));
  const okMin = !esp.minimo || (achou && achou.area > esp.minimo);
  if (!okArea || !okFuros || !okMin) ruim++;
  console.log(
    `  ${esp.nome.padEnd(40)} esperado ${esp.area.toFixed(1).padStart(9)} mm2 |`,
    achou ? `lido ${achou.area.toFixed(1).padStart(9)} mm2 (${achou.pontos} pts, ${achou.furos.length} furo)` : 'NAO ACHADA',
    okArea && okFuros && okMin ? 'OK' : 'ERRO'
  );
}
if (r.pecas.length !== ESPERADO.length) { ruim++; console.log(`\n  esperava ${ESPERADO.length} pecas, leu ${r.pecas.length}`); }
console.log(ruim === 0 ? '\n== PARSER DE DXF OK ==' : `\n== ${ruim} PROBLEMAS NO PARSER DE DXF ==`);
await b.close();
process.exit(ruim === 0 ? 0 : 1);
