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

// Base canônica das listas editáveis de itens (`config.<secao>.itens`). Cada
// entrada diz o id, nome, descrição/categoria e a qual campo de preço da config a
// semente corresponde. migrateConfig usa isto para semear `itens` a partir dos
// preços já salvos (preservando ajustes; idempotente). Chave `itens` (não
// `variations`) de propósito, para não colidir com esquemas antigos.
type ItemBase = { id: string; label: string; description?: string; category?: string; priceKey: string; unit?: string };

export const ADESIVO_BASE: ItemBase[] = [
  { id: 'digital', label: 'Adesivo Impresso', description: 'Impressão só refilado', priceKey: 'digital' },
  { id: 'digitalPeliculaTransparente', label: 'Adesivo Impresso Laminado Fosco ou Brilho', description: 'Impressão com laminação brilho ou fosco', priceKey: 'digitalPeliculaTransparente' },
  { id: 'transparente', label: 'Adesivo Transparente Impresso', description: 'Impressão', priceKey: 'transparente' },
  { id: 'perfurado', label: 'Adesivo Perfurado', description: 'Para carros ou vidros', priceKey: 'perfurado' },
  { id: 'recorte1Cor', label: 'Adesivo Recorte 1 Cor', description: 'Recorte Gold Max', priceKey: 'recorte1Cor' },
  { id: 'recorte2Cores', label: 'Adesivo Recorte 2 Cores', description: 'Recorte Gold Max', priceKey: 'recorte2Cores' },
  { id: 'jateado', label: 'Adesivo Jateado', description: 'Para vidros', priceKey: 'jateado' },
  { id: 'blackout', label: 'Adesivo corte contorno', description: 'Adesivo impresso com corte no formato', priceKey: 'blackout' },
  { id: 'refletivo', label: 'Adesivo Refletivo', description: 'Alta visibilidade / sinalização', priceKey: 'refletivo' },
  { id: 'imaCarroAdesivado', label: 'Imã de Carro Adesivado', description: 'Imã para carros', priceKey: 'imaCarroAdesivado' },
];

const LONA_BASE: ItemBase[] = [
  { id: 'bannerSemAcabamento', label: 'Banner / Faixa', priceKey: 'bannerSemAcabamento' },
  { id: 'reforcoIlhos', label: 'Lona reforço e ilhós', priceKey: 'reforcoIlhos' },
  { id: 'lonaGrande', label: 'Lona grande (maior que 1,80 largura)', priceKey: 'lonaGrande' },
  { id: 'lonaTranslucida', label: 'Lona translúcida', priceKey: 'lonaTranslucida' },
];

const PLACA_PS_BASE: ItemBase[] = [
  { id: 'branco1mm', label: 'Placa PS Branco 1mm', priceKey: 'branco1mm' },
  { id: 'branco2mm', label: 'Placa PS Branco 2mm', priceKey: 'branco2mm' },
  { id: 'branco3mm', label: 'Placa PS Branco 3mm', priceKey: 'branco3mm' },
  { id: 'cristal15mm', label: 'PS Cristal 1,5mm', priceKey: 'cristal15mm' },
  { id: 'cristal2mm', label: 'PS Cristal 2mm', priceKey: 'cristal2mm' },
  { id: 'cristal3mm', label: 'PS Cristal 3mm', priceKey: 'cristal3mm' },
];

const PLACA_ACM_BASE: ItemBase[] = [
  { id: 'brancoBrilho3mm', label: 'ACM Branco Brilho 3mm', priceKey: 'brancoBrilho3mm' },
  { id: 'madeira3mm', label: 'ACM Madeira 3mm', priceKey: 'madeira3mm' },
];

const LASER_BASE: ItemBase[] = [
  { id: 'acrilicoColorido3mm', label: 'Acrílico Colorido 3mm', category: 'Acrílico', priceKey: 'acrilicoColorido3mm' },
  { id: 'acrilicoCristal2mm', label: 'Acrílico Cristal 2mm', category: 'Acrílico', priceKey: 'acrilicoCristal2mm' },
  { id: 'acrilicoCristal3mm', label: 'Acrílico Cristal 3mm', category: 'Acrílico', priceKey: 'acrilicoCristal3mm' },
  { id: 'acrilicoCristal5mm', label: 'Acrílico Cristal 5mm', category: 'Acrílico', priceKey: 'acrilicoCristal5mm' },
  { id: 'acrilicoCristal8mm', label: 'Acrílico Cristal 8mm', category: 'Acrílico', priceKey: 'acrilicoCristal8mm' },
  { id: 'acrilicoCristal10mm', label: 'Acrílico Cristal 10mm', category: 'Acrílico', priceKey: 'acrilicoCristal10mm' },
  { id: 'espelhadoDourado2mm', label: 'Acrílico Espelhado Dourado 2mm', category: 'Acrílico Espelhado', priceKey: 'espelhadoDourado2mm' },
  { id: 'espelhadoPrata2mm', label: 'Acrílico Espelhado Prata 2mm', category: 'Acrílico Espelhado', priceKey: 'espelhadoPrata2mm' },
  { id: 'espelhadoRose2mm', label: 'Acrílico Espelhado Rosé 2mm', category: 'Acrílico Espelhado', priceKey: 'espelhadoRose2mm' },
  { id: 'mdf3mm', label: 'MDF 3mm', category: 'Outros', priceKey: 'mdf3mm' },
  { id: 'mdf6mm', label: 'MDF 6mm', category: 'Outros', priceKey: 'mdf6mm' },
  { id: 'mdf9mm', label: 'MDF 9mm', category: 'Outros', priceKey: 'mdf9mm' },
  { id: 'psCristal2mm', label: 'PS Cristal 2mm', category: 'Outros', priceKey: 'psCristal2mm' },
  { id: 'psCristal3mm', label: 'PS Cristal 3mm', category: 'Outros', priceKey: 'psCristal3mm' },
];

const DTF_BASE: ItemBase[] = [
  { id: 'textilPremium', label: 'DTF Têxtil Premium', description: '57 cm', priceKey: 'textilPremium', unit: 'm' },
  { id: 'uvPremium', label: 'DTF UV Premium', description: '38 cm', priceKey: 'uvPremium', unit: 'm' },
];

// Seções que têm lista editável `itens` (semeadas por migrateConfig).
const ITENS_BASE: Record<string, ItemBase[]> = {
  adesivo: ADESIVO_BASE,
  lona: LONA_BASE,
  placaPS: PLACA_PS_BASE,
  placaACM: PLACA_ACM_BASE,
  laser: LASER_BASE,
  dtf: DTF_BASE,
};

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

  // Semeia a lista editável `itens` de cada seção manual a partir dos campos de
  // preço da config (preserva preços já salvos). Idempotente: só semeia quando
  // ausente. A calculadora e o gerenciador de Configurações usam essa lista.
  (Object.keys(ITENS_BASE) as string[]).forEach((section) => {
    const sc = next[section as keyof PricingConfig] as unknown as Record<string, unknown> | undefined;
    const base = ITENS_BASE[section];
    if (sc && base && !Array.isArray(sc.itens)) {
      next[section as keyof PricingConfig] = {
        ...(sc as object),
        itens: base.map((o) => ({
          id: o.id,
          label: o.label,
          price: Number(sc[o.priceKey]) || 0,
          unit: o.unit ?? 'm²',
          ...(o.description ? { description: o.description } : {}),
          ...(o.category ? { category: o.category } : {}),
        })),
      } as never;
    }
  });

  return next;
};
