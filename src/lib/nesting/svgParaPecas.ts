/*
 * Lê um SVG e devolve os contornos das peças em MILÍMETROS.
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
import {
  montarLeitura,
  MAX_PONTOS_PADRAO,
  type Contorno,
  type LeituraVetorial,
  type Ponto,
} from './geometria';

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

export function lerSvg(texto: string, maxPontosPorPeca = MAX_PONTOS_PADRAO): LeituraVetorial {
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

  if (vbValido && larguraDeclarada) {
    mmPorUnidade = larguraDeclarada.mm / vb![2];
    if (larguraDeclarada.unidade === 'px') {
      avisos.push(
        'O arquivo não declara medida física; assumi px a 96 dpi. Confira a altura real do conjunto.'
      );
    }
  } else {
    mmPorUnidade = EM_MM.px;
    avisos.push(
      'O arquivo não declara medida física; assumi px a 96 dpi. Confira a altura real do conjunto.'
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
          if (pts.length >= 3) contornos.push({ pts, nome });
        }
      } else {
        const total = el.getTotalLength();
        const pts = amostrar(el, 0, total, m, mmPorUnidade, maxPontosPorPeca);
        if (pts.length >= 3) contornos.push({ pts, nome });
      }
    }
  } finally {
    document.body.removeChild(host);
  }

  return montarLeitura(contornos, avisos);
}
