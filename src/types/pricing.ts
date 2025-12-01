// Interface para variações customizadas
export interface ProductVariation {
  id: string;
  label: string;
  price: number;
  unit?: string;
}

export interface AdesivoConfig {
  corteEspecial: number;
  soRefile: number;
  laminado: number;
  adesivoPerfurado: number;
  imantado: number;
  customVariations?: ProductVariation[];
}

export interface LonaConfig {
  bannerFaixa: number;
  reforcoIlhos: number;
  lonaBacklight: number;
  soRefile: number;
  customVariations?: ProductVariation[];
}

export interface PlacaPSConfig {
  espessura1mm: number;
  espessura2mm: number;
  customVariations?: ProductVariation[];
}

export interface PlacaACMConfig {
  preco: number;
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
}

export interface VidroConfig {
  espessura6mm: number;
  espessura8mm: number;
  prolongadores: number;
  customVariations?: ProductVariation[];
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

export interface LaserConfig {
  // Acrílico Cristal
  acrilicoCristal2mm: number;
  acrilicoCristal3mm: number;
  acrilicoCristal5mm: number;
  acrilicoCristal8mm: number;
  acrilicoCristal10mm: number;
  // Acrílico Colorido
  acrilicoColorido3mm: number;
  acrilicoColorido5mm: number;
  acrilicoColorido8mm: number;
  acrilicoColorido10mm: number;
  // Acrílico Preto/Fumê
  acrilicoPretoFume3mm: number;
  acrilicoPretoFume5mm: number;
  acrilicoPretoFume8mm: number;
  // PS Cristal
  psCristal1mm: number;
  psCristal2mm: number;
  psCristal3mm: number;
  // PSAI Branco
  psaiBranco1mm: number;
  psaiBranco2mm: number;
  psaiBranco3mm: number;
  // PSAI Colorido
  psaiColorido2mm: number;
  // MDF
  mdf3mm: number;
  mdf6mm: number;
  mdf9mm: number;
  // Outros
  pe3mm: number;
  petg3mm: number;
  espelhadoPrata2mm: number;
  espelhadoPrataDourado3mm: number;
}

// Novas configurações solicitadas
export interface NotaFiscalConfig {
  percentual: number;
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
  notaFiscal: NotaFiscalConfig;
  cartaoCredito: CartaoCreditoConfig;
  instalacao: InstalacaoConfig;
}

export const defaultConfig: PricingConfig = {
  adesivo: {
    corteEspecial: 25.0,
    soRefile: 15.0,
    laminado: 35.0,
    adesivoPerfurado: 30.0,
    imantado: 40.0,
  },
  lona: {
    bannerFaixa: 20.0,
    reforcoIlhos: 25.0,
    lonaBacklight: 30.0,
    soRefile: 15.0,
  },
  placaPS: {
    espessura1mm: 30.0,
    espessura2mm: 35.0,
  },
  placaACM: {
    preco: 45.0,
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
    acrilicoCristal2mm: 200.0,
    acrilicoCristal3mm: 280.0,
    acrilicoCristal5mm: 450.0,
    acrilicoCristal8mm: 850.0,
    acrilicoCristal10mm: 950.0,
    acrilicoColorido3mm: 290.0,
    acrilicoColorido5mm: 340.0,
    acrilicoColorido8mm: 800.0,
    acrilicoColorido10mm: 1190.0,
    acrilicoPretoFume3mm: 150.0,
    acrilicoPretoFume5mm: 180.0,
    acrilicoPretoFume8mm: 830.0,
    psCristal1mm: 110.0,
    psCristal2mm: 180.0,
    psCristal3mm: 350.0,
    psaiBranco1mm: 150.0,
    psaiBranco2mm: 120.0,
    psaiBranco3mm: 160.0,
    psaiColorido2mm: 180.0,
    mdf3mm: 130.0,
    mdf6mm: 90.0,
    mdf9mm: 90.0,
    pe3mm: 130.0,
    petg3mm: 260.0,
    espelhadoPrata2mm: 300.0,
    espelhadoPrataDourado3mm: 360.0,
  },
  notaFiscal: {
    percentual: 15.0,
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
  },
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const calculateMinimumCharge = (value: number): number => {
  return Math.max(value, 20.0);
};
