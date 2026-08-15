// Interface para variações customizadas
export interface ProductVariation {
  id: string;
  label: string;
  /** Descrição curta opcional (subtítulo do item na frente). */
  description?: string;
  price: number;
  unit?: string;
  category?: string;
  /**
   * Valor mínimo (piso) cobrado para este item, incidindo sobre o total da linha
   * (área × preço × quantidade). Abaixo dele, cobra-se o mínimo; ao ultrapassá-lo,
   * passa a valer o cálculo por m². Se ausente, usa DEFAULT_MINIMUM_CHARGE (R$20).
   */
  minPrice?: number;
}

// Adesivos (impresso + recorte) também têm preço MANUAL, definido em
// Configurações (como a Lona). Nove tipos da planilha do Étto, cada um com preço
// por m²; o preço com nota fiscal sai de um percentual único. Etiquetas NÃO entra
// aqui — continua no motor da skill (sub-aba própria).
export interface AdesivoConfig {
  digital: number;
  digitalPeliculaTransparente: number;
  transparente: number;
  perfurado: number;
  recorte1Cor: number;
  recorte2Cores: number;
  jateado: number;
  blackout: number;
  refletivo: number;
  imaCarroAdesivado: number;
  notaFiscalPercentual: number;
  // Lista editável de tipos de adesivo (nome, descrição, preço e ordem),
  // gerenciada em Configurações. Semeada por migrateConfig a partir dos campos
  // acima (preserva preços já salvos). A calculadora renderiza a partir dela.
  itens?: ProductVariation[];
}

// Lona é o único produto com preço MANUAL (definido em Configurações), não pelo
// motor da skill. Cada acabamento tem um preço por m²; a Laca de Proteção é um
// adicional opcional por m²; o preço com nota fiscal sai de um percentual único.
export interface LonaConfig {
  bannerSemAcabamento: number;
  reforcoIlhos: number;
  lonaGrande: number;
  lonaTranslucida: number;
  lacaProtecaoM2: number;
  notaFiscalPercentual: number;
  // Lista editável de acabamentos (nome, descrição, preço, ordem), semeada por
  // migrateConfig a partir dos campos acima. A calculadora renderiza a partir dela.
  itens?: ProductVariation[];
}

// Placas (PS e ACM) também têm preço MANUAL, editável em Configurações (como Lona
// e Adesivos). Preços padrão = os preços de venda/m² que já vinham do motor da
// skill (lidos via SQL em 30/07/26); o preço com nota sai de um percentual único
// (a NF do motor era ×1,0931 = 9,31%).
export interface PlacaPSConfig {
  branco1mm: number;
  branco2mm: number;
  branco3mm: number;
  cristal15mm: number;
  cristal2mm: number;
  cristal3mm: number;
  notaFiscalPercentual: number;
  itens?: ProductVariation[];
}

export interface PlacaACMConfig {
  brancoBrilho3mm: number;
  madeira3mm: number;
  notaFiscalPercentual: number;
  itens?: ProductVariation[];
}

export interface FachadaConfig {
  lona: number;
  acm122: number;
  acm150: number;
  cantoneira: number;
  // Novos parâmetros para estrutura metálica
  estruturaMetalica: {
    precoPorBarra: number;
    comprimentoBarra: number;
  };
}

export interface LetraCaixaConfig {
  espessura10mm: number;
  espessura15mm: number;
  espessura20mm: number;
  pinturaAutomotiva: number;
  fitaDuplaFace: number;
  customVariations?: ProductVariation[];
  variations?: ProductVariation[];
}

export interface VidroConfig {
  espessura6mm: number;
  espessura8mm: number;
  prolongadores: number;
  customVariations?: ProductVariation[];
  variations?: ProductVariation[];
}

export interface LuminosoConfig {
  lona: number;
  metalon20x20: number;
  acm122: number;
  acm150: number;
  lampadaTubular122: number;
  lampadaTubular60: number;
  moduloLed17w: number;
  moduloLed15w: number;
  fonteChaveada5a: number;
  fonteChaveada10a: number;
  fonteChaveada15a: number;
  fonteChaveada20a: number;
  fonteChaveada30a: number;
  luminosoRedondoOval: number;
  // Novos parâmetros para estrutura metálica
  estruturaMetalica: {
    precoPorBarra: number;
    comprimentoBarra: number;
  };
}

// Laser também tem preço MANUAL (como Lona/Adesivos/Placas). Lista curada pelo
// Étto (só os materiais dos prints), com os preços de venda/m² reais que vinham
// da skill (tabela laser_materiais, lidos via SQL em 30/07/26). Agrupados por
// categoria só para a UI. O preço com nota sai de um percentual único (9,31%).
export interface LaserConfig {
  // Acrílico
  acrilicoColorido3mm: number;
  acrilicoCristal2mm: number;
  acrilicoCristal3mm: number;
  acrilicoCristal5mm: number;
  acrilicoCristal8mm: number;
  acrilicoCristal10mm: number;
  // Acrílico Espelhado
  espelhadoDourado2mm: number;
  espelhadoPrata2mm: number;
  espelhadoRose2mm: number;
  // Outros
  mdf3mm: number;
  mdf6mm: number;
  mdf9mm: number;
  psCristal2mm: number;
  psCristal3mm: number;
  notaFiscalPercentual: number;
  // Lista editável de materiais (com categoria), semeada por migrateConfig.
  itens?: ProductVariation[];
}

// DTF também tem preço MANUAL (como os demais). Cobrado por METRO LINEAR (não m²).
// Preços padrão = o preço de venda/metro de 1 metro que vinha da skill (custo ×2,5),
// lido via SQL em 30/07/26. Faixas de quantidade foram simplificadas (um preço por
// tipo). "Uber" é um adicional opcional (busca do material), valor editável. O preço
// com nota sai de um percentual único (9,31%).
export interface DtfConfig {
  textilPremium: number;
  uvPremium: number;
  uberValor: number;
  notaFiscalPercentual: number;
  // Lista editável de tipos (nome, descrição/largura, preço/metro, ordem).
  itens?: ProductVariation[];
}

// Etiquetas/Rótulos com preço MANUAL por m² (não mais a matriz da skill). O preço
// por unidade = área da etiqueta × precoM2, com um piso por unidade (etiquetas
// pequenas caem no piso). Medida e quantidade são livres; as caixas de tamanho
// fixo e os lotes são apenas atalhos. O preço com nota sai de um percentual único.
export interface EtiquetasConfig {
  precoM2: number;
  minPorUnidade: number;
  notaFiscalPercentual: number;
}

// Novas configurações solicitadas
export interface NotaFiscalConfig {
  percentual: number;
}

export interface ArteFinalConfig {
  customVariations: ProductVariation[];
}

export interface CartaoCreditoConfig {
  creditoVista: number;
  taxa2x: number;
  taxa3x: number;
  taxa4x: number;
  taxa5x: number;
  taxa6x: number;
  taxa7x: number;
  taxa8x: number;
  taxa9x: number;
  taxa10x: number;
  taxa11x: number;
  taxa12x: number;
}

export interface InstalacaoConfig {
  jacarei: number;
  sjCampos: number;
  cacapavaTaubate: number;
  litoral: number;
  guararemaSantaIsabel: number;
  santaBranca: number;
  saoPaulo: number;
  instalacaoLoja: number;
  variations?: ProductVariation[];
}

export interface PricingConfig {
  adesivo: AdesivoConfig;
  lona: LonaConfig;
  placaPS: PlacaPSConfig;
  placaACM: PlacaACMConfig;
  fachada: FachadaConfig;
  letraCaixa: LetraCaixaConfig;
  vidro: VidroConfig;
  luminoso: LuminosoConfig;
  laser: LaserConfig;
  dtf: DtfConfig;
  etiquetas: EtiquetasConfig;
  notaFiscal: NotaFiscalConfig;
  arteFinal: ArteFinalConfig;
  cartaoCredito: CartaoCreditoConfig;
  instalacao: InstalacaoConfig;
}

export const defaultConfig: PricingConfig = {
  adesivo: {
    digital: 100.0,
    digitalPeliculaTransparente: 150.0,
    transparente: 120.0,
    perfurado: 200.0,
    recorte1Cor: 250.0,
    recorte2Cores: 380.0,
    jateado: 150.0,
    blackout: 130.0,
    refletivo: 130.0,
    imaCarroAdesivado: 420.0,
    notaFiscalPercentual: 20.0,
  },
  lona: {
    bannerSemAcabamento: 100.0,
    reforcoIlhos: 130.0,
    lonaGrande: 150.0,
    lonaTranslucida: 130.0,
    lacaProtecaoM2: 30.0,
    notaFiscalPercentual: 20.0,
  },
  placaPS: {
    branco1mm: 180.0,
    branco2mm: 220.0,
    branco3mm: 250.0,
    cristal15mm: 290.0,
    cristal2mm: 330.0,
    cristal3mm: 390.0,
    notaFiscalPercentual: 9.31,
  },
  placaACM: {
    brancoBrilho3mm: 280.0,
    madeira3mm: 280.0,
    notaFiscalPercentual: 9.31,
  },
  fachada: {
    lona: 20.0,
    acm122: 120.0,
    acm150: 150.0,
    cantoneira: 8.0,
    estruturaMetalica: {
      precoPorBarra: 80.0,
      comprimentoBarra: 6.0,
    },
  },
  letraCaixa: {
    espessura10mm: 50.0,
    espessura15mm: 60.0,
    espessura20mm: 70.0,
    pinturaAutomotiva: 15.0,
    fitaDuplaFace: 5.0,
  },
  vidro: {
    espessura6mm: 60.0,
    espessura8mm: 80.0,
    prolongadores: 25.0,
  },
  luminoso: {
    lona: 20.0,
    metalon20x20: 15.0,
    acm122: 120.0,
    acm150: 150.0,
    lampadaTubular122: 25.0,
    lampadaTubular60: 15.0,
    moduloLed17w: 8.0,
    moduloLed15w: 7.0,
    fonteChaveada5a: 45.0,
    fonteChaveada10a: 65.0,
    fonteChaveada15a: 85.0,
    fonteChaveada20a: 105.0,
    fonteChaveada30a: 145.0,
    luminosoRedondoOval: 200.0,
    estruturaMetalica: {
      precoPorBarra: 34.0,
      comprimentoBarra: 6.0,
    },
  },
  laser: {
    acrilicoColorido3mm: 390.0,
    acrilicoCristal2mm: 380.0,
    acrilicoCristal3mm: 430.0,
    acrilicoCristal5mm: 600.0,
    acrilicoCristal8mm: 980.0,
    acrilicoCristal10mm: 1250.0,
    espelhadoDourado2mm: 590.0,
    espelhadoPrata2mm: 540.0,
    espelhadoRose2mm: 590.0,
    mdf3mm: 260.0,
    mdf6mm: 380.0,
    mdf9mm: 520.0,
    psCristal2mm: 380.0,
    psCristal3mm: 490.0,
    notaFiscalPercentual: 9.31,
  },
  dtf: {
    textilPremium: 149.75,
    uvPremium: 224.75,
    uberValor: 50.0,
    notaFiscalPercentual: 9.31,
  },
  etiquetas: {
    precoM2: 100.0,
    minPorUnidade: 0.25,
    notaFiscalPercentual: 9.31,
  },
  notaFiscal: {
    percentual: 15.0,
  },
  arteFinal: {
    customVariations: [
      { id: 'arte_ia', label: 'Arte IA', price: 30.0, unit: 'serviço' },
      { id: 'arte_personalizada', label: 'Arte Personalizada', price: 150.0, unit: 'serviço' },
    ],
  },
  cartaoCredito: {
    creditoVista: 3.15,
    taxa2x: 5.39,
    taxa3x: 6.12,
    taxa4x: 6.85,
    taxa5x: 7.57,
    taxa6x: 8.28,
    taxa7x: 8.99,
    taxa8x: 9.69,
    taxa9x: 10.38,
    taxa10x: 11.06,
    taxa11x: 11.74,
    taxa12x: 12.40,
  },
  instalacao: {
    jacarei: 100.0,
    sjCampos: 120.0,
    cacapavaTaubate: 150.0,
    litoral: 200.0,
    guararemaSantaIsabel: 180.0,
    santaBranca: 160.0,
    saoPaulo: 250.0,
    instalacaoLoja: 0.0,
  },
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

/** Valor mínimo padrão do sistema, usado quando o item não define o seu. */
export const DEFAULT_MINIMUM_CHARGE = 20.0;

export const calculateMinimumCharge = (value: number): number => {
  return Math.max(value, DEFAULT_MINIMUM_CHARGE);
};

/**
 * Aplica o valor mínimo (piso) de um item ao total da linha. Se o item não tiver
 * mínimo configurado, usa o padrão do sistema (R$20). Comportamento: enquanto o
 * valor calculado (área × preço × quantidade) estiver abaixo do piso, cobra-se o
 * piso; ao ultrapassá-lo, passa a valer o cálculo por m².
 */
export const applyItemMinimumCharge = (value: number, minPrice?: number): number => {
  const floor =
    typeof minPrice === 'number' && !Number.isNaN(minPrice) ? minPrice : DEFAULT_MINIMUM_CHARGE;
  return Math.max(value, floor);
};

export const calculateLonaMinimumCharge = (value: number, minPrice: number): number => {
  return Math.max(value, minPrice);
};
