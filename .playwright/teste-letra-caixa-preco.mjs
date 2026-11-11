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
  // pintura automotiva: os numeros do Etto (lata de 1/4 a R$80 / R$200)
  pinturaSimplesLata: 80,
  pinturaEspecialLata: 200,
  pinturaVolumeLataL: 0.9,
  pinturaRendimentoM2L: 9,
  pinturaDemaos: 2,
  pinturaMultiplicador: 2.5,
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

console.log('\npintura automotiva (PU) - R$/m2 derivado da lata');
// R$/litro = 80 / 0,9 = 88,888...  |  L/m2 = 2 demaos / 9 (m2/L) = 0,2222...
// R$/m2 = 88,888 x 0,2222 x 2,5 = 49,3827
confere('cor padrao: (80/0,9) x (2/9) x 2,5', P.precoM2Pintura(cfg, 'simples'), 49.3827);
confere('cor especial: (200/0,9) x (2/9) x 2,5', P.precoM2Pintura(cfg, 'especial'), 123.4568);
confere("'sem' nao tem preco de pintura", P.precoM2Pintura(cfg, 'sem'), null);
confere('2 m2 de cor padrao', P.custoPintura(cfg, 'simples', 2)?.total ?? null, 98.7654);
confere('2 m2 de cor especial', P.custoPintura(cfg, 'especial', 2)?.total ?? null, 246.9136);
confere('area 0 nao vira pintura', P.custoPintura(cfg, 'simples', 0)?.total ?? null, null);
// litros: 2 m2 x (2 demaos / 9) = 0,4444 L -> 0,4938 lata de 0,9 L
confere('litros de 2 m2 em 2 demaos a 9 m2/L', P.custoPintura(cfg, 'simples', 2)?.litros ?? null, 0.4444);
confere('latas de 1/4 que isso consome', P.custoPintura(cfg, 'simples', 2)?.latas ?? null, 0.4938);
confere('custo so da tinta (sem o multiplicador)', P.custoPintura(cfg, 'simples', 2)?.custoTinta ?? null, 39.5062);
// a cada numero zerado a pintura TEM que recusar - zero nao vira tinta de graca
for (const campo of ['pinturaSimplesLata', 'pinturaVolumeLataL', 'pinturaRendimentoM2L', 'pinturaDemaos', 'pinturaMultiplicador']) {
  const zerado = { ...cfg, [campo]: 0 };
  confere(`${campo} zerado -> sem preco`, P.custoPintura(zerado, 'simples', 2)?.total ?? null, null);
}
// o especial zerado nao pode cair no preco do simples
confere('especial zerado nao usa a tabela do simples', P.precoM2Pintura({ ...cfg, pinturaEspecialLata: 0 }, 'especial'), null);
// dobrar as demaos dobra a tinta; rendimento melhor baixa na mesma proporcao
confere('4 demaos = o dobro de tinta', P.precoM2Pintura({ ...cfg, pinturaDemaos: 4 }, 'simples'), 98.7654);
confere('rendimento 18 m2/L = metade do preco', P.precoM2Pintura({ ...cfg, pinturaRendimentoM2L: 18 }, 'simples'), 24.6914);

console.log(ruim === 0 ? '\n== CONTA DA LETRA CAIXA OK ==' : `\n== ${ruim} PROBLEMAS NA CONTA DA LETRA CAIXA ==`);
process.exit(ruim === 0 ? 0 : 1);
