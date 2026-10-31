import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1500, height: 1100 } });
const erros = [];
p.on('pageerror', e => erros.push('PAGEERROR: ' + e.message.split('\n')[0]));
await p.goto('http://localhost:8080/dev-preview.html?settings=1', { waitUntil: 'networkidle' });
await p.waitForTimeout(800);
const alvo = p.getByRole('button', { name: /^Toldo$/ });
if (await alvo.count()) { await alvo.first().click(); await p.waitForTimeout(600); }
else console.log('(botao "Toldo" nao encontrado no menu de Configuracoes)');
const campos = await p.locator('label').allTextContents();
console.log('campos da seção:', campos.filter(c => /Toldo|viseira|solda|lona/i.test(c)).join(' | '));
for (const inp of await p.locator('input').all()) {
  const v = await inp.inputValue().catch(() => '');
  const id = await inp.getAttribute('id').catch(() => '');
  if (v) console.log(`   ${(id||'?').padEnd(28)} = ${v}`);
}
await p.screenshot({ path: '.playwright/visual-toldo-config.png', fullPage: true });
console.log(erros.length ? 'ERROS: ' + erros.join(' | ') : 'sem erros de console');
await b.close();
