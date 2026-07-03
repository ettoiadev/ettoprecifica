export interface ConfigField {
  key: string;
  label: string;
  unit?: string;
}

export interface ConfigSectionData {
  title: string;
  section: string;
  fields: ConfigField[];
}

export const settingsConfig: ConfigSectionData[] = [
  {
    title: "Adesivo",
    section: "adesivo",
    fields: []
  },
  {
    title: "Lona",
    section: "lona",
    fields: [
      { key: 'precoMinimo', label: 'Preço Mínimo', unit: 'unid' },
    ]
  },
  {
    title: "Placa PS",
    section: "placaPS",
    fields: []
  },
  {
    title: "Placa ACM",
    section: "placaACM",
    fields: []
  },
  {
    title: "Fachada",
    section: "fachada",
    fields: [
      { key: 'lona', label: 'Lona', unit: 'm²' },
      { key: 'acm122', label: 'ACM 1.22m', unit: 'unid' },
      { key: 'acm150', label: 'ACM 1.50m', unit: 'unid' },
      { key: 'cantoneira', label: 'Cantoneira 3/4', unit: 'unid' },
      { key: 'estruturaMetalica.precoPorBarra', label: 'Estrutura Metálica - Preço por Barra', unit: 'unid' },
      { key: 'estruturaMetalica.comprimentoBarra', label: 'Estrutura Metálica - Comprimento da Barra', unit: 'm' },
    ]
  },
  {
    title: "Letra PVC",
    section: "letraCaixa",
    fields: [
      { key: 'pinturaAutomotiva', label: 'Pintura Automotiva (Opcional)', unit: 'm²' },
      { key: 'fitaDuplaFace', label: 'Fita Dupla-Face (Opcional)', unit: 'm²' },
    ]
  },
  {
    title: "Vidro",
    section: "vidro",
    fields: [
      { key: 'prolongadores', label: 'Prolongadores', unit: 'unid' },
    ]
  },
  {
    title: "Luminoso",
    section: "luminoso",
    fields: [
      { key: 'lona', label: 'Lona', unit: 'm²' },
      { key: 'metalon20x20', label: 'Metalon 20x20', unit: 'unid' },
      { key: 'acm122', label: 'ACM 1.22m', unit: 'unid' },
      { key: 'acm150', label: 'ACM 1.50m', unit: 'unid' },
      { key: 'lampadaTubular122', label: 'Lâmpada Tubular 1,22m', unit: 'unid' },
      { key: 'lampadaTubular60', label: 'Lâmpada Tubular 60cm', unit: 'unid' },
      { key: 'moduloLed17w', label: 'Módulo LED 1,7w Lente 160º', unit: 'unid' },
      { key: 'moduloLed15w', label: 'Módulo LED 1,5w Mega Lente', unit: 'unid' },
      { key: 'fonteChaveada5a', label: 'Fonte Chaveada 5a', unit: 'unid' },
      { key: 'fonteChaveada10a', label: 'Fonte Chaveada 10a', unit: 'unid' },
      { key: 'fonteChaveada15a', label: 'Fonte Chaveada 15a', unit: 'unid' },
      { key: 'fonteChaveada20a', label: 'Fonte Chaveada 20a', unit: 'unid' },
      { key: 'fonteChaveada30a', label: 'Fonte Chaveada 30a', unit: 'unid' },
      { key: 'luminosoRedondoOval', label: 'Luminoso Redondo ou Oval', unit: 'unid' },
      { key: 'estruturaMetalica.precoPorBarra', label: 'Estrutura Metálica - Preço por Barra', unit: 'unid' },
      { key: 'estruturaMetalica.comprimentoBarra', label: 'Estrutura Metálica - Comprimento da Barra', unit: 'm' },
    ]
  },
  {
    title: "Laser",
    section: "laser",
    fields: []
  },
  {
    title: "Nota Fiscal",
    section: "notaFiscal",
    fields: [
      { key: 'percentual', label: 'Percentual da Nota Fiscal', unit: '%' },
    ]
  },
  {
    title: "Arte Final",
    section: "arteFinal",
    fields: []
  },
  {
    title: "Cartão de Crédito",
    section: "cartaoCredito",
    fields: [
      { key: 'creditoVista', label: 'Crédito à vista', unit: '%' },
      { key: 'taxa2x', label: 'Taxa 2x', unit: '%' },
      { key: 'taxa3x', label: 'Taxa 3x', unit: '%' },
      { key: 'taxa4x', label: 'Taxa 4x', unit: '%' },
      { key: 'taxa5x', label: 'Taxa 5x', unit: '%' },
      { key: 'taxa6x', label: 'Taxa 6x', unit: '%' },
      { key: 'taxa7x', label: 'Taxa 7x', unit: '%' },
      { key: 'taxa8x', label: 'Taxa 8x', unit: '%' },
      { key: 'taxa9x', label: 'Taxa 9x', unit: '%' },
      { key: 'taxa10x', label: 'Taxa 10x', unit: '%' },
      { key: 'taxa11x', label: 'Taxa 11x', unit: '%' },
      { key: 'taxa12x', label: 'Taxa 12x', unit: '%' },
    ]
  },
  {
    title: "Instalação por Localidade",
    section: "instalacao",
    fields: []
  }
];
