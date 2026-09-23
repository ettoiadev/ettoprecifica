# Padrões de página — ettoprecifica

> Complementa [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) e [`UI_RULES.md`](./UI_RULES.md).
> Os padrões abaixo genéricos de ERP (LIST/FORM/DETAILS/DASHBOARD) foram
> adaptados ao que o ettoprecifica **de fato tem hoje** — o app é quase
> inteiramente composto por telas de calculadora, não por listagens
> paginadas. O padrão mais importante deste documento é o **CALCULATOR
> PAGE**, porque é o que 90% do sistema usa e o que qualquer aba nova deve
> seguir.

## CALCULATOR PAGE (padrão dominante — usar para qualquer aba de produto nova)

Estrutura real, já convergida em ~20 componentes (`src/components/calculators/*.tsx`):

```
Page Header
  título — vem do `ModernCalculatorWrapper` (mapa em Index.tsx), NÃO repetir
    um <h2> com o mesmo texto dentro da calculadora. Um <h2> próprio só quando
    nomeia um SUBTIPO dentro da aba (ex.: "Placa em PS" sob "Calculadora de Placas").
  descrição curta (p, text-gray-600) — 1-2 frases do que a calculadora faz

Grid 2 colunas (lg:grid-cols-2, gap-8) — empilha em 1 coluna abaixo de lg

  Coluna 1 — Entradas (space-y-6)
    grupo: seleção de tipo/material (botões em grid, chips pastel indigo
      quando é lista de produto manual; select/radio quando é modo do motor)
    grupo: dimensões e quantidade (largura/altura/qtd lado a lado)
    checkboxes opcionais (ex.: "Emitir com nota fiscal", "Incluir máscara")
    DeslocamentoField (quando a calculadora tem deslocamento por CEP)

  Coluna 2 — Painel "Orçamento" (bg-gray-50 rounded-xl border p-6)
    h3 "Orçamento" (text-lg font-semibold)
    estado vazio: "Informe as dimensões para ver o preço." (text-sm text-gray-500)
    estado loading: Loader2 + "Calculando…" (só calculadoras do motor, chamada assíncrona)
    estado erro: AlertTriangle + mensagem (text-red-600)
    alerta do motor (se houver): bloco âmbar
    Card de preço (bg-white rounded-lg border p-4)
      label "Preço de venda" (text-xs uppercase text-gray-500)
      valor (text-3xl font-bold text-blue-600)
      nota de NF incluída/desconto (text-xs, cinza ou âmbar)
      nota de unitário quando qtd > 1 (text-xs text-green-600)
    Composição/breakdown (linhas label: valor, text-sm text-gray-600)
    Ações (space-y-2, `Button` do shadcn, ambos w-full)
      "Adicionar à cotação" — <Button variant="outline">  (secundária, neutra)
      "Copiar orçamento"   — <Button>                     (primária, azul)
```

Controles a usar (nunca redefinir classe local — ver `UI_COMPONENT_INVENTORY.md §3`):
`Input` (shadcn) para campo numérico/texto · `OptionChip` para escolher
tipo/material/modo · `CalcCheckbox` para opção liga/desliga · `selectClass`
para `<select>` nativo · `Button` para ação.

Regras fixas deste padrão:
- O painel de orçamento nunca cabe em cards separados por informação — é **um**
  card de preço + uma lista de composição, não vários cards pequenos.
- A cópia de orçamento (clipboard) é sempre **limpa**: produto (label) +
  medida + `Valor:` — nunca inclui "com/sem nota fiscal" nem linha de
  desconto (isso é interno, fica só no painel). Ver `CLAUDE.md` §"Nota fiscal
  fixa" para o histórico dessa decisão.
- Toda calculadora é **self-contained**: estado, integração com
  `CotacaoContext` e `handleCopy` vivem no próprio componente — não há um
  wrapper de resumo compartilhado (`BudgetSummaryExtended` foi removido de
  propósito).

Ao criar uma aba nova, comece copiando a estrutura de uma calculadora manual
recente e completa (ex.: `PlacaACMManualCalculator.tsx` ou
`FachadaManualCalculator.tsx`) e adapte os campos — não desenhe do zero.

## FORM PAGE (Configurações)

O equivalente do ettoprecifica a uma "form page" de ERP é a tela de
Configurações (`SettingsPanel.tsx`), estruturada assim:

```
Page Header (sticky, SettingsHeader.tsx)
  título "Configurações" + busca de seção
  ações: Cancelar (outline) | Salvar (primário) — sempre nesta ordem/posição

Corpo (max-w-6xl)
  Navegação lateral por grupo (desktop) / select (mobile)
    grupo "Produtos": Adesivos, Lona, Placa PS, Placa ACM, Fachada, Laser, DTF, Etiquetas
    grupo "Geral": status do banco + observações
  Conteúdo da seção ativa (ConfigSection.tsx)
    Card único por seção (título + campos)
    campos simples: CurrencyInput / PercentageInput / NumberInput em grid 2 colunas
    lista de itens editável quando aplicável: CustomVariationsManager
      (add/editar/excluir/reordenar ↑↓, campo descrição opcional, valor mínimo opcional)
```

Regras fixas:
- Botões de ação do formulário inteiro ficam **no header**, não no rodapé de
  cada seção — salvar sempre salva a config inteira, não por seção.
- Ordem **Cancelar | Salvar** não muda entre módulos.
- Uma seção nova de produto manual = 1 entrada em `settingsConfig.ts` + (se
  tiver lista de itens) 1 entrada em `LIST_MANAGERS` (`ConfigSection.tsx`).
  Não inventar um layout de formulário diferente por seção.

## LIST PAGE

**Ainda não existe no ettoprecifica** (não há hoje uma listagem paginável de
registros — orçamentos não têm histórico navegável, por exemplo). Quando
surgir a primeira (ex.: histórico de orçamentos, lista de vendedores),
seguir a estrutura de referência do OrbynAdmin
(`reference-ui/orbynadmin/src/app/(app)/products/page.tsx` é o exemplo mais
completo) adaptada aos tokens do ettoprecifica:

```
Page Header
  breadcrumb (se a tela estiver a mais de 1 nível de profundidade)
  título + descrição curta opcional
  ação principal à direita (ex.: "Novo orçamento")

Toolbar
  busca
  filtros (período, status) quando fizer sentido
  ações secundárias (exportar, etc.)

Content
  DataTable (shadcn `Table` + `TanStack Table` se a lista precisar de
    ordenação/paginação real — biblioteca ainda não está no projeto, avaliar
    antes de adicionar; ver `UI_RULES.md#não-duplicar-bibliotecas` — o
    projeto não tem essa regra escrita à parte, mas o princípio de
    `DESIGN_SYSTEM.md` vale: preferir shadcn + Tailwind antes de somar dependência)
    colunas relevantes, status como badge (padrão de `DESIGN_SYSTEM.md §3.3`)
    ação por linha via ícone (editar/ver/excluir)
    paginação no rodapé
```

Não criar uma listagem em formato de cards grandes quando os dados são
tabulares por natureza (ver `UI_RULES.md`).

## DETAILS PAGE

**Ainda não existe.** Quando surgir (ex.: ver detalhe de um orçamento salvo),
usar:

```
Header: título do registro + status (badge) + ações (editar, duplicar, excluir)
Informações principais (campos-chave, não card por campo)
Tabs ou seções quando houver blocos distintos de informação
Histórico/log quando aplicável
```

## DASHBOARD

**Não existe e não deve ser criado "porque todo ERP tem um".** O ettoprecifica
é ferramenta de cálculo no atendimento, não um painel gerencial — a tela
inicial de cada usuário já é a calculadora, que é a ação que ele quer fazer.
Se um dashboard for pedido no futuro (ex.: total orçado no mês, produtos mais
cotados), seguir a regra de `DESIGN_SYSTEM.md`/`UI_RULES.md`: só indicador com
utilidade real, nunca "grade de cards" preenchendo espaço. Referência de tom
(não de conteúdo) para quando isso existir: os `SummaryTile` do OrbynAdmin —
card simples, `label` pequeno + valor grande em `tabular-nums`, sem ícone
decorativo, sem cor de fundo colorida.
