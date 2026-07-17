import { PricingConfig, ProductVariation } from '../types/pricing';

/**
 * Modelo unificado de opções de produto.
 *
 * As calculadoras de "lista" apresentam uma lista de tipos/materiais selecionáveis.
 * Historicamente essas opções eram hardcoded dentro de cada calculadora. Aqui elas
 * passam a viver em uma lista editável `variations: ProductVariation[]` na config de
 * cada seção, permitindo CRUD total (inserir, editar, renomear, excluir) pelas
 * Configurações.
 *
 * Para não quebrar configs já salvas, os campos tipados originais continuam em
 * PricingConfig e `migrateConfig` semeia a lista a partir deles quando ausente.
 */

export type OptionListSection =
  | 'adesivo'
  | 'lona'
  | 'placaPS'
  | 'letraCaixa'
  | 'vidro'
  | 'laser'
  | 'placaACM'
  | 'instalacao';

interface BaseOptionDef {
  id: string;
  label: string;
  priceKey: string;
  category?: string;
}

interface SectionOptionsDef {
  baseOptions: BaseOptionDef[];
  /**
   * Se true, as `customVariations` legadas dessa seção também eram opções de tipo
   * (radio) e devem ser incorporadas à lista unificada durante a migração
   * (Adesivo/Lona). Em placaPS as customVariations são adicionais (checkbox) e
   * NÃO devem ser incorporadas.
   */
  foldLegacyCustomVariations: boolean;
  /** Unidade padrão das opções desta seção (default: 'm²'). */
  unit?: string;
}

export const SECTION_OPTIONS: Record<OptionListSection, SectionOptionsDef> = {
  adesivo: {
    baseOptions: [
      { id: 'soRefile', label: 'Só Refile', priceKey: 'soRefile' },
      { id: 'corteEspecial', label: 'Corte Especial', priceKey: 'corteEspecial' },
      { id: 'laminado', label: 'Laminado', priceKey: 'laminado' },
      { id: 'adesivoPerfurado', label: 'Adesivo Perfurado', priceKey: 'adesivoPerfurado' },
      { id: 'imantado', label: 'Imantado', priceKey: 'imantado' },
    ],
    foldLegacyCustomVariations: true,
  },
  lona: {
    baseOptions: [
      { id: 'bannerFaixa', label: 'Banner/Faixa', priceKey: 'bannerFaixa' },
      { id: 'reforcoIlhos', label: 'Reforço e Ilhós', priceKey: 'reforcoIlhos' },
      { id: 'lonaBacklight', label: 'Lona Backlight', priceKey: 'lonaBacklight' },
      { id: 'soRefile', label: 'Só Refile', priceKey: 'soRefile' },
    ],
    foldLegacyCustomVariations: true,
  },
  placaPS: {
    baseOptions: [
      { id: 'espessura1mm', label: 'Espessura 1mm', priceKey: 'espessura1mm' },
      { id: 'espessura2mm', label: 'Espessura 2mm', priceKey: 'espessura2mm' },
    ],
    foldLegacyCustomVariations: false,
  },
  letraCaixa: {
    baseOptions: [
      { id: '10mm', label: 'Espessura 10mm', priceKey: 'espessura10mm' },
      { id: '15mm', label: 'Espessura 15mm', priceKey: 'espessura15mm' },
      { id: '20mm', label: 'Espessura 20mm', priceKey: 'espessura20mm' },
    ],
    foldLegacyCustomVariations: false,
  },
  vidro: {
    baseOptions: [
      { id: '6mm', label: '6mm', priceKey: 'espessura6mm' },
      { id: '8mm', label: '8mm', priceKey: 'espessura8mm' },
    ],
    foldLegacyCustomVariations: false,
  },
  laser: {
    baseOptions: [
      { id: 'acrilicoCristal2mm', label: 'Acrílico Cristal 2mm', priceKey: 'acrilicoCristal2mm', category: 'Acrílico Cristal' },
      { id: 'acrilicoCristal3mm', label: 'Acrílico Cristal 3mm', priceKey: 'acrilicoCristal3mm', category: 'Acrílico Cristal' },
      { id: 'acrilicoCristal5mm', label: 'Acrílico Cristal 5mm', priceKey: 'acrilicoCristal5mm', category: 'Acrílico Cristal' },
      { id: 'acrilicoCristal8mm', label: 'Acrílico Cristal 8mm', priceKey: 'acrilicoCristal8mm', category: 'Acrílico Cristal' },
      { id: 'acrilicoCristal10mm', label: 'Acrílico Cristal 10mm', priceKey: 'acrilicoCristal10mm', category: 'Acrílico Cristal' },
      { id: 'acrilicoColorido3mm', label: 'Acrílico Colorido 3mm', priceKey: 'acrilicoColorido3mm', category: 'Acrílico Colorido' },
      { id: 'acrilicoColorido5mm', label: 'Acrílico Colorido 5mm', priceKey: 'acrilicoColorido5mm', category: 'Acrílico Colorido' },
      { id: 'acrilicoColorido8mm', label: 'Acrílico Colorido 8mm', priceKey: 'acrilicoColorido8mm', category: 'Acrílico Colorido' },
      { id: 'acrilicoColorido10mm', label: 'Acrílico Colorido 10mm', priceKey: 'acrilicoColorido10mm', category: 'Acrílico Colorido' },
      { id: 'acrilicoPretoFume3mm', label: 'Acrílico Preto/Fumê 3mm', priceKey: 'acrilicoPretoFume3mm', category: 'Acrílico Preto/Fumê' },
      { id: 'acrilicoPretoFume5mm', label: 'Acrílico Preto/Fumê 5mm', priceKey: 'acrilicoPretoFume5mm', category: 'Acrílico Preto/Fumê' },
      { id: 'acrilicoPretoFume8mm', label: 'Acrílico Preto/Fumê 8mm', priceKey: 'acrilicoPretoFume8mm', category: 'Acrílico Preto/Fumê' },
      { id: 'psCristal1mm', label: 'PS Cristal 1mm', priceKey: 'psCristal1mm', category: 'PS Cristal' },
      { id: 'psCristal2mm', label: 'PS Cristal 2mm', priceKey: 'psCristal2mm', category: 'PS Cristal' },
      { id: 'psCristal3mm', label: 'PS Cristal 3mm', priceKey: 'psCristal3mm', category: 'PS Cristal' },
      { id: 'psaiBranco1mm', label: 'PSAI Branco 1mm/0mm', priceKey: 'psaiBranco1mm', category: 'PSAI Branco' },
      { id: 'psaiBranco2mm', label: 'PSAI Branco 2mm', priceKey: 'psaiBranco2mm', category: 'PSAI Branco' },
      { id: 'psaiBranco3mm', label: 'PSAI Branco 3mm', priceKey: 'psaiBranco3mm', category: 'PSAI Branco' },
      { id: 'psaiColorido2mm', label: 'PSAI Colorido 2mm', priceKey: 'psaiColorido2mm', category: 'PSAI Colorido' },
      { id: 'mdf3mm', label: 'MDF 3mm', priceKey: 'mdf3mm', category: 'MDF' },
      { id: 'mdf6mm', label: 'MDF 6mm', priceKey: 'mdf6mm', category: 'MDF' },
      { id: 'mdf9mm', label: 'MDF 9mm', priceKey: 'mdf9mm', category: 'MDF' },
      { id: 'pe3mm', label: 'PE 3mm', priceKey: 'pe3mm', category: 'Outros Materiais' },
      { id: 'petg3mm', label: 'PETG 3mm', priceKey: 'petg3mm', category: 'Outros Materiais' },
      { id: 'espelhadoPrata2mm', label: 'Espelhado Prata 2mm', priceKey: 'espelhadoPrata2mm', category: 'Outros Materiais' },
      { id: 'espelhadoPrataDourado3mm', label: 'Espelhado Prata/Dourado 3mm', priceKey: 'espelhadoPrataDourado3mm', category: 'Outros Materiais' },
    ],
    foldLegacyCustomVariations: false,
  },
  placaACM: {
    baseOptions: [{ id: 'padrao', label: 'Placa ACM', priceKey: 'preco' }],
    foldLegacyCustomVariations: false,
  },
  instalacao: {
    baseOptions: [
      { id: 'jacarei', label: 'Jacareí', priceKey: 'jacarei' },
      { id: 'sjCampos', label: 'S.J.Campos', priceKey: 'sjCampos' },
      { id: 'cacapavaTaubate', label: 'Caçapava/Taubaté', priceKey: 'cacapavaTaubate' },
      { id: 'litoral', label: 'Litoral', priceKey: 'litoral' },
      { id: 'guararemaSantaIsabel', label: 'Guararema/Sta Isabel', priceKey: 'guararemaSantaIsabel' },
      { id: 'santaBranca', label: 'Sta Branca', priceKey: 'santaBranca' },
      { id: 'saoPaulo', label: 'São Paulo', priceKey: 'saoPaulo' },
      { id: 'instalacaoLoja', label: 'Instalação em Loja', priceKey: 'instalacaoLoja' },
    ],
    foldLegacyCustomVariations: false,
    unit: 'serviço',
  },
};

const OPTION_LIST_SECTIONS = Object.keys(SECTION_OPTIONS) as OptionListSection[];

/** Constrói a lista de opções a partir dos campos base atuais da seção. */
const seedVariations = (
  section: OptionListSection,
  sectionConfig: Record<string, unknown> | undefined,
): ProductVariation[] => {
  const def = SECTION_OPTIONS[section];
  const unit = def.unit ?? 'm²';
  const base: ProductVariation[] = def.baseOptions.map((o) => ({
    id: o.id,
    label: o.label,
    price: Number(sectionConfig?.[o.priceKey]) || 0,
    unit,
    ...(o.category ? { category: o.category } : {}),
  }));

  if (def.foldLegacyCustomVariations && Array.isArray(sectionConfig?.customVariations)) {
    return [...base, ...(sectionConfig!.customVariations as ProductVariation[])];
  }

  return base;
};

/**
 * Garante que cada seção de lista tenha `variations`. Idempotente: só semeia
 * quando ausente, preservando edições/preços já salvos pelo usuário.
 */
export const migrateConfig = (config: PricingConfig): PricingConfig => {
  const next: PricingConfig = { ...config };

  OPTION_LIST_SECTIONS.forEach((section) => {
    const sectionConfig = next[section] as unknown as Record<string, unknown> | undefined;
    if (sectionConfig && !Array.isArray(sectionConfig.variations)) {
      next[section] = {
        ...(sectionConfig as object),
        variations: seedVariations(section, sectionConfig),
      } as never;
    }
  });

  return next;
};
