# 📦 Códigos de Implementação - Componentes e Serviços

Este documento contém todos os códigos necessários para a implementação completa do sistema.

---

## 1. Cliente Supabase

**Arquivo:** `src/lib/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key are required');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storage: window.localStorage,
  },
});

export type SupabaseClient = typeof supabase;
```

---

## 2. Contexto de Autenticação

**Arquivo:** `src/contexts/AuthContext.tsx`

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUp = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

---

## 3. Serviço de Configurações

**Arquivo:** `src/services/supabase/configService.ts`

```typescript
import { supabase } from '../../lib/supabase/client';
import { PricingConfig } from '../../types/pricing';

export const configService = {
  async getPricingConfig(userId: string): Promise<PricingConfig | null> {
    const { data, error } = await supabase
      .from('pricing_configs')
      .select('config_data')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return data.config_data as PricingConfig;
  },

  async savePricingConfig(userId: string, config: PricingConfig): Promise<void> {
    const { data: existing } = await supabase
      .from('pricing_configs')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('pricing_configs')
        .update({
          config_data: config,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      const { error } = await supabase.from('pricing_configs').insert({
        user_id: userId,
        config_data: config,
        is_default: true,
      });

      if (error) throw error;
    }
  },

  async getBudgetSettings(userId: string) {
    const { data, error } = await supabase
      .from('budget_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return {
      paymentMethod: data.payment_method || '',
      deliveryTime: data.delivery_time || '',
      warranty: data.warranty || '',
    };
  },

  async saveBudgetSettings(userId: string, settings: any): Promise<void> {
    const { data: existing } = await supabase
      .from('budget_settings')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (existing) {
      const { error } = await supabase
        .from('budget_settings')
        .update({
          payment_method: settings.paymentMethod,
          delivery_time: settings.deliveryTime,
          warranty: settings.warranty,
        })
        .eq('user_id', userId);

      if (error) throw error;
    } else {
      const { error } = await supabase.from('budget_settings').insert({
        user_id: userId,
        payment_method: settings.paymentMethod,
        delivery_time: settings.deliveryTime,
        warranty: settings.warranty,
      });

      if (error) throw error;
    }
  },
};
```

---

## 4. Serviço de Orçamentos

**Arquivo:** `src/services/supabase/budgetService.ts`

```typescript
import { supabase } from '../../lib/supabase/client';

export interface Budget {
  id: string;
  name: string;
  items: BudgetItem[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetItem {
  id: string;
  name: string;
  type: string;
  dimensions?: { width: number; height: number };
  options?: Record<string, any>;
  price: number;
  createdAt: Date;
}

export const budgetService = {
  async getAllBudgets(userId: string): Promise<Budget[]> {
    const { data: budgets, error } = await supabase
      .from('budgets')
      .select(`*, budget_items (*)`)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return budgets.map((budget) => ({
      id: budget.id,
      name: budget.name,
      items: budget.budget_items.map((item: any) => ({
        id: item.id,
        name: item.name,
        type: item.type,
        dimensions: item.dimensions,
        options: item.options,
        price: parseFloat(item.price),
        createdAt: new Date(item.created_at),
      })),
      total: parseFloat(budget.total),
      createdAt: new Date(budget.created_at),
      updatedAt: new Date(budget.updated_at),
    }));
  },

  async createBudget(userId: string, name: string): Promise<Budget> {
    const { data, error } = await supabase
      .from('budgets')
      .insert({ user_id: userId, name, total: 0, status: 'draft' })
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      name: data.name,
      items: [],
      total: 0,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    };
  },

  async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<void> {
    const { error } = await supabase
      .from('budgets')
      .update({ name: updates.name, total: updates.total })
      .eq('id', budgetId);

    if (error) throw error;
  },

  async deleteBudget(budgetId: string): Promise<void> {
    const { error } = await supabase.from('budgets').delete().eq('id', budgetId);
    if (error) throw error;
  },

  async addItemToBudget(budgetId: string, item: Omit<BudgetItem, 'id' | 'createdAt'>): Promise<void> {
    const { error } = await supabase.from('budget_items').insert({
      budget_id: budgetId,
      name: item.name,
      type: item.type,
      dimensions: item.dimensions,
      options: item.options,
      price: item.price,
    });

    if (error) throw error;

    const { data: items } = await supabase
      .from('budget_items')
      .select('price')
      .eq('budget_id', budgetId);

    if (items) {
      const total = items.reduce((sum, item) => sum + parseFloat(item.price), 0);
      await supabase.from('budgets').update({ total }).eq('id', budgetId);
    }
  },

  async removeItemFromBudget(itemId: string, budgetId: string): Promise<void> {
    const { error } = await supabase.from('budget_items').delete().eq('id', itemId);
    if (error) throw error;

    const { data: items } = await supabase
      .from('budget_items')
      .select('price')
      .eq('budget_id', budgetId);

    const total = items ? items.reduce((sum, item) => sum + parseFloat(item.price), 0) : 0;
    await supabase.from('budgets').update({ total }).eq('id', budgetId);
  },
};
```

---

## 5. Rota Protegida

**Arquivo:** `src/components/auth/ProtectedRoute.tsx`

```typescript
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};
```

---

## 6. Página de Autenticação

**Arquivo:** `src/pages/Auth.tsx`

```typescript
import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';

const Auth: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signIn(email, password);
        toast.success('Login realizado com sucesso!');
        navigate('/');
      } else {
        if (password !== confirmPassword) {
          toast.error('As senhas não coincidem');
          return;
        }
        if (password.length < 6) {
          toast.error('A senha deve ter pelo menos 6 caracteres');
          return;
        }
        await signUp(email, password, name);
        toast.success('Conta criada! Verifique seu email.');
      }
    } catch (error: any) {
      toast.error(error.message || 'Erro ao processar requisição');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{isLogin ? 'Login' : 'Criar Conta'}</CardTitle>
          <CardDescription>
            {isLogin ? 'Entre com suas credenciais' : 'Preencha os dados para se cadastrar'}
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required={!isLogin}
                />
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Processando...' : isLogin ? 'Entrar' : 'Criar Conta'}
            </Button>
            <Button
              type="button"
              variant="link"
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm"
            >
              {isLogin ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça login'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default Auth;
```

---

## 7. App.tsx Atualizado

**Arquivo:** `src/App.tsx`

```typescript
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
```

---

## 8. Atualização do Index.tsx

**Adicionar no início do componente:**

```typescript
import { useAuth } from '../contexts/AuthContext';
import { configService } from '../services/supabase/configService';

const Index = () => {
  const { user } = useAuth();
  // ... resto do código existente

  // Atualizar o useEffect para carregar do Supabase:
  useEffect(() => {
    const loadConfig = async () => {
      if (!user) return;

      try {
        const supabaseConfig = await configService.getPricingConfig(user.id);
        
        if (supabaseConfig) {
          setConfig(supabaseConfig);
        } else {
          const savedConfig = localStorage.getItem('pricingConfig');
          if (savedConfig) {
            const localConfig = JSON.parse(savedConfig);
            setConfig(localConfig);
            await configService.savePricingConfig(user.id, localConfig);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        const savedConfig = localStorage.getItem('pricingConfig');
        if (savedConfig) {
          setConfig(JSON.parse(savedConfig));
        }
      }
    };

    loadConfig();
  }, [user]);

  // Atualizar a função saveConfig:
  const saveConfig = async (newConfig: PricingConfig) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      await configService.savePricingConfig(user.id, newConfig);
      setConfig(newConfig);
      localStorage.setItem('pricingConfig', JSON.stringify(newConfig));
      toast.success('Configurações salvas!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    }
  };
```

---

## Próximos Passos

1. Criar os arquivos acima na estrutura do projeto
2. Executar o SQL no Supabase
3. Testar autenticação
4. Testar salvamento de configurações
5. Implementar funcionalidades de orçamento

**Todos os códigos estão prontos para uso!**
