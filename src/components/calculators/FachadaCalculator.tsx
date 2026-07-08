import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy } from 'lucide-react';
import { formatCurrency, FachadaConfig, PricingConfig } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { toast } from 'sonner';

interface Props {
  config: FachadaConfig;
  fullConfig: PricingConfig;
}

// Resultado retornado pelas funções calc_fachada_acm / calc_fachada_lona
// (via Edge Function calc-fachada). Campos numéricos podem chegar como string.
interface FachadaResult {
  // comuns
  subtotal_materiais?: number | string;
  minutos_mo?: number | string;
  custo_mo?: number | string;
  custo_deslocamento?: number | string;
  preco_minimo_cidade?: number | string;
  custo_total?: number | string;
  preco_sem_nota_60?: number | string;
  preco_sem_nota_55?: number | string;
  preco_com_nota_60?: number | string;
  alerta?: string;
  // ACM
  qtd_chapas_acm?: number;
  qtd_barras_metalon?: number;
  // Lona
  area_lona_m2?: number | string;
  qtd_barras_cantoneira?: number;
  qtd_ilhos?: number;
}

// Cidades atendidas (fallback caso a Edge Function não responda a listagem).
const CIDADES_FALLBACK = [
  'Caçapava', 'Guararema', 'Igaratá', 'Jacareí', 'Litoral', 'Paraibuna',
  'Santa Branca', 'Santa Isabel', 'São José dos Campos', 'São Paulo', 'Taubaté',
];

const num = (v: number | string | undefined): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const FachadaCalculator: React.FC<Props> = () => {
  const [tipo, setTipo] = useState<'acm' | 'lona'>('acm');
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [cidade, setCidade] = useState<string>('Jacareí');
  const [cidades, setCidades] = useState<string[]>(CIDADES_FALLBACK);

  const [result, setResult] = useState<FachadaResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;

  // Carrega a lista de cidades do motor (uma vez); mantém o fallback se falhar.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('calc-fachada', {
          body: { action: 'cidades' },
        });
        if (!error && ativo && Array.isArray(data?.cidades) && data.cidades.length > 0) {
          setCidades(data.cidades);
        }
      } catch {
        /* mantém fallback */
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Recalcula (com debounce) sempre que medidas, tipo ou cidade mudarem.
  useEffect(() => {
    if (!(larguraNum > 0) || !(alturaNum > 0)) {
      setResult(null);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke('calc-fachada', {
          body: { tipo, largura: larguraNum, altura: alturaNum, cidade },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResult((data?.resultado as FachadaResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao calcular o preço.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [tipo, larguraNum, alturaNum, cidade]);

  const composicao = useMemo(() => {
    if (!result) return [] as { label: string; valor: string }[];
    if (tipo === 'acm') {
      return [
        { label: 'Chapas de ACM', valor: `${result.qtd_chapas_acm ?? 0}` },
        { label: 'Barras de metalon', valor: `${result.qtd_barras_metalon ?? 0}` },
      ];
    }
    return [
      { label: 'Área de lona', valor: `${num(result.area_lona_m2).toFixed(2)} m²` },
      { label: 'Barras de metalon', valor: `${result.qtd_barras_metalon ?? 0}` },
      { label: 'Barras de cantoneira', valor: `${result.qtd_barras_cantoneira ?? 0}` },
      { label: 'Ilhós', valor: `${result.qtd_ilhos ?? 0}` },
    ];
  }, [result, tipo]);

  const handleCopy = () => {
    if (!result) return;
    const texto = `Orçamento Fachada ${tipo.toUpperCase()}
Medidas: ${larguraNum.toFixed(2)} x ${alturaNum.toFixed(2)} m
Cidade: ${cidade}

Preço (sem nota fiscal): ${formatCurrency(num(result.preco_sem_nota_60))}
Preço (com nota fiscal): ${formatCurrency(num(result.preco_com_nota_60))}`;
    navigator.clipboard.writeText(texto).then(
      () => toast.success('Orçamento copiado!'),
      () => toast.error('Não foi possível copiar.')
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Fachada</h2>
        <p className="text-gray-600">
          Informe o tipo, as medidas e a cidade. O preço é calculado por composição de materiais e
          mão de obra (não por m²), com os dados reais da tabela de precificação.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Entradas */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Fachada</label>
            <div className="grid grid-cols-2 gap-3">
              {(['acm', 'lona'] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTipo(t)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    tipo === t
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {t === 'acm' ? 'ACM' : 'Lona'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Dimensões</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Largura (m)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={largura}
                  onChange={(e) => setLargura(e.target.value)}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Altura (m)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  className={inputClass}
                  placeholder="0.00"
                />
              </div>
            </div>
            {larguraNum > 0 && alturaNum > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Área: {(larguraNum * alturaNum).toFixed(2)} m²
              </p>
            )}
          </div>

          <div>
            <label htmlFor="cidade" className="block text-sm font-medium text-gray-700 mb-3">
              Cidade (instalação)
            </label>
            <select
              id="cidade"
              value={cidade}
              onChange={(e) => setCidade(e.target.value)}
              className={inputClass}
            >
              {cidades.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Resultado */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento</h3>

          {!(larguraNum > 0 && alturaNum > 0) ? (
            <p className="text-sm text-gray-500">
              Preencha largura e altura para ver o preço.
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

              {/* Preço principal */}
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

              {/* Composição */}
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-2">Composição</div>
                <div className="space-y-1">
                  {composicao.map((c) => (
                    <div key={c.label} className="flex justify-between text-sm text-gray-600">
                      <span>{c.label}:</span>
                      <span>{c.valor}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detalhamento de custo */}
              <div className="pt-3 border-t border-gray-200 space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Materiais:</span>
                  <span>{formatCurrency(num(result.subtotal_materiais))}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Mão de obra ({num(result.minutos_mo).toFixed(0)} min):</span>
                  <span>{formatCurrency(num(result.custo_mo))}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Deslocamento:</span>
                  <span>{formatCurrency(num(result.custo_deslocamento))}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-gray-900 pt-1">
                  <span>Custo total:</span>
                  <span>{formatCurrency(num(result.custo_total))}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
              >
                <Copy className="w-4 h-4" /> Copiar orçamento
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default FachadaCalculator;
