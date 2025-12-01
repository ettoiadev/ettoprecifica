# 🚀 Plano de Desenvolvimento - Sistema de Precificação CV
## Migração para Supabase e Finalização

**Projeto Supabase:** `ghyctsclpcsrznrqegrp`  
**URL:** https://ghyctsclpcsrznrqegrp.supabase.co  
**Status:** ACTIVE_HEALTHY

---

## 📊 Status Atual
- ✅ 8 Calculadoras funcionais
- ✅ Sistema de configurações com localStorage
- ✅ Interface moderna completa
- ⚠️ Banco de dados Neon (migrar para Supabase)
- ❌ Sem autenticação
- ❌ Sem salvamento persistente de orçamentos
- ❌ PDF básico (melhorar)

---

## 🎯 Fases de Desenvolvimento

### **FASE 1: Configuração do Supabase** (Prioridade: CRÍTICA)

#### Passo 1.1: Configurar variáveis de ambiente
```bash
# Criar .env.local
VITE_SUPABASE_URL=https://ghyctsclpcsrznrqegrp.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdoeWN0c2NscGNzcnpucnFlZ3JwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NTg4ODIsImV4cCI6MjA4MDAzNDg4Mn0.wmXh7yCqNG-w6NLGregnteU-HSm7Oe_p7UiaTbWTtyo

# Adicionar ao .gitignore
.env.local
```

#### Passo 1.2: Instalar dependências
```bash
npm uninstall @neondatabase/serverless
npm install @supabase/supabase-js
```

#### Passo 1.3: Criar cliente Supabase
**Arquivo:** `src/lib/supabase/client.ts`
```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
```

**✅ Critérios de Conclusão:**
- Variáveis de ambiente configuradas
- Dependências instaladas
- Cliente Supabase criado
- Aplicação compila sem erros

---

### **FASE 2: Migração do Banco de Dados** (Prioridade: CRÍTICA)

#### Executar no SQL Editor do Supabase

**SQL completo para executar:**
```sql
-- 1. Tabela de profiles (usuários)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Trigger para criar profile automaticamente
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Tabela de configurações de preços
CREATE TABLE pricing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  config_data JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pricing_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own configs" ON pricing_configs
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_pricing_configs_user_id ON pricing_configs(user_id);

-- 3. Tabela de configurações de orçamento
CREATE TABLE budget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  payment_method TEXT,
  delivery_time TEXT,
  warranty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE budget_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own settings" ON budget_settings
  FOR ALL USING (auth.uid() = user_id);

-- 4. Tabela de orçamentos
CREATE TABLE budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD own budgets" ON budgets
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_budgets_user_created ON budgets(user_id, created_at DESC);

-- 5. Tabela de itens de orçamento
CREATE TABLE budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  dimensions JSONB,
  options JSONB,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE budget_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD items" ON budget_items FOR ALL
  USING (budget_id IN (SELECT id FROM budgets WHERE user_id = auth.uid()));

CREATE INDEX idx_budget_items_budget_id ON budget_items(budget_id);

-- 6. Tabela de cálculos de orçamento
CREATE TABLE budget_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,
  installation_location TEXT,
  installation_cost DECIMAL(10, 2) DEFAULT 0,
  credit_card_option TEXT,
  credit_card_fee DECIMAL(5, 2) DEFAULT 0,
  invoice_fee DECIMAL(5, 2) DEFAULT 0,
  delivery_days INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE budget_calculations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users CRUD calculations" ON budget_calculations FOR ALL
  USING (budget_id IN (SELECT id FROM budgets WHERE user_id = auth.uid()));

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_pricing_configs_updated_at
  BEFORE UPDATE ON pricing_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_settings_updated_at
  BEFORE UPDATE ON budget_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON budgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_calculations_updated_at
  BEFORE UPDATE ON budget_calculations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

**Como executar:**
1. Acessar: https://supabase.com/dashboard/project/ghyctsclpcsrznrqegrp/editor
2. Clicar em "SQL Editor"
3. Colar todo o SQL acima
4. Clicar em "Run"

**✅ Critérios de Conclusão:**
- 6 tabelas criadas
- RLS habilitado
- Triggers funcionando
- Índices criados

---

### **FASE 3: Implementação de Autenticação** (Prioridade: ALTA)

#### Arquivos a criar:

1. **`src/contexts/AuthContext.tsx`** - Contexto de autenticação
2. **`src/components/auth/LoginForm.tsx`** - Formulário de login
3. **`src/components/auth/RegisterForm.tsx`** - Formulário de registro
4. **`src/pages/Auth.tsx`** - Página de autenticação
5. **`src/components/auth/ProtectedRoute.tsx`** - Rota protegida

#### Atualizar App.tsx:
```typescript
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Auth from "./pages/Auth";

// Nas rotas:
<AuthProvider>
  <BrowserRouter>
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
    </Routes>
  </BrowserRouter>
</AuthProvider>
```

**✅ Critérios de Conclusão:**
- Login funcional
- Registro funcional
- Sessão persistente
- Redirecionamento automático
- Logout funcionando

---

### **FASE 4: Migração dos Serviços** (Prioridade: ALTA)

#### Criar serviços Supabase:

**`src/services/supabase/configService.ts`**
```typescript
import { supabase } from '../../lib/supabase/client';

export const configService = {
  async getPricingConfig(userId: string) {
    const { data, error } = await supabase
      .from('pricing_configs')
      .select('config_data')
      .eq('user_id', userId)
      .single();
    
    if (error?.code === 'PGRST116') return null;
    if (error) throw error;
    return data.config_data;
  },

  async savePricingConfig(userId: string, config: any) {
    const { data: existing } = await supabase
      .from('pricing_configs')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      await supabase
        .from('pricing_configs')
        .update({ config_data: config })
        .eq('user_id', userId);
    } else {
      await supabase
        .from('pricing_configs')
        .insert({ user_id: userId, config_data: config, is_default: true });
    }
  },
};
```

**`src/services/supabase/budgetService.ts`**
- Implementar CRUD completo de orçamentos
- Métodos: getAllBudgets, createBudget, updateBudget, deleteBudget, addItem

**✅ Critérios de Conclusão:**
- Serviços criados
- Integração com autenticação
- CRUD funcionando
- Erros tratados

---

### **FASE 5: Funcionalidades de Orçamento** (Prioridade: MÉDIA)

#### Implementar:
1. Hook `useBudgets` para gerenciar orçamentos
2. Componente `BudgetList` para listar orçamentos
3. Modal `SavedBudgetsModal` para carregar orçamentos
4. Botões no header: "Salvar" e "Orçamentos"

**✅ Critérios de Conclusão:**
- Salvar orçamento funcionando
- Listar orçamentos salvos
- Carregar orçamento anterior
- Deletar orçamento

---

### **FASE 6: Geração de PDF** (Prioridade: MÉDIA)

#### Instalar:
```bash
npm install jspdf jspdf-autotable
npm install --save-dev @types/jspdf
```

#### Criar:
**`src/services/pdfService.ts`** - Serviço de geração de PDF profissional

**Funcionalidades do PDF:**
- Header com título e data
- Tabela de itens
- Resumo de custos
- Observações
- Footer

**✅ Critérios de Conclusão:**
- PDF gerado com layout profissional
- Todos os itens incluídos
- Cálculos corretos
- Download automático

---

### **FASE 7: Testes** (Prioridade: ALTA)

#### Testar:
- [ ] Login/registro com usuários reais
- [ ] Salvamento de configurações
- [ ] Criação de orçamentos
- [ ] Adição de itens
- [ ] Cálculos corretos
- [ ] Geração de PDF
- [ ] Logout e re-login
- [ ] Múltiplos navegadores
- [ ] Responsividade mobile

---

### **FASE 8: Deploy** (Prioridade: ALTA)

#### Configurar Vercel:
```bash
# Instalar Vercel CLI
npm install -g vercel

# Fazer deploy
vercel

# Configurar variáveis de ambiente no dashboard:
VITE_SUPABASE_URL=https://ghyctsclpcsrznrqegrp.supabase.co
VITE_SUPABASE_ANON_KEY=[sua_key]
```

#### Verificar:
- [ ] Build sem erros
- [ ] Variáveis de ambiente configuradas
- [ ] Autenticação funcionando em produção
- [ ] Banco de dados conectado
- [ ] SSL ativo

---

## 📝 Checklist Geral

### Desenvolvimento
- [ ] Fase 1: Supabase configurado
- [ ] Fase 2: Banco de dados migrado
- [ ] Fase 3: Autenticação implementada
- [ ] Fase 4: Serviços migrados
- [ ] Fase 5: Orçamentos funcionando
- [ ] Fase 6: PDF gerado corretamente
- [ ] Fase 7: Testes completos
- [ ] Fase 8: Deploy em produção

### Qualidade
- [ ] Código limpo e comentado
- [ ] TypeScript sem erros
- [ ] Nenhum console.error em produção
- [ ] Loading states implementados
- [ ] Mensagens de erro claras
- [ ] Feedback visual para ações

### Segurança
- [ ] RLS habilitado em todas as tabelas
- [ ] Tokens não expostos
- [ ] .env.local no .gitignore
- [ ] Validação de inputs
- [ ] Proteção contra SQL injection

---

## 🚨 Pontos de Atenção

1. **Não commitar** `.env.local` no Git
2. **Testar** RLS policies antes de produção
3. **Backup** das configurações do localStorage antes de migrar
4. **Validar** todos os cálculos após migração
5. **Documentar** credenciais de acesso ao Supabase

---

## 📞 Suporte

**Dashboard Supabase:** https://supabase.com/dashboard/project/ghyctsclpcsrznrqegrp  
**Documentação:** https://supabase.com/docs  
**Status do Projeto:** ACTIVE_HEALTHY

---

**Última atualização:** 29 de novembro de 2024
