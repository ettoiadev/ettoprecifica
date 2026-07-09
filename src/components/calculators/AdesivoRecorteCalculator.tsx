import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { toast } from 'sonner';

// Resultado retornado por calc_adesivo_recorte (via Edge Function calc-adesivo-recorte).
// Campos numéricos podem chegar como string.
interface RecorteResult {
  produto_encontrado?: string | null;
  largura_rolo_m?: number | string;
  area_bbox_m2?: number | string;
  area_adesivo_m2?: number | string;
  custo_material?: number | string;
  custo_corte_plotter?: number | string;
  usa_mascara?: boolean;
  custo_mascara?: number | string;
  cores?: number;
  produto_cor2_encontrado?: string | null;
  area_cor2_m2?: number | string;
  custo_material_cor2?: number | string;
  custo_corte_cor2?: number | string;
  custo_mascara_cor2?: number | string;
  custo_registro_2cores?: number | string;
  subtotal_materiais?: number | string;
  custo_deslocamento?: number | string;
  preco_minimo_projeto?: number | string;
  custo_total?: number | string;
  preco_sem_nota_60?: number | string;
  preco_sem_nota_55?: number | string;
  preco_com_nota_60?: number | string;
  alerta?: string;
}

interface Material {
  nome: string;
  uso: string;
  largura_rolo_m: number | string;
}

const CIDADES_FALLBACK = [
  'Caçapava', 'Guararema', 'Igaratá', 'Jacareí', 'Litoral', 'Paraibuna',
  'Santa Branca', 'Santa Isabel', 'São José dos Campos', 'São Paulo', 'Taubaté',
];

// Rótulos amigáveis para o campo "uso" dos materiais.
const USO_LABEL: Record<string, string> = {
  interno: 'Interno',
  externo: 'Externo',
  externo_auto: 'Automotivo',
};

// Presets de aproveitamento do vinil (recorte quase nunca preenche o retângulo).
const PRESETS = [
  { value: 25, label: 'Texto/letras (~25%)' },
  { value: 50, label: 'Logo/misto (~50%)' },
  { value: 100, label: 'Sólido (100%)' },
];

const num = (v: number | string | undefined | null): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const AdesivoRecorteCalculator: React.FC = () => {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [produto, setProduto] = useState<string>('');
  // Modo de entrada: 'medida' (retângulo × %) ou 'area' (área real do recorte em m²).
  const [modo, setModo] = useState<'medida' | 'area'>('medida');
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [areaDireta, setAreaDireta] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  // Aproveitamento do vinil: padrão Sólido 100% (a maioria dos recortes é sólida).
  const [percentual, setPercentual] = useState<number>(100);
  // Máscara de transferência (papel) — usada em vários recortes de aplicação.
  const [comMascara, setComMascara] = useState<boolean>(false);
  // 2 cores: 2ª cor de vinil recortado (material + % da área da 1ª cor).
  const [cores, setCores] = useState<1 | 2>(1);
  const [produtoCor2, setProdutoCor2] = useState<string>('');
  const [percentualCor2, setPercentualCor2] = useState<number>(90);
  const [cidade, setCidade] = useState<string>('Jacareí');
  const [cidades, setCidades] = useState<string[]>(CIDADES_FALLBACK);

  const [result, setResult] = useState<RecorteResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const areaDiretaNum = parseFloat(areaDireta) || 0;
  const qtd = quantidade > 0 ? quantidade : 1;

  // Área de vinil de UMA unidade conforme o modo escolhido.
  const areaUnit =
    modo === 'area' ? areaDiretaNum : larguraNum * alturaNum * (percentual / 100);
  // Área total do pedido (soma das unidades). O motor da skill é linear na área,
  // então enviar a área total faz material/corte/máscara escalarem por unidade,
  // mantendo registro (2 cores) e deslocamento uma vez só, e o mínimo no total.
  const areaTotal = areaUnit * qtd;

  // Entradas válidas conforme o modo escolhido.
  const entradaValida =
    modo === 'area' ? areaDiretaNum > 0 : larguraNum > 0 && alturaNum > 0;

  // Carrega materiais e cidades do motor (uma vez); mantém fallback se falhar.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const [mat, cid] = await Promise.all([
          supabase.functions.invoke('calc-adesivo-recorte', { body: { action: 'materiais' } }),
          supabase.functions.invoke('calc-adesivo-recorte', { body: { action: 'cidades' } }),
        ]);
        if (!ativo) return;
        if (!mat.error && Array.isArray(mat.data?.materiais) && mat.data.materiais.length > 0) {
          setMateriais(mat.data.materiais);
          setProduto((p) => p || mat.data.materiais[0].nome);
        }
        if (!cid.error && Array.isArray(cid.data?.cidades) && cid.data.cidades.length > 0) {
          setCidades(cid.data.cidades);
        }
      } catch {
        /* mantém fallback */
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  // Recalcula (com debounce) sempre que entradas mudarem.
  useEffect(() => {
    if (!produto || !entradaValida) {
      setResult(null);
      setError(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const cor2 =
          cores === 2 ? { cores: 2, produtoCor2: produtoCor2 || undefined, percentualCor2 } : {};
        // Sempre via área direta (já computada no app com modo + % + quantidade).
        const body = { produto, area: areaTotal, mascara: comMascara, cidade, ...cor2 };
        const { data, error } = await supabase.functions.invoke('calc-adesivo-recorte', { body });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResult((data?.resultado as RecorteResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao calcular o preço.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [produto, entradaValida, areaTotal, comMascara, cores, produtoCor2, percentualCor2, cidade]);

  // Aplica o valor mínimo de projeto ao preço exibido (como o resto do app faz).
  const precos = useMemo(() => {
    if (!result) return null;
    const base = num(result.preco_sem_nota_60);
    const minimo = num(result.preco_minimo_projeto);
    const fatorNota = base > 0 ? num(result.preco_com_nota_60) / base : 1.0931;
    const aplicouMinimo = minimo > 0 && base < minimo;
    const semNota = aplicouMinimo ? minimo : base;
    return {
      semNota,
      comNota: semNota * fatorNota,
      aplicouMinimo,
      minimo,
    };
  }, [result]);

  const materiaisPorUso = useMemo(() => {
    const grupos: Record<string, Material[]> = {};
    for (const m of materiais) {
      (grupos[m.uso] ??= []).push(m);
    }
    return grupos;
  }, [materiais]);

  // Trecho que descreve a quantidade conforme o modo (para textos/cotação).
  const unidadeTexto =
    modo === 'area'
      ? `${areaDiretaNum.toFixed(3)} m² (área)`
      : `${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m (${percentual}%)`;
  const qtdPrefixo = qtd > 1 ? `${qtd}x ` : '';
  const medidaTexto = `${qtdPrefixo}${unidadeTexto}`;
  const mascaraTexto = comMascara ? ' + máscara' : '';
  const coresTexto = cores === 2 ? ' + 2ª cor' : '';

  const handleCopy = () => {
    if (!result || !precos) return;
    const texto = `Orçamento Adesivo de Recorte
Material: ${result.produto_encontrado ?? produto}${cores === 2 ? `\n2ª cor: ${result.produto_cor2_encontrado ?? (produtoCor2 || result.produto_encontrado)} (${percentualCor2}%)` : ''}
Quantidade: ${medidaTexto}
Máscara de transferência: ${comMascara ? 'sim' : 'não'}
Cidade: ${cidade}

Preço (sem nota fiscal): ${formatCurrency(precos.semNota)}
Preço (com nota fiscal): ${formatCurrency(precos.comNota)}`;
    navigator.clipboard.writeText(texto).then(
      () => toast.success('Orçamento copiado!'),
      () => toast.error('Não foi possível copiar.')
    );
  };

  const handleAddCotacao = () => {
    if (!result || !precos) return;
    addItem({
      descricao: `Adesivo recorte ${result.produto_encontrado ?? produto} ${medidaTexto}${mascaraTexto}${coresTexto}`,
      precoSemNota: precos.semNota,
      precoComNota: precos.comNota,
    });
    toast.success('Adicionado à cotação!');
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Adesivo de Recorte</h2>
        <p className="text-gray-600">
          Vinil recortado na plotter (letras, logos, faixas em cor sólida — sem impressão). O preço
          vem do motor de precificação da tabela real: custo do vinil + corte, sobre a área
          efetivamente recortada.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Entradas */}
        <div className="space-y-6">
          <div>
            <label htmlFor="material" className="block text-sm font-medium text-gray-700 mb-3">
              Material
            </label>
            <select
              id="material"
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
              className={inputClass}
            >
              {materiais.length === 0 && <option value="">Carregando…</option>}
              {Object.entries(materiaisPorUso).map(([uso, itens]) => (
                <optgroup key={uso} label={USO_LABEL[uso] ?? uso}>
                  {itens.map((m) => (
                    <option key={m.nome} value={m.nome}>
                      {m.nome}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Cores</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 1, label: '1 cor' },
                { value: 2, label: '2 cores' },
              ] as const).map((co) => (
                <button
                  key={co.value}
                  type="button"
                  onClick={() => setCores(co.value)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    cores === co.value
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {co.label}
                </button>
              ))}
            </div>
          </div>

          {cores === 2 && (
            <>
              <div>
                <label htmlFor="material-cor2" className="block text-sm font-medium text-gray-700 mb-3">
                  Material da 2ª cor
                </label>
                <select
                  id="material-cor2"
                  value={produtoCor2}
                  onChange={(e) => setProdutoCor2(e.target.value)}
                  className={inputClass}
                >
                  <option value="">Mesma da 1ª cor</option>
                  {Object.entries(materiaisPorUso).map(([uso, itens]) => (
                    <optgroup key={uso} label={USO_LABEL[uso] ?? uso}>
                      {itens.map((m) => (
                        <option key={m.nome} value={m.nome}>
                          {m.nome}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="percentual-cor2" className="block text-sm font-medium text-gray-700 mb-3">
                  Área da 2ª cor
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id="percentual-cor2"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={percentualCor2}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setPercentualCor2(Number.isFinite(v) ? Math.min(100, Math.max(1, v)) : 90);
                    }}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-500">
                    % da área da 1ª cor (cada cor gasta quase o mesmo de material). Inclui registro fixo.
                  </span>
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Modo de cálculo</label>
            <div className="grid grid-cols-2 gap-3">
              {([
                { value: 'medida', label: 'Por medida' },
                { value: 'area', label: 'Área direta (m²)' },
              ] as const).map((mo) => (
                <button
                  key={mo.value}
                  type="button"
                  onClick={() => setModo(mo.value)}
                  className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
                    modo === mo.value
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {mo.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {modo === 'area'
                ? 'Informe direto a área real de vinil recortado — mais preciso quando você já sabe a metragem.'
                : 'Informe o retângulo (painel/placa) e estime quanto dele é vinil.'}
            </p>
          </div>

          {modo === 'area' ? (
            <div>
              <label htmlFor="area-direta" className="block text-sm font-medium text-gray-700 mb-3">
                Área de vinil (m²)
              </label>
              <input
                id="area-direta"
                type="number"
                min="0"
                step="0.001"
                value={areaDireta}
                onChange={(e) => setAreaDireta(e.target.value)}
                className={inputClass}
                placeholder="0.000"
              />
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Dimensões (retângulo)</label>
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
                    Retângulo: {(larguraNum * alturaNum).toFixed(2)} m²
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="percentual" className="block text-sm font-medium text-gray-700 mb-3">
                  Aproveitamento do vinil
                </label>
                <div className="grid grid-cols-3 gap-3 mb-3">
                  {PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setPercentual(p.value)}
                      className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
                        percentual === p.value
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="percentual"
                    type="number"
                    min="1"
                    max="100"
                    step="1"
                    value={percentual}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setPercentual(Number.isFinite(v) ? Math.min(100, Math.max(1, v)) : 25);
                    }}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <span className="text-sm text-gray-500">
                    % do retângulo é vinil (o corte recortado quase nunca preenche a caixa toda).
                  </span>
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="quantidade" className="block text-sm font-medium text-gray-700 mb-3">
              Quantidade
            </label>
            <div className="flex items-center gap-2">
              <input
                id="quantidade"
                type="number"
                min="1"
                step="1"
                value={quantidade || ''}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setQuantidade(Number.isFinite(v) && v > 0 ? v : 1);
                }}
                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <span className="text-sm text-gray-500">
                unidades iguais — o preço soma a área total (mínimo e registro valem uma vez).
              </span>
            </div>
          </div>

          <div>
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={comMascara}
                onChange={(e) => setComMascara(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <span>
                <span className="block text-sm font-medium text-gray-700">
                  Máscara de transferência (papel)
                </span>
                <span className="block text-xs text-gray-500">
                  Marque quando o recorte for de aplicação (letras/logos que precisam de máscara).
                </span>
              </span>
            </label>
          </div>

          <div>
            <label htmlFor="cidade-recorte" className="block text-sm font-medium text-gray-700 mb-3">
              Cidade (instalação)
            </label>
            <select
              id="cidade-recorte"
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

          {!(produto && entradaValida) ? (
            <p className="text-sm text-gray-500">
              Selecione o material e informe {modo === 'area' ? 'a área' : 'as dimensões'} para ver o preço.
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
          ) : result && precos ? (
            <div className="space-y-4">
              {!result.produto_encontrado ? (
                <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                  <span>{result.alerta || 'Material não encontrado na tabela.'}</span>
                </div>
              ) : (
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
                    {precos.aplicouMinimo && (
                      <div className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        Valor mínimo de projeto aplicado ({formatCurrency(precos.minimo)}).
                      </div>
                    )}
                  </div>

                  {/* Composição */}
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">Composição</div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>{cores === 2 ? 'Material (1ª cor):' : 'Material:'}</span>
                        <span>{result.produto_encontrado}</span>
                      </div>
                      {qtd > 1 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Quantidade:</span>
                          <span>{qtd} un.</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>
                          {qtd > 1
                            ? `Área de vinil total (${qtd}×)`
                            : `Área de vinil${modo === 'area' ? '' : ` (${percentual}%)`}`}
                          :
                        </span>
                        <span>{num(result.area_adesivo_m2).toFixed(3)} m²</span>
                      </div>
                      {cores === 2 && (
                        <>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Material (2ª cor):</span>
                            <span>{result.produto_cor2_encontrado}</span>
                          </div>
                          <div className="flex justify-between text-sm text-gray-600">
                            <span>Área da 2ª cor ({percentualCor2}%):</span>
                            <span>{num(result.area_cor2_m2).toFixed(3)} m²</span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Detalhamento de custo */}
                  <div className="pt-3 border-t border-gray-200 space-y-1">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>{cores === 2 ? 'Vinil + corte (1ª cor):' : 'Custo do vinil:'}</span>
                      <span>
                        {formatCurrency(
                          cores === 2
                            ? num(result.custo_material) + num(result.custo_corte_plotter)
                            : num(result.custo_material)
                        )}
                      </span>
                    </div>
                    {cores !== 2 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Corte na plotter:</span>
                        <span>{formatCurrency(num(result.custo_corte_plotter))}</span>
                      </div>
                    )}
                    {cores === 2 && (
                      <>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Vinil + corte (2ª cor):</span>
                          <span>
                            {formatCurrency(
                              num(result.custo_material_cor2) + num(result.custo_corte_cor2)
                            )}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Registro (2 cores):</span>
                          <span>{formatCurrency(num(result.custo_registro_2cores))}</span>
                        </div>
                      </>
                    )}
                    {result.usa_mascara && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Máscara de transferência:</span>
                        <span>
                          {formatCurrency(
                            num(result.custo_mascara) + num(result.custo_mascara_cor2)
                          )}
                        </span>
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
                </>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default AdesivoRecorteCalculator;
