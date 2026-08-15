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

// A maioria dos produtos e taxas é calculada pelo motor da skill via Edge
// Functions (NF já embutida em preco_com_nota, deslocamento à parte). A EXCEÇÃO é
// a Lona: seu preço é MANUAL, definido aqui em Configurações. Cada acabamento tem
// um preço por m²; a Laca de Proteção é um adicional por m²; e o preço com nota
// fiscal sai de um percentual único aplicado sobre o preço por m².
export const settingsConfig: ConfigSectionData[] = [
  {
    // Os tipos de adesivo (nome, descrição, preço e ordem) são editados na lista
    // "Tipos de adesivo" abaixo (LIST_MANAGERS.adesivo); aqui fica só a NF.
    title: 'Adesivos',
    section: 'adesivo',
    fields: [
      { key: 'notaFiscalPercentual', label: 'Percentual de nota fiscal', unit: '%' },
    ],
  },
  {
    // Tipos de placa PS na lista abaixo (LIST_MANAGERS.placaPS); aqui só a NF.
    title: 'Placa PS',
    section: 'placaPS',
    fields: [
      { key: 'notaFiscalPercentual', label: 'Percentual de nota fiscal', unit: '%' },
    ],
  },
  {
    // Materiais de ACM na lista abaixo (LIST_MANAGERS.placaACM); aqui só a NF.
    title: 'Placa ACM',
    section: 'placaACM',
    fields: [
      { key: 'notaFiscalPercentual', label: 'Percentual de nota fiscal', unit: '%' },
    ],
  },
  {
    title: 'Etiquetas / Rótulos',
    section: 'etiquetas',
    fields: [
      { key: 'precoM2', label: 'Preço por m²', unit: 'm²' },
      { key: 'minPorUnidade', label: 'Mínimo por unidade', unit: 'un' },
      { key: 'notaFiscalPercentual', label: 'Percentual de nota fiscal', unit: '%' },
    ],
  },
  {
    // Tipos de DTF na lista abaixo (LIST_MANAGERS.dtf); aqui Uber + NF.
    title: 'DTF',
    section: 'dtf',
    fields: [
      { key: 'uberValor', label: 'Uber (busca do material)', unit: 'R$' },
      { key: 'notaFiscalPercentual', label: 'Percentual de nota fiscal', unit: '%' },
    ],
  },
  {
    // Materiais de Laser na lista abaixo (LIST_MANAGERS.laser); aqui só a NF.
    title: 'Laser',
    section: 'laser',
    fields: [
      { key: 'notaFiscalPercentual', label: 'Percentual de nota fiscal', unit: '%' },
    ],
  },
  {
    // Acabamentos de Lona na lista abaixo (LIST_MANAGERS.lona); aqui laca + NF.
    title: 'Lona',
    section: 'lona',
    fields: [
      { key: 'lacaProtecaoM2', label: 'Laca de proteção', unit: 'm²' },
      { key: 'notaFiscalPercentual', label: 'Percentual de nota fiscal', unit: '%' },
    ],
  },
];
