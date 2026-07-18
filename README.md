# Precificação CV

[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue.svg)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Integrado-3ecf8e.svg)](https://supabase.com/)

SPA de precificação e orçamento para empresas de comunicação visual e gráfica rápida. Cada aba é uma calculadora de um produto; **todos os preços vêm de um motor de precificação central** (funções `calc_*` no banco Supabase, mantidas pela skill *orcamentista-cv*), consumido via Edge Functions somente-leitura. O app não calcula preço localmente.

## Calculadoras (14)

Adesivo Impresso · Recorte · Lona · Placa PS · Placa ACM · Fachada · Letra Caixa · Vidro · Luminoso · Laser · DTF · Etiquetas · Gráfica (GIV) · Cavaletes

Cada aba coleta as dimensões/opções, chama a Edge Function correspondente e mostra o preço (sem e com nota fiscal), com botão de copiar e de adicionar à cotação.

## Stack

- **React 18.3 + TypeScript 5.5 + Vite 5.4** (build via SWC)
- **Tailwind CSS + shadcn/ui** (Radix), lucide-react, sonner
- **Supabase** — Auth + PostgreSQL; o motor de preço é acessado via **Edge Functions** (`supabase/functions/calc-*`) que usam a service role internamente para ler as funções `calc_*` (RLS trancado, sem escrita)

## Instalação

```bash
git clone https://github.com/ettoiadev/ettoprecifica.git
cd ettoprecifica
npm install
cp .env.example .env   # preencha as credenciais Supabase
npm run dev            # http://localhost:5173
```

Variáveis (`.env`):

```env
VITE_SUPABASE_URL=...
VITE_SUPABASE_ANON_KEY=...
```

## Build

```bash
./node_modules/.bin/tsc --noEmit   # o build SWC não faz typecheck; rode separado
./node_modules/.bin/vite build     # gera /dist
```

## Estrutura

```
src/
├── components/
│   ├── calculators/   # as 14 calculadoras (uma por produto)
│   ├── settings/      # Configurações (apenas "Geral")
│   └── ui/            # shadcn/ui
├── contexts/          # Auth, Cotação (carrinho)
├── lib/supabase/      # client
├── pages/             # Index (abas)
└── services/supabase/ # config/budget services
supabase/functions/    # Edge Functions calc-* (ponte read-only para o motor)
```

## Arquitetura e contribuição

O contexto técnico completo — mapa aba→função, padrões, armadilhas (overloads, mínimo por área agregada) e o fluxo de verificação do banco — está em **[CLAUDE.md](./CLAUDE.md)**. Leia antes de alterar qualquer cálculo.

Convenção de commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.

## Licença

Proprietária. © EttoIA Dev.
