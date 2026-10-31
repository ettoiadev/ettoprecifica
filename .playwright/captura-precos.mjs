// Captura o painel "Orçamento" inteiro nas abas de preco MANUAL (as unicas que
// calculam sem login). Compara antes/depois de uma refatoracao de UI para provar
// que nenhum numero mudou. Nao clica em chips (trocar de tipo remonta o painel);
// usa a selecao padrao + toggle de nota fiscal.
import { chromium } from 'playwright';
import fs from 'node:fs';

const out = process.argv[2] || '.playwright/precos.json';
const browser = await chromium.launch();
const resultado = {};

// [aba, valores para os primeiros inputs numericos]
const CASOS = [
  ['placas', ['2', '1', '3']],
  ['lona', ['2', '1', '2']],
  ['laser', ['2', '1', '2']],
  ['dtf', ['2']],
  ['fachada', ['2', '1']],
  ['adesivos', ['2', '1', '2']],
  ['etiquetas-na', []],
];

const painel = async (page) =>
  (await page.locator('h3:has-text("Orçamento")').locator('..').innerText())
    .split('\n').map((s) => s.trim()).filter(Boolean);

for (const [tab, valores] of CASOS) {
  if (tab === 'etiquetas-na') continue;
  const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } });
  await page.goto(`http://localhost:8080/dev-preview.html?tab=${tab}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(400);

  const inputs = page.locator('input[type="number"]');
  const total = await inputs.count();
  for (let i = 0; i < Math.min(valores.length, total); i++) {
    await inputs.nth(i).fill(valores[i]);
  }
  await page.waitForTimeout(500);

  const leituras = { com_nota: await painel(page) };

  const label = page.locator('label:has-text("Emitir com nota fiscal")').first();
  if (await label.count()) {
    await label.click();
    await page.waitForTimeout(400);
    leituras.sem_nota = await painel(page);
  }

  resultado[tab] = leituras;
  console.log('capturado:', tab);
  await page.close();
}

fs.writeFileSync(out, JSON.stringify(resultado, null, 2));
console.log('salvo em', out);
await browser.close();
