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
| `button` | 5 | `ModernHeader`, `SettingsHeader`, `Auth`, `ProtectedRoute`, `CustomVariationsManager` | **Usar sempre** para botões fora das calculadoras. Calculadoras usam `<button>` cru — ver §3. |
| `input` | 3 | `SettingsHeader` (busca), `Auth`, `CustomVariationsManager` | Idem — calculadoras usam `<input>` cru com classe local. |
| `card` | 4 | `ModernCalculatorWrapper`, `ConfigSection`, OrbynAdmin-style summary (nenhum hoje) | Base de painéis fora das calculadoras. |
| `label` | 3 | `CustomVariationsManager`, formulários de auth | — |
| `currency-input` | 1 | `ConfigSection` | Componente próprio do projeto (não é do shadcn puro), ver §2. |
| `number-input` | 1 | `ConfigSection` | Idem. |
| `percentage-input` | 1 | `ConfigSection` | Idem. |
| `dialog` | 1 | `CustomVariationsManager` (form de adicionar/editar item) | — |
| `alert-dialog` | 1 | `CustomVariationsManager` (confirmar exclusão) | — |
| `checkbox` | **0** | — | **Instalado e nunca usado.** Todas as calculadoras usam `<input type="checkbox">` cru + classe local. Ver §3. |
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

## 3. Duplicação encontrada nas calculadoras (`src/components/calculators/`)

Este é o achado mais concreto da auditoria: cada calculadora reimplementa
localmente os mesmos três padrões, em vez de importar um componente
compartilhado.

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

## 5. CSS utilitário paralelo (`src/index.css`)

`index.css` define uma camada própria de "design tokens" em classes
utilitárias (`@layer utilities`/`@layer base`), majoritariamente **não usada**
pelas calculadoras (que preferem Tailwind cru repetido — ver §3):

| Classe | Definição | Uso real | Veredito |
|---|---|---|---|
| `.gradient-text` | Texto em gradiente azul→roxo | `ModernCalculatorWrapper` (título de cada calculadora, centralizado) | Remover do uso ativo na migração gradual — título vira `text-gray-900` sólido (`DESIGN_SYSTEM.md §6.1`). |
| `.gradient-decorator` | Barra de gradiente azul→roxo | `ModernCalculatorWrapper` (decoração sob o título) | Remover. |
| `.card-backdrop` | `bg-card/80 backdrop-blur-xl ... shadow-xl hover:shadow-2xl` | `ConfigSection` | Trocar por `Card` padrão (`shadow-sm`, sem blur) na migração gradual. |
| `.text-title` / `.text-subtitle` / `.text-body` / `.text-caption` | Hierarquia de texto genérica | **Não encontrado em uso fora de `index.css`** | Camada paralela à tabela de tipografia real (`DESIGN_SYSTEM.md §4`, que documenta o padrão que as calculadoras já seguem de fato). Não usar nenhuma das duas onde já existe a outra — decidir qual fica é trabalho da migração gradual, não desta etapa. |
| `.form-label`, `.form-description`, `.section-header` | Idem, específicas de formulário | Não encontrado em uso | Idem. |
| `.input-enhanced`, `.checkbox-enhanced`, `.separator-enhanced`, `.button-hover-light` | Estilos "enhanced" de form | Não encontrado em uso | Idem. |
| `.currency-value`, `.budget-price` | Cor azul fixa `rgb(0, 102, 229)` para valores monetários | Não encontrado em uso fora de `index.css` — as calculadoras usam `text-blue-600`/`text-primary` direto | Redundante com `--primary`. Considerar remover na limpeza. |
| `.card-elevated`, `.summary-box`, `.bg-subtle` | Variações de card/fundo | Não encontrado em uso | Idem. |
| `.elevation-1/2/3` | Sombras com tinta azul, intensidade crescente | Não encontrado em uso fora de `.card-elevated` (também não usada) | Candidato a remoção — nenhuma calculadora usa. |
| `.glass` | Glassmorphism (`bg-white/20 backdrop-blur-xl`) | **Zero uso em todo o `src/`** | CSS morto — remover na limpeza (nunca usar em telas novas, mesmo antes de remover). |
| `.animate-float`, `.animate-glow` (+ `@keyframes float`, `@keyframes glow`) | Animações decorativas | **Zero uso em todo o `src/`** | CSS morto — remover. |
| `.focus-ring`, `.interactive-hover`, `.interactive-pressed` | Utilitários de interação | Não encontrado em uso | Candidatos a remoção ou a adoção real — decidir na migração gradual, não agora. |

Diagnóstico: existe uma tentativa anterior de sistema de design em CSS puro
(provavelmente do scaffold inicial) que nunca foi de fato adotada pelo código
que veio depois. Os arquivos `docs/DESIGN_SYSTEM.md` etc. desta entrega
substituem essa tentativa como fonte da verdade — a limpeza do CSS morto é
trabalho da migração gradual, não desta etapa (ver relatório de auditoria).

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
