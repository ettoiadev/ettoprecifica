import React, { useEffect, useMemo, useState } from 'react';
import { Copy, PlusCircle } from 'lucide-react';
import { formatCurrency, ALIQUOTA_NF, LaserConfig, ProductVariation } from '../../types/pricing';
import { useCotacao } from '../../contexts/CotacaoContext';
import { useDeslocamentoCep } from '../../hooks/useDeslocamentoCep';
import DeslocamentoField from './DeslocamentoField';
import { toast } from 'sonner';

// Laser com preço MANUAL, definido em Configurações (config.laser), NÃO pelo motor
// da skill. Os materiais (nome/categoria/preço/ordem) vêm da lista editável
// `config.laser.itens`, agrupados por categoria na UI. Modelo simples área × R$/m².
// Deslocamento opcional pelo fluxo por CEP, somado à parte (sem incidência de NF).
interface Props {
  config: LaserConfig;
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

const LaserManualCalculator: React.FC<Props> = ({ config }) => {
  const deslocamento = useDeslocamentoCep();
  const { incluirDeslocamento, custoDeslocamento } = deslocamento;
  const opcoes = useMemo<ProductVariation[]>(() => config.itens ?? [], [config.itens]);
  const [material, setMaterial] = useState<string>(opcoes[0]?.id ?? '');
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [incluirNota, setIncluirNota] = useState<boolean>(true);

  const { addItem } = useCotacao();

  useEffect(() => {
    if (opcoes.length === 0) return;
    if (!opcoes.some((o) => o.id === material)) setMaterial(opcoes[0].id);
  }, [opcoes, material]);

  // Agrupa por categoria para renderizar os botões em seções (mantém a ordem).
  const grupos = useMemo(() => {
    const map = new Map<string, ProductVariation[]>();
    for (const o of opcoes) {
      const cat = o.category || 'Outros';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(o);
    }
    return Array.from(map.entries());
  }, [opcoes]);

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const qtd = quantidade > 0 ? quantidade : 1;
  const custoDeslocamentoNum = parseFloat(custoDeslocamento) || 0;
  const entradaValida = larguraNum > 0 && alturaNum > 0;

  const opcaoSel = opcoes.find((o) => o.id === material) ?? opcoes[0];
  const precoM2 = opcaoSel?.price ?? 0;

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
    return { areaUnit, areaTotal, produtoSemNota, desloc, semNota, comNota, descontoNota, final };
  }, [entradaValida, larguraNum, alturaNum, qtd, precoM2, incluirDeslocamento, custoDeslocamentoNum, incluirNota]);

  const temPreco = !!calc && calc.final > 0;

  const descricao = useMemo(
    () => `Laser ${opcaoSel?.label ?? ''} ${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m${qtd > 1 ? ` (${qtd}un)` : ''}`,
    [opcaoSel, larguraNum, alturaNum, qtd]
  );

  const handleCopy = () => {
    if (!temPreco || !calc) return;
    const texto = `${opcaoSel?.label ?? 'Laser'}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Laser</h2>
        <p className="text-gray-600">
          Corte a laser por m², conforme o material. Preços definidos manualmente em Configurações.
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
            <label className="block text-sm font-medium text-gray-700 mb-3">Material</label>
            {opcoes.length === 0 ? (
              <span className="text-sm text-gray-500">Nenhum material cadastrado — adicione em Configurações.</span>
            ) : (
              <div className="space-y-4">
                {grupos.map(([cat, itens]) => (
                  <div key={cat}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{cat}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {itens.map((o) => (
                        <button key={o.id} type="button" onClick={() => setMaterial(o.id)} className={btn(material === o.id)}>
                          <div>{o.label}</div>
                          <div className="text-xs opacity-70 mt-0.5">{o.description ? `${o.description} · ` : ''}{formatCurrency(o.price)}/m²</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

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
          ) : temPreco && calc && opcaoSel ? (
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
                <div className="flex justify-between text-sm text-gray-600"><span>Material:</span><span className="text-right">{opcaoSel.label}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Preço/m²:</span><span>{formatCurrency(precoM2)}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Área (un):</span><span>{calc.areaUnit.toFixed(3)} m²</span></div>
                {qtd > 1 && (
                  <div className="flex justify-between text-sm text-gray-600"><span>Área total:</span><span>{calc.areaTotal.toFixed(3)} m²</span></div>
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

export default LaserManualCalculator;
