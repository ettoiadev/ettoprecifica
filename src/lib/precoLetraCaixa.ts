import type {
  EspessuraPvcLetra,
  FaixaAlturaLetra,
  LetraCaixaConfig,
  MaterialLetraCaixa,
} from '../types/pricing';

/*
 * Preço MANUAL da Letra Caixa. Fica fora do componente de propósito: é a parte
 * que vira dinheiro, então precisa ser testável sem abrir navegador.
 *
 * Dois modelos de cobrança, como no motor:
 *   PVC    → R$/m² da placa, por espessura, com piso de projeto
 *   outros → R$/cm de altura × nº de caracteres, por faixa de altura
 *
 * **Preço não definido não vira R$ 0,00.** Toda função devolve `null` quando a
 * tabela que ela precisa está vazia ou zerada, e quem chama tem que tratar —
 * um zero na tela pareceria um orçamento válido e sairia como proposta.
 */

/** Resultado de uma conta; `null` em qualquer lugar significa "sem preço definido". */
export interface PrecoLetraCaixa {
  /** antes da iluminação */
  base: number;
  adicionalIluminacao: number;
  /** base + iluminação, antes do piso */
  bruto: number;
  /** o que é cobrado: `bruto`, ou o piso quando ele é maior */
  total: number;
  pisoAplicado: boolean;
  /** quanto custou o cm/m² usado, para a composição do orçamento */
  precoUnitario: number;
  faixaUsada?: string;
}

export type Iluminacao = 'sem' | 'retro' | 'frontal';

/**
 * Acha a faixa de uma altura. A faixa de MAIOR `ateCm` também cobre tudo acima
 * dela — senão uma letra de 2m ficaria sem preço justamente no orçamento
 * grande, que é o que menos pode falhar.
 */
export function faixaParaAltura(
  faixas: FaixaAlturaLetra[],
  alturaCm: number
): FaixaAlturaLetra | null {
  const validas = faixas.filter((f) => f.precoCm > 0).sort((a, b) => a.ateCm - b.ateCm);
  if (validas.length === 0) return null;
  return validas.find((f) => alturaCm <= f.ateCm) ?? validas[validas.length - 1];
}

/** Um material já tem preço manual definido? Se não, quem chama cai no motor. */
export function temPrecoManual(material: MaterialLetraCaixa | undefined): boolean {
  return !!material && material.faixas.some((f) => f.precoCm > 0);
}

export function temPrecoPvc(espessura: EspessuraPvcLetra | undefined): boolean {
  return !!espessura && espessura.price > 0;
}

/** PVC: área da placa × R$/m² da espessura, com piso de projeto. */
export function precoPvc(
  config: LetraCaixaConfig,
  espessuraId: string,
  areaM2: number,
  iluminacao: Iluminacao
): PrecoLetraCaixa | null {
  const esp = config.pvcEspessuras.find((e) => e.id === espessuraId);
  if (!temPrecoPvc(esp) || areaM2 <= 0) return null;

  const base = (esp as EspessuraPvcLetra).price * areaM2;
  // o PVC só tem sem/retro; frontal acrílico não se aplica ao modelo por m²
  const adicionalIluminacao = iluminacao === 'retro' ? base * (config.retroPercentual / 100) : 0;
  const bruto = base + adicionalIluminacao;
  /*
   * O piso é de PROJETO, não por peça: incide no total, depois da iluminação.
   * Aplicá-lo antes faria um letreiro pequeno retroiluminado pagar piso + 45%
   * sobre o piso.
   */
  const total = Math.max(bruto, config.pvcPisoProjeto);
  return {
    base,
    adicionalIluminacao,
    bruto,
    total,
    pisoAplicado: total > bruto,
    precoUnitario: (esp as EspessuraPvcLetra).price,
  };
}

/** ACM, galvanizado, inox, 3D: R$/cm da faixa × altura × nº de caracteres. */
export function precoPorAltura(
  config: LetraCaixaConfig,
  materialId: string,
  alturaCm: number,
  nCaracteres: number,
  iluminacao: Iluminacao
): PrecoLetraCaixa | null {
  const material = config.materiais.find((m) => m.id === materialId);
  if (!material || alturaCm <= 0 || nCaracteres <= 0) return null;

  /*
   * O frontal acrílico tem tabela PRÓPRIA (o LED já está no preço), então não
   * leva o acréscimo da retro por cima. Sem a tabela dele preenchida, não há
   * como cobrar frontal: devolve null em vez de cair na tabela padrão, que
   * daria um preço mais barato e errado.
   */
  const usaFrontal = iluminacao === 'frontal';
  const tabela = usaFrontal ? (material.faixasFrontal ?? []) : material.faixas;
  const faixa = faixaParaAltura(tabela, alturaCm);
  if (!faixa) return null;

  const base = faixa.precoCm * alturaCm * nCaracteres;
  const adicionalIluminacao =
    iluminacao === 'retro' ? base * (config.retroPercentual / 100) : 0;
  const bruto = base + adicionalIluminacao;
  return {
    base,
    adicionalIluminacao,
    bruto,
    total: bruto,
    pisoAplicado: false,
    precoUnitario: faixa.precoCm,
    faixaUsada: `até ${faixa.ateCm} cm`,
  };
}

/* ---------------------------------------------------------------------------
 * Pintura automotiva (PU)
 *
 * O vendedor não digita R$/m² de pintura: ele sabe o preço da LATA. Então o
 * R$/m² é derivado, e a tela mostra o caminho inteiro para ele conferir:
 *
 *   R$/litro = preço da lata ÷ litros da lata        (1/4 de galão = 0,9 L)
 *   L/m²     = demãos ÷ rendimento por demão        (ficha de PU: 8–10 m²/L)
 *   R$/m²    = R$/litro × L/m² × multiplicador      (mão de obra, perda, margem)
 *
 * A ÁREA PINTADA é a mesma área de material que já está sendo cobrada, e isso
 * é aproximação deliberada: a área da chapa inclui o retalho entre as letras,
 * que não é pintado (aproveitamento ~60%), e esse retalho compensa de perto as
 * LATERAIS da letra, que são pintadas e não aparecem na área da chapa (num
 * letreiro de 20mm as laterais dão ~metade da face). Face 60% + laterais 30% ≈
 * 90% da área da chapa. Se ele vir que falta tinta na prática, o caminho é
 * subir o multiplicador ou as demãos — não mexer numa área que ninguém mede.
 * --------------------------------------------------------------------------- */

export type TipoPintura = 'sem' | 'simples' | 'especial';

export interface CustoPintura {
  tipo: 'simples' | 'especial';
  /** R$ por m² de área pintada, derivado da lata */
  precoM2: number;
  /** R$ por litro de tinta pronta */
  precoLitro: number;
  /** litros estimados para a área, já com as demãos */
  litros: number;
  /** quantas latas de 1/4 isso representa (fracionário: a sobra serve o próximo) */
  latas: number;
  /** custo só da tinta, sem o multiplicador — é o número que ele confere na loja */
  custoTinta: number;
  /** o que entra no orçamento */
  total: number;
}

/**
 * R$/m² de pintura, derivado do preço da lata. `null` quando o tipo é 'sem'
 * (não há pintura) **ou** quando falta número para a conta — e nesse segundo
 * caso quem chama tem que recusar o orçamento, não cobrar pintura de graça.
 */
export function precoM2Pintura(config: LetraCaixaConfig, tipo: TipoPintura): number | null {
  if (tipo === 'sem') return null;
  const lata = tipo === 'simples' ? config.pinturaSimplesLata : config.pinturaEspecialLata;
  const vol = config.pinturaVolumeLataL;
  const rend = config.pinturaRendimentoM2L;
  const demaos = config.pinturaDemaos;
  const mult = config.pinturaMultiplicador;
  if (!(lata > 0) || !(vol > 0) || !(rend > 0) || !(demaos > 0) || !(mult > 0)) return null;
  return (lata / vol) * (demaos / rend) * mult;
}

/** Custo da pintura para uma área, com os números intermediários para a tela. */
export function custoPintura(
  config: LetraCaixaConfig,
  tipo: TipoPintura,
  areaM2: number
): CustoPintura | null {
  if (tipo === 'sem' || areaM2 <= 0) return null;
  const precoM2 = precoM2Pintura(config, tipo);
  if (precoM2 === null) return null;

  const precoLitro =
    (tipo === 'simples' ? config.pinturaSimplesLata : config.pinturaEspecialLata) /
    config.pinturaVolumeLataL;
  const litros = areaM2 * (config.pinturaDemaos / config.pinturaRendimentoM2L);
  return {
    tipo,
    precoM2,
    precoLitro,
    litros,
    latas: litros / config.pinturaVolumeLataL,
    custoTinta: litros * precoLitro,
    total: precoM2 * areaM2,
  };
}
