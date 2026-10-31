import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errs = [];
page.on('pageerror', e => errs.push(e.message.split('\n')[0]));
page.on('console', m => { if (m.type()==='error' && !/401|Failed to load/i.test(m.text())) errs.push(m.text().slice(0,140)); });

await page.goto('http://localhost:8080/dev-preview.html?tab=placas', { waitUntil: 'networkidle' });
await page.waitForTimeout(700);

// 0,40 x 0,60 = 0,24 m², Placa PS Branco 1mm = R$180/m²
await page.locator('input[type="number"]').nth(0).fill('0.40');
await page.locator('input[type="number"]').nth(1).fill('0.60');
await page.waitForTimeout(500);
const semLam = await page.locator('.text-3xl').first().textContent();
console.log('sem laminação  (180 x 0,24 x 1,0935 = 47,24):', semLam.trim());

const cx = page.locator('label:has-text("Laminação")');
console.log('caixa de laminação existe:', await cx.count() > 0);
console.log('rótulo:', (await cx.innerText()).trim());

await cx.click();
await page.waitForTimeout(500);
const comLam = await page.locator('.text-3xl').first().textContent();
console.log('com laminação ((180+40) x 0,24 x 1,0935 = 57,74):', comLam.trim());

const painel = await page.locator('h3:has-text("Orçamento")').locator('..').innerText();
console.log('linha de laminação no painel:', /Laminação/.test(painel) ? 'OK' : 'FALTOU');
console.log('preço/m² mostra a composição:', /220,00.*180,00.*40,00/s.test(painel.replace(/\n/g,' ')) ? 'OK' : painel.split('\n').find(l=>l.includes('Preço')) || '?');

// sem nota: (180+40) x 0,24 = 52,80
await page.locator('label:has-text("Emitir com nota fiscal")').click();
await page.waitForTimeout(450);
console.log('com laminação e sem nota (220 x 0,24 = 52,80):', (await page.locator('.text-3xl').first().textContent()).trim());

// desmarcar laminação deve voltar
await cx.click(); await page.waitForTimeout(450);
console.log('sem laminação e sem nota (180 x 0,24 = 43,20):', (await page.locator('.text-3xl').first().textContent()).trim());

// Placa ACM não deve ter a caixa
await page.getByRole('button', { name: 'Placa ACM' }).click();
await page.waitForTimeout(600);
console.log('ACM nao tem caixa de laminacao:', await page.locator('label:has-text("Laminação")').count() === 0 ? 'OK' : 'VAZOU');

await page.screenshot({ path: '.playwright/laminacao.png', fullPage: true });
console.log(errs.length ? 'ERROS: ' + [...new Set(errs)].slice(0,3).join(' | ') : 'sem erros de console');
await browser.close();
