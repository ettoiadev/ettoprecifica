# ettoprecifica — contexto do projeto

> **REGRA PARA TODO CHAT NOVO (leia antes de agir):**
> 1. Leia o índice de memória em `C:\Users\ettop\.claude\projects\d--APLICACAO-ettoprecifica-ettoprecifica\memory\MEMORY.md` e as memórias relevantes que ele aponta.
> 2. Leia este arquivo (estado atual da aplicação) por inteiro.
> 3. **Antes de ligar/alterar qualquer cálculo, verifique o contrato real da função no banco da skill** (assinatura de argumentos + colunas de retorno). A skill muda contratos sem aviso — foi a causa de todos os bugs de R$0 e de "function is not unique". Nunca chute assinatura.
> 4. **Priorize a skill**: antes de criar qualquer objeto no banco ou calcular preço no app, cheque se a skill já tem a função/dado. O app só **consome**, nunca escreve preço.

## O que é
SPA React de precificação usada por vendedores de uma empresa de comunicação visual. Cada aba é uma calculadora de um produto. **Quase todo preço vem do "motor" da skill orcamentista-cv** (funções `calc_*` no banco Supabase `tabelapreco`, ref `ghyctsclpcsrznrqegrp`), consumido via **Edge Functions read-only**. **Exceções (29–30/07/26): as abas Lona, Adesivos, Placas (PS + ACM) e Laser voltaram a ter preço MANUAL, editável em Configurações** — ver "Estado atual". Fora dessas, não há precificação local.

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

## Abas → Edge Function → função da skill (10 abas visíveis no menu; 14 funções continuam ativas na skill)
| Aba | Edge Function | Função |
|---|---|---|
| Adesivos (manual) + Etiquetas (motor), ver abaixo | **(Adesivos: preço manual local)** / calc-etiquetas | ~~`calc_adesivo_impresso`/`calc_adesivo_recorte`~~ (intactas, não chamadas) / `calc_etiquetas` |
| Lona | **(preço manual local — não usa Edge Function)** | ~~`calc_lona`~~ (intacta na skill, mas não é mais chamada) |
| Placas (PS + ACM, ver abaixo) | **(preço manual local — não usa Edge Function)** | ~~`calc_ps_adesivado`/`calc_placa_acm`~~ (intactas, não chamadas) |
| Fachada | calc-fachada | `calc_fachada_acm` / `calc_fachada_lona` |
| Letra Caixa | calc-letra-caixa | `calc_letra_caixa` |
| Vidro | calc-vidro | `calc_vidro` |
| Luminoso | calc-luminoso | `calc_luminoso` |
| Laser | **(preço manual local — não usa Edge Function)** | ~~`calc_laser`~~ (intacta, não chamada) |
| DTF | calc-dtf | `calc_dtf` |
| Cavaletes | calc-cavaletes | `calc_cavaletes` / `calc_cavaletes_madeira` |

**Padrão de abas unificadas por wrapper fino** (27/07/26): quando produtos afins tinham abas separadas, a solução foi um componente wrapper com seletor de tipo no topo que renderiza o componente original por baixo, sem tocar na lógica de cálculo de nenhum:
- **Placas** = Placa PS + Placa ACM → `PlacasCalculator.tsx` renderiza `PlacaPSManualCalculator`/`PlacaACMManualCalculator` (preço manual, ver "Estado atual"). Os componentes antigos `PlacaPSCalculator`/`PlacaACMCalculator` (motor) ficaram no repo mas não são mais importados.
- **Adesivos** = Adesivos (manual) + Etiquetas → `AdesivosCalculator.tsx` renderiza `AdesivoManualCalculator` (preço manual, ver "Estado atual") e `EtiquetasCalculator` (motor). Antes eram 3 sub-abas pelo motor (`AdesivoImpressoCalculator`/`AdesivoRecorteCalculator`/`EtiquetasCalculator`); Impresso+Recorte viraram a lista manual, os dois componentes antigos ficaram no repo mas não são mais importados.

Cada um continua chamando sua própria Edge Function como sempre — nenhuma mudança na skill foi necessária pra nenhuma dessas fusões.

**Gráfica (GIV) foi removida do menu** (27/07/26, a pedido do usuário): `GivCalculator.tsx` foi deletado, e o menu/rota removidos de `ModernTabs.tsx`/`Index.tsx`. A Edge Function `calc-giv` e a função `calc_giv` na skill **não foram tocadas** — só o acesso pelo app foi retirado. Se precisar reativar, é só recriar o componente (padrão idêntico aos outros) e religar no menu; a função do motor continua funcionando.

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

## Lona, Adesivos, Placas e Laser voltaram a ter preço MANUAL (29–30/07/26) — quebram o padrão "app só consome"
A pedido do Étto, as **abas Lona, Adesivos, Placas (PS + ACM) e Laser deixaram de usar o motor da skill** e passaram a ser precificadas localmente, com preços editáveis em **Configurações > Produtos** (ele quer controlar o m² na mão). São as **únicas** exceções ao "todo preço vem da skill" — todo o resto continua no motor. Todas seguem exatamente o mesmo padrão (schema em `pricing.ts` → calculadora recebe `config` via `Index.tsx` → seção em `settingsConfig.ts` → percentual de NF tratado em `ConfigSection.tsx`/`configUtils.ts`, hoje genérico: qualquer campo `notaFiscalPercentual` é % → seção removida de `productOptions.ts` → materiais em botões pastel índigo).

**Laser** (30/07/26): `LaserManualCalculator` substitui o `LaserCalculator` (motor). A pedido do Étto, **simplificado como os demais** — os recursos que só o Laser tinha (forma retangular/circular com perda de chapa, multiplicador de complexidade, LED) **foram removidos**; ficou material (botões pastel agrupados por categoria) + medidas + qtd + deslocamento, preço = área × R$/m². **Lista curada** (só os materiais dos prints do Étto — 14 de 32 ativos), preços de venda/m² reais lidos da `laser_materiais.preco_venda_m2`: Acrílico Colorido 3mm 390 · Cristal 2/3/5/8/10mm 380/430/600/980/1250 · Espelhado Dourado 2mm 590 / Prata 2mm 540 / Rosé 2mm 590 · MDF 3/6/9mm 260/380/520 · PS Cristal 2/3mm 380/490. NF 9,31%. `calc_laser`/`calc-laser` intactos, não chamados. Adicionar material = campo em config+default+settingsConfig+array `opcoes` (com `categoria`) do `LaserManualCalculator`.

**Placas** (30/07/26): a aba continua wrapper de 2 sub-tipos — **Placa PS** (`PlacaPSManualCalculator`, sem deslocamento) e **Placa ACM** (`PlacaACMManualCalculator`, com deslocamento por CEP). Preços padrão = **os preços de venda/m² reais que estavam no motor** (lidos via SQL com PAT temporário do Étto): PS `ps_placas_materiais.preco_mercado_m2` → Branco 1mm 180 / 2mm 220 / 3mm 250, Cristal 1,5mm 290 / 2mm 330 / 3mm 390; ACM via `calc_placa_acm(...,'com_adesivo',3,...)` = **R$280/m²** para qualquer espessura (o motor sempre resolve "ACM Branco Brilho 3mm" — 2/3/4/6mm todos caem em 280). Como o motor não diferencia material de ACM, semeei **Madeira 3mm também em 280** (o Étto pode subir, já que o custo da chapa madeira é bem maior — 96,72 vs 63,93). NF por **percentual único = 9,31%** (a NF do motor era ×1,0931, confirmado nos dois: 280→306,07 e 180→196,76). `PlacaPSConfig`/`PlacaACMConfig` reescritas; `calc_ps_adesivado`/`calc_placa_acm`/`calc-ps`/`calc-placa-acm` **intactos, só não são mais chamados**. Se pedir mais espessuras/materiais: campo em config+default+settingsConfig+array `opcoes` do respectivo calculator.

**Adesivos:**

**Adesivos** (mesma decisão que a Lona, feita depois): a aba virou wrapper de 2 sub-tipos — **"Adesivos"** (`AdesivoManualCalculator`, preço manual) + **"Etiquetas"** (`EtiquetasCalculator`, ainda no motor, intacto). `AdesivoConfig` reescrita com 9 tipos da planilha (`digital` 100, `digitalPeliculaTransparente` 150, `transparente` 120, `perfurado` 200, `recorte1Cor` 250, `recorte2Cores` 380, `jateado` 150, `blackout` 130, `translucido` 130) + `notaFiscalPercentual` (20). **Sem laca** (não estava na planilha de adesivo). NF por **percentual único** (a NF da planilha varia 12–25%, não bate com % único — o Étto aceitou a troca). Deslocamento como custo de repasse (sem NF), via CEP. `calc-adesivo-impresso`/`calc-adesivo-recorte`/`calc_adesivo_impresso`/`calc_adesivo_recorte` **intactos, só não são mais chamados**. Se pedir mais tipos: campo em `AdesivoConfig`+`defaultConfig`+`settingsConfig`+array `opcoes` do `AdesivoManualCalculator`.

**Lona:**
- **Schema** (`src/types/pricing.ts`): `LonaConfig` reescrita para 4 acabamentos fixos + laca + NF %: `bannerSemAcabamento` (100), `reforcoIlhos` (130), `lonaGrande` (150), `lonaTranslucida` (130), `lacaProtecaoM2` (30, adicional opcional por m²), `notaFiscalPercentual` (20). Defaults da planilha do Étto; ele ajusta em Configurações.
- **Cálculo** (`LonaCalculator.tsx`, agora recebe `config: LonaConfig` via `Index.tsx`): `semNota = (precoM² + laca?×lacaM²) × área × qtd + deslocamento`; `comNota = produto × (1 + NF%/100) + deslocamento`. Escolha entre **percentual único de NF** (não valor por linha) e **laca por m²** foi decisão explícita do usuário. O **deslocamento é somado como custo de repasse (sem incidir NF)** e continua vindo do fluxo por CEP (`useDeslocamentoCep`/`DeslocamentoField`) — "mantenha o deslocamento como está".
- **Configurações**: `settingsConfig.ts` ganhou a seção `lona`; `SettingsPanel.tsx` mostra o grupo "Produtos" → Lona (default ao abrir). `lona.notaFiscalPercentual` foi ensinado como campo de porcentagem em `ConfigSection.tsx` e `configUtils.ts` (senão viraria moeda).
- **`productOptions.ts`**: `lona` removida de `OptionListSection`/`SECTION_OPTIONS` (não é mais lista CRUD semeada; são 4 campos fixos editáveis). Configs salvas antigas com `lona.variations`/chaves velhas não quebram (deep-merge preserva; calculadora lê só as chaves novas, que vêm do default).
- **Skill intacta**: `calc-lona`/`calc_lona` **não foram tocadas**, só deixaram de ser chamadas (mesmo padrão do GIV). Reverter = repassar preço da skill de novo.
- Se o Étto pedir mais acabamentos de Lona, é adicionar campo em `LonaConfig`+`defaultConfig`+`settingsConfig`+array `opcoes` do `LonaCalculator` (4 lugares) — não é lista dinâmica.

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

**Bug real encontrado e corrigido: Placa ACM ficou sem preço nenhum depois de uma melhoria da skill (28/07/26)**. A skill renomeou as colunas de retorno de `calc_placa_acm` (`preco_sem_nota_60`/`preco_com_nota_60`/`custo_total` → `preco_final`/`preco_com_nota`/`custo_total_motor2`, + campo novo `motor_usado`) e trocou o default de `p_acabamento` pra `'com_adesivo'`. A Edge Function `calc-placa-acm` continuava mandando `p_acabamento:"sem_impressao"` e o componente continuava lendo os nomes antigos — a chamada RPC nunca dava erro (por isso passou despercebido), só que os campos lidos pelo app não existiam mais na resposta, então a aba nunca mostrava preço nenhum, silenciosamente, pra qualquer entrada. Corrigido: `p_acabamento:"com_adesivo"` (a skill confirmou via `alerta` que `"sem_impressao"` é destinado a fachada, não placa avulsa — o preço passou de custo+margem/motor 2 pra preço de mercado/motor 1, quase dobrando: R$319→R$560 pra 2m² de 3mm) e `PlacaACMCalculator.tsx` atualizado pros nomes de campo atuais. **Lição reforçada**: uma chamada RPC sem erro não significa que o resultado está sendo lido corretamente — sempre testar o valor final exibido, não só o status HTTP.

**Materiais novos de Adesivo confirmados na skill (27/07/26) — sem necessidade de mudança no app**: os 5 itens pedidos (Corte Especial R$100/m², Imantado R$350/m², Refletivo R$300/m², Adesivo Jateado R$150/m², Adesivo Blackout R$120/m²) estão ativos e testados via SQL direto:
- `corte_especial`, `imantado`, `blackout` → tabela `adesivo_impresso_opcoes` (consumidos por `calc_adesivo_impresso`).
- `Refletivo Shop Vinil 1,22m`, `Jateado Shop Vinil 1,22m` → tabela `adesivo_recorte_materiais`, campo `preco_mercado_m2` (consumidos por `calc_adesivo_recorte`, `motor_usado: "mercado (motor 1)"`).
- Ambas Edge Functions (`calc-adesivo-impresso`, `calc-adesivo-recorte`) já servem essas listas **dinamicamente** via `action:'meta'`/`'materiais'` (SELECT `WHERE ativo=true`) e os componentes React já renderizam o dropdown a partir dessa resposta — **por isso nenhum código precisou mudar**, a skill alimenta o app automaticamente.
- **Nota**: "Adesivo Perfurado" existe (R$150/m², decisão final do Étto "sem distinção de tier" registrada na observação da linha) mas não há um item separado "Microperfurado" — se isso ainda for necessário como produto distinto, precisa ser pedido de novo à skill.

**Bug real encontrado e corrigido: Lona tinha acabamentos fixos no código, ignorando o que já existia na skill (28/07/26)**. `lona_opcoes` já tinha 4 linhas ativas (`sem_acabamento`, `reforcada_ilhos`, `440g_externa`, `backlight` — este último é a lona translúcida, "para luminosos/fundos iluminados") e `calc-lona` já servia todas via `action:'meta'`, mas `LonaCalculator.tsx` tinha um array `TIPOS` hardcoded com só as 2 primeiras — os outros 2 acabamentos existiam e tinham preço, só não apareciam pro vendedor. Corrigido renderizando os botões de acabamento dinamicamente a partir da resposta da Edge Function (mesmo padrão do Adesivo Impresso). Zero mudança na skill.

Sem pendências de bug conhecidas além da integração de rota acima.
