import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { toast } from 'sonner';

// Resultado da função calc_letra_caixa (via Edge Function calc-letra-caixa).
// Dois modelos: 'pvc_m2' (por m² da placa) e 'cm_altura' (por altura da letra ×
// nº de caracteres, com correção de largura). Campos numéricos podem chegar como string.
interface LetraResult {
  material_resultado?: string | null;
  modelo_calculo?: string | null;
  preco_cm_ou_m2_medio?: number | string;
  fator_largura_aplicado?: number | string;
  preco_por_letra?: number | string;
  preco_sem_iluminacao?: number | string;
  adicional_iluminacao?: number | string;
  preco_final?: number | string | null;
  preco_com_nota?: number | string | null;
  alerta?: string;
}

type Material = 'pvc' | 'acm' | 'galvanizado' | 'inox' | 'impressao_3d';
// Modo de iluminação:
//  - 'sem'     → sem iluminação (preço padrão)
//  - 'retro'   → retroiluminada (padrão +45%, via p_iluminado)
//  - 'frontal' → frontal acrílico (tabela própria, LED já incluso, sem +45%)
type Ilum = 'sem' | 'retro' | 'frontal';

const MATERIAL_LABEL: Record<Material, string> = {
  pvc: 'PVC',
  acm: 'ACM',
  galvanizado: 'Galvanizado',
  inox: 'Inox',
  impressao_3d: 'Impressão 3D',
};

// Modos de iluminação disponíveis por material (validado no motor da skill):
// ACM/Galvanizado têm os três; Inox só padrão; Impressão 3D só frontal;
// PVC (por m²) só sem/retro (backlight).
const ILUM_OPTS: Record<Material, Ilum[]> = {
  pvc: ['sem', 'retro'],
  acm: ['sem', 'retro', 'frontal'],
  galvanizado: ['sem', 'retro', 'frontal'],
  inox: ['sem', 'retro'],
  impressao_3d: ['frontal'],
};

const ILUM_LABEL: Record<Ilum, string> = {
  sem: 'Sem iluminação',
  retro: 'Retroiluminada (+45%)',
  frontal: 'Frontal acrílico',
};

const num = (v: number | string | undefined | null): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const btn = (active: boolean) =>
  `px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-50 border-blue-300 text-blue-700'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
  }`;

const LetraCaixaCalculator: React.FC = () => {
  const [material, setMaterial] = useState<Material>('pvc');
  const [iluminacao, setIluminacao] = useState<Ilum>('sem');
  // PVC (por m² da placa)
  const [espessuras, setEspessuras] = useState<number[]>([10, 20, 30]);
  const [espessura, setEspessura] = useState<number>(20);
  const [larguraPlaca, setLarguraPlaca] = useState<string>('');
  const [alturaPlaca, setAlturaPlaca] = useState<string>('');
  // ACM/Galvanizado/Inox/Impressão 3D (por altura da letra × nº de caracteres)
  const [alturaCm, setAlturaCm] = useState<string>('');
  const [nCaracteres, setNCaracteres] = useState<string>('');
  const [larguraTotalCm, setLarguraTotalCm] = useState<string>('');

  const [result, setResult] = useState<LetraResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

  const isPvc = material === 'pvc';
  const larguraPlacaNum = parseFloat(larguraPlaca) || 0;
  const alturaPlacaNum = parseFloat(alturaPlaca) || 0;
  const alturaCmNum = parseFloat(alturaCm) || 0;
  const nCaracteresNum = parseInt(nCaracteres, 10) || 0;
  const larguraTotalCmNum = parseFloat(larguraTotalCm) || 0;

  const opcoesIlum = ILUM_OPTS[material];

  const entradaValida = isPvc
    ? larguraPlacaNum > 0 && alturaPlacaNum > 0
    : alturaCmNum > 0 && nCaracteresNum > 0;

  // Troca de material: mantém o modo de iluminação atual se for válido para o
  // novo material; senão cai para o primeiro disponível (ex.: Impressão 3D → frontal).
  const changeMaterial = (m: Material) => {
    setMaterial(m);
    setIluminacao((atual) => (ILUM_OPTS[m].includes(atual) ? atual : ILUM_OPTS[m][0]));
  };

  // Carrega as espessuras de PVC do motor (uma vez); mantém fallback.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('calc-letra-caixa', {
          body: { action: 'meta' },
        });
        if (!ativo) return;
        if (!error && Array.isArray(data?.espessurasPvc) && data.espessurasPvc.length > 0) {
          setEspessuras(data.espessurasPvc);
          setEspessura((e) => (data.espessurasPvc.includes(e) ? e : data.espessurasPvc[0]));
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
    if (!entradaValida) {
      setResult(null);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const iluminado = iluminacao === 'retro';
        const tipoIluminacao = iluminacao === 'frontal' ? 'frontal_acrilico' : undefined;
        const body = isPvc
          ? {
              material,
              iluminado,
              larguraPlaca: larguraPlacaNum,
              alturaPlaca: alturaPlacaNum,
              espessura,
            }
          : {
              material,
              iluminado,
              tipoIluminacao,
              alturaCm: alturaCmNum,
              nCaracteres: nCaracteresNum,
              larguraTotalCm: larguraTotalCmNum > 0 ? larguraTotalCmNum : undefined,
            };
        const { data, error } = await supabase.functions.invoke('calc-letra-caixa', { body });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResult((data?.resultado as LetraResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao calcular o preço.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [
    material,
    iluminacao,
    isPvc,
    larguraPlacaNum,
    alturaPlacaNum,
    espessura,
    alturaCmNum,
    nCaracteresNum,
    larguraTotalCmNum,
  ]);

  const ilumSuffix =
    iluminacao === 'retro' ? ' retroiluminada' : iluminacao === 'frontal' ? ' frontal acrílico' : '';

  const descricao = useMemo(() => {
    if (isPvc) {
      return `Letra caixa PVC ${espessura}mm ${larguraPlacaNum.toFixed(2)}×${alturaPlacaNum.toFixed(2)}m${ilumSuffix}`;
    }
    return `Letra caixa ${MATERIAL_LABEL[material]} ${alturaCmNum}cm ${nCaracteresNum} letras${ilumSuffix}`;
  }, [isPvc, material, espessura, larguraPlacaNum, alturaPlacaNum, alturaCmNum, nCaracteresNum, ilumSuffix]);

  // Preço válido: motor pode retornar preco_final nulo quando não há referência
  // de mercado (ex.: altura fora da faixa pesquisada) — nesse caso mostramos o alerta.
  const temPreco = !!result && result.preco_final != null && num(result.preco_final) > 0;

  const handleCopy = () => {
    if (!temPreco || !result) return;
    const detalhe = isPvc
      ? `Placa: ${larguraPlacaNum.toFixed(2)} x ${alturaPlacaNum.toFixed(2)} m (${espessura}mm)`
      : `Letras: ${nCaracteresNum} × ${alturaCmNum} cm de altura`;
    const texto = `Orçamento Letra Caixa — ${MATERIAL_LABEL[material]}${ilumSuffix}
${detalhe}

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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Letra Caixa</h2>
        <p className="text-gray-600">
          Escolha o material. PVC é por m² da placa; ACM, galvanizado, inox e impressão 3D são por
          altura da letra × nº de caracteres (com correção de largura). Preço do motor de precificação.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Entradas */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Material</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(['pvc', 'acm', 'galvanizado', 'inox', 'impressao_3d'] as const).map((m) => (
                <button key={m} type="button" onClick={() => changeMaterial(m)} className={btn(material === m)}>
                  {MATERIAL_LABEL[m]}
                </button>
              ))}
            </div>
          </div>

          {isPvc ? (
            <>
              <div>
                <label htmlFor="espessura" className="block text-sm font-medium text-gray-700 mb-3">
                  Espessura
                </label>
                <select
                  id="espessura"
                  value={espessura}
                  onChange={(e) => setEspessura(Number(e.target.value))}
                  className={inputClass}
                >
                  {espessuras.map((mm) => (
                    <option key={mm} value={mm}>
                      {mm} mm
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Dimensões da placa
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Largura (m)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={larguraPlaca}
                      onChange={(e) => setLarguraPlaca(e.target.value)}
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
                      value={alturaPlaca}
                      onChange={(e) => setAlturaPlaca(e.target.value)}
                      className={inputClass}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                {larguraPlacaNum > 0 && alturaPlacaNum > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Área: {(larguraPlacaNum * alturaPlacaNum).toFixed(2)} m²
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="altura-cm" className="block text-sm font-medium text-gray-700 mb-3">
                    Altura da letra (cm)
                  </label>
                  <input
                    id="altura-cm"
                    type="number"
                    min="0"
                    step="1"
                    value={alturaCm}
                    onChange={(e) => setAlturaCm(e.target.value)}
                    className={inputClass}
                    placeholder="0"
                  />
                </div>
                <div>
                  <label htmlFor="n-caracteres" className="block text-sm font-medium text-gray-700 mb-3">
                    Nº de caracteres
                  </label>
                  <input
                    id="n-caracteres"
                    type="number"
                    min="1"
                    step="1"
                    value={nCaracteres}
                    onChange={(e) => setNCaracteres(e.target.value)}
                    className={inputClass}
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="largura-total" className="block text-sm font-medium text-gray-700 mb-3">
                  Largura total do conjunto (cm) — opcional
                </label>
                <input
                  id="largura-total"
                  type="number"
                  min="0"
                  step="1"
                  value={larguraTotalCm}
                  onChange={(e) => setLarguraTotalCm(e.target.value)}
                  className={inputClass}
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Corrige a distorção de largura: letras estreitas (I, 1) custam menos; largas (M, W),
                  mais. Sem isso, assume proporção padrão.
                </p>
              </div>
            </>
          )}

          {/* Iluminação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Iluminação</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {opcoesIlum.map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => setIluminacao(op)}
                  className={btn(iluminacao === op)}
                >
                  {ILUM_LABEL[op]}
                </button>
              ))}
            </div>
            {iluminacao === 'frontal' && (
              <p className="text-xs text-gray-500 mt-2">
                Face de acrílico iluminada por LED. O preço de mercado já inclui LED, fonte e
                instalação — sem adicional separado.
              </p>
            )}
            {material === 'impressao_3d' && (
              <p className="text-xs text-gray-500 mt-2">
                Impressão 3D é fornecida apenas em frontal acrílico.
              </p>
            )}
          </div>
        </div>

        {/* Resultado */}
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento</h3>

          {!entradaValida ? (
            <p className="text-sm text-gray-500">
              {isPvc
                ? 'Informe as dimensões da placa para ver o preço.'
                : 'Informe a altura da letra e o nº de caracteres para ver o preço.'}
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
                  {/* Preço principal */}
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

                  {/* Composição */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Material:</span>
                      <span>{MATERIAL_LABEL[material]}{isPvc ? ` ${espessura}mm` : ''}</span>
                    </div>
                    {isPvc ? (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Preço de mercado:</span>
                        <span>{formatCurrency(num(result.preco_cm_ou_m2_medio))}/m²</span>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Preço médio:</span>
                          <span>{formatCurrency(num(result.preco_cm_ou_m2_medio))}/cm</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Fator de largura:</span>
                          <span>×{num(result.fator_largura_aplicado).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Preço por letra:</span>
                          <span>{formatCurrency(num(result.preco_por_letra))}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Caracteres:</span>
                          <span>{nCaracteresNum}</span>
                        </div>
                      </>
                    )}
                    {num(result.adicional_iluminacao) > 0 && (
                      <>
                        <div className="flex justify-between text-sm text-gray-600 pt-1 border-t border-gray-200">
                          <span>Sem iluminação:</span>
                          <span>{formatCurrency(num(result.preco_sem_iluminacao))}</span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Adicional iluminação (+45%):</span>
                          <span>{formatCurrency(num(result.adicional_iluminacao))}</span>
                        </div>
                      </>
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

export default LetraCaixaCalculator;
