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
    // Tipos de placa PS na lista abaixo (LIST_MANAGERS.placaPS); aqui só a laminação.
    title: 'Placa PS',
    section: 'placaPS',
    fields: [
      { key: 'laminacaoM2', label: 'Laminação (adicional)', unit: 'm²' },
    ],
  },
  {
    // Materiais de ACM na lista abaixo (LIST_MANAGERS.placaACM).
    title: 'Placa ACM',
    section: 'placaACM',
    fields: [],
  },
  {
    // Tipos de fachada (preço/m² e valor mínimo) na lista abaixo (LIST_MANAGERS.fachada).
    title: 'Fachada',
    section: 'fachada',
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
    title: 'Toldo',
    section: 'toldo',
    fields: [
      { key: 'cortinaMetroLinear', label: 'Toldo cortina (manivela)', unit: 'm linear' },
      { key: 'articuladoMetroLinear', label: 'Toldo articulado (manivela)', unit: 'm linear' },
      { key: 'fixoM2', label: 'Toldo fixo', unit: 'm²' },
      { key: 'viseiraMetroLinear', label: 'Acabamento viseira (cortina)', unit: 'm linear' },
      { key: 'soldaMetroLinear', label: 'Serviço de solda', unit: 'm de emenda' },
      { key: 'lonaLarguraUtil', label: 'Largura aproveitável da lona', unit: 'm' },
    ],
  },
  {
    // Acabamentos de Lona na lista abaixo (LIST_MANAGERS.lona); aqui só a laca.
    title: 'Lona',
    section: 'lona',
    fields: [
      { key: 'lacaProtecaoM2', label: 'Laca de proteção', unit: 'm²' },
    ],
  },
  {
    /*
     * Taxas do cartão, usadas pelo simulador de parcelamento que aparece no
     * painel "Orçamento" de todas as calculadoras.
     *
     * Os padrões são a tabela do **InfinitePay, plano "1 dia útil", faixa até
     * R$20 mil, Visa/Mastercard** — que é o plano do Étto. Conferida em
     * 09/11/26 contra a página de taxas da InfinitePay e dois comparadores, e
     * contra o print dele (6x = 8,28%).
     *
     * São editáveis porque a operadora muda a tabela, e porque a taxa cai
     * quando o volume mensal sobe (acima de R$20 mil o 6x vai para 6,64%).
     */
    title: 'Cartão de crédito',
    section: 'cartaoCredito',
    fields: [
      { key: 'creditoVista', label: 'Crédito à vista' },
      { key: 'taxa2x', label: 'Crédito 2x' },
      { key: 'taxa3x', label: 'Crédito 3x' },
      { key: 'taxa4x', label: 'Crédito 4x' },
      { key: 'taxa5x', label: 'Crédito 5x' },
      { key: 'taxa6x', label: 'Crédito 6x' },
      { key: 'taxa7x', label: 'Crédito 7x' },
      { key: 'taxa8x', label: 'Crédito 8x' },
      { key: 'taxa9x', label: 'Crédito 9x' },
      { key: 'taxa10x', label: 'Crédito 10x' },
      { key: 'taxa11x', label: 'Crédito 11x' },
      { key: 'taxa12x', label: 'Crédito 12x' },
    ],
  },
];
