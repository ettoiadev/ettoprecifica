import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1500, height: 1200 } });
const erros = [];
p.on('pageerror', e => erros.push('PAGEERROR: ' + e.message.split('\n')[0]));
p.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text().slice(0,140)); });
await p.goto('http://localhost:8080/dev-preview.html?tab=toldo', { waitUntil: 'networkidle' });

async function cenario(nome, { tipo, largura, vertical, qtd = '1', viseira = false, laterais = null, solda = null }) {
  await p.getByRole('button', { name: new RegExp(tipo, 'i') }).first().click();
  await p.getByLabel('Largura (m)').fill(largura);
  await p.getByLabel(/Caída da lona|Projeção/).fill(vertical);
  await p.getByLabel('Quantidade').fill(qtd);
  if (laterais !== null) {
    const cx = p.getByText('Com laterais', { exact: true });
    if (await cx.count()) await p.getByLabel('Altura da lateral (m)').fill(laterais);
  }
  if (viseira) await p.getByText('Acabamento viseira', { exact: true }).click();
  if (solda === false) await p.getByText('Serviço de solda', { exact: true }).click();
  await p.waitForTimeout(500);
  const preco = await p.locator('.text-3xl').first().textContent().catch(() => '-');
  console.log(`\n### ${nome}`);
  console.log('   PREÇO:', preco.trim());
  for (const l of await p.locator('.space-y-1 .flex.justify-between').allTextContents())
    console.log('   ', l.replace(/\s+/g, ' ').trim());
  const av = await p.locator('.bg-amber-50').allTextContents();
  av.forEach(a => console.log('   AVISO:', a.replace(/\s+/g,' ').trim()));
  if (viseira) await p.getByText('Acabamento viseira', { exact: true }).click();
}

await cenario('Cortina 5,0 x 2,0 (exemplo do briefing: 3 soldas de 2m)', { tipo: 'Toldo cortina', largura: '5', vertical: '2' });
await cenario('Cortina 1,0 x 2,0 (cabe numa faixa, sem solda)',          { tipo: 'Toldo cortina', largura: '1', vertical: '2' });
await cenario('Cortina 5,0 x 2,0 com viseira',                           { tipo: 'Toldo cortina', largura: '5', vertical: '2', viseira: true });
await cenario('Cortina 7,0 x 3,5 (passa do tubo e da caída)',            { tipo: 'Toldo cortina', largura: '7', vertical: '3.5' });
await cenario('Articulado 5,0 x 2,0',                                    { tipo: 'Toldo articulado', largura: '5', vertical: '2' });
await cenario('Fixo 5,0 x 2,0 com lateral 0,60',                         { tipo: 'Toldo fixo', largura: '5', vertical: '2', laterais: '0.60' });

await p.screenshot({ path: '.playwright/visual-toldo.png', fullPage: true });
console.log('\n' + (erros.length ? 'ERROS: ' + erros.slice(0,3).join(' | ') : 'sem erros de console'));
await b.close();
