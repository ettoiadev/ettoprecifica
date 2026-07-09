import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy } from 'lucide-react';
import { formatCurrency, LaserConfig, PricingConfig } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { toast } from 'sonner';

interface Props {
  config: LaserConfig;
  fullConfig: PricingConfig;
}

interface LaserResult {
  material_encontrado?: string | null;
  forma?: string;
  area_m2?: number | string;
  preco_venda_m2_base?: number | string;
  multiplicador_complexidade?: number | string;
  custo_material_venda?: number | string;
  perimetro_m?: number | string;
  custo_led?: number | string;
  custo_deslocamento?: number | string;
  preco_minimo_projeto?: number | string;
  preco_final?: number | string;
  preco_com_nota?: number | string;
  alerta?: string;
}

type Forma = 'retangular' | 'circular';
type Complexidade = 'padrao' | 'complexo';

const CIDADES_FALLBACK = [
  'Caçapava', 'Guararema', 'Igaratá', 'Jacareí', 'Litoral', 'Paraibuna',
  'Santa Branca', 'Santa Isabel', 'São José dos Campos', 'São Paulo', 'Taubaté',
];

const num = (v: number | string | undefined | null): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const LaserCalculator: React.FC<Props> = () => {
  const [materiais, setMateriais] = useState<{ nome: string; categoria: string | null }[]>([]);
  const [cidades, setCidades] = useState<string[]>(CIDADES_FALLBACK);
  const [material, setMaterial] = useState<string>('');
  const [forma, setForma] = useState<Forma>('retangular');
  const [complexidade, setComplexidade] = useState<Complexidade>('padrao');
  const [comLed, setComLed] = useState<boolean>(false);
  const [cidade, setCidade] = useState<string>('Jacareí');
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');

  const [result, setResult] = useState<LaserResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = forma === 'circular' ? larguraNum : parseFloat(altura) || 0;

  // Carrega materiais + cidades do motor (uma vez).
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('calc-laser', {
          body: { action: 'meta' },
        });
        if (error || !ativo) return;
        if (Array.isArray(data?.materiais) && data.materiais.length > 0) {
          setMateriais(data.materiais);
          setMaterial((prev) => prev || data.materiais[0].nome);
        }
        if (Array.isArray(data?.cidades) && data.cidades.length > 0) {
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

  // Recalcula (com debounce) quando as entradas mudam.
  useEffect(() => {
    if (!material || !(larguraNum > 0) || !(alturaNum > 0)) {
      setResult(null);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke('calc-laser', {
          body: {
            material,
            forma,
            complexidade,
            com_led: comLed,
            cidade,
            largura: larguraNum,
            altura: alturaNum,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResult((data?.resultado as LaserResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao calcular o preço.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [material, forma, complexidade, comLed, cidade, larguraNum, alturaNum]);

  // Materiais agrupados por categoria (para os optgroups do select).
  const grupos = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const m of materiais) {
      const cat = m.categoria || 'Outros';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(m.nome);
    }
    return Array.from(map.entries());
  }, [materiais]);

  const handleCopy = () => {
    if (!result || !result.material_encontrado) return;
    const dim = forma === 'circular'
      ? `Ø ${larguraNum.toFixed(2)} m`
      : `${larguraNum.toFixed(2)} x ${alturaNum.toFixed(2)} m`;
    const texto = `Orçamento Laser — ${result.material_encontrado}
Forma: ${forma === 'circular' ? 'Circular' : 'Retangular'} (${dim})
Complexidade: ${complexidade === 'complexo' ? 'Complexo' : 'Padrão'}${comLed ? ' + LED' : ''}
Cidade: ${cidade}

Preço (sem nota fiscal): ${formatCurrency(num(result.preco_final))}
Preço (com nota fiscal): ${formatCurrency(num(result.preco_com_nota))}`;
    navigator.clipboard.writeText(texto).then(
      () => toast.success('Orçamento copiado!'),
      () => toast.error('Não foi possível copiar.')
    );
  };

  const btn = (active: boolean) =>
    `px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-50 border-blue-300 text-blue-700'
        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
    }`;

  const semPreco = result && !result.material_encontrado;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Laser</h2>
        <p className="text-gray-600">
          Escolha o material, a forma, as medidas e a complexidade do corte. O preço vem do motor de
          precificação (por m² × complexidade), com deslocamento e mínimo de projeto.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Entradas */}
        <div className="space-y-6">
          <div>
            <label htmlFor="laser-material" className="block text-sm font-medium text-gray-700 mb-3">
              Material
            </label>
            <select
              id="laser-material"
              value={material}
              onChange={(e) => setMaterial(e.target.value)}
              className={inputClass}
            >
              {materiais.length === 0 && <option value="">Carregando materiais…</option>}
              {grupos.map(([cat, nomes]) => (
                <optgroup key={cat} label={cat}>
                  {nomes.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Forma</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setForma('retangular')} className={btn(forma === 'retangular')}>
                Retangular
              </button>
              <button type="button" onClick={() => setForma('circular')} className={btn(forma === 'circular')}>
                Circular
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Dimensões</label>
            {forma === 'circular' ? (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Diâmetro (m)</label>
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
            ) : (
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
            )}
            {larguraNum > 0 && alturaNum > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Área: {(forma === 'circular' ? Math.PI * (larguraNum / 2) ** 2 : larguraNum * alturaNum).toFixed(3)} m²
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Complexidade do corte</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setComplexidade('padrao')} className={btn(complexidade === 'padrao')}>
                Padrão
              </button>
              <button type="button" onClick={() => setComplexidade('complexo')} className={btn(complexidade === 'complexo')}>
                Complexo
              </button>
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
            <input
              type="checkbox"
              checked={comLed}
              onChange={(e) => setComLed(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm font-medium text-gray-700">Incluir iluminação LED (fita + fonte)</span>
          </label>

          <div>
            <label htmlFor="laser-cidade" className="block text-sm font-medium text-gray-700 mb-3">
              Cidade (instalação, se houver)
            </label>
            <select
              id="laser-cidade"
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
            <p className="text-sm text-gray-500">Preencha as dimensões para ver o preço.</p>
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

              {!semPreco && (
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
                      <span>Material:</span>
                      <span>{result.material_encontrado}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Área:</span>
                      <span>{num(result.area_m2).toFixed(3)} m²</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Preço base:</span>
                      <span>{formatCurrency(num(result.preco_venda_m2_base))}/m²</span>
                    </div>
                    {num(result.multiplicador_complexidade) !== 1 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Complexidade:</span>
                        <span>×{num(result.multiplicador_complexidade)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Material (venda):</span>
                      <span>{formatCurrency(num(result.custo_material_venda))}</span>
                    </div>
                    {num(result.custo_led) > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Iluminação LED:</span>
                        <span>{formatCurrency(num(result.custo_led))}</span>
                      </div>
                    )}
                    {num(result.custo_deslocamento) > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Deslocamento:</span>
                        <span>{formatCurrency(num(result.custo_deslocamento))}</span>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={handleCopy}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
                  >
                    <Copy className="w-4 h-4" /> Copiar orçamento
                  </button>
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LaserCalculator;
