import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { toast } from 'sonner';

// Calculadora de Gráfica (GIV) — preço do motor da skill (Edge Function
// calc-giv → calc_giv). Produtos de gráfica rápida terceirizados na GIV
// (cartões, panfletos etc.), por produto × tipo × quantidade.
interface GivResult {
  produto_encontrado?: string;
  tipo_encontrado?: string;
  quantidade_encontrada?: number | string;
  custo_giv?: number | string;
  custo_deslocamento?: number | string;
  preco_final?: number | string | null;
  preco_com_nota?: number | string | null;
  alerta?: string;
}

interface Combo {
  produto: string;
  tipo: string | null;
  quantidade: number;
}

const num = (v: number | string | undefined | null): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const GivCalculator: React.FC = () => {
  const [combos, setCombos] = useState<Combo[]>([]);
  const [produto, setProduto] = useState<string>('');
  const [tipo, setTipo] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number | ''>('');

  const [result, setResult] = useState<GivResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

  const produtos = useMemo(() => [...new Set(combos.map((c) => c.produto))], [combos]);
  // Tipos disponíveis para o produto (usa '' para representar "sem tipo").
  const tipos = useMemo(
    () => [...new Set(combos.filter((c) => c.produto === produto).map((c) => c.tipo ?? ''))],
    [combos, produto]
  );
  const quantidades = useMemo(
    () =>
      combos
        .filter((c) => c.produto === produto && (c.tipo ?? '') === tipo)
        .map((c) => c.quantidade),
    [combos, produto, tipo]
  );

  const entradaValida = produto !== '' && quantidade !== '';

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('calc-giv', {
          body: { action: 'meta' },
        });
        if (!ativo) return;
        if (!error && Array.isArray(data?.combos) && data.combos.length > 0) {
          setCombos(data.combos);
          setProduto((p) => p || data.combos[0].produto);
        }
      } catch {
        /* sem combos */
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Ao trocar de produto, garante um tipo válido.
  useEffect(() => {
    if (tipos.length === 0) return;
    setTipo((t) => (tipos.includes(t) ? t : tipos[0]));
  }, [tipos]);

  // Ao trocar de tipo, garante uma quantidade válida.
  useEffect(() => {
    if (quantidades.length === 0) return;
    setQuantidade((q) => (q !== '' && quantidades.includes(Number(q)) ? q : quantidades[0]));
  }, [quantidades]);

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
        const { data, error } = await supabase.functions.invoke('calc-giv', {
          body: { produto, tipo: tipo || undefined, quantidade: Number(quantidade) },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResult((data?.resultado as GivResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao calcular o preço.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [produto, tipo, quantidade, entradaValida]);

  const temPreco = !!result && result.preco_final != null && num(result.preco_final) > 0;

  const descricao = useMemo(
    () => `${produto}${tipo ? ` ${tipo}` : ''} — ${quantidade} un`,
    [produto, tipo, quantidade]
  );

  const handleCopy = () => {
    if (!temPreco || !result) return;
    const texto = `Orçamento Gráfica (GIV)
${produto}${tipo ? ` — ${tipo}` : ''} — ${quantidade} un

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Gráfica (GIV)</h2>
        <p className="text-gray-600">
          Produtos de gráfica rápida (cartões, panfletos) por produto, tipo e quantidade. Preço do
          motor de precificação.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label htmlFor="produto-giv" className="block text-sm font-medium text-gray-700 mb-3">
              Produto
            </label>
            <select
              id="produto-giv"
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              className={inputClass}
            >
              {produtos.length === 0 && <option value="">Carregando…</option>}
              {produtos.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {tipos.length > 0 && !(tipos.length === 1 && tipos[0] === '') && (
            <div>
              <label htmlFor="tipo-giv" className="block text-sm font-medium text-gray-700 mb-3">
                Tipo / cores
              </label>
              <select
                id="tipo-giv"
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className={inputClass}
              >
                {tipos.map((t) => (
                  <option key={t || 'sem'} value={t}>
                    {t || 'Padrão'}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="qtd-giv" className="block text-sm font-medium text-gray-700 mb-3">
              Quantidade
            </label>
            <select
              id="qtd-giv"
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
            <p className="text-sm text-gray-500">Escolha o produto e a quantidade para ver o preço.</p>
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
                      <span>Produto:</span>
                      <span className="text-right">{result.produto_encontrado}</span>
                    </div>
                    {result.tipo_encontrado && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Tipo:</span>
                        <span>{result.tipo_encontrado}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Quantidade:</span>
                      <span>{num(result.quantidade_encontrada)} un</span>
                    </div>
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

export default GivCalculator;
