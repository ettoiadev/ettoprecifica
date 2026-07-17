import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { toast } from 'sonner';

// Calculadora de Placa em ACM (avulsa, não fachada) — preço do motor da skill
// (Edge Function calc-placa-acm → calc_placa_acm). Por m² com espessura e
// deslocamento por cidade. Quantidade por reconstrução (deslocamento uma vez).
interface AcmResult {
  material_encontrado?: string;
  area_m2?: number | string;
  custo_chapa_m2?: number | string;
  custo_adesivo_m2?: number | string;
  custo_total?: number | string;
  custo_deslocamento?: number | string;
  preco_minimo_projeto?: number | string;
  preco_sem_nota_60?: number | string | null;
  preco_com_nota_60?: number | string | null;
  alerta?: string;
}

const num = (v: number | string | undefined | null): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const PlacaACMCalculator: React.FC = () => {
  const [espessuras, setEspessuras] = useState<number[]>([3]);
  const [espessura, setEspessura] = useState<number>(3);
  const [cidades, setCidades] = useState<string[]>([]);
  const [cidade, setCidade] = useState<string>('Jacareí');
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);

  const [result, setResult] = useState<AcmResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const entradaValida = larguraNum > 0 && alturaNum > 0;

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('calc-placa-acm', {
          body: { action: 'meta' },
        });
        if (!ativo) return;
        if (!error && data) {
          if (Array.isArray(data.espessuras) && data.espessuras.length > 0) {
            setEspessuras(data.espessuras);
            setEspessura((e) => (data.espessuras.includes(e) ? e : data.espessuras[0]));
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
        const { data, error } = await supabase.functions.invoke('calc-placa-acm', {
          // Área agregada (área unitária × qtd) enviada como largura×altura, para o
          // motor aplicar o mínimo de projeto e o deslocamento UMA vez no pedido.
          body: {
            largura: larguraNum * alturaNum * (quantidade > 0 ? quantidade : 1),
            altura: 1,
            espessura,
            cidade,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResult((data?.resultado as AcmResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao calcular o preço.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [larguraNum, alturaNum, quantidade, espessura, cidade, entradaValida]);

  // O resultado já é o total do pedido (área agregada): preco_sem_nota_60 inclui o
  // mínimo de projeto e o deslocamento, aplicados uma única vez.
  const precos = useMemo(() => {
    if (!result || result.preco_sem_nota_60 == null) return null;
    return { semNota: num(result.preco_sem_nota_60), comNota: num(result.preco_com_nota_60) };
  }, [result]);

  const temPreco = !!precos && precos.semNota > 0;

  const descricao = useMemo(
    () =>
      `Placa ACM ${espessura}mm ${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m${
        quantidade > 1 ? ` (${quantidade}un)` : ''
      }`,
    [espessura, larguraNum, alturaNum, quantidade]
  );

  const handleCopy = () => {
    if (!temPreco || !precos) return;
    const texto = `Orçamento Placa ACM ${espessura}mm
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Placa em ACM</h2>
        <p className="text-gray-600">
          Placa ACM avulsa por m², com espessura e deslocamento por cidade. Preço do motor de
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

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="esp-acm" className="block text-sm font-medium text-gray-700 mb-3">Espessura</label>
              <select id="esp-acm" value={espessura} onChange={(e) => setEspessura(Number(e.target.value))} className={inputClass}>
                {espessuras.map((mm) => (
                  <option key={mm} value={mm}>{mm} mm</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cidade-acm" className="block text-sm font-medium text-gray-700 mb-3">Cidade (instalação)</label>
              <select id="cidade-acm" value={cidade} onChange={(e) => setCidade(e.target.value)} className={inputClass}>
                {cidades.length === 0 && <option value="Jacareí">Jacareí</option>}
                {cidades.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
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
                    <div className="mt-1 text-sm text-gray-600">Com nota fiscal: {formatCurrency(precos.comNota)}</div>
                    {quantidade > 1 && (
                      <div className="mt-1 text-xs text-gray-500">
                        {quantidade} un · unitário {formatCurrency(precos.semNota / quantidade)} ({formatCurrency(precos.comNota / quantidade)} c/ nota)
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-600"><span>Material:</span><span className="text-right">{result.material_encontrado}</span></div>
                    <div className="flex justify-between text-sm text-gray-600"><span>Chapa/m²:</span><span>{formatCurrency(num(result.custo_chapa_m2))}</span></div>
                    <div className="flex justify-between text-sm text-gray-600"><span>Área (un):</span><span>{(num(result.area_m2) / quantidade).toFixed(2)} m²</span></div>
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

export default PlacaACMCalculator;
