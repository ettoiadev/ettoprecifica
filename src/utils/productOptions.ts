import { PricingConfig, ProductVariation } from '../types/pricing';

/**
 * Modelo unificado de opções de produto.
 *
 * As calculadoras de "lista" (Adesivo, Lona, Placa PS, Letra PVC, Vidro) apresentam
 * uma lista de tipos/materiais selecionáveis. Historicamente essas opções eram
 * hardcoded dentro de cada calculadora. Aqui elas passam a viver em uma lista
 * editável `variations: ProductVariation[]` na config de cada seção, permitindo
 * CRUD total (inserir, editar, renomear, excluir) pelas Configurações.
 *
 * Para não quebrar configs já salvas, os campos tipados originais continuam em
 * PricingConfig e `migrateConfig` semeia a lista a partir deles quando ausente.
 */

export type OptionListSection = 'adesivo' | 'lona' | 'placaPS' | 'letraCaixa' | 'vidro';

interface BaseOptionDef {
  id: string;
  label: string;
  priceKey: string;
}

interface SectionOptionsDef {
  baseOptions: BaseOptionDef[];
  /**
   * Se true, as `customVariations` legadas dessa seção também eram opções de tipo
   * (radio) e devem ser incorporadas à lista unificada durante a migração.
   * (Adesivo/Lona). Em placaPS as customVariations são adicionais (checkbox) e
   * NÃO devem ser incorporadas.
   */
  foldLegacyCustomVariations: boolean;
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
};

const OPTION_LIST_SECTIONS = Object.keys(SECTION_OPTIONS) as OptionListSection[];

/** Constrói a lista de opções a partir dos campos base atuais da seção. */
const seedVariations = (
  section: OptionListSection,
  sectionConfig: Record<string, unknown> | undefined,
): ProductVariation[] => {
  const def = SECTION_OPTIONS[section];
  const base: ProductVariation[] = def.baseOptions.map((o) => ({
    id: o.id,
    label: o.label,
    price: Number(sectionConfig?.[o.priceKey]) || 0,
    unit: 'm²',
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

/**
 * Retorna as opções de uma seção. Usa `variations` quando disponível; caso
 * contrário semeia a partir dos campos base (fallback resiliente à migração).
 */
export const getProductOptions = (
  section: OptionListSection,
  config: PricingConfig,
): ProductVariation[] => {
  const sectionConfig = config?.[section] as unknown as Record<string, unknown> | undefined;
  if (sectionConfig && Array.isArray(sectionConfig.variations)) {
    return sectionConfig.variations as ProductVariation[];
  }
  return seedVariations(section, sectionConfig);
};
