# ettoprecifica — contexto do projeto

> **REGRA PARA TODO CHAT NOVO (leia antes de agir):**
> 1. Leia o índice de memória em `C:\Users\ettop\.claude\projects\d--APLICACAO-ettoprecifica-ettoprecifica\memory\MEMORY.md` e as memórias relevantes que ele aponta.
> 2. Leia este arquivo (estado atual da aplicação) por inteiro.
> 3. **Antes de ligar/alterar qualquer cálculo, verifique o contrato real da função no banco da skill** (assinatura de argumentos + colunas de retorno). A skill muda contratos sem aviso — foi a causa de todos os bugs de R$0 e de "function is not unique". Nunca chute assinatura.
> 4. **Priorize a skill**: antes de criar qualquer objeto no banco ou calcular preço no app, cheque se a skill já tem a função/dado. O app só **consome**, nunca escreve preço.

## O que é
SPA React de precificação usada por vendedores de uma empresa de comunicação visual. Cada aba é uma calculadora de um produto. **Todo preço vem do "motor" da skill orcamentista-cv** (funções `calc_*` no banco Supabase `tabelapreco`, ref `ghyctsclpcsrznrqegrp`), consumido via **Edge Functions read-only**. Não há mais precificação local.

## Stack e build
- React 18.3 + TypeScript 5.5 + Vite 5.4 (SWC — **não faz typecheck no build**).
- Tailwind + shadcn/ui, lucide-react, react-router-dom, sonner (toast), CotacaoContext (carrinho de cotação).
- **Sempre rodar os dois separados** antes de commitar:
  - `./node_modules/.bin/tsc --noEmit` (typecheck)
  - `./node_modules/.bin/vite build` (esbuild é mais estrito que tsc; ex.: rejeita `??` misturado com `||` sem parênteses)
- Commit: `git add src supabase` (NÃO `-A` — evita pegar temporários). Mensagens terminam com `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>`. Push em `main` quando o usuário pedir (ele já autorizou "sempre faça o push" para esses ajustes).

## Arquitetura de preço
- Tabelas/funções da skill têm **RLS ligado e 0 policies** (trancadas de propósito). O app não acessa direto.
- **Edge Functions** (`supabase/functions/calc-*`) usam `SUPABASE_SERVICE_ROLE_KEY` interno para bypassar RLS e chamar `calc_*`. São `verify_jwt=true`, CORS, **somente leitura**. `action:'meta'`/`'materiais'`/`'cidades'` servem os dropdowns.
- O app chama via `supabase.functions.invoke('calc-xxx', { body })`.
- A NF (×1,0931) já vem embutida em `preco_com_nota`; o deslocamento vem de `deslocamento_cidades`. **Não** re-aplicar taxas no app.

## Abas → Edge Function → função da skill (14 abas, todas no motor)
| Aba | Edge Function | Função |
|---|---|---|
| Adesivo (impresso) | calc-adesivo-impresso | `calc_adesivo_impresso` |
| Recorte | calc-adesivo-recorte | `calc_adesivo_recorte` |
| Lona | calc-lona | `calc_lona` |
| Placa PS | calc-ps | `calc_ps_adesivado` |
| Placa ACM | calc-placa-acm | `calc_placa_acm` |
| Fachada | calc-fachada | `calc_fachada_acm` / `calc_fachada_lona` |
| Letra Caixa | calc-letra-caixa | `calc_letra_caixa` |
| Vidro | calc-vidro | `calc_vidro` |
| Luminoso | calc-luminoso | `calc_luminoso` |
| Laser | calc-laser | `calc_laser` |
| DTF | calc-dtf | `calc_dtf` |
| Etiquetas | calc-etiquetas | `calc_etiquetas` |
| Gráfica (GIV) | calc-giv | `calc_giv` |
| Cavaletes | calc-cavaletes | `calc_cavaletes` / `calc_cavaletes_madeira` |

## Gotchas / padrões (aprendidos na marra)
1. **Overloads ambíguos** ("function is not unique"): quando a skill adiciona um parâmetro novo, cria um 2º overload e a chamada antiga fica ambígua → Edge Function retorna non-2xx. **Sempre passar o parâmetro novo** para desambiguar. Hoje têm 2 overloads (todos já tratados): `calc_dtf` (passar `p_incluir_uber`), `calc_letra_caixa` (`p_tipo_iluminacao`), `calc_lona` (`p_laca_uv`), `calc_adesivo_impresso` (`p_laca_uv`).
2. **Quantidade + mínimo de projeto**: NÃO reconstruir por unidade (`preco_final × qtd` cobra o mínimo por peça). Enviar a **área agregada** (área unitária × qtd) como `largura = area_total, altura = 1`; o motor aplica mínimo/deslocamento uma vez. Aplicado em Adesivo, Lona, Placa ACM, Placa PS, Recorte. Laser aplica o mínimo ao pedido (`max(varUnit*qtd+desloc, minimo)`); Vidro não tem mínimo.
3. Abas são **self-contained** (sem o antigo `BudgetSummaryExtended`, já removido). Estado + cotação + copiar orçamento em cada componente.
4. Configurações só tem "Geral" (status do banco + observações). Nenhum preço é editável no app.

## Como verificar o banco da skill
O MCP Supabase do claude.ai às vezes cai. Alternativa: API de Management com um Personal Access Token do Supabase:
```
curl -s -X POST "https://api.supabase.com/v1/projects/ghyctsclpcsrznrqegrp/database/query" \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d @payload.json   # {"query":"SELECT ..."}
```
Deploy de Edge Function: `POST .../v1/projects/<ref>/functions/deploy?slug=<slug>` com `-F metadata=...;type=application/json -F file=@index.ts`. **Nunca** salvar o token; pedir para revogar após uso.

## Estado atual (2026-07-18)
Todas as 14 abas ligadas e funcionando. Últimas correções: laca UV (Lona/Adesivo via `p_laca_uv`), erro non-2xx do Adesivo (ambiguidade), e o mínimo-por-unidade (Adesivo/Lona/ACM/PS). Sem pendências de bug conhecidas. Pendência do lado da skill: `acm_placa_opcoes` só tem espessura 3mm e `calc_placa_acm` só aceita `p_acabamento='sem_impressao'` — se venderem outras espessuras/impressão, pedir à skill para completar.
