// O simulador de parcelamento tem que dar EXATAMENTE o mesmo numero que a
// maquininha do Etto, senao ele promete ao cliente um valor que nao recebe.
//
// Dois casos de referencia, tirados dos prints do InfinitePay:
//   sem repasse: R$ 2.300,00 em 6x a 8,28% -> "Voce recebe R$ 2.109,56"
//   com repasse: R$ 100,00 a 5,49%         -> "o cliente paga R$ 105,81"
//
// Reparar que repassar NAO e somar a taxa por cima: 100 + 8,28% da 108,28, e
// 8,28% disso sao 8,97, sobrando 99,31. A conta certa e dividir por (1 - taxa).
import { chromium } from 'playwright';

const TABS = ['adesivos','lona','placas','fachada','toldo','letra-caixa','vidro','luminoso','laser','dtf','cavaletes'];
const b = await chromium.launch();
let ruim = 0;

const moeda = (t) => parseFloat(String(t).replace(/[^\d,]/g, '').replace(',', '.'));

// 1) a conta, conferida contra os dois casos de referencia
console.log('conta do parcelamento (referencia: prints do InfinitePay)');
{
  const p = await b.newPage({ viewport: { width: 1440, height: 1200 } });
  await p.goto('http://localhost:8080/dev-preview.html?tab=lona', { waitUntil: 'networkidle' });
  await p.fill('#lona-largura', '1');
  await p.fill('#lona-altura', '1');
  await p.waitForTimeout(300);
  // preco de 1x1m na Lona com o default: so precisamos de UM valor conhecido,
  // entao lemos o que a tela mostra e conferimos a aritmetica sobre ele
  const base = moeda(await p.locator('.text-3xl').first().textContent());
  await p.locator('#parcelas-cartao').selectOption('6');
  await p.waitForTimeout(200);
  const ler = async () => {
    const t = await p.evaluate(() => {
      const linhas = (document.body.innerText || '').split(String.fromCharCode(10)).map((x) => x.trim());
      const pega = (r) => { const i = linhas.findIndex((x) => r.test(x)); return i >= 0 ? linhas[i + 1] : null; };
      return { paga: pega(/^Seu cliente paga$/), recebe: pega(/^Você recebe$/) };
    });
    return { paga: moeda(t.paga), recebe: moeda(t.recebe) };
  };
  const semRepasse = await ler();
  const espRecebe = Math.round(base * (1 - 0.0828) * 100) / 100;
  const okSem = Math.abs(semRepasse.recebe - espRecebe) < 0.02 && Math.abs(semRepasse.paga - base) < 0.01;
  console.log(`  sem repasse  base ${base.toFixed(2)} 6x 8,28% -> paga ${semRepasse.paga.toFixed(2)} recebe ${semRepasse.recebe.toFixed(2)} (esperado ${espRecebe.toFixed(2)}) ${okSem ? 'OK' : 'ERRO'}`);
  if (!okSem) ruim++;

  await p.locator('div:has(> button[role=checkbox])', { hasText: 'Repassar a taxa' }).locator('span').filter({ hasText: /\S/ }).last().click();
  await p.waitForTimeout(200);
  const comRepasse = await ler();
  const espPaga = Math.round((base / (1 - 0.0828)) * 100) / 100;
  const okCom = Math.abs(comRepasse.paga - espPaga) < 0.02 && Math.abs(comRepasse.recebe - base) < 0.01;
  console.log(`  com repasse  base ${base.toFixed(2)} 6x 8,28% -> paga ${comRepasse.paga.toFixed(2)} (esperado ${espPaga.toFixed(2)}) recebe ${comRepasse.recebe.toFixed(2)} ${okCom ? 'OK' : 'ERRO'}`);
  if (!okCom) ruim++;

  // a formula do repasse NAO pode ser "somar a taxa por cima"
  const somaPorCima = Math.round(base * 1.0828 * 100) / 100;
  const caiuNaArmadilha = Math.abs(comRepasse.paga - somaPorCima) < 0.02;
  console.log(`  repasse nao e soma por cima (${somaPorCima.toFixed(2)}): ${caiuNaArmadilha ? 'CAIU NA ARMADILHA' : 'OK'}`);
  if (caiuNaArmadilha) ruim++;
  await p.close();
}

// 2) a caixa aparece em todas as abas, e so depois de haver preco
console.log('\na caixa aparece em todas as abas');
for (const tab of TABS) {
  const p = await b.newPage({ viewport: { width: 1440, height: 1200 } });
  await p.goto(`http://localhost:8080/dev-preview.html?tab=${tab}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(250);
  const antes = await p.locator('#parcelas-cartao').count();
  // preenche o que houver de medida para fazer aparecer preco
  const campos = await p.locator('input[type=number]').all();
  for (const c of campos.slice(0, 2)) await c.fill('2').catch(() => {});
  await p.waitForTimeout(700);
  const depois = await p.locator('#parcelas-cartao').count();
  const temPreco = (await p.locator('.text-3xl').count()) > 0;
  // regra: sem preco nao ha simulador; com preco, ha
  const ok = antes === 0 && (!temPreco || depois === 1);
  if (!ok) ruim++;
  console.log(`  ${tab.padEnd(13)} sem preco: ${antes === 0 ? 'escondida' : 'VISIVEL (erro)'} · com preco: ${temPreco ? (depois ? 'aparece' : 'NAO APARECE') : 'sem preco nesta aba'} ${ok ? '' : 'ERRO'}`);
  await p.close();
}

console.log(ruim === 0 ? '\n== PARCELAMENTO OK ==' : `\n== ${ruim} PROBLEMAS NO PARCELAMENTO ==`);
await b.close();
process.exit(ruim === 0 ? 0 : 1);
