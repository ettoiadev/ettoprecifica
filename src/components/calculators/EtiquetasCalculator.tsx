import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { toast } from 'sonner';

// Calculadora de Etiquetas/Rótulos — preço do motor da skill (Edge Function
// calc-etiquetas → calc_etiquetas). Preço por combinação tamanho × quantidade.
interface EtiqResult {
  tamanho_encontrado?: string;
  quantidade_encontrada?: number | string;
  custo_total?: number | string;
  custo_deslocamento?: number | string;
  preco_final?: number | string | null;
  preco_com_nota?: number | string | null;
  alerta?: string;
}

interface Combo {
  tamanho: string;
  quantidade: number;
}

const num = (v: number | string | undefined | null): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const EtiquetasCalculator: React.FC = () => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [tamanho, setTamanho] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number | ''>('');

  const [result, setResult] = useState<EtiqResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

  // Tamanhos distintos e quantidades disponíveis para o tamanho escolhido.
  const tamanhos = useMemo(
    () => [...new Set(combos.map((c) => c.tamanho))],
    [combos]
  );
  const quantidades = useMemo(
    () => combos.filter((c) => c.tamanho === tamanho).map((c) => c.quantidade),
    [combos, tamanho]
  );

  const entradaValida = tamanho !== '' && quantidade !== '';

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
          body: { tamanho, quantidade: Number(quantidade) },
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
  }, [tamanho, quantidade, entradaValida]);

  const temPreco = !!result && result.preco_final != null && num(result.preco_final) > 0;

  const descricao = useMemo(
    () => `Etiquetas ${tamanho} — ${quantidade} un`,
    [tamanho, quantidade]
  );

  const handleCopy = () => {
    if (!temPreco || !result) return;
    const texto = `Orçamento Etiquetas/Rótulos
Tamanho: ${tamanho} — Quantidade: ${quantidade} un

Preço (sem nota fiscal): ${formatCurrency(num(result.preco_final))}
Preço (com nota fiscal): ${formatCurrency(num(result.preco_com_nota))}`;
    navigator.clipboard.writeText(texto).then(
      () => toast.success('Orçamento copiado!'),
      () => toast.error('Não foi possível copiar.')
    );
  };

  const handleAddCotacao = () => {
    if (!temPreco || !result) return;
    addItem({
      descricao,
      precoSemNota: num(result.preco_final),
      precoComNota: num(result.preco_com_nota),
    });
    toast.success('Adicionado à cotação!');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Etiquetas / Rótulos</h2>
        <p className="text-gray-600">
          Preço por tamanho e quantidade (fechados por lote). Preço do motor de precificação.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label htmlFor="tamanho-etiq" className="block text-sm font-medium text-gray-700 mb-3">
              Tamanho
            </label>
            <select
              id="tamanho-etiq"
              value={tamanho}
              onChange={(e) => setTamanho(e.target.value)}
              className={inputClass}
            >
              {tamanhos.length === 0 && <option value="">Carregando…</option>}
              {tamanhos.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="qtd-etiq" className="block text-sm font-medium text-gray-700 mb-3">
              Quantidade
            </label>
            <select
              id="qtd-etiq"
              value={quantidade}
              onChange={(e) => setQuantidade(Number(e.target.value))}
              className={inputClass}
            >
              {quantidades.map((q) => (
                <option key={q} value={q}>
                  {q} unidades
                </option>
              ))}
            </select>
          </div>
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

              {temPreco && (
                <>
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500">
                      Preço de venda (sem nota fiscal)
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {formatCurrency(num(result.preco_final))}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Com nota fiscal: {formatCurrency(num(result.preco_com_nota))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tamanho:</span>
                      <span>{result.tamanho_encontrado}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Quantidade:</span>
                      <span>{num(result.quantidade_encontrada)} un</span>
                    </div>
                    {num(result.preco_final) > 0 && num(result.quantidade_encontrada) > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Unitário:</span>
                        <span>
                          {formatCurrency(num(result.preco_final) / num(result.quantidade_encontrada))}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={handleAddCotacao}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-blue-600 text-blue-600 text-sm font-medium hover:bg-blue-50 transition-colors"
                    >
                      <PlusCircle className="w-4 h-4" /> Adicionar à cotação
                    </button>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
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
