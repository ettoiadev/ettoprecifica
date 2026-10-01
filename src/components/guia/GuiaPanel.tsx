import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookOpen, X, Pencil, Save, Plus, Trash2, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';
import GuiaConteudo from './GuiaConteudo';
import { useAuth } from '../../contexts/AuthContext';
import { guideService, GuideSection } from '../../services/supabase/guideService';
import { toast } from 'sonner';

// Guia interno: normas da empresa, medidas, matéria-prima, prazos etc.
// Cada assunto é uma aba (uma linha em `guide_sections`), com conteúdo em texto
// livre editável pelo próprio app. O conteúdo é COMPARTILHADO — o que um
// usuário salva, todos passam a ver (é documento da empresa, não configuração
// de vendedor). Ver docs/GUIA.md.
interface Props {
  onClose: () => void;
}

const formatarData = (iso: string): string => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const GuiaPanel: React.FC<Props> = ({ onClose }) => {
  const { user } = useAuth();
  const [secoes, setSecoes] = useState<GuideSection[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [abaAtiva, setAbaAtiva] = useState<string>('');

  const [editando, setEditando] = useState(false);
  const [rascunhoTitulo, setRascunhoTitulo] = useState('');
  const [rascunhoConteudo, setRascunhoConteudo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await guideService.list();
      setSecoes(lista);
      setAbaAtiva((atual) => (lista.some((s) => s.id === atual) ? atual : lista[0]?.id ?? ''));
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível carregar o guia.');
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const secaoAtual = useMemo(() => secoes.find((s) => s.id === abaAtiva), [secoes, abaAtiva]);

  const iniciarEdicao = () => {
    if (!secaoAtual) return;
    setRascunhoTitulo(secaoAtual.title);
    setRascunhoConteudo(secaoAtual.content);
    setEditando(true);
  };

  const cancelarEdicao = () => {
    setEditando(false);
    setRascunhoTitulo('');
    setRascunhoConteudo('');
  };

  const salvar = async () => {
    if (!secaoAtual) return;
    const titulo = rascunhoTitulo.trim();
    if (!titulo) {
      toast.error('Dê um nome para a aba.');
      return;
    }
    setSalvando(true);
    try {
      await guideService.update(secaoAtual.id, { title: titulo, content: rascunhoConteudo }, user?.id);
      setSecoes((lista) =>
        lista.map((s) =>
          s.id === secaoAtual.id
            ? { ...s, title: titulo, content: rascunhoConteudo, updated_at: new Date().toISOString() }
            : s
        )
      );
      setEditando(false);
      toast.success('Guia atualizado!');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível salvar.');
    } finally {
      setSalvando(false);
    }
  };

  const novaAba = async () => {
    const proximaOrdem = (secoes[secoes.length - 1]?.sort_order ?? 0) + 10;
    try {
      const criada = await guideService.create('Novo assunto', proximaOrdem, user?.id);
      setSecoes((lista) => [...lista, criada]);
      setAbaAtiva(criada.id);
      setRascunhoTitulo(criada.title);
      setRascunhoConteudo('');
      setEditando(true);
      toast.success('Aba criada — dê um nome e escreva o conteúdo.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível criar a aba.');
    }
  };

  const excluir = async () => {
    if (!secaoAtual) return;
    setConfirmarExclusao(false);
    try {
      await guideService.remove(secaoAtual.id);
      const restantes = secoes.filter((s) => s.id !== secaoAtual.id);
      setSecoes(restantes);
      setAbaAtiva(restantes[0]?.id ?? '');
      setEditando(false);
      toast.success('Aba excluída.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Não foi possível excluir.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4 py-5">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-lg bg-primary">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">Guia</h1>
            </div>
            <Button variant="outline" onClick={onClose} aria-label="Fechar guia" className="shrink-0">
              <X className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Fechar</span>
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {carregando ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando…
          </div>
        ) : erro ? (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{erro}</span>
          </div>
        ) : secoes.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Nenhum assunto cadastrado ainda.</p>
            <Button onClick={novaAba}>
              <Plus className="w-4 h-4 mr-2" /> Criar primeira aba
            </Button>
          </div>
        ) : (
          <Tabs
            value={abaAtiva}
            onValueChange={(v) => {
              if (editando) return; // não troca de aba no meio de uma edição
              setAbaAtiva(v);
            }}
          >
            <div className="flex items-center gap-2 flex-wrap mb-4">
              <TabsList className="h-auto flex-wrap justify-start">
                {secoes.map((s) => (
                  <TabsTrigger key={s.id} value={s.id} disabled={editando && s.id !== abaAtiva}>
                    {s.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {!editando && (
                <Button variant="outline" size="sm" onClick={novaAba}>
                  <Plus className="w-4 h-4 md:mr-2" />
                  <span className="hidden md:inline">Nova aba</span>
                </Button>
              )}
            </div>

            {secoes.map((s) => (
              <TabsContent key={s.id} value={s.id} className="mt-0">
                <div className="bg-white rounded-lg border border-gray-200 p-6">
                  {editando && s.id === abaAtiva ? (
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="guia-titulo" className="block text-sm font-medium text-gray-700 mb-1">
                          Nome da aba
                        </label>
                        <Input
                          id="guia-titulo"
                          value={rascunhoTitulo}
                          onChange={(e) => setRascunhoTitulo(e.target.value)}
                          className="max-w-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="guia-conteudo" className="block text-sm font-medium text-gray-700 mb-1">
                          Conteúdo
                        </label>
                        <Textarea
                          id="guia-conteudo"
                          value={rascunhoConteudo}
                          onChange={(e) => setRascunhoConteudo(e.target.value)}
                          placeholder="Escreva ou cole o conteúdo deste assunto…"
                          className="min-h-[420px] font-mono text-xs leading-relaxed"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Texto livre: as quebras de linha são preservadas como você escrever. Para
                          desenhar uma chapa, use uma linha no formato{' '}
                          <code className="font-mono text-gray-700">#chapa: 200x100 peça 60x40 — Placa PS 2mm</code>{' '}
                          (medidas em cm; a parte da peça e o rótulo são opcionais).
                        </p>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                        <Button onClick={salvar} disabled={salvando}>
                          {salvando ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4 mr-2" />
                          )}
                          Salvar
                        </Button>
                        <Button variant="outline" onClick={cancelarEdicao} disabled={salvando}>
                          Cancelar
                        </Button>
                        <Button
                          variant="ghost"
                          onClick={() => setConfirmarExclusao(true)}
                          disabled={salvando}
                          className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Excluir aba
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h2 className="text-lg font-semibold text-gray-900">{s.title}</h2>
                          {s.updated_at && (
                            <p className="text-xs text-gray-500 mt-0.5">
                              Atualizado em {formatarData(s.updated_at)}
                            </p>
                          )}
                        </div>
                        <Button variant="outline" size="sm" onClick={iniciarEdicao} className="shrink-0">
                          <Pencil className="w-4 h-4 md:mr-2" />
                          <span className="hidden md:inline">Editar</span>
                        </Button>
                      </div>

                      {s.content.trim() ? (
                        <GuiaConteudo conteudo={s.content} />
                      ) : (
                        <p className="text-sm text-gray-500">
                          Nenhum conteúdo ainda — clique em <strong>Editar</strong> para escrever ou colar.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>

      <AlertDialog open={confirmarExclusao} onOpenChange={setConfirmarExclusao}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir "{secaoAtual?.title}"?</AlertDialogTitle>
            <AlertDialogDescription>
              O conteúdo desta aba será apagado para todos os usuários. Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={excluir}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default GuiaPanel;
