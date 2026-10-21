/*
 * Upload do SVG → encaixe das peças na chapa → área que vira preço.
 *
 * A área cobrada NÃO é a soma dos contornos: o que se perde de verdade é a
 * FAIXA da chapa que o encaixe consome (o resto da chapa fica cortado e não
 * volta pro estoque). Por isso a base padrão é "faixa ocupada", com as outras
 * duas à vista para o vendedor comparar.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Upload, Loader2, AlertTriangle, FileWarning, RotateCcw } from 'lucide-react';
import { lerSvg, escalarPecas, type LeituraSvg, type Ponto } from '../../lib/nesting/svgParaPecas';
import { useNesting, type FolhaEncaixe } from '../../hooks/useNesting';
import { OptionChip } from './CalcControls';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

export type BaseCobranca = 'faixa' | 'contorno' | 'chapa';

export interface ResultadoEncaixeArea {
  areaM2: number;
  base: BaseCobranca;
  totalFolhas: number;
  totalPecas: number;
  aproveitamento: number;
  resumo: string;
}

interface Props {
  onResultado: (r: ResultadoEncaixeArea | null) => void;
}

const BASE_LABEL: Record<BaseCobranca, string> = {
  contorno: 'Contorno real',
  faixa: 'Faixa ocupada',
  chapa: 'Chapa inteira',
};

const BASE_AJUDA: Record<BaseCobranca, string> = {
  contorno: 'Só o material que vira letra. Joga a sobra toda por nossa conta.',
  faixa: 'O pedaço da chapa que o corte consome. É o que de fato se perde.',
  chapa: 'A chapa inteira, mesmo a parte não usada. Para quando a sobra não serve.',
};

const fmt = (v: number, casas = 3) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas });

const paraPath = (pts: Ponto[]) =>
  pts.length === 0
    ? ''
    : `M ${pts.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' L ')} Z`;

const DesenhoFolha: React.FC<{
  folha: FolhaEncaixe;
  chapa: { largura: number; altura: number };
  indice: number;
  total: number;
}> = ({ folha, chapa, indice, total }) => (
  <div>
    {total > 1 && (
      <div className="text-xs text-gray-500 mb-1">
        Folha {indice + 1} de {total}
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
        <path
          key={`${pc.id}-${i}`}
          d={[paraPath(pc.pontos), ...pc.furos.map(paraPath)].join(' ')}
          fillRule="evenodd"
          fill="#3b82f6"
          fillOpacity={0.7}
          stroke="#1d4ed8"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
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

const EncaixeSvgPanel: React.FC<Props> = ({ onResultado }) => {
  const inputArquivo = useRef<HTMLInputElement>(null);
  const [nomeArquivo, setNomeArquivo] = useState<string>('');
  const [leitura, setLeitura] = useState<LeituraSvg | null>(null);
  const [erroLeitura, setErroLeitura] = useState<string | null>(null);

  const [alturaRealCm, setAlturaRealCm] = useState<string>('');
  const [quantidade, setQuantidade] = useState<string>('1');
  const [chapaLargura, setChapaLargura] = useState<string>('1220');
  const [chapaComprimento, setChapaComprimento] = useState<string>('2440');
  const [espacamento, setEspacamento] = useState<string>('5');
  const [base, setBase] = useState<BaseCobranca>('faixa');

  const { rodar, limpar, estado, progresso, resultado, erro } = useNesting();

  const alturaRealNum = parseFloat(alturaRealCm) || 0;
  const quantidadeNum = Math.max(1, parseInt(quantidade, 10) || 1);
  const chapaLarguraNum = parseFloat(chapaLargura) || 0;
  const chapaComprimentoNum = parseFloat(chapaComprimento) || 0;
  const espacamentoNum = Math.max(0, parseFloat(espacamento) || 0);

  // Escala: o usuário informa a altura real do conjunto, porque a medida que
  // vem no arquivo é pouco confiável (Illustrator grava px querendo dizer pt).
  const fator = leitura && leitura.altura > 0 && alturaRealNum > 0
    ? (alturaRealNum * 10) / leitura.altura
    : 1;

  const pecasEscaladas = useMemo(
    () => (leitura ? escalarPecas(leitura.pecas, fator) : []),
    [leitura, fator]
  );

  const totalPecas = pecasEscaladas.length * quantidadeNum;

  const maiorPeca = useMemo(() => {
    let w = 0;
    let h = 0;
    for (const p of pecasEscaladas) {
      if (p.largura > w) w = p.largura;
      if (p.altura > h) h = p.altura;
    }
    return { largura: w, altura: h };
  }, [pecasEscaladas]);

  // A peça precisa caber na chapa em alguma das duas orientações.
  const pecaNaoCabe =
    chapaLarguraNum > 0 &&
    chapaComprimentoNum > 0 &&
    maiorPeca.largura > 0 &&
    !(
      (maiorPeca.largura <= chapaComprimentoNum && maiorPeca.altura <= chapaLarguraNum) ||
      (maiorPeca.altura <= chapaComprimentoNum && maiorPeca.largura <= chapaLarguraNum)
    );

  const trocarArquivo = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      limpar();
      setErroLeitura(null);
      setNomeArquivo(file.name);
      try {
        const texto = await file.text();
        const lido = lerSvg(texto);
        setLeitura(lido);
        setAlturaRealCm((lido.altura / 10).toFixed(1));
      } catch (e) {
        setLeitura(null);
        setErroLeitura(e instanceof Error ? e.message : 'Não foi possível ler o arquivo.');
      }
    },
    [limpar]
  );

  const calcular = () => {
    if (pecasEscaladas.length === 0 || chapaLarguraNum <= 0 || chapaComprimentoNum <= 0) return;
    const todas = [];
    for (let j = 0; j < quantidadeNum; j++) todas.push(...pecasEscaladas);
    // Com poucas peças, liberar os 4 giros melhora bastante o encaixe e custa
    // quase nada (medido: 5 peças, 3s, faixa 0,695 m² contra 0,808 m² só com
    // 0°/180°). Com muitas peças a chapa enche de qualquer jeito e os 4 giros
    // só triplicam a espera (20 peças: 19s contra 6,6s), sem ganho de área.
    const muitasPecas = todas.length > 12;
    rodar(
      todas,
      { largura: chapaLarguraNum, comprimento: chapaComprimentoNum },
      {
        espacamento: espacamentoNum,
        rotacoes: muitasPecas ? [0, 180] : [0, 90, 180, 270],
        tentativas: muitasPecas ? 4 : 6,
      }
    );
  };

  const areas = useMemo(() => {
    if (!resultado) return null;
    return {
      contorno: resultado.areaPecas / 1e6,
      faixa: resultado.areaFaixaOcupada / 1e6,
      chapa: resultado.areaChapasInteiras / 1e6,
    };
  }, [resultado]);

  // Publica a área escolhida para a calculadora precificar.
  useEffect(() => {
    if (!resultado || !areas) {
      onResultado(null);
      return;
    }
    const areaM2 = areas[base];
    onResultado({
      areaM2,
      base,
      totalFolhas: resultado.totalFolhas,
      totalPecas: resultado.totalPecas,
      aproveitamento: resultado.areaPecas / Math.max(resultado.areaFaixaOcupada, 1),
      resumo: `${resultado.totalPecas} peças · ${resultado.totalFolhas} ${
        resultado.totalFolhas === 1 ? 'chapa' : 'chapas'
      } · ${fmt(areaM2)} m² (${BASE_LABEL[base].toLowerCase()})`,
    });
  }, [resultado, areas, base, onResultado]);

  return (
    <div className="space-y-6">
      {/* Arquivo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Arquivo vetorial</label>
        <input
          ref={inputArquivo}
          type="file"
          accept=".svg,image/svg+xml"
          className="sr-only"
          onChange={(e) => {
            void trocarArquivo(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          onClick={() => inputArquivo.current?.click()}
        >
          <Upload className="w-4 h-4" />
          {nomeArquivo || 'Escolher arquivo SVG…'}
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          Exporte do Corel como SVG com o texto convertido em curvas. Cada letra vira uma peça.
        </p>

        {erroLeitura && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            <FileWarning className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{erroLeitura}</span>
          </div>
        )}

        {leitura && (
          <div className="mt-3 text-sm text-gray-600">
            <span className="font-medium text-gray-800">{leitura.pecas.length} peças</span> ·
            conjunto de {leitura.largura.toFixed(0)} × {leitura.altura.toFixed(0)} mm no arquivo
          </div>
        )}

        {leitura?.avisos.map((a) => (
          <div
            key={a}
            className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{a}</span>
          </div>
        ))}
      </div>

      {leitura && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="altura-real" className="block text-sm font-medium text-gray-700 mb-3">
                Altura real do conjunto (cm)
              </label>
              <Input
                id="altura-real"
                type="number"
                min="0"
                step="0.1"
                value={alturaRealCm}
                onChange={(e) => setAlturaRealCm(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="qtd-jogos" className="block text-sm font-medium text-gray-700 mb-3">
                Quantidade de jogos
              </label>
              <Input
                id="qtd-jogos"
                type="number"
                min="1"
                step="1"
                value={quantidade}
                onChange={(e) => setQuantidade(e.target.value)}
              />
            </div>
          </div>

          {maiorPeca.largura > 0 && (
            <p className="-mt-3 text-xs text-gray-500">
              Maior peça: {maiorPeca.largura.toFixed(0)} × {maiorPeca.altura.toFixed(0)} mm ·{' '}
              {totalPecas} peças no total
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Chapa e corte</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="chapa-largura" className="block text-xs text-gray-500 mb-1">
                  Largura útil (mm)
                </label>
                <Input
                  id="chapa-largura"
                  type="number"
                  min="0"
                  step="10"
                  value={chapaLargura}
                  onChange={(e) => setChapaLargura(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="chapa-comprimento" className="block text-xs text-gray-500 mb-1">
                  Comprimento (mm)
                </label>
                <Input
                  id="chapa-comprimento"
                  type="number"
                  min="0"
                  step="10"
                  value={chapaComprimento}
                  onChange={(e) => setChapaComprimento(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="chapa-vao" className="block text-xs text-gray-500 mb-1">
                  Vão entre peças (mm)
                </label>
                <Input
                  id="chapa-vao"
                  type="number"
                  min="0"
                  step="1"
                  value={espacamento}
                  onChange={(e) => setEspacamento(e.target.value)}
                />
              </div>
            </div>
          </div>

          {pecaNaoCabe && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                A maior peça não cabe nessa chapa em nenhuma orientação. Reduza a altura do conjunto
                ou use uma chapa maior.
              </span>
            </div>
          )}

          <Button
            type="button"
            onClick={calcular}
            disabled={estado === 'rodando' || pecaNaoCabe || totalPecas === 0}
            className="w-full"
          >
            {estado === 'rodando' ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Encaixando… {Math.round(progresso * 100)}%
              </>
            ) : (
              <>
                <RotateCcw className="w-4 h-4" />
                {resultado ? 'Recalcular encaixe' : 'Calcular encaixe'}
              </>
            )}
          </Button>

          {erro && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{erro}</span>
            </div>
          )}

          {resultado && areas && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  O que entra no preço
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {(['contorno', 'faixa', 'chapa'] as const).map((b) => (
                    <OptionChip
                      key={b}
                      onClick={() => setBase(b)}
                      active={base === b}
                      variant="indigo"
                    >
                      <span className="block font-medium">{BASE_LABEL[b]}</span>
                      <span className="block text-xs opacity-80">{fmt(areas[b])} m²</span>
                    </OptionChip>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">{BASE_AJUDA[base]}</p>
              </div>

              <div className="space-y-2">
                {resultado.folhas.map((f, i) => (
                  <DesenhoFolha
                    key={i}
                    folha={f}
                    chapa={resultado.chapa}
                    indice={i}
                    total={resultado.folhas.length}
                  />
                ))}
                <p className="text-xs text-gray-500">
                  A linha tracejada marca onde a chapa foi cortada — à direita dela sobra material
                  inteiro.
                </p>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default EncaixeSvgPanel;
