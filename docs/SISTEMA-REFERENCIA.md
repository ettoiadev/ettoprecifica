# 📚 Documento de Referência do Sistema — EttoPrecifica

> Documento-mestre de reconhecimento do sistema, banco de dados e infraestrutura.
> Gerado em 2026-07-02. Mantenha atualizado ao evoluir o projeto.

---

## 1. Visão geral

**EttoPrecifica** (`package.json`: `tabela-precificacao` v2.0.0) — aplicação web SPA para
cálculo de preços e geração de orçamentos para empresas de comunicação visual / gráfica
rápida. Interface e documentação em português. Mercado-alvo: Vale do Paraíba / SP.

- **Repositório:** git, branch principal `main`. Autor git: `ettoiadev` (`ettomkt@gmail.com`).
- **GitHub:** https://github.com/ettoiadev/ettoprecifica
- **Sem testes automatizados** no projeto.

---

## 2. Stack técnica

| Camada | Tecnologia |
|---|---|
| Frontend | React 18.3 + TypeScript 5.5 + Vite 5.4 |
| UI | shadcn/ui (Radix) + Tailwind CSS + Lucide icons |
| Estado/Dados | @tanstack/react-query, React Context |
| Backend | **Supabase** (PostgreSQL 17 + Auth + RLS) |
| Roteamento | react-router-dom v6 |
| Forms/Validação | react-hook-form + zod |
| Dívida técnica | Resíduo Neon + Drizzle (`src/lib/db/`, `drizzle.config.ts`, `README-DATABASE.md`) — NÃO usado pelo código ativo |

---

## 3. Arquitetura do frontend

- **Entrada:** `src/App.tsx` → providers (QueryClient, Tooltip, Auth) + rotas.
  Rotas: `/auth`, `/` (protegida por `ProtectedRoute`), `*` (NotFound).
- **Página principal:** `src/pages/Index.tsx` — alterna entre 9 calculadoras + painel de
  configurações. Carrega config com fallback: **Supabase → localStorage → defaultConfig**,
  usando *deep merge* para tolerar campos novos.
- **Auth:** `src/contexts/AuthContext.tsx` — encapsula Supabase Auth (signIn/signUp/signOut;
  sessão persistida em localStorage).
- **Cliente Supabase:** `src/lib/supabase/client.ts` — usa `VITE_SUPABASE_URL` e
  `VITE_SUPABASE_ANON_KEY`.

### As 9 calculadoras (`src/components/calculators/`)
Adesivo · Lona · Placa PS · Placa ACM · Fachada · Letra Caixa PVC · Vidro Temperado ·
Luminoso · Laser (28 materiais). As mais complexas (Fachada, Luminoso) têm subcomponentes e
hooks de cálculo próprios (`fachada/useFachadaCalculations.ts`, `hooks/useLuminosoCalculations.ts`).

### Modelo de tipos (`src/types/pricing.ts`)
`PricingConfig` agrega config por produto + `notaFiscal`, `cartaoCredito` (13 opções de
parcelamento) e `instalacao` (8 localidades). **Preços hardcoded** em `defaultConfig`.
Variações dinâmicas via `ProductVariation[]`.

---

## 4. Banco de dados Supabase — ESTADO REAL (ao vivo)

**Organização:** `lbenysmrpcuqohrcydsm`. Dois projetos:

| Projeto | ref / id | Observação |
|---|---|---|
| **tabelapreco** | `ghyctsclpcsrznrqegrp` | Banco DESTE app. Host `db.ghyctsclpcsrznrqegrp.supabase.co`. Criado 2025-11-29. |
| ettosyserp | `deefnsrgpsdjscsqemvb` | Projeto separado (provável ERP). Criado 2026-06-10. |

### ⚠️ Descoberta-chave: DUAS camadas de tabelas desconectadas

**Grupo A — Tabelas que o app React usa (todas VAZIAS, 0 linhas):**
`profiles`, `pricing_configs`, `budget_settings`, `budgets`, `budget_items`,
`budget_calculations`.
→ O app **não tem usuários nem orçamentos persistidos**. Precificação real vive em
config JSONB / localStorage. Definição em `docs/supabase-schema.sql`.

**Grupo B — Tabelas com dados de negócio reais que o frontend NÃO referencia:**

| Tabela | Linhas | Conteúdo |
|---|---|---|
| `materiais_custos` | 250 | Custos de materiais por fornecedor/unidade/categoria |
| `precos_venda` | 89 | Preço venda min/max + margem por produto |
| `regras_precificacao` | 38 | Regras de precificação (regra, valor) |
| `etiquetas_rotulos` | 36 | Precificação de etiquetas/rótulos |
| `giv_precos` | 19 | Preços GIV |
| `fornecedores` | 17 | Cadastro de fornecedores |
| `indicadores_financeiros` | 16 | Indicadores financeiros |
| `prazos_entrega` | 16 | Prazos de entrega por produto (dias úteis) |
| `deslocamento_cidades` | 11 | Custo deslocamento por cidade (custo real vs. cobrado) |
| `instalacao_variaveis` | 11 | Variáveis de instalação |
| `custos_fixos` | 10 | Custos fixos mensais |
| `dtf_precos` | 9 | Preços DTF (fornecedor "DTF do Vale") |
| `cavaletes_madeira` | 6 | Cavaletes de madeira |
| `cavaletes` | 4 | Cavaletes (metalon) |
| `formula_fachada_lona` | 1 | Fórmula paramétrica de custo de fachada em lona |
| `formula_fachada_acm` | 1 | Fórmula paramétrica de custo de fachada em ACM |

**Todas as tabelas têm RLS habilitado.** As do Grupo B não têm FK a `user_id`
(dados globais/compartilhados) — validar as *policies* de leitura anônima (rodar `get_advisors`).

### Fórmulas paramétricas de fachada (destaque)
`formula_fachada_lona` / `formula_fachada_acm` contêm parâmetros detalhados de custo:
espaçamento de metalon (H/V), custo por barra, cantoneira, dobra de lona, ilhós, mão de obra
por minuto (produção e instalação), custo/hora, mínimo de minutos, etc. Replicam em DADOS a
lógica hoje HARDCODED em `src/components/calculators/fachada/useFachadaCalculations.ts`.

### Interpretação estratégica
O app está **uma geração atrás do banco**: o frontend calcula por constantes hardcoded
(`defaultConfig`), enquanto o banco já tem modelagem de precificação baseada em custos reais
(fórmulas, margens, custo real vs. cobrado, 250 materiais). **Direção provável do projeto:**
migrar as calculadoras para lerem `materiais_custos` / `regras_precificacao` / `formula_*`
em vez das constantes do código.

---

## 5. Infraestrutura / hosting

### Vercel
- Conta autenticada: **ettopropaganda** (`ettopropaganda@gmail.com`) — e-mail DIFERENTE do
  git/Supabase (`ettomkt@gmail.com`).
- **0 projetos, 0 deployments** no escopo pessoal e no time padrão
  (`team_FzjLiOUntjxlTjpoQmlqRf74`). Token com escopo limitado (não lista times).
- **Conclusão:** o EttoPrecifica NÃO está hospedado nesta conta Vercel. Deploy real pode
  estar em outra conta/time, outro provedor (Netlify/Cloudflare Pages) ou ainda não existe.

### Variáveis de ambiente esperadas
- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` (cliente atual).
- `VITE_DATABASE_URL` (legado Neon — não usado pelo código ativo).

---

## 6. Segurança / credenciais

- **Não armazenar segredos neste repositório.** Durante o reconhecimento foram expostos no
  chat (e devem ser revogados): um Personal Access Token do Supabase (`sbp_...`) e um token de
  API da Vercel (`vck_...`). Acesso ao Supabase via MCP funciona por OAuth — não depende do PAT.
- RLS habilitado em todas as tabelas ✅. Revisar policies das tabelas do Grupo B.

---

## 7. Status do projeto (do README)

| Categoria | Completude |
|---|---|
| Calculadoras | 100% |
| Configurações | 95% |
| Orçamentos | 70% (falta PDF + salvamento no banco) |
| Autenticação | 80% |
| Analytics | 0% |

**Geral:** ~75%.

---

## 8. Próximos passos candidatos

1. Conectar as calculadoras aos dados reais do banco (Grupo B) em vez de constantes hardcoded.
2. Ativar persistência de orçamentos (tabelas do Grupo A hoje vazias).
3. Rodar `get_advisors` para auditar RLS/performance.
4. Limpar dívida técnica Neon/Drizzle (ou documentar por que permanece).
5. Geração de PDF de orçamento e histórico.
