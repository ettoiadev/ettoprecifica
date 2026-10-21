/*
 * Geometria comum aos leitores de vetor (SVG, DXF). Cada leitor só precisa
 * entregar uma lista de CONTORNOS fechados em milímetros; daqui para a frente
 * o tratamento é o mesmo: simplificar, separar peça de vazado e medir.
 */

export interface Ponto {
  x: number;
  y: number;
}

export interface PecaVetorial {
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
  /**
   * Onde a peça estava no arquivo, relativo ao canto do conjunto (mm). O
   * contorno vai para a própria origem; isto preserva o desenho original para
   * a pré-visualização.
   */
  origem: Ponto;
}

export interface LeituraVetorial {
  pecas: PecaVetorial[];
  /** bounding box do conjunto inteiro, em mm */
  largura: number;
  altura: number;
  avisos: string[];
}

export interface Contorno {
  pts: Ponto[];
  nome: string;
}

/**
 * Orçamento de material, não CAM: o contorno só precisa ser fiel o bastante
 * para a ÁREA. Cada vértice a mais custa quadrático no no-fit-polygon
 * (Minkowski é O(n×m)), e medimos que o NFP é ~98% do tempo do encaixe. Com
 * 0,8mm de tolerância o erro de área fica abaixo de 1% numa letra de 40cm.
 */
export const MAX_PONTOS_PADRAO = 48;
export const TOLERANCIA_MM = 0.8;

/** Menor contorno que ainda é peça, e não sujeira de arquivo (mm²). */
const AREA_MINIMA = 4;

/** Área com sinal (positiva = horário no sistema do SVG, com Y para baixo). */
export function areaPoligono(pts: Ponto[]): number {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += (pts[j].x + pts[i].x) * (pts[j].y - pts[i].y);
  }
  return a / 2;
}

export function pontoEmPoligono(p: Ponto, poly: Ponto[]): boolean {
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
 * colineares nas retas da letra; cada ponto a mais custa caro no no-fit-polygon.
 */
export function simplificar(pts: Ponto[], tol: number): Ponto[] {
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

function bbox(pts: Ponto[]) {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const p of pts) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }
  return { minX, minY, maxX, maxY };
}

/**
 * Monta as peças a partir dos contornos crus de qualquer formato.
 *
 * Maior primeiro: um contorno que cai dentro de um já aceito é vazado dele (o
 * miolo do "A"); senão é peça nova. Isso cobre tanto "cada letra num path"
 * quanto "a palavra inteira num path só".
 */
export function montarLeitura(contornos: Contorno[], avisos: string[]): LeituraVetorial {
  const limpos = contornos
    .map((c) => ({ ...c, pts: simplificar(c.pts, TOLERANCIA_MM) }))
    .map((c) => ({ ...c, area: areaPoligono(c.pts) }))
    .filter((c) => Math.abs(c.area) >= AREA_MINIMA && c.pts.length >= 3)
    .sort((a, b) => Math.abs(b.area) - Math.abs(a.area));

  // Vários pontos, por maioria: um ponto só decide errado quando cai em cima da
  // borda do contorno externo (letra cujo vazado encosta na haste).
  const estaDentro = (pts: Ponto[], externo: Ponto[]) => {
    const amostras = [0, Math.floor(pts.length / 3), Math.floor((2 * pts.length) / 3)];
    return amostras.filter((i) => pontoEmPoligono(pts[i], externo)).length >= 2;
  };

  const pecas: PecaVetorial[] = [];
  for (const c of limpos) {
    const dono = pecas.find((p) => estaDentro(c.pts, p.contorno));
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
      origem: { x: 0, y: 0 },
    });
  }

  if (pecas.length === 0) {
    throw new Error('Nenhum contorno fechado encontrado no arquivo.');
  }

  const total = bbox(pecas.flatMap((p) => p.contorno));

  // Cada peça encostada na própria origem: o encaixe não depende de onde ela
  // estava no arquivo, e coordenadas menores são melhores para o Clipper.
  for (const p of pecas) {
    const b = bbox(p.contorno);
    p.largura = b.maxX - b.minX;
    p.altura = b.maxY - b.minY;
    p.origem = { x: b.minX - total.minX, y: b.minY - total.minY };
    p.contorno = p.contorno.map((pt) => ({ x: pt.x - b.minX, y: pt.y - b.minY }));
    p.furos = p.furos.map((f) => f.map((pt) => ({ x: pt.x - b.minX, y: pt.y - b.minY })));
  }

  return {
    pecas,
    largura: total.maxX - total.minX,
    altura: total.maxY - total.minY,
    avisos,
  };
}

/** Reescala as peças (o usuário informa a altura real do conjunto). */
export function escalarPecas(pecas: PecaVetorial[], fator: number): PecaVetorial[] {
  if (fator === 1) return pecas;
  return pecas.map((p) => ({
    ...p,
    contorno: p.contorno.map((pt) => ({ x: pt.x * fator, y: pt.y * fator })),
    furos: p.furos.map((f) => f.map((pt) => ({ x: pt.x * fator, y: pt.y * fator }))),
    area: p.area * fator * fator,
    largura: p.largura * fator,
    altura: p.altura * fator,
    origem: { x: p.origem.x * fator, y: p.origem.y * fator },
  }));
}
