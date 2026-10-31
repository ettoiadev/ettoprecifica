import { chromium } from 'playwright';
import fs from 'node:fs';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1400 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message.split('\n')[0]));
page.on('console', (m) => { if (m.type()==='error' && !/401|Failed to load resource/i.test(m.text())) errors.push('CONSOLE: '+m.text().slice(0,160)); });

// o preview nao tem login (RLS exige autenticado), entao injetamos a linha real
// que acabou de ser gravada no banco para validar a RENDERIZACAO.
const conteudo = fs.readFileSync('.playwright/materia-prima.txt', 'utf8');
await page.route('**/rest/v1/guide_sections*', (route) => route.fulfill({
  status: 200, contentType: 'application/json',
  body: JSON.stringify([{ id:'3', slug:'materia-prima', title:'Matéria-prima', content: conteudo, sort_order:30, updated_at:'2026-10-01T12:00:00Z' }]),
}));

await page.goto('http://localhost:8080/dev-preview.html?guia=1', { waitUntil: 'networkidle' });
await page.waitForTimeout(1200);

const svgs = await page.locator('figure svg').count();
console.log('desenhos SVG renderizados:', svgs, '(esperado 7)');
const legendas = await page.locator('figcaption').allInnerTexts();
legendas.slice(0,7).forEach((l,i) => console.log(`  ${i+1}. ${l.replace(/\s+/g,' ').trim().slice(0,110)}`));
console.log('marcador #chapa vazou como texto:', (await page.getByText('#chapa:').count()) > 0 ? 'SIM (BUG)' : 'nao');
await page.screenshot({ path: '.playwright/guia/materia-prima.png', fullPage: true });
console.log(errors.length ? 'ERROS: '+[...new Set(errors)].slice(0,3).join(' | ') : 'sem erros de console');
await browser.close();
