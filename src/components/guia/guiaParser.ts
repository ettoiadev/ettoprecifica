import { ChapaSpec } from './ChapaDiagrama';

// Interpreta o texto de uma aba do guia em blocos para exibição. O conteúdo
// continua sendo TEXTO SIMPLES — nada aqui é HTML, e o texto do usuário nunca
// é interpretado como marcação (ver docs/GUIA.md). O que este parser faz é
// reconhecer três convenções que as pessoas já usam naturalmente ao escrever
// documento em texto puro:
//
//   1. Título de seção .. linha começando com "## " OU linha quase toda em
//                         MAIÚSCULAS e curta (ex.: "PLACA EM ACM").
//   2. Tabela ........... duas ou mais linhas seguidas com colunas separadas
//                         por 2+ espaços. Vira bloco monoespaçado, que é a
//                         única forma de o alinhamento por espaço funcionar.
//   3. Desenho de chapa . linha "#chapa: 200x100 peça 60x40 — rótulo".

export type Bloco =
  | { tipo: 'titulo'; texto: string; id: string }
  | { tipo: 'tabela'; texto: string }
  | { tipo: 'texto'; texto: string }
  | { tipo: 'chapa'; spec: ChapaSpec };

const RE_CHAPA =
  /^#chapa:\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(?:pe(?:ç|c)a\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?))?\s*(?:[—–-]\s*(.*))?$/i;

/** Linha com colunas alinhadas por espaço: "algo␣␣algo" (espaço interno, não indentação). */
const RE_COLUNAS = /\S {2,}\S/;

const num = (s?: string): number | undefined =>
  s === undefined ? undefined : Number(s.replace(',', '.'));

/**
 * Título "por maiúsculas": linha curta cujas letras são majoritariamente
 * maiúsculas. Pega "PLACA PS 2mm — APROVEITAMENTO DA CHAPA" (tem "mm"
 * minúsculo) sem pegar frase normal que começa com sigla.
 */
const pareceTitulo = (linha: string): boolean => {
  const t = linha.trim();
  if (t.length < 3 || t.length > 70) return false;
  if (/[.;,]$/.test(t)) return false;
  const letras = t.replace(/[^\p{L}]/gu, '');
  if (letras.length < 3) return false;
  const maiusculas = letras.replace(/[^\p{Lu}]/gu, '').length;
  return maiusculas / letras.length >= 0.8;
};

const idDoTitulo = (texto: string, i: number): string =>
  `guia-sec-${i}-${texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 32)}`;

export const parseGuia = (conteudo: string): Bloco[] => {
  const linhas = conteudo.split('\n');
  const blocos: Bloco[] = [];
  let buffer: string[] = [];
  let bufferTabela = false;

  const descarregar = () => {
    if (!buffer.length) return;
    const texto = buffer.join('\n').replace(/^\n+|\n+$/g, '');
    if (texto.trim()) blocos.push({ tipo: bufferTabela ? 'tabela' : 'texto', texto });
    buffer = [];
    bufferTabela = false;
  };

  for (let i = 0; i < linhas.length; i++) {
    const linha = linhas[i];
    const bruta = linha.trim();

    // 1) desenho de chapa
    const mChapa = bruta.match(RE_CHAPA);
    if (mChapa) {
      descarregar();
      blocos.push({
        tipo: 'chapa',
        spec: {
          larguraCm: num(mChapa[1])!,
          alturaCm: num(mChapa[2])!,
          pecaLarguraCm: num(mChapa[3]),
          pecaAlturaCm: num(mChapa[4]),
          legenda: mChapa[5]?.trim() || undefined,
        },
      });
      continue;
    }

    // 2) título explícito (## ) ou por maiúsculas
    const explicito = bruta.match(/^#{2,3}\s+(.*)$/);
    if (explicito || pareceTitulo(bruta)) {
      descarregar();
      const texto = (explicito ? explicito[1] : bruta).trim();
      blocos.push({ tipo: 'titulo', texto, id: idDoTitulo(texto, i) });
      continue;
    }

    // 3) tabela: a linha tem colunas E a vizinha (acima ou abaixo) também
    const ehColuna = RE_COLUNAS.test(linha);
    const vizinhaColuna =
      (i > 0 && RE_COLUNAS.test(linhas[i - 1])) ||
      (i + 1 < linhas.length && RE_COLUNAS.test(linhas[i + 1]));
    const viraTabela = ehColuna && vizinhaColuna;

    if (viraTabela !== bufferTabela) {
      descarregar();
      bufferTabela = viraTabela;
    }
    buffer.push(linha);
  }

  descarregar();
  return blocos;
};

/** Títulos de uma aba, para montar o índice lateral. */
export const titulosDoGuia = (conteudo: string) =>
  parseGuia(conteudo).filter((b): b is Extract<Bloco, { tipo: 'titulo' }> => b.tipo === 'titulo');
