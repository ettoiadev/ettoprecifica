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
    title: 'Lona',
    section: 'lona',
    fields: [
      { key: 'bannerSemAcabamento', label: 'Banner ou Lona sem acabamento', unit: 'm²' },
      { key: 'reforcoIlhos', label: 'Lona reforço e ilhós', unit: 'm²' },
      { key: 'lonaGrande', label: 'Lona grande (maior que 1,80 largura)', unit: 'm²' },
      { key: 'lonaTranslucida', label: 'Lona translúcida', unit: 'm²' },
      { key: 'lacaProtecaoM2', label: 'Laca de proteção', unit: 'm²' },
      { key: 'notaFiscalPercentual', label: 'Percentual de nota fiscal', unit: '%' },
    ],
  },
];
