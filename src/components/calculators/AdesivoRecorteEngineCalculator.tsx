import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { useDeslocamentoCep } from '../../hooks/useDeslocamentoCep';
import DeslocamentoField from './DeslocamentoField';
import { toast } from 'sonner';

// Painel de Adesivo de RECORTE precificado pelo MOTOR da skill (calc_adesivo_recorte
// via Edge Function calc-adesivo-recorte). É a exceção dentro da aba Adesivos: os
// tipos "Adesivo Recorte 1 Cor" e "Adesivo Recorte 2 Cores" voltaram ao motor (a
// pedido do Étto), enquanto os demais adesivos continuam com preço manual. O nº de
// cores é fixado pelo tipo selecionado (prop `cores`), então o seletor de cores da
// versão antiga não aparece aqui. Segue o padrão novo de NF: caixa "Emitir com
// nota fiscal" (ligada por padrão) e cópia limpa (título + medida + valor). Aqui a
// NF é a do motor (×1,0931 já embutida em preco_final_com_nota), não a constante
// dos manuais.

// Resultado retornado por calc_adesivo_recorte. Campos numéricos podem chegar como string.
interface RecorteResult {
  produto_encontrado?: string | null;
  area_adesivo_m2?: number | string;
  custo_material?: number | string;
  custo_corte_plotter?: number | string;
  usa_mascara?: boolean;
  custo_mascara?: number | string;
  cores?: number;
  produto_cor2_encontrado?: string | null;
  area_cor2_m2?: number | string;
  custo_material_cor2?: number | string;
  custo_corte_cor2?: number | string;
  custo_mascara_cor2?: number | string;
  custo_registro_2cores?: number | string;
  custo_deslocamento?: number | string;
  custo_total?: number | string;
  motor_usado?: string;
  preco_final?: number | string;
  preco_final_com_nota?: number | string;
  alerta?: string;
}

interface Material {
  nome: string;
  uso: string;
  largura_rolo_m: number | string;
}

interface Props {
  // Número de cores fixado pelo tipo selecionado (1 = "Recorte 1 Cor", 2 = "2 Cores").
  cores: 1 | 2;
  // Rótulo do tipo (vem da lista editável), usado na descrição/cópia.
  titulo: string;
}

const USO_LABEL: Record<string, string> = {
  interno: 'Interno',
  externo: 'Externo',
  externo_auto: 'Automotivo',
};

const num = (v: number | string | undefined | null): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const AdesivoRecorteEngineCalculator: React.FC<Props> = ({ cores, titulo }) => {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [produto, setProduto] = useState<string>('');
  const [modo, setModo] = useState<'medida' | 'linear'>('medida');
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [metrosLineares, setMetrosLineares] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  // Aproveitamento do vinil fixo em 100% (a pedido do Étto) — sem opções na UI.
  const percentual = 100;
  const [comMascara, setComMascara] = useState<boolean>(false);
  const [produtoCor2, setProdutoCor2] = useState<string>('');
  const [percentualCor2, setPercentualCor2] = useState<number>(90);
  const [incluirNota, setIncluirNota] = useState<boolean>(true);
  const deslocamento = useDeslocamentoCep();
  const { incluirDeslocamento, custoDeslocamento } = deslocamento;

  const [result, setResult] = useState<RecorteResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const metrosLinearesNum = parseFloat(metrosLineares) || 0;
  const custoDeslocamentoNum = parseFloat(custoDeslocamento) || 0;
  const qtd = quantidade > 0 ? quantidade : 1;

  // Largura do rolo do material selecionado (m). No modo linear, a área de vinil =
  // metros lineares × largura do rolo (o motor precifica por área m²).
  const larguraRolo = num(materiais.find((m) => m.nome === produto)?.largura_rolo_m);

  const areaUnit =
    modo === 'linear' ? metrosLinearesNum * larguraRolo : larguraNum * alturaNum * (percentual / 100);
  const areaTotal = areaUnit * qtd;

  const entradaValida =
    modo === 'linear' ? metrosLinearesNum > 0 && larguraRolo > 0 : larguraNum > 0 && alturaNum > 0;

  // Carrega materiais do motor (uma vez).
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('calc-adesivo-recorte', {
          body: { action: 'materiais' },
        });
        if (!ativo) return;
        if (!error && Array.isArray(data?.materiais) && data.materiais.length > 0) {
          setMateriais(data.materiais);
          setProduto((p) => p || data.materiais[0].nome);
        }
      } catch {
        /* mantém estado atual */
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Recalcula (com debounce) sempre que entradas mudarem.
  useEffect(() => {
    if (!produto || !entradaValida) {
      setResult(null);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const cor2 =
          cores === 2 ? { cores: 2, produtoCor2: produtoCor2 || undefined, percentualCor2 } : {};
        const body = {
          produto,
          area: areaTotal,
          mascara: comMascara,
          incluirDeslocamento,
          custoDeslocamento: custoDeslocamentoNum,
          ...cor2,
        };
        const { data, error } = await supabase.functions.invoke('calc-adesivo-recorte', { body });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResult((data?.resultado as RecorteResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao calcular o preço.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [produto, entradaValida, areaTotal, comMascara, cores, produtoCor2, percentualCor2, incluirDeslocamento, custoDeslocamentoNum]);

  // preco_final/preco_final_com_nota já vêm prontos do motor (mínimo de projeto e
  // escolha do motor já aplicados lá). final = escolha da caixa de NF.
  const precos = useMemo(() => {
    if (!result) return null;
    const semNota = num(result.preco_final);
    const comNota = num(result.preco_final_com_nota);
    return {
      semNota,
      comNota,
      descontoNota: comNota - semNota,
      final: incluirNota ? comNota : semNota,
    };
  }, [result, incluirNota]);

  const materiaisPorUso = useMemo(() => {
    const grupos: Record<string, Material[]> = {};
    for (const m of materiais) {
      (grupos[m.uso] ??= []).push(m);
    }
    return grupos;
  }, [materiais]);

  const unidadeTexto =
    modo === 'linear'
      ? `${metrosLinearesNum.toFixed(2)} m lineares`
      : `${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m`;
  const qtdPrefixo = qtd > 1 ? `${qtd}x ` : '';
  const medidaTexto = `${qtdPrefixo}${unidadeTexto}`;

  const handleCopy = () => {
    if (!result || !precos || !result.produto_encontrado) return;
    const texto = `${titulo}
Medida: ${medidaTexto}
Valor: ${formatCurrency(precos.final)}`;
    navigator.clipboard.writeText(texto).then(
      () => toast.success('Orçamento copiado!'),
      () => toast.error('Não foi possível copiar.')
    );
  };

  const handleAddCotacao = () => {
    if (!result || !precos || !result.produto_encontrado) return;
    addItem({
      descricao: `${titulo} ${medidaTexto}${comMascara ? ' + máscara' : ''}`,
      precoSemNota: precos.semNota,
      precoComNota: precos.comNota,
    });
    toast.success('Adicionado à cotação!');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Entradas */}
      <div className="space-y-6">
        <p className="text-sm text-gray-500">
          Vinil recortado na plotter (letras, logos, cor sólida — sem impressão). O preço vem do
          motor de precificação da tabela real: custo do vinil + corte sobre a área recortada.
        </p>

        <div>
          <label htmlFor="material-rec" className="block text-sm font-medium text-gray-700 mb-3">
            {cores === 2 ? 'Material (1ª cor)' : 'Material'}
          </label>
          <select id="material-rec" value={produto} onChange={(e) => setProduto(e.target.value)} className={inputClass}>
            {materiais.length === 0 && <option value="">Carregando…</option>}
            {Object.entries(materiaisPorUso).map(([uso, itens]) => (
              <optgroup key={uso} label={USO_LABEL[uso] ?? uso}>
                {itens.map((m) => (
                  <option key={m.nome} value={m.nome}>{m.nome}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {cores === 2 && (
          <>
            <div>
              <label htmlFor="material-cor2-rec" className="block text-sm font-medium text-gray-700 mb-3">
                Material da 2ª cor
              </label>
              <select id="material-cor2-rec" value={produtoCor2} onChange={(e) => setProdutoCor2(e.target.value)} className={inputClass}>
                <option value="">Mesma da 1ª cor</option>
                {Object.entries(materiaisPorUso).map(([uso, itens]) => (
                  <optgroup key={uso} label={USO_LABEL[uso] ?? uso}>
                    {itens.map((m) => (
                      <option key={m.nome} value={m.nome}>{m.nome}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="percentual-cor2-rec" className="block text-sm font-medium text-gray-700 mb-3">
                Área da 2ª cor
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="percentual-cor2-rec"
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={percentualCor2}
                  onChange={(e) => {
                    const v = parseInt(e.target.value, 10);
                    setPercentualCor2(Number.isFinite(v) ? Math.min(100, Math.max(1, v)) : 90);
                  }}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <span className="text-sm text-gray-500">
                  % da área da 1ª cor (cada cor gasta quase o mesmo de material). Inclui registro fixo.
                </span>
              </div>
            </div>
          </>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Modo de cálculo</label>
          <div className="grid grid-cols-2 gap-3">
            {([
              { value: 'medida', label: 'Por medida' },
              { value: 'linear', label: 'Medida linear (m)' },
            ] as const).map((mo) => (
              <button
                key={mo.value}
                type="button"
                onClick={() => setModo(mo.value)}
                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                  modo === mo.value
                    ? 'bg-blue-50 border-blue-300 text-blue-700'
                    : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {mo.label}
              </button>
            ))}
          </div>
        </div>

        {modo === 'linear' ? (
          <div>
            <label htmlFor="metros-lineares-rec" className="block text-sm font-medium text-gray-700 mb-3">
              Metros lineares (m)
            </label>
            <input id="metros-lineares-rec" type="number" min="0" step="0.01" value={metrosLineares} onChange={(e) => setMetrosLineares(e.target.value)} className={inputClass} placeholder="0.00" />
            <p className="text-xs text-gray-500 mt-2">
              {larguraRolo > 0
                ? `Rolo de ${larguraRolo.toFixed(2).replace('.', ',')} m de largura${metrosLinearesNum > 0 ? ` — ${metrosLinearesNum.toFixed(2)} m lineares = ${(metrosLinearesNum * larguraRolo).toFixed(3)} m²` : ''}.`
                : 'Selecione o material para calcular a partir da largura do rolo.'}
            </p>
          </div>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Dimensões (retângulo)</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Largura (m)</label>
                  <input type="number" min="0" step="0.01" value={largura} onChange={(e) => setLargura(e.target.value)} className={inputClass} placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Altura (m)</label>
                  <input type="number" min="0" step="0.01" value={altura} onChange={(e) => setAltura(e.target.value)} className={inputClass} placeholder="0.00" />
                </div>
              </div>
            </div>
          </>
        )}

        <div>
          <label htmlFor="quantidade-rec" className="block text-sm font-medium text-gray-700 mb-3">Quantidade</label>
          <div className="flex items-center gap-2">
            <input
              id="quantidade-rec"
              type="number"
              min="1"
              step="1"
              value={quantidade || ''}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10);
                setQuantidade(Number.isFinite(v) && v > 0 ? v : 1);
              }}
              className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <span className="text-sm text-gray-500">unidades iguais — soma a área total (mínimo e registro valem uma vez).</span>
          </div>
        </div>

        <label className="flex items-start gap-3 cursor-pointer p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
          <input type="checkbox" checked={comMascara} onChange={(e) => setComMascara(e.target.checked)} className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
          <span>
            <span className="block text-sm font-medium text-gray-700">Máscara de transferência (papel)</span>
            <span className="block text-xs text-gray-500">Marque quando o recorte for de aplicação (letras/logos que precisam de máscara).</span>
          </span>
        </label>

        <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
          <input type="checkbox" checked={incluirNota} onChange={(e) => setIncluirNota(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
          <span className="text-sm font-medium text-gray-700">Emitir com nota fiscal</span>
        </label>

        <DeslocamentoField {...deslocamento} />
      </div>

      {/* Resultado */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento</h3>

        {!(produto && entradaValida) ? (
          <p className="text-sm text-gray-500">
            Selecione o material e informe {modo === 'linear' ? 'os metros lineares' : 'as dimensões'} para ver o preço.
          </p>
        ) : loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Calculando…
          </div>
        ) : error ? (
          <div className="flex items-start gap-2 text-sm text-red-600">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        ) : result && precos ? (
          !result.produto_encontrado ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{result.alerta || 'Material não encontrado na tabela.'}</span>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Preço de venda</div>
                <div className="text-3xl font-bold text-blue-600">{formatCurrency(precos.final)}</div>
                {incluirNota ? (
                  <div className="mt-1 text-xs text-gray-500">Nota fiscal incluída</div>
                ) : (
                  <div className="mt-1 text-xs text-amber-600 font-medium">
                    Sem nota fiscal — desconto de {formatCurrency(precos.descontoNota)}
                  </div>
                )}
                {qtd > 1 && (
                  <div className="mt-1 text-xs text-green-600 font-medium">
                    {qtd} un · unitário {formatCurrency(precos.final / qtd)}
                  </div>
                )}
              </div>

              {/* Composição (interno) */}
              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>{cores === 2 ? 'Material (1ª cor):' : 'Material:'}</span>
                  <span className="text-right">{result.produto_encontrado}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Área de vinil{qtd > 1 ? ` total (${qtd}×)` : ''}:</span>
                  <span>{num(result.area_adesivo_m2).toFixed(3)} m²</span>
                </div>
                {cores === 2 && (
                  <>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Material (2ª cor):</span>
                      <span className="text-right">{result.produto_cor2_encontrado}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Registro (2 cores):</span>
                      <span>{formatCurrency(num(result.custo_registro_2cores))}</span>
                    </div>
                  </>
                )}
                {result.usa_mascara && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Máscara de transferência:</span>
                    <span>{formatCurrency(num(result.custo_mascara) + num(result.custo_mascara_cor2))}</span>
                  </div>
                )}
                {incluirDeslocamento && num(result.custo_deslocamento) > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Deslocamento:</span>
                    <span>{formatCurrency(num(result.custo_deslocamento))}</span>
                  </div>
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
          )
        ) : null}
      </div>
    </div>
  );
};

export default AdesivoRecorteEngineCalculator;
