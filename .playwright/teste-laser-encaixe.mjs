import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1500, height: 1200 } });
const erros = [];
p.on('pageerror', e => erros.push('PAGEERROR: ' + e.message.split('\n')[0]));
p.on('console', m => { if (m.type() === 'error') erros.push('console: ' + m.text().slice(0,140)); });

await p.goto('http://localhost:8080/dev-preview.html?tab=laser', { waitUntil: 'networkidle' });

// modo manual continua funcionando
await p.getByLabel('Largura (m)').fill('0.5');
await p.getByLabel('Altura (m)').fill('0.4');
await p.waitForTimeout(400);
console.log('MANUAL 0,5x0,4m :', (await p.locator('.text-3xl').first().textContent()).trim());
const comp0 = await p.locator('.space-y-1 .flex.justify-between').allTextContents();
comp0.forEach(l => console.log('   ', l.replace(/\s+/g,' ').trim()));

// modo arquivo
await p.getByRole('button', { name: 'Pelo arquivo (SVG/DXF)' }).click();
await p.locator('input[type=file]').setInputFiles(process.argv[2] || '.playwright/fixtures/frase-13-formas.svg');
await p.waitForTimeout(700);
console.log('\nmínimos na tela:', (await p.locator('text=/Mínimos de produção/').first().textContent()).replace(/\s+/g,' ').trim());
console.log('lido          :', (await p.locator('text=/formas distinta|forma$/').first().textContent()).replace(/\s+/g,' ').trim());
await p.getByLabel('Altura real do conjunto (cm)').fill('30');
await p.getByRole('button', { name: /Organizar/ }).click();
await p.waitForSelector('text=Área ocupada', { timeout: 300000 });
await p.waitForTimeout(1200);
console.log('consumo       :', (await p.locator('text=/Área ocupada/').first().locator('..').textContent()).replace(/\s+/g,' ').trim());
console.log('ARQUIVO preço :', (await p.locator('.text-3xl').first().textContent()).trim());
const comp = await p.locator('.space-y-1 .flex.justify-between').allTextContents();
comp.forEach(l => console.log('   ', l.replace(/\s+/g,' ').trim()));
await p.screenshot({ path: '.playwright/visual-laser.png', fullPage: true });
console.log('\n' + (erros.length ? 'ERROS: ' + erros.slice(0,3).join(' | ') : 'sem erros de console'));
await b.close();
