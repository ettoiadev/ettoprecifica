import { supabase } from '../../lib/supabase/client';

// Guia interno (normas, medidas, matéria-prima, prazos…). Diferente de
// `pricing_configs`/`budget_settings`, que são POR VENDEDOR: o guia é
// documento da empresa, então a tabela `guide_sections` é COMPARTILHADA —
// o que um usuário edita, todos passam a ver. Ver docs/GUIA.md.
export interface GuideSection {
  id: string;
  slug: string;
  title: string;
  content: string;
  sort_order: number;
  updated_at: string;
}

const slugify = (texto: string): string =>
  texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'secao';

export const guideService = {
  async list(): Promise<GuideSection[]> {
    const { data, error } = await supabase
      .from('guide_sections')
      .select('id, slug, title, content, sort_order, updated_at')
      .order('sort_order', { ascending: true })
      .order('title', { ascending: true });

    if (error) throw error;
    return (data ?? []) as GuideSection[];
  },

  async update(id: string, patch: { title: string; content: string }, userId?: string): Promise<void> {
    const { error } = await supabase
      .from('guide_sections')
      .update({
        title: patch.title,
        content: patch.content,
        updated_at: new Date().toISOString(),
        updated_by: userId ?? null,
      })
      .eq('id', id);

    if (error) throw error;
  },

  async create(title: string, sortOrder: number, userId?: string): Promise<GuideSection> {
    // Slug só precisa ser único; sufixo com timestamp evita colisão com uma
    // aba de mesmo nome que já exista (ou que tenha existido).
    const slug = `${slugify(title)}-${Date.now().toString(36)}`;
    const { data, error } = await supabase
      .from('guide_sections')
      .insert({ slug, title, content: '', sort_order: sortOrder, updated_by: userId ?? null })
      .select('id, slug, title, content, sort_order, updated_at')
      .single();

    if (error) throw error;
    return data as GuideSection;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from('guide_sections').delete().eq('id', id);
    if (error) throw error;
  },
};
