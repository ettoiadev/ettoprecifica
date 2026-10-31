// O cache de NFP entre organizacoes so pode ficar se (a) acelerar a segunda
// vez, (b) nao mudar o resultado e (c) for DESCARTADO quando a geometria ou o
// vao mudam. O item (c) e o perigoso: reaproveitar NFP de outro desenho poria
// pecas em cima das outras e o preco sairia menor em silencio.
import { chromium } from 'playwright';

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1500, height: 1100 } });
p.on('pageerror', (e) => console.log('PAGEERROR', e.message));
await p.goto('http://localhost:8080/dev-preview.html?tab=letra-caixa', { waitUntil: 'networkidle' });
await p.getByRole('button', { name: 'Pelo arquivo (SVG/DXF)' }).click();
await p.locator('input[type=file]').setInputFiles(process.argv[2] || '.playwright/fixtures/frase-13-formas.svg');
await p.waitForTimeout(1200);

const organizar = async () => {
  const t0 = Date.now();
  await p.getByRole('button', { name: /^Organizar (automaticamente|novamente)$/ }).click();
  await p.waitForFunction(() => !/Organizando/.test(document.body.textContent || ''), null, { timeout: 900000 });
  const s = (Date.now() - t0) / 1000;
  // A area ocupada E o preco: o motor cobra area x R$/m2. Comparar a area
  // prova a invariancia sem depender da Edge Function (que pede login).
  const total = await p.evaluate(() => {
    const linhas = (document.body.innerText || '').split(String.fromCharCode(10)).map((x) => x.trim());
    const i = linhas.findIndex((x) => /^Área ocupada$/i.test(x));
    return i >= 0 ? linhas[i + 1] : null;
  });
  return { s: +s.toFixed(1), area: total, total };
};

const escolherGiro = async (valor) => {
  await p.locator('#chapa-giro').selectOption(valor);
  await p.waitForTimeout(200);
};

console.log('--- mesmo arquivo, mesmo giro: segunda vez deve usar o cache inteiro ---');
const a1 = await organizar();
const a2 = await organizar();
console.log('  1a vez:', a1.s + 's', '| area', a1.total);
console.log('  2a vez:', a2.s + 's', '| area', a2.total,
  a1.total === a2.total ? '| area IGUAL' : '| AREA MUDOU');

console.log('\n--- troca o giro para 90: as bases de 0 e 180 sao reaproveitadas ---');
await escolherGiro('quarto');
const b1 = await organizar();
await escolherGiro('meia');
const b2 = await organizar();
console.log('  90  :', b1.s + 's', '| area', b1.total);
console.log('  180 de volta:', b2.s + 's', '| area', b2.total,
  b2.total === a1.total ? '| area IGUAL a da 1a vez' : '| AREA MUDOU — CACHE SUJO');

console.log('\n--- muda o VAO: o contorno inflado muda, cache tem de ser descartado ---');
const vao = p.getByLabel(/Vão entre peças/i);
await vao.fill('25');
await p.waitForTimeout(300);
const c1 = await organizar();
await vao.fill('10');
await p.waitForTimeout(300);
const c2 = await organizar();
console.log('  vao 25:', c1.s + 's', '| area', c1.total, c1.total !== a1.total ? '| area mudou, como esperado' : '| SUSPEITO: vao maior deu a mesma area');
console.log('  vao 10 de volta:', c2.s + 's', '| area', c2.total,
  c2.total === a1.total ? '| area IGUAL a da 1a vez' : '| AREA MUDOU — CACHE SUJO');

console.log('\n--- troca o ARQUIVO: formas diferentes, cache tem de ser descartado ---');
await p.locator('input[type=file]').setInputFiles(process.argv[3] || '.playwright/fixtures/letreiro.svg');
await p.waitForTimeout(1200);
const d1 = await organizar();
console.log('  outro arquivo:', d1.s + 's', '| area', d1.total);
await p.locator('input[type=file]').setInputFiles(process.argv[2] || '.playwright/fixtures/frase-13-formas.svg');
await p.waitForTimeout(1200);
const d2 = await organizar();
console.log('  arquivo original de volta:', d2.s + 's', '| area', d2.total,
  d2.total === a1.total ? '| area IGUAL a da 1a vez' : '| AREA MUDOU — CACHE SUJO');

const ok = a1.total === a2.total && b2.total === a1.total && c2.total === a1.total && d2.total === a1.total;
console.log(ok ? '\n== CACHE NAO MUDOU NENHUMA AREA (logo, nenhum preco) ==' : '\n== CACHE ALTEROU AREA — NAO PODE SUBIR ==');
await b.close();
