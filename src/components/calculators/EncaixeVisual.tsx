/*
 * Coluna da direita: mostra o que veio no arquivo assim que ele é carregado e,
 * depois de organizar, o encaixe folha a folha. Duas abas porque o vendedor
 * precisa conferir que o sistema entendeu o desenho ANTES de olhar o preço —
 * se as letras aparecerem quebradas aqui, o orçamento está errado.
 */
import React, { useState } from 'react';
import { Loader2, AlertTriangle, LayoutGrid, FileImage, Wand2 } from 'lucide-react';
import type { PecaVetorial, Ponto } from '../../lib/nesting/geometria';
import type { FolhaEncaixe } from '../../hooks/useNesting';
import type { EncaixeSvg } from '../../hooks/useEncaixeSvg';
import { Button } from '../ui/button';

type Aba = 'arquivo' | 'encaixe';

const paraPath = (pts: Ponto[], dx = 0, dy = 0) =>
  pts.length === 0
    ? ''
    : `M ${pts.map((p) => `${(p.x + dx).toFixed(1)},${(p.y + dy).toFixed(1)}`).join(' L ')} Z`;

const Contorno: React.FC<{ d: string; chave: string }> = ({ d, chave }) => (
  <path
    key={chave}
    d={d}
    fillRule="evenodd"
    fill="#3b82f6"
    fillOpacity={0.7}
    stroke="#1d4ed8"
    strokeWidth={1}
    vectorEffect="non-scaling-stroke"
  />
);

/** O desenho como veio no arquivo, com cada peça no lugar original. */
const VistaArquivo: React.FC<{
  pecas: PecaVetorial[];
  largura: number;
  altura: number;
}> = ({ pecas, largura, altura }) => {
  // margem para o traço não encostar na borda do quadro
  const m = Math.max(largura, altura) * 0.02;
  return (
    <svg
      viewBox={`${-m} ${-m} ${largura + 2 * m} ${altura + 2 * m}`}
      className="w-full h-auto rounded border border-gray-200 bg-white"
      role="img"
      aria-label="Desenho do arquivo enviado"
    >
      {pecas.map((p, i) => (
        <Contorno
          key={`${p.id}-${i}`}
          chave={`${p.id}-${i}`}
          d={[
            paraPath(p.contorno, p.origem.x, p.origem.y),
            ...p.furos.map((f) => paraPath(f, p.origem.x, p.origem.y)),
          ].join(' ')}
        />
      ))}
    </svg>
  );
};

const VistaFolha: React.FC<{
  folha: FolhaEncaixe;
  chapa: { largura: number; altura: number };
  indice: number;
  total: number;
}> = ({ folha, chapa, indice, total }) => (
  <div>
    {total > 1 && (
      <div className="text-xs text-gray-500 mb-1">
        Folha {indice + 1} de {total} · {(folha.areaFaixaOcupada / 1e6).toFixed(3)} m² consumidos
      </div>
    )}
    <svg
      viewBox={`0 0 ${chapa.largura} ${chapa.altura}`}
      className="w-full h-auto rounded border border-gray-200 bg-white"
      role="img"
      aria-label={`Encaixe das peças na folha ${indice + 1}`}
    >
      <rect x={0} y={0} width={chapa.largura} height={chapa.altura} fill="#f8fafc" />
      {folha.pecas.map((pc, i) => (
        <Contorno
          key={`${pc.id}-${i}`}
          chave={`${pc.id}-${i}`}
          d={[paraPath(pc.pontos), ...pc.furos.map((f) => paraPath(f))].join(' ')}
        />
      ))}
      {folha.comprimentoUsado > 0 && folha.comprimentoUsado < chapa.largura && (
        <line
          x1={folha.comprimentoUsado}
          y1={0}
          x2={folha.comprimentoUsado}
          y2={chapa.altura}
          stroke="#f59e0b"
          strokeWidth={2}
          strokeDasharray="12 8"
          vectorEffect="non-scaling-stroke"
        />
      )}
      <rect
        x={0}
        y={0}
        width={chapa.largura}
        height={chapa.altura}
        fill="none"
        stroke="#94a3b8"
        strokeWidth={1}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  </div>
);

const EncaixeVisual: React.FC<{ enc: EncaixeSvg }> = ({ enc }) => {
  const [abaManual, setAbaManual] = useState<Aba | null>(null);
  // sem escolha explícita, mostra o encaixe assim que ele existe
  const aba: Aba = abaManual ?? (enc.resultado ? 'encaixe' : 'arquivo');

  if (!enc.leitura) {
    return (
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Pré-visualização</h3>
        <p className="text-sm text-gray-500">
          Envie um arquivo SVG ou DXF para ver o desenho e organizar as peças na chapa.
        </p>
      </div>
    );
  }

  const rodando = enc.estado === 'rodando';

  return (
    <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-lg font-semibold text-gray-900">
          {aba === 'arquivo' ? 'Desenho do arquivo' : 'Encaixe na chapa'}
        </h3>
        {enc.resultado && (
          <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => setAbaManual('arquivo')}
              className={`flex items-center gap-1.5 px-3 py-1.5 ${
                aba === 'arquivo' ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-600'
              }`}
            >
              <FileImage className="w-4 h-4" /> Arquivo
            </button>
            <button
              type="button"
              onClick={() => setAbaManual('encaixe')}
              className={`flex items-center gap-1.5 px-3 py-1.5 border-l border-gray-300 ${
                aba === 'encaixe' ? 'bg-blue-50 text-blue-700' : 'bg-white text-gray-600'
              }`}
            >
              <LayoutGrid className="w-4 h-4" /> Encaixe
            </button>
          </div>
        )}
      </div>

      {aba === 'arquivo' ? (
        <>
          <VistaArquivo
            pecas={enc.pecas}
            largura={enc.conjunto.largura}
            altura={enc.conjunto.altura}
          />
          <p className="text-xs text-gray-500">
            {enc.leitura.pecas.length}{' '}
            {enc.leitura.pecas.length === 1 ? 'peça lida' : 'peças lidas'} do arquivo. Confira se o
            desenho está inteiro antes de organizar.
          </p>
        </>
      ) : (
        enc.resultado && (
          <>
            <div className="space-y-3">
              {enc.resultado.folhas.map((f, i) => (
                <VistaFolha
                  key={i}
                  folha={f}
                  chapa={enc.resultado!.chapa}
                  indice={i}
                  total={enc.resultado!.folhas.length}
                />
              ))}
            </div>
            <p className="text-xs text-gray-500">
              A linha tracejada marca onde a chapa foi cortada — à direita dela sobra material
              inteiro.
              {enc.duracaoMs !== null &&
                ` Organizado em ${(enc.duracaoMs / 1000).toFixed(1)} s.`}
            </p>
          </>
        )
      )}

      {enc.erro && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{enc.erro}</span>
        </div>
      )}

      <Button
        type="button"
        onClick={() => {
          setAbaManual(null);
          enc.organizar();
        }}
        disabled={rodando || enc.pecaNaoCabe || enc.totalPecas === 0}
        className="w-full"
      >
        {rodando ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Organizando… {Math.round(enc.progresso * 100)}%
          </>
        ) : (
          <>
            <Wand2 className="w-4 h-4" />
            {enc.resultado ? 'Organizar novamente' : 'Organizar automaticamente'}
          </>
        )}
      </Button>
    </div>
  );
};

export default EncaixeVisual;
