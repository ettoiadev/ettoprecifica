// A conta do preco manual da Letra Caixa, sem navegador. Sao dois modelos
// (PVC por m2 com piso de projeto; os outros por cm de altura em faixas) e o
// que mais importa aqui e o que acontece quando NAO ha preco definido: tem que
// dar "sem preco", nunca R$ 0,00 - zero na tela pareceria orcamento valido.
import { readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';

// compila os dois modulos TS para ESM e importa
const dir = mkdtempSync(join(tmpdir(), 'lc-'));
execFileSync('node', [
  'node_modules/esbuild/bin/esbuild',
  'src/lib/precoLetraCaixa.ts',
  '--bundle', '--format=esm', '--platform=node',
  `--outfile=${join(dir, 'preco.mjs')}`,
], { stdio: 'pipe' });
const P = await import('file://' + join(dir, 'preco.mjs'));

const cfg = {
  pvcEspessuras: [
    { id: 'pvc10', label: 'PVC 10mm', price: 0 },
    { id: 'pvc20', label: 'PVC 20mm', price: 524 },
    { id: 'pvc30', label: 'PVC 30mm', price: 0 },
  ],
  pvcPisoProjeto: 300,
  materiais: [
    { id: 'acm', label: 'ACM', faixas: [
        { id: 'a', ateCm: 20, precoCm: 12 },
        { id: 'b', ateCm: 50, precoCm: 9 },
        { id: 'c', ateCm: 100, precoCm: 7 },
      ], faixasFrontal: [{ id: 'f', ateCm: 100, precoCm: 15 }] },
    { id: 'inox', label: 'Inox', faixas: [] },
  ],
  retroPercentual: 45,
};

let ruim = 0;
const confere = (nome, obtido, esperado) => {
  const ok = esperado === null
    ? obtido === null
    : obtido !== null && Math.abs(obtido - esperado) < 0.005;
  if (!ok) ruim++;
  const mostra = (v) => (v === null ? 'sem preco' : v.toFixed(2));
  console.log(`  ${nome.padEnd(54)} ${mostra(obtido).padStart(10)}  esperado ${mostra(esperado).padStart(10)}  ${ok ? 'OK' : 'ERRO'}`);
};

console.log('PVC (R$/m2 com piso de projeto)');
confere('20mm, 2 m2, sem luz -> 524 x 2', P.precoPvc(cfg, 'pvc20', 2, 'sem')?.total ?? null, 1048);
confere('20mm, 0,2 m2 -> cai no piso de 300', P.precoPvc(cfg, 'pvc20', 0.2, 'sem')?.total ?? null, 300);
confere('20mm, 2 m2, retro +45%', P.precoPvc(cfg, 'pvc20', 2, 'retro')?.total ?? null, 1048 * 1.45);
confere('piso incide DEPOIS da luz (0,2 m2 retro)', P.precoPvc(cfg, 'pvc20', 0.2, 'retro')?.total ?? null, 300);
confere('10mm sem preco definido -> sem preco', P.precoPvc(cfg, 'pvc10', 2, 'sem')?.total ?? null, null);

console.log('\nfaixas de altura (R$/cm x altura x letras)');
confere('ACM 15cm (faixa ate 20) 5 letras: 12 x 15 x 5', P.precoPorAltura(cfg, 'acm', 15, 5, 'sem')?.total ?? null, 900);
confere('ACM 20cm cabe na faixa ate 20 (inclusive)', P.precoPorAltura(cfg, 'acm', 20, 1, 'sem')?.total ?? null, 240);
confere('ACM 21cm cai na faixa ate 50: 9 x 21', P.precoPorAltura(cfg, 'acm', 21, 1, 'sem')?.total ?? null, 189);
confere('ACM 250cm usa a ULTIMA faixa, nao fica sem preco', P.precoPorAltura(cfg, 'acm', 250, 1, 'sem')?.total ?? null, 1750);
confere('ACM 15cm retro: 900 + 45%', P.precoPorAltura(cfg, 'acm', 15, 5, 'retro')?.total ?? null, 1305);
confere('ACM 15cm frontal usa a tabela PROPRIA, sem +45%', P.precoPorAltura(cfg, 'acm', 15, 5, 'frontal')?.total ?? null, 1125);
confere('Inox sem faixas -> sem preco', P.precoPorAltura(cfg, 'inox', 15, 5, 'sem')?.total ?? null, null);
confere('Inox frontal sem tabela -> sem preco (nao usa a padrao)', P.precoPorAltura(cfg, 'inox', 15, 5, 'frontal')?.total ?? null, null);

console.log('\nquando cair no motor');
const diz = (nome, obtido, esperado) => { const ok = obtido === esperado; if (!ok) ruim++; console.log(`  ${nome.padEnd(54)} ${String(obtido).padStart(10)}  esperado ${String(esperado).padStart(10)}  ${ok ? 'OK' : 'ERRO'}`); };
diz('ACM tem preco manual', P.temPrecoManual(cfg.materiais[0]), true);
diz('Inox nao tem -> cai no motor', P.temPrecoManual(cfg.materiais[1]), false);
diz('PVC 20mm tem preco', P.temPrecoPvc(cfg.pvcEspessuras[1]), true);
diz('PVC 10mm nao tem -> cai no motor', P.temPrecoPvc(cfg.pvcEspessuras[0]), false);

console.log(ruim === 0 ? '\n== CONTA DA LETRA CAIXA OK ==' : `\n== ${ruim} PROBLEMAS NA CONTA DA LETRA CAIXA ==`);
process.exit(ruim === 0 ? 0 : 1);
