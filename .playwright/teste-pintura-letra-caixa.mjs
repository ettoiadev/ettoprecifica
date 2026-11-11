// Pintura automotiva (PU) na aba Letra Caixa, pela interface.
//
// O que este teste protege: a pintura entra no preco SOMANDO, e a soma nao pode
// se perder. O PVC 20mm tem preco manual (R$524/m2 em Configuracoes), entao o
// valor final da para conferir na mao, sem depender da Edge Function - que no
// dev-preview pede login.
//
// Conta esperada (1 m2, NF de 9,35% dos produtos manuais):
//   sem pintura       524,00           x 1,0935 = 572,99
//   cor padrao   524 +  49,3827 = 573,3827 x 1,0935 = 626,99
//   cor especial 524 + 123,4568 = 647,4568 x 1,0935 = 707,99
import { chromium } from 'playwright';

const URL = 'http://localhost:8080/dev-preview.html?tab=letra-caixa';
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1440, height: 1000 } });
await p.goto(URL, { waitUntil: 'networkidle' });

let ruim = 0;
const confere = (nome, obtido, esperado) => {
  const ok = String(obtido) === String(esperado);
  if (!ok) ruim++;
  console.log(`  ${nome.padEnd(46)} ${String(obtido).padStart(14)}  esperado ${String(esperado).padStart(14)}  ${ok ? 'OK' : 'ERRO'}`);
};

// preco de venda que o painel mostra
const preco = async () => {
  const el = p.locator('.text-3xl.font-bold').first();
  if (!(await el.count())) return 'sem preco';
  return (await el.innerText()).replace(/\s+/g, ' ').trim();
};
const chip = (nome) => p.locator('button[aria-pressed]', { hasText: nome }).first();

// 1 x 1 m de PVC 20mm (preco manual)
await p.getByLabel('Largura (m)').fill('1');
await p.getByLabel('Altura (m)').fill('1');
await p.waitForTimeout(700);

console.log('o chip anuncia o R$/m2 derivado da lata');
const txtSimples = await chip('Tinta simples').innerText();
const txtEspecial = await chip('Tinta especial').innerText();
confere('tinta simples (80/0,9 x 2/9 x 2,5)', /R\$\s*49,38/.test(txtSimples), true);
confere('tinta especial (200/0,9 x 2/9 x 2,5)', /R\$\s*123,46/.test(txtEspecial), true);

console.log('\npreco final de 1 m2 de PVC 20mm');
confere('sem pintura (padrao ao abrir)', await preco(), 'R$ 572,99');

await chip('Tinta simples').click();
await p.waitForTimeout(400);
confere('+ cor padrao', await preco(), 'R$ 626,99');
const comp = await p.locator('.space-y-1').first().innerText();
confere('composicao mostra a linha da pintura', /Pintura PU/.test(comp), true);
const litros = await p.locator('p.text-xs.text-gray-500', { hasText: 'latas de 1/4' }).first().innerText();
confere('mostra o consumo de tinta (0,22 L)', /0,22 L|0\.22 L/.test(litros), true);

await chip('Tinta especial').click();
await p.waitForTimeout(400);
confere('+ cor especial', await preco(), 'R$ 707,99');

await chip('Sem pintura').click();
await p.waitForTimeout(400);
confere('volta para sem pintura, sem residuo', await preco(), 'R$ 572,99');

// a pintura entra DEPOIS do piso de projeto: senao, num letreiro pequeno
// (material abaixo do piso de R$300) a tinta sairia de graca
console.log('\npiso de projeto nao engole a pintura');
await p.getByLabel('Largura (m)').fill('0.2');
await p.getByLabel('Altura (m)').fill('0.5');
await p.waitForTimeout(700);
confere('0,1 m2 cai no piso de 300', await preco(), 'R$ 328,05');
await chip('Tinta simples').click();
await p.waitForTimeout(400);
// 300 + (49,3827 x 0,1) = 304,938 -> x 1,0935 = 333,45
confere('piso + pintura de 0,1 m2', await preco(), 'R$ 333,45');

// nos materiais por altura da letra nao existe area, logo nao existe o box
console.log('\nso o PVC tem o box (os outros nao tem area em m2)');
await p.locator('button[aria-pressed]', { hasText: 'Galvanizado' }).first().click();
await p.waitForTimeout(300);
confere('Galvanizado nao mostra pintura', await p.getByText('Pintura automotiva (PU)').count(), 0);
await p.locator('button[aria-pressed]', { hasText: 'PVC' }).first().click();
await p.waitForTimeout(300);
confere('PVC mostra de novo', await p.getByText('Pintura automotiva (PU)').count(), 1);

await b.close();
console.log(ruim === 0 ? '\n== PINTURA DA LETRA CAIXA OK ==' : `\n== ${ruim} PROBLEMAS NA PINTURA DA LETRA CAIXA ==`);
process.exit(ruim === 0 ? 0 : 1);
