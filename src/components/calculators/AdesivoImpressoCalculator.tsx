import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { toast } from 'sonner';

// Calculadora de Adesivo Impresso — preço do motor da skill (Edge Function
// calc-adesivo-impresso → calc_adesivo_impresso). Por m² com acabamento,
// aproveitamento do vinil e deslocamento por cidade. Quantidade por reconstrução.
interface AdesivoResult {
  acabamento_encontrado?: string;
  area_m2?: number | string;
  aproveitamento_pct?: number | string;
  area_cobrada_m2?: number | string;
  preco_m2?: number | string;
  adicional_laca_uv?: number | string;
  custo_deslocamento?: number | string;
  preco_minimo_projeto?: number | string;
  preco_final?: number | string | null;
  preco_com_nota?: number | string | null;
  alerta?: string;
}

interface Opcao {
  acabamento: string;
  nome: string;
  preco_venda_m2: number | string;
}

const num = (v: number | string | undefined | null): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const AdesivoImpressoCalculator: React.FC = () => {
  const [opcoes, setOpcoes] = useState<Opcao[]>([]);
  const [cidades, setCidades] = useState<string[]>([]);
  const [acabamento, setAcabamento] = useState<string>('');
  const [cidade, setCidade] = useState<string>('Jacareí');
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [aproveitamento, setAproveitamento] = useState<string>('100');
  const [laca, setLaca] = useState<boolean>(false);

  const [result, setResult] = useState<AdesivoResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const aproveitamentoNum = parseFloat(aproveitamento) || 0;
  const entradaValida = larguraNum > 0 && alturaNum > 0 && acabamento !== '';

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('calc-adesivo-impresso', {
          body: { action: 'meta' },
        });
        if (!ativo) return;
        if (!error && data) {
          if (Array.isArray(data.opcoes) && data.opcoes.length > 0) {
            setOpcoes(data.opcoes);
            setAcabamento((a) => a || data.opcoes[0].acabamento);
          }
          if (Array.isArray(data.cidades) && data.cidades.length > 0) {
            setCidades(data.cidades);
            setCidade((c) => (data.cidades.includes(c) ? c : data.cidades[0]));
          }
        }
      } catch {
        /* sem meta */
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!entradaValida) {
      setResult(null);
      setError(null);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke('calc-adesivo-impresso', {
          body: {
            acabamento,
            laca,
            largura: larguraNum,
            altura: alturaNum,
            cidade,
            aproveitamento: aproveitamentoNum > 0 ? aproveitamentoNum : undefined,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResult((data?.resultado as AdesivoResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao calcular o preço.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [acabamento, laca, larguraNum, alturaNum, cidade, aproveitamentoNum, entradaValida]);

  // Quantidade por reconstrução: preço unitário (que já inclui o deslocamento)
  // multiplica pela qtd, e o deslocamento é cobrado uma única vez no pedido.
  const precos = useMemo(() => {
    if (!result || result.preco_final == null) return null;
    const unit = num(result.preco_final);
    const desloc = num(result.custo_deslocamento);
    const semNota = (unit - desloc) * quantidade + desloc;
    const fatorNF = unit > 0 ? num(result.preco_com_nota) / unit : 1;
    return { semNota, comNota: semNota * fatorNF };
  }, [result, quantidade]);

  const temPreco = !!precos && precos.semNota > 0;
  const nomeAcab = opcoes.find((o) => o.acabamento === acabamento)?.nome ?? acabamento;

  const descricao = useMemo(
    () =>
      `Adesivo impresso ${nomeAcab}${laca ? ' + laca UV' : ''} ${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m${
        quantidade > 1 ? ` (${quantidade}un)` : ''
      }`,
    [nomeAcab, laca, larguraNum, alturaNum, quantidade]
  );

  const handleCopy = () => {
    if (!temPreco || !precos) return;
    const texto = `Orçamento Adesivo Impresso — ${nomeAcab}${laca ? ' + Laca de Proteção (UV)' : ''}
Dimensões: ${larguraNum.toFixed(2)} x ${alturaNum.toFixed(2)} m — ${quantidade} un
Cidade: ${cidade}

Preço (sem nota fiscal): ${formatCurrency(precos.semNota)}
Preço (com nota fiscal): ${formatCurrency(precos.comNota)}`;
    navigator.clipboard.writeText(texto).then(
      () => toast.success('Orçamento copiado!'),
      () => toast.error('Não foi possível copiar.')
    );
  };

  const handleAddCotacao = () => {
    if (!temPreco || !precos) return;
    addItem({ descricao, precoSemNota: precos.semNota, precoComNota: precos.comNota });
    toast.success('Adicionado à cotação!');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Adesivo Impresso</h2>
        <p className="text-gray-600">
          Adesivo impresso por m², com acabamento e aproveitamento do vinil. Preço do motor de
          precificação.
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
                <input type="number" min="1" value={quantidade || ''} onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)} className={inputClass} placeholder="1" />
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="acab-ad" className="block text-sm font-medium text-gray-700 mb-3">Acabamento</label>
            <select id="acab-ad" value={acabamento} onChange={(e) => setAcabamento(e.target.value)} className={inputClass}>
              {opcoes.length === 0 && <option value="">Carregando…</option>}
              {opcoes.map((o) => (
                <option key={o.acabamento} value={o.acabamento}>
                  {o.nome} — {formatCurrency(num(o.preco_venda_m2))}/m²
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="aprov-ad" className="block text-sm font-medium text-gray-700 mb-3">Aproveitamento do vinil (%)</label>
              <input id="aprov-ad" type="number" min="1" max="100" step="1" value={aproveitamento} onChange={(e) => setAproveitamento(e.target.value)} className={inputClass} placeholder="100" />
              <p className="text-xs text-gray-500 mt-1">100% = sólido. Menor % cobra mais área de vinil.</p>
            </div>
            <div>
              <label htmlFor="cidade-ad" className="block text-sm font-medium text-gray-700 mb-3">Cidade (instalação)</label>
              <select id="cidade-ad" value={cidade} onChange={(e) => setCidade(e.target.value)} className={inputClass}>
                {cidades.length === 0 && <option value="Jacareí">Jacareí</option>}
                {cidades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={laca} onChange={(e) => setLaca(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <span className="text-sm font-medium text-gray-700">Laca de Proteção (UV)</span>
          </label>
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento</h3>

          {!entradaValida ? (
            <p className="text-sm text-gray-500">Informe as dimensões e o acabamento para ver o preço.</p>
          ) : loading ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" /> Calculando…
            </div>
          ) : error ? (
            <div className="flex items-start gap-2 text-sm text-red-600">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          ) : result ? (
            <div className="space-y-4">
              {result.alerta && result.alerta.trim() !== '' && (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{result.alerta}</span>
                </div>
              )}

              {temPreco && precos && (
                <>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500">Preço de venda (sem nota fiscal)</div>
                    <div className="text-3xl font-bold text-blue-600">{formatCurrency(precos.semNota)}</div>
                    <div className="mt-1 text-sm text-gray-600">Com nota fiscal: {formatCurrency(precos.comNota)}</div>
                    {quantidade > 1 && (
                      <div className="mt-1 text-xs text-gray-500">
                        {quantidade} un · unitário {formatCurrency(precos.semNota / quantidade)} ({formatCurrency(precos.comNota / quantidade)} c/ nota)
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-600"><span>Acabamento:</span><span className="text-right">{result.acabamento_encontrado}</span></div>
                    <div className="flex justify-between text-sm text-gray-600"><span>Preço/m²:</span><span>{formatCurrency(num(result.preco_m2))}</span></div>
                    <div className="flex justify-between text-sm text-gray-600"><span>Área cobrada (un):</span><span>{num(result.area_cobrada_m2).toFixed(2)} m²</span></div>
                    {laca && num(result.adicional_laca_uv) > 0 && (
                      <div className="flex justify-between text-sm text-gray-600"><span>Laca de proteção UV:</span><span>{formatCurrency(num(result.adicional_laca_uv) * quantidade)}</span></div>
                    )}
                    {num(result.custo_deslocamento) > 0 && (
                      <div className="flex justify-between text-sm text-gray-600"><span>Deslocamento ({cidade}):</span><span>{formatCurrency(num(result.custo_deslocamento))}</span></div>
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
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AdesivoImpressoCalculator;
