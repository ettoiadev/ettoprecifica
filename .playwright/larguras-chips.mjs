import { chromium } from 'playwright';
const b = await chromium.launch();
console.log('aba          largura do chip   distância rótulo→preço');
for (const tab of ['lona','adesivos','placas','fachada','laser','dtf']) {
  const p = await b.newPage({ viewport: { width: 1420, height: 1000 } });
  await p.goto(`http://localhost:8080/dev-preview.html?tab=${tab}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);
  const r = await p.evaluate(() => {
    const chip = [...document.querySelectorAll('button')].find(x => /R\$/.test(x.textContent));
    if (!chip) return null;
    const rotulo = chip.querySelector('.font-medium');
    const preco = chip.querySelector('.tabular-nums');
    if (!rotulo || !preco) return { w: Math.round(chip.getBoundingClientRect().width), gap: null };
    const a = rotulo.getBoundingClientRect(), c = preco.getBoundingClientRect();
    return { w: Math.round(chip.getBoundingClientRect().width), gap: Math.round(c.left - a.right) };
  });
  console.log(`${tab.padEnd(13)}${String(r?.w ?? '-').padStart(10)}px ${String(r?.gap ?? '-').padStart(18)}px`);
  await p.close();
}
await b.close();
