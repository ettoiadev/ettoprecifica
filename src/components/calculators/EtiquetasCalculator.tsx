import React, { useMemo, useState } from 'react';
import { Copy, PlusCircle } from 'lucide-react';
import { formatCurrency, EtiquetasConfig } from '../../types/pricing';
import { useCotacao } from '../../contexts/CotacaoContext';
import { toast } from 'sonner';

// Calculadora de Etiquetas/Rótulos — preço MANUAL, definido em Configurações
// (config.etiquetas), NÃO pelo motor da skill. Preço por unidade = área da
// etiqueta (largura×altura) × R$/m², com um piso por unidade (etiquetas pequenas
// caem no piso, ex.: 2×2cm). Medida e quantidade são livres (campos no topo); as
// caixas de tamanho fixo e os lotes são apenas atalhos. Sem deslocamento.
interface Props {
  config: EtiquetasConfig;
}

// Medidas fixas (cm) — atalhos que preenchem largura×altura.
const TAMANHOS_FIXOS: { largura: number; altura: number }[] = [
  { largura: 2, altura: 2 },
  { largura: 3, altura: 3 },
  { largura: 4, altura: 4 },
  { largura: 5, altura: 5 },
  { largura: 6, altura: 6 },
  { largura: 7, altura: 7 },
  { largura: 8, altura: 8 },
  { largura: 9, altura: 9 },
  { largura: 10, altura: 10 },
  { largura: 15, altura: 15 },
];

// Lotes de quantidade — atalhos que preenchem a quantidade.
const LOTES = [100, 250, 500, 1000];

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

// Boxes com preenchimento pastel (tonalidade suave) para facilitar a leitura.
const btn = (active: boolean) =>
  `px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
    active
      ? 'bg-indigo-100 border-indigo-400 text-indigo-800 shadow-sm'
      : 'bg-indigo-50/60 border-indigo-200 text-gray-700 hover:bg-indigo-100/70'
  }`;

const EtiquetasCalculator: React.FC<Props> = ({ config }) => {
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<string>('');

  const { addItem } = useCotacao();

  const larguraCm = parseFloat(largura) || 0;
  const alturaCm = parseFloat(altura) || 0;
  const qtd = parseInt(quantidade) || 0;
  const precoM2 = config.precoM2 || 0;
  const minUn = config.minPorUnidade || 0;
  const pct = config.notaFiscalPercentual || 0;
  const entradaValida = larguraCm > 0 && alturaCm > 0 && qtd > 0;

  const calc = useMemo(() => {
    if (!entradaValida) return null;
    const areaUnit = (larguraCm / 100) * (alturaCm / 100); // m² por etiqueta
    const precoUnitCalc = areaUnit * precoM2;
    const pisoAplicado = precoUnitCalc < minUn;
    const precoUnit = Math.max(precoUnitCalc, minUn);
    const semNota = precoUnit * qtd;
    const comNota = semNota * (1 + pct / 100);
    return { areaUnit, precoUnit, pisoAplicado, semNota, comNota };
  }, [entradaValida, larguraCm, alturaCm, qtd, precoM2, minUn, pct]);

  const temPreco = !!calc && calc.semNota > 0;

  const descricao = useMemo(
    () => `Etiquetas ${larguraCm}×${alturaCm}cm — ${qtd} un`,
    [larguraCm, alturaCm, qtd]
  );

  const handleCopy = () => {
    if (!temPreco || !calc) return;
    const texto = `Orçamento Etiquetas/Rótulos
Tamanho: ${larguraCm}×${alturaCm}cm — Quantidade: ${qtd} un
Preço (sem nota fiscal): ${formatCurrency(calc.semNota)}
Preço (com nota fiscal): ${formatCurrency(calc.comNota)}`;
    navigator.clipboard.writeText(texto).then(
      () => toast.success('Orçamento copiado!'),
      () => toast.error('Não foi possível copiar.')
    );
  };

  const handleAddCotacao = () => {
    if (!temPreco || !calc) return;
    addItem({ descricao, precoSemNota: calc.semNota, precoComNota: calc.comNota });
    toast.success('Adicionado à cotação!');
  };

  const tamanhoAtivo = (t: { largura: number; altura: number }) =>
    larguraCm === t.largura && alturaCm === t.altura;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Etiquetas / Rótulos</h2>
        <p className="text-gray-600">
          Preço por área ({formatCurrency(precoM2)}/m²), com mínimo de {formatCurrency(minUn)} por unidade.
          Digite a medida e a quantidade, ou use os atalhos abaixo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Medida e quantidade</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Largura (cm)</label>
                <input type="number" min="0" step="0.1" value={largura} onChange={(e) => setLargura(e.target.value)} className={inputClass} placeholder="0.0" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Altura (cm)</label>
                <input type="number" min="0" step="0.1" value={altura} onChange={(e) => setAltura(e.target.value)} className={inputClass} placeholder="0.0" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quantidade</label>
                <input type="number" min="1" step="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className={inputClass} placeholder="0" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tamanhos (atalho)</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {TAMANHOS_FIXOS.map((t) => (
                <button
                  key={`${t.largura}x${t.altura}`}
                  type="button"
                  onClick={() => { setLargura(String(t.largura)); setAltura(String(t.altura)); }}
                  className={btn(tamanhoAtivo(t))}
                >
                  {t.largura}×{t.altura}cm
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Quantidade (lote, atalho)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {LOTES.map((l) => (
                <button key={l} type="button" onClick={() => setQuantidade(String(l))} className={btn(qtd === l)}>
                  {l} un
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento</h3>

          {!entradaValida ? (
            <p className="text-sm text-gray-500">Informe a medida e a quantidade para ver o preço.</p>
          ) : temPreco && calc ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Preço de venda (sem nota fiscal)</div>
                <div className="text-3xl font-bold text-blue-600">{formatCurrency(calc.semNota)}</div>
                <div className="mt-1 text-sm text-orange-600 font-medium">Com nota fiscal: {formatCurrency(calc.comNota)}</div>
                <div className="mt-1 text-xs text-green-600 font-medium">
                  {qtd} un · unitário {formatCurrency(calc.precoUnit)}
                </div>
                {calc.pisoAplicado && (
                  <div className="mt-1 text-xs text-amber-600 font-medium">
                    Mínimo de {formatCurrency(minUn)}/unidade aplicado.
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-600"><span>Tamanho:</span><span>{larguraCm}×{alturaCm} cm</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Área (un):</span><span>{calc.areaUnit.toFixed(4)} m²</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Quantidade:</span><span>{qtd} un</span></div>
              </div>

              <div className="space-y-2">
                <button type="button" onClick={handleAddCotacao} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors">
                  <PlusCircle className="w-4 h-4" /> Adicionar à cotação
                </button>
                <button type="button" onClick={handleCopy} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors">
                  <Copy className="w-4 h-4" /> Copiar orçamento
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default EtiquetasCalculator;
