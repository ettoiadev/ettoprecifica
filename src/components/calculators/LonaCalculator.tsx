import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { toast } from 'sonner';

// Calculadora de Lona/Banner/Faixa — preço do motor da skill (Edge Function
// calc-lona → calc_lona). Dois acabamentos padrão do motor: Padrão
// (sem_acabamento, R$70/m²) e Reforço + Ilhós (reforcada_ilhos, R$90/m²).
// Deslocamento por cidade; quantidade por reconstrução (deslocamento uma vez).
//
// Laca de Proteção (+R$20/m²): adicional aplicado NO APP (o motor da skill ainda
// não tem esse parâmetro). Somado por m² à área cotada, com o mesmo fator de
// nota fiscal do preço base. TODO: migrar para a skill (p_laca) quando possível.
interface LonaResult {
  tipo_encontrado?: string;
  area_m2?: number | string;
  preco_m2?: number | string;
  adicional_bastao?: number | string;
  custo_deslocamento?: number | string;
  preco_minimo_projeto?: number | string;
  preco_final?: number | string | null;
  preco_com_nota?: number | string | null;
  alerta?: string;
}

interface Opcao {
  tipo: string;
  nome: string;
  preco_venda_m2: number | string;
}

// Adicional da laca de proteção, por m² (aplicado no app).
const LACA_M2 = 20;

// Acabamentos oferecidos nesta aba (ambos existem no motor da skill).
const TIPOS: { tipo: string; label: string; precoFallback: number }[] = [
  { tipo: 'sem_acabamento', label: 'Padrão', precoFallback: 70 },
  { tipo: 'reforcada_ilhos', label: 'Reforço + Ilhós', precoFallback: 90 },
];

const num = (v: number | string | undefined | null): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const btn = (active: boolean) =>
  `px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-50 border-blue-300 text-blue-700'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
  }`;

const LonaCalculator: React.FC = () => {
  const [precoM2Por, setPrecoM2Por] = useState<Record<string, number>>({});
  const [cidades, setCidades] = useState<string[]>([]);
  const [cidade, setCidade] = useState<string>('Jacareí');
  const [acabamento, setAcabamento] = useState<string>('sem_acabamento');
  const [laca, setLaca] = useState<boolean>(false);
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);

  const [result, setResult] = useState<LonaResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const entradaValida = larguraNum > 0 && alturaNum > 0;

  // Carrega preços por acabamento (para os rótulos) e cidades.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('calc-lona', {
          body: { action: 'meta' },
        });
        if (!ativo) return;
        if (!error && data) {
          if (Array.isArray(data.opcoes)) {
            const mapa: Record<string, number> = {};
            (data.opcoes as Opcao[]).forEach((o) => {
              mapa[o.tipo] = num(o.preco_venda_m2);
            });
            setPrecoM2Por(mapa);
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
        const { data, error } = await supabase.functions.invoke('calc-lona', {
          body: { tipo: acabamento, bastao: false, largura: larguraNum, altura: alturaNum, cidade },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResult((data?.resultado as LonaResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao calcular o preço.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [acabamento, larguraNum, alturaNum, cidade, entradaValida]);

  // Quantidade por reconstrução (deslocamento uma vez) + laca por m² (app).
  const precos = useMemo(() => {
    if (!result || result.preco_final == null) return null;
    const unit = num(result.preco_final);
    const desloc = num(result.custo_deslocamento);
    const area = num(result.area_m2);
    const baseSemNota = (unit - desloc) * quantidade + desloc;
    const lacaUnit = laca ? LACA_M2 * area : 0;
    const lacaTotal = lacaUnit * quantidade;
    const semNota = baseSemNota + lacaTotal;
    const fatorNF = unit > 0 ? num(result.preco_com_nota) / unit : 1;
    return { semNota, comNota: semNota * fatorNF, lacaTotal };
  }, [result, quantidade, laca]);

  const temPreco = !!precos && precos.semNota > 0;
  const acabamentoLabel = TIPOS.find((t) => t.tipo === acabamento)?.label ?? 'Padrão';

  const descricao = useMemo(
    () =>
      `Lona/Banner ${acabamentoLabel}${laca ? ' + laca' : ''} ${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m${
        quantidade > 1 ? ` (${quantidade}un)` : ''
      }`,
    [acabamentoLabel, laca, larguraNum, alturaNum, quantidade]
  );

  const handleCopy = () => {
    if (!temPreco || !precos) return;
    const texto = `Orçamento Lona/Banner — ${acabamentoLabel}${laca ? ' + Laca de Proteção' : ''}
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Lona</h2>
        <p className="text-gray-600">
          Lona, banner e faixa por m². Padrão R$ 70,00/m² ou reforço + ilhós R$ 90,00/m². Preço do
          motor de precificação.
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
            <label className="block text-sm font-medium text-gray-700 mb-3">Acabamento</label>
            <div className="grid grid-cols-2 gap-3">
              {TIPOS.map((t) => {
                const preco = precoM2Por[t.tipo] ?? t.precoFallback;
                return (
                  <button key={t.tipo} type="button" onClick={() => setAcabamento(t.tipo)} className={btn(acabamento === t.tipo)}>
                    {t.label} — {formatCurrency(preco)}/m²
                  </button>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input type="checkbox" checked={laca} onChange={(e) => setLaca(e.target.checked)} className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500" />
            <span className="text-sm font-medium text-gray-700">Laca de Proteção (+{formatCurrency(LACA_M2)}/m²)</span>
          </label>

          <div>
            <label htmlFor="cidade-lona" className="block text-sm font-medium text-gray-700 mb-3">Cidade (instalação)</label>
            <select id="cidade-lona" value={cidade} onChange={(e) => setCidade(e.target.value)} className={inputClass}>
              {cidades.length === 0 && <option value="Jacareí">Jacareí</option>}
              {cidades.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
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
                    <div className="flex justify-between text-sm text-gray-600"><span>Acabamento:</span><span>{acabamentoLabel}</span></div>
                    <div className="flex justify-between text-sm text-gray-600"><span>Preço/m²:</span><span>{formatCurrency(num(result.preco_m2))}</span></div>
                    <div className="flex justify-between text-sm text-gray-600"><span>Área (un):</span><span>{num(result.area_m2).toFixed(2)} m²</span></div>
                    {laca && precos.lacaTotal > 0 && (
                      <div className="flex justify-between text-sm text-gray-600"><span>Laca de proteção (+{formatCurrency(LACA_M2)}/m²):</span><span>{formatCurrency(precos.lacaTotal)}</span></div>
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

export default LonaCalculator;
