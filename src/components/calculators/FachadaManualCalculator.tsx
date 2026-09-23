import React, { useEffect, useMemo, useState } from 'react';
import { Copy, PlusCircle } from 'lucide-react';
import {
  formatCurrency,
  ALIQUOTA_NF,
  applyItemMinimumCharge,
  FachadaConfig,
  ProductVariation,
} from '../../types/pricing';
import { useCotacao } from '../../contexts/CotacaoContext';
import { useDeslocamentoCep } from '../../hooks/useDeslocamentoCep';
import DeslocamentoField from './DeslocamentoField';
import { CalcCheckbox, OptionChip } from './CalcControls';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';

// Fachada com preço MANUAL por m², definido em Configurações (config.fachada), NÃO
// pelo motor da skill. Os tipos (nome/descrição/preço/mínimo/ordem) vêm da lista
// editável `config.fachada.itens`. Preço = max(área × R$/m², mínimo do item) — o
// mínimo incide sobre o valor sem nota, como no motor. Deslocamento opcional pelo
// fluxo por CEP (repasse sem NF). Mesmo padrão de Placas/Lona.
interface Props {
  config: FachadaConfig;
}

const FachadaManualCalculator: React.FC<Props> = ({ config }) => {
  const deslocamento = useDeslocamentoCep();
  const { incluirDeslocamento, custoDeslocamento } = deslocamento;
  const opcoes = useMemo<ProductVariation[]>(() => config.itens ?? [], [config.itens]);
  const [tipo, setTipo] = useState<string>(opcoes[0]?.id ?? '');
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [incluirNota, setIncluirNota] = useState<boolean>(true);

  const { addItem } = useCotacao();

  useEffect(() => {
    if (opcoes.length === 0) return;
    if (!opcoes.some((o) => o.id === tipo)) setTipo(opcoes[0].id);
  }, [opcoes, tipo]);

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const custoDeslocamentoNum = parseFloat(custoDeslocamento) || 0;
  const entradaValida = larguraNum > 0 && alturaNum > 0;

  const opcaoSel = opcoes.find((o) => o.id === tipo) ?? opcoes[0];
  const precoM2 = opcaoSel?.price ?? 0;

  const calc = useMemo(() => {
    if (!entradaValida || !opcaoSel) return null;
    const area = larguraNum * alturaNum;
    const porArea = precoM2 * area;
    const produtoSemNota = applyItemMinimumCharge(porArea, opcaoSel.minPrice);
    const minimoAplicado = produtoSemNota > porArea;
    const desloc = incluirDeslocamento ? custoDeslocamentoNum : 0;
    const semNota = produtoSemNota + desloc;
    const comNota = produtoSemNota * (1 + ALIQUOTA_NF / 100) + desloc;
    const descontoNota = comNota - semNota;
    const final = incluirNota ? comNota : semNota;
    return { area, minimoAplicado, minimo: produtoSemNota, desloc, semNota, comNota, descontoNota, final };
  }, [entradaValida, opcaoSel, larguraNum, alturaNum, precoM2, incluirDeslocamento, custoDeslocamentoNum, incluirNota]);

  const temPreco = !!calc && calc.final > 0;

  const descricao = useMemo(
    () => `${opcaoSel?.label ?? 'Fachada'} ${larguraNum.toFixed(2)}×${alturaNum.toFixed(2)}m`,
    [opcaoSel, larguraNum, alturaNum]
  );

  const handleCopy = () => {
    if (!temPreco || !calc || !opcaoSel) return;
    const texto = `${opcaoSel.label}
Medida: ${larguraNum.toFixed(2)} x ${alturaNum.toFixed(2)} m
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
    <div className="p-6">
      <div className="mb-6">
        <p className="text-gray-600">
          Escolha o tipo e as medidas. Preço por m² e valor mínimo definidos em Configurações.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de fachada</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {opcoes.length === 0 ? (
                <span className="text-sm text-gray-500">Nenhum tipo cadastrado — adicione em Configurações.</span>
              ) : opcoes.map((o) => (
                <OptionChip key={o.id} onClick={() => setTipo(o.id)} active={tipo === o.id} variant="indigo">
                  <div className="text-base font-semibold">{o.label}</div>
                  <div className="text-xs opacity-70 mt-0.5">
                    {o.description ? `${o.description} · ` : ''}{formatCurrency(o.price)}/m²
                  </div>
                </OptionChip>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Dimensões</label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Largura (m)</label>
                <Input type="number" min="0" step="0.01" value={largura} onChange={(e) => setLargura(e.target.value)} placeholder="0.00" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Altura (m)</label>
                <Input type="number" min="0" step="0.01" value={altura} onChange={(e) => setAltura(e.target.value)} placeholder="0.00" />
              </div>
            </div>
            {entradaValida && (
              <p className="text-sm text-gray-600 mt-2">Área: {(larguraNum * alturaNum).toFixed(2)} m²</p>
            )}
          </div>

          <CalcCheckbox checked={incluirNota} onCheckedChange={setIncluirNota}>
            Emitir com nota fiscal ({ALIQUOTA_NF.toLocaleString('pt-BR')}%)
          </CalcCheckbox>

          <DeslocamentoField {...deslocamento} />
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento</h3>

          {!entradaValida ? (
            <p className="text-sm text-gray-500">Preencha largura e altura para ver o preço.</p>
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
                {calc.minimoAplicado && (
                  <div className="mt-1 text-xs text-amber-600 font-medium">
                    Abaixo do mínimo — cobrando o mínimo de {formatCurrency(calc.minimo)}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-600"><span>Tipo:</span><span className="text-right">{opcaoSel.label}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Preço/m²:</span><span>{formatCurrency(precoM2)}</span></div>
                <div className="flex justify-between text-sm text-gray-600"><span>Área:</span><span>{calc.area.toFixed(2)} m²</span></div>
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
  );
};

export default FachadaManualCalculator;
