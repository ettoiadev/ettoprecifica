// A nova ordem so vale para config NOVA. Para quem ja salvou, migrateConfig
// reordena -- mas SO se a lista estiver intocada. Se o vendedor reordenou a
// mao, mexer seria desfazer uma escolha dele. Este teste cobre os dois casos.
import { chromium } from 'playwright';
const b = await chromium.launch();
const p = await b.newPage();
p.on('pageerror', e => console.log('PAGEERROR', e.message));
await p.goto('http://localhost:8080/dev-preview.html', { waitUntil: 'networkidle' });

const r = await p.evaluate(async () => {
  const m = await import('/src/utils/productOptions.ts');
  const item = (id) => ({ id, label: id, price: 100, unit: 'm²', minPrice: 300 });
  const ANTIGA = ['acmSimples','acmRecortesDobras','acmLetraPvc','acmLetraIluminada','lonaCantoneira','lonaIlhos','lonaIluminada'];
  const casos = {
    'lista intocada (ordem antiga)': ANTIGA,
    'vendedor reordenou a mao':      ['lonaIluminada', ...ANTIGA.filter(i => i !== 'lonaIluminada')],
    'vendedor removeu um tipo':      ANTIGA.filter(i => i !== 'acmLetraPvc'),
  };
  const saida = {};
  for (const [nome, ids] of Object.entries(casos)) {
    const cfg = { fachada: { itens: ids.map(item) } };
    saida[nome] = m.migrateConfig(cfg).fachada.itens.map(i => i.id);
  }
  // config sem `itens`: semeada do zero
  saida['config nova (sem itens)'] = m.migrateConfig({ fachada: { lonaCantoneira: 250 } }).fachada.itens.map(i => i.id);
  return saida;
});

const ESPERADO_NOVA = ['lonaCantoneira','lonaIlhos','acmSimples','acmRecortesDobras','acmLetraPvc','acmLetraIluminada','lonaIluminada'];
for (const [nome, ids] of Object.entries(r)) {
  const reordenou = JSON.stringify(ids) === JSON.stringify(ESPERADO_NOVA);
  console.log(`${nome.padEnd(32)} -> ${reordenou ? 'ORDEM NOVA' : 'preservada '} | ${ids.join(', ')}`);
}
await b.close();
