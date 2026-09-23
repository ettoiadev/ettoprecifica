import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency, ALIQUOTA_NF_MOTOR, LuminosoConfig, PricingConfig } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { useDeslocamentoCep } from '../../hooks/useDeslocamentoCep';
import DeslocamentoField from './DeslocamentoField';
import { CalcCheckbox, OptionChip } from './CalcControls';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface Props {
  config: LuminosoConfig;
  fullConfig: PricingConfig;
}

// Resultado da função calc_luminoso (via Edge Function calc-luminoso).
// Campos numéricos podem chegar como string.
interface LuminosoResult {
  forma?: string;
  area_circular_m2?: number | string; // área real das faces (círculo ou retângulo × faces)
  area_material_comprado_m2?: number | string; // área de material efetivamente comprada
  perimetro_m?: number | string;
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
  deslocamento_incluido?: boolean;
  preco_minimo_aplicado?: number | string;
  custo_total?: number | string;
  preco_sem_nota_60?: number | string;
  preco_sem_nota_55?: number | string;
  preco_com_nota_60?: number | string;
  alerta?: string;
}

type Material = 'lona' | 'acm_vazado' | 'acrilico';
type TipoLuz = 'modulo' | 'tubular';
type Forma = 'retangular' | 'circular';

const MATERIAL_LABEL: Record<Material, string> = {
  lona: 'Lona',
  acm_vazado: 'ACM vazado',
  acrilico: 'Acrílico',
};

const num = (v: number | string | undefined): number => Number(v ?? 0);

const LuminosoCalculator: React.FC<Props> = () => {
  const [material, setMaterial] = useState<Material>('lona');
  const [forma, setForma] = useState<Forma>('retangular');
  const [faces, setFaces] = useState<1 | 2>(2);
  const [tipoLuz, setTipoLuz] = useState<TipoLuz>('modulo');
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const deslocamento = useDeslocamentoCep();
  const { incluirDeslocamento, custoDeslocamento } = deslocamento;
  const [incluirNota, setIncluirNota] = useState<boolean>(true);

  const [result, setResult] = useState<LuminosoResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

  const larguraNum = parseFloat(largura) || 0;
  // Circular: largura é o diâmetro e a altura acompanha (a função ignora altura).
  const alturaNum = forma === 'circular' ? larguraNum : parseFloat(altura) || 0;
  const custoDeslocamentoNum = parseFloat(custoDeslocamento) || 0;

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
            forma,
            faces,
            tipo_luz: tipoLuz,
            largura: larguraNum,
            altura: alturaNum,
            incluirDeslocamento,
            custoDeslocamento: custoDeslocamentoNum,
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
  }, [material, forma, faces, tipoLuz, larguraNum, alturaNum, incluirDeslocamento, custoDeslocamentoNum]);

  const composicao = useMemo(() => {
    if (!result) return [] as { label: string; valor: string }[];
    const linhas: { label: string; valor: string }[] = [
      { label: 'Área das faces', valor: `${num(result.area_circular_m2).toFixed(2)} m²` },
      {
        label: 'Material comprado',
        valor: `${num(result.area_material_comprado_m2).toFixed(2)} m²`,
      },
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

  const precos = useMemo(() => {
    if (!result) return null;
    const semNota = num(result.preco_sem_nota_60);
    const comNota = num(result.preco_com_nota_60);
    return { semNota, comNota, descontoNota: comNota - semNota, final: incluirNota ? comNota : semNota };
  }, [result, incluirNota]);

  // Dimensão em texto conforme a forma (circular usa diâmetro).
  const dimTexto =
    forma === 'circular'
      ? `Ø ${larguraNum.toFixed(2)} m`
      : `${larguraNum.toFixed(2)} x ${alturaNum.toFixed(2)} m`;
  const dimCurta =
    forma === 'circular'
      ? `Ø${larguraNum.toFixed(2)}m`
      : `${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m`;

  const handleCopy = () => {
    if (!precos) return;
    const texto = `Luminoso ${MATERIAL_LABEL[material]} (${faces} face${faces > 1 ? 's' : ''})
Forma: ${forma === 'circular' ? 'Circular' : 'Retangular'} (${dimTexto})
Valor: ${formatCurrency(precos.final)}`;
    navigator.clipboard.writeText(texto).then(
      () => toast.success('Orçamento copiado!'),
      () => toast.error('Não foi possível copiar.')
    );
  };

  const handleAddCotacao = () => {
    if (!precos) return;
    addItem({
      descricao: `Luminoso ${MATERIAL_LABEL[material]} ${faces}f ${dimCurta}`,
      precoSemNota: precos.semNota,
      precoComNota: precos.comNota,
    });
    toast.success('Adicionado à cotação!');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
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
            <div className="grid grid-cols-3 gap-3">
              {(['lona', 'acm_vazado', 'acrilico'] as const).map((m) => (
                <OptionChip key={m} onClick={() => setMaterial(m)} active={material === m} variant="neutral">
                  {MATERIAL_LABEL[m]}
                </OptionChip>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Forma</label>
            <div className="grid grid-cols-2 gap-3">
              <OptionChip onClick={() => setForma('retangular')} active={forma === 'retangular'} variant="neutral">
                Retangular
              </OptionChip>
              <OptionChip onClick={() => setForma('circular')} active={forma === 'circular'} variant="neutral">
                Circular
              </OptionChip>
            </div>
            {forma === 'circular' && (
              <p className="text-xs text-gray-500 mt-2">
                O material é cobrado pela chapa quadrada que envolve o círculo (a perda do recorte
                também é paga).
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Faces</label>
            <div className="grid grid-cols-2 gap-3">
              <OptionChip onClick={() => setFaces(1)} active={faces === 1} variant="neutral">
                1 face
              </OptionChip>
              <OptionChip onClick={() => setFaces(2)} active={faces === 2} variant="neutral">
                2 faces
              </OptionChip>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Iluminação</label>
            <div className="grid grid-cols-2 gap-3">
              <OptionChip onClick={() => setTipoLuz('modulo')} active={tipoLuz === 'modulo'} variant="neutral">
                Módulo LED
              </OptionChip>
              <OptionChip onClick={() => setTipoLuz('tubular')} active={tipoLuz === 'tubular'} variant="neutral">
                Lâmpada tubular
              </OptionChip>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Dimensões</label>
            {forma === 'circular' ? (
              <div>
                <label className="block text-xs text-gray-500 mb-1">Diâmetro (m)</label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={largura}
                  onChange={(e) => setLargura(e.target.value)}
                  placeholder="0.00"
                />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Largura (m)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={largura}
                    onChange={(e) => setLargura(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Altura (m)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={altura}
                    onChange={(e) => setAltura(e.target.value)}
                    placeholder="0.00"
                  />
                </div>
              </div>
            )}
            {larguraNum > 0 && alturaNum > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Área (1 face):{' '}
                {(forma === 'circular'
                  ? Math.PI * (larguraNum / 2) ** 2
                  : larguraNum * alturaNum
                ).toFixed(2)}{' '}
                m²
              </p>
            )}
          </div>

          <DeslocamentoField {...deslocamento} />

          <CalcCheckbox checked={incluirNota} onCheckedChange={setIncluirNota}>
            Emitir com nota fiscal ({ALIQUOTA_NF_MOTOR.toLocaleString('pt-BR')}%)
          </CalcCheckbox>
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
                <div className="text-xs uppercase tracking-wide text-gray-500">Preço de venda</div>
                <div className="text-3xl font-bold text-blue-600">{formatCurrency(num(precos?.final))}</div>
                {incluirNota ? (
                  <div className="mt-1 text-xs text-gray-500">
                    Nota fiscal ({ALIQUOTA_NF_MOTOR.toLocaleString('pt-BR')}%) incluída
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-amber-600 font-medium">
                    Sem nota fiscal — desconto de {formatCurrency(num(precos?.descontoNota))} (
                    {ALIQUOTA_NF_MOTOR.toLocaleString('pt-BR')}%)
                  </div>
                )}
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
                {incluirDeslocamento && num(result.custo_deslocamento) > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Deslocamento:</span>
                    <span>{formatCurrency(num(result.custo_deslocamento))}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm font-medium text-gray-900 pt-1">
                  <span>Custo total:</span>
                  <span>{formatCurrency(num(result.custo_total))}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Button type="button" variant="outline" onClick={handleAddCotacao} className="w-full">
                  <PlusCircle className="w-4 h-4" /> Adicionar à cotação
                </Button>
                <Button type="button" onClick={handleCopy} className="w-full">
                  <Copy className="w-4 h-4" /> Copiar orçamento
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default LuminosoCalculator;
