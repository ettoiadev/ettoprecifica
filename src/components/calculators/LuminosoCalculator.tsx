import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency, LuminosoConfig, PricingConfig } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { toast } from 'sonner';

interface Props {
  config: LuminosoConfig;
  fullConfig: PricingConfig;
}

// Resultado da função calc_luminoso (via Edge Function calc-luminoso).
// Campos numéricos podem chegar como string.
interface LuminosoResult {
  area_face_m2?: number | string;
  custo_face?: number | string;
  qtd_barras_metalon?: number;
  custo_metalon?: number | string;
  qtd_barras_cantoneira?: number;
  custo_cantoneira?: number | string;
  qtd_modulos_led?: number; // no modo tubular, representa a qtd de lâmpadas
  custo_led?: number | string;
  qtd_fontes?: number;
  custo_fonte?: number | string;
  custo_fixacao?: number | string;
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
}

type Material = 'lona' | 'acm_vazado';
type TipoLuz = 'modulo' | 'tubular';

const CIDADES_FALLBACK = [
  'Caçapava', 'Guararema', 'Igaratá', 'Jacareí', 'Litoral', 'Paraibuna',
  'Santa Branca', 'Santa Isabel', 'São José dos Campos', 'São Paulo', 'Taubaté',
];

const num = (v: number | string | undefined): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const LuminosoCalculator: React.FC<Props> = () => {
  const [material, setMaterial] = useState<Material>('lona');
  const [faces, setFaces] = useState<1 | 2>(2);
  const [tipoLuz, setTipoLuz] = useState<TipoLuz>('modulo');
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [cidade, setCidade] = useState<string>('Jacareí');
  const [cidades, setCidades] = useState<string[]>(CIDADES_FALLBACK);

  const [result, setResult] = useState<LuminosoResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;

  // Carrega cidades do motor (uma vez); mantém o fallback se falhar.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('calc-luminoso', {
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

  // Recalcula (com debounce) quando qualquer entrada muda.
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
        const { data, error } = await supabase.functions.invoke('calc-luminoso', {
          body: {
            material,
            faces,
            tipo_luz: tipoLuz,
            largura: larguraNum,
            altura: alturaNum,
            cidade,
          },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResult((data?.resultado as LuminosoResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao calcular o preço.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [material, faces, tipoLuz, larguraNum, alturaNum, cidade]);

  const composicao = useMemo(() => {
    if (!result) return [] as { label: string; valor: string }[];
    const linhas: { label: string; valor: string }[] = [
      { label: 'Área da face', valor: `${num(result.area_face_m2).toFixed(2)} m²` },
      { label: 'Barras de metalon', valor: `${result.qtd_barras_metalon ?? 0}` },
    ];
    if ((result.qtd_barras_cantoneira ?? 0) > 0) {
      linhas.push({ label: 'Barras de cantoneira', valor: `${result.qtd_barras_cantoneira}` });
    }
    if (tipoLuz === 'modulo') {
      linhas.push({ label: 'Módulos LED', valor: `${result.qtd_modulos_led ?? 0}` });
      linhas.push({ label: 'Fontes', valor: `${result.qtd_fontes ?? 0}` });
    } else {
      linhas.push({ label: 'Lâmpadas tubulares', valor: `${result.qtd_modulos_led ?? 0}` });
    }
    return linhas;
  }, [result, tipoLuz]);

  const handleCopy = () => {
    if (!result) return;
    const matLabel = material === 'lona' ? 'Lona' : 'ACM vazado';
    const texto = `Orçamento Luminoso ${matLabel} (${faces} face${faces > 1 ? 's' : ''})
Iluminação: ${tipoLuz === 'modulo' ? 'Módulo LED' : 'Lâmpada tubular'}
Medidas: ${larguraNum.toFixed(2)} x ${alturaNum.toFixed(2)} m
Cidade: ${cidade}

Preço (sem nota fiscal): ${formatCurrency(num(result.preco_sem_nota_60))}
Preço (com nota fiscal): ${formatCurrency(num(result.preco_com_nota_60))}`;
    navigator.clipboard.writeText(texto).then(
      () => toast.success('Orçamento copiado!'),
      () => toast.error('Não foi possível copiar.')
    );
  };

  const handleAddCotacao = () => {
    if (!result) return;
    const matLabel = material === 'lona' ? 'Lona' : 'ACM vazado';
    addItem({
      descricao: `Luminoso ${matLabel} ${faces}f ${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m`,
      precoSemNota: num(result.preco_sem_nota_60),
      precoComNota: num(result.preco_com_nota_60),
    });
    toast.success('Adicionado à cotação!');
  };

  const btn = (active: boolean) =>
    `px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
      active
        ? 'bg-blue-50 border-blue-300 text-blue-700'
        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
    }`;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Luminoso</h2>
        <p className="text-gray-600">
          Escolha o material, o nº de faces, a iluminação, as medidas e a cidade. O preço é calculado
          por composição de materiais (não por m²), com os dados reais da tabela de precificação.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Entradas */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Material</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setMaterial('lona')} className={btn(material === 'lona')}>
                Lona
              </button>
              <button type="button" onClick={() => setMaterial('acm_vazado')} className={btn(material === 'acm_vazado')}>
                ACM vazado
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Faces</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setFaces(1)} className={btn(faces === 1)}>
                1 face
              </button>
              <button type="button" onClick={() => setFaces(2)} className={btn(faces === 2)}>
                2 faces
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Iluminação</label>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={() => setTipoLuz('modulo')} className={btn(tipoLuz === 'modulo')}>
                Módulo LED
              </button>
              <button type="button" onClick={() => setTipoLuz('tubular')} className={btn(tipoLuz === 'tubular')}>
                Lâmpada tubular
              </button>
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
            <label htmlFor="cidade-lum" className="block text-sm font-medium text-gray-700 mb-3">
              Cidade (instalação)
            </label>
            <select
              id="cidade-lum"
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

              <div className="pt-3 border-t border-gray-200 space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Materiais:</span>
                  <span>{formatCurrency(num(result.subtotal_materiais))}</span>
                </div>
                {num(result.custo_mo) > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Mão de obra:</span>
                    <span>{formatCurrency(num(result.custo_mo))}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Deslocamento:</span>
                  <span>{formatCurrency(num(result.custo_deslocamento))}</span>
                </div>
                <div className="flex justify-between text-sm font-medium text-gray-900 pt-1">
                  <span>Custo total:</span>
                  <span>{formatCurrency(num(result.custo_total))}</span>
                </div>
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
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LuminosoCalculator;
