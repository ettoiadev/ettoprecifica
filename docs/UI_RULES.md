# Regras de UI — ettoprecifica

> Complementa [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) (o quê e o porquê) com
> regras diretas de aplicação (o como). Em caso de conflito de interpretação,
> `DESIGN_SYSTEM.md` é a fonte da verdade conceitual; este arquivo é o
> checklist prático.

## Ordem oficial de decisão de UI

1. **Componente já existente e consistente no ettoprecifica** — procurar antes
   de tudo. Ver `UI_COMPONENT_INVENTORY.md`.
2. **shadcn/ui** (`src/components/ui/`) — já instalado, quase todo não usado
   ainda. Preferir sempre a um elemento HTML cru.
3. **OrbynAdmin** (`/reference-ui/orbynadmin`) como referência de como montar
   a tela (estrutura, não estilo).
4. **Criar componente novo** — só quando nenhuma das opções acima resolve.

## Checklist obrigatório antes de implementar uma tela nova

1. Existe tela semelhante no ettoprecifica? Copiar o padrão dela.
2. Consultar `/reference-ui/orbynadmin` — como esse tipo de tela é organizado lá?
3. shadcn/ui já tem os componentes necessários?
4. Consultar `DESIGN_SYSTEM.md`.
5. Consultar este arquivo (`UI_RULES.md`).
6. Consultar `PAGE_PATTERNS.md`.
7. Consultar `UI_COMPONENT_INVENTORY.md` — evitar duplicar componente existente.
8. Só então implementar.

Não inventar um padrão visual novo quando já existe solução equivalente.

## Regra para agentes de IA

Qualquer agente (Claude ou outro) que crie ou modifique UI neste projeto deve,
**antes de escrever código de interface**, ler:

- `/docs/DESIGN_SYSTEM.md`
- `/docs/UI_RULES.md` (este arquivo)
- `/docs/PAGE_PATTERNS.md`
- `/docs/UI_COMPONENT_INVENTORY.md`
- `/reference-ui/orbynadmin` (quando a dúvida for de estrutura de página)

e verificar os componentes já disponíveis em `src/components/ui/` (shadcn/ui)
antes de escrever um elemento HTML cru ou criar um componente novo.

**Nenhum agente deve criar uma linguagem visual isolada** — uma calculadora
nova não pode "parecer de outro sistema" perto das demais. Isso vale mesmo
quando o pedido do usuário for só "cria a aba X" sem menção a UI: a aba nova
segue o padrão de `PAGE_PATTERNS.md#calculator-page`, não um layout inventado
na hora.

Esta regra é adicional às instruções de `CLAUDE.md` (contrato de dados/skill),
não substitui — `CLAUDE.md` continua sendo lido primeiro em todo chat novo.

## Evitar explicitamente ("aparência de IA")

Não usar, em telas novas, sem uma razão funcional documentada no PR/commit:

- Cards grandes para qualquer informação pequena (um número não precisa de card).
- Bordas arredondadas exageradas (acima do `--radius` padrão de 8px / `rounded-lg`).
- "Bubble UI" (blocos flutuantes desconectados da grade).
- Gradientes sem função semântica (texto, botão, ícone, fundo).
- Glassmorphism / `backdrop-blur` fora de um header sticky que realmente
  precisa dele para legibilidade sobre conteúdo rolando por baixo.
- Sombras fortes ou em múltiplas camadas (`shadow-xl`, `shadow-2xl`, `hover:shadow-2xl`).
- Glow (`box-shadow` colorido, `animate-glow`).
- Ícones decorativos sem função (ícone só para "preencher" um card).
- Emoji como ícone — usar Lucide.
- Títulos gigantes fora da hierarquia da seção 4 de `DESIGN_SYSTEM.md`.
- Botões gigantes fora do padrão de tamanho do `Button` shadcn (`sm`/`default`/`lg`).
- Espaço vazio excessivo ou conteúdo centralizado tipo landing page — este é
  um ERP desktop-first, o conteúdo ocupa a largura útil.
- Blobs/formas decorativas animadas de fundo (`blur-3xl animate-pulse`).
- Dashboards com widgets "porque um dashboard tem que ter cards" — só criar
  indicador se ele responde uma pergunta real de quem usa a tela.
- Cada módulo com um estilo próprio — todo módulo usa a mesma linguagem visual.
- Badges coloridos decorativos sem significado de status.
- Componente criado só por estética, sem função.

Ver `DESIGN_SYSTEM.md#61-o-que-hoje-foge-do-alvo-não-replicar-em-telas-novas`
para exemplos reais já existentes no código — citados para não repetir, não
para copiar.

## Cores

- Usar os tokens do tema (`primary`, `muted`, `destructive`, etc.) quando o
  elemento for genérico (fundo de página, borda, texto secundário).
- Usar a paleta funcional documentada em `DESIGN_SYSTEM.md §3.2` quando o
  elemento tiver um papel específico (seleção, alerta, preço, destrutivo).
- Nunca introduzir uma cor nova para um módulo específico "para diferenciar"
  — diferenciação de módulo é por conteúdo/ícone, não por paleta.
- Status/badge: fundo em opacidade baixa (`/10`) + texto sólido da mesma
  família de cor. Nunca badge com fundo 100% saturado.

## Tipografia

- Usar a tabela de `DESIGN_SYSTEM.md §4`. Não criar tamanho/peso novo sem
  atualizar aquela tabela primeiro (se o caso for genuinamente novo, é um
  sinal de que a hierarquia precisa de uma entrada nova documentada, não de
  uma exceção silenciosa).
- Texto em gradiente é proibido em título de página/seção.

## Espaçamento

- Escala de 4px (`DESIGN_SYSTEM.md §5`). Nunca `px` arbitrário.
- Painel de calculadora: `p-6`. Formulário: `space-y-6`. Card de resultado: `p-4`.

## Bordas e sombras

- Raio padrão: `rounded-lg` (8px, = `--radius`). Botões/inputs pequenos podem
  usar `rounded-md`. Evitar `rounded-xl`/`rounded-2xl`/`rounded-full` fora de
  avatares, badges pill e ícones circulares pequenos.
- Sombra padrão de card: `shadow-sm` (o default do componente `Card` do
  shadcn). `shadow-md` só em elemento flutuante (dropdown, popover, dialog).
  Nunca `shadow-xl`/`shadow-2xl` num card estático de conteúdo.
- Separação entre blocos por contraste de fundo (`bg-gray-50` vs `bg-white`)
  ou borda `border-gray-200`, não por sombra.

## Ícones

- Só Lucide (`lucide-react`), já 100% seguido no projeto — manter assim.
- Ícone acompanha ação/estado real (copiar, adicionar, excluir, alerta). Não
  usar ícone "de enfeite" ao lado de um título sem outra função.

## Formulários

- Usar `Input`, `Checkbox`, `Select`, `Label` do shadcn (instalados,
  atualmente não usados pelas calculadoras — ver inventário) em vez de
  elementos HTML crus com classe local duplicada.
- Um campo = um `label` associado (via `htmlFor`/`id` ou pelo componente
  `Label`), helper text opcional em `text-xs text-gray-500` abaixo do campo.
- Mensagem de erro/alerta segue o padrão âmbar/vermelho já usado (ver
  `DESIGN_SYSTEM.md §3.2`), nunca uma cor nova por formulário.
- Agrupar campos relacionados com `space-y-6` entre grupos, `gap-4` dentro de
  um grupo (ex.: largura/altura/quantidade lado a lado).
- Ações do formulário: padrão local já em uso — botão secundário (outline)
  "Adicionar à cotação" empilhado acima do botão primário "Copiar orçamento",
  ambos largura total (`w-full`) dentro do painel de resultado. Em telas de
  configuração o padrão é **Cancelar | Salvar**, cancelar à esquerda, salvar
  (primário) à direita — não inverter nem alterar entre módulos.

## Tabelas / listas

O ettoprecifica ainda não tem uma tabela de dados no sentido de ERP (lista
paginável com ordenação) — o mais próximo disso é `CustomVariationsManager`,
que lista itens editáveis (tipos de material/produto) em Configurações. Até
existir uma tabela de verdade (ex.: histórico de orçamentos):

- Usar o componente `Table` do shadcn (instalado, não usado ainda) em vez de
  `div`s com grid manual, quando a lista for tabular por natureza.
- Estado vazio: frase curta e direta ("Nenhum tipo cadastrado — adicione em
  Configurações"), sem ilustração, sem card gigante — já é o padrão seguido.
- Ação por linha: ícone à direita (editar/excluir), não texto.
- Se a lista puder crescer além de ~1 tela, prever paginação (`Pagination` do
  shadcn) desde o início — não adicionar depois como remendo.

## Estados da interface

Padronizar entre módulos, não reinventar por tela:

| Estado | Padrão atual (manter) |
|---|---|
| Loading | `Loader2` (Lucide) com `animate-spin` + texto "Calculando…" |
| Empty | Frase curta em `text-sm text-gray-500`, sem ilustração |
| Error | Ícone `AlertTriangle` + texto em `text-red-600`, fundo neutro |
| Alerta/aviso do motor | Bloco `bg-amber-50 border border-amber-200 text-amber-800` |
| Disabled | Opacidade reduzida + `cursor-not-allowed` (padrão nativo do `Button`/`Input` shadcn) |
| Hover | `hover:bg-gray-50` em cards clicáveis, `hover:bg-blue-50`/`hover:bg-blue-700` em ações |
| Focus | Anel de foco do tema (`focus:ring-2 focus:ring-blue-500` ou `focus-visible:ring-ring` do shadcn) |

## Sidebar / navegação

O ettoprecifica hoje **não tem sidebar** — a navegação é uma barra de abas
horizontal fixa (`ModernTabs`), adequada para o número atual de módulos
(11). Isso não é uma inconsistência a corrigir agora. Se o número de módulos
crescer a ponto de a barra de abas deixar de caber/fazer sentido, a migração
para sidebar (o componente `Sidebar` do shadcn já está instalado, nunca
usado) deve seguir a estrutura do `app-sidebar.tsx` do OrbynAdmin como
referência — decisão para quando o problema aparecer de fato, não antes.
