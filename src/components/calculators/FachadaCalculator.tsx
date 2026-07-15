import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { toast } from 'sonner';

// Resultado das funções calc_fachada_acm / calc_fachada_lona (via Edge Function
// calc-fachada). Modelo de "preço de mercado por m²" (motor 1): o preço final já
// vem pronto por acabamento, com mínimo de fachada aplicado. Campos numéricos
// podem chegar como string.
interface FachadaResult {
  motor_usado?: string;
  area_m2?: number | string;
  preco_mercado_m2?: number | string;
  preco_final?: number | string;
  preco_final_com_nota?: number | string;
  custo_deslocamento?: number | string;
  preco_minimo_fachada?: number | string;
  alerta?: string;
  // ACM
  qtd_chapas_acm?: number;
  qtd_barras_metalon?: number;
  // Lona
  area_lona_m2?: number | string;
  qtd_barras_cantoneira?: number;
  qtd_ilhos?: number;
  qtd_abracadeiras?: number;
}

type AcabamentoAcm = 'simples' | 'recortes_dobras' | 'letra_pvc' | 'letra_iluminada';

const ACABAMENTO_ACM: { value: AcabamentoAcm; label: string }[] = [
  { value: 'simples', label: 'Simples' },
  { value: 'recortes_dobras', label: 'Recortes/dobras' },
  { value: 'letra_pvc', label: 'Letra PVC' },
  { value: 'letra_iluminada', label: 'Letra iluminada' },
];

const CIDADES_FALLBACK = [
  'Caçapava', 'Guararema', 'Igaratá', 'Jacareí', 'Litoral', 'Paraibuna',
  'Santa Branca', 'Santa Isabel', 'São José dos Campos', 'São Paulo', 'Taubaté',
];

const num = (v: number | string | undefined): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const btn = (active: boolean) =>
  `px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-50 border-blue-300 text-blue-700'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
  }`;

const FachadaCalculator: React.FC = () => {
  const [tipo, setTipo] = useState<'acm' | 'lona'>('acm');
  const [acabamentoAcm, setAcabamentoAcm] = useState<AcabamentoAcm>('simples');
  // Fixação da lona: 'rebite' (cantoneira, mais usado) ou 'ilhos' (ilhós + abraçadeiras).
  const [fixacao, setFixacao] = useState<'ilhos' | 'rebite'>('rebite');
  const [iluminadoLona, setIluminadoLona] = useState<boolean>(false);
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [cidade, setCidade] = useState<string>('Jacareí');
  const [cidades, setCidades] = useState<string[]>(CIDADES_FALLBACK);

  const [result, setResult] = useState<FachadaResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

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

  // Recalcula (com debounce) sempre que as entradas mudarem.
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
        const body =
          tipo === 'acm'
            ? { tipo, acabamento: acabamentoAcm, largura: larguraNum, altura: alturaNum, cidade }
            : { tipo, fixacao, iluminado: iluminadoLona, largura: larguraNum, altura: alturaNum, cidade };
        const { data, error } = await supabase.functions.invoke('calc-fachada', { body });
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
  }, [tipo, acabamentoAcm, fixacao, iluminadoLona, larguraNum, alturaNum, cidade]);

  // Descrição curta do acabamento para textos/cotação.
  const acabamentoTexto = useMemo(() => {
    if (tipo === 'acm') {
      return ACABAMENTO_ACM.find((a) => a.value === acabamentoAcm)?.label ?? '';
    }
    const base = fixacao === 'ilhos' ? 'ilhós' : 'cantoneira';
    return iluminadoLona ? `${base}, iluminada` : base;
  }, [tipo, acabamentoAcm, fixacao, iluminadoLona]);

  const composicao = useMemo(() => {
    if (!result) return [] as { label: string; valor: string }[];
    if (tipo === 'acm') {
      return [
        { label: 'Chapas de ACM', valor: `${result.qtd_chapas_acm ?? 0}` },
        { label: 'Barras de metalon', valor: `${result.qtd_barras_metalon ?? 0}` },
      ];
    }
    const linhas = [
      { label: 'Área de lona', valor: `${num(result.area_lona_m2).toFixed(2)} m²` },
      { label: 'Barras de metalon', valor: `${result.qtd_barras_metalon ?? 0}` },
    ];
    if (fixacao === 'rebite') {
      linhas.push({ label: 'Barras de cantoneira', valor: `${result.qtd_barras_cantoneira ?? 0}` });
    } else {
      linhas.push({ label: 'Ilhós', valor: `${result.qtd_ilhos ?? 0}` });
      linhas.push({ label: 'Abraçadeiras nylon', valor: `${result.qtd_abracadeiras ?? 0}` });
    }
    return linhas;
  }, [result, tipo, fixacao]);

  const handleCopy = () => {
    if (!result) return;
    const texto = `Orçamento Fachada ${tipo.toUpperCase()} (${acabamentoTexto})
Medidas: ${larguraNum.toFixed(2)} x ${alturaNum.toFixed(2)} m
Cidade: ${cidade}

Preço (sem nota fiscal): ${formatCurrency(num(result.preco_final))}
Preço (com nota fiscal): ${formatCurrency(num(result.preco_final_com_nota))}`;
    navigator.clipboard.writeText(texto).then(
      () => toast.success('Orçamento copiado!'),
      () => toast.error('Não foi possível copiar.')
    );
  };

  const handleAddCotacao = () => {
    if (!result) return;
    addItem({
      descricao: `Fachada ${tipo.toUpperCase()} ${acabamentoTexto} ${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m`,
      precoSemNota: num(result.preco_final),
      precoComNota: num(result.preco_final_com_nota),
    });
    toast.success('Adicionado à cotação!');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Fachada</h2>
        <p className="text-gray-600">
          Informe o tipo, o acabamento, as medidas e a cidade. O preço vem do motor de precificação
          (preço de mercado por m² conforme o acabamento), com o mínimo de fachada aplicado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Entradas */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de Fachada</label>
            <div className="grid grid-cols-2 gap-3">
              {(['acm', 'lona'] as const).map((t) => (
                <button key={t} type="button" onClick={() => setTipo(t)} className={btn(tipo === t)}>
                  {t === 'acm' ? 'ACM' : 'Lona'}
                </button>
              ))}
            </div>
          </div>

          {tipo === 'acm' ? (
            <div>
              <label htmlFor="acabamento-acm" className="block text-sm font-medium text-gray-700 mb-3">
                Acabamento
              </label>
              <select
                id="acabamento-acm"
                value={acabamentoAcm}
                onChange={(e) => setAcabamentoAcm(e.target.value as AcabamentoAcm)}
                className={inputClass}
              >
                {ACABAMENTO_ACM.map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Acabamento</label>
                <div className="grid grid-cols-2 gap-3">
                  {([
                    { value: 'ilhos', label: 'Ilhós' },
                    { value: 'rebite', label: 'Cantoneira' },
                  ] as const).map((f) => (
                    <button key={f.value} type="button" onClick={() => setFixacao(f.value)} className={btn(fixacao === f.value)}>
                      {f.label}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  {fixacao === 'ilhos'
                    ? 'Lona presa com ilhós a cada 30 cm + abraçadeiras de nylon (à mostra no quadro).'
                    : 'Lona esticada com rebites e acabamento em cantoneira de alumínio.'}
                </p>
              </div>

              <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={iluminadoLona}
                  onChange={(e) => setIluminadoLona(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  Iluminada (backlight) — preço de mercado maior
                </span>
              </label>
            </>
          )}

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
            <p className="text-sm text-gray-500">Preencha largura e altura para ver o preço.</p>
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
                  {formatCurrency(num(result.preco_final))}
                </div>
                <div className="mt-1 text-sm text-gray-600">
                  Com nota fiscal: {formatCurrency(num(result.preco_final_com_nota))}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Preço de mercado: {formatCurrency(num(result.preco_mercado_m2))}/m² ·{' '}
                  {num(result.area_m2).toFixed(2)} m²
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

              {num(result.custo_deslocamento) > 0 && (
                <div className="text-xs text-gray-500 pt-2 border-t border-gray-200">
                  Deslocamento de {formatCurrency(num(result.custo_deslocamento))} para {cidade} não
                  está incluído no preço de mercado — some se for cobrar à parte.
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
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default FachadaCalculator;
