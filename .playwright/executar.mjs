/*
 * Roda a suite de verificacao do navegador.
 *
 * Sobe o `vite` sozinho (porta 8080, a mesma do vite.config.ts), espera ficar
 * de pe, roda cada teste em sequencia e sai com codigo != 0 se algum reprovar.
 * Cada teste e um processo proprio: um que trave nao leva os outros junto.
 *
 *   npm test            -> suite rapida (segundos)
 *   npm run test:tudo   -> inclui os de encaixe, que levam minutos
 */
import { spawn } from 'node:child_process';
import { setTimeout as esperar } from 'node:timers/promises';

const BASE = 'http://localhost:8080';

// nome, argumentos, se entra na suite rapida
const TESTES = [
  ['smoke-todas-abas.mjs', [], true],
  ['auditoria-ui.mjs', [], true],
  ['verifica-chips.mjs', [], true],
  ['larguras-chips.mjs', [], true],
  ['teste-clique-caixa.mjs', [], true],
  ['shot-adesivos-ordem.mjs', [], true],
  ['teste-dxf.mjs', [], true],
  ['teste-ordem-fachada.mjs', [], true],
  ['teste-toldo.mjs', [], true],
  ['teste-folgas.mjs', [], false],
  ['teste-sobreposicao.mjs', [], false],
  ['teste-encaixe-ui.mjs', [], false],
  ['teste-paralelo.mjs', [], false],
  ['teste-cache-nfp.mjs', [], false],
];

const tudo = process.argv.includes('--tudo');
const só = process.argv.find((a) => a.startsWith('--só='))?.slice(5);
const lista = só
  ? TESTES.filter(([n]) => n.includes(só))
  : TESTES.filter(([, , rapido]) => tudo || rapido);

// sem `shell: true` quando ha argumentos: o Node avisa (DEP0190) que passar
// argumentos por shell nao escapa nada. `node` esta no PATH, nao precisa.
const rodando = (cmd, args, opts = {}) =>
  new Promise((ok) => {
    const p = spawn(cmd, args, opts);
    let saida = '';
    p.stdout?.on('data', (d) => (saida += d));
    p.stderr?.on('data', (d) => (saida += d));
    p.on('close', (code) => ok({ code, saida }));
  });

const noAr = async () => {
  try {
    const r = await fetch(`${BASE}/dev-preview.html`);
    return r.ok;
  } catch {
    return false;
  }
};

let servidor = null;
if (await noAr()) {
  console.log(`servidor ja de pe em ${BASE}`);
} else {
  console.log('subindo o vite...');
  servidor = spawn('npm', ['run', 'dev'], { shell: true, stdio: 'ignore', detached: false });
  let tentativas = 0;
  while (!(await noAr())) {
    if (++tentativas > 40) {
      console.error('o servidor nao subiu em 40s');
      servidor.kill();
      process.exit(1);
    }
    await esperar(1000);
  }
  console.log(`servidor de pe em ${BASE}`);
}

console.log(`\n${lista.length} testes${tudo ? ' (suite completa)' : ' (suite rapida — use --tudo para os de encaixe)'}\n`);
const reprovados = [];
for (const [nome, args] of lista) {
  process.stdout.write(`  ${nome.padEnd(28)} `);
  const t0 = Date.now();
  const { code, saida } = await rodando('node', [`.playwright/${nome}`, ...args]);
  const s = ((Date.now() - t0) / 1000).toFixed(1);
  if (code === 0) {
    console.log(`passou  ${s}s`);
  } else {
    console.log(`FALHOU  ${s}s`);
    reprovados.push([nome, saida]);
  }
}

if (reprovados.length) {
  for (const [nome, saida] of reprovados) {
    console.log(`\n----- ${nome} -----\n${saida.trim().split('\n').slice(-25).join('\n')}`);
  }
}
console.log(reprovados.length === 0 ? '\n== TUDO PASSOU ==' : `\n== ${reprovados.length} TESTE(S) REPROVADO(S) ==`);
if (servidor) servidor.kill();
process.exit(reprovados.length === 0 ? 0 : 1);
