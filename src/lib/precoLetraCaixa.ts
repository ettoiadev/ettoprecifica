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
