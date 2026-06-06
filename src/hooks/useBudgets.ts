
import { useState, useEffect, useCallback } from 'react';
import { useToast } from './use-toast';
import { useAuth } from '../contexts/AuthContext';
import { budgetService } from '../services/supabase/budgetService';

export type { Budget, BudgetItem } from '../services/supabase/budgetService';
import type { Budget, BudgetItem } from '../services/supabase/budgetService';

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const loadBudgets = useCallback(async () => {
    if (!user) {
      const saved = localStorage.getItem('budgets');
      if (saved) {
        try {
          const parsed = JSON.parse(saved).map((b: any) => ({
            ...b,
            createdAt: new Date(b.createdAt),
            updatedAt: new Date(b.updatedAt),
          }));
          setBudgets(parsed);
        } catch (error) {
          console.error('Error loading budgets from localStorage:', error);
        }
      }
      return;
    }

    setLoading(true);
    try {
      const data = await budgetService.getAllBudgets(user.id);
      setBudgets(data);
    } catch (error) {
      console.error('Error loading budgets:', error);
      toast({ title: 'Erro ao carregar orçamentos', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    loadBudgets();
  }, [loadBudgets]);

  // Mantém currentBudget sincronizado quando a lista é recarregada
  useEffect(() => {
    if (currentBudget) {
      const updated = budgets.find(b => b.id === currentBudget.id);
      if (updated) setCurrentBudget(updated);
    }
  }, [budgets]);

  const createBudget = async (name: string): Promise<Budget> => {
    if (user) {
      try {
        const newBudget = await budgetService.createBudget(user.id, name);
        setBudgets(prev => [newBudget, ...prev]);
        setCurrentBudget(newBudget);
        toast({ title: 'Orçamento criado', description: `"${name}" criado com sucesso.` });
        return newBudget;
      } catch (error) {
        console.error('Error creating budget:', error);
        toast({ title: 'Erro ao criar orçamento', variant: 'destructive' });
        throw error;
      }
    }

    // Fallback localStorage (usuário não autenticado)
    const newBudget: Budget = {
      id: Date.now().toString(),
      name,
      items: [],
      total: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setBudgets(prev => {
      const updated = [...prev, newBudget];
      localStorage.setItem('budgets', JSON.stringify(updated));
      return updated;
    });
    setCurrentBudget(newBudget);
    toast({ title: 'Orçamento criado', description: `"${name}" criado com sucesso.` });
    return newBudget;
  };

  const updateBudget = async (budgetId: string, updates: Partial<Budget>) => {
    if (user) {
      try {
        await budgetService.updateBudget(budgetId, updates);
        setBudgets(prev =>
          prev.map(b => b.id === budgetId ? { ...b, ...updates, updatedAt: new Date() } : b)
        );
        if (currentBudget?.id === budgetId) {
          setCurrentBudget(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
        }
      } catch (error) {
        console.error('Error updating budget:', error);
        toast({ title: 'Erro ao atualizar orçamento', variant: 'destructive' });
        throw error;
      }
      return;
    }

    // Fallback localStorage
    setBudgets(prev => {
      const updated = prev.map(b =>
        b.id === budgetId ? { ...b, ...updates, updatedAt: new Date() } : b
      );
      localStorage.setItem('budgets', JSON.stringify(updated));
      return updated;
    });
    if (currentBudget?.id === budgetId) {
      setCurrentBudget(prev => prev ? { ...prev, ...updates, updatedAt: new Date() } : null);
    }
  };

  const deleteBudget = async (budgetId: string) => {
    const budget = budgets.find(b => b.id === budgetId);
    if (user) {
      try {
        await budgetService.deleteBudget(budgetId);
      } catch (error) {
        console.error('Error deleting budget:', error);
        toast({ title: 'Erro ao excluir orçamento', variant: 'destructive' });
        throw error;
      }
    }
    setBudgets(prev => {
      const updated = prev.filter(b => b.id !== budgetId);
      if (!user) localStorage.setItem('budgets', JSON.stringify(updated));
      return updated;
    });
    if (currentBudget?.id === budgetId) setCurrentBudget(null);
    toast({ title: 'Orçamento excluído', description: `"${budget?.name}" excluído.` });
  };

  const addItemToBudget = async (budgetId: string, item: Omit<BudgetItem, 'id' | 'createdAt'>) => {
    if (user) {
      try {
        await budgetService.addItemToBudget(budgetId, item);
        await loadBudgets();
      } catch (error) {
        console.error('Error adding item to budget:', error);
        toast({ title: 'Erro ao adicionar item', variant: 'destructive' });
        throw error;
      }
      return;
    }

    // Fallback localStorage
    const newItem: BudgetItem = {
      ...item,
      id: Date.now().toString(),
      createdAt: new Date(),
    };
    setBudgets(prev => {
      const updated = prev.map(b => {
        if (b.id !== budgetId) return b;
        const newItems = [...b.items, newItem];
        return { ...b, items: newItems, total: newItems.reduce((s, i) => s + i.price, 0), updatedAt: new Date() };
      });
      localStorage.setItem('budgets', JSON.stringify(updated));
      return updated;
    });
  };

  const removeItemFromBudget = async (itemId: string, budgetId: string) => {
    if (user) {
      try {
        await budgetService.removeItemFromBudget(itemId, budgetId);
        await loadBudgets();
      } catch (error) {
        console.error('Error removing item from budget:', error);
        toast({ title: 'Erro ao remover item', variant: 'destructive' });
        throw error;
      }
      return;
    }

    // Fallback localStorage
    setBudgets(prev => {
      const updated = prev.map(b => {
        if (b.id !== budgetId) return b;
        const newItems = b.items.filter(i => i.id !== itemId);
        return { ...b, items: newItems, total: newItems.reduce((s, i) => s + i.price, 0), updatedAt: new Date() };
      });
      localStorage.setItem('budgets', JSON.stringify(updated));
      return updated;
    });
  };

  const exportToPDF = async (budget: Budget) => {
    const content = `
Orçamento: ${budget.name}
Data: ${budget.createdAt.toLocaleDateString('pt-BR')}

Itens:
${budget.items.map(item => `- ${item.name}: R$ ${item.price.toFixed(2)}`).join('\n')}

Total: R$ ${budget.total.toFixed(2)}
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orcamento-${budget.name.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({ title: 'Orçamento exportado', description: 'O arquivo foi baixado com sucesso.' });
  };

  return {
    budgets,
    currentBudget,
    loading,
    setCurrentBudget,
    createBudget,
    updateBudget,
    deleteBudget,
    addItemToBudget,
    removeItemFromBudget,
    exportToPDF,
    reloadBudgets: loadBudgets,
  };
};
