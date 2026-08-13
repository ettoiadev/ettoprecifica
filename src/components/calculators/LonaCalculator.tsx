import React, { useMemo, useState } from 'react';
import { Copy, PlusCircle } from 'lucide-react';
import { formatCurrency, LonaConfig } from '../../types/pricing';
import { useCotacao } from '../../contexts/CotacaoContext';
import { useDeslocamentoCep } from '../../hooks/useDeslocamentoCep';
import DeslocamentoField from './DeslocamentoField';
import { toast } from 'sonner';

// Calculadora de Lona/Banner/Faixa — ÚNICO produto com preço MANUAL, definido em
// Configurações (config.lona), NÃO pelo motor da skill. Cada acabamento tem um
// preço por m²; a Laca de Proteção é um adicional opcional por m²; o preço com
// nota fiscal sai de um percentual único sobre o preço do produto. O deslocamento
// continua opcional e vem do fluxo por CEP (useDeslocamentoCep), somado à parte,
// como um custo de repasse (sem incidência de nota fiscal).
interface Props {
  config: LonaConfig;
}

interface Opcao {
  id: keyof LonaConfig;
  nome: string;
  preco: number;
}

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const btn = (active: boolean) =>
  `px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-50 border-blue-300 text-blue-700'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
  }`;

const LonaCalculator: React.FC<Props> = ({ config }) => {
  const deslocamento = useDeslocamentoCep();
  const { incluirDeslocamento, custoDeslocamento } = deslocamento;
  const [acabamento, setAcabamento] = useState<keyof LonaConfig>('bannerSemAcabamento');
  const [laca, setLaca] = useState<boolean>(false);
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);

  const { addItem } = useCotacao();

  // Opções de acabamento (preços manuais vindos de Configurações).
  const opcoes = useMemo<Opcao[]>(
    () => [
      { id: 'bannerSemAcabamento', nome: 'Banner ou Lona sem acabamento', preco: config.bannerSemAcabamento },
      { id: 'reforcoIlhos', nome: 'Lona reforço e ilhós', preco: config.reforcoIlhos },
      { id: 'lonaGrande', nome: 'Lona grande (maior que 1,80 largura)', preco: config.lonaGrande },
      { id: 'lonaTranslucida', nome: 'Lona translúcida', preco: config.lonaTranslucida },
    ],
    [config]
  );

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const qtd = quantidade > 0 ? quantidade : 1;
  const custoDeslocamentoNum = parseFloat(custoDeslocamento) || 0;
  const entradaValida = larguraNum > 0 && alturaNum > 0;

  const opcaoSel = opcoes.find((o) => o.id === acabamento) ?? opcoes[0];
  const precoM2Base = opcaoSel.preco;
  const precoM2Laca = laca ? config.lacaProtecaoM2 : 0;
  const precoM2 = precoM2Base + precoM2Laca;
  const pct = config.notaFiscalPercentual || 0;

  // Cálculo local: área agregada × preço/m²; deslocamento (opcional) somado uma
  // vez ao total, sem incidência de nota fiscal (é custo de repasse).
  const calc = useMemo(() => {
    if (!entradaValida) return null;
    const areaUnit = larguraNum * alturaNum;
    const areaTotal = areaUnit * qtd;
    const produtoSemNota = precoM2 * areaTotal;
    const desloc = incluirDeslocamento ? custoDeslocamentoNum : 0;
    const semNota = produtoSemNota + desloc;
    const comNota = produtoSemNota * (1 + pct / 100) + desloc;
    return { areaUnit, areaTotal, produtoSemNota, adicionalLaca: precoM2Laca * areaTotal, desloc, semNota, comNota };
  }, [entradaValida, larguraNum, alturaNum, qtd, precoM2, precoM2Laca, pct, incluirDeslocamento, custoDeslocamentoNum]);

  const temPreco = !!calc && calc.semNota > 0;

  const descricao = useMemo(
    () =>
      `Lona/Banner ${opcaoSel.nome}${laca ? ' + laca' : ''} ${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m${
        qtd > 1 ? ` (${qtd}un)` : ''
      }`,
    [opcaoSel.nome, laca, larguraNum, alturaNum, qtd]
  );

  const handleCopy = () => {
    if (!temPreco || !calc) return;
    const texto = `Orçamento Lona/Banner — ${opcaoSel.nome}${laca ? ' + Laca de Proteção' : ''}
Dimensões: ${larguraNum.toFixed(2)} x ${alturaNum.toFixed(2)} m — ${qtd} un
${incluirDeslocamento ? `Deslocamento incluído: ${formatCurrency(calc.desloc)}\n` : ''}Preço (sem nota fiscal): ${formatCurrency(calc.semNota)}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Lona</h2>
        <p className="text-gray-600">
          Lona, banner e faixa por m², com acabamento. Preços definidos manualmente em Configurações.
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
            <label className="block text-sm font-medium text-gray-700 mb-3">Acabamento</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {opcoes.map((o) => (
                <button key={o.id} type="button" onClick={() => setAcabamento(o.id)} className={btn(acabamento === o.id)}>
                  {o.nome} — {formatCurrency(o.preco)}/m²
                </button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={laca} onChange={(e) => setLaca(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              Laca de Proteção (UV) — {formatCurrency(config.lacaProtecaoM2)}/m²
            </span>
          </label>

          <DeslocamentoField {...deslocamento} />
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
                <div className="flex justify-between text-sm text-gray-600"><span>Acabamento:</span><span>{opcaoSel.nome}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Preço/m²:</span><span>{formatCurrency(precoM2Base)}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Área (un):</span><span>{calc.areaUnit.toFixed(2)} m²</span></div>
                {qtd > 1 && (
                  <div className="flex justify-between text-sm text-gray-600"><span>Área total:</span><span>{calc.areaTotal.toFixed(2)} m²</span></div>
                )}
                {laca && calc.adicionalLaca > 0 && (
                  <div className="flex justify-between text-sm text-gray-600"><span>Laca de proteção UV:</span><span>{formatCurrency(calc.adicionalLaca)}</span></div>
                )}
                {incluirDeslocamento && calc.desloc > 0 && (
                  <div className="flex justify-between text-sm text-gray-600"><span>Deslocamento:</span><span>{formatCurrency(calc.desloc)}</span></div>
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

export default LonaCalculator;
