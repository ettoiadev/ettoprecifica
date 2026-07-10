import React, { useEffect, useMemo, useState } from 'react';
import { Loader2, AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import { supabase } from '../../lib/supabase/client';
import { useCotacao } from '../../contexts/CotacaoContext';
import { toast } from 'sonner';

// Resultado da função calc_vidro (via Edge Function calc-vidro).
// Campos numéricos podem chegar como string.
interface VidroResult {
  material_encontrado?: string | null;
  fornecedor_encontrado?: string | null;
  area_m2?: number | string;
  custo_m2?: number | string;
  custo_vidro?: number | string;
  qtd_prolongadores?: number;
  custo_prolongadores?: number | string;
  subtotal_materiais?: number | string;
  custo_deslocamento?: number | string;
  custo_total?: number | string;
  preco_sem_nota_60?: number | string;
  preco_sem_nota_65?: number | string;
  preco_com_nota_60?: number | string;
  alerta?: string;
}

interface Material {
  nome: string;
  custo_unitario: number | string;
}

const CIDADES_FALLBACK = [
  'Caçapava', 'Guararema', 'Igaratá', 'Jacareí', 'Litoral', 'Paraibuna',
  'Santa Branca', 'Santa Isabel', 'São José dos Campos', 'São Paulo', 'Taubaté',
];

const num = (v: number | string | undefined | null): number => Number(v ?? 0);

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

const VidroCalculator: React.FC = () => {
  const [materiais, setMateriais] = useState<Material[]>([]);
  const [tipo, setTipo] = useState<string>('');
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [prolongadores, setProlongadores] = useState<number>(0);
  const [cidade, setCidade] = useState<string>('Jacareí');
  const [cidades, setCidades] = useState<string[]>(CIDADES_FALLBACK);

  const [result, setResult] = useState<VidroResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const { addItem } = useCotacao();

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const qtd = quantidade > 0 ? quantidade : 1;

  // Carrega tipos de vidro e cidades do motor (uma vez); mantém fallback se falhar.
  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const [mat, cid] = await Promise.all([
          supabase.functions.invoke('calc-vidro', { body: { action: 'materiais' } }),
          supabase.functions.invoke('calc-vidro', { body: { action: 'cidades' } }),
        ]);
        if (!ativo) return;
        if (!mat.error && Array.isArray(mat.data?.materiais) && mat.data.materiais.length > 0) {
          setMateriais(mat.data.materiais);
          setTipo((t) => t || mat.data.materiais[0].nome);
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

  // Recalcula (com debounce) quando as entradas mudam. A quantidade é aplicada
  // no app (chamada por 1 peça); prolongadores são por peça.
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
        const { data, error } = await supabase.functions.invoke('calc-vidro', {
          body: { tipo, largura: larguraNum, altura: alturaNum, prolongadores, cidade },
        });
        if (error) throw error;
        if (data?.error) throw new Error(data.error);
        setResult((data?.resultado as VidroResult) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Erro ao calcular o preço.');
        setResult(null);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [tipo, larguraNum, alturaNum, prolongadores, cidade]);

  // Preço do pedido: variável (vidro + prolongadores) × qtd + deslocamento (uma vez).
  // Fator de venda/NF derivado do próprio resultado (sem duplicar margem).
  const precos = useMemo(() => {
    if (!result || !result.material_encontrado) return null;
    const custoUnit = num(result.custo_total);
    const desloc = num(result.custo_deslocamento);
    const custoPedido = (custoUnit - desloc) * qtd + desloc;
    const fatorSem = custoUnit > 0 ? num(result.preco_sem_nota_60) / custoUnit : 2.5;
    const fatorCom = custoUnit > 0 ? num(result.preco_com_nota_60) / custoUnit : 2.7325;
    return { semNota: custoPedido * fatorSem, comNota: custoPedido * fatorCom };
  }, [result, qtd]);

  const qtdPrefixo = qtd > 1 ? `${qtd}x ` : '';

  const handleCopy = () => {
    if (!result || !precos) return;
    const texto = `Orçamento Vidro — ${result.material_encontrado}
Medidas: ${larguraNum.toFixed(2)} x ${alturaNum.toFixed(2)} m${qtd > 1 ? ` — ${qtd} peças` : ''}
Prolongadores: ${prolongadores}${qtd > 1 ? '/peça' : ''}
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
      descricao: `Vidro ${result.material_encontrado} ${qtdPrefixo}${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m`,
      precoSemNota: precos.semNota,
      precoComNota: precos.comNota,
    });
    toast.success('Adicionado à cotação!');
  };

  const semTipo = result && !result.material_encontrado;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Vidro Temperado</h2>
        <p className="text-gray-600">
          Escolha o tipo de vidro, as medidas e os prolongadores. O preço vem do motor de
          precificação (custo real por m² da Japa Vidros + prolongadores + deslocamento).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Entradas */}
        <div className="space-y-6">
          <div>
            <label htmlFor="vidro-tipo" className="block text-sm font-medium text-gray-700 mb-3">
              Tipo de vidro
            </label>
            <select
              id="vidro-tipo"
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
              <label htmlFor="vidro-qtd" className="block text-sm font-medium text-gray-700 mb-3">
                Quantidade (peças)
              </label>
              <input
                id="vidro-qtd"
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
              <label htmlFor="vidro-prol" className="block text-sm font-medium text-gray-700 mb-3">
                Prolongadores (por peça)
              </label>
              <input
                id="vidro-prol"
                type="number"
                min="0"
                step="1"
                value={prolongadores || ''}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  setProlongadores(Number.isFinite(v) && v >= 0 ? v : 0);
                }}
                className={inputClass}
                placeholder="0"
              />
            </div>
          </div>

          <div>
            <label htmlFor="vidro-cidade" className="block text-sm font-medium text-gray-700 mb-3">
              Cidade (instalação, se houver)
            </label>
            <select
              id="vidro-cidade"
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
                    {qtd > 1 && (
                      <div className="mt-1 text-xs text-gray-500">
                        {qtd} peças · {formatCurrency(precos.semNota / qtd)} cada
                      </div>
                    )}
                  </div>

                  {/* Composição (por peça) */}
                  <div>
                    <div className="text-sm font-semibold text-gray-700 mb-2">
                      Composição{qtd > 1 ? ' (por peça)' : ''}
                    </div>
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Vidro:</span>
                        <span>{result.material_encontrado}</span>
                      </div>
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Área:</span>
                        <span>{num(result.area_m2).toFixed(2)} m²</span>
                      </div>
                      {qtd > 1 && (
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>Quantidade:</span>
                          <span>{qtd} peças</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Detalhamento de custo (por peça) */}
                  <div className="pt-3 border-t border-gray-200 space-y-1">
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Vidro ({formatCurrency(num(result.custo_m2))}/m²):</span>
                      <span>{formatCurrency(num(result.custo_vidro))}</span>
                    </div>
                    {num(result.custo_prolongadores) > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Prolongadores ({result.qtd_prolongadores}×):</span>
                        <span>{formatCurrency(num(result.custo_prolongadores))}</span>
                      </div>
                    )}
                    {num(result.custo_deslocamento) > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Deslocamento:</span>
                        <span>{formatCurrency(num(result.custo_deslocamento))}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm font-medium text-gray-900 pt-1">
                      <span>Custo total{qtd > 1 ? ' (por peça)' : ''}:</span>
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

export default VidroCalculator;
