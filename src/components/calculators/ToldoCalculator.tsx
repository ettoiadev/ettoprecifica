/*
 * Toldo — preço MANUAL, definido em Configurações (config.toldo).
 *
 * Três tipos com unidades de cobrança DIFERENTES: cortina e articulado por
 * metro linear da largura; fixo por metro quadrado. Além do preço base há dois
 * adicionais: o acabamento viseira (só cortina) e o serviço de solda.
 *
 * A SOLDA é a parte que exige conta. A lona vem em rolo e só uma parte da
 * largura é aproveitável (`lonaLarguraUtil`, 1,35m por padrão). Um toldo mais
 * largo que isso precisa de faixas emendadas, e a emenda é VERTICAL — então
 * o número de soldas sai de dividir a LARGURA pela faixa, e o comprimento de
 * cada solda é a outra medida (caída, no cortina/articulado; projeção, no
 * fixo). Exemplo do Étto: toldo de 5,00 × 2,00 m → 4 faixas, 3 soldas de
 * 2,00 m = 6,00 m de emenda.
 */
import React, { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Copy, PlusCircle } from 'lucide-react';
import { formatCurrency, ALIQUOTA_NF, ToldoConfig } from '../../types/pricing';
import { useCotacao } from '../../contexts/CotacaoContext';
import { useDeslocamentoCep } from '../../hooks/useDeslocamentoCep';
import DeslocamentoField from './DeslocamentoField';
import { CalcCheckbox, OptionChip } from './CalcControls';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { toast } from 'sonner';

interface Props {
  config: ToldoConfig;
}

type TipoToldo = 'cortina' | 'articulado' | 'fixo';

const TIPO_LABEL: Record<TipoToldo, string> = {
  cortina: 'Toldo cortina (manivela)',
  articulado: 'Toldo articulado (manivela)',
  fixo: 'Toldo fixo',
};

const TIPO_DESCRICAO: Record<TipoToldo, string> = {
  cortina: 'Desce na vertical, como cortina. Cobrado por metro linear.',
  articulado: 'Braços que abrem para a frente. Cobrado por metro linear.',
  fixo: 'Estrutura permanente, com laterais. Cobrado por metro quadrado.',
};

/*
 * Limites físicos do produto, informados pelo Étto:
 *  - o tubo onde a lona enrola é fabricado até 6 m, então o cortina não passa
 *    disso de largura sem virar dois toldos;
 *  - a caída do cortina vai até 3 m.
 * São AVISOS, não travas: o vendedor pode estar orçando um caso especial.
 */
const TUBO_MAX_M = 6.0;
const CAIDA_MAX_M = 3.0;
/** Faixa usual da lateral do toldo fixo; fora disso, só avisa. */
const LATERAL_MIN_M = 0.4;
const LATERAL_MAX_M = 0.9;

const ToldoCalculator: React.FC<Props> = ({ config }) => {
  const deslocamento = useDeslocamentoCep();
  const { incluirDeslocamento, custoDeslocamento } = deslocamento;
  const { addItem } = useCotacao();

  // Fixo primeiro, e já selecionado: é o que o Étto mais orça.
  const [tipo, setTipo] = useState<TipoToldo>('fixo');
  const [largura, setLargura] = useState<string>('');
  const [vertical, setVertical] = useState<string>(''); // caída (cortina/articulado) ou projeção (fixo)
  const [quantidade, setQuantidade] = useState<string>('1');
  const [comLaterais, setComLaterais] = useState<boolean>(true);
  const [alturaLateral, setAlturaLateral] = useState<string>('0.60');
  const [comViseira, setComViseira] = useState<boolean>(false);
  const [incluirSolda, setIncluirSolda] = useState<boolean>(false);
  const [incluirNota, setIncluirNota] = useState<boolean>(true);

  const larguraNum = parseFloat(largura) || 0;
  const verticalNum = parseFloat(vertical) || 0;
  const qtd = Math.max(1, parseInt(quantidade, 10) || 1);
  const alturaLateralNum = parseFloat(alturaLateral) || 0;
  const custoDeslocamentoNum = parseFloat(custoDeslocamento) || 0;

  const isFixo = tipo === 'fixo';
  const isCortina = tipo === 'cortina';
  const larguraUtil = config.lonaLarguraUtil > 0 ? config.lonaLarguraUtil : 1.35;

  const entradaValida = larguraNum > 0 && verticalNum > 0;

  // Faixas de lona e emendas. Ver o comentário do topo do arquivo.
  const solda = useMemo(() => {
    if (larguraNum <= 0) return { faixas: 0, emendas: 0, metros: 0, necessaria: false };
    const faixas = Math.ceil(larguraNum / larguraUtil);
    const emendas = Math.max(0, faixas - 1);
    return {
      faixas,
      emendas,
      metros: emendas * verticalNum * qtd,
      necessaria: emendas > 0,
    };
  }, [larguraNum, verticalNum, qtd, larguraUtil]);

  // "O sistema deve ser capaz de identificar isso e acionar o serviço de
  // solda": quando a medida passa da faixa de lona, a caixa liga sozinha. O
  // vendedor ainda pode desmarcar — aí aparece o aviso em âmbar.
  useEffect(() => {
    if (solda.necessaria) setIncluirSolda(true);
    else setIncluirSolda(false);
  }, [solda.necessaria]);

  const calc = useMemo(() => {
    if (!entradaValida) return null;

    const areaTopo = larguraNum * verticalNum;
    const areaLaterais = isFixo && comLaterais ? 2 * verticalNum * alturaLateralNum : 0;
    const areaTotal = (areaTopo + areaLaterais) * qtd;

    const base = isFixo
      ? areaTotal * config.fixoM2
      : larguraNum *
        qtd *
        (isCortina ? config.cortinaMetroLinear : config.articuladoMetroLinear);

    const viseira =
      isCortina && comViseira ? larguraNum * qtd * config.viseiraMetroLinear : 0;
    const custoSolda = incluirSolda ? solda.metros * config.soldaMetroLinear : 0;

    const produtoSemNota = base + viseira + custoSolda;
    const desloc = incluirDeslocamento ? custoDeslocamentoNum : 0;
    const semNota = produtoSemNota + desloc;
    // Deslocamento é repasse: não incide NF.
    const comNota = produtoSemNota * (1 + ALIQUOTA_NF / 100) + desloc;

    return {
      areaTopo,
      areaLaterais,
      areaTotal,
      base,
      viseira,
      custoSolda,
      desloc,
      semNota,
      comNota,
      descontoNota: comNota - semNota,
      final: incluirNota ? comNota : semNota,
    };
  }, [
    entradaValida,
    larguraNum,
    verticalNum,
    qtd,
    isFixo,
    isCortina,
    comLaterais,
    alturaLateralNum,
    comViseira,
    incluirSolda,
    solda.metros,
    config,
    incluirDeslocamento,
    custoDeslocamentoNum,
    incluirNota,
  ]);

  const avisos = useMemo(() => {
    const lista: string[] = [];
    if (isCortina && larguraNum > TUBO_MAX_M) {
      lista.push(
        `O tubo de enrolar vai até ${TUBO_MAX_M.toFixed(1).replace('.', ',')} m. Acima disso o serviço vira mais de um toldo.`
      );
    }
    if (isCortina && verticalNum > CAIDA_MAX_M) {
      lista.push(
        `A caída da lona vai até ${CAIDA_MAX_M.toFixed(1).replace('.', ',')} m.`
      );
    }
    if (
      isFixo &&
      comLaterais &&
      alturaLateralNum > 0 &&
      (alturaLateralNum < LATERAL_MIN_M || alturaLateralNum > LATERAL_MAX_M)
    ) {
      lista.push('A lateral do toldo fixo costuma ficar entre 40 e 90 cm. Confira a medida.');
    }
    if (solda.necessaria && !incluirSolda) {
      lista.push(
        `Esta medida passa da faixa de lona (${larguraUtil.toFixed(2).replace('.', ',')} m), então precisa de emenda. Sem o serviço de solda, o preço está incompleto.`
      );
    }
    return lista;
  }, [isCortina, isFixo, larguraNum, verticalNum, comLaterais, alturaLateralNum, solda.necessaria, incluirSolda, larguraUtil]);

  const rotuloVertical = isFixo ? 'Projeção (m)' : 'Caída da lona (m)';

  const descricao = useMemo(() => {
    const medida = isFixo
      ? `${larguraNum.toFixed(2)}×${verticalNum.toFixed(2)}m${comLaterais ? ` + laterais ${alturaLateralNum.toFixed(2)}m` : ''}`
      : `${larguraNum.toFixed(2)}m de largura × ${verticalNum.toFixed(2)}m de caída`;
    return `${TIPO_LABEL[tipo]} ${medida}${qtd > 1 ? ` (${qtd}un)` : ''}`;
  }, [tipo, isFixo, larguraNum, verticalNum, comLaterais, alturaLateralNum, qtd]);

  const temPreco = !!calc && calc.final > 0;

  const handleCopy = () => {
    if (!temPreco || !calc) return;
    // Cópia limpa (vai para o cliente): produto, medida e valor.
    const medida = isFixo
      ? `Medida: ${larguraNum.toFixed(2)} x ${verticalNum.toFixed(2)} m de projeção`
      : `Medida: ${larguraNum.toFixed(2)} m de largura x ${verticalNum.toFixed(2)} m de caída`;
    const texto = `${TIPO_LABEL[tipo]}${isCortina && comViseira ? ' com viseira' : ''}
${medida}${qtd > 1 ? ` — ${qtd} un` : ''}
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

  const precoUnidade = isFixo
    ? `${formatCurrency(config.fixoM2)}/m²`
    : `${formatCurrency(isCortina ? config.cortinaMetroLinear : config.articuladoMetroLinear)}/m linear`;

  return (
    <div className="p-6">
      <div className="mb-6">
        <p className="text-gray-600">
          Cortina e articulado são cobrados por metro linear da largura; o fixo, por metro
          quadrado. A emenda da lona é calculada a partir da largura aproveitável do rolo. Preços
          definidos em Configurações.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de toldo</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {(['fixo', 'cortina', 'articulado'] as TipoToldo[]).map((t) => (
                <OptionChip key={t} onClick={() => setTipo(t)} active={tipo === t} variant="indigo">
                  <span className="block font-medium">{TIPO_LABEL[t]}</span>
                  <span className="block text-xs opacity-70 mt-0.5">
                    {t === 'fixo'
                      ? `${formatCurrency(config.fixoM2)}/m²`
                      : `${formatCurrency(t === 'cortina' ? config.cortinaMetroLinear : config.articuladoMetroLinear)}/m linear`}
                  </span>
                </OptionChip>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-2">{TIPO_DESCRICAO[tipo]}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Medidas e quantidade
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="toldo-largura" className="block text-xs text-gray-500 mb-1">
                  Largura (m)
                </label>
                <Input
                  id="toldo-largura"
                  type="number"
                  min="0"
                  step="0.01"
                  value={largura}
                  onChange={(e) => setLargura(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="toldo-vertical" className="block text-xs text-gray-500 mb-1">
                  {rotuloVertical}
                </label>
                <Input
                  id="toldo-vertical"
                  type="number"
                  min="0"
                  step="0.01"
                  value={vertical}
                  onChange={(e) => setVertical(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label htmlFor="toldo-qtd" className="block text-xs text-gray-500 mb-1">
                  Quantidade
                </label>
                <Input
                  id="toldo-qtd"
                  type="number"
                  min="1"
                  step="1"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {isFixo
                ? 'A projeção é o quanto o toldo avança a partir da parede.'
                : 'A caída é o quanto a lona desce. É ela que dá o comprimento de cada emenda.'}
            </p>
          </div>

          {isFixo && (
            <div className="space-y-3">
              <CalcCheckbox
                checked={comLaterais}
                onCheckedChange={setComLaterais}
                description="Fechamento dos dois lados do toldo, cobrado como área adicional."
              >
                Com laterais
              </CalcCheckbox>
              {comLaterais && (
                <div className="w-full sm:w-1/2">
                  <label htmlFor="toldo-lateral" className="block text-xs text-gray-500 mb-1">
                    Altura da lateral (m)
                  </label>
                  <Input
                    id="toldo-lateral"
                    type="number"
                    min="0"
                    step="0.01"
                    value={alturaLateral}
                    onChange={(e) => setAlturaLateral(e.target.value)}
                  />
                </div>
              )}
            </div>
          )}

          {isCortina && (
            <CalcCheckbox
              checked={comViseira}
              onCheckedChange={setComViseira}
              description={`Acréscimo de ${formatCurrency(config.viseiraMetroLinear)} por metro de largura.`}
            >
              Acabamento viseira
            </CalcCheckbox>
          )}

          <CalcCheckbox
            checked={incluirSolda}
            onCheckedChange={setIncluirSolda}
            description={
              solda.necessaria
                ? `${solda.faixas} faixas de lona · ${solda.emendas} ${solda.emendas === 1 ? 'emenda' : 'emendas'} de ${verticalNum.toFixed(2)} m${qtd > 1 ? ` × ${qtd}` : ''} = ${solda.metros.toFixed(2)} m a ${formatCurrency(config.soldaMetroLinear)}/m`
                : `A medida cabe numa faixa de ${larguraUtil.toFixed(2).replace('.', ',')} m — sem emenda.`
            }
          >
            Serviço de solda
          </CalcCheckbox>

          {avisos.map((a) => (
            <div
              key={a}
              className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800"
            >
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{a}</span>
            </div>
          ))}

          <CalcCheckbox checked={incluirNota} onCheckedChange={setIncluirNota}>
            Emitir com nota fiscal ({ALIQUOTA_NF.toLocaleString('pt-BR')}%)
          </CalcCheckbox>

          <DeslocamentoField {...deslocamento} />
        </div>

        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orçamento</h3>

          {!entradaValida ? (
            <p className="text-sm text-gray-500">
              Informe a largura e a {isFixo ? 'projeção' : 'caída'} para ver o preço.
            </p>
          ) : temPreco && calc ? (
            <div className="space-y-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Preço de venda</div>
                <div className="text-3xl font-bold text-blue-600">
                  {formatCurrency(calc.final)}
                </div>
                {incluirNota ? (
                  <div className="mt-1 text-xs text-gray-500">
                    Nota fiscal ({ALIQUOTA_NF.toLocaleString('pt-BR')}%) incluída
                  </div>
                ) : (
                  <div className="mt-1 text-xs text-amber-600 font-medium">
                    Sem nota fiscal — desconto de {formatCurrency(calc.descontoNota)} (
                    {ALIQUOTA_NF.toLocaleString('pt-BR')}%)
                  </div>
                )}
                {qtd > 1 && (
                  <div className="mt-1 text-xs text-green-600 font-medium">
                    {qtd} un · unitário {formatCurrency(calc.final / qtd)}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Tipo:</span>
                  <span className="text-right">{TIPO_LABEL[tipo]}</span>
                </div>
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Preço:</span>
                  <span>{precoUnidade}</span>
                </div>

                {isFixo ? (
                  <>
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Área do toldo:</span>
                      <span>{calc.areaTopo.toFixed(2)} m²</span>
                    </div>
                    {calc.areaLaterais > 0 && (
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Laterais (2×):</span>
                        <span>{calc.areaLaterais.toFixed(2)} m²</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm text-gray-600">
                      <span>Área cobrada:</span>
                      <span>{calc.areaTotal.toFixed(2)} m²</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Largura cobrada:</span>
                    <span>{(larguraNum * qtd).toFixed(2)} m lineares</span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-gray-600 pt-1 border-t border-gray-200">
                  <span>Toldo:</span>
                  <span>{formatCurrency(calc.base)}</span>
                </div>
                {calc.viseira > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Viseira:</span>
                    <span>{formatCurrency(calc.viseira)}</span>
                  </div>
                )}
                {calc.custoSolda > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>
                      Solda ({solda.emendas} × {verticalNum.toFixed(2)} m = {solda.metros.toFixed(2)} m):
                    </span>
                    <span>{formatCurrency(calc.custoSolda)}</span>
                  </div>
                )}
                {incluirDeslocamento && calc.desloc > 0 && (
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Deslocamento:</span>
                    <span>{formatCurrency(calc.desloc)}</span>
                  </div>
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

export default ToldoCalculator;
