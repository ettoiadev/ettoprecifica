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
  | 'letraCaixa'
  | 'vidro'
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
