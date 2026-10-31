import React, { useEffect, useMemo, useState } from 'react';
import { Copy, PlusCircle } from 'lucide-react';
import { formatCurrency, ALIQUOTA_NF, AdesivoConfig, ProductVariation } from '../../types/pricing';
import { useCotacao } from '../../contexts/CotacaoContext';
import { useDeslocamentoCep } from '../../hooks/useDeslocamentoCep';
import DeslocamentoField from './DeslocamentoField';
import AdesivoRecorteEngineCalculator from './AdesivoRecorteEngineCalculator';
import { CalcCheckbox, OptionChip, ChipProduto } from './CalcControls';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';

// Adesivos (impresso + recorte) com preço MANUAL, definido em Configurações. A
// lista de tipos (nome, descrição, preço e ordem) vem de config.itens — editável
// em Configurações > Adesivos (renomear, reordenar, add/excluir); a ordem e os
// nomes refletem aqui. O preço com nota sai de um percentual único. Deslocamento
// opcional pelo fluxo por CEP, somado à parte (sem incidência de nota fiscal).
//
// EXCEÇÃO (a pedido do Étto): os tipos "Adesivo Recorte 1 Cor" e "Adesivo Recorte
// 2 Cores" voltaram ao MOTOR da skill (calc_adesivo_recorte) — ao selecioná-los, a
// calculadora renderiza o painel AdesivoRecorteEngineCalculator em vez do cálculo
// manual. O vínculo é por id (renomear/reordenar mantém), via RECORTE_ENGINE_CORES.
interface Props {
  config: AdesivoConfig;
}

// Tipos de recorte precificados pelo motor da skill → nº de cores fixado pelo tipo.
const RECORTE_ENGINE_CORES: Record<string, 1 | 2> = { recorte1Cor: 1, recorte2Cores: 2 };

// Tipos manuais que ainda oferecem a caixa de máscara de transferência (por id).
// Recorte 1/2 cores saíram daqui (a máscara deles é tratada no motor); sobra o
// Refletivo, que continua manual.
const RECORTE_IDS = new Set(['refletivo']);


const AdesivoManualCalculator: React.FC<Props> = ({ config }) => {
  const deslocamento = useDeslocamentoCep();
  const { incluirDeslocamento, custoDeslocamento } = deslocamento;
  const opcoes = useMemo<ProductVariation[]>(() => config.itens ?? [], [config.itens]);
  const [materialId, setMaterialId] = useState<string>(opcoes[0]?.id ?? '');
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [incluirMascara, setIncluirMascara] = useState<boolean>(false);
  // Nota fiscal ligada por padrão: o preço aparece SEMPRE com a alíquota embutida.
  const [incluirNota, setIncluirNota] = useState<boolean>(true);

  const { addItem } = useCotacao();

  // Garante uma seleção válida quando a lista muda (renomear/reordenar/excluir).
  useEffect(() => {
    if (opcoes.length === 0) return;
    if (!opcoes.some((o) => o.id === materialId)) setMaterialId(opcoes[0].id);
  }, [opcoes, materialId]);

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const qtd = quantidade > 0 ? quantidade : 1;
  const custoDeslocamentoNum = parseFloat(custoDeslocamento) || 0;
  const entradaValida = larguraNum > 0 && alturaNum > 0;

  const opcaoSel = opcoes.find((o) => o.id === materialId) ?? opcoes[0];
  // Recorte 1/2 cores: precificados pelo motor (renderiza outro painel).
  const engineCores = RECORTE_ENGINE_CORES[opcaoSel?.id ?? ''];
  const isEngine = engineCores !== undefined;
  const precoM2 = opcaoSel?.price ?? 0;
  const mascaraM2 = config.mascaraTransferenciaM2 || 0;
  // Só os adesivos de recorte oferecem máscara de transferência.
  const mascaraDisponivel = RECORTE_IDS.has(opcaoSel?.id ?? '');
  const aplicarMascara = mascaraDisponivel && incluirMascara;

  const calc = useMemo(() => {
    if (!entradaValida || !opcaoSel) return null;
    const areaUnit = larguraNum * alturaNum;
    const areaTotal = areaUnit * qtd;
    const mascara = aplicarMascara ? mascaraM2 * areaTotal : 0;
    const produtoSemNota = precoM2 * areaTotal + mascara;
    const desloc = incluirDeslocamento ? custoDeslocamentoNum : 0;
    const semNota = produtoSemNota + desloc;
    const comNota = produtoSemNota * (1 + ALIQUOTA_NF / 100) + desloc;
    const descontoNota = comNota - semNota; // valor exato da alíquota (repasse à parte)
    const final = incluirNota ? comNota : semNota;
    return { areaUnit, areaTotal, mascara, produtoSemNota, desloc, semNota, comNota, descontoNota, final };
  }, [entradaValida, opcaoSel, larguraNum, alturaNum, qtd, precoM2, aplicarMascara, mascaraM2, incluirDeslocamento, custoDeslocamentoNum, incluirNota]);

  const temPreco = !!calc && calc.final > 0;

  const descricao = useMemo(
    () =>
      `${opcaoSel?.label ?? 'Adesivo'} ${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m${qtd > 1 ? ` (${qtd}un)` : ''}`,
    [opcaoSel, larguraNum, alturaNum, qtd]
  );

  const handleCopy = () => {
    if (!temPreco || !calc || !opcaoSel) return;
    const texto = `${opcaoSel.label}
Medida: ${larguraNum.toFixed(2)} x ${alturaNum.toFixed(2)} m — ${qtd} un
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
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Adesivos</h2>
        <p className="text-gray-600">
          Adesivo impresso e de recorte por m². Preços e ordem definidos em Configurações.
        </p>
      </div>

      {/* Medida antes do tipo — mesma ordem da Lona (a pedido do Étto, 30/10/26).
          Fica FORA da grade de 2 colunas da página, mas limitada a metade da
          largura (w-1/2 menos o pr-4 = 543px, a mesma da coluna da esquerda),
          senão os 3 campos esticariam pelos 1118px da linha inteira. Some no
          modo motor: o painel de recorte 1/2 cores tem os campos de medida dele,
          com alternância entre medida e metro linear. */}
      {!isEngine && (
        <div className="mb-6 lg:w-1/2 lg:pr-4">
          <label className="block text-sm font-medium text-gray-700 mb-3">Dimensões e quantidade</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="adesivo-largura" className="block text-xs text-gray-500 mb-1">Largura (m)</label>
              <Input id="adesivo-largura" type="number" min="0" step="0.01" value={largura} onChange={(e) => setLargura(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label htmlFor="adesivo-altura" className="block text-xs text-gray-500 mb-1">Altura (m)</label>
              <Input id="adesivo-altura" type="number" min="0" step="0.01" value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <label htmlFor="adesivo-quantidade" className="block text-xs text-gray-500 mb-1">Quantidade</label>
              <Input id="adesivo-quantidade" type="number" min="1" step="1" value={quantidade || ''} onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)} placeholder="1" />
            </div>
          </div>
        </div>
      )}

      {/* Seleção de tipo (sempre visível) — fica no topo porque alguns tipos
          trocam o corpo inteiro da calculadora (recorte 1/2 cores usam o motor).
          Por ficar FORA da grade de 2 colunas da página, a lista vai em 2
          colunas: numa só, o chip ocuparia a largura inteira (1118px, o dobro
          das outras abas) e o preço ficaria longe demais do nome. Com 2, o chip
          fica com ~550px — a mesma largura de Lona/Placas/Fachada. */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de adesivo</label>
        {opcoes.length === 0 ? (
          <span className="text-sm text-gray-500">Nenhum tipo cadastrado — adicione em Configurações.</span>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
            {opcoes.map((o) => (
              <OptionChip key={o.id} onClick={() => setMaterialId(o.id)} active={materialId === o.id} variant="indigo">
                <ChipProduto
                  label={o.label}
                  descricao={o.description}
                  preco={RECORTE_ENGINE_CORES[o.id] ? 'pelo motor' : formatCurrency(o.price)}
                  unidade={RECORTE_ENGINE_CORES[o.id] ? undefined : '/m²'}
                />
              </OptionChip>
            ))}
          </div>
        )}
      </div>

      {isEngine ? (
        <AdesivoRecorteEngineCalculator cores={engineCores} titulo={opcaoSel?.label ?? 'Adesivo de Recorte'} />
      ) : (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          {mascaraDisponivel && (
            <div>
              <CalcCheckbox checked={incluirMascara} onCheckedChange={setIncluirMascara}>
            Incluir máscara de transferência ({formatCurrency(mascaraM2)}/m²)
          </CalcCheckbox>
            </div>
          )}

          <CalcCheckbox checked={incluirNota} onCheckedChange={setIncluirNota}>
            Emitir com nota fiscal ({ALIQUOTA_NF.toLocaleString('pt-BR')}%)
          </CalcCheckbox>

          <DeslocamentoField {...deslocamento} />
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento</h3>

          {!entradaValida ? (
            <p className="text-sm text-gray-500">Informe as dimensões para ver o preço.</p>
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
                {qtd > 1 && (
                  <div className="mt-1 text-xs text-green-600 font-medium">
                    {qtd} un · unitário {formatCurrency(calc.final / qtd)}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-600"><span>Tipo:</span><span className="text-right">{opcaoSel.label}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Preço/m²:</span><span>{formatCurrency(precoM2)}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Área (un):</span><span>{calc.areaUnit.toFixed(2)} m²</span></div>
                {qtd > 1 && (
                  <div className="flex justify-between text-sm text-gray-600"><span>Área total:</span><span>{calc.areaTotal.toFixed(2)} m²</span></div>
                )}
                {aplicarMascara && calc.mascara > 0 && (
                  <div className="flex justify-between text-sm text-gray-600"><span>Máscara de transferência:</span><span>{formatCurrency(calc.mascara)}</span></div>
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
      )}
    </div>
  );
};

export default AdesivoManualCalculator;
