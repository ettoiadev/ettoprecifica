// Mexi na marcacao dos chips de 7 calculadoras. Compilar nao prova nada sobre
// JSX (licao do CLAUDE.md), entao: para cada aba, seleciona o 1o chip, le o
// preco que o chip anuncia, digita uma medida conhecida e confere se o preco
// final bate com area x preco x NF.
import { chromium } from 'playwright';
const NF = 1.0935;
const CASOS = [
  { tab:'adesivos', larg:'2', alt:'1', unidade:'m²' },
  { tab:'lona',     larg:'2', alt:'1', unidade:'m²' },
  { tab:'placas',   larg:'2', alt:'1', unidade:'m²' },
  { tab:'fachada',  larg:'2', alt:'1', unidade:'m²' },
  { tab:'laser',    larg:'2', alt:'1', unidade:'m²' },
];
const num = (s) => parseFloat(String(s).replace(/[^\d,.-]/g,'').replace(/\./g,'').replace(',','.'));
const b = await chromium.launch();
let falhas = 0;

for (const c of CASOS) {
  const p = await b.newPage({ viewport:{ width:1440, height:1200 } });
  const erros=[]; p.on('pageerror', e=>erros.push(e.message.split('\n')[0]));
  await p.goto(`http://localhost:8080/dev-preview.html?tab=${c.tab}`, { waitUntil:'networkidle' });
  await p.waitForTimeout(400);

  // 1o chip de produto (indigo) e o preco que ele mostra
  const chip = p.locator('button').filter({ hasText: /R\$/ }).first();
  const txtChip = (await chip.textContent()).replace(/\s+/g,' ').trim();
  // o PRIMEIRO R$ e o preco/unidade; um segundo, quando existe, e o minimo do item
  const precoChip = num((txtChip.match(/R\$\s*[\d.,]+/g) || [])[0]);
  await chip.click();
  await p.getByLabel(/^Largura/).first().fill(c.larg);
  await p.getByLabel(/^Altura/).first().fill(c.alt);
  await p.waitForTimeout(600);

  const final = num(await p.locator('.text-3xl').first().textContent());
  const area = parseFloat(c.larg) * parseFloat(c.alt);
  const esperado = precoChip * area * NF;
  const bate = Math.abs(final - esperado) < 0.05;
  if (!bate) falhas++;
  console.log(`${c.tab.padEnd(10)} chip ${String(precoChip).padStart(8)}/${c.unidade} x ${area}m² x NF = ${esperado.toFixed(2).padStart(9)} | tela ${final.toFixed(2).padStart(9)} ${bate?'OK':'<<< DIVERGE'}${erros.length?' ERRO:'+erros[0]:''}`);
  await p.close();
}
console.log(falhas===0 ? '\n== PRECOS CONFEREM EM TODAS ==' : `\n== ${falhas} DIVERGENCIA(S) ==`);
await b.close();

// sai com codigo != 0 para o runner (executar.mjs) detectar a falha
process.exit(falhas === 0 ? 0 : 1);
