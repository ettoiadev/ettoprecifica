import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { useDeslocamentoCep } from '../../hooks/useDeslocamentoCep';
import DeslocamentoField from './DeslocamentoField';
import { toast } from 'sonner';

// Calculadora de Fachada em ACM 3D — preço do motor da skill (Edge Function
// calc-acm3d → calc_fachada_acm com p_acabamento='3d', custeio real "motor 2").
// Quantidades de chapas/metalon são opcionais: se informadas, o custeio fica
// mais preciso; se não, o motor estima. Deslocamento opcional (uma vez).
interface Acm3dResult {
  motor_usado?: string;
  area_m2?: number | string;
  preco_final?: number | string | null;
  preco_final_com_nota?: number | string | null;
  qtd_chapas_acm?: number;
  custo_acm?: number | string;
  qtd_barras_metalon?: number;
  custo_metalon?: number | string;
  custo_fixacao?: number | string;
  custo_deslocamento?: number | string;
  deslocamento_incluido?: boolean;
  preco_minimo_fachada?: number | string;
  custo_total_motor2?: number | string;
  alerta?: string;
}

const num = (v: number | string | undefined | null): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const Acm3dCalculator: React.FC = () => {
  const deslocamento = useDeslocamentoCep();
  const { incluirDeslocamento, custoDeslocamento } = deslocamento;
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [qtdChapas, setQtdChapas] = useState<string>('');
  const [qtdBarras, setQtdBarras] = useState<string>('');

  const [result, setResult] = useState<Acm3dResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const qtdChapasNum = parseInt(qtdChapas) || 0;
  const qtdBarrasNum = parseInt(qtdBarras) || 0;
  const custoDeslocamentoNum = parseFloat(custoDeslocamento) || 0;
  const entradaValida = larguraNum > 0 && alturaNum > 0;

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
        const { data, error } = await supabase.functions.invoke('calc-acm3d', {
          body: {
            largura: larguraNum,
            altura: alturaNum,
            qtdChapas: qtdChapasNum,
            qtdBarrasMetalon: qtdBarrasNum,
            incluirDeslocamento,
            custoDeslocamento: custoDeslocamentoNum,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResult((data?.resultado as Acm3dResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao calcular o preço.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [larguraNum, alturaNum, qtdChapasNum, qtdBarrasNum, incluirDeslocamento, custoDeslocamentoNum, entradaValida]);

  const precos = useMemo(() => {
    if (!result || result.preco_final == null) return null;
    return { semNota: num(result.preco_final), comNota: num(result.preco_final_com_nota) };
  }, [result]);

  const temPreco = !!precos && precos.semNota > 0;

  const descricao = useMemo(
    () => `Fachada ACM 3D ${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m`,
    [larguraNum, alturaNum]
  );

  const handleCopy = () => {
    if (!temPreco || !precos) return;
    const texto = `Orçamento Fachada ACM 3D
Dimensões: ${larguraNum.toFixed(2)} x ${alturaNum.toFixed(2)} m
${incluirDeslocamento ? `Deslocamento incluído: ${formatCurrency(custoDeslocamentoNum)}\n` : ''}Preço (sem nota fiscal): ${formatCurrency(precos.semNota)}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Cotação de Fachada em ACM 3D</h2>
        <p className="text-gray-600">
          Fachada em ACM com acabamento 3D (recortes/relevo). Preço do motor de precificação por
          custeio real. Informe as quantidades de chapas e metalon para maior precisão (opcional).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Dimensões da fachada</label>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Materiais (opcional — para custeio preciso)
            </label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Qtd. chapas de ACM</label>
                <input type="number" min="0" step="1" value={qtdChapas} onChange={(e) => setQtdChapas(e.target.value)} className={inputClass} placeholder="auto" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Qtd. barras de metalon</label>
                <input type="number" min="0" step="1" value={qtdBarras} onChange={(e) => setQtdBarras(e.target.value)} className={inputClass} placeholder="auto" />
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Deixe em branco para o motor estimar automaticamente pela área.
            </p>
          </div>

          <DeslocamentoField {...deslocamento} />
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento</h3>

          {!entradaValida ? (
            <p className="text-sm text-gray-500">Informe as dimensões para ver o preço.</p>
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
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-600"><span>Área:</span><span>{num(result.area_m2).toFixed(2)} m²</span></div>
                    <div className="flex justify-between text-sm text-gray-600"><span>Chapas de ACM:</span><span>{result.qtd_chapas_acm} · {formatCurrency(num(result.custo_acm))}</span></div>
                    <div className="flex justify-between text-sm text-gray-600"><span>Barras de metalon:</span><span>{result.qtd_barras_metalon} · {formatCurrency(num(result.custo_metalon))}</span></div>
                    <div className="flex justify-between text-sm text-gray-600"><span>Fixação:</span><span>{formatCurrency(num(result.custo_fixacao))}</span></div>
                    {incluirDeslocamento && num(result.custo_deslocamento) > 0 && (
                      <div className="flex justify-between text-sm text-gray-600"><span>Deslocamento:</span><span>{formatCurrency(num(result.custo_deslocamento))}</span></div>
                    )}
                    <div className="flex justify-between text-sm text-gray-600"><span>Custo total:</span><span>{formatCurrency(num(result.custo_total_motor2))}</span></div>
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

export default Acm3dCalculator;
