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
    title: 'Etiquetas / Rótulos',
    section: 'etiquetas',
    fields: [
      { key: 'precoM2', label: 'Preço por m²', unit: 'm²' },
      { key: 'minPorUnidade', label: 'Mínimo por unidade', unit: 'un' },
      { key: 'notaFiscalPercentual', label: 'Percentual de nota fiscal', unit: '%' },
    ],
  },
  {
    title: 'DTF',
    section: 'dtf',
    fields: [
      { key: 'textilPremium', label: 'DTF Têxtil Premium (57cm)', unit: 'metro' },
      { key: 'uvPremium', label: 'DTF UV Premium (38cm)', unit: 'metro' },
      { key: 'uberValor', label: 'Uber (busca do material)', unit: 'R$' },
      { key: 'notaFiscalPercentual', label: 'Percentual de nota fiscal', unit: '%' },
    ],
  },
  {
    title: 'Laser',
    section: 'laser',
    fields: [
      { key: 'acrilicoColorido3mm', label: 'Acrílico Colorido 3mm', unit: 'm²' },
      { key: 'acrilicoCristal2mm', label: 'Acrílico Cristal 2mm', unit: 'm²' },
      { key: 'acrilicoCristal3mm', label: 'Acrílico Cristal 3mm', unit: 'm²' },
      { key: 'acrilicoCristal5mm', label: 'Acrílico Cristal 5mm', unit: 'm²' },
      { key: 'acrilicoCristal8mm', label: 'Acrílico Cristal 8mm', unit: 'm²' },
      { key: 'acrilicoCristal10mm', label: 'Acrílico Cristal 10mm', unit: 'm²' },
      { key: 'espelhadoDourado2mm', label: 'Acrílico Espelhado Dourado 2mm', unit: 'm²' },
      { key: 'espelhadoPrata2mm', label: 'Acrílico Espelhado Prata 2mm', unit: 'm²' },
      { key: 'espelhadoRose2mm', label: 'Acrílico Espelhado Rosé 2mm', unit: 'm²' },
      { key: 'mdf3mm', label: 'MDF 3mm', unit: 'm²' },
      { key: 'mdf6mm', label: 'MDF 6mm', unit: 'm²' },
      { key: 'mdf9mm', label: 'MDF 9mm', unit: 'm²' },
      { key: 'psCristal2mm', label: 'PS Cristal 2mm', unit: 'm²' },
      { key: 'psCristal3mm', label: 'PS Cristal 3mm', unit: 'm²' },
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
