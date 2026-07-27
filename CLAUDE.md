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
- A NF (×1,0931) já vem embutida em `preco_com_nota`. **Não** re-aplicar taxas no app.
- **Deslocamento (26/07/26 em diante): opcional, não mais por cidade.** `deslocamento_cidades` está **obsoleta** (todas as linhas `ativo=false`) — nenhuma `calc_*` a lê mais. 12 das 14 funções trocaram `p_cidade` por `p_custo_deslocamento numeric DEFAULT 0` + `p_incluir_deslocamento boolean DEFAULT false`: o app manda um checkbox "Incluir deslocamento" (desmarcado por padrão) + valor manual em R$; a função só soma ao preço final quando `p_incluir_deslocamento=true`. `calc_letra_caixa` e `calc_ps_adesivado` ainda usam `p_cidade` (não migradas, mas essas duas nunca dependeram de fato de `deslocamento_cidades` — `p_cidade` é vestigial nelas). Existe uma função nova `calc_deslocamento(p_distancia_km, ...)` que calcula o custo a partir de km — mas a integração da API de rota (CEP→CEP) que forneceria essa distância é trabalho do **Devin**, ainda pendente; até lá o valor de deslocamento é sempre digitado manualmente pelo vendedor.

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
1. **Overloads ambíguos** ("function is not unique"): quando a skill adiciona um parâmetro novo, cria um 2º overload e a chamada antiga fica ambígua → Edge Function retorna non-2xx. **Sempre passar o parâmetro novo** para desambiguar. Hoje têm 2 overloads (todos já tratados): `calc_dtf` (passar `p_incluir_uber`), `calc_lona` (`p_laca_uv`), `calc_adesivo_impresso` (`p_laca_uv`).
1b. **Parâmetro removido é pior que overload** (26/07/26): a skill trocou `p_cidade` por `p_custo_deslocamento`/`p_incluir_deslocamento` em 12 funções **sem manter overload de compatibilidade** — não virou ambiguidade, virou `function does not exist` (erro 42883), quebrando a precificação em produção até o app ser atualizado. Sempre que a skill mexer num parâmetro, testar a chamada real via SQL (`SELECT * FROM calc_x(...)`) antes de assumir que só "ganhou um novo overload".
2. **Quantidade + mínimo de projeto**: NÃO reconstruir por unidade (`preco_final × qtd` cobra o mínimo por peça). Enviar a **área agregada** (área unitária × qtd) como `largura = area_total, altura = 1`; o motor aplica mínimo/deslocamento uma vez. Aplicado em Adesivo, Lona, Placa ACM, Placa PS, Recorte. Laser aplica o mínimo ao pedido (`max(varUnit*qtd+desloc, minimo)`); Vidro não tem mínimo.
3. Abas são **self-contained** (sem o antigo `BudgetSummaryExtended`, já removido). Estado + cotação + copiar orçamento em cada componente.
4. Configurações só tem "Geral" (status do banco + observações). Nenhum preço é editável no app.
5. **Tabela e função com o mesmo nome não é bug, é convenção do banco**: `calc_lona` (tabela) + `calc_lona(...)` (função), `calc_placa_acm`, `calc_vidro`, `calc_dtf`, `calc_deslocamento` etc. — Postgres separa `pg_class`/`pg_proc`, sem conflito. Não estranhar nem "corrigir" isso ao ver os dois com o mesmo nome no schema.
6. **Geocodificação de endereço brasileiro: nunca usar o geocoder da OpenRouteService (Pelias) para CEP→coordenadas** — em teste real ele errou a cidade (endereços de Jacareí caíram em Conchal/Avaré, a centenas de km). Usar Nominatim (OpenStreetMap) com fallback logradouro+bairro → bairro → cidade; a ORS serve bem para a parte de rota/distância (`driving-car`), só não para geocode. Ver `calc-deslocamento-cep`.

## Como verificar o banco da skill
O MCP Supabase do claude.ai às vezes cai. Alternativa: API de Management com um Personal Access Token do Supabase:
```
curl -s -X POST "https://api.supabase.com/v1/projects/ghyctsclpcsrznrqegrp/database/query" \
  -H "Authorization: Bearer <TOKEN>" -H "Content-Type: application/json" \
  -d @payload.json   # {"query":"SELECT ..."}
```
Deploy de Edge Function: `POST .../v1/projects/<ref>/functions/deploy?slug=<slug>` com `-F metadata=...;type=application/json -F file=@index.ts`. **Nunca** salvar o token; pedir para revogar após uso.

## Estado atual (2026-07-27)
**Migração de deslocamento concluída no app** (skill já tinha mudado o contrato — ver gotcha 1b): as 12 Edge Functions afetadas (`calc-adesivo-impresso`, `calc-adesivo-recorte`, `calc-cavaletes`, `calc-dtf`, `calc-etiquetas`, `calc-fachada`, `calc-giv`, `calc-laser`, `calc-lona`, `calc-luminoso`, `calc-placa-acm`, `calc-vidro`) foram atualizadas e **deployadas** (Management API, já que o MCP Supabase estava fora do ar) pra usar `p_custo_deslocamento`/`p_incluir_deslocamento` em vez de `p_cidade`. Cada calculadora trocou o dropdown de cidade por um checkbox "Incluir deslocamento" (off por padrão) + input de valor manual em R$. `tsc --noEmit` e `vite build` limpos, commitado e pushado (`c52d6c4`).

**Deslocamento por CEP implementado (27/07/26)**: em vez de esperar o Devin, o próprio app passou a fazer a integração CEP→km→R$. Nova Edge Function **`calc-deslocamento-cep`** (`supabase/functions/calc-deslocamento-cep/index.ts`), deployada e ao vivo:
- **Request**: `{ cep_destino, tempo_instalacao_horas?, qtd_funcionarios? }`.
- Lê o CEP de origem da loja em `select cep_origem_loja from calc_deslocamento where ativo=true limit 1` (hoje `12321-150`, Jacareí).
- **Geocodificação via Nominatim (OpenStreetMap)**, não OpenRouteService: em teste real o geocoder da ORS (Pelias) **errou a cidade** para endereços de Jacareí (devolveu Conchal/Avaré, a centenas de km) — usar Pelias/ORS para geocode é uma armadilha conhecida agora. Nominatim com fallback logradouro+bairro → bairro → cidade deu resultado correto; usa `User-Agent` próprio e sem key.
- **Distância/rota via OpenRouteService** (`driving-car`), key do usuário guardada como secret `ORS_API_KEY` (Supabase, `supabase secrets set` via Management API — nunca no código).
- Chama `calc_deslocamento(p_distancia_km, p_tempo_instalacao_horas, p_qtd_funcionarios, p_cidade_destino)` — **retorno real** (confirmado por SQL): `TABLE(trecho, distancia_ida_km, distancia_total_km, taxa_km_aplicada, custo_km, velocidade_media_kmh, tempo_viagem_horas, horas_excedentes, qtd_funcionarios, custo_mao_obra_excedente, tempo_total_horas, custo_alimentacao, custo_calculado_km, cidade_destino_informada, piso_cidade_aplicado, custo_deslocamento_total, alerta)`. Note: **`custo_deslocamento_total`**, não `custo_deslocamento`; a função já dobra a distância internamente para ida+volta — o app manda só a distância de ida.
- Testado ponta a ponta: Jacareí→Jacareí (~4,86km) → R$8,18; Jacareí→Av. Paulista/SP (~82,77km) → trecho "estrada", R$133,54 com hora extra de mão de obra. CEP inexistente → 400 com mensagem clara.

**Piso mínimo por cidade (27/07/26, adicionado pela skill depois do deploy inicial)**: nova tabela `deslocamento_minimos_cidade` (`cidade`, `valor_minimo`, `ativo`) — hoje Jacareí R$80, São José dos Campos R$150. `calc_deslocamento` ganhou o parâmetro `p_cidade_destino text DEFAULT NULL` (mesma função, sem overload — não ambíguo) que, se informado, aplica esse piso quando o cálculo por km fica abaixo dele. **Bug real encontrado e corrigido**: o primeiro deploy de `calc-deslocamento-cep` não passava `p_cidade_destino`, então cobrava só o km puro e ignorava o piso (Jacareí saía R$6,83 em vez de R$80). Corrigido passando `enderecoDestino.localidade` (já resolvido via ViaCEP) como `p_cidade_destino`. O piso aplicado (se houver) aparece pro vendedor no `DeslocamentoField` ("piso mínimo de R$X aplicado para <cidade>"). **Lição**: sempre que a skill mexer num parâmetro de função já em uso, reconferir via SQL antes de assumir que o código antigo continua correto — não é só na primeira integração que isso quebra.

**Lado do app**: hook `src/hooks/useDeslocamentoCep.ts` (debounce 600ms, chama `calc-deslocamento-cep` quando o CEP tem 8 dígitos) + componente `src/components/calculators/DeslocamentoField.tsx` (checkbox "Incluir deslocamento" opt-in + campo de CEP + tempo estimado de instalação + valor em R$ pré-preenchido, mas **ainda editável** pelo vendedor) — compartilhados pelas 12 calculadoras (evita duplicar a lógica 12×). Cada calculadora só faz `const deslocamento = useDeslocamentoCep()` e usa `deslocamento.custoDeslocamento`/`incluirDeslocamento` onde antes usava o state local.

`calc_letra_caixa` e `calc_ps_adesivado` não foram tocadas (ainda usam `p_cidade`, que é vestigial nelas — nunca dependeram de `deslocamento_cidades` de fato) — não têm o campo de CEP.

`calc_letra_caixa` e `calc_ps_adesivado` não foram tocadas (ainda usam `p_cidade`, que é vestigial nelas — nunca dependeram de `deslocamento_cidades` de fato).

**Materiais novos de Adesivo confirmados na skill (27/07/26) — sem necessidade de mudança no app**: os 5 itens pedidos (Corte Especial R$100/m², Imantado R$350/m², Refletivo R$300/m², Adesivo Jateado R$150/m², Adesivo Blackout R$120/m²) estão ativos e testados via SQL direto:
- `corte_especial`, `imantado`, `blackout` → tabela `adesivo_impresso_opcoes` (consumidos por `calc_adesivo_impresso`).
- `Refletivo Shop Vinil 1,22m`, `Jateado Shop Vinil 1,22m` → tabela `adesivo_recorte_materiais`, campo `preco_mercado_m2` (consumidos por `calc_adesivo_recorte`, `motor_usado: "mercado (motor 1)"`).
- Ambas Edge Functions (`calc-adesivo-impresso`, `calc-adesivo-recorte`) já servem essas listas **dinamicamente** via `action:'meta'`/`'materiais'` (SELECT `WHERE ativo=true`) e os componentes React já renderizam o dropdown a partir dessa resposta — **por isso nenhum código precisou mudar**, a skill alimenta o app automaticamente.
- **Nota**: "Adesivo Perfurado" existe (R$150/m², decisão final do Étto "sem distinção de tier" registrada na observação da linha) mas não há um item separado "Microperfurado" — se isso ainda for necessário como produto distinto, precisa ser pedido de novo à skill.

Sem pendências de bug conhecidas além da integração de rota acima.
