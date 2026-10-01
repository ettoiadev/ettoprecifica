import React, { useMemo } from 'react';
import ChapaDiagrama from './ChapaDiagrama';
import { parseGuia } from './guiaParser';

// Exibe o conteúdo de uma aba do guia. O texto continua sendo texto simples —
// este componente só dá forma visual ao que o parser reconheceu (título,
// tabela alinhada por espaços, desenho de chapa). Nada é renderizado como
// HTML, então não há risco de injeção pelo campo editável (ver docs/GUIA.md).
const GuiaConteudo: React.FC<{ conteudo: string }> = ({ conteudo }) => {
  const blocos = useMemo(() => parseGuia(conteudo), [conteudo]);

  return (
    <div className="text-sm text-gray-700 leading-relaxed">
      {blocos.map((b, i) => {
        if (b.tipo === 'chapa') return <ChapaDiagrama key={i} spec={b.spec} />;

        if (b.tipo === 'titulo') {
          return (
            <h3
              key={i}
              id={b.id}
              className="scroll-mt-24 text-base font-semibold text-gray-900 mt-8 mb-3 pb-1.5 border-b border-gray-200 first:mt-0"
            >
              {b.texto}
            </h3>
          );
        }

        if (b.tipo === 'tabela') {
          // Alinhamento por espaços só funciona em fonte monoespaçada — é o que
          // a pessoa quis dizer ao alinhar as colunas com espaço no editor.
          return (
            <div key={i} className="my-3 overflow-x-auto">
              <pre className="inline-block min-w-full bg-gray-50 border border-gray-200 rounded-md px-4 py-3 font-mono text-xs leading-relaxed text-gray-800">
                {b.texto}
              </pre>
            </div>
          );
        }

        // 85ch é largo o bastante para caber numa linha só o texto que já veio
        // quebrado à mão (~78 colunas, costume de documento em texto puro) sem
        // quebrar de novo e virar um serrilhado, e ainda limita o comprimento
        // de parágrafo escrito sem quebras.
        return (
          <p key={i} className="whitespace-pre-wrap my-3 max-w-[85ch]">
            {b.texto}
          </p>
        );
      })}
    </div>
  );
};

export default GuiaConteudo;
