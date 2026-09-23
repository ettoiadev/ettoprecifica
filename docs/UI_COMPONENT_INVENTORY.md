# Inventário de componentes de UI — ettoprecifica

> Levantamento feito em 23/09/26 por leitura direta do código (`grep`/leitura
> de arquivo), não por suposição. Objetivo: evitar que um agente crie um
> componente que já existe, e mapear onde a padronização (`DESIGN_SYSTEM.md`,
> `UI_RULES.md`) ainda precisa ser aplicada. Complementa `PAGE_PATTERNS.md`.

## 1. shadcn/ui instalado (`src/components/ui/`) — o que é realmente usado

O projeto tem **45 componentes shadcn/ui instalados** (scaffold inicial
completo), mas só uma fração pequena é de fato importada fora da própria
pasta `ui/`. Contagem real de uso (arquivos que importam de `ui/<componente>`,
fora de `src/components/ui/` em si):

| Componente | Usos | Onde | Status |
|---|---|---|---|
| `button` | 19 | Todas as calculadoras (ações "Adicionar à cotação"/"Copiar orçamento") + `ModernHeader`, `SettingsHeader`, `Auth`, `ProtectedRoute`, `CustomVariationsManager` | **Usar sempre** para botão de ação: `variant="outline"` = secundária, `default` = primária. Botão de *seleção* (tipo/material/modo) não é este — é o `OptionChip` (§3). |
| `input` | 17 | Todas as calculadoras (via `Input` direto) + `SettingsHeader`, `Auth`, `CustomVariationsManager` | Padrão desde 23/09/26 — ver §3. |
| `card` | 4 | `ModernCalculatorWrapper`, `ConfigSection`, OrbynAdmin-style summary (nenhum hoje) | Base de painéis fora das calculadoras. |
| `label` | 3 | `CustomVariationsManager`, formulários de auth | — |
| `currency-input` | 1 | `ConfigSection` | Componente próprio do projeto (não é do shadcn puro), ver §2. |
| `number-input` | 1 | `ConfigSection` | Idem. |
| `percentage-input` | 1 | `ConfigSection` | Idem. |
| `dialog` | 1 | `CustomVariationsManager` (form de adicionar/editar item) | — |
| `alert-dialog` | 1 | `CustomVariationsManager` (confirmar exclusão) | — |
| `checkbox` | 1 | `calculators/CalcControls.tsx` (via `CalcCheckbox`, usado por 16 calculadoras) | Padrão desde 23/09/26 — usar sempre via `CalcCheckbox`, ver §3. |
| `select`, `radio-group`, `switch`, `textarea`, `alert`, `aspect-ratio`, `breadcrumb`, `collapsible` | **0** | — | Instalados, não usados em lugar nenhum. |
| `table`, `pagination` | **0** | — | Instalados, não usados — não há tabela de dados no app hoje (ver `PAGE_PATTERNS.md#list-page`). |
| `accordion`, `avatar`, `calendar`, `carousel`, `chart`, `command`, `context-menu`, `drawer`, `hover-card`, `input-otp`, `menubar`, `navigation-menu`, `progress`, `resizable`, `sidebar`, `slider`, `toggle`, `toggle-group`, `form` | **0** | — | Instalados, não usados. Sobra do scaffold inicial (provavelmente Lovable/shadcn starter completo). Não remover só por estarem sem uso — deixar disponíveis, mas não presumir que já estão adaptados ao tema até o primeiro uso real. |

**Leitura**: o app usa shadcn/ui como base do *chrome* (header, configurações,
auth), mas as calculadoras — que são 90% da superfície visual do sistema —
não usam nenhum primitivo shadcn, nem para botão, nem para input, nem para
checkbox. É a maior oportunidade de padronização identificada (ver §5, risco
médio, não fazer de uma vez).

## 2. Componentes próprios do ettoprecifica

| Componente | Local | Finalidade | Veredito |
|---|---|---|---|
| `ModernHeader` | `src/components/ModernHeader.tsx` | Header fixo do app (logo, exportar, configurações) | Manter como padrão, mas remover gradientes/backdrop-blur decorativos (ver `DESIGN_SYSTEM.md §6.1`) quando a migração gradual chegar nele. |
| `ModernTabs` | `src/components/ModernTabs.tsx` | Navegação por abas (11 módulos) | Manter estrutura; remover o gradiente de cor único por aba — não tem função semântica. |
| `ModernCalculatorWrapper` | `src/components/ModernCalculatorWrapper.tsx` | Envelope de card + título centralizado de cada calculadora | Manter o `Card`; remover título centralizado + barra decorativa de gradiente (`.gradient-text`/`.gradient-decorator`) — alinhar à esquerda como em `PageHeader` do OrbynAdmin. |
| `CotacaoBar` | `src/components/CotacaoBar.tsx` | Carrinho de cotação (itens de qualquer aba) | Já sóbrio (cinza/branco, sem gradiente). Bom exemplo a seguir. |
| `SettingsPanel` / `SettingsLayout` / `SettingsHeader` | `src/components/SettingsPanel.tsx`, `src/components/settings/*` | Tela de Configurações | Estrutura (nav lateral + card por seção) é boa e deve virar o padrão de "Form Page" (`PAGE_PATTERNS.md`). `SettingsLayout` tem os blobs decorativos animados a remover; `SettingsHeader` tem gradiente no botão Salvar a remover. |
| `ConfigSection` | `src/components/settings/ConfigSection.tsx` | Card de campos de uma seção de config | Título do card em gradiente (`bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text`) e `.card-backdrop` (blur+shadow-2xl) a normalizar. |
| `CustomVariationsManager` | `src/components/settings/CustomVariationsManager.tsx` | CRUD de lista de itens (materiais/tipos) por seção | Único lugar do app que já usa `Dialog`/`AlertDialog` do shadcn — bom modelo a replicar quando outra tela precisar de CRUD com confirmação. |
| `DeslocamentoField` | `src/components/calculators/DeslocamentoField.tsx` | Campo de CEP + deslocamento, compartilhado por 12 calculadoras | Bom exemplo de componente compartilhado que evitou duplicação — mesmo princípio deveria valer para `inputClass`/`btn()` (ver §3). |
| `currency-input` / `number-input` / `percentage-input` | `src/components/ui/*.tsx` | Inputs formatados (moeda/número/percentual) só usados em Configurações | Próprios do projeto, não vieram do shadcn CLI puro — tratar como parte do inventário shadcn local mesmo assim. |

## 3. Duplicação nas calculadoras — **etapa 2 da migração já aplicada (23/09/26)**

Era o achado mais concreto da auditoria: cada calculadora reimplementava
localmente os mesmos três padrões. **Resolvido**: os três viraram
`src/components/calculators/CalcControls.tsx` (`OptionChip`, `CalcCheckbox`,
`selectClass`) + o `Input` do shadcn usado direto. Os 16 arquivos vivos foram
migrados; os componentes mortos (§4) ficaram como estavam, de propósito.

| Padrão antigo | Onde estava | Virou | Ganho |
|---|---|---|---|
| `const inputClass = 'w-full px-4 py-3 …'` | 22 cópias **idênticas** | `Input` do shadcn (sem className) | Campo da calculadora passa a ter a mesma altura/raio do campo de Configurações (`h-10`, `rounded-md`) — antes eram visivelmente diferentes |
| `const btn = (active) => …` | 15 cópias, 2 variantes de cor | `<OptionChip variant="indigo" \| "neutral" active={…}>` | Uma definição só; ganhou `aria-pressed` |
| `<input type="checkbox">` cru | 20 cópias | `<CalcCheckbox>` (usa o `Checkbox` do shadcn/Radix) | Estado/foco acessível de graça; a caixa inteira continua clicável |
| `<select className={inputClass}>` | selects de Vidro/Cavaletes/Letra Caixa/Recorte | `<select className={selectClass}>` | Select alinhado com o Input. **Migrar para o `Select` do shadcn (Radix) é etapa futura** — muda a API e o comportamento do dropdown |

Resultado: **-218 linhas** (183 inseridas, 401 removidas) em 17 arquivos.

**Verificação feita** (não foi só typecheck): preview local sem login
(`dev-preview.html`, gitignorado) + Playwright — as 11 abas renderizam sem erro
de console, checkbox e chip respondem ao clique em todas, e o painel
"Orçamento" inteiro (preço, composição, desconto, unitário) foi capturado
antes e depois da migração em 6 abas × 2 cenários (com/sem nota fiscal): **texto
byte-a-byte idêntico**.

**Bug real que a verificação pegou** (registrado porque a lição vale para a
próxima etapa): o codemod fundiu dois checkboxes num só no
`AdesivoRecorteEngineCalculator` — a caixa "Emitir com nota fiscal" sumiu e a
da máscara ficou com o rótulo errado. Passou pelo `tsc` (JSX válido) e pelo
smoke test das abas (aquele painel só aparece ao escolher "Adesivo Recorte 1/2
Cores", que o teste não selecionava). Foi pego comparando a **contagem de
elementos antes/depois arquivo a arquivo**. Corrigido à mão. Moral: numa
migração em lote, contar elementos antes/depois é mais confiável que confiar em
compilar + abrir a tela principal.

### 3.1 `const btn = (active) => "..."` (chip/botão de seleção) — 15 arquivos

Define uma função idêntica (ou quase) em cada arquivo para estilizar botões
de seleção de tipo/material. Duas variantes já convergidas:
- **Azul** (`bg-blue-50 border-blue-300 text-blue-700` quando ativo) — usada
  nas calculadoras do motor (Fachada antiga, Letra Caixa, Vidro, Luminoso,
  Cavaletes, Laser antiga) e wrappers de tipo (`PlacasCalculator`, `AdesivosCalculator`).
- **Índigo pastel** (`bg-indigo-100 border-indigo-400 text-indigo-800` /
  `bg-indigo-50/60` inativo) — usada nas calculadoras manuais com lista de
  itens (`AdesivoManualCalculator`, `PlacaPSManualCalculator`,
  `PlacaACMManualCalculator`, `FachadaManualCalculator`, `DtfManualCalculator`,
  `LaserManualCalculator`, `LonaCalculator`, `EtiquetasCalculator`).

Arquivos com a função local: `AdesivoManualCalculator`, `AdesivosCalculator`,
`CavaletesCalculator`, `DtfManualCalculator`, `EtiquetasCalculator`,
`FachadaCalculator` (não usado — ver §4), `FachadaManualCalculator`,
`LaserCalculator` (não usado), `LaserManualCalculator`, `LetraCaixaCalculator`,
`LonaCalculator`, `LuminosoCalculator`, `PlacaACMManualCalculator`,
`PlacaPSManualCalculator`, `PlacasCalculator`.

**Candidato natural**: um componente `SelectableChip`/`ChipGroup` (ou
`ToggleGroup` do shadcn, já instalado e nunca usado, estilizado com as duas
variantes de cor acima) em `src/components/calculators/` ou `src/components/ui/`.

### 3.2 `const inputClass = "w-full px-4 py-3 border ..."` — 22 arquivos

Mesma string Tailwind repetida (com pequenas variações) para todo `<input
type="number">`/`<select>` do app. **Candidato natural**: usar o `Input`
shadcn diretamente (ele já centraliza essa classe via `cn()`), com uma
variante local só se o padding maior (`py-3` vs. o `h-10` default do shadcn)
for intencional — hoje não está claro se é intencional ou coincidência de
cópia entre arquivos.

### 3.3 `<input type="checkbox">` cru — 20 arquivos

Toda calculadora com checkbox ("Emitir com nota fiscal", "Incluir
deslocamento", "Incluir máscara", "Iluminada") usa o elemento nativo com
`className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"`
em vez do componente `Checkbox` do shadcn (Radix), que dá foco/estado
acessível de graça e já está instalado sem nenhum uso.

### 3.4 Cor `orange-600` — só em arquivos mortos (§4), não é inconsistência ativa

Apareceu em 6 arquivos, mas todos são componentes do motor **não importados
por nada** (ver §4) — não é um desvio de padrão ativo hoje, só resíduo. Não
precisa de correção; se algum desses arquivos for reativado no futuro,
alinhar para `amber-*` junto (ver `DESIGN_SYSTEM.md §3.2`).

## 4. Componentes "mortos" (existem no repo, não são importados por nada)

Confirmado via `CLAUDE.md` (histórico de migração para preço manual) + leitura
de `Index.tsx`/`AdesivosCalculator.tsx`/`PlacasCalculator.tsx`:

| Arquivo | Por que ficou | Ação |
|---|---|---|
| `FachadaCalculator.tsx` | Versão antiga (motor) da Fachada, substituída por `FachadaManualCalculator` em 21/09/26 | Nenhuma — CLAUDE.md documenta a decisão de manter no repo caso precise reverter. Não usar como referência de padrão novo. |
| `PlacaPSCalculator.tsx`, `PlacaACMCalculator.tsx` | Versões antigas (motor) de Placas, substituídas em 30/07/26 | Idem. |
| `AdesivoImpressoCalculator.tsx`, `AdesivoRecorteCalculator.tsx` | Versões antigas (motor) de Adesivo, parcialmente substituídas (Recorte 1/2 cores voltou ao motor via `AdesivoRecorteEngineCalculator`, um componente novo, não este) | Idem. |
| `DtfCalculator.tsx`, `LaserCalculator.tsx` | Versões antigas (motor), substituídas em 30/07/26 | Idem. |

Nenhum desses arquivos deve ser usado como referência de padrão ao criar algo
novo — são histórico, não exemplo.

## 5. CSS utilitário paralelo (`src/index.css`) — **etapa 1 da migração já aplicada (23/09/26)**

`index.css` tinha uma camada própria de "design tokens" em classes
utilitárias, majoritariamente não usada pelas calculadoras (que preferem
Tailwind cru repetido — ver §3). A etapa 1 da migração gradual (chrome:
`ModernHeader`, `ModernTabs`, `ModernCalculatorWrapper`, `SettingsHeader`,
`SettingsLayout`, `ConfigSection`, `Index.tsx`) já removeu os gradientes,
`backdrop-blur`/sombra pesada em card estático e os blobs animados de fundo
que essas classes serviam, e a limpeza do CSS órfão resultante foi feita
junto (nenhuma tela nova foi tocada além dessas).

| Classe | Estava em uso? | Ação tomada |
|---|---|---|
| `.gradient-text`, `.gradient-decorator` | Só em `ModernCalculatorWrapper` (título centralizado + barra decorativa) | **Removidas do componente e do CSS.** Título agora é `text-gray-900` sólido, alinhado à esquerda. |
| `.card-backdrop` | Só em `ConfigSection` | **Removida do componente e do CSS.** `Card` volta ao padrão shadcn (`shadow-sm`, sem blur). |
| `.text-title` | Sim — é dependência de `.form-label` (`@apply text-title ...`), usado em `BudgetObservationsSettings.tsx` | **Mantida** (não é morta; a auditoria inicial não tinha cruzado a dependência via `@apply`). |
| `.form-label` | Sim — `BudgetObservationsSettings.tsx` (3×) | **Mantida.** |
| `.input-enhanced` | Sim — `BudgetObservationsSettings.tsx` (3×) e `SettingsPanel.tsx` (select mobile) | **Mantida.** |
| `.text-subtitle`, `.text-body`, `.text-caption`, `.form-description`, `.section-header`, `.checkbox-enhanced`, `.separator-enhanced`, `.button-hover-light`, `.currency-value`, `.budget-price` (+ variável `--budget-price`), `.card-elevated`, `.summary-box`, `.bg-subtle`, `.elevation-1/2/3`, `.glass`, `.animate-float`/`.animate-glow` (+ `@keyframes`), `.focus-ring`, `.interactive-hover`, `.interactive-pressed` | Zero uso confirmado em `src/` | **Removidas do `index.css`.** CSS gerado caiu de 76,00kB para 68,70kB de código morto a menos. |

`index.css` hoje só define os tokens do tema (`:root`), o reset base, o
`scrollbar-hide` e as 3 classes acima que sobreviveram por terem consumidor
real. Se precisar de uma dessas variações de texto/card no futuro, adicionar
de volta com um caso de uso concreto, não "para manter simetria" com o que
existia antes.

## 6. Como usar este inventário

- **Antes de criar um componente**: procurar aqui primeiro. Se a linha já
  existe (mesmo "instalado, não usado"), usar aquele componente, não criar um novo.
- **Antes de tocar em uma calculadora existente por outro motivo** (bugfix,
  novo campo): não é o momento de trocar `inputClass`/`btn()` por shadcn "de
  brinde" — isso é refatoração fora do escopo do pedido (ver `CLAUDE.md`,
  regra geral do projeto de não refatorar sem necessidade). Só migrar o
  padrão visual quando for explicitamente essa a tarefa.
- Ao adicionar uma seção nova ao inventário, manter o mesmo formato de tabela
  (Componente | Local/Usos | Onde | Veredito) para o arquivo continuar
  varrível por outro agente.
