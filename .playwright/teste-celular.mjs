// A aplicacao e usada em balcao, inclusive em celular. Este teste reprova:
//  - rolagem horizontal da PAGINA em qualquer largura (algo mais largo que a tela)
//  - campo de medida estreito demais para digitar no celular
//  - aba sem rotulo visivel (so icone nao diz que aba e)
//
// Os 22px de rolagem que existiam em TODAS as abas eram o selo de ambiente
// ("Local"/"Preview") no cabecalho, que nao aparece em producao: invisivel no
// site publicado e atrapalhando justamente quem confere um Preview Deploy.
import { chromium } from 'playwright';

const TABS = ['adesivos','lona','placas','fachada','toldo','letra-caixa','vidro','luminoso','laser','dtf','cavaletes'];
const LARGURAS = [[390, 'celular'], [768, 'tablet'], [1440, 'desktop']];
const MIN_CAMPO = 100; // px: abaixo disso "0.00" fica apertado para o dedo
const b = await chromium.launch();
let ruim = 0;

// 1) nenhuma largura pode fazer a PAGINA rolar de lado
console.log('rolagem horizontal da pagina');
for (const [w, nome] of LARGURAS) {
  const estouros = [];
  for (const tab of TABS) {
    const p = await b.newPage({ viewport: { width: w, height: 900 } });
    await p.goto(`http://localhost:8080/dev-preview.html?tab=${tab}`, { waitUntil: 'networkidle' });
    await p.waitForTimeout(200);
    const e = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    if (e > 2) estouros.push(`${tab} ${e}px`);
    await p.close();
  }
  if (estouros.length) ruim++;
  console.log(`  ${nome.padEnd(9)} ${String(w).padStart(4)}px  ${estouros.length ? 'ESTOURA: ' + estouros.join(', ') : `ok nas ${TABS.length} abas`}`);
}

// 2) no celular, campo e rotulo de aba precisam ser usaveis
console.log('\nno celular (390px)');
console.log('  ' + 'aba'.padEnd(13) + 'menor campo'.padEnd(14) + 'abas com rotulo');
for (const tab of TABS) {
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  await p.goto(`http://localhost:8080/dev-preview.html?tab=${tab}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(220);
  const r = await p.evaluate(() => {
    const campos = [...document.querySelectorAll('input[type=number]')]
      .map((e) => Math.round(e.getBoundingClientRect().width))
      .filter((w) => w > 0);
    const abas = [...document.querySelectorAll('button')].filter((e) => e.querySelector('svg'));
    return {
      menor: campos.length ? Math.min(...campos) : null,
      comRotulo: abas.filter((e) => (e.innerText || '').trim().length > 0).length,
    };
  });
  const okCampo = r.menor === null || r.menor >= MIN_CAMPO;
  // as 11 abas do menu precisam mostrar o nome, nao so o icone
  const okAbas = r.comRotulo >= TABS.length;
  if (!okCampo || !okAbas) ruim++;
  console.log(
    '  ' + tab.padEnd(13) +
    (r.menor === null ? '-' : `${r.menor}px ${okCampo ? '' : 'APERTADO'}`).padEnd(14) +
    `${r.comRotulo}${okAbas ? '' : ' POUCAS'}`
  );
  await p.close();
}

console.log(ruim === 0 ? '\n== LAYOUT OK EM CELULAR, TABLET E DESKTOP ==' : `\n== ${ruim} PROBLEMAS DE LAYOUT ==`);
await b.close();
process.exit(ruim === 0 ? 0 : 1);
