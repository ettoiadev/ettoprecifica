import React, { useEffect, useMemo, useState } from 'react';
import { Copy, PlusCircle } from 'lucide-react';
import { formatCurrency, ALIQUOTA_NF, LaserConfig, ProductVariation } from '../../types/pricing';
import { useCotacao } from '../../contexts/CotacaoContext';
import { useDeslocamentoCep } from '../../hooks/useDeslocamentoCep';
import DeslocamentoField from './DeslocamentoField';
import { CalcCheckbox, OptionChip, ChipProduto } from './CalcControls';
import EncaixeControles from './EncaixeControles';
import EncaixeVisual from './EncaixeVisual';
import { useEncaixeSvg, PERFIL_LASER } from '../../hooks/useEncaixeSvg';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';

// Laser com preço MANUAL, definido em Configurações (config.laser), NÃO pelo motor
// da skill. Os materiais (nome/categoria/preço/ordem) vêm da lista editável
// `config.laser.itens`, agrupados por categoria na UI. Modelo simples área × R$/m².
// Deslocamento opcional pelo fluxo por CEP, somado à parte (sem incidência de NF).
interface Props {
  config: LaserConfig;
}

// Como a área cobrada é obtida: medida digitada, ou encaixe das peças de um
// arquivo vetorial na chapa (mesmo motor da Letra Caixa, com o perfil do
// laser — ver PERFIL_LASER).
type ModoMedida = 'manual' | 'arquivo';


const LaserManualCalculator: React.FC<Props> = ({ config }) => {
  const deslocamento = useDeslocamentoCep();
  const { incluirDeslocamento, custoDeslocamento } = deslocamento;
  const opcoes = useMemo<ProductVariation[]>(() => config.itens ?? [], [config.itens]);
  const [material, setMaterial] = useState<string>(opcoes[0]?.id ?? '');
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [incluirNota, setIncluirNota] = useState<boolean>(true);
  const [modo, setModo] = useState<ModoMedida>('manual');
  const enc = useEncaixeSvg(PERFIL_LASER);

  const { addItem } = useCotacao();

  useEffect(() => {
    if (opcoes.length === 0) return;
    if (!opcoes.some((o) => o.id === material)) setMaterial(opcoes[0].id);
  }, [opcoes, material]);

  // Agrupa por categoria para renderizar os botões em seções (mantém a ordem).
  const grupos = useMemo(() => {
    const map = new Map<string, ProductVariation[]>();
    for (const o of opcoes) {
      const cat = o.category || 'Outros';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(o);
    }
    return Array.from(map.entries());
  }, [opcoes]);

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const qtd = quantidade > 0 ? quantidade : 1;
  const custoDeslocamentoNum = parseFloat(custoDeslocamento) || 0;

  // No modo arquivo a quantidade vem do próprio painel de encaixe ("jogos"),
  // já embutida na área — multiplicar de novo cobraria em dobro.
  const usaArquivo = modo === 'arquivo';
  const areaArquivo = enc.areaOcupada?.areaM2 ?? 0;
  const entradaValida = usaArquivo ? areaArquivo > 0 : larguraNum > 0 && alturaNum > 0;

  const opcaoSel = opcoes.find((o) => o.id === material) ?? opcoes[0];
  const precoM2 = opcaoSel?.price ?? 0;

  const calc = useMemo(() => {
    if (!entradaValida) return null;
    const areaUnit = usaArquivo ? areaArquivo : larguraNum * alturaNum;
    const areaTotal = usaArquivo ? areaArquivo : areaUnit * qtd;
    const produtoSemNota = precoM2 * areaTotal;
    const desloc = incluirDeslocamento ? custoDeslocamentoNum : 0;
    const semNota = produtoSemNota + desloc;
    const comNota = produtoSemNota * (1 + ALIQUOTA_NF / 100) + desloc;
    const descontoNota = comNota - semNota;
    const final = incluirNota ? comNota : semNota;
    return { areaUnit, areaTotal, produtoSemNota, desloc, semNota, comNota, descontoNota, final };
  }, [entradaValida, usaArquivo, areaArquivo, larguraNum, alturaNum, qtd, precoM2, incluirDeslocamento, custoDeslocamentoNum, incluirNota]);

  const temPreco = !!calc && calc.final > 0;

  const descricao = useMemo(() => {
    const medida = usaArquivo
      ? `${areaArquivo.toFixed(3)}m² (${enc.areaOcupada?.totalPecas ?? 0} peças)`
      : `${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m${qtd > 1 ? ` (${qtd}un)` : ''}`;
    return `Laser ${opcaoSel?.label ?? ''} ${medida}`;
  }, [opcaoSel, usaArquivo, areaArquivo, enc.areaOcupada, larguraNum, alturaNum, qtd]);

  const handleCopy = () => {
    if (!temPreco || !calc) return;
    // Cópia limpa (vai para o cliente): medida e valor, sem a conta por trás.
    const medida = usaArquivo
      ? `Material: ${areaArquivo.toFixed(2)} m²`
      : `Medida: ${larguraNum.toFixed(2)} x ${alturaNum.toFixed(2)} m — ${qtd} un`;
    const texto = `${opcaoSel?.label ?? 'Laser'}
${medida}
Valor: ${formatCurrency(calc.final)}`;
    navigator.clipboard.writeText(texto).then(
      () => toast.success('Orçamento copiado!'),
      () => toast.error('Não foi possível copiar.')
    );
  };

  const handleAddCotacao = () => {
    if (!temPreco || !calc) return;
    addItem({ descricao, precoSemNota: calc.semNota, precoComNota: calc.comNota });
    toast.success('Adicionado à cotação!');
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="mb-6">
        <p className="text-gray-600">
          Corte a laser por m², conforme o material. Informe a medida da peça ou envie o arquivo
          vetorial para cobrar pelo material que o corte consome. Preços definidos em Configurações.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Como medir o material</label>
            <div className="grid grid-cols-2 gap-3">
              <OptionChip onClick={() => setModo('manual')} active={modo === 'manual'} variant="neutral">
                Medida da peça
              </OptionChip>
              <OptionChip onClick={() => setModo('arquivo')} active={modo === 'arquivo'} variant="neutral">
                Pelo arquivo (SVG/DXF)
              </OptionChip>
            </div>
          </div>

          {usaArquivo ? (
            <EncaixeControles enc={enc} />
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Dimensões e quantidade</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="laser-largura" className="block text-xs text-gray-500 mb-1">Largura (m)</label>
                  <Input id="laser-largura" type="number" min="0" step="0.01" value={largura} onChange={(e) => setLargura(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label htmlFor="laser-altura" className="block text-xs text-gray-500 mb-1">Altura (m)</label>
                  <Input id="laser-altura" type="number" min="0" step="0.01" value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <label htmlFor="laser-qtd" className="block text-xs text-gray-500 mb-1">Quantidade</label>
                  <Input id="laser-qtd" type="number" min="1" step="1" value={quantidade || ''} onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)} placeholder="1" />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Material</label>
            {opcoes.length === 0 ? (
              <span className="text-sm text-gray-500">Nenhum material cadastrado — adicione em Configurações.</span>
            ) : (
              <div className="space-y-4">
                {grupos.map(([cat, itens]) => (
                  <div key={cat}>
                    <div className="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">{cat}</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {itens.map((o) => (
                        <OptionChip key={o.id} onClick={() => setMaterial(o.id)} active={material === o.id} variant="indigo">
                          <ChipProduto label={o.label} descricao={o.description} preco={formatCurrency(o.price)} unidade="/m²" />
                        </OptionChip>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <CalcCheckbox checked={incluirNota} onCheckedChange={setIncluirNota}>
            Emitir com nota fiscal ({ALIQUOTA_NF.toLocaleString('pt-BR')}%)
          </CalcCheckbox>

          <DeslocamentoField {...deslocamento} />
        </div>

        <div className="space-y-6">
          {usaArquivo && <EncaixeVisual enc={enc} />}

          <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento</h3>

          {!entradaValida ? (
            <p className="text-sm text-gray-500">
              {usaArquivo
                ? 'Envie o arquivo e organize as peças na chapa para ver o preço.'
                : 'Informe as dimensões para ver o preço.'}
            </p>
          ) : temPreco && calc && opcaoSel ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Preço de venda</div>
                <div className="text-3xl font-bold text-blue-600">{formatCurrency(calc.final)}</div>
                {incluirNota ? (
                  <div className="mt-1 text-xs text-gray-500">Nota fiscal ({ALIQUOTA_NF.toLocaleString('pt-BR')}%) incluída</div>
                ) : (
                  <div className="mt-1 text-xs text-amber-600 font-medium">
                    Sem nota fiscal — desconto de {formatCurrency(calc.descontoNota)} ({ALIQUOTA_NF.toLocaleString('pt-BR')}%)
                  </div>
                )}
                {!usaArquivo && qtd > 1 && (
                  <div className="mt-1 text-xs text-green-600 font-medium">
                    {qtd} un · unitário {formatCurrency(calc.final / qtd)}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-600"><span>Material:</span><span className="text-right">{opcaoSel.label}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Preço/m²:</span><span>{formatCurrency(precoM2)}</span></div>
                {usaArquivo && enc.areaOcupada ? (
                  <>
                    <div className="flex justify-between text-sm text-gray-600"><span>Material cobrado:</span><span>{calc.areaTotal.toFixed(3)} m²</span></div>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Peças encaixadas:</span>
                      <span>
                        {enc.areaOcupada.totalPecas} em {enc.areaOcupada.totalFolhas}{' '}
                        {enc.areaOcupada.totalFolhas === 1 ? 'chapa' : 'chapas'}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600"><span>Aproveitamento:</span><span>{(enc.areaOcupada.aproveitamento * 100).toFixed(1)}%</span></div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between text-sm text-gray-600"><span>Área (un):</span><span>{calc.areaUnit.toFixed(3)} m²</span></div>
                    {qtd > 1 && (
                      <div className="flex justify-between text-sm text-gray-600"><span>Área total:</span><span>{calc.areaTotal.toFixed(3)} m²</span></div>
                    )}
                  </>
                )}
                {incluirDeslocamento && calc.desloc > 0 && (
                  <div className="flex justify-between text-sm text-gray-600"><span>Deslocamento:</span><span>{formatCurrency(calc.desloc)}</span></div>
                )}
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
    </div>
  );
};

export default LaserManualCalculator;
