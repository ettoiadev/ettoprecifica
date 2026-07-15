import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { toast } from 'sonner';

// Resultado da função calc_ps_adesivado (via Edge Function calc-ps). Modelo de
// "preço de mercado por m²" (motor 1); quando o material não tem preço de mercado
// cadastrado, a função cai no custo real (motor 2) e preenche as colunas de custo.
// Campos numéricos podem chegar como string.
interface PSResult {
  material_encontrado?: string | null;
  motor_usado?: string | null;
  area_peca_m2?: number | string;
  preco_mercado_m2?: number | string | null;
  preco_final?: number | string;
  preco_com_nota?: number | string;
  material_custo_m2?: number | string | null;
  custo_material?: number | string | null;
  custo_impressao?: number | string | null;
  custo_total_motor2?: number | string | null;
  alerta?: string;
}

interface Material {
  nome: string;
}

const num = (v: number | string | undefined | null): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const PlacaPSCalculator: React.FC = () => {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [tipo, setTipo] = useState<string>('');
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [percentual, setPercentual] = useState<number>(100);

  const [result, setResult] = useState<PSResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const qtd = quantidade > 0 ? quantidade : 1;

  // Carrega tipos de placa do motor (uma vez).
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('calc-ps', {
          body: { action: 'materiais' },
        });
        if (!ativo) return;
        if (!error && Array.isArray(data?.materiais) && data.materiais.length > 0) {
          setMateriais(data.materiais);
          setTipo((t) => t || data.materiais[0].nome);
        }
      } catch {
        /* ignore */
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Recalcula (com debounce) quando as entradas mudam.
  useEffect(() => {
    if (!tipo || !(larguraNum > 0) || !(alturaNum > 0)) {
      setResult(null);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke('calc-ps', {
          body: { tipo, largura: larguraNum, altura: alturaNum, percentual },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResult((data?.resultado as PSResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao calcular o preço.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [tipo, larguraNum, alturaNum, percentual]);

  // Preço do pedido: preço por peça × quantidade (modelo de mercado, sem custo fixo).
  const precos = useMemo(() => {
    if (!result || !result.material_encontrado) return null;
    return {
      semNota: num(result.preco_final) * qtd,
      comNota: num(result.preco_com_nota) * qtd,
    };
  }, [result, qtd]);

  // Motor 2 (fallback de custo) tem colunas de custo preenchidas.
  const isMotor2 = result != null && result.custo_material != null;

  const handleCopy = () => {
    if (!result || !precos) return;
    const texto = `Orçamento Placa PS — ${result.material_encontrado}
Medidas: ${larguraNum.toFixed(2)} x ${alturaNum.toFixed(2)} m${qtd > 1 ? ` — ${qtd} peças` : ''}

Preço (sem nota fiscal): ${formatCurrency(precos.semNota)}
Preço (com nota fiscal): ${formatCurrency(precos.comNota)}`;
    navigator.clipboard.writeText(texto).then(
      () => toast.success('Orçamento copiado!'),
      () => toast.error('Não foi possível copiar.')
    );
  };

  const handleAddCotacao = () => {
    if (!result || !precos) return;
    const qtdPrefixo = qtd > 1 ? `${qtd}x ` : '';
    addItem({
      descricao: `Placa PS ${result.material_encontrado} ${qtdPrefixo}${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m`,
      precoSemNota: precos.semNota,
      precoComNota: precos.comNota,
    });
    toast.success('Adicionado à cotação!');
  };

  const semTipo = result && !result.material_encontrado;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Placa em PS</h2>
        <p className="text-gray-600">
          Placa de PS com impressão digital adesivada. O preço vem do motor de precificação
          (preço de mercado por m² conforme o tipo de placa), com o mínimo de projeto aplicado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Entradas */}
        <div className="space-y-6">
          <div>
            <label htmlFor="ps-tipo" className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de placa
            </label>
            <select
              id="ps-tipo"
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className={inputClass}
            >
              {materiais.length === 0 && <option value="">Carregando…</option>}
              {materiais.map((m) => (
                <option key={m.nome} value={m.nome}>
                  {m.nome}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Dimensões (por peça)</label>
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
                Área por peça: {(larguraNum * alturaNum).toFixed(2)} m²
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="ps-qtd" className="block text-sm font-medium text-gray-700 mb-3">
                Quantidade (peças)
              </label>
              <input
                id="ps-qtd"
                type="number"
                min="1"
                step="1"
                value={quantidade || ''}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setQuantidade(Number.isFinite(v) && v > 0 ? v : 1);
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="ps-perc" className="block text-sm font-medium text-gray-700 mb-3">
                Impressão (%)
              </label>
              <input
                id="ps-perc"
                type="number"
                min="1"
                max="100"
                step="1"
                value={percentual}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setPercentual(Number.isFinite(v) ? Math.min(100, Math.max(1, v)) : 100);
                }}
                className={inputClass}
              />
            </div>
          </div>
          <p className="-mt-3 text-xs text-gray-500">
            Impressão (%) só afeta placas sem preço de mercado (cálculo por custo).
          </p>
        </div>

        {/* Resultado */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento</h3>

          {!(tipo && larguraNum > 0 && alturaNum > 0) ? (
            <p className="text-sm text-gray-500">
              Selecione o tipo e informe as dimensões para ver o preço.
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

              {!semTipo && precos && (
                <>
                  {/* Preço principal */}
                  <div className="bg-white rounded-lg border border-gray-200 p-4">
                    <div className="text-xs uppercase tracking-wide text-gray-500">
                      Preço de venda (sem nota fiscal)
                    </div>
                    <div className="text-3xl font-bold text-blue-600">
                      {formatCurrency(precos.semNota)}
                    </div>
                    <div className="mt-1 text-sm text-gray-600">
                      Com nota fiscal: {formatCurrency(precos.comNota)}
                    </div>
                    {num(result.preco_mercado_m2) > 0 && (
                      <div className="mt-1 text-xs text-gray-500">
                        Preço de mercado: {formatCurrency(num(result.preco_mercado_m2))}/m² ·{' '}
                        {num(result.area_peca_m2).toFixed(2)} m²
                      </div>
                    )}
                    {qtd > 1 && (
                      <div className="mt-1 text-xs text-gray-500">
                        {qtd} peças · unitário {formatCurrency(precos.semNota / qtd)} (
                        {formatCurrency(precos.comNota / qtd)} c/ nota)
                      </div>
                    )}
                  </div>

                  {/* Composição */}
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">Composição</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Placa:</span>
                        <span>{result.material_encontrado}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Área{qtd > 1 ? ' (por peça)' : ''}:</span>
                        <span>{num(result.area_peca_m2).toFixed(2)} m²</span>
                      </div>
                      {qtd > 1 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Quantidade:</span>
                          <span>{qtd} peças</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detalhamento de custo — só no fallback por custo (motor 2) */}
                  {isMotor2 && (
                    <div className="pt-3 border-t border-gray-200 space-y-1">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Material:</span>
                        <span>{formatCurrency(num(result.custo_material))}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Impressão:</span>
                        <span>{formatCurrency(num(result.custo_impressao))}</span>
                      </div>
                      <div className="flex justify-between text-sm font-medium text-gray-900 pt-1">
                        <span>Custo total{qtd > 1 ? ' (por peça)' : ''}:</span>
                        <span>{formatCurrency(num(result.custo_total_motor2))}</span>
                      </div>
                    </div>
                  )}

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

export default PlacaPSCalculator;
