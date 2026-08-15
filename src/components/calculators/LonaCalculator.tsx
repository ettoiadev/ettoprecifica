import React, { useEffect, useMemo, useState } from 'react';
import { Copy, PlusCircle } from 'lucide-react';
import { formatCurrency, ALIQUOTA_NF, LonaConfig, ProductVariation } from '../../types/pricing';
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
  // Acabamentos (nome/descrição/preço/ordem) vêm da lista editável em Configurações.
  const opcoes = useMemo<ProductVariation[]>(() => config.itens ?? [], [config.itens]);
  const [acabamentoId, setAcabamentoId] = useState<string>(opcoes[0]?.id ?? '');
  const [laca, setLaca] = useState<boolean>(false);
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [incluirNota, setIncluirNota] = useState<boolean>(true);

  const { addItem } = useCotacao();

  // Mantém a seleção válida quando a lista muda (renomear/reordenar/excluir).
  useEffect(() => {
    if (opcoes.length === 0) return;
    if (!opcoes.some((o) => o.id === acabamentoId)) setAcabamentoId(opcoes[0].id);
  }, [opcoes, acabamentoId]);

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const qtd = quantidade > 0 ? quantidade : 1;
  const custoDeslocamentoNum = parseFloat(custoDeslocamento) || 0;
  const entradaValida = larguraNum > 0 && alturaNum > 0;

  const opcaoSel = opcoes.find((o) => o.id === acabamentoId) ?? opcoes[0];
  const precoM2Base = opcaoSel?.price ?? 0;
  const precoM2Laca = laca ? config.lacaProtecaoM2 : 0;
  const precoM2 = precoM2Base + precoM2Laca;

  // Cálculo local: área agregada × preço/m²; deslocamento (opcional) somado uma
  // vez ao total, sem incidência de nota fiscal (é custo de repasse).
  const calc = useMemo(() => {
    if (!entradaValida) return null;
    const areaUnit = larguraNum * alturaNum;
    const areaTotal = areaUnit * qtd;
    const produtoSemNota = precoM2 * areaTotal;
    const desloc = incluirDeslocamento ? custoDeslocamentoNum : 0;
    const semNota = produtoSemNota + desloc;
    const comNota = produtoSemNota * (1 + ALIQUOTA_NF / 100) + desloc;
    const descontoNota = comNota - semNota;
    const final = incluirNota ? comNota : semNota;
    return { areaUnit, areaTotal, produtoSemNota, adicionalLaca: precoM2Laca * areaTotal, desloc, semNota, comNota, descontoNota, final };
  }, [entradaValida, larguraNum, alturaNum, qtd, precoM2, precoM2Laca, incluirDeslocamento, custoDeslocamentoNum, incluirNota]);

  const temPreco = !!calc && calc.final > 0;

  const descricao = useMemo(
    () =>
      `Lona/Banner ${opcaoSel?.label ?? ''}${laca ? ' + laca' : ''} ${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m${
        qtd > 1 ? ` (${qtd}un)` : ''
      }`,
    [opcaoSel, laca, larguraNum, alturaNum, qtd]
  );

  const handleCopy = () => {
    if (!temPreco || !calc) return;
    const texto = `${opcaoSel?.label ?? 'Lona/Banner'}${laca ? ' + Laca de Proteção' : ''}
Medida: ${larguraNum.toFixed(2)} x ${alturaNum.toFixed(2)} m — ${qtd} un
Valor: ${formatCurrency(calc.final)}`;
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
              {opcoes.length === 0 ? (
                <span className="text-sm text-gray-500">Nenhum acabamento cadastrado — adicione em Configurações.</span>
              ) : opcoes.map((o) => (
                <button key={o.id} type="button" onClick={() => setAcabamentoId(o.id)} className={btn(acabamentoId === o.id)}>
                  {o.label} — {formatCurrency(o.price)}/m²
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

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={incluirNota} onChange={(e) => setIncluirNota(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              Emitir com nota fiscal ({ALIQUOTA_NF.toLocaleString('pt-BR')}%)
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
                <div className="text-xs uppercase tracking-wide text-gray-500">Preço de venda</div>
                <div className="text-3xl font-bold text-blue-600">{formatCurrency(calc.final)}</div>
                {incluirNota ? (
                  <div className="mt-1 text-xs text-gray-500">Nota fiscal ({ALIQUOTA_NF.toLocaleString('pt-BR')}%) incluída</div>
                ) : (
                  <div className="mt-1 text-xs text-amber-600 font-medium">
                    Sem nota fiscal — desconto de {formatCurrency(calc.descontoNota)} ({ALIQUOTA_NF.toLocaleString('pt-BR')}%)
                  </div>
                )}
                {qtd > 1 && (
                  <div className="mt-1 text-xs text-green-600 font-medium">
                    {qtd} un · unitário {formatCurrency(calc.final / qtd)}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-600"><span>Acabamento:</span><span>{opcaoSel?.label}</span></div>
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
