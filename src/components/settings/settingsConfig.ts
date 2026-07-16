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

// Todos os produtos e taxas (NF, cartão, arte final, instalação/deslocamento)
// agora são calculados pelo motor da skill via Edge Functions — a NF já vem
// embutida em preco_com_nota e o deslocamento vem de deslocamento_cidades.
// Não há mais configuração de preço editável no app; resta apenas a seção "Geral".
export const settingsConfig: ConfigSectionData[] = [];
