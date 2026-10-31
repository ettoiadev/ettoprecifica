import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message.split('\n')[0]));
page.on('console', (m) => { if (m.type() === 'error' && !/401|Failed to load resource|Functions/i.test(m.text())) errors.push('CONSOLE: ' + m.text().slice(0,150)); });

await page.goto('http://localhost:8080/dev-preview.html?tab=adesivos', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
// seleciona "Adesivo Recorte 1 Cor" -> renderiza o painel do MOTOR
await page.getByRole('button', { name: /Adesivo Recorte 1 Cor/ }).click();
await page.waitForTimeout(800);

const checkboxes = await page.getByRole('checkbox').count();
const textos = await page.locator('label').allInnerTexts();
console.log('checkboxes no painel do motor:', checkboxes, '(esperado 3: mascara, nota fiscal, deslocamento)');
console.log('caixas encontradas:', textos.filter(t => /M[áa]scara|nota fiscal|deslocamento/i.test(t)).map(t => t.split('\n')[0]));

// preenche medidas e confere preco do motor
await page.locator('input[type="number"]').first().fill('1');
await page.locator('input[type="number"]').nth(1).fill('1');
await page.waitForTimeout(1500);
const preco = await page.locator('.text-3xl').first().textContent().catch(() => 'sem preco');
console.log('preco 1x1m (motor):', preco?.trim());

// toggle da nota fiscal
const nota = page.locator('label:has-text("Emitir com nota fiscal")');
await nota.click(); await page.waitForTimeout(900);
console.log('preco sem nota:', (await page.locator('.text-3xl').first().textContent())?.trim());
await nota.click(); await page.waitForTimeout(900);
console.log('preco com nota (volta):', (await page.locator('.text-3xl').first().textContent())?.trim());

// toggle da mascara (deve MUDAR o preco, prova que o checkbox certo esta ligado ao state certo)
const masc = page.locator('label:has-text("Máscara de transferência")');
await masc.click(); await page.waitForTimeout(1500);
console.log('preco com mascara:', (await page.locator('.text-3xl').first().textContent())?.trim());

await page.screenshot({ path: '.playwright/depois/adesivo-recorte-motor.png', fullPage: true });
console.log(errors.length ? 'ERROS: ' + errors.join(' | ') : 'sem erros');
await browser.close();
