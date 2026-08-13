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
    title: 'Adesivos',
    section: 'adesivo',
    fields: [
      { key: 'digital', label: 'Adesivo Digital (impressão sem corte)', unit: 'm²' },
      { key: 'digitalPeliculaTransparente', label: 'Adesivo Digital c/ Película Transparente', unit: 'm²' },
      { key: 'transparente', label: 'Adesivo Transparente', unit: 'm²' },
      { key: 'perfurado', label: 'Adesivo Perfurado', unit: 'm²' },
      { key: 'recorte1Cor', label: 'Adesivo Recorte 1 Cor', unit: 'm²' },
      { key: 'recorte2Cores', label: 'Adesivo Recorte 2 Cores', unit: 'm²' },
      { key: 'jateado', label: 'Adesivo Jateado', unit: 'm²' },
      { key: 'blackout', label: 'Adesivo Black-out', unit: 'm²' },
      { key: 'refletivo', label: 'Adesivo Refletivo', unit: 'm²' },
      { key: 'imaCarroAdesivado', label: 'Imã de Carro Adesivado', unit: 'm²' },
      { key: 'notaFiscalPercentual', label: 'Percentual de nota fiscal', unit: '%' },
    ],
  },
  {
    title: 'Placa PS',
    section: 'placaPS',
    fields: [
      { key: 'branco1mm', label: 'Placa PS Branco 1mm', unit: 'm²' },
      { key: 'branco2mm', label: 'Placa PS Branco 2mm', unit: 'm²' },
      { key: 'branco3mm', label: 'Placa PS Branco 3mm', unit: 'm²' },
      { key: 'cristal15mm', label: 'PS Cristal 1,5mm', unit: 'm²' },
      { key: 'cristal2mm', label: 'PS Cristal 2mm', unit: 'm²' },
      { key: 'cristal3mm', label: 'PS Cristal 3mm', unit: 'm²' },
      { key: 'notaFiscalPercentual', label: 'Percentual de nota fiscal', unit: '%' },
    ],
  },
  {
    title: 'Placa ACM',
    section: 'placaACM',
    fields: [
      { key: 'brancoBrilho3mm', label: 'ACM Branco Brilho 3mm', unit: 'm²' },
      { key: 'madeira3mm', label: 'ACM Madeira 3mm', unit: 'm²' },
      { key: 'notaFiscalPercentual', label: 'Percentual de nota fiscal', unit: '%' },
    ],
  },
  {
    title: 'Lona',
    section: 'lona',
    fields: [
      { key: 'bannerSemAcabamento', label: 'Banner / Faixa', unit: 'm²' },
      { key: 'reforcoIlhos', label: 'Lona reforço e ilhós', unit: 'm²' },
      { key: 'lonaGrande', label: 'Lona grande (maior que 1,80 largura)', unit: 'm²' },
      { key: 'lonaTranslucida', label: 'Lona translúcida', unit: 'm²' },
      { key: 'lacaProtecaoM2', label: 'Laca de proteção', unit: 'm²' },
      { key: 'notaFiscalPercentual', label: 'Percentual de nota fiscal', unit: '%' },
    ],
  },
];
