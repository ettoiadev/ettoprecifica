import React, { useMemo, useState } from 'react';
import { Copy, PlusCircle } from 'lucide-react';
import { formatCurrency, PlacaPSConfig } from '../../types/pricing';
import { useCotacao } from '../../contexts/CotacaoContext';
import { toast } from 'sonner';

// Placa em PS com preço MANUAL, definido em Configurações (config.placaPS), NÃO
// pelo motor da skill. Seis tipos de placa, cada um com preço por m²; o preço com
// nota fiscal sai de um percentual único. Sem deslocamento (PS nunca teve).
// Mesmo padrão da Lona/Adesivo.
interface Props {
  config: PlacaPSConfig;
}

type PSOptionId = Exclude<keyof PlacaPSConfig, 'notaFiscalPercentual'>;

interface Opcao {
  id: PSOptionId;
  nome: string;
  preco: number;
}

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

// Boxes com preenchimento pastel (tonalidade suave) para facilitar a leitura.
const btn = (active: boolean) =>
  `text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
    active
      ? 'bg-indigo-100 border-indigo-400 text-indigo-800 shadow-sm'
      : 'bg-indigo-50/60 border-indigo-200 text-gray-700 hover:bg-indigo-100/70'
  }`;

const PlacaPSManualCalculator: React.FC<Props> = ({ config }) => {
  const [tipo, setTipo] = useState<PSOptionId>('branco1mm');
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);

  const { addItem } = useCotacao();

  const opcoes = useMemo<Opcao[]>(
    () => [
      { id: 'branco1mm', nome: 'Placa PS Branco 1mm', preco: config.branco1mm },
      { id: 'branco2mm', nome: 'Placa PS Branco 2mm', preco: config.branco2mm },
      { id: 'branco3mm', nome: 'Placa PS Branco 3mm', preco: config.branco3mm },
      { id: 'cristal15mm', nome: 'PS Cristal 1,5mm', preco: config.cristal15mm },
      { id: 'cristal2mm', nome: 'PS Cristal 2mm', preco: config.cristal2mm },
      { id: 'cristal3mm', nome: 'PS Cristal 3mm', preco: config.cristal3mm },
    ],
    [config]
  );

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const qtd = quantidade > 0 ? quantidade : 1;
  const entradaValida = larguraNum > 0 && alturaNum > 0;

  const opcaoSel = opcoes.find((o) => o.id === tipo) ?? opcoes[0];
  const precoM2 = opcaoSel.preco;
  const pct = config.notaFiscalPercentual || 0;

  const calc = useMemo(() => {
    if (!entradaValida) return null;
    const areaUnit = larguraNum * alturaNum;
    const areaTotal = areaUnit * qtd;
    const semNota = precoM2 * areaTotal;
    const comNota = semNota * (1 + pct / 100);
    return { areaUnit, areaTotal, semNota, comNota };
  }, [entradaValida, larguraNum, alturaNum, qtd, precoM2, pct]);

  const temPreco = !!calc && calc.semNota > 0;

  const descricao = useMemo(
    () => `${opcaoSel.nome} ${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m${qtd > 1 ? ` (${qtd}un)` : ''}`,
    [opcaoSel.nome, larguraNum, alturaNum, qtd]
  );

  const handleCopy = () => {
    if (!temPreco || !calc) return;
    const texto = `Orçamento ${opcaoSel.nome}
Dimensões: ${larguraNum.toFixed(2)} x ${alturaNum.toFixed(2)} m — ${qtd} un
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Placa em PS</h2>
        <p className="text-gray-600">
          Placa de PS com impressão digital adesivada, por m². Preços definidos manualmente em Configurações.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Dimensões e quantidade</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Largura (m)</label>
                <input type="number" min="0" step="0.01" value={largura} onChange={(e) => setLargura(e.target.value)} className={inputClass} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Altura (m)</label>
                <input type="number" min="0" step="0.01" value={altura} onChange={(e) => setAltura(e.target.value)} className={inputClass} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quantidade</label>
                <input type="number" min="1" step="1" value={quantidade || ''} onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)} className={inputClass} placeholder="1" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de placa</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {opcoes.map((o) => (
                <button key={o.id} type="button" onClick={() => setTipo(o.id)} className={btn(tipo === o.id)}>
                  <div>{o.nome}</div>
                  <div className="text-xs opacity-70 mt-0.5">{formatCurrency(o.preco)}/m²</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento</h3>

          {!entradaValida ? (
            <p className="text-sm text-gray-500">Informe as dimensões para ver o preço.</p>
          ) : temPreco && calc ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Preço de venda (sem nota fiscal)</div>
                <div className="text-3xl font-bold text-blue-600">{formatCurrency(calc.semNota)}</div>
                <div className="mt-1 text-sm text-orange-600 font-medium">Com nota fiscal: {formatCurrency(calc.comNota)}</div>
                {qtd > 1 && (
                  <div className="mt-1 text-xs text-green-600 font-medium">
                    {qtd} un · unitário {formatCurrency(calc.semNota / qtd)} ({formatCurrency(calc.comNota / qtd)} c/ nota)
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-600"><span>Placa:</span><span className="text-right">{opcaoSel.nome}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Preço/m²:</span><span>{formatCurrency(precoM2)}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Área (un):</span><span>{calc.areaUnit.toFixed(2)} m²</span></div>
                {qtd > 1 && (
                  <div className="flex justify-between text-sm text-gray-600"><span>Área total:</span><span>{calc.areaTotal.toFixed(2)} m²</span></div>
                )}
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

export default PlacaPSManualCalculator;
