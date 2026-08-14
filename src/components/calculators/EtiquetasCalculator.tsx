import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { useDeslocamentoCep } from '../../hooks/useDeslocamentoCep';
import DeslocamentoField from './DeslocamentoField';
import { toast } from 'sonner';

// Calculadora de Etiquetas/Rótulos — preço por combinação tamanho × quantidade
// (lotes fechados), vindo do motor da skill (Edge Function calc-etiquetas →
// calc_etiquetas). Diferente dos outros produtos, os preços continuam vindo da
// skill (a pedido do Étto, para manter o desconto por volume dos lotes); o app só
// (1) mostra tamanhos e lotes como botões pastel (sem menu suspenso) e (2) aplica
// um piso de R$0,25 por unidade.
interface EtiqResult {
  tamanho_encontrado?: string;
  quantidade_encontrada?: number | string;
  custo_total?: number | string;
  custo_deslocamento?: number | string;
  deslocamento_incluido?: boolean;
  preco_final?: number | string | null;
  preco_com_nota?: number | string | null;
  alerta?: string;
}

interface Combo {
  tamanho: string;
  quantidade: number;
}

// Piso mínimo por etiqueta (a pedido do Étto): nenhum rótulo sai abaixo disto.
const PISO_POR_UNIDADE = 0.25;

const num = (v: number | string | undefined | null): number => Number(v ?? 0);

// Boxes com preenchimento pastel (tonalidade suave) para facilitar a leitura.
const btn = (active: boolean) =>
  `px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
    active
      ? 'bg-indigo-100 border-indigo-400 text-indigo-800 shadow-sm'
      : 'bg-indigo-50/60 border-indigo-200 text-gray-700 hover:bg-indigo-100/70'
  }`;

const EtiquetasCalculator: React.FC = () => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [tamanho, setTamanho] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number | ''>('');
  const deslocamento = useDeslocamentoCep();
  const { incluirDeslocamento, custoDeslocamento } = deslocamento;

  const [result, setResult] = useState<EtiqResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

  // Tamanhos distintos e quantidades disponíveis para o tamanho escolhido.
  const tamanhos = useMemo(() => [...new Set(combos.map((c) => c.tamanho))], [combos]);
  const quantidades = useMemo(
    () => combos.filter((c) => c.tamanho === tamanho).map((c) => c.quantidade),
    [combos, tamanho]
  );

  const entradaValida = tamanho !== '' && quantidade !== '';
  const custoDeslocamentoNum = parseFloat(custoDeslocamento) || 0;

  // Carrega os combos do motor (uma vez).
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('calc-etiquetas', {
          body: { action: 'meta' },
        });
        if (!ativo) return;
        if (!error && Array.isArray(data?.combos) && data.combos.length > 0) {
          setCombos(data.combos);
          setTamanho((t) => t || data.combos[0].tamanho);
        }
      } catch {
        /* sem combos */
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Ao trocar de tamanho, garante uma quantidade válida (primeira disponível).
  useEffect(() => {
    if (quantidades.length === 0) return;
    setQuantidade((q) => (q !== '' && quantidades.includes(Number(q)) ? q : quantidades[0]));
  }, [quantidades]);

  // Recalcula (com debounce).
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
        const { data, error } = await supabase.functions.invoke('calc-etiquetas', {
          body: {
            tamanho,
            quantidade: Number(quantidade),
            incluirDeslocamento,
            custoDeslocamento: custoDeslocamentoNum,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResult((data?.resultado as EtiqResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao calcular o preço.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [tamanho, quantidade, incluirDeslocamento, custoDeslocamentoNum, entradaValida]);

  // Preço com o piso de R$0,25/unidade aplicado. O piso incide sobre o preço da
  // etiqueta; se o cálculo do motor já for maior, mantém o do motor.
  const precos = useMemo(() => {
    if (!result || result.preco_final == null || num(result.preco_final) <= 0) return null;
    const qtd = Number(quantidade) || 0;
    const motorSemNota = num(result.preco_final);
    const fator = motorSemNota > 0 ? num(result.preco_com_nota) / motorSemNota : 1.0931;
    const piso = PISO_POR_UNIDADE * qtd;
    const pisoAplicado = piso > motorSemNota;
    const semNota = Math.max(motorSemNota, piso);
    const comNota = pisoAplicado ? semNota * fator : num(result.preco_com_nota);
    return { semNota, comNota, pisoAplicado };
  }, [result, quantidade]);

  const temPreco = !!precos && precos.semNota > 0;

  const descricao = useMemo(() => `Etiquetas ${tamanho} — ${quantidade} un`, [tamanho, quantidade]);

  const handleCopy = () => {
    if (!temPreco || !precos) return;
    const texto = `Orçamento Etiquetas/Rótulos
Tamanho: ${tamanho} — Quantidade: ${quantidade} un

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Etiquetas / Rótulos</h2>
        <p className="text-gray-600">
          Preço por tamanho e quantidade (lotes fechados), com mínimo de {formatCurrency(PISO_POR_UNIDADE)} por unidade.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tamanho</label>
            {tamanhos.length === 0 ? (
              <span className="text-sm text-gray-500">Carregando…</span>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {tamanhos.map((t) => (
                  <button key={t} type="button" onClick={() => setTamanho(t)} className={btn(tamanho === t)}>
                    {t}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Quantidade (lote)</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quantidades.map((q) => (
                <button key={q} type="button" onClick={() => setQuantidade(q)} className={btn(Number(quantidade) === q)}>
                  {q} un
                </button>
              ))}
            </div>
          </div>

          <DeslocamentoField {...deslocamento} />
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento</h3>

          {!entradaValida ? (
            <p className="text-sm text-gray-500">Escolha o tamanho e a quantidade para ver o preço.</p>
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
                    <div className="mt-1 text-sm text-orange-600 font-medium">Com nota fiscal: {formatCurrency(precos.comNota)}</div>
                    {Number(quantidade) > 0 && (
                      <div className="mt-1 text-xs text-green-600 font-medium">
                        {Number(quantidade)} un · unitário {formatCurrency(precos.semNota / Number(quantidade))}
                      </div>
                    )}
                    {precos.pisoAplicado && (
                      <div className="mt-1 text-xs text-amber-600 font-medium">
                        Mínimo de {formatCurrency(PISO_POR_UNIDADE)}/unidade aplicado.
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-600"><span>Tamanho:</span><span>{result.tamanho_encontrado}</span></div>
                    <div className="flex justify-between text-sm text-gray-600"><span>Quantidade:</span><span>{num(result.quantidade_encontrada)} un</span></div>
                    {incluirDeslocamento && num(result.custo_deslocamento) > 0 && (
                      <div className="flex justify-between text-sm text-gray-600"><span>Deslocamento:</span><span>{formatCurrency(num(result.custo_deslocamento))}</span></div>
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

export default EtiquetasCalculator;
