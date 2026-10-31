import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1500, height: 1250 } });
const erros = [];
p.on('pageerror', e => erros.push('PAGEERROR: ' + e.message.split('\n')[0]));
p.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text().slice(0,140)); });
await p.goto('http://localhost:8080/dev-preview.html?tab=fachada', { waitUntil: 'networkidle' });
await p.waitForTimeout(500);

console.log('ORDEM DOS TIPOS:');
const chips = await p.locator('label:has-text("Tipo de fachada") + div button').all();
for (const [i, c] of chips.entries())
  console.log(`  ${i + 1}. ${(await c.textContent()).replace(/\s+/g, ' ').trim()}`);

const ativo = await p.locator('label:has-text("Tipo de fachada") + div button.bg-indigo-100').first().textContent();
console.log('\nselecionado ao abrir:', ativo.replace(/\s+/g,' ').trim());

// preço continua igual ao de antes para o mesmo caso (cantoneira 3,5 x 1,20)
await p.getByLabel('Largura (m)').fill('3.5');
await p.getByLabel('Altura (m)').fill('1.20');
await p.waitForTimeout(500);
console.log('\ncantoneira 3,5x1,20 :', (await p.locator('.text-3xl').first().textContent()).trim());
for (const l of await p.locator('.space-y-1 .flex.justify-between').allTextContents())
  console.log('   ', l.replace(/\s+/g,' ').trim());

// caso que cai no minimo do tipo
await p.getByLabel('Largura (m)').fill('0.5');
await p.getByLabel('Altura (m)').fill('0.5');
await p.waitForTimeout(500);
console.log('\ncantoneira 0,5x0,5  :', (await p.locator('.text-3xl').first().textContent()).trim());
const alerta = await p.locator('text=/Abaixo do mínimo/').first().textContent().catch(()=>null);
console.log('   aviso de mínimo  :', alerta ? alerta.replace(/\s+/g,' ').trim() : '(nenhum)');

await p.screenshot({ path: '.playwright/visual-fachada.png', fullPage: true });
console.log('\n' + (erros.length ? 'ERROS: ' + erros.slice(0,3).join(' | ') : 'sem erros de console'));
await b.close();
