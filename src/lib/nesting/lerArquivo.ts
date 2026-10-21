import { lerSvg } from './svgParaPecas';
import { lerDxf } from './dxfParaPecas';
import type { LeituraVetorial } from './geometria';

export const EXTENSOES_ACEITAS = '.svg,.dxf,image/svg+xml';

/** Escolhe o leitor pelo nome do arquivo e devolve as peças em mm. */
export async function lerArquivoVetorial(file: File): Promise<LeituraVetorial> {
  const nome = file.name.toLowerCase();
  const texto = await file.text();
  if (nome.endsWith('.dxf')) return lerDxf(texto);
  if (nome.endsWith('.svg')) return lerSvg(texto);
  // sem extensão conhecida: decide pelo conteúdo
  if (/^\s*<\?xml|<svg[\s>]/i.test(texto.slice(0, 400))) return lerSvg(texto);
  throw new Error('Formato não reconhecido. Envie um arquivo .svg ou .dxf.');
}
