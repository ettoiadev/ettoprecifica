import { chromium } from 'playwright';

const TABS = ['adesivos', 'lona', 'placas', 'fachada', 'toldo', 'letra-caixa', 'vidro', 'luminoso', 'laser', 'dtf', 'cavaletes'];
const browser = await chromium.launch();
let falhas = 0;

for (const tab of TABS) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1100 } });
  const errors = [];
  page.on('pageerror', (e) => errors.push('PAGEERROR: ' + e.message.split('\n')[0]));
  page.on('console', (m) => {
    if (m.type() === 'error') {
      const t = m.text();
      // Chamadas ao motor falham sem login (401/Edge Function) — esperado no preview.
      if (/401|Failed to load resource|FunctionsHttpError|Edge Function/i.test(t)) return;
      errors.push('CONSOLE: ' + t.split('\n')[0].slice(0, 160));
    }
  });

  await page.goto(`http://localhost:8080/dev-preview.html?tab=${tab}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);

  // conta controles migrados
  const nInputs = await page.locator('input[type="number"]').count();
  const nCheckbox = await page.getByRole('checkbox').count();
  const nChips = await page.locator('button[aria-pressed]').count();
  const nRawCheckbox = await page.locator('input[type="checkbox"]:not([aria-hidden="true"])').count();

  // interage: marca/desmarca o primeiro checkbox
  let toggleOk = 'n/a';
  if (nCheckbox > 0) {
    const cb = page.getByRole('checkbox').first();
    const antes = await cb.getAttribute('data-state');
    await cb.click();
    await page.waitForTimeout(200);
    const depois = await cb.getAttribute('data-state');
    toggleOk = antes !== depois ? 'OK' : 'FALHOU';
    if (toggleOk === 'FALHOU') falhas++;
  }

  // interage: clica no segundo chip, se houver
  let chipOk = 'n/a';
  if (nChips > 1) {
    await page.locator('button[aria-pressed]').nth(1).click();
    await page.waitForTimeout(200);
    chipOk = (await page.locator('button[aria-pressed="true"]').count()) > 0 ? 'OK' : 'FALHOU';
    if (chipOk === 'FALHOU') falhas++;
  }

  await page.screenshot({ path: `.playwright/depois/${tab}.png`, fullPage: true });
  if (errors.length) falhas++;
  console.log(
    `${errors.length ? '✗' : '✓'} ${tab.padEnd(12)} inputs=${String(nInputs).padStart(2)} checkbox=${nCheckbox} chips=${String(nChips).padStart(2)} toggle=${toggleOk.padEnd(6)} chip=${chipOk}` +
      (errors.length ? `\n     ${[...new Set(errors)].slice(0, 3).join('\n     ')}` : '')
  );
  await page.close();
}

console.log(falhas === 0 ? '\n== TODAS AS ABAS OK ==' : `\n== ${falhas} FALHA(S) ==`);
await browser.close();

// sai com codigo != 0 para o runner (executar.mjs) detectar a falha
process.exit(falhas === 0 ? 0 : 1);
