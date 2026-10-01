import React, { useMemo } from 'react';
import ChapaDiagrama, { ChapaSpec } from './ChapaDiagrama';

// Renderiza o conteúdo de uma aba do guia. É texto simples (quebras de linha
// preservadas), com UMA exceção: linhas que começam com `#chapa:` viram um
// desenho vetorial da chapa (ver ChapaDiagrama). Só números e um rótulo são
// lidos dessa linha — o texto do usuário NUNCA é interpretado como HTML.
//
//   #chapa: 200x100
//   #chapa: 200x100 peça 60x40
//   #chapa: 200x100 peça 60x40 — Placa PS 2mm
//
// Medidas em centímetros.
const RE_CHAPA = /^#chapa:\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?)\s*(?:pe(?:ç|c)a\s*(\d+(?:[.,]\d+)?)\s*[x×]\s*(\d+(?:[.,]\d+)?))?\s*(?:[—–-]\s*(.*))?$/i;

const num = (s?: string): number | undefined =>
  s === undefined ? undefined : Number(s.replace(',', '.'));

type Bloco = { tipo: 'texto'; texto: string } | { tipo: 'chapa'; spec: ChapaSpec };

const parse = (conteudo: string): Bloco[] => {
  const blocos: Bloco[] = [];
  let buffer: string[] = [];

  const descarregar = () => {
    if (buffer.length) {
      blocos.push({ tipo: 'texto', texto: buffer.join('\n') });
      buffer = [];
    }
  };

  for (const linha of conteudo.split('\n')) {
    const m = linha.trim().match(RE_CHAPA);
    if (m) {
      descarregar();
      blocos.push({
        tipo: 'chapa',
        spec: {
          larguraCm: num(m[1])!,
          alturaCm: num(m[2])!,
          pecaLarguraCm: num(m[3]),
          pecaAlturaCm: num(m[4]),
          legenda: m[5]?.trim() || undefined,
        },
      });
    } else {
      buffer.push(linha);
    }
  }
  descarregar();
  return blocos;
};

const GuiaConteudo: React.FC<{ conteudo: string }> = ({ conteudo }) => {
  const blocos = useMemo(() => parse(conteudo), [conteudo]);

  return (
    <div className="text-sm text-gray-700 leading-relaxed">
      {blocos.map((b, i) =>
        b.tipo === 'chapa' ? (
          <ChapaDiagrama key={i} spec={b.spec} />
        ) : (
          <div key={i} className="whitespace-pre-wrap">
            {b.texto}
          </div>
        )
      )}
    </div>
  );
};

export default GuiaConteudo;
