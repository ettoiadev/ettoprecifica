import React, { useEffect, useMemo, useState } from 'react';
import { Copy, PlusCircle } from 'lucide-react';
import { formatCurrency, ALIQUOTA_NF, DtfConfig, ProductVariation } from '../../types/pricing';
import { useCotacao } from '../../contexts/CotacaoContext';
import { toast } from 'sonner';

// DTF com preço MANUAL, definido em Configurações (config.dtf), NÃO pelo motor da
// skill. Cobrado por METRO LINEAR. Os tipos (nome/descrição=largura/preço/ordem)
// vêm da lista editável `config.dtf.itens`. "Uber" (busca do material) é um
// adicional opcional de valor editável. Sem deslocamento. O preço com nota sai de
// um percentual único.
interface Props {
  config: DtfConfig;
}

// Mínimo de impressão (metros lineares) por tipo, por id. O DTF UV tem mínimo de
// 35cm; cobra o equivalente quando o pedido é menor. (Mapa por id: renomear o tipo
// mantém o mínimo; um tipo novo/reincluído fica sem mínimo até ser mapeado aqui.)
const MIN_METROS: Record<string, number> = { uvPremium: 0.35 };

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

// Boxes com preenchimento pastel (tonalidade suave) para facilitar a leitura.
const btn = (active: boolean) =>
  `text-left px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
    active
      ? 'bg-indigo-100 border-indigo-400 text-indigo-800 shadow-sm'
      : 'bg-indigo-50/60 border-indigo-200 text-gray-700 hover:bg-indigo-100/70'
  }`;

const DtfManualCalculator: React.FC<Props> = ({ config }) => {
  const opcoes = useMemo<ProductVariation[]>(() => config.itens ?? [], [config.itens]);
  const [tipo, setTipo] = useState<string>(opcoes[0]?.id ?? '');
  const [metros, setMetros] = useState<string>('');
  const [incluirUber, setIncluirUber] = useState<boolean>(true);
  const [incluirNota, setIncluirNota] = useState<boolean>(true);

  const { addItem } = useCotacao();

  useEffect(() => {
    if (opcoes.length === 0) return;
    if (!opcoes.some((o) => o.id === tipo)) setTipo(opcoes[0].id);
  }, [opcoes, tipo]);

  const metrosNum = parseFloat(metros) || 0;
  const entradaValida = metrosNum > 0;

  const opcaoSel = opcoes.find((o) => o.id === tipo) ?? opcoes[0];
  const precoMetro = opcaoSel?.price ?? 0;
  const minMetros = MIN_METROS[opcaoSel?.id ?? ''] ?? 0;
  const uberValor = config.uberValor || 0;

  const calc = useMemo(() => {
    if (!entradaValida || !opcaoSel) return null;
    // Aplica o mínimo de impressão do tipo (ex.: DTF UV = 35cm): se o pedido é
    // menor, cobra o equivalente ao mínimo automaticamente.
    const metrosCobrados = Math.max(metrosNum, minMetros);
    const minimoAplicado = metrosNum < minMetros;
    const material = precoMetro * metrosCobrados;
    const uber = incluirUber ? uberValor : 0;
    const semNota = material + uber;
    const comNota = (material + uber) * (1 + ALIQUOTA_NF / 100);
    const descontoNota = comNota - semNota;
    const final = incluirNota ? comNota : semNota;
    return { material, uber, semNota, comNota, descontoNota, final, metrosCobrados, minimoAplicado };
  }, [entradaValida, opcaoSel, precoMetro, metrosNum, minMetros, incluirUber, uberValor, incluirNota]);

  const temPreco = !!calc && calc.final > 0;

  const descricao = useMemo(
    () => `DTF ${opcaoSel?.label ?? ''} — ${metrosNum.toFixed(2)}m lineares`,
    [opcaoSel, metrosNum]
  );

  const handleCopy = () => {
    if (!temPreco || !calc) return;
    const texto = `DTF ${opcaoSel?.label ?? ''}
Medida: ${metrosNum.toFixed(2)} m lineares${opcaoSel?.description ? ` (largura ${opcaoSel.description})` : ''}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de DTF</h2>
        <p className="text-gray-600">
          Cobrado por metro linear, conforme o tipo. Preços definidos manualmente em Configurações.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de DTF</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {opcoes.length === 0 ? (
                <span className="text-sm text-gray-500">Nenhum tipo cadastrado — adicione em Configurações.</span>
              ) : opcoes.map((o) => (
                <button key={o.id} type="button" onClick={() => setTipo(o.id)} className={btn(tipo === o.id)}>
                  <div>{o.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">{o.description ? `${o.description} · ` : ''}{formatCurrency(o.price)}/m</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="metros-dtf" className="block text-sm font-medium text-gray-700 mb-3">Metros lineares</label>
            <input id="metros-dtf" type="number" min="0" step="0.1" value={metros} onChange={(e) => setMetros(e.target.value)} className={inputClass} placeholder="0.0" />
            {minMetros > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Mínimo de impressão: {(minMetros * 100).toFixed(0)} cm — pedidos menores são cobrados como {minMetros.toFixed(2)} m.
              </p>
            )}
          </div>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={incluirUber} onChange={(e) => setIncluirUber(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              Incluir Uber para buscar o material ({formatCurrency(uberValor)})
            </span>
          </label>
          <p className="text-xs text-gray-500 -mt-3">
            Desmarque se a busca deste DTF for combinada com outros pedidos na mesma corrida.
          </p>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={incluirNota} onChange={(e) => setIncluirNota(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <span className="text-sm font-medium text-gray-700">
              Emitir com nota fiscal ({ALIQUOTA_NF.toLocaleString('pt-BR')}%)
            </span>
          </label>
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento</h3>

          {!entradaValida ? (
            <p className="text-sm text-gray-500">Escolha o tipo e informe os metros lineares para ver o preço.</p>
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
                {metrosNum > 0 && (
                  <div className="mt-1 text-xs text-green-600 font-medium">
                    {calc.metrosCobrados.toFixed(2)}m · {formatCurrency(precoMetro)}/m
                  </div>
                )}
                {calc.minimoAplicado && (
                  <div className="mt-1 text-xs text-amber-600 font-medium">
                    Mínimo de {(minMetros * 100).toFixed(0)} cm aplicado ({minMetros.toFixed(2)} m).
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-600"><span>Tipo:</span><span className="text-right">{opcaoSel.label}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Material:</span><span>{formatCurrency(calc.material)}</span></div>
                {incluirUber && calc.uber > 0 && (
                  <div className="flex justify-between text-sm text-gray-600"><span>Uber (busca):</span><span>{formatCurrency(calc.uber)}</span></div>
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

export default DtfManualCalculator;
