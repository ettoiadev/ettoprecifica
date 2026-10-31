// Auditoria factual: percorre as abas e mede coisas que dao para contar,
// em vez de opinar. Campo sem nome acessivel e defeito real (leitor de tela
// nao le, e o clique no rotulo nao foca o campo).
import { chromium } from 'playwright';
const TABS = ['adesivos','lona','placas','fachada','toldo','letra-caixa','vidro','luminoso','laser','dtf','cavaletes'];
const b = await chromium.launch();
const total = { campos: 0, semNome: 0 };
const detalhe = [];

for (const tab of TABS) {
  const p = await b.newPage({ viewport: { width: 1440, height: 1100 } });
  await p.goto(`http://localhost:8080/dev-preview.html?tab=${tab}`, { waitUntil: 'networkidle' });
  await p.waitForTimeout(400);

  const r = await p.evaluate(() => {
    const nomeDe = (el) => {
      if (el.getAttribute('aria-label')) return el.getAttribute('aria-label');
      if (el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l) return l.textContent.trim(); }
      const pai = el.closest('label');
      if (pai) return pai.textContent.trim();
      return '';
    };
    const campos = [...document.querySelectorAll('input:not([type=hidden]):not([type=file]), select, textarea')];
    const sem = campos.filter(c => !nomeDe(c));
    // rotulo de grupo usando <label> sem for: deveria ser texto, nao label
    const labelsOrfas = [...document.querySelectorAll('label:not([for])')]
      .filter(l => !l.querySelector('input,select,textarea')).length;
    // chips com preco embutido no fim da descricao (padrao antigo)
    const chipsInline = [...document.querySelectorAll('button')]
      .filter(x => /·\s*R\$|\bR\$[\d.,\s]+\/m²$/.test(x.textContent.replace(/\s+/g,' ').trim())).length;
    return {
      campos: campos.length,
      sem: sem.map(c => (c.placeholder || c.name || c.type || 'campo')),
      labelsOrfas, chipsInline,
    };
  });

  total.campos += r.campos; total.semNome += r.sem.length;
  detalhe.push({ tab, campos: r.campos, semNome: r.sem.length, labelsOrfas: r.labelsOrfas, chipsInline: r.chipsInline, quais: r.sem.join(', ') });
  await p.close();
}

console.log('aba          campos  s/nome  label-órfã  chips c/ preço inline');
for (const d of detalhe)
  console.log(`${d.tab.padEnd(13)}${String(d.campos).padStart(5)}${String(d.semNome).padStart(8)}${String(d.labelsOrfas).padStart(11)}${String(d.chipsInline).padStart(12)}   ${d.quais}`);
console.log(`\nTOTAL: ${total.semNome} de ${total.campos} campos sem nome acessível`);
await b.close();
