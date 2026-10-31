// As caixas (CalcCheckbox) sao linhas grandes e clicaveis -- esse e o contrato.
// O controle do shadcn e um <button role=checkbox>, e botao NAO e elemento
// rotulavel, entao a linha so alterna porque o componente trata o clique. Este
// teste prova que ela alterna clicando no TEXTO, que e onde o dedo cai num
// tablet de balcao. Mede o checkbox DA PROPRIA caixa, nao o primeiro da pagina.
import { chromium } from 'playwright';
const b = await chromium.launch();
let falhas = 0, total = 0;
for (const tab of ['adesivos','lona','placas','fachada','toldo','letra-caixa','vidro','luminoso','laser','dtf','cavaletes']) {
  const p = await b.newPage({ viewport:{ width:1440, height:1100 } });
  await p.goto(`http://localhost:8080/dev-preview.html?tab=${tab}`, { waitUntil:'networkidle' });
  await p.waitForTimeout(350);
  const caixas = await p.locator('div:has(> button[role=checkbox])').all();
  const ruins = [];
  for (const caixa of caixas) {
    const botao = caixa.locator('button[role=checkbox]');
    const texto = (await caixa.textContent()).replace(/\s+/g,' ').trim().slice(0, 34);
    const antes = await botao.getAttribute('aria-checked');
    /*
     * Clica no TEXTO, nao no quadradinho — e tem que ser o span de texto que
     * esta FORA do botao. A versao anterior pegava `span` primeiro, que nas
     * caixas ja marcadas e o indicador DENTRO do botao: elas "passavam" por
     * acidente, e foi assim que em 30/10 se concluiu (errado) que todas
     * alternavam.
     */
    await caixa
      .locator('span')
      .filter({ hasText: /\S/ })
      .last()
      .click()
      .catch(() => {});
    await p.waitForTimeout(180);
    const depois = await botao.getAttribute('aria-checked');
    total++;
    if (antes === depois) { ruins.push(texto); falhas++; }
  }
  console.log(`${tab.padEnd(12)} ${caixas.length} caixa(s)  ${ruins.length ? 'NAO ALTERNA: ' + ruins.join(' | ') : 'todas alternam'}`);
  await p.close();
}
console.log(falhas ? `\n== ${falhas} de ${total} caixas nao alternam ao clicar no texto ==` : `\n== TODAS AS ${total} CAIXAS ALTERNAM ==`);
await b.close();

// sai com codigo != 0 para o runner (executar.mjs) detectar a falha
process.exit(falhas === 0 ? 0 : 1);
