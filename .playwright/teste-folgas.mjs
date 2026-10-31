// Prova que vão entre peças e margem de borda sao INDEPENDENTES, medindo as
// distancias reais no resultado do encaixe em vez de confiar na configuracao.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('http://localhost:8080/dev-preview.html', { waitUntil: 'networkidle' });

const r = await p.evaluate(async ({ texto, casos }) => {
  const g = await import('/src/lib/nesting/geometria.ts');
  const m = await import('/src/lib/nesting/svgParaPecas.ts');
  const lido = await m.lerSvg(texto);
  const esc = g.escalarPecas(lido.pecas, 400 / lido.altura);

  const distPontoSeg = (q, a, c) => {
    const dx = c.x - a.x, dy = c.y - a.y, den = dx*dx + dy*dy;
    if (den === 0) return Math.hypot(q.x - a.x, q.y - a.y);
    let t = ((q.x - a.x)*dx + (q.y - a.y)*dy) / den;
    t = Math.max(0, Math.min(1, t));
    return Math.hypot(q.x - (a.x + t*dx), q.y - (a.y + t*dy));
  };
  const distPoli = (A, B) => {
    let min = Infinity;
    for (const q of A) for (let i = 0; i < B.length; i++)
      min = Math.min(min, distPontoSeg(q, B[i], B[(i+1) % B.length]));
    for (const q of B) for (let i = 0; i < A.length; i++)
      min = Math.min(min, distPontoSeg(q, A[i], A[(i+1) % A.length]));
    return min;
  };

  const saidas = [];
  for (const { vao, margem } of casos) {
    const res = await new Promise((ok) => {
      const w = new Worker('/nesting/nest-worker.js');
      w.onmessage = (e) => { if (e.data.tipo !== 'progresso') { ok(e.data); w.terminate(); } };
      const desvio = margem - vao/2;
      const C = 2440, L = 1220;
      w.postMessage({
        bin: [{x:0,y:0},{x:C-2*desvio,y:0},{x:C-2*desvio,y:L-2*desvio},{x:0,y:L-2*desvio}],
        parts: esc.map(x => x.contorno), furos: esc.map(x => x.furos), sources: esc.map(x => x.id),
        config: { spacing: vao, margem, chapaReal: { largura: L, comprimento: C },
                  tentativas: 6, rotations: [0,90,180,270], curveTolerance: 0.3,
                  exploreConcave: false, useHoles: false },
      });
      setTimeout(() => ok({ tipo: 'erro', mensagem: 'timeout' }), 120000);
    });
    if (!res.resultado) { saidas.push({ vao, margem, erro: res.mensagem }); continue; }
    const folha = res.resultado.folhas[0];
    const chapa = res.resultado.chapa;
    let borda = Infinity;
    for (const pc of folha.pecas) for (const q of pc.pontos)
      borda = Math.min(borda, q.x, q.y, chapa.altura - q.y);
    let entre = Infinity;
    for (let i = 0; i < folha.pecas.length; i++)
      for (let j = i+1; j < folha.pecas.length; j++)
        entre = Math.min(entre, distPoli(folha.pecas[i].pontos, folha.pecas[j].pontos));
    saidas.push({ vao, margem, borda: +borda.toFixed(2), entre: +entre.toFixed(2),
      faixa: +(res.resultado.areaFaixaOcupada/1e6).toFixed(3) });
  }
  return saidas;
}, { texto: readFileSync(process.argv[2] || '.playwright/fixtures/letreiro.svg', 'utf8'),
     casos: [{vao:10,margem:5},{vao:20,margem:5},{vao:10,margem:30},{vao:40,margem:5}] });

console.log('pedido vs medido no desenho (mm):\n');
let ruim = 0;
for (const s of r) {
  if (s.erro) { console.log(`vao ${s.vao} margem ${s.margem}: ERRO ${s.erro}`); ruim++; continue; }
  const okB = s.borda >= s.margem - 0.6, okE = s.entre >= s.vao - 0.6;
  console.log(`vao ${String(s.vao).padStart(2)} margem ${String(s.margem).padStart(2)} ->`,
    `borda ${String(s.borda).padStart(6)} ${okB?'OK ':'FALHOU'} |`,
    `entre pecas ${String(s.entre).padStart(6)} ${okE?'OK ':'FALHOU'} |`,
    `faixa ${s.faixa} m2`);
  if (!okB || !okE) ruim++;
}
console.log(ruim === 0 ? '== VAO E MARGEM RESPEITADOS EM TODOS OS CASOS ==' : `== ${ruim} CASOS COM FOLGA ABAIXO DO PEDIDO ==`);
await b.close();
// sai com codigo != 0 para o runner (executar.mjs) detectar a falha
process.exit(ruim === 0 ? 0 : 1);
