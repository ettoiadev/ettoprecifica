/*
 * Lê um DXF (ASCII) e devolve os contornos das peças em MILÍMETROS.
 *
 * Ao contrário do SVG, aqui não dá para delegar ao navegador: é formato de CAD
 * e precisa de parser próprio. O que é lido: LWPOLYLINE e POLYLINE (inclusive
 * com bulge, o arco embutido na polilinha), LINE, ARC, CIRCLE, ELLIPSE, SPLINE
 * e INSERT (blocos).
 *
 * Duas diferenças de convenção em relação ao SVG:
 *  - o Y do DXF cresce para CIMA, então é invertido na leitura, senão o
 *    desenho aparece de cabeça para baixo na pré-visualização;
 *  - letra de CNC costuma vir como vários segmentos soltos (LINE + ARC) em vez
 *    de um contorno fechado, então os trechos abertos são COSTURADOS pelas
 *    pontas antes de virarem peça.
 */
import {
  montarLeitura,
  MAX_PONTOS_PADRAO,
  type Contorno,
  type LeituraVetorial,
  type Ponto,
} from './geometria';

type Par = [number, string];

interface Entidade {
  tipo: string;
  pares: Par[];
  filhos?: Entidade[];
}

/** $INSUNITS do cabeçalho → mm. Só os valores que aparecem na prática. */
const UNIDADES: Record<number, number> = {
  1: 25.4, // polegada
  2: 304.8, // pé
  4: 1, // milímetro
  5: 10, // centímetro
  6: 1000, // metro
};

/** Folga para considerar que duas pontas de segmento são o mesmo ponto (mm). */
const TOL_COSTURA = 0.1;

function parsearPares(texto: string): Par[] {
  const linhas = texto.split(/\r\n|\r|\n/);
  const pares: Par[] = [];
  for (let i = 0; i + 1 < linhas.length; i += 2) {
    const codigo = parseInt(linhas[i].trim(), 10);
    if (Number.isNaN(codigo)) continue;
    pares.push([codigo, linhas[i + 1].trim()]);
  }
  return pares;
}

function valor(e: Entidade, codigo: number): string | undefined {
  const p = e.pares.find(([c]) => c === codigo);
  return p?.[1];
}

function numero(e: Entidade, codigo: number, padrao = 0): number {
  const v = valor(e, codigo);
  const n = v === undefined ? NaN : parseFloat(v);
  return Number.isFinite(n) ? n : padrao;
}

function numeros(e: Entidade, codigo: number): number[] {
  return e.pares
    .filter(([c]) => c === codigo)
    .map(([, v]) => parseFloat(v))
    .filter((n) => Number.isFinite(n));
}

/**
 * Quebra um intervalo de pares em entidades. `POLYLINE` é o caso torto do
 * formato: seus vértices vêm como entidades VERTEX irmãs, encerradas por
 * SEQEND, em vez de ficarem dentro dela.
 */
function separarEntidades(pares: Par[]): Entidade[] {
  const entidades: Entidade[] = [];
  let atual: Entidade | null = null;
  let aberta: Entidade | null = null; // POLYLINE esperando seus VERTEX

  const fechar = () => {
    if (!atual) return;
    if (atual.tipo === 'VERTEX' && aberta) {
      aberta.filhos!.push(atual);
    } else if (atual.tipo === 'SEQEND') {
      aberta = null;
    } else {
      entidades.push(atual);
      aberta = atual.tipo === 'POLYLINE' ? atual : null;
    }
    atual = null;
  };

  for (const [codigo, v] of pares) {
    if (codigo === 0) {
      fechar();
      atual = { tipo: v.toUpperCase(), pares: [], filhos: [] };
      continue;
    }
    if (atual) atual.pares.push([codigo, v]);
  }
  fechar();
  return entidades;
}

function secao(pares: Par[], nome: string): Par[] {
  const dentro: Par[] = [];
  let ativa = false;
  for (let i = 0; i < pares.length; i++) {
    const [c, v] = pares[i];
    if (c === 0 && v.toUpperCase() === 'SECTION') {
      ativa = pares[i + 1]?.[0] === 2 && pares[i + 1][1].toUpperCase() === nome;
      continue;
    }
    if (c === 0 && v.toUpperCase() === 'ENDSEC') {
      ativa = false;
      continue;
    }
    if (ativa) dentro.push([c, v]);
  }
  return dentro;
}

// ---------------------------------------------------------------- geometria

function arco(cx: number, cy: number, r: number, a0: number, a1: number, passos: number): Ponto[] {
  const pts: Ponto[] = [];
  for (let i = 0; i <= passos; i++) {
    const a = a0 + ((a1 - a0) * i) / passos;
    pts.push({ x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
  return pts;
}

/** Quantos passos para um arco de raio r e ângulo total `ang` ficar liso. */
function passosDoArco(r: number, ang: number): number {
  return Math.max(4, Math.min(64, Math.ceil((Math.abs(ang) * Math.max(r, 1)) / 2)));
}

/**
 * Bulge: a tangente de 1/4 do ângulo do arco entre dois vértices da polilinha.
 * É assim que o DXF guarda curva dentro de uma polilinha.
 */
function arcoDeBulge(a: Ponto, b: Ponto, bulge: number): Ponto[] {
  const ang = 4 * Math.atan(bulge);
  const corda = Math.hypot(b.x - a.x, b.y - a.y);
  if (corda === 0 || !Number.isFinite(ang) || ang === 0) return [];
  const r = corda / (2 * Math.sin(Math.abs(ang) / 2));
  // centro: no meio da corda, deslocado perpendicularmente
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const h = Math.sqrt(Math.max(r * r - (corda / 2) ** 2, 0)) * (Math.abs(ang) > Math.PI ? -1 : 1);
  const sinal = bulge > 0 ? 1 : -1;
  const ux = (b.x - a.x) / corda;
  const uy = (b.y - a.y) / corda;
  const cx = mx - uy * h * sinal;
  const cy = my + ux * h * sinal;
  const a0 = Math.atan2(a.y - cy, a.x - cx);
  const a1 = a0 + ang;
  return arco(cx, cy, r, a0, a1, passosDoArco(r, ang)).slice(1, -1);
}

/** de Boor. Avalia a B-spline em t. */
function avaliarBSpline(ctrl: Ponto[], nos: number[], grau: number, t: number): Ponto {
  let k = grau;
  while (k < ctrl.length - 1 && nos[k + 1] <= t) k++;

  const d: Ponto[] = [];
  for (let j = 0; j <= grau; j++) d.push({ ...ctrl[Math.min(Math.max(j + k - grau, 0), ctrl.length - 1)] });

  for (let r = 1; r <= grau; r++) {
    for (let j = grau; j >= r; j--) {
      const i = j + k - grau;
      const den = nos[i + grau - r + 1] - nos[i];
      const alpha = den === 0 ? 0 : (t - nos[i]) / den;
      d[j] = {
        x: (1 - alpha) * d[j - 1].x + alpha * d[j].x,
        y: (1 - alpha) * d[j - 1].y + alpha * d[j].y,
      };
    }
  }
  return d[grau];
}

function amostrarSpline(ctrl: Ponto[], nos: number[], grau: number, maxPontos: number): Ponto[] {
  if (ctrl.length <= grau) return ctrl;
  const t0 = nos[grau];
  const t1 = nos[ctrl.length];
  if (!Number.isFinite(t0) || !Number.isFinite(t1) || t1 <= t0) return ctrl;
  const n = Math.max(16, Math.min(maxPontos, ctrl.length * 6));
  const pts: Ponto[] = [];
  for (let i = 0; i <= n; i++) {
    // O último ponto precisa cair EM CIMA do fim da curva, senão a costura não
    // encontra a ponta e o contorno fica aberto. Recuo de 1e-9 só para não
    // pedir o nó final, que fica fora do último span.
    const t = i === n ? t1 - (t1 - t0) * 1e-9 : t0 + ((t1 - t0) * i) / n;
    pts.push(avaliarBSpline(ctrl, nos, grau, t));
  }
  return pts;
}

/** Nós uniformes presos nas pontas, para quando o arquivo não traz os nós. */
function nosUniformes(qtdCtrl: number, grau: number): number[] {
  const nos: number[] = [];
  for (let i = 0; i < qtdCtrl + grau + 1; i++) {
    nos.push(Math.min(Math.max(i - grau, 0), qtdCtrl - grau));
  }
  return nos;
}

// ------------------------------------------------------------------ costura

function mesmoPonto(a: Ponto, b: Ponto): boolean {
  return Math.hypot(a.x - b.x, a.y - b.y) <= TOL_COSTURA;
}

/**
 * Junta trechos abertos pelas pontas até fechar o contorno. Letra exportada
 * para CNC costuma vir assim: um monte de LINE e ARC soltos que só juntos
 * formam o perfil.
 */
function costurar(trechos: Ponto[][]): { fechados: Ponto[][]; abertos: number } {
  const livres = trechos.filter((t) => t.length >= 2);
  const usados = new Array(livres.length).fill(false);
  const fechados: Ponto[][] = [];
  let abertos = 0;

  for (let i = 0; i < livres.length; i++) {
    if (usados[i]) continue;
    usados[i] = true;
    const laco = livres[i].slice();

    let cresceu = true;
    while (cresceu) {
      cresceu = false;
      const fim = laco[laco.length - 1];
      if (mesmoPonto(fim, laco[0])) break;

      for (let j = 0; j < livres.length; j++) {
        if (usados[j]) continue;
        const t = livres[j];
        if (mesmoPonto(fim, t[0])) {
          laco.push(...t.slice(1));
        } else if (mesmoPonto(fim, t[t.length - 1])) {
          laco.push(...t.slice(0, -1).reverse());
        } else {
          continue;
        }
        usados[j] = true;
        cresceu = true;
        break;
      }
    }

    if (laco.length >= 3 && mesmoPonto(laco[laco.length - 1], laco[0])) {
      laco.pop();
      fechados.push(laco);
    } else {
      abertos++;
    }
  }

  return { fechados, abertos };
}

// ------------------------------------------------------------------- leitura

interface Transformacao {
  dx: number;
  dy: number;
  ex: number;
  ey: number;
  rot: number;
}

const SEM_TRANSFORMACAO: Transformacao = { dx: 0, dy: 0, ex: 1, ey: 1, rot: 0 };

function transformar(p: Ponto, t: Transformacao): Ponto {
  const x = p.x * t.ex;
  const y = p.y * t.ey;
  const cos = Math.cos(t.rot);
  const sen = Math.sin(t.rot);
  return { x: x * cos - y * sen + t.dx, y: x * sen + y * cos + t.dy };
}

interface Coleta {
  fechados: Contorno[];
  trechos: Ponto[][];
  avisos: Set<string>;
}

function coletar(
  entidades: Entidade[],
  blocos: Map<string, Entidade[]>,
  t: Transformacao,
  maxPontos: number,
  saida: Coleta,
  profundidade: number
): void {
  for (const e of entidades) {
    const nome = e.tipo.toLowerCase();
    const push = (pts: Ponto[], fechado: boolean) => {
      const mapeados = pts.map((p) => transformar(p, t));
      if (fechado) saida.fechados.push({ pts: mapeados, nome });
      else saida.trechos.push(mapeados);
    };

    switch (e.tipo) {
      case 'LWPOLYLINE':
      case 'POLYLINE': {
        const fonte =
          e.tipo === 'LWPOLYLINE'
            ? e.pares
            : (e.filhos ?? []).flatMap((f) => f.pares);
        const vertices: Ponto[] = [];
        const bulges: number[] = [];
        let atualX: number | null = null;
        let bulgeAtual = 0;
        for (const [c, v] of fonte) {
          if (c === 10) {
            if (atualX !== null) {
              vertices.push({ x: atualX, y: 0 });
              bulges.push(bulgeAtual);
            }
            atualX = parseFloat(v);
            bulgeAtual = 0;
          } else if (c === 20 && atualX !== null) {
            vertices.push({ x: atualX, y: -parseFloat(v) });
            bulges.push(bulgeAtual);
            atualX = null;
            bulgeAtual = 0;
          } else if (c === 42) {
            // bulge vem DEPOIS do vértice a que pertence
            bulgeAtual = parseFloat(v);
            if (bulges.length > 0) bulges[bulges.length - 1] = bulgeAtual;
          }
        }
        if (vertices.length < 2) break;

        const fechado = (numero(e, 70) & 1) === 1;
        const pts: Ponto[] = [];
        const ultimo = fechado ? vertices.length : vertices.length - 1;
        for (let i = 0; i < ultimo; i++) {
          const a = vertices[i];
          const b = vertices[(i + 1) % vertices.length];
          pts.push(a);
          // o Y foi invertido, então o sentido do bulge também inverte
          if (bulges[i]) pts.push(...arcoDeBulge(a, b, -bulges[i]));
        }
        if (!fechado) pts.push(vertices[vertices.length - 1]);
        push(pts, fechado);
        break;
      }

      case 'LINE':
        push(
          [
            { x: numero(e, 10), y: -numero(e, 20) },
            { x: numero(e, 11), y: -numero(e, 21) },
          ],
          false
        );
        break;

      case 'ARC': {
        const r = numero(e, 40);
        // ângulos em graus, anti-horário; com o Y invertido, troca o sinal
        const a0 = (-numero(e, 50) * Math.PI) / 180;
        const a1 = (-numero(e, 51) * Math.PI) / 180;
        const total = a1 > a0 ? a1 - a0 - 2 * Math.PI : a1 - a0;
        push(arco(numero(e, 10), -numero(e, 20), r, a0, a0 + total, passosDoArco(r, total)), false);
        break;
      }

      case 'CIRCLE': {
        const r = numero(e, 40);
        push(arco(numero(e, 10), -numero(e, 20), r, 0, 2 * Math.PI, passosDoArco(r, 2 * Math.PI)).slice(0, -1), true);
        break;
      }

      case 'ELLIPSE': {
        const cx = numero(e, 10);
        const cy = -numero(e, 20);
        const mx = numero(e, 11);
        const my = -numero(e, 21);
        const razao = numero(e, 40, 1);
        const p0 = numero(e, 41, 0);
        const p1 = numero(e, 42, 2 * Math.PI);
        const maior = Math.hypot(mx, my);
        const giro = Math.atan2(my, mx);
        const completa = Math.abs(p1 - p0 - 2 * Math.PI) < 1e-6;
        const passos = passosDoArco(maior, p1 - p0);
        const pts: Ponto[] = [];
        for (let i = 0; i <= passos; i++) {
          const ang = p0 + ((p1 - p0) * i) / passos;
          const ex = maior * Math.cos(ang);
          const ey = maior * razao * Math.sin(ang);
          pts.push({
            x: cx + ex * Math.cos(giro) - ey * Math.sin(giro),
            y: cy + ex * Math.sin(giro) + ey * Math.cos(giro),
          });
        }
        if (completa) pts.pop();
        push(pts, completa);
        break;
      }

      case 'SPLINE': {
        const xs = numeros(e, 10);
        const ys = numeros(e, 20);
        const ctrl: Ponto[] = xs.map((x, i) => ({ x, y: -(ys[i] ?? 0) }));
        if (ctrl.length < 2) break;
        const grau = Math.max(1, Math.round(numero(e, 71, 3)));
        let nos = numeros(e, 40);
        if (nos.length !== ctrl.length + grau + 1) nos = nosUniformes(ctrl.length, grau);
        if (e.pares.some(([c]) => c === 41)) {
          saida.avisos.add('O arquivo tem spline com peso (NURBS racional); li como spline simples.');
        }
        const fechado = (numero(e, 70) & 1) === 1;
        push(amostrarSpline(ctrl, nos, grau, maxPontos), fechado);
        break;
      }

      case 'INSERT': {
        if (profundidade > 4) {
          saida.avisos.add('Blocos aninhados demais; parei de abrir em 4 níveis.');
          break;
        }
        const alvo = blocos.get((valor(e, 2) ?? '').toUpperCase());
        if (!alvo) {
          saida.avisos.add(`O bloco "${valor(e, 2) ?? '?'}" não foi encontrado no arquivo.`);
          break;
        }
        const interno: Transformacao = {
          dx: numero(e, 10),
          dy: -numero(e, 20),
          ex: numero(e, 41, 1),
          ey: numero(e, 42, 1),
          rot: (-numero(e, 50) * Math.PI) / 180,
        };
        // compõe com a transformação de fora
        const base = transformar({ x: interno.dx, y: interno.dy }, t);
        coletar(
          alvo,
          blocos,
          {
            dx: base.x,
            dy: base.y,
            ex: interno.ex * t.ex,
            ey: interno.ey * t.ey,
            rot: interno.rot + t.rot,
          },
          maxPontos,
          saida,
          profundidade + 1
        );
        break;
      }

      case 'TEXT':
      case 'MTEXT':
        saida.avisos.add('Há texto não convertido em curvas — ele não entra no encaixe.');
        break;

      default:
        break;
    }
  }
}

export function lerDxf(texto: string, maxPontosPorPeca = MAX_PONTOS_PADRAO): LeituraVetorial {
  const pares = parsearPares(texto);
  if (pares.length === 0) throw new Error('Arquivo DXF vazio ou ilegível.');

  const avisos = new Set<string>();

  // ---- unidade do desenho ----
  let escala = 1;
  const cabecalho = secao(pares, 'HEADER');
  const iUnidades = cabecalho.findIndex(([c, v]) => c === 9 && v.toUpperCase() === '$INSUNITS');
  const codigo = iUnidades >= 0 ? parseInt(cabecalho[iUnidades + 1]?.[1] ?? '', 10) : NaN;
  if (Number.isFinite(codigo) && UNIDADES[codigo]) {
    escala = UNIDADES[codigo];
  } else {
    avisos.add('O arquivo não declara a unidade do desenho; assumi milímetros.');
  }

  // ---- blocos, para resolver os INSERT ----
  const blocos = new Map<string, Entidade[]>();
  const entidadesBlocos = separarEntidades(secao(pares, 'BLOCKS'));
  let nomeAtual: string | null = null;
  for (const e of entidadesBlocos) {
    if (e.tipo === 'BLOCK') {
      nomeAtual = (valor(e, 2) ?? '').toUpperCase();
      blocos.set(nomeAtual, []);
    } else if (e.tipo === 'ENDBLK') {
      nomeAtual = null;
    } else if (nomeAtual) {
      blocos.get(nomeAtual)!.push(e);
    }
  }

  const coleta: Coleta = { fechados: [], trechos: [], avisos };
  coletar(
    separarEntidades(secao(pares, 'ENTITIES')),
    blocos,
    SEM_TRANSFORMACAO,
    maxPontosPorPeca,
    coleta,
    0
  );

  if (coleta.fechados.length === 0 && coleta.trechos.length === 0) {
    throw new Error('Nenhuma geometria reconhecida no DXF.');
  }

  const { fechados, abertos } = costurar(coleta.trechos);
  if (abertos > 0) {
    avisos.add(
      `${abertos} ${abertos === 1 ? 'trecho ficou aberto' : 'trechos ficaram abertos'} e não entraram no encaixe — o contorno pode ter falha no arquivo.`
    );
  }

  const contornos: Contorno[] = [
    ...coleta.fechados,
    ...fechados.map((pts) => ({ pts, nome: 'contorno' })),
  ].map((c) => ({ ...c, pts: c.pts.map((p) => ({ x: p.x * escala, y: p.y * escala })) }));

  return montarLeitura(contornos, [...avisos]);
}
