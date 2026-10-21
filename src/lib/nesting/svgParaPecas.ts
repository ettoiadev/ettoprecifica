/*
 * Lê um SVG e devolve os contornos das peças em MILÍMETROS, prontos para o
 * worker de nesting (`public/nesting/nest-worker.js`).
 *
 * Por que usar o próprio navegador em vez de um parser de path:
 * `getTotalLength`/`getPointAtLength` existem em todo SVGGeometryElement e já
 * resolvem curva de Bézier, arco elíptico, `transform` aninhado e unidade —
 * que é justamente o que um arquivo saído do Corel tem de sobra. Escrever um
 * parser próprio seria reimplementar (pior) o que o Chrome já faz.
 *
 * Exige DOM: o elemento precisa estar RENDERIZADO para `getCTM()` responder.
 * Por isso o SVG é colado num host fora da tela — e não com `display:none`,
 * que desliga o layout e faz getCTM devolver null.
 */

export interface Ponto {
  x: number;
  y: number;
}

export interface PecaSvg {
  id: number;
  nome: string;
  /** contorno externo, em mm, com o canto da bounding box na origem */
  contorno: Ponto[];
  /** contornos internos (o buraco do "A", do "O"): só para desenhar */
  furos: Ponto[][];
  /** área do contorno externo, em mm² */
  area: number;
  largura: number;
  altura: number;
}

export interface LeituraSvg {
  pecas: PecaSvg[];
  /** bounding box do conjunto inteiro, em mm */
  largura: number;
  altura: number;
  mmPorUnidade: number;
  unidade: string;
  avisos: string[];
}

const NS = 'http://www.w3.org/2000/svg';

/** Fator de conversão para mm de cada unidade do SVG. */
const EM_MM: Record<string, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  pt: 25.4 / 72,
  pc: 25.4 / 6,
  q: 25.4 / 40,
  px: 25.4 / 96,
  '': 25.4 / 96, // sem unidade = px (CSS: 96 dpi)
};

const SELETOR_GEOMETRIA = 'path, rect, circle, ellipse, polygon, polyline, line';
const SELETOR_IGNORAR = 'defs, clipPath, mask, marker, symbol, pattern';

/** Área com sinal (positiva = horário no sistema do SVG, com Y para baixo). */
function areaPoligono(pts: Ponto[]): number {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += (pts[j].x + pts[i].x) * (pts[j].y - pts[i].y);
  }
  return a / 2;
}

function pontoEmPoligono(p: Ponto, poly: Ponto[]): boolean {
  let dentro = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    if (yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) {
      dentro = !dentro;
    }
  }
  return dentro;
}

function distanciaAoSegmento(p: Ponto, a: Ponto, b: Ponto): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const den = dx * dx + dy * dy;
  if (den === 0) return Math.hypot(p.x - a.x, p.y - a.y);
  let t = ((p.x - a.x) * dx + (p.y - a.y) * dy) / den;
  t = Math.max(0, Math.min(1, t));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

/**
 * Douglas-Peucker. A amostragem por comprimento gera muitos pontos quase
 * colineares nas retas da letra; cada ponto a mais custa caro no no-fit-polygon
 * (Minkowski é O(n×m)), então vale tirar os que não mudam o contorno.
 */
function simplificar(pts: Ponto[], tol: number): Ponto[] {
  if (pts.length < 3) return pts;
  let maior = 0;
  let indice = 0;
  const fim = pts.length - 1;
  for (let i = 1; i < fim; i++) {
    const d = distanciaAoSegmento(pts[i], pts[0], pts[fim]);
    if (d > maior) {
      maior = d;
      indice = i;
    }
  }
  if (maior <= tol) return [pts[0], pts[fim]];
  return [
    ...simplificar(pts.slice(0, indice + 1), tol).slice(0, -1),
    ...simplificar(pts.slice(indice), tol),
  ];
}

interface Comprimento {
  mm: number;
  unidade: string;
}

function lerComprimento(v: string | null): Comprimento | null {
  if (!v) return null;
  const m = /^\s*(-?[\d.]+)\s*([a-z%]*)\s*$/i.exec(v);
  if (!m) return null;
  const unidade = m[2].toLowerCase();
  if (unidade === '%') return null; // relativo ao pai: não dá para virar mm
  const fator = EM_MM[unidade];
  if (fator === undefined) return null;
  return { mm: parseFloat(m[1]) * fator, unidade: unidade || 'px' };
}

/** Separa o `d` em subpaths. `M`/`m` nunca aparecem dentro de um número. */
function separarSubpaths(d: string): string[] {
  return d.match(/[Mm][^Mm]*/g) ?? [];
}

type Matriz = { a: number; b: number; c: number; d: number; e: number; f: number };

function aplicar(m: Matriz | null, p: Ponto, escala: number): Ponto {
  if (!m) return { x: p.x * escala, y: p.y * escala };
  return {
    x: (m.a * p.x + m.c * p.y + m.e) * escala,
    y: (m.b * p.x + m.d * p.y + m.f) * escala,
  };
}

/** Amostra o trecho [l0, l1] de um elemento, já convertido para mm. */
function amostrar(
  el: SVGGeometryElement,
  l0: number,
  l1: number,
  m: Matriz | null,
  escala: number,
  maxPontos: number
): Ponto[] {
  const comprimento = l1 - l0;
  if (!(comprimento > 0)) return [];
  // alvo de ~1mm de corda, limitado para não estourar o custo do NFP
  const passoMm = 1;
  const n = Math.max(12, Math.min(maxPontos, Math.ceil((comprimento * escala) / passoMm)));
  const pts: Ponto[] = [];
  for (let i = 0; i < n; i++) {
    // meio do passo, nunca a fronteira: em l0 exato o navegador devolve o FIM
    // do subpath anterior, não o início deste. Num "O", isso trazia um ponto do
    // contorno externo para dentro do vazado e deformava a peça.
    const p = el.getPointAtLength(l0 + (comprimento * (i + 0.5)) / n);
    pts.push(aplicar(m, p, escala));
  }
  return pts;
}

interface Contorno {
  pts: Ponto[];
  area: number;
  nome: string;
}

// Orçamento de material, não CAM: o contorno só precisa ser fiel o bastante
// para a ÁREA. Cada vértice a mais custa quadrático no no-fit-polygon
// (Minkowski é O(n×m)), e medimos que o NFP é ~98% do tempo do encaixe. Com
// 0,8mm de tolerância o erro de área fica abaixo de 1% numa letra de 40cm.
const MAX_PONTOS_PADRAO = 48;
const TOLERANCIA_MM = 0.8;

export function lerSvg(texto: string, maxPontosPorPeca = MAX_PONTOS_PADRAO): LeituraSvg {
  if (typeof document === 'undefined') {
    throw new Error('A leitura de SVG precisa rodar no navegador.');
  }

  const doc = new DOMParser().parseFromString(texto, 'image/svg+xml');
  if (doc.querySelector('parsererror')) {
    throw new Error('Arquivo SVG inválido ou corrompido.');
  }
  const raiz = doc.documentElement;
  if (!raiz || raiz.localName !== 'svg') {
    throw new Error('O arquivo não é um SVG.');
  }

  const avisos: string[] = [];

  // ---- escala: quantos mm vale 1 unidade de usuário do viewBox ----
  const vbAttr = raiz.getAttribute('viewBox');
  const vb = vbAttr ? vbAttr.trim().split(/[\s,]+/).map(Number) : null;
  const vbValido = !!vb && vb.length === 4 && vb.every((n) => Number.isFinite(n)) && vb[2] > 0;

  const larguraDeclarada = lerComprimento(raiz.getAttribute('width'));
  let mmPorUnidade: number;
  let unidade: string;

  if (vbValido && larguraDeclarada) {
    mmPorUnidade = larguraDeclarada.mm / vb![2];
    unidade = larguraDeclarada.unidade;
  } else {
    mmPorUnidade = EM_MM.px;
    unidade = 'px';
  }
  if (unidade === 'px') {
    avisos.push(
      'O arquivo não declara medida física; assumi px a 96 dpi. Confira a altura real do conjunto abaixo.'
    );
  }

  // ---- host fora da tela: getCTM() só responde com o elemento renderizado ----
  const host = document.createElement('div');
  host.setAttribute(
    'style',
    'position:fixed;left:-10000px;top:-10000px;width:1px;height:1px;overflow:hidden;opacity:0;pointer-events:none'
  );
  const svg = raiz.cloneNode(true) as SVGSVGElement;
  // 1 unidade de usuário = 1 px no viewport → getCTM() devolve coordenadas do viewBox
  if (vbValido) {
    svg.setAttribute('width', String(vb![2]));
    svg.setAttribute('height', String(vb![3]));
  }
  svg.removeAttribute('style');
  host.appendChild(svg);
  document.body.appendChild(host);

  const contornos: Contorno[] = [];

  try {
    if (svg.querySelector('use')) {
      avisos.push('O arquivo usa elementos <use> (cópias de símbolo), que não são lidos.');
    }
    if (svg.querySelector('text')) {
      avisos.push('Há texto não convertido em curvas — ele não entra no encaixe.');
    }

    const temp = document.createElementNS(NS, 'path');
    svg.appendChild(temp);

    const elementos = Array.from(svg.querySelectorAll(SELETOR_GEOMETRIA)) as SVGGeometryElement[];

    for (const el of elementos) {
      if (el.closest(SELETOR_IGNORAR)) continue;
      if (el === (temp as unknown as SVGGeometryElement)) continue;

      const estilo = getComputedStyle(el);
      if (estilo.display === 'none' || estilo.visibility === 'hidden') continue;

      const m = el.getCTM();
      const nome = el.getAttribute('id') || el.localName;

      if (el.localName === 'path') {
        const d = el.getAttribute('d');
        if (!d) continue;
        const subs = separarSubpaths(d);
        if (subs.length === 0) continue;

        // Comprimento acumulado de cada subpath. É preciso medir por PREFIXO
        // (não isolando o subpath) porque um `m` relativo depende de onde o
        // subpath anterior terminou — isolado, ele iria parar noutro lugar.
        const acumulado: number[] = [0];
        for (let i = 0; i < subs.length; i++) {
          temp.setAttribute('d', subs.slice(0, i + 1).join(''));
          acumulado.push(temp.getTotalLength());
        }
        temp.setAttribute('d', d);

        for (let i = 0; i < subs.length; i++) {
          const pts = amostrar(
            temp,
            acumulado[i],
            acumulado[i + 1],
            m,
            mmPorUnidade,
            maxPontosPorPeca
          );
          if (pts.length >= 3) contornos.push({ pts, area: areaPoligono(pts), nome });
        }
      } else {
        const total = el.getTotalLength();
        const pts = amostrar(el, 0, total, m, mmPorUnidade, maxPontosPorPeca);
        if (pts.length >= 3) contornos.push({ pts, area: areaPoligono(pts), nome });
      }
    }
  } finally {
    document.body.removeChild(host);
  }

  // ---- separa contorno externo de furo ----
  // Maior primeiro: um contorno cujo primeiro ponto cai dentro de um já aceito
  // é furo dele (o vazado do "A"); senão é peça nova. Isso cobre tanto "cada
  // letra num path" quanto "a palavra inteira num path só".
  const limpos = contornos
    .map((c) => ({ ...c, pts: simplificar(c.pts, TOLERANCIA_MM) }))
    .filter((c) => Math.abs(c.area) >= 4 && c.pts.length >= 3)
    .sort((a, b) => Math.abs(b.area) - Math.abs(a.area));

  // Vários pontos, por maioria: um ponto só decide errado quando cai em cima da
  // borda do contorno externo (letra cujo vazado encosta na haste).
  const estaDentro = (c: Contorno, externo: Ponto[]) => {
    const amostras = [0, Math.floor(c.pts.length / 3), Math.floor((2 * c.pts.length) / 3)];
    const dentro = amostras.filter((i) => pontoEmPoligono(c.pts[i], externo)).length;
    return dentro >= 2;
  };

  const pecas: PecaSvg[] = [];
  for (const c of limpos) {
    const dono = pecas.find((p) => estaDentro(c, p.contorno));
    if (dono) {
      dono.furos.push(c.pts);
      continue;
    }
    pecas.push({
      id: pecas.length,
      nome: c.nome,
      contorno: c.pts,
      furos: [],
      area: Math.abs(c.area),
      largura: 0,
      altura: 0,
    });
  }

  if (pecas.length === 0) {
    throw new Error('Nenhum contorno fechado encontrado no arquivo.');
  }

  // ---- bounding box do conjunto, antes de mover cada peça para a origem ----
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pecas) {
    for (const pt of p.contorno) {
      if (pt.x < minX) minX = pt.x;
      if (pt.x > maxX) maxX = pt.x;
      if (pt.y < minY) minY = pt.y;
      if (pt.y > maxY) maxY = pt.y;
    }
  }

  // Cada peça encostada na própria origem: o encaixe não depende de onde ela
  // estava no arquivo, e coordenadas menores são melhores para o Clipper.
  for (const p of pecas) {
    let pMinX = Infinity;
    let pMinY = Infinity;
    let pMaxX = -Infinity;
    let pMaxY = -Infinity;
    for (const pt of p.contorno) {
      if (pt.x < pMinX) pMinX = pt.x;
      if (pt.x > pMaxX) pMaxX = pt.x;
      if (pt.y < pMinY) pMinY = pt.y;
      if (pt.y > pMaxY) pMaxY = pt.y;
    }
    p.largura = pMaxX - pMinX;
    p.altura = pMaxY - pMinY;
    p.contorno = p.contorno.map((pt) => ({ x: pt.x - pMinX, y: pt.y - pMinY }));
    p.furos = p.furos.map((f) => f.map((pt) => ({ x: pt.x - pMinX, y: pt.y - pMinY })));
  }

  return {
    pecas,
    largura: maxX - minX,
    altura: maxY - minY,
    mmPorUnidade,
    unidade,
    avisos,
  };
}

/** Reescala as peças (o usuário informa a altura real do conjunto). */
export function escalarPecas(pecas: PecaSvg[], fator: number): PecaSvg[] {
  if (fator === 1) return pecas;
  return pecas.map((p) => ({
    ...p,
    contorno: p.contorno.map((pt) => ({ x: pt.x * fator, y: pt.y * fator })),
    furos: p.furos.map((f) => f.map((pt) => ({ x: pt.x * fator, y: pt.y * fator }))),
    area: p.area * fator * fator,
    largura: p.largura * fator,
    altura: p.altura * fator,
  }));
}
