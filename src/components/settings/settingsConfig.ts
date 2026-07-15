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
    title: "Placa ACM",
    section: "placaACM",
    fields: []
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
