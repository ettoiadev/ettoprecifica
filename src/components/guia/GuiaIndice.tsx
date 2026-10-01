import React, { useMemo } from 'react';
import { titulosDoGuia } from './guiaParser';

// Índice dos títulos da aba, para navegar documento longo sem rolar no escuro.
// Só aparece em tela larga e quando há títulos suficientes para valer a pena —
// numa aba de 3 linhas, um índice seria ruído.
const GuiaIndice: React.FC<{ conteudo: string }> = ({ conteudo }) => {
  const titulos = useMemo(() => titulosDoGuia(conteudo), [conteudo]);

  if (titulos.length < 3) return null;

  return (
    <nav aria-label="Nesta aba" className="hidden xl:block w-52 shrink-0">
      <div className="sticky top-28">
        <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">
          Nesta aba
        </div>
        <ul className="space-y-0.5 border-l border-gray-200">
          {titulos.map((t) => (
            <li key={t.id}>
              <a
                href={`#${t.id}`}
                className="block border-l-2 border-transparent -ml-px pl-3 py-1 text-sm text-gray-600 hover:text-blue-700 hover:border-blue-600 transition-colors"
              >
                {t.texto}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default GuiaIndice;
