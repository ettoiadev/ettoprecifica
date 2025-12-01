# 🎨 Sistema de Precificação para Comunicação Visual

[![Versão](https://img.shields.io/badge/versão-2.0-blue.svg)](https://github.com/ettoiadev/ettoprecifica)
[![Status](https://img.shields.io/badge/status-Em%20Produção-success.svg)](https://github.com/ettoiadev/ettoprecifica)
[![TypeScript](https://img.shields.io/badge/TypeScript-100%25-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3.1-61dafb.svg)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Integrado-3ecf8e.svg)](https://supabase.com/)

Sistema web completo para cálculo de preços e geração de orçamentos profissionais para empresas de comunicação visual e gráficas rápidas.

---

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Tecnologias](#-tecnologias)
- [Instalação](#-instalação)
- [Configuração](#️-configuração)
- [Uso](#-uso)
- [Documentação](#-documentação)
- [Contribuindo](#-contribuindo)
- [Licença](#-licença)

---

## 🎯 Visão Geral

Plataforma completa de precificação especializada em comunicação visual, oferecendo:

- ✅ **9 Calculadoras Especializadas** (Adesivo, Lona, Placa PS/ACM, Fachada, Letra Caixa, Vidro, Luminoso, Laser)
- ✅ **Sistema de Variações Dinâmicas** - Adicione novos materiais sem código
- ✅ **13 Opções de Parcelamento** configuráveis
- ✅ **Integração Supabase** - Sincronização automática em nuvem
- ✅ **Interface Moderna** - shadcn/ui + Tailwind CSS
- ✅ **75% de Completude** - Pronto para produção

**Acesso Rápido:** [Documentação Completa](./docs/prd.md) | [Checklist de Implementação](./docs/CHECKLIST-IMPLEMENTACAO.md)

---

## ✨ Funcionalidades

### Calculadoras (100% ✅)

| # | Calculadora | Materiais | Status |
|---|------------|-----------|--------|
| 1 | **Adesivo** | 5 opções + variações dinâmicas | ✅ |
| 2 | **Lona** | 4 opções | ✅ |
| 3 | **Placa PS** | 2 espessuras | ✅ |
| 4 | **Placa ACM** | Material premium | ✅ |
| 5 | **Fachada** | Lona + ACM + Estrutura metálica | ✅ |
| 6 | **Letra Caixa PVC** | 3 espessuras + acabamentos | ✅ |
| 7 | **Vidro Temperado** | 2 espessuras | ✅ |
| 8 | **Luminoso** | Complexo (LED/Tubular) | ✅ |
| 9 | **Laser** | 28 materiais organizados | ✅ |

### Sistema de Variações Dinâmicas ✨ **NOVO v2.0**

Adicione materiais customizados diretamente pela interface:

```typescript
// Exemplo: Adicionar "Refletivo" em Adesivo
{
  label: "Refletivo",
  price: 250.00,
  unit: "m²"
}
```

**Disponível em:** Adesivo, Lona, Placa PS, Letra PVC, Vidro

### Parcelamento (100% ✅)

- ✅ Crédito à Vista
- ✅ 2x até 12x (cada com taxa individual)
- ✅ Interface moderna com Select dropdown
- ✅ Informações automáticas no orçamento

### Orçamentos (70% 🟡)

- ✅ Cálculo automático de totais
- ✅ Taxa de cartão de crédito
- ✅ Taxa de nota fiscal
- ✅ Custo de instalação (7 localidades)
- ✅ Cópia para área de transferência
- ⏳ Geração de PDF profissional (próximo)
- ⏳ Salvamento no banco (próximo)

---

## 🛠️ Tecnologias

### Frontend
- **React** 18.3.1 - Framework JavaScript
- **TypeScript** 5.5.3 - Tipagem estática
- **Vite** 5.4.10 - Build tool ultrarrápido
- **Tailwind CSS** 3.4.11 - Framework CSS
- **shadcn/ui** - Componentes modernos (Radix UI)
- **Lucide React** 0.462.0 - Ícones

### Backend/Database
- **Supabase** - BaaS (Backend as a Service)
  - PostgreSQL Database
  - Authentication
  - Real-time (preparado)
  - Row Level Security

### Ferramentas
- **ESLint** 9.9.0 - Linter
- **npm** - Package manager

---

## 📦 Instalação

### Pré-requisitos

- Node.js 18+ ([instalar com nvm](https://github.com/nvm-sh/nvm))
- npm 9+
- Conta Supabase (gratuita)

### Passo a Passo

```bash
# 1. Clonar o repositório
git clone https://github.com/ettoiadev/ettoprecifica.git
cd ettoprecifica

# 2. Instalar dependências
npm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais Supabase

# 4. Iniciar servidor de desenvolvimento
npm run dev

# 5. Acessar aplicação
# Abra http://localhost:5173 no navegador
```

---

## ⚙️ Configuração

### Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto:

```env
# Supabase
VITE_SUPABASE_URL=sua_url_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anon_supabase
```

### Obter Credenciais Supabase

1. Criar conta em [Supabase](https://supabase.com)
2. Criar novo projeto
3. Ir em **Settings** → **API**
4. Copiar:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`

### Configurar Database

As tabelas são criadas automaticamente na primeira execução. Schema disponível em `src/lib/db/schema.ts`.

---

## 💻 Uso

### 1. Fazer Login/Cadastro

```
Email: seu@email.com
Senha: ••••••••
```

### 2. Configurar Preços

1. Clique em ⚙️ **Configurações**
2. Ajuste preços de cada material
3. Configure taxas de cartão e nota fiscal
4. **Salvar Configurações**

### 3. Gerar Orçamento

1. Selecione a calculadora desejada
2. Preencha dimensões e opções
3. Visualize o resumo na lateral
4. Copie ou salve o orçamento

### 4. Adicionar Variações (Opcional)

1. Em **Configurações** → Seção do produto
2. Clique em **+ Adicionar Variação**
3. Preencha nome, preço e unidade
4. **Salvar**

---

## 📚 Documentação

Documentação completa disponível em `/docs`:

- 📖 **[PRD Completo](./docs/prd.md)** - Especificação detalhada
- ✅ **[Checklist](./docs/CHECKLIST-IMPLEMENTACAO.md)** - Status de implementação
- 📋 **[Pendências](./docs/PENDENCIAS-E-PROXIMOS-PASSOS.md)** - Roadmap
- 📊 **[Resumo Executivo](./docs/RESUMO-EXECUTIVO-V2.md)** - Visão geral

### Estrutura do Projeto

```
precificacv/
├── docs/                    # Documentação
├── public/                  # Assets estáticos
├── src/
│   ├── components/          # Componentes React
│   │   ├── calculators/     # 9 calculadoras
│   │   ├── settings/        # Configurações
│   │   └── ui/              # shadcn/ui components
│   ├── contexts/            # React Context (Auth)
│   ├── hooks/               # Custom hooks
│   ├── lib/                 # Bibliotecas (Supabase, utils)
│   ├── pages/               # Páginas
│   ├── services/            # Serviços API
│   ├── types/               # TypeScript types
│   └── utils/               # Utilitários
├── .env                     # Variáveis de ambiente
└── package.json
```

---

## 🚀 Build e Deploy

### Build para Produção

```bash
npm run build
```

Arquivos gerados em `/dist`.

### Deploy no Vercel (Recomendado)

1. Conectar repositório no [Vercel](https://vercel.com)
2. Configurar variáveis de ambiente
3. Deploy automático ✅

### Deploy em Outros Serviços

- **Netlify:** Suporte nativo para Vite
- **Cloudflare Pages:** Funciona perfeitamente
- **Servidor próprio:** Servir pasta `/dist`

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'feat: Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

### Convenção de Commits

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

---

## 🐛 Bugs Conhecidos

Nenhum bug crítico identificado! ✅

Reportar bugs em: [Issues](https://github.com/ettoiadev/ettoprecifica/issues)

---

## 📊 Status do Projeto

| Categoria | Completude |
|-----------|-----------|
| Calculadoras | 100% ✅ |
| Configurações | 95% ✅ |
| Orçamentos | 70% 🟡 |
| Autenticação | 80% 🟡 |
| Analytics | 0% ❌ |

**Completude Geral:** 75% 🎯

---

## 🗺️ Roadmap

### Sprint 1 (2 semanas)
- [ ] Expandir variações dinâmicas (Lona, PS, Letra, Vidro)
- [ ] Geração de PDF profissional

### Sprint 2 (2 semanas)  
- [ ] Salvamento de orçamentos no banco
- [ ] Histórico de orçamentos

### Sprint 3 (2 semanas)
- [ ] Dashboard de estatísticas
- [ ] Integração com e-mail

**[Ver roadmap completo](./docs/PENDENCIAS-E-PROXIMOS-PASSOS.md)**

---

## 📝 Licença

Este projeto está sob licença proprietária.  
© 2024 EttoIA Dev. Todos os direitos reservados.

---

## 👤 Autor

**EttoIA Dev**  
- GitHub: [@ettoiadev](https://github.com/ettoiadev)
- Email: ettoiadev@gmail.com

---

## 🙏 Agradecimentos

- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Supabase](https://supabase.com/) - Backend as a Service
- [Lucide](https://lucide.dev/) - Ícones

---

<div align="center">

**[⬆ Voltar ao topo](#-sistema-de-precificação-para-comunicação-visual)**

Made with ❤️ by [EttoIA Dev](https://github.com/ettoiadev)

</div>
