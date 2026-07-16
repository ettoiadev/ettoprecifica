import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { toast } from 'sonner';

// Calculadora de DTF — preço do motor da skill (Edge Function calc-dtf →
// calc_dtf). Cobrado por metro linear, com degraus (tiers) de quantidade e
// custo de Uber para buscar o material pronto no fornecedor.
interface DtfResult {
  tipo_encontrado?: string;
  largura_cm?: number | string;
  tier_aplicado?: string;
  custo_metro?: number | string;
  custo_material?: number | string;
  custo_uber_busca?: number | string;
  custo_deslocamento?: number | string;
  custo_total?: number | string;
  preco_sem_nota_60?: number | string | null;
  preco_com_nota_60?: number | string | null;
  alerta?: string;
}

interface TipoDtf {
  tipo: string;
  largura_cm: number;
}

const num = (v: number | string | undefined | null): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const DtfCalculator: React.FC = () => {
  const [tipos, setTipos] = useState<TipoDtf[]>([]);
  const [tipo, setTipo] = useState<string>('');
  const [metros, setMetros] = useState<string>('');
  const [incluirUber, setIncluirUber] = useState<boolean>(true);

  const [result, setResult] = useState<DtfResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

  const metrosNum = parseFloat(metros) || 0;
  const entradaValida = tipo !== '' && metrosNum > 0;
  const larguraTipo = tipos.find((t) => t.tipo === tipo)?.largura_cm;

  // Carrega os tipos de DTF do motor (uma vez).
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('calc-dtf', {
          body: { action: 'meta' },
        });
        if (!ativo) return;
        if (!error && Array.isArray(data?.tipos) && data.tipos.length > 0) {
          setTipos(data.tipos);
          setTipo((t) => t || data.tipos[0].tipo);
        }
      } catch {
        /* sem tipos: campo fica vazio */
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Recalcula (com debounce) quando as entradas mudam.
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
        const { data, error } = await supabase.functions.invoke('calc-dtf', {
          body: { tipo, metros: metrosNum, incluirUber },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResult((data?.resultado as DtfResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao calcular o preço.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [tipo, metrosNum, incluirUber, entradaValida]);

  const temPreco = !!result && result.preco_sem_nota_60 != null && num(result.preco_sem_nota_60) > 0;

  const descricao = useMemo(
    () => `DTF ${tipo} — ${metrosNum.toFixed(2)}m lineares`,
    [tipo, metrosNum]
  );

  const handleCopy = () => {
    if (!temPreco || !result) return;
    const texto = `Orçamento DTF — ${tipo}
Metros lineares: ${metrosNum.toFixed(2)} m${larguraTipo ? ` (largura ${larguraTipo}cm)` : ''}

Preço (sem nota fiscal): ${formatCurrency(num(result.preco_sem_nota_60))}
Preço (com nota fiscal): ${formatCurrency(num(result.preco_com_nota_60))}`;
    navigator.clipboard.writeText(texto).then(
      () => toast.success('Orçamento copiado!'),
      () => toast.error('Não foi possível copiar.')
    );
  };

  const handleAddCotacao = () => {
    if (!temPreco || !result) return;
    addItem({
      descricao,
      precoSemNota: num(result.preco_sem_nota_60),
      precoComNota: num(result.preco_com_nota_60),
    });
    toast.success('Adicionado à cotação!');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de DTF</h2>
        <p className="text-gray-600">
          Cobrado por metro linear, com faixas de quantidade. O preço já considera a busca do
          material no fornecedor (Uber). Preço do motor de precificação.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Entradas */}
        <div className="space-y-6">
          <div>
            <label htmlFor="tipo-dtf" className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de DTF
            </label>
            <select
              id="tipo-dtf"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className={inputClass}
            >
              {tipos.length === 0 && <option value="">Carregando…</option>}
              {tipos.map((t) => (
                <option key={t.tipo} value={t.tipo}>
                  {t.tipo} ({t.largura_cm}cm)
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="metros-dtf" className="block text-sm font-medium text-gray-700 mb-3">
              Metros lineares
            </label>
            <input
              id="metros-dtf"
              type="number"
              min="0"
              step="0.1"
              value={metros}
              onChange={(e) => setMetros(e.target.value)}
              className={inputClass}
              placeholder="0.0"
            />
          </div>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={incluirUber}
              onChange={(e) => setIncluirUber(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Incluir Uber para buscar o material (R$ 20)
            </span>
          </label>
          <p className="text-xs text-gray-500 -mt-3">
            Desmarque se a busca deste DTF for combinada com outros pedidos na mesma corrida.
          </p>
        </div>

        {/* Resultado */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento</h3>

          {!entradaValida ? (
            <p className="text-sm text-gray-500">
              Escolha o tipo e informe os metros lineares para ver o preço.
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
                      {formatCurrency(num(result.preco_sem_nota_60))}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Com nota fiscal: {formatCurrency(num(result.preco_com_nota_60))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tipo:</span>
                      <span>{result.tipo_encontrado}</span>
                    </div>
                    {result.tier_aplicado && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Faixa aplicada:</span>
                        <span>{result.tier_aplicado}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Custo por metro:</span>
                      <span>{formatCurrency(num(result.custo_metro))}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Custo do material:</span>
                      <span>{formatCurrency(num(result.custo_material))}</span>
                    </div>
                    {num(result.custo_uber_busca) > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Uber (busca):</span>
                        <span>{formatCurrency(num(result.custo_uber_busca))}</span>
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

export default DtfCalculator;
