-- ============================================
-- SCHEMA COMPLETO PARA SUPABASE
-- Sistema de Precificação - Comunicação Visual
-- Projeto ID: ghyctsclpcsrznrqegrp
-- ============================================
-- Execute este SQL completo no SQL Editor do Supabase
-- Dashboard: https://supabase.com/dashboard/project/ghyctsclpcsrznrqegrp/editor
-- ============================================

-- 1. TABELA DE PROFILES (USUÁRIOS)
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Índice
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);

-- ============================================
-- 2. TRIGGER PARA CRIAR PROFILE AUTOMATICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remover trigger se existir e criar novo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- 3. TABELA DE CONFIGURAÇÕES DE PREÇOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.pricing_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  config_data JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.pricing_configs ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança (CRUD completo para próprio usuário)
CREATE POLICY "Users can view own configs"
  ON public.pricing_configs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own configs"
  ON public.pricing_configs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own configs"
  ON public.pricing_configs FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own configs"
  ON public.pricing_configs FOR DELETE
  USING (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_pricing_configs_user_id ON public.pricing_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_pricing_configs_is_default ON public.pricing_configs(user_id, is_default);

-- ============================================
-- 4. TABELA DE CONFIGURAÇÕES DE ORÇAMENTO
-- ============================================
CREATE TABLE IF NOT EXISTS public.budget_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  payment_method TEXT,
  delivery_time TEXT,
  warranty TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.budget_settings ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view own budget settings"
  ON public.budget_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budget settings"
  ON public.budget_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budget settings"
  ON public.budget_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budget settings"
  ON public.budget_settings FOR DELETE
  USING (auth.uid() = user_id);

-- Índice
CREATE INDEX IF NOT EXISTS idx_budget_settings_user_id ON public.budget_settings(user_id);

-- ============================================
-- 5. TABELA DE ORÇAMENTOS
-- ============================================
CREATE TABLE IF NOT EXISTS public.budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  total DECIMAL(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view own budgets"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own budgets"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own budgets"
  ON public.budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_status ON public.budgets(user_id, status);
CREATE INDEX IF NOT EXISTS idx_budgets_created_at ON public.budgets(user_id, created_at DESC);

-- ============================================
-- 6. TABELA DE ITENS DE ORÇAMENTO
-- ============================================
CREATE TABLE IF NOT EXISTS public.budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  dimensions JSONB,
  options JSONB,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.budget_items ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança (baseadas no acesso ao budget pai)
CREATE POLICY "Users can view items of own budgets"
  ON public.budget_items FOR SELECT
  USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert items to own budgets"
  ON public.budget_items FOR INSERT
  WITH CHECK (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update items of own budgets"
  ON public.budget_items FOR UPDATE
  USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete items of own budgets"
  ON public.budget_items FOR DELETE
  USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

-- Índices
CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON public.budget_items(budget_id);
CREATE INDEX IF NOT EXISTS idx_budget_items_type ON public.budget_items(type);

-- ============================================
-- 7. TABELA DE CÁLCULOS DE ORÇAMENTO
-- ============================================
CREATE TABLE IF NOT EXISTS public.budget_calculations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  budget_id UUID NOT NULL REFERENCES public.budgets(id) ON DELETE CASCADE,
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

-- Habilitar RLS
ALTER TABLE public.budget_calculations ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Users can view calculations of own budgets"
  ON public.budget_calculations FOR SELECT
  USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert calculations to own budgets"
  ON public.budget_calculations FOR INSERT
  WITH CHECK (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update calculations of own budgets"
  ON public.budget_calculations FOR UPDATE
  USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete calculations of own budgets"
  ON public.budget_calculations FOR DELETE
  USING (
    budget_id IN (
      SELECT id FROM public.budgets WHERE user_id = auth.uid()
    )
  );

-- Índice
CREATE INDEX IF NOT EXISTS idx_budget_calculations_budget_id ON public.budget_calculations(budget_id);

-- ============================================
-- 8. FUNÇÃO PARA ATUALIZAR UPDATED_AT
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. TRIGGERS PARA UPDATED_AT
-- ============================================

-- Profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Pricing Configs
DROP TRIGGER IF EXISTS update_pricing_configs_updated_at ON public.pricing_configs;
CREATE TRIGGER update_pricing_configs_updated_at
  BEFORE UPDATE ON public.pricing_configs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Budget Settings
DROP TRIGGER IF EXISTS update_budget_settings_updated_at ON public.budget_settings;
CREATE TRIGGER update_budget_settings_updated_at
  BEFORE UPDATE ON public.budget_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Budgets
DROP TRIGGER IF EXISTS update_budgets_updated_at ON public.budgets;
CREATE TRIGGER update_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Budget Calculations
DROP TRIGGER IF EXISTS update_budget_calculations_updated_at ON public.budget_calculations;
CREATE TRIGGER update_budget_calculations_updated_at
  BEFORE UPDATE ON public.budget_calculations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 10. VERIFICAÇÃO FINAL
-- ============================================
-- Execute esta query para verificar se tudo foi criado:
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public'
  AND table_name IN (
    'profiles',
    'pricing_configs', 
    'budget_settings',
    'budgets',
    'budget_items',
    'budget_calculations'
  )
ORDER BY table_name;

-- ============================================
-- SCHEMA CRIADO COM SUCESSO!
-- ============================================
-- Próximos passos:
-- 1. Verificar se todas as tabelas foram criadas
-- 2. Testar autenticação criando um usuário
-- 3. Verificar se o profile é criado automaticamente
-- 4. Testar as políticas RLS
-- ============================================
