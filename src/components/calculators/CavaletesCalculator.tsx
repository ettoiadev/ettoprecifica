import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { toast } from 'sonner';

// Calculadora de Cavaletes — preço do motor da skill (Edge Function
// calc-cavaletes). Uma aba, duas estruturas: metalon+lona (calc_cavaletes,
// margem 60%) e madeira (calc_cavaletes_madeira, margem 65%).
interface CavResult {
  tamanho_encontrado?: string;
  opcao_painel_encontrada?: string;
  custo_total?: number | string;
  custo_deslocamento?: number | string;
  preco_sem_nota_60?: number | string | null;
  preco_com_nota_60?: number | string | null;
  preco_sem_nota_65?: number | string | null;
  preco_com_nota_65?: number | string | null;
  alerta?: string;
}

interface ComboMadeira {
  tamanho: string;
  opcao_painel: string;
}

type Estrutura = 'metalon' | 'madeira';

const num = (v: number | string | undefined | null): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const btn = (active: boolean) =>
  `px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-50 border-blue-300 text-blue-700'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
  }`;

const CavaletesCalculator: React.FC = () => {
  const [estrutura, setEstrutura] = useState<Estrutura>('metalon');
  const [tamanhosMetalon, setTamanhosMetalon] = useState<string[]>([]);
  const [combosMadeira, setCombosMadeira] = useState<ComboMadeira[]>([]);
  const [tamanho, setTamanho] = useState<string>('');
  const [opcaoPainel, setOpcaoPainel] = useState<string>('');

  const [result, setResult] = useState<CavResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

  const isMadeira = estrutura === 'madeira';
  const tamanhosMadeira = useMemo(
    () => [...new Set(combosMadeira.map((c) => c.tamanho))],
    [combosMadeira]
  );
  const tamanhos = isMadeira ? tamanhosMadeira : tamanhosMetalon;
  const paineis = useMemo(
    () => combosMadeira.filter((c) => c.tamanho === tamanho).map((c) => c.opcao_painel),
    [combosMadeira, tamanho]
  );

  const entradaValida = tamanho !== '' && (!isMadeira || opcaoPainel !== '');

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('calc-cavaletes', {
          body: { action: 'meta' },
        });
        if (!ativo) return;
        if (!error && data) {
          if (Array.isArray(data.tamanhosMetalon)) setTamanhosMetalon(data.tamanhosMetalon);
          if (Array.isArray(data.combosMadeira)) setCombosMadeira(data.combosMadeira);
        }
      } catch {
        /* sem dados */
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Ao trocar de estrutura, escolhe um tamanho válido para ela.
  useEffect(() => {
    if (tamanhos.length === 0) return;
    setTamanho((t) => (tamanhos.includes(t) ? t : tamanhos[0]));
  }, [tamanhos]);

  // Ao trocar de tamanho (madeira), garante um painel válido.
  useEffect(() => {
    if (!isMadeira || paineis.length === 0) return;
    setOpcaoPainel((p) => (paineis.includes(p) ? p : paineis[0]));
  }, [isMadeira, paineis]);

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
        const body = isMadeira
          ? { estrutura, tamanho, opcaoPainel }
          : { estrutura, tamanho };
        const { data, error } = await supabase.functions.invoke('calc-cavaletes', { body });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResult((data?.resultado as CavResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao calcular o preço.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [estrutura, isMadeira, tamanho, opcaoPainel, entradaValida]);

  // Colunas de preço mudam por estrutura: metalon = margem 60; madeira = 65.
  const precoSemNota = isMadeira ? result?.preco_sem_nota_65 : result?.preco_sem_nota_60;
  const precoComNota = isMadeira ? result?.preco_com_nota_65 : result?.preco_com_nota_60;
  const temPreco = precoSemNota != null && num(precoSemNota) > 0;

  const descricao = useMemo(() => {
    if (isMadeira) {
      return `Cavalete madeira ${tamanho} — ${opcaoPainel}`;
    }
    return `Cavalete metalon+lona ${tamanho}`;
  }, [isMadeira, tamanho, opcaoPainel]);

  const handleCopy = () => {
    if (!temPreco) return;
    const texto = `Orçamento ${descricao}

Preço (sem nota fiscal): ${formatCurrency(num(precoSemNota))}
Preço (com nota fiscal): ${formatCurrency(num(precoComNota))}`;
    navigator.clipboard.writeText(texto).then(
      () => toast.success('Orçamento copiado!'),
      () => toast.error('Não foi possível copiar.')
    );
  };

  const handleAddCotacao = () => {
    if (!temPreco) return;
    addItem({
      descricao,
      precoSemNota: num(precoSemNota),
      precoComNota: num(precoComNota),
    });
    toast.success('Adicionado à cotação!');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Cavaletes</h2>
        <p className="text-gray-600">
          Estrutura em metalon+lona ou em madeira. Preço por tamanho fechado, do motor de
          precificação.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Estrutura</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setEstrutura('metalon')} className={btn(!isMadeira)}>
                Metalon + Lona
              </button>
              <button type="button" onClick={() => setEstrutura('madeira')} className={btn(isMadeira)}>
                Madeira
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="tamanho-cav" className="block text-sm font-medium text-gray-700 mb-3">
              Tamanho
            </label>
            <select
              id="tamanho-cav"
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

          {isMadeira && (
            <div>
              <label htmlFor="painel-cav" className="block text-sm font-medium text-gray-700 mb-3">
                Painel
              </label>
              <select
                id="painel-cav"
                value={opcaoPainel}
                onChange={(e) => setOpcaoPainel(e.target.value)}
                className={inputClass}
              >
                {paineis.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento</h3>

          {!entradaValida ? (
            <p className="text-sm text-gray-500">Escolha a estrutura e o tamanho para ver o preço.</p>
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
                      {formatCurrency(num(precoSemNota))}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Com nota fiscal: {formatCurrency(num(precoComNota))}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Estrutura:</span>
                      <span>{isMadeira ? 'Madeira' : 'Metalon + Lona'}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Tamanho:</span>
                      <span>{result.tamanho_encontrado}</span>
                    </div>
                    {result.opcao_painel_encontrada && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Painel:</span>
                        <span className="text-right">{result.opcao_painel_encontrada}</span>
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

export default CavaletesCalculator;
