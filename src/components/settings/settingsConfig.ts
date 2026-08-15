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
// Functions (NF já embutida em preco_com_nota, deslocamento à parte). As EXCEÇÕES
// são os produtos de preço MANUAL (Adesivos, Lona, Placas, Laser, DTF, Etiquetas),
// definidos aqui em Configurações. A alíquota de nota fiscal NÃO é mais editável
// por produto: é uma constante fixa (ALIQUOTA_NF = 9,35% em types/pricing.ts),
// aplicada igual a todos — por isso não há campo de NF nas seções abaixo.
export const settingsConfig: ConfigSectionData[] = [
  {
    // Os tipos de adesivo (nome, descrição, preço e ordem) são editados na lista
    // "Tipos de adesivo" abaixo (LIST_MANAGERS.adesivo).
    title: 'Adesivos',
    section: 'adesivo',
    fields: [
      { key: 'mascaraTransferenciaM2', label: 'Máscara de transferência (recorte)', unit: 'm²' },
    ],
  },
  {
    // Tipos de placa PS na lista abaixo (LIST_MANAGERS.placaPS).
    title: 'Placa PS',
    section: 'placaPS',
    fields: [],
  },
  {
    // Materiais de ACM na lista abaixo (LIST_MANAGERS.placaACM).
    title: 'Placa ACM',
    section: 'placaACM',
    fields: [],
  },
  {
    title: 'Etiquetas / Rótulos',
    section: 'etiquetas',
    fields: [
      { key: 'precoM2', label: 'Preço por m²', unit: 'm²' },
      { key: 'minPorUnidade', label: 'Mínimo por unidade', unit: 'un' },
    ],
  },
  {
    // Tipos de DTF na lista abaixo (LIST_MANAGERS.dtf); aqui só o Uber.
    title: 'DTF',
    section: 'dtf',
    fields: [
      { key: 'uberValor', label: 'Uber (busca do material)', unit: 'R$' },
    ],
  },
  {
    // Materiais de Laser na lista abaixo (LIST_MANAGERS.laser).
    title: 'Laser',
    section: 'laser',
    fields: [],
  },
  {
    // Acabamentos de Lona na lista abaixo (LIST_MANAGERS.lona); aqui só a laca.
    title: 'Lona',
    section: 'lona',
    fields: [
      { key: 'lacaProtecaoM2', label: 'Laca de proteção', unit: 'm²' },
    ],
  },
];
