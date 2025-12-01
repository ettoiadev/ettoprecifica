# Product Requirements Document (PRD)
## Sistema de Precificação para Comunicação Visual

**Versão:** 2.0  
**Data:** 30 de novembro de 2024  
**Status:** Em Produção  
**Autor:** Equipe de Desenvolvimento  
**Última Atualização:** 30/11/2024 - Implementação Sistema de Variações Dinâmicas  

---

## 1. Visão Geral do Produto

### 1.1 Resumo Executivo
O Sistema de Precificação para Comunicação Visual é uma aplicação web projetada para automatizar e otimizar o processo de cálculo de preços e geração de orçamentos para produtos e serviços de comunicação visual. A plataforma oferece calculadoras especializadas para diferentes tipos de produtos, permitindo configurações personalizadas de custos e geração instantânea de orçamentos profissionais.

### 1.2 Objetivo do Produto
- Automatizar o processo de precificação de produtos de comunicação visual
- Reduzir erros humanos em cálculos complexos de custos
- Padronizar orçamentos e garantir consistência nos preços
- Acelerar o tempo de resposta a clientes
- Facilitar a gestão de configurações de preços e margens de lucro

### 1.3 Público-Alvo
- **Primário:** Empresas de comunicação visual e gráficas rápidas
- **Secundário:** Profissionais autônomos do setor de sinalização e publicidade
- **Perfil de Usuário:** Gestores, orçamentistas e vendedores com conhecimento básico em produtos de comunicação visual

### 1.4 Proposta de Valor
- Interface moderna e intuitiva que não requer treinamento extensivo
- Cálculos precisos considerando múltiplas variáveis (materiais, instalação, taxas)
- Flexibilidade para ajustar configurações de acordo com a realidade de cada negócio
- Geração profissional de orçamentos em formato PDF
- Persistência de dados local e em nuvem

---

## 2. Escopo do Produto

### 2.1 Funcionalidades Principais

#### 2.1.1 Sistema de Calculadoras Especializadas
O sistema oferece 9 calculadoras especializadas:

1. **Calculadora de Adesivo**
   - Tipos: Corte Especial, Só Refile, Laminado, Adesivo Perfurado, Imantado
   - Cálculo baseado em metragem quadrada
   - Consideração de acabamentos especiais

2. **Calculadora de Lona**
   - Tipos: Banner/Faixa, Reforço com Ilhós, Lona Backlight, Só Refile
   - Cálculo por metro quadrado
   - Opções de acabamento e reforços

3. **Calculadora de Placa em PS**
   - Espessuras: 1mm e 2mm
   - Cálculo dimensional (largura x altura)
   - Diferentes valores por espessura

4. **Calculadora de Placa em ACM**
   - Material premium para fachadas
   - Cálculo por metro quadrado
   - Preço único independente da espessura

5. **Calculadora de Fachada Simples**
   - Múltiplos materiais: Lona, ACM 122, ACM 150
   - Cálculo de estrutura metálica (barras de 6m)
   - Cantoneiras para acabamento
   - Sistema complexo de dimensionamento

6. **Calculadora de Letra Caixa em PVC**
   - Espessuras: 10mm, 15mm, 20mm
   - Opções de acabamento: Pintura Automotiva, Fita Dupla Face
   - Cálculo baseado em área total das letras

7. **Calculadora de Vidro Temperado**
   - Espessuras: 6mm e 8mm
   - Prolongadores inclusos no orçamento
   - Cálculo dimensional preciso

8. **Calculadora de Luminoso**
   - Dimensionamento complexo (largura, altura, profundidade)
   - Múltiplas fontes de iluminação: Lâmpadas Tubulares (122cm e 60cm)
   - Módulos LED (17W e 15W)
   - Sistema de fonte chaveada (5A, 10A, 15A, 20A, 30A)
   - Cálculo automático de quantidade de lâmpadas/LEDs
   - Estrutura metálica (Metalon 20x20 e ACM)
   - Opção para luminosos redondos/ovais

9. **Calculadora de Laser**
   - 28 variações de materiais organizadas por categoria:
   - **Acrílico Cristal:** 2mm, 3mm, 5mm, 8mm, 10mm
   - **Acrílico Colorido:** 3mm, 5mm
   - **Acrílico Leitoso:** 3mm, 5mm
   - **Acrílico Espelho:** Prata, Dourado
   - **MDF:** 3mm, 6mm, 9mm
   - **Compensado:** 6mm, 10mm
   - **Eucatex:** 3mm
   - **Papelão Paraná:** 1mm, 2mm, 3mm
   - **EVA:** 2mm, 5mm, 10mm
   - **Cortiça:** 2mm, 5mm
   - **Acrílico Fumê:** 3mm
   - Cálculo por metro quadrado
   - Interface moderna com radio buttons organizados por tipo de material

#### 2.1.2 Sistema de Configurações
- **Configuração de Preços por Produto:** Ajuste individual de preço base para cada tipo de material
- **Configuração de Nota Fiscal:** Percentual de acréscimo quando emitido NF
- **Configuração de Cartão de Crédito:** 13 opções de parcelamento configuráveis:
  - Crédito à Vista
  - 2x, 3x, 4x, 5x, 6x, 7x, 8x, 9x, 10x, 11x e 12x
  - Cada opção com taxa percentual individual
- **Variações Dinâmicas de Produtos:** ✨ **NOVO**
  - Sistema para adicionar variações customizadas a produtos
  - Disponível em: Adesivo, Lona, Placa PS, Letra PVC, Vidro
  - Interface com botões para adicionar, editar e excluir variações
  - Campos configuráveis: Nome, Preço e Unidade
  - Persistência automática no Supabase
  - Integração automática nas calculadoras
- **Configuração de Instalação:** Valores por localidade
  - Jacareí
  - São José dos Campos
  - Caçapava/Taubaté
  - Litoral
  - Guararema/Santa Isabel
  - Santa Branca
  - São Paulo

#### 2.1.3 Sistema de Orçamentos
- Geração de orçamentos em formato copiável para área de transferência
- Resumo detalhado com todos os custos
- Inclusão de observações personalizáveis
- **Informações de Parcelamento:** ✨ **NOVO**
  - Exibição automática de informações de parcelamento quando selecionado
  - Formato: "Parcelamento em [opção] com taxa de [X]%"
  - Substituição da informação de entrada 50% quando parcelamento aplicado
- **Interface Moderna:**
  - Select dropdown para parcelamento (13 opções)
  - Select dropdown para prazo de entrega
  - Exibição da taxa de cartão em tempo real
- Cálculo automático de:
  - Subtotal de produtos
  - Custo de instalação
  - Taxa de cartão de crédito (13 opções)
  - Percentual de nota fiscal
  - Total final

#### 2.1.4 Persistência de Dados
- **LocalStorage:** Armazenamento local de configurações no navegador
- **Banco de Dados Supabase (PostgreSQL):** Armazenamento em nuvem com:
  - Autenticação de usuários
  - Configurações de preços
  - Variações customizadas de produtos
  - Orçamentos salvos
  - Itens de orçamento
  - Cálculos e configurações de orçamento
  - Settings de observações de orçamento

### 2.2 Funcionalidades Fora do Escopo (Versão 1.0)
- Sistema de autenticação e login de usuários
- Gestão de clientes (CRM)
- Sistema de pedidos e acompanhamento de produção
- Integração com sistemas de pagamento
- Notificações por e-mail
- Aplicativo mobile nativo
- Multi-tenancy (múltiplas empresas)

---

## 3. Requisitos Funcionais

### 3.1 Requisitos de Calculadoras

#### RF-001: Seleção de Tipo de Produto
**Descrição:** O sistema deve permitir a seleção do tipo de produto através de abas/tabs  
**Prioridade:** Alta  
**Critérios de Aceitação:**
- Usuário consegue navegar entre as 8 calculadoras disponíveis
- Aba ativa é destacada visualmente
- Mudança de aba não perde dados não salvos (aviso ao usuário)

#### RF-002: Entrada de Dimensões
**Descrição:** Cada calculadora deve permitir entrada de dimensões específicas do produto  
**Prioridade:** Alta  
**Critérios de Aceitação:**
- Campos numéricos aceitam apenas valores válidos
- Validação de dimensões mínimas e máximas
- Cálculo automático de área/metragem
- Suporte a casas decimais

#### RF-003: Seleção de Materiais e Opções
**Descrição:** Sistema deve permitir seleção de materiais, acabamentos e opções adicionais  
**Prioridade:** Alta  
**Critérios de Aceitação:**
- Opções apresentadas de forma clara (radio buttons, checkboxes, selects)
- Alteração de opções recalcula preço em tempo real
- Validação de combinações incompatíveis de opções

#### RF-004: Cálculo Automático de Preço
**Descrição:** O sistema deve calcular automaticamente o preço baseado nas entradas do usuário  
**Prioridade:** Alta  
**Critérios de Aceitação:**
- Cálculo instantâneo ao alterar qualquer parâmetro
- Exibição clara do valor total
- Detalhamento de cada componente do custo
- Formatação em Real Brasileiro (R$)

#### RF-005: Adicionar ao Orçamento
**Descrição:** Usuário deve poder adicionar itens calculados a um orçamento  
**Prioridade:** Alta  
**Critérios de Aceitação:**
- Botão "Adicionar ao Orçamento" visível e funcional
- Feedback visual de sucesso ao adicionar
- Item aparece na lista de orçamento
- Possibilidade de adicionar múltiplos itens

### 3.2 Requisitos de Configurações

#### RF-006: Painel de Configurações
**Descrição:** Sistema deve ter um painel dedicado para gerenciamento de configurações  
**Prioridade:** Alta  
**Critérios de Aceitação:**
- Acesso via botão de configurações no header
- Interface organizada por categorias
- Alterações salvas apenas ao clicar em "Salvar"
- Opção de cancelar e voltar sem salvar

#### RF-007: Configuração de Preços Base
**Descrição:** Permitir ajuste de preços base para todos os materiais e serviços  
**Prioridade:** Alta  
**Critérios de Aceitação:**
- Cada tipo de material tem campo editável
- Valores aceitos apenas números positivos
- Validação de valores mínimos e máximos
- Salvar configurações no localStorage e banco de dados

#### RF-008: Configuração de Taxas Adicionais
**Descrição:** Configurar percentuais de nota fiscal e taxas de cartão de crédito  
**Prioridade:** Média  
**Critérios de Aceitação:**
- Campos para percentual de NF
- Campos para taxas de 3x, 6x e 12x
- Validação de percentuais (0-100%)
- Aplicação automática nos cálculos de orçamento

#### RF-009: Configuração de Instalação
**Descrição:** Definir valores de instalação por localidade  
**Prioridade:** Média  
**Critérios de Aceitação:**
- Lista de todas as localidades atendidas
- Campo de valor para cada localidade
- Valores aplicados ao selecionar instalação no orçamento

### 3.3 Requisitos de Orçamento

#### RF-010: Visualização de Itens do Orçamento
**Descrição:** Exibir lista de todos os itens adicionados ao orçamento  
**Prioridade:** Alta  
**Critérios de Aceitação:**
- Lista atualizada em tempo real
- Exibição de nome, tipo e valor de cada item
- Opção de remover itens individualmente
- Indicação visual quando orçamento está vazio

#### RF-011: Resumo Financeiro
**Descrição:** Calcular e exibir resumo completo do orçamento  
**Prioridade:** Alta  
**Critérios de Aceitação:**
- Subtotal de todos os itens
- Custo de instalação (se selecionado)
- Taxa de cartão de crédito (se aplicável)
- Percentual de nota fiscal (se aplicável)
- Total final destacado
- Formatação monetária adequada

#### RF-012: Seleção de Opções de Orçamento
**Descrição:** Permitir seleção de instalação, forma de pagamento e observações  
**Prioridade:** Média  
**Critérios de Aceitação:**
- Dropdown para selecionar localidade de instalação
- Opções de parcelamento (À vista, 3x, 6x, 12x)
- Campo de texto para observações personalizadas
- Valores predefinidos para campos comuns (prazo, garantia, forma de pagamento)

#### RF-013: Geração de PDF
**Descrição:** Gerar documento PDF profissional do orçamento  
**Prioridade:** Alta  
**Critérios de Aceitação:**
- PDF gerado com layout profissional
- Inclusão de todos os itens e cálculos
- Logo e informações da empresa (se configurado)
- Download automático ao gerar
- Nome de arquivo com data e hora

### 3.4 Requisitos de Persistência

#### RF-014: Salvamento Automático de Configurações
**Descrição:** Configurações devem ser salvas automaticamente  
**Prioridade:** Alta  
**Critérios de Aceitação:**
- Configurações salvas no localStorage
- Recuperação automática ao recarregar página
- Sincronização com banco de dados (quando disponível)

#### RF-015: Salvamento de Orçamentos
**Descrição:** Permitir salvar orçamentos para recuperação futura  
**Prioridade:** Média  
**Critérios de Aceitação:**
- Orçamentos salvos no banco de dados
- Lista de orçamentos salvos
- Opção de carregar orçamento salvo
- Edição de orçamentos salvos

---

## 4. Requisitos Não Funcionais

### 4.1 Performance

#### RNF-001: Tempo de Resposta
**Descrição:** Cálculos devem ser executados instantaneamente  
**Métrica:** Tempo de resposta < 100ms para qualquer cálculo  
**Prioridade:** Alta

#### RNF-002: Carregamento da Aplicação
**Descrição:** Aplicação deve carregar rapidamente  
**Métrica:** First Contentful Paint (FCP) < 1.5s  
**Prioridade:** Média

### 4.2 Usabilidade

#### RNF-003: Interface Intuitiva
**Descrição:** Interface deve ser fácil de usar sem treinamento  
**Métrica:** Usuário consegue gerar primeiro orçamento em < 5 minutos  
**Prioridade:** Alta

#### RNF-004: Responsividade
**Descrição:** Aplicação deve funcionar em diferentes tamanhos de tela  
**Métrica:** Suporte a resoluções de 320px a 4K  
**Prioridade:** Média

#### RNF-005: Acessibilidade
**Descrição:** Interface deve seguir padrões de acessibilidade  
**Métrica:** Conformidade com WCAG 2.1 nível AA  
**Prioridade:** Baixa

### 4.3 Confiabilidade

#### RNF-006: Precisão dos Cálculos
**Descrição:** Cálculos devem ser matematicamente precisos  
**Métrica:** Margem de erro < 0.01% devido a arredondamentos  
**Prioridade:** Crítica

#### RNF-007: Persistência de Dados
**Descrição:** Dados não devem ser perdidos  
**Métrica:** 99.9% de integridade de dados  
**Prioridade:** Alta

### 4.4 Segurança

#### RNF-008: Proteção de Dados
**Descrição:** Dados sensíveis devem ser protegidos  
**Métrica:** Conexão SSL/TLS obrigatória  
**Prioridade:** Alta

#### RNF-009: Sanitização de Entradas
**Descrição:** Prevenir injeção de código malicioso  
**Métrica:** Validação de 100% das entradas de usuário  
**Prioridade:** Alta

### 4.5 Manutenibilidade

#### RNF-010: Código Limpo
**Descrição:** Código deve seguir boas práticas  
**Métrica:** TypeScript com tipagem forte em 100% do código  
**Prioridade:** Média

#### RNF-011: Documentação
**Descrição:** Código e sistema devem estar documentados  
**Métrica:** Cobertura de documentação > 80%  
**Prioridade:** Média

### 4.6 Escalabilidade

#### RNF-012: Suporte a Múltiplos Usuários
**Descrição:** Sistema deve suportar crescimento de usuários  
**Métrica:** Suporte a 100+ usuários simultâneos  
**Prioridade:** Baixa (Versão 1.0)

---

## 5. Arquitetura Técnica

### 5.1 Stack Tecnológico

#### Frontend
- **Framework:** React 18.3.1
- **Build Tool:** Vite 5.4.1
- **Linguagem:** TypeScript 5.5.3
- **Roteamento:** React Router DOM 6.26.2
- **Estilização:** Tailwind CSS 3.4.11
- **Componentes UI:** shadcn/ui (baseado em Radix UI)
- **Ícones:** Lucide React 0.462.0
- **Gerenciamento de Estado:** React Hooks + LocalStorage
- **Validação de Formulários:** React Hook Form 7.53.0 + Zod 3.23.8
- **Data Management:** TanStack Query 5.56.2

#### Backend/Banco de Dados
- **Banco de Dados:** Supabase PostgreSQL (BaaS - Backend as a Service)
- **Autenticação:** Supabase Auth
- **API:** Supabase Client
- **Real-time:** Supabase Realtime (opcional)
- **MCP Integration:** Model Context Protocol para Supabase

#### Ferramentas de Desenvolvimento
- **Linter:** ESLint 9.9.0
- **Formatter:** (Integrado ao editor)
- **Package Manager:** npm / bun

### 5.2 Estrutura de Diretórios

```
precificacv/
├── public/                      # Assets estáticos
├── src/
│   ├── components/              # Componentes React
│   │   ├── calculators/         # Calculadoras especializadas
│   │   │   ├── AdesivoCalculator.tsx
│   │   │   ├── LonaCalculator.tsx
│   │   │   ├── PlacaPSCalculator.tsx
│   │   │   ├── PlacaACMCalculator.tsx
│   │   │   ├── FachadaCalculator.tsx
│   │   │   ├── LetraCaixaCalculator.tsx
│   │   │   ├── VidroCalculator.tsx
│   │   │   ├── LuminosoCalculator.tsx
│   │   │   └── LaserCalculator.tsx
│   │   ├── settings/            # Componentes de configurações
│   │   │   ├── ConfigSection.tsx
│   │   │   ├── CustomVariationsManager.tsx
│   │   │   └── settingsConfig.ts
│   │   ├── ui/                  # Componentes UI do shadcn
│   │   ├── BudgetSummaryExtended.tsx
│   │   ├── DatabaseStatus.tsx
│   │   ├── ModernCalculatorWrapper.tsx
│   │   ├── ModernHeader.tsx
│   │   ├── ModernTabs.tsx
│   │   └── SettingsPanel.tsx
│   ├── hooks/                   # Custom React Hooks
│   │   └── useDatabase.ts
│   ├── lib/                     # Bibliotecas e utilitários
│   │   ├── db/                  # Configuração de banco de dados
│   │   │   ├── connection.ts
│   │   │   ├── migrations.ts
│   │   │   └── schema.ts
│   │   └── utils.ts
│   ├── pages/                   # Páginas da aplicação
│   │   ├── Index.tsx            # Página principal
│   │   ├── DatabaseTest.tsx     # Teste de banco de dados
│   │   └── NotFound.tsx
│   ├── services/                # Serviços de API e lógica de negócio
│   │   ├── budgetService.ts
│   │   └── configService.ts
│   ├── types/                   # Definições de tipos TypeScript
│   │   └── pricing.ts
│   ├── utils/                   # Funções utilitárias
│   ├── App.tsx                  # Componente raiz
│   └── main.tsx                 # Entry point
├── docs/                        # Documentação
│   └── prd.md                   # Este documento
├── README.md
├── README-DATABASE.md
├── package.json
├── tsconfig.json
└── vite.config.ts
```

### 5.3 Banco de Dados

#### Schema Principal

```sql
-- Tabela de usuários
users
  - id (UUID, PK)
  - email (VARCHAR, UNIQUE)
  - name (VARCHAR)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

-- Configurações de preços
pricing_configs
  - id (UUID, PK)
  - user_id (UUID, FK)
  - config_data (JSONB)
  - is_default (BOOLEAN)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

-- Configurações de observações
budget_settings
  - id (UUID, PK)
  - user_id (UUID, FK)
  - payment_method (TEXT)
  - delivery_time (TEXT)
  - warranty (TEXT)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

-- Orçamentos
budgets
  - id (UUID, PK)
  - user_id (UUID, FK)
  - name (VARCHAR)
  - total (DECIMAL)
  - status (VARCHAR)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)

-- Itens do orçamento
budget_items
  - id (UUID, PK)
  - budget_id (UUID, FK)
  - name (VARCHAR)
  - type (VARCHAR)
  - dimensions (JSONB)
  - options (JSONB)
  - price (DECIMAL)
  - created_at (TIMESTAMP)

-- Cálculos do orçamento
budget_calculations
  - id (UUID, PK)
  - budget_id (UUID, FK)
  - installation_location (VARCHAR)
  - installation_cost (DECIMAL)
  - credit_card_option (VARCHAR)
  - credit_card_fee (DECIMAL)
  - invoice_fee (DECIMAL)
  - delivery_days (INTEGER)
  - notes (TEXT)
  - created_at (TIMESTAMP)
  - updated_at (TIMESTAMP)
```

### 5.4 Fluxo de Dados

1. **Carregamento Inicial:**
   - Aplicação carrega configurações do localStorage
   - Se não encontrar, usa configurações padrão
   - Verifica conexão com banco de dados Neon

2. **Uso de Calculadora:**
   - Usuário seleciona tipo de produto (tab)
   - Insere dimensões e seleciona opções
   - Sistema calcula preço em tempo real (React state)
   - Usuário adiciona item ao orçamento

3. **Gerenciamento de Orçamento:**
   - Itens armazenados em state do React
   - Cálculos de totais executados automaticamente
   - Opções de instalação e pagamento aplicadas
   - Geração de PDF com biblioteca (a definir)

4. **Persistência:**
   - Configurações salvas no localStorage
   - Orçamentos podem ser salvos no banco Neon
   - Sincronização automática quando online

---

## 6. Interface do Usuário (UI/UX)

### 6.1 Princípios de Design

1. **Clareza:** Interface limpa e sem elementos desnecessários
2. **Eficiência:** Mínimo de cliques para completar tarefas
3. **Feedback:** Resposta visual imediata para ações do usuário
4. **Consistência:** Padrões visuais e de interação uniformes
5. **Prevenção de Erros:** Validação proativa de entradas

### 6.2 Componentes Principais

#### Header
- Logo/nome da aplicação
- Botão de configurações (ícone de engrenagem)
- Indicador de status do banco de dados (opcional)

#### Navegação por Tabs
- 8 tabs para cada tipo de calculadora
- Tab ativa com destaque visual
- Ícones representativos para cada tipo de produto

#### Área de Calculadora
- Formulário com campos específicos do produto
- Cálculo em tempo real exibido
- Botão "Adicionar ao Orçamento" em destaque
- Preview do item a ser adicionado

#### Painel de Orçamento
- Lista de itens adicionados
- Resumo financeiro
- Opções de instalação e pagamento
- Botões de ação (Limpar, Gerar PDF, Salvar)

#### Painel de Configurações
- Organizado em seções/accordions
- Campos de entrada numéricos
- Botões "Salvar" e "Cancelar"
- Indicação de alterações não salvas

### 6.3 Padrões de Interação

- **Formulários:** Validação em tempo real com mensagens claras
- **Botões:** Estados hover, active e disabled bem definidos
- **Modais:** Para confirmações importantes
- **Toasts/Notificações:** Feedback de ações bem-sucedidas ou erros
- **Loading States:** Indicadores durante operações assíncronas

### 6.4 Responsividade

- **Desktop (> 1024px):** Layout em duas colunas (calculadora + orçamento)
- **Tablet (768px - 1024px):** Layout ajustável com prioridade ao conteúdo
- **Mobile (< 768px):** Layout em coluna única, navegação otimizada

### 6.5 Tema Visual

- **Cores Primárias:** Gradientes de azul e roxo
- **Cores de Destaque:** Azul vibrante para CTAs
- **Background:** Gradiente suave (gray-50, blue-50, purple-50)
- **Tipografia:** Fonte moderna e legível (sistema)
- **Espaçamento:** Generoso para respiração visual
- **Sombras:** Sutis para profundidade
- **Bordas:** Arredondadas para modernidade

---

## 7. Casos de Uso Detalhados

### 7.1 UC-001: Calcular Preço de Adesivo
**Ator:** Orçamentista  
**Objetivo:** Calcular o preço de um serviço de adesivo personalizado  

**Fluxo Principal:**
1. Usuário acessa a aplicação
2. Sistema exibe tab "Adesivo" ativa por padrão
3. Usuário seleciona tipo de adesivo (ex: Laminado)
4. Usuário insere largura (ex: 2 metros)
5. Usuário insere altura (ex: 1.5 metros)
6. Sistema calcula área: 2 × 1.5 = 3 m²
7. Sistema aplica preço configurado (ex: R$ 35/m²)
8. Sistema exibe total: R$ 105,00
9. Usuário clica em "Adicionar ao Orçamento"
10. Sistema adiciona item ao orçamento com sucesso

**Fluxo Alternativo 1: Valor Mínimo**
- Se valor calculado < R$ 20,00
- Sistema aplica valor mínimo de R$ 20,00
- Sistema exibe mensagem "Valor mínimo aplicado"

### 7.2 UC-002: Configurar Preços Base
**Ator:** Gestor  
**Objetivo:** Ajustar os preços base de todos os materiais  

**Fluxo Principal:**
1. Usuário clica no botão de configurações no header
2. Sistema exibe painel de configurações
3. Usuário navega até seção "Preços de Adesivo"
4. Usuário altera preço de "Laminado" de R$ 35 para R$ 40
5. Usuário navega até seção "Preços de Instalação"
6. Usuário altera valor de "São José dos Campos" para R$ 150
7. Usuário clica em "Salvar Configurações"
8. Sistema valida valores (todos positivos e válidos)
9. Sistema salva no localStorage
10. Sistema tenta salvar no banco de dados
11. Sistema exibe mensagem de sucesso
12. Sistema retorna à tela principal

**Fluxo Alternativo 1: Valores Inválidos**
- Se valor negativo ou inválido detectado
- Sistema exibe mensagem de erro no campo específico
- Sistema impede salvamento
- Usuário corrige valores

**Fluxo Alternativo 2: Cancelar Alterações**
- Usuário clica em "Cancelar"
- Sistema descarta alterações
- Sistema retorna à tela principal sem salvar

### 7.3 UC-003: Gerar Orçamento Completo
**Ator:** Orçamentista  
**Objetivo:** Gerar um orçamento em PDF com múltiplos itens  

**Fluxo Principal:**
1. Usuário já adicionou 3 itens ao orçamento:
   - Adesivo Laminado 3m²: R$ 105,00
   - Placa ACM 2m²: R$ 90,00
   - Letra Caixa PVC 15mm: R$ 180,00
2. Sistema exibe subtotal: R$ 375,00
3. Usuário seleciona instalação "São José dos Campos"
4. Sistema adiciona custo de instalação: R$ 120,00
5. Usuário seleciona parcelamento "6x no cartão"
6. Sistema calcula taxa de 8%: R$ 39,60
7. Usuário marca opção "Emitir Nota Fiscal"
8. Sistema calcula acréscimo de 15%: R$ 80,19
9. Sistema exibe total final: R$ 614,79
10. Usuário preenche observações personalizadas
11. Usuário clica em "Gerar PDF"
12. Sistema gera documento PDF
13. Sistema inicia download automático
14. Usuário recebe arquivo "orcamento_2024-11-29_14-30.pdf"

**Pós-condição:**
- Orçamento disponível em PDF
- Opcionalmente salvo no banco de dados
- Usuário pode compartilhar com cliente

### 7.4 UC-004: Calcular Luminoso Complexo
**Ator:** Orçamentista Especializado  
**Objetivo:** Calcular preço de um luminoso com múltiplas especificações  

**Fluxo Principal:**
1. Usuário seleciona tab "Luminoso"
2. Usuário insere dimensões:
   - Largura: 3 metros
   - Altura: 1 metro
   - Profundidade: 0.2 metros
3. Usuário seleciona "Lâmpadas Tubulares 122cm"
4. Sistema calcula automaticamente:
   - Área frontal: 3m²
   - Quantidade de lâmpadas necessárias: 6 unidades
   - Perímetro para estrutura: 8 metros
5. Sistema calcula materiais:
   - Lona: 3m² × R$ 20 = R$ 60,00
   - Lâmpadas: 6 × R$ 25 = R$ 150,00
   - Metalon: 8m ÷ 6m = 2 barras × R$ 15 = R$ 30,00
   - ACM 122: 0.6m² × R$ 120 = R$ 72,00
   - Fonte 10A: R$ 65,00
6. Sistema calcula estrutura metálica:
   - Barras necessárias: 3
   - Custo: 3 × R$ 34 = R$ 102,00
7. Sistema exibe total: R$ 479,00
8. Usuário adiciona ao orçamento

**Fluxo Alternativo: Luminoso Redondo**
- Usuário marca opção "Redondo/Oval"
- Sistema adiciona custo extra: R$ 200,00
- Total ajustado para R$ 679,00

---

## 8. Métricas e KPIs

### 8.1 Métricas de Uso
- Número de orçamentos gerados por dia/semana/mês
- Tipo de calculadora mais utilizada
- Tempo médio para gerar um orçamento
- Taxa de conversão (orçamentos gerados vs salvos)

### 8.2 Métricas de Performance
- Tempo de carregamento da aplicação
- Tempo de resposta dos cálculos
- Tempo de geração de PDF
- Taxa de erros de sistema

### 8.3 Métricas de Satisfação
- Taxa de abandono na criação de orçamento
- Feedback de usuários (quando implementado)
- Número de configurações alteradas (indica personalização)

---

## 9. Roadmap de Desenvolvimento

### Fase 1: MVP (✅ CONCLUÍDA - Versão 2.0)
- ✅ 9 Calculadoras especializadas funcionais (incluindo Laser)
- ✅ Sistema de configurações completo e avançado
- ✅ Geração de orçamentos com cópia para área de transferência
- ✅ Persistência em localStorage
- ✅ Interface moderna com Tailwind CSS e shadcn/ui
- ✅ Integração com banco de dados Supabase
- ✅ Schema completo do banco de dados
- ✅ Sistema de autenticação com Supabase Auth
- ✅ **13 opções de parcelamento de cartão de crédito**
- ✅ **Sistema de variações dinâmicas de produtos**
- ✅ **Interface com Select dropdown modernos**
- ✅ **Informações de parcelamento nas observações**
- ✅ **Correção de cálculo de estrutura metálica em Fachada**
- ✅ **Labels de menu otimizados para melhor espaçamento**
- ✅ **Preço mínimo de R$ 20,00 aplicado automaticamente**

### Fase 2: Melhorias (Em Andamento)
- ✅ Sistema de autenticação de usuários (Supabase Auth)
- [ ] Salvamento e recuperação de orçamentos do banco
- [ ] Histórico de orçamentos gerados
- [ ] Templates de orçamento
- [ ] Geração de PDF profissional (substituir cópia para área de transferência)
- [ ] Sistema de backup/exportação de dados
- [ ] Expansão do sistema de variações dinâmicas para mais calculadoras
- [ ] Dashboard de estatísticas básicas

### Fase 3: Recursos Avançados (3-6 meses)
- [ ] Dashboard de estatísticas
- [ ] Gestão básica de clientes
- [ ] Sistema de busca de orçamentos
- [ ] Duplicação de orçamentos
- [ ] Comparação de orçamentos
- [ ] Integração com e-mail

### Fase 4: Escalabilidade (6-12 meses)
- [ ] Multi-tenancy (múltiplas empresas)
- [ ] Sistema de permissões (admin, vendedor, visualizador)
- [ ] API REST para integrações
- [ ] Aplicativo mobile (PWA ou nativo)
- [ ] Modo offline robusto
- [ ] Sincronização avançada

---

## 10. Riscos e Mitigações

### 10.1 Riscos Técnicos

#### Risco 1: Perda de Dados no LocalStorage
**Probabilidade:** Média  
**Impacto:** Alto  
**Mitigação:**
- Implementar sincronização com banco de dados
- Criar sistema de backup automático
- Alertar usuário sobre limpeza de cache

#### Risco 2: Imprecisão nos Cálculos
**Probabilidade:** Baixa  
**Impacto:** Crítico  
**Mitigação:**
- Testes automatizados extensivos
- Validação dupla de fórmulas matemáticas
- Revisão por especialistas do setor

#### Risco 3: Performance com Grandes Orçamentos
**Probabilidade:** Média  
**Impacto:** Médio  
**Mitigação:**
- Otimização de renderização React
- Virtualização de listas longas
- Limite máximo de itens por orçamento (se necessário)

### 10.2 Riscos de Negócio

#### Risco 4: Resistência à Adoção
**Probabilidade:** Média  
**Impacto:** Alto  
**Mitigação:**
- Interface extremamente intuitiva
- Documentação e tutoriais em vídeo
- Suporte dedicado para primeiros usuários
- Período de testes gratuito

#### Risco 5: Mudanças de Preços de Mercado
**Probabilidade:** Alta  
**Impacto:** Médio  
**Mitigação:**
- Sistema de configuração flexível
- Atualizações rápidas de preços
- Histórico de configurações
- Alertas para revisão periódica

### 10.3 Riscos de Infraestrutura

#### Risco 6: Indisponibilidade do Banco Neon
**Probabilidade:** Baixa  
**Impacto:** Médio  
**Mitigação:**
- Fallback para localStorage
- Modo offline funcional
- Sincronização quando retornar online

---

## 11. Dependências e Integrações

### 11.1 Dependências Externas

#### Banco de Dados
- **Serviço:** Neon PostgreSQL
- **Criticidade:** Alta
- **Plano B:** Fallback para localStorage

#### Hospedagem
- **Plataforma:** Vercel (recomendado) ou similar
- **Criticidade:** Alta
- **Requisitos:** Suporte a variáveis de ambiente

### 11.2 Integrações Futuras

#### Sistema de E-mail
- **Objetivo:** Enviar orçamentos por e-mail
- **Prioridade:** Média
- **Opções:** SendGrid, Amazon SES, Mailgun

#### Sistema de Pagamento
- **Objetivo:** Receber pagamentos online
- **Prioridade:** Baixa
- **Opções:** Stripe, PagSeguro, Mercado Pago

#### WhatsApp Business API
- **Objetivo:** Enviar orçamentos via WhatsApp
- **Prioridade:** Baixa

---

## 12. Critérios de Sucesso

### 12.1 Lançamento do MVP
- [ ] Todas as 8 calculadoras funcionais e testadas
- [ ] Sistema de configurações 100% operacional
- [ ] Geração de PDF com layout profissional
- [ ] Zero bugs críticos conhecidos
- [ ] Performance dentro das métricas (< 100ms para cálculos)
- [ ] Testes com pelo menos 5 usuários reais

### 12.2 Adoção (3 meses)
- [ ] Pelo menos 10 empresas utilizando regularmente
- [ ] Média de 50+ orçamentos gerados por semana
- [ ] Taxa de satisfação > 80%
- [ ] Menos de 5% de taxa de abandono

### 12.3 Maturidade (6 meses)
- [ ] 30+ empresas ativas
- [ ] 200+ orçamentos gerados por semana
- [ ] Sistema de autenticação implementado
- [ ] Database de orçamentos salvos funcionando
- [ ] ROI positivo para usuários (economia de tempo)

---

## 13. Manutenção e Suporte

### 13.1 Manutenção Preventiva
- Atualizações mensais de dependências
- Revisão trimestral de performance
- Backup automático de configurações
- Monitoramento de erros (Sentry ou similar)

### 13.2 Manutenção Corretiva
- Correção de bugs críticos em até 24 horas
- Correção de bugs médios em até 1 semana
- Melhorias solicitadas avaliadas mensalmente

### 13.3 Suporte ao Usuário
- Documentação online atualizada
- FAQ para dúvidas comuns
- Canal de suporte (e-mail ou chat)
- Vídeos tutoriais para cada calculadora

---

## 14. Considerações Finais

### 14.1 Diferenciais Competitivos
1. **Especialização:** Focado exclusivamente em comunicação visual
2. **Completude:** 8 calculadoras especializadas em um único lugar
3. **Flexibilidade:** Altamente configurável para diferentes realidades
4. **Modernidade:** Interface atual e agradável
5. **Precisão:** Cálculos complexos automatizados e confiáveis

### 14.2 Próximos Passos Imediatos
1. Implementar geração de PDF profissional
2. Criar sistema de autenticação
3. Desenvolver funcionalidade de salvar/carregar orçamentos
4. Adicionar validações mais robustas
5. Criar tutoriais em vídeo

### 14.3 Visão de Longo Prazo
Transformar a aplicação em uma **plataforma completa de gestão** para empresas de comunicação visual, incluindo:
- Gestão de clientes (CRM)
- Acompanhamento de pedidos
- Controle de estoque
- Gestão financeira básica
- Relatórios e analytics
- Marketplace de fornecedores

---

## 15. Funcionalidades Implementadas - Versão 2.0

### 15.1 Sistema de Variações Dinâmicas de Produtos ✨

**Descrição:** Sistema completo para adicionar, editar e excluir variações customizadas de produtos, permitindo máxima flexibilidade na oferta de materiais.

**Componentes Implementados:**
- `CustomVariationsManager.tsx` - Componente de gerenciamento com UI moderna
- Interface com Dialog modal da shadcn/ui
- Integração automática nas calculadoras

**Funcionalidades:**
- ✅ Botão "+ Adicionar Variação" em cada seção de configuração
- ✅ Dialog modal com formulário completo:
  - Campo: Nome da Variação (ex: "Refletivo")
  - Campo: Preço (numérico com 2 casas decimais)
  - Campo: Unidade (m², unid, etc)
- ✅ Botões de ação em cada variação:
  - ✏️ Editar - Abre dialog com dados preenchidos
  - 🗑️ Excluir - Remove variação imediatamente
- ✅ Visual moderno com cards cinzas e hover effects
- ✅ Persistência automática no Supabase
- ✅ Arrays preservados nas conversões de moeda

**Seções Suportadas:**
- Adesivo
- Lona
- Placa PS
- Letra PVC
- Vidro

**Exemplo de Uso:**
```typescript
// Variação adicionada pelo usuário
{
  id: "custom_1701389234567",
  label: "Refletivo",
  price: 250.00,
  unit: "m²"
}
```

### 15.2 Sistema de Parcelamento Completo (13 Opções)

**Descrição:** Expansão do sistema de cartão de crédito de 3 para 13 opções configuráveis, com interface moderna usando Select dropdown.

**Opções Implementadas:**
1. Não aplicar
2. Crédito à Vista
3. 2x, 3x, 4x, 5x, 6x, 7x, 8x, 9x, 10x, 11x, 12x

**Interface Moderna:**
- ✅ Select dropdown substituindo radio buttons
- ✅ Exibição da taxa em tempo real ao lado de cada opção
- ✅ Cálculo automático do valor da taxa aplicada
- ✅ Indicação visual clara da opção selecionada

**Integração no Orçamento:**
- ✅ Informações de parcelamento incluídas nas observações
- ✅ Formato: "Parcelamento em [opção] com taxa de [X]%"
- ✅ Substituição da informação de entrada 50% quando parcelamento aplicado
- ✅ Persistência da opção selecionada

### 15.3 Calculadora Laser (28 Materiais)

**Descrição:** Nova calculadora especializada para corte a laser com 28 variações de materiais organizadas por categoria.

**Categorias de Materiais:**

1. **Acrílico Cristal** (5 opções)
   - 2mm, 3mm, 5mm, 8mm, 10mm

2. **Acrílico Colorido** (2 opções)
   - 3mm, 5mm

3. **Acrílico Leitoso** (2 opções)
   - 3mm, 5mm

4. **Acrílico Espelho** (2 opções)
   - Prata, Dourado

5. **MDF** (3 opções)
   - 3mm, 6mm, 9mm

6. **Compensado** (2 opções)
   - 6mm, 10mm

7. **Eucatex** (1 opção)
   - 3mm

8. **Papelão Paraná** (3 opções)
   - 1mm, 2mm, 3mm

9. **EVA** (3 opções)
   - 2mm, 5mm, 10mm

10. **Cortiça** (2 opções)
    - 2mm, 5mm

11. **Acrílico Fumê** (1 opção)
    - 3mm

**Características:**
- ✅ Interface com radio buttons organizados por categoria
- ✅ Cálculo por metro quadrado
- ✅ Aplicação de preço mínimo (R$ 20,00)
- ✅ Integração com sistema de orçamentos
- ✅ Todos os preços configuráveis

### 15.4 Correções e Melhorias

#### Correção: Cálculo de Estrutura Metálica (Fachada)
**Problema:** Valor hardcoded de R$ 34,00 (custo) ao invés do preço de venda configurável
**Solução:** 
- ✅ Uso do valor `config.estruturaMetalica.precoPorBarra`
- ✅ Atualização do valor padrão para R$ 80,00 (preço de venda)
- ✅ Exibição dinâmica do preço no formulário

#### Correção: Página Branca após Parcelamento
**Problema:** Select do Radix UI não permite `value=""` (string vazia)
**Solução:**
- ✅ Mudança de `value: ''` para `value: 'none'`
- ✅ Ajuste em toda lógica para verificar `!== 'none'`
- ✅ Estado inicial atualizado

#### Melhoria: Labels de Menu Otimizados
**Objetivo:** Melhor espaçamento horizontal e evitar corte de texto
**Mudanças:**
- ✅ "Placa em PS" → "Placa PS"
- ✅ "Placa em ACM" → "Placa ACM"
- ✅ "Fachada Simples" → "Fachada"
- ✅ "Letra Caixa em PVC" → "Letra PVC"
- ✅ "Vidro Temperado" → "Vidro"

### 15.5 Integrações e Tecnologias

**Model Context Protocol (MCP):**
- ✅ Integração com Supabase MCP Server
- ✅ Acesso a ferramentas do Supabase via MCP
- ✅ Autenticação e queries facilitadas

**Supabase Features Utilizadas:**
- ✅ PostgreSQL Database
- ✅ Supabase Auth
- ✅ Row Level Security (RLS)
- ✅ Real-time subscriptions (preparado)

---

## 16. Glossário

- **ACM:** Aluminium Composite Material (Material composto de alumínio)
- **m²:** Metro quadrado
- **PS:** Poliestireno (material plástico)
- **PVC:** Policloreto de Vinila
- **Metalon:** Tubo de aço estrutural
- **Cantoneira:** Perfil em L usado para acabamento
- **Lona Backlight:** Lona translúcida para iluminação traseira
- **Fonte Chaveada:** Fonte de alimentação para LEDs
- **Ilhós:** Anéis metálicos para reforço e fixação
- **Refile:** Corte simples sem acabamento especial

---

## 17. Aprovações

| Nome | Cargo | Data | Assinatura | Versão |
|------|-------|------|------------|--------|
| Equipe Dev | Tech Lead | 30/11/2024 | ✅ Aprovado | 2.0 |
| [Nome] | Product Owner | 30/11/2024 | ___________ | 2.0 |
| [Nome] | UX Designer | 30/11/2024 | ___________ | 2.0 |
| [Nome] | Stakeholder | 30/11/2024 | ___________ | 2.0 |

---

## 18. Notas de Versão 2.0

### Principais Entregas
1. ✅ **Sistema de Variações Dinâmicas** - Funcionalidade completa e testada
2. ✅ **13 Opções de Parcelamento** - Interface moderna com Select dropdown
3. ✅ **Calculadora Laser** - 28 materiais organizados por categoria
4. ✅ **Correções Críticas** - Estrutura metálica, página branca, labels otimizados
5. ✅ **Integração Supabase** - Autenticação e persistência em nuvem

### Status Geral
- **Compilação:** ✅ Sucesso
- **Testes Manuais:** ✅ Aprovado
- **Performance:** ✅ Dentro das métricas
- **Bugs Conhecidos:** 0 críticos

### Próximos Passos Recomendados
1. [ ] Expandir variações dinâmicas para Fachada e Luminoso
2. [ ] Implementar salvamento de orçamentos no banco
3. [ ] Criar geração de PDF profissional
4. [ ] Desenvolver dashboard de estatísticas

---

**Fim do Documento - Versão 2.0**

*Este documento está sujeito a alterações e deve ser revisado a cada sprint/release do produto.*  
*Última revisão: 30 de novembro de 2024*
