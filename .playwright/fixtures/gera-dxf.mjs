// Gera o DXF de prova. E feito a mao de proposito, para forcar os casos
// dificeis do parser proprio (dxfParaPecas.ts), cada um com AREA CONHECIDA
// para o teste poder conferir numero, nao aparencia.
import { writeFileSync } from 'node:fs';

const par = (codigo, valor) => `${codigo}\n${valor}\n`;
let d = '';

// --- HEADER: unidade em milimetro ($INSUNITS = 4) -------------------------
d += par(0, 'SECTION') + par(2, 'HEADER') + par(9, '$INSUNITS') + par(70, 4) + par(0, 'ENDSEC');

// --- BLOCKS: um quadrado de 20x20 para ser inserido por INSERT ------------
d += par(0, 'SECTION') + par(2, 'BLOCKS');
d += par(0, 'BLOCK') + par(8, '0') + par(2, 'QUADRADINHO') + par(70, 0);
d += par(10, '0.0') + par(20, '0.0') + par(30, '0.0') + par(3, 'QUADRADINHO') + par(1, '');
d += par(0, 'LWPOLYLINE') + par(8, '0') + par(90, 4) + par(70, 1);
for (const [x, y] of [[0, 0], [20, 0], [20, 20], [0, 20]]) d += par(10, x) + par(20, y);
d += par(0, 'ENDBLK') + par(0, 'ENDSEC');

d += par(0, 'SECTION') + par(2, 'ENTITIES');

// 1) quadrado 100x100 -> area exata 10000 mm2
d += par(0, 'LWPOLYLINE') + par(8, '0') + par(90, 4) + par(70, 1);
for (const [x, y] of [[0, 0], [100, 0], [100, 100], [0, 100]]) d += par(10, x) + par(20, y);

// 2) triangulo em 3 LINE SOLTAS -> so vira peca se o parser costurar as pontas.
//    base 100, altura 90 -> area exata 4500 mm2
const tri = [[200, 0], [300, 0], [250, 90]];
for (let i = 0; i < 3; i++) {
  const a = tri[i], b = tri[(i + 1) % 3];
  d += par(0, 'LINE') + par(8, '0') + par(10, a[0]) + par(20, a[1]) + par(11, b[0]) + par(21, b[1]);
}

// 3) arruela: circulo externo r=40 com furo r=20, concentricos.
//    testa deteccao de vazado. area liquida = pi*(1600-400) = 3769,91 mm2
d += par(0, 'CIRCLE') + par(8, '0') + par(10, 400) + par(20, 50) + par(40, 40);
d += par(0, 'CIRCLE') + par(8, '0') + par(10, 400) + par(20, 50) + par(40, 20);

// 4) LWPOLYLINE com BULGE: quadrado de 60 com um canto virando arco de 90 graus.
//    bulge = tan(90/4) = 0,41421356. area = 3600 - (900 - pi*900/4) = 3406,86 mm2
d += par(0, 'LWPOLYLINE') + par(8, '0') + par(90, 4) + par(70, 1);
d += par(10, 500) + par(20, 0) + par(42, 0);
d += par(10, 560) + par(20, 0) + par(42, 0);
d += par(10, 560) + par(20, 30) + par(42, 0.41421356);
d += par(10, 530) + par(20, 60) + par(42, 0);
// (fecha de volta em 500,0)

// 5) INSERT do bloco, deslocado -> quadrado 20x20 = 400 mm2 em (700,0)
d += par(0, 'INSERT') + par(8, '0') + par(2, 'QUADRADINHO') + par(10, 700) + par(20, 0) + par(30, 0);

d += par(0, 'ENDSEC') + par(0, 'EOF');
writeFileSync(process.argv[2] || new URL('pecas.dxf', import.meta.url), d, 'latin1');
console.log('gravado:', process.argv[2] || 'pecas.dxf');
