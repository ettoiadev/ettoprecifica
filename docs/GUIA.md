# Guia interno — como funciona

Tela acessível pelo botão **Guia** no cabeçalho (ao lado de Configurações).
Reúne os documentos de consulta da empresa: normas, medidas, matéria-prima,
prazos de serviço e o que mais for criado. Cada assunto é uma **aba**, editável
dentro do próprio app.

## Onde o conteúdo fica

Tabela **`guide_sections`** no Supabase (mesmo projeto do resto do app):

| Coluna | Para quê |
|---|---|
| `slug` | identificador estável da aba (não muda ao renomear) |
| `title` | nome que aparece na aba |
| `content` | o texto, livre; quebras de linha são preservadas na exibição |
| `sort_order` | ordem das abas (10, 20, 30… para caber novas no meio) |
| `updated_at` / `updated_by` | quando e por quem foi a última edição |

### Compartilhado, não por vendedor

Diferente de `pricing_configs` e `budget_settings` — que guardam a configuração
**de cada vendedor** — o guia é **um só para a empresa inteira**. O que um
usuário salva, todos passam a ver. É de propósito: norma da empresa não pode
ter uma versão por pessoa.

### Quem pode editar

**Qualquer usuário logado.** O app não tem sistema de papéis (a tabela
`profiles` não tem coluna de role), então não há como restringir a edição ao
dono sem antes introduzir esse conceito. Consequência prática: um vendedor pode
alterar ou apagar o conteúdo — a tela mostra "Atualizado em …" para dar algum
rastro. Se isso virar problema, o caminho é adicionar papéis em `profiles` e
trocar as políticas de `UPDATE`/`DELETE` para exigir `role = 'admin'`.

RLS está **ligada**: só usuário autenticado lê. Pelo anon key puro (sem login)
a consulta volta vazia — então o conteúdo não fica exposto publicamente.

## O que a tela faz

- **Ver**: abas no topo, conteúdo em texto corrido abaixo.
- **Editar**: botão `Editar` → muda o nome da aba e/ou o conteúdo → `Salvar`.
  Enquanto edita, as outras abas ficam bloqueadas, para não perder o rascunho.
- **Nova aba**: cria um assunto novo já em modo de edição.
- **Excluir aba**: dentro do modo de edição, com confirmação (apaga para todos).

O conteúdo é **texto simples**, não Markdown — mas a exibição reconhece três
convenções que as pessoas já usam naturalmente ao escrever documento em texto
puro, para o resultado não virar um paredão cinza (`guiaParser.ts`):

| O que você escreve | Como aparece |
|---|---|
| `## Título` **ou** uma linha curta QUASE TODA EM MAIÚSCULAS | Título de seção, com régua embaixo e entrada no índice lateral |
| 2+ linhas seguidas com colunas separadas por 2 ou mais espaços | Bloco monoespaçado — é o único jeito de o alinhamento por espaço funcionar de verdade |
| `#chapa: 200x100 peça 60x40 — rótulo` | Desenho vetorial da chapa (ver abaixo) |
| Qualquer outra coisa | Parágrafo, com as quebras de linha preservadas |

A regra do título por maiúsculas é: linha de até 70 caracteres, sem pontuação
final, com pelo menos 80% das letras maiúsculas. Isso pega
`PLACA PS 2mm — APROVEITAMENTO DA CHAPA` (que tem "mm" minúsculo) sem pegar
frase comum que começa com sigla, como
`A CONFIRMAR: a espessura do ACM Madeira está cadastrada…`.

Continua **não** havendo renderizador de Markdown: nada de negrito, link ou
tabela de verdade, e nenhuma dependência nova — o parser são ~100 linhas
próprias e, acima de tudo, **nada vira HTML** (ver "Por que não aceitamos HTML"
abaixo). Se um dia precisar de formatação rica, aí sim vale reavaliar.

## Por que não aceitamos HTML nem SVG colado

Qualquer usuário logado edita o guia e o conteúdo é compartilhado. Se a tela
renderizasse o campo como HTML, uma pessoa conseguiria injetar script que roda
na sessão de todas as outras — XSS armazenado. Por isso o texto é sempre
exibido como texto, e o único recurso "gráfico" (`#chapa:`) é um desenho que o
**app gera a partir de números**, não marcação que o usuário escreve.

## Desenho de chapa (`#chapa:`)

Única exceção ao texto puro. Uma linha que comece com `#chapa:` vira um
**desenho vetorial (SVG)** da chapa, com cotas e aproveitamento:

```
#chapa: 200x100
#chapa: 200x100 peça 60x40
#chapa: 200x100 peça 60x40 — Placa PS 2mm
```

- Medidas em **centímetros**; o primeiro par é a chapa, o segundo (opcional) é
  a peça a cortar; o texto após `—` é um rótulo opcional.
- O desenho é gerado pelo app a partir dos números — o texto do guia **nunca**
  é interpretado como HTML/SVG, então não há como injetar marcação pelo campo
  editável. É por isso que existe essa sintaxe em vez de deixar colar SVG.
- A chapa é sempre desenhada com o lado maior na horizontal.
- O aproveitamento mostrado é o **simples**: todas as peças na mesma
  orientação, testando as duas rotações possíveis e escolhendo a que rende
  mais. Não é um otimizador de corte — serve como referência rápida de quantas
  peças saem de uma chapa, não como plano de corte definitivo.

Componentes: `GuiaConteudo.tsx` (separa texto de desenho) e
`ChapaDiagrama.tsx` (gera o SVG).

## Componentes

`src/components/guia/GuiaPanel.tsx` + `src/services/supabase/guideService.ts`.
Usa `Tabs`, `Button`, `Input`, `Textarea` e `AlertDialog` do shadcn/ui — nenhum
componente visual novo foi criado (`docs/UI_COMPONENT_INVENTORY.md`).

## Para carregar um documento grande

Abrir a aba → `Editar` → colar o texto → `Salvar`. É o caminho normal; não
existe importação de arquivo (e não precisa: colar resolve).
