# Design System — ettoprecifica

> **Leitura obrigatória antes de criar ou alterar qualquer tela.** Junto com
> [`UI_RULES.md`](./UI_RULES.md), [`PAGE_PATTERNS.md`](./PAGE_PATTERNS.md) e
> [`UI_COMPONENT_INVENTORY.md`](./UI_COMPONENT_INVENTORY.md), este arquivo é a
> documentação oficial de interface do ettoprecifica. Ver a regra completa em
> [`UI_RULES.md#regra-para-agentes-de-ia`](./UI_RULES.md#regra-para-agentes-de-ia).

## 1. O que o ettoprecifica é (posicionamento visual)

O ettoprecifica é um sistema operacional interno — uma calculadora de preços
usada por vendedores durante o atendimento, várias vezes por dia. Não é uma
landing page, não é um produto de marketing, não precisa impressionar visita.
Precisa ser **rápido de ler, rápido de operar, e igual de aba pra aba**.

Referências conceituais de tom visual: Conta Azul, VHSYS, Stripe Dashboard,
[OrbynAdmin](https://github.com/masondevx/orbynadmin) — clonado localmente em
`/reference-ui/orbynadmin` (ver `reference-ui/README.md`) só para estudo de
estrutura, nunca para copiar branding ou estilo literal.

Características esperadas:
- Visual clean, profissional, empresarial.
- Densidade de informação alta — não é um app de consumo com espaço vazio generoso.
- Desktop-first (é usado em balcão/computador de loja), responsivo até mobile.
- Baixo ruído visual: cor com função, não decoração.
- Hierarquia clara e previsível entre abas.
- Consistência entre módulos — uma calculadora não deve "parecer de outro app" perto da vizinha.

Isso **não** é uma reescrita. É a referência para o próximo commit. Ver a
seção 6 para o que já está de acordo e o que ainda diverge.

## 2. Papel de cada fonte

| Fonte | Responde |
|---|---|
| **ettoprecifica existente** | "Já temos um padrão interno pra isso?" — checar primeiro, sempre. |
| **shadcn/ui** (`src/components/ui/`) | "Qual componente e qual estrutura eu uso?" |
| **OrbynAdmin** (`/reference-ui/orbynadmin`) | "Como essa tela deveria ser organizada?" (layout, composição, densidade) |
| **Lucide Icons** (`lucide-react`) | "Qual ícone uso?" — única biblioteca de ícones do projeto. |

Não confundir os papéis: OrbynAdmin nunca é fonte de cor, texto ou componente
pronto para copiar; é fonte de **estrutura**.

## 3. Cor

### 3.1 Tokens do tema (`src/index.css`, já existentes — não alterar sem necessidade)

```
--background: 0 0% 100%          fundo da página (branco)
--foreground: 222.2 84% 4.9%     texto padrão (quase preto)
--primary: 215 100% 45%          azul institucional (~#0066E5) — ações, foco, preço
--secondary / --muted / --accent  cinza-azulado claro — fundos neutros, superfícies secundárias
--destructive: 0 84.2% 60.2%     vermelho — ações destrutivas, erro
--border / --input: 214.3 31.8% 91.4%   bordas discretas
--radius: 0.5rem                 raio de borda padrão (8px)
```

Essas variáveis já alimentam `tailwind.config.ts` (`bg-primary`,
`text-muted-foreground`, `border-border` etc.) e o componente `Button` do
shadcn. **Use-as** em vez de `bg-blue-600` cru sempre que possível — hoje a
maioria das calculadoras usa cor Tailwind crua (`blue-600`, `gray-700`) em vez
dos tokens; ver seção 6.3.

### 3.2 Paleta funcional (o que a cor comunica)

Cor tem função, nunca decoração. Uso documentado a partir do padrão real já
convergido nas ~20 calculadoras (não é proposta nova, é o que já funciona):

| Papel | Cor | Uso |
|---|---|---|
| Ação primária / preço de venda | `primary` / `blue-600` | Botão principal, valor final em destaque, item selecionado |
| Seleção / item ativo (chips de material) | `indigo-50`↔`indigo-100` (fundo) + `indigo-400`↔`indigo-800` (texto/borda) | Botões de tipo/material em Adesivos, Placas, Fachada, Laser |
| Aviso / desconto sem nota fiscal | `amber-50`↔`amber-800` | Alertas do motor, "sem nota fiscal — desconto de X" |
| Informação secundária positiva | `green-600` | Nota de "preço unitário" quando há quantidade > 1 |
| Destrutivo / erro | `red-600` / `destructive` | Excluir, erro de cálculo, campo inválido |
| Neutro / texto e superfícies | escala `gray-50`…`gray-900` | Todo o resto — é a cor dominante da UI, de propósito |

**Não use** `orange-*` para desconto/alerta — é resquício de antes da
padronização de 17/09/26 (ver `CLAUDE.md`); o papel é do `amber-*`. Se
encontrar `orange-600` numa calculadora, é uma inconsistência a corrigir, não
um padrão a seguir (ver `UI_COMPONENT_INVENTORY.md`).

**Nunca** introduza uma cor nova "porque ficou bonita" numa aba específica. O
exemplo mais visível disso hoje é `ModernTabs.tsx`, que atribui um gradiente
de 2 cores diferente para cada uma das 11 abas — puramente decorativo, sem
significado, e será revisto (ver seção 6.1). Não replicar esse padrão em nada
novo.

### 3.3 Badges/status

O ettoprecifica ainda não tem uma tela com "status" no sentido de ERP
(pago/pendente/cancelado). Quando existir, seguir o padrão OrbynAdmin: fundo
suave em baixa opacidade + texto sólido da mesma família, nunca badge
saturado cheio:

```tsx
// padrão de referência (OrbynAdmin), adaptar com os tokens do ettoprecifica
"bg-emerald-500/10 text-emerald-600"   // sucesso / em estoque / pago
"bg-amber-500/10 text-amber-600"       // atenção / estoque baixo / pendente
"bg-rose-500/10 text-rose-600"         // erro / esgotado / cancelado
```

## 4. Tipografia

Hierarquia oficial (extraída do padrão já dominante nas calculadoras; ver
`UI_RULES.md` para quando usar cada uma):

| Papel | Classes | Onde |
|---|---|---|
| Título de página/aba | `text-2xl font-bold text-gray-900` | Cabeçalho de cada calculadora |
| Descrição curta de página | `text-gray-600` | Parágrafo abaixo do título |
| Título de seção/card | `text-lg font-semibold text-gray-900` | "Orçamento", cards de Configurações |
| Label de campo | `text-sm font-medium text-gray-700` | Rótulo acima de input/grupo de botões |
| Texto secundário / descrição de item | `text-xs text-gray-500` | Subtítulo de opção, texto de rodapé de campo |
| Valor em destaque (preço) | `text-3xl font-bold text-blue-600` | Preço de venda no painel de Orçamento |
| Tabela / lista | `text-sm text-gray-600` (label) / `text-gray-900` (valor) | Linhas de composição/breakdown |
| Badge / rótulo pequeno | `text-xs uppercase tracking-wide text-gray-500` | "Preço de venda", cabeçalhos de bloco |

**Não crie tamanho novo** sem justificativa. Se nenhuma linha acima serve,
provavelmente o problema é de estrutura, não de fonte.

**Não use texto em gradiente** (`bg-gradient-to-r ... bg-clip-text
text-transparent`, hoje presente em `ModernHeader`, `SettingsHeader`,
`ModernCalculatorWrapper`, `ConfigSection`) em telas novas — ver seção 6.1.
Título de página é `text-gray-900` sólido, ponto.

## 5. Espaçamento

Escala em múltiplos de 4px (já é o que o Tailwind padrão aplica e o que o
código majoritariamente já segue):

```
1 = 4px   2 = 8px   3 = 12px   4 = 16px   6 = 24px   8 = 32px   10 = 40px
```

Padrões já convergidos a manter:
- Padding de página/painel de calculadora: `p-6`.
- Gap entre coluna de entradas e painel de orçamento: `gap-8` (`grid lg:grid-cols-2`).
- Espaço vertical entre campos de um formulário: `space-y-6`.
- Padding interno de card de resultado: `p-4`.

Não introduzir `px` arbitrário (`13px`, `17px`, `19px`) — usar sempre a escala
Tailwind (`p-3`, `p-4`, `gap-2`, etc.).

## 6. Estado atual vs. estado alvo (leitura honesta)

Esta seção existe para não fingir que o app já segue este Design System — ele
ainda não segue, em partes visíveis. É o material de trabalho da migração
gradual (ver relatório entregue junto com esta fundação).

### 6.1 O que fugia do alvo — **etapa 1 já corrigida em 23/09/26**

A lista abaixo descrevia o estado do "chrome" (`Modern*`, `Settings*`,
`Index.tsx`) antes da primeira etapa de migração gradual. Já foi resolvida —
fica registrada como exemplo do que **não replicar** em telas novas, e como
histórico do porquê a etapa 1 existiu:

- ~~Gradientes decorativos em título/botão/chip de ícone (`ModernHeader`,
  `SettingsHeader`, `ModernCalculatorWrapper` via `.gradient-text`,
  `ConfigSection`), 11 gradientes de 2 cores diferentes por aba em
  `ModernTabs`.~~ → títulos agora `text-gray-900` sólido; chips de ícone
  `bg-primary` sólido; `ModernTabs` usa um único estado ativo (`bg-primary`),
  sem cor por aba.
- ~~`.card-backdrop` (`backdrop-blur-xl ... shadow-xl hover:shadow-2xl`) nos
  cards de `ConfigSection`.~~ → `Card` padrão shadcn (`shadow-sm`).
- ~~Blobs decorativos animados (`blur-3xl animate-pulse`) em `SettingsLayout`
  e `Index.tsx`.~~ → removidos, fundo `bg-gray-50` plano.
- ~~Título centralizado com barra decorativa em `ModernCalculatorWrapper`.~~ →
  título alinhado à esquerda, sem decoração.
- ~~CSS morto (`.glass`, `.animate-float`, `.animate-glow`, `.elevation-*` e
  outras 10 classes sem consumidor).~~ → removido de `index.css` (ver
  `UI_COMPONENT_INVENTORY.md §5`).

`backdrop-blur-xl` **continua** em `ModernHeader`/`ModernTabs`/`SettingsHeader`
— são headers sticky sobre conteúdo rolando por baixo, o caso em que a regra
de `UI_RULES.md` permite blur (legibilidade), não decoração.

O que ainda não foi tocado (etapas seguintes da migração gradual, ver
`UI_COMPONENT_INVENTORY.md §3` e §6.3 abaixo): a duplicação de `btn()`/
`inputClass`/checkbox cru dentro das ~20 calculadoras.

### 6.2 O que já está alinhado (preservar, não redesenhar)

- **Layout de calculadora** (título + descrição → grid 2 colunas: entradas |
  painel "Orçamento" cinza-claro com card de preço branco) é consistente em
  praticamente todas as ~20 calculadoras. Isso já É o padrão de página deste
  app — ver `PAGE_PATTERNS.md`.
- Paleta funcional da seção 3.2 já é seguida de forma consistente dentro do
  conteúdo das calculadoras (fora do chrome).
- Ícones 100% Lucide, sem mistura de biblioteca.
- Espaçamento já majoritariamente na escala de 4px.

### 6.3 Duplicação a resolver (gradual, não nesta etapa)

Cada calculadora define localmente sua própria constante `inputClass` (22
arquivos) e função `btn(active)` (15 arquivos) em vez de usar `Input` e
`Button`/`ToggleGroup` do shadcn/ui, e usa `<input type="checkbox">` cru em
vez do componente `Checkbox` do shadcn (que está instalado e nunca é
importado). Ver detalhamento arquivo-a-arquivo em `UI_COMPONENT_INVENTORY.md`.

## 7. Regra de decisão

Quando houver dúvida entre duas soluções:

```
CONSISTÊNCIA > LEGIBILIDADE > PRODUTIVIDADE > ESTÉTICA
```

A interface não sacrifica UX para parecer mais bonita. Um componente "feio mas
igual ao resto do sistema" ganha de um componente "bonito mas único".
