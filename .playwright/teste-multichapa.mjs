import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('http://localhost:8080/dev-preview.html', { waitUntil: 'networkidle' });

const r = await p.evaluate(async ({ casos }) => {
  const d = await import('/src/lib/nesting/dxfParaPecas.ts');
  const saidas = [];
  for (const c of casos) {
    const lido = d.lerDxf(c.texto);
    const pecas = lido.pecas;
    const res = await new Promise((ok) => {
      const w = new Worker('/nesting/nest-worker.js');
      w.onmessage = (e) => { if (e.data.tipo !== 'progresso') { ok(e.data); w.terminate(); } };
      const C = 2440, L = 1220;
      w.postMessage({
        bin: [{x:0,y:0},{x:C,y:0},{x:C,y:L},{x:0,y:L}],
        parts: pecas.map(x => x.contorno), furos: pecas.map(x => x.furos),
        sources: pecas.map(x => x.forma),
        config: { spacing: 10, margem: 5, chapaReal: { largura: L, comprimento: C },
                  tentativas: 4, rotations: c.rot, curveTolerance: 0.3,
                  exploreConcave: false, useHoles: false },
      });
      setTimeout(() => ok({ tipo:'erro', mensagem:'timeout' }), 180000);
    });
    const R = res.resultado;
    saidas.push({
      nome: c.nome, giros: c.rot.join('/'), enviadas: pecas.length,
      colocadas: R ? R.totalPecas : 0, folhas: R ? R.totalFolhas : 0,
      folhasDetalhe: R ? R.folhas.map(f => ({
        pecas: f.pecas.length, usado: Math.round(f.comprimentoUsado),
        m2: +(f.areaFaixaOcupada/1e6).toFixed(3) })) : [],
      cobrado: R ? +(R.areaFaixaOcupada/1e6).toFixed(3) : null,
      chapasInteiras: R ? +(R.areaChapasInteiras/1e6).toFixed(3) : null,
      erro: res.mensagem,
    });
  }
  return saidas;
}, { casos: [
  { nome: 'multichapa', rot: [0,180], texto: readFileSync(process.argv[2] || '.playwright/fixtures/letreiro.svg', 'utf8') },
  { nome: 'so cabe girada', rot: [0],   texto: readFileSync(process.argv[3], 'utf8') },
  { nome: 'so cabe girada', rot: [0,90,180,270], texto: readFileSync(process.argv[3], 'utf8') },
]});

for (const s of r) {
  console.log(`\n=== ${s.nome} (giros ${s.giros}) ===`);
  if (s.erro) { console.log('  ERRO:', s.erro); continue; }
  console.log(`  pecas enviadas: ${s.enviadas} | colocadas: ${s.colocadas}` +
    (s.colocadas !== s.enviadas ? `  <<< ${s.enviadas - s.colocadas} FICARAM DE FORA` : '  OK'));
  console.log(`  folhas: ${s.folhas}`);
  s.folhasDetalhe.forEach((f,i) =>
    console.log(`    folha ${i+1}: ${String(f.pecas).padStart(2)} pecas | comprimento usado ${String(f.usado).padStart(4)} mm | ${f.m2} m2`));
  console.log(`  COBRADO: ${s.cobrado} m2   (chapas inteiras seriam ${s.chapasInteiras} m2)`);
}
await b.close();
