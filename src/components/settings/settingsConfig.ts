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
    fields: [
      { key: 'corteEspecial', label: 'Corte Especial', unit: 'm²' },
      { key: 'soRefile', label: 'Só Refile', unit: 'm²' },
      { key: 'laminado', label: 'Laminado', unit: 'm²' },
      { key: 'adesivoPerfurado', label: 'Adesivo Perfurado', unit: 'm²' },
      { key: 'imantado', label: 'Imantado', unit: 'm²' },
    ]
  },
  {
    title: "Lona",
    section: "lona",
    fields: [
      { key: 'bannerFaixa', label: 'Banner/Faixa', unit: 'm²' },
      { key: 'reforcoIlhos', label: 'Reforço e Ilhós', unit: 'm²' },
      { key: 'lonaBacklight', label: 'Lona Backlight', unit: 'm²' },
      { key: 'soRefile', label: 'Só Refile', unit: 'm²' },
    ]
  },
  {
    title: "Placa PS",
    section: "placaPS",
    fields: [
      { key: 'espessura1mm', label: 'Espessura 1mm', unit: 'm²' },
      { key: 'espessura2mm', label: 'Espessura 2mm', unit: 'm²' },
    ]
  },
  {
    title: "Placa ACM",
    section: "placaACM",
    fields: [
      { key: 'preco', label: 'Preço por m²', unit: 'm²' },
    ]
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
      { key: 'espessura10mm', label: 'Espessura 10mm', unit: 'm²' },
      { key: 'espessura15mm', label: 'Espessura 15mm', unit: 'm²' },
      { key: 'espessura20mm', label: 'Espessura 20mm', unit: 'm²' },
      { key: 'pinturaAutomotiva', label: 'Pintura Automotiva (Opcional)', unit: 'm²' },
      { key: 'fitaDuplaFace', label: 'Fita Dupla-Face (Opcional)', unit: 'm²' },
    ]
  },
  {
    title: "Vidro",
    section: "vidro",
    fields: [
      { key: 'espessura6mm', label: 'Espessura 6mm', unit: 'm²' },
      { key: 'espessura8mm', label: 'Espessura 8mm', unit: 'm²' },
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
    fields: [
      { key: 'acrilicoCristal2mm', label: 'Acrílico Cristal 2mm', unit: 'm²' },
      { key: 'acrilicoCristal3mm', label: 'Acrílico Cristal 3mm', unit: 'm²' },
      { key: 'acrilicoCristal5mm', label: 'Acrílico Cristal 5mm', unit: 'm²' },
      { key: 'acrilicoCristal8mm', label: 'Acrílico Cristal 8mm', unit: 'm²' },
      { key: 'acrilicoCristal10mm', label: 'Acrílico Cristal 10mm', unit: 'm²' },
      { key: 'acrilicoColorido3mm', label: 'Acrílico Colorido 3mm', unit: 'm²' },
      { key: 'acrilicoColorido5mm', label: 'Acrílico Colorido 5mm', unit: 'm²' },
      { key: 'acrilicoColorido8mm', label: 'Acrílico Colorido 8mm', unit: 'm²' },
      { key: 'acrilicoColorido10mm', label: 'Acrílico Colorido 10mm', unit: 'm²' },
      { key: 'acrilicoPretoFume3mm', label: 'Acrílico Preto/Fumê 3mm', unit: 'm²' },
      { key: 'acrilicoPretoFume5mm', label: 'Acrílico Preto/Fumê 5mm', unit: 'm²' },
      { key: 'acrilicoPretoFume8mm', label: 'Acrílico Preto/Fumê 8mm', unit: 'm²' },
      { key: 'psCristal1mm', label: 'PS Cristal 1mm', unit: 'm²' },
      { key: 'psCristal2mm', label: 'PS Cristal 2mm', unit: 'm²' },
      { key: 'psCristal3mm', label: 'PS Cristal 3mm', unit: 'm²' },
      { key: 'psaiBranco1mm', label: 'PSAI Branco 1mm/0mm', unit: 'm²' },
      { key: 'psaiBranco2mm', label: 'PSAI Branco 2mm', unit: 'm²' },
      { key: 'psaiBranco3mm', label: 'PSAI Branco 3mm', unit: 'm²' },
      { key: 'psaiColorido2mm', label: 'PSAI Colorido 2mm', unit: 'm²' },
      { key: 'mdf3mm', label: 'MDF 3mm', unit: 'm²' },
      { key: 'mdf6mm', label: 'MDF 6mm', unit: 'm²' },
      { key: 'mdf9mm', label: 'MDF 9mm', unit: 'm²' },
      { key: 'pe3mm', label: 'PE 3mm', unit: 'm²' },
      { key: 'petg3mm', label: 'PETG 3mm', unit: 'm²' },
      { key: 'espelhadoPrata2mm', label: 'Espelhado Prata 2mm', unit: 'm²' },
      { key: 'espelhadoPrataDourado3mm', label: 'Espelhado Prata/Dourado 3mm', unit: 'm²' },
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
    fields: [
      { key: 'jacarei', label: 'Jacareí', unit: 'serviço' },
      { key: 'sjCampos', label: 'S.J.Campos', unit: 'serviço' },
      { key: 'cacapavaTaubate', label: 'Caçapava/Taubaté', unit: 'serviço' },
      { key: 'litoral', label: 'Litoral', unit: 'serviço' },
      { key: 'guararemaSantaIsabel', label: 'Guararema/Sta Isabel', unit: 'serviço' },
      { key: 'santaBranca', label: 'Sta Branca', unit: 'serviço' },
      { key: 'saoPaulo', label: 'São Paulo', unit: 'serviço' },
    ]
  }
];
