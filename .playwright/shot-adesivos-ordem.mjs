import { chromium } from 'playwright';
const PORT = process.env.PORT || 8080;
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1420, height: 1200 } });
await p.goto(`http://localhost:${PORT}/dev-preview.html?tab=adesivos`, { waitUntil: 'networkidle' });
await p.waitForTimeout(500);

// Ordem dos blocos na tela, de cima para baixo.
const ordem = await p.evaluate(() =>
  [...document.querySelectorAll('label.font-medium, h2, h3')]
    .map((e) => ({ t: e.textContent.trim(), y: Math.round(e.getBoundingClientRect().top) }))
    .filter((e) => e.t)
);
console.log('— ordem na tela —');
ordem.sort((a, b) => a.y - b.y).forEach((e) => console.log(String(e.y).padStart(5), e.t));

// Larguras: campo de medida e chip devem bater com a coluna da esquerda.
const larg = await p.evaluate(() => {
  const campo = document.getElementById('adesivo-largura');
  const grid = campo?.closest('.grid');
  const chip = [...document.querySelectorAll('button')].find((x) => /R\$/.test(x.textContent));
  return {
    blocoMedidas: grid ? Math.round(grid.getBoundingClientRect().width) : null,
    chip: chip ? Math.round(chip.getBoundingClientRect().width) : null,
  };
});
console.log('— larguras —', larg);

// Preço continua certo: 2 x 1,5 m, 2 un, no tipo selecionado.
await p.fill('#adesivo-largura', '2');
await p.fill('#adesivo-altura', '1.5');
await p.fill('#adesivo-quantidade', '2');
await p.waitForTimeout(400);
const preco = await p.evaluate(() => {
  const chip = [...document.querySelectorAll('button')].find((x) => /R\$/.test(x.textContent));
  const m2 = chip?.querySelector('.tabular-nums')?.textContent ?? '';
  const total = document.querySelector('.text-3xl')?.textContent ?? '';
  return { m2, total };
});
const n = (s) => parseFloat(s.replace(/[^\d,]/g, '').replace(',', '.'));
const esperado = n(preco.m2) * 2 * 1.5 * 2 * 1.0935;
console.log('— preço —', preco, 'esperado', esperado.toFixed(2), n(preco.total).toFixed(2) === esperado.toFixed(2) ? 'OK' : 'DIVERGE');

await p.screenshot({ path: '.playwright/visual-adesivos-ordem.png', fullPage: false });

// Modo motor: medidas manuais somem ao escolher Recorte 1 Cor.
const btnMotor = p.locator('button', { hasText: 'Adesivo Recorte 1 Cor' }).first();
await btnMotor.click();
await p.waitForTimeout(600);
const motor = await p.evaluate(() => ({
  medidaManual: !!document.getElementById('adesivo-largura'),
  tipoVisivel: !![...document.querySelectorAll('label')].find((l) => l.textContent.trim() === 'Tipo de adesivo'),
}));
console.log('— modo motor —', motor);
await p.screenshot({ path: '.playwright/visual-adesivos-motor.png', fullPage: false });
await b.close();
