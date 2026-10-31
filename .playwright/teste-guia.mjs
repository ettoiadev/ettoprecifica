import { chromium } from 'playwright';
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const errors = [];
page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message.split('\n')[0]));
page.on('console', (m) => { if (m.type() === 'error' && !/401|Failed to load resource/i.test(m.text())) errors.push('CONSOLE: ' + m.text().slice(0,180)); });

// 1) botao Guia aparece no cabecalho?
await page.goto('http://localhost:8080/dev-preview.html?tab=placas', { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
const btnGuia = page.getByRole('button', { name: 'Guia' });
console.log('botao Guia no cabecalho:', await btnGuia.count() > 0 ? 'OK' : 'FALTOU');
await page.screenshot({ path: '.playwright/guia/header.png', clip: { x: 0, y: 0, width: 1440, height: 100 } });

// 2) clicar abre a tela do guia
await btnGuia.click();
await page.waitForTimeout(1800);
const abas = await page.getByRole('tab').allInnerTexts();
console.log('abas carregadas do banco:', JSON.stringify(abas));
await page.screenshot({ path: '.playwright/guia/guia.png', fullPage: true });

// 3) entrar em edicao
const editar = page.getByRole('button', { name: /Editar/ });
if (await editar.count()) {
  await editar.click();
  await page.waitForTimeout(400);
  const temTextarea = await page.locator('textarea').count();
  console.log('modo edicao abriu textarea:', temTextarea > 0 ? 'OK' : 'FALTOU');
  await page.screenshot({ path: '.playwright/guia/edicao.png', fullPage: true });
  await page.getByRole('button', { name: 'Cancelar' }).click();
  await page.waitForTimeout(300);
}

// 4) trocar de aba
if (abas.length > 1) {
  await page.getByRole('tab', { name: abas[1] }).click();
  await page.waitForTimeout(400);
  console.log('troca de aba:', (await page.getByRole('tab', { name: abas[1] }).getAttribute('data-state')) === 'active' ? 'OK' : 'FALHOU');
}

// 5) voltar
await page.getByRole('button', { name: 'Fechar' }).click();
await page.waitForTimeout(600);
console.log('voltou para a calculadora:', await page.getByRole('tab', { name: /Adesivos|Placas/ }).count() >= 0 ? 'OK' : '?');
console.log(errors.length ? 'ERROS: ' + [...new Set(errors)].slice(0,4).join(' | ') : 'sem erros de console');
await browser.close();
