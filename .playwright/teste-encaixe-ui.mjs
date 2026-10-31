// Testa a feature de encaixe por SVG PELA INTERFACE, de ponta a ponta:
// upload → leitura do arquivo → encaixe → área → preço vindo do motor.
// Compilar não prova nada; o que prova é o número que aparece na tela.
import { chromium } from 'playwright';

const SVG = process.argv[2] || '.playwright/fixtures/letreiro.svg';
if (!SVG) {
  console.log('uso: node teste-encaixe-ui.mjs <caminho do svg>');
  process.exit(1);
}

const browser = await chromium.launch();
const page = await browser.newPage();
const erros = [];
page.on('pageerror', (e) => erros.push('PAGEERROR: ' + e.message.split('\n')[0]));
page.on('console', (m) => {
  if (m.type() === 'error') erros.push('console: ' + m.text().slice(0, 160));
});

await page.goto('http://localhost:8080/dev-preview.html?tab=letra-caixa', {
  waitUntil: 'networkidle',
});

await page.getByRole('button', { name: 'Pelo arquivo (SVG/DXF)' }).click();
await page.locator('input[type=file]').setInputFiles(SVG);

const info = await page.locator('text=/peças lidas|peça lida/').first().textContent();
console.log('lido do arquivo :', info.replace(/\s+/g, ' ').trim());

const avisos = await page.locator('.bg-amber-50').allTextContents();
if (avisos.length) console.log('avisos          :', avisos.map((a) => a.trim()).join(' | '));

const maior = await page.locator('text=/maior peça/').first().textContent();
console.log('escala          :', maior.replace(/\s+/g, ' ').trim());

async function encaixar(vao) {
  await page.getByLabel('Vão entre peças (mm)').fill(String(vao));
  await page.getByRole('button', { name: /Organizar automaticamente|Organizar novamente/ }).click();
  await page.waitForSelector('text=Área ocupada', { timeout: 120000 });
  await page.waitForTimeout(400);
  const bloco = await page.locator('text=/Área ocupada/').first().locator('..').textContent();
  return [bloco.replace(/\s+/g, ' ').trim()];
}

console.log('\n--- vão 10 mm (minimo) ---');
console.log((await encaixar(10)).join('  |  '));

console.log('\n--- vão 25 mm (a folga extra pode ser absorvida na largura) ---');
console.log((await encaixar(25)).join('  |  '));

// preço final, vindo do motor pela Edge Function
await page.waitForTimeout(1800);
const preco = await page.locator('.text-3xl').first().textContent().catch(() => null);
const composicao = await page.locator('.space-y-1 .flex.justify-between').allTextContents();
console.log('\npreço na tela   :', preco ? preco.trim() : '(sem preço — ver login/Edge Function)');
composicao.forEach((l) => console.log('   ', l.replace(/\s+/g, ' ').trim()));

await page.screenshot({ path: '.playwright/encaixe-svg.png', fullPage: true });
console.log('\n' + (erros.length ? 'ERROS: ' + erros.slice(0, 3).join(' | ') : 'sem erros de console'));
await browser.close();
