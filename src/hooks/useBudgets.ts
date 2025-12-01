
import { useState, useEffect } from 'react';
import { useToast } from './use-toast';

export interface BudgetItem {
  id: string;
  name: string;
  type: string;
  dimensions?: { width: number; height: number };
  options?: Record<string, any>;
  price: number;
  createdAt: Date;
}

export interface Budget {
  id: string;
  name: string;
  items: BudgetItem[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
}

export const useBudgets = () => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [currentBudget, setCurrentBudget] = useState<Budget | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const savedBudgets = localStorage.getItem('budgets');
    if (savedBudgets) {
      try {
        const parsed = JSON.parse(savedBudgets).map((budget: any) => ({
          ...budget,
          createdAt: new Date(budget.createdAt),
          updatedAt: new Date(budget.updatedAt),
        }));
        setBudgets(parsed);
      } catch (error) {
        console.error('Error loading budgets:', error);
      }
    }
  }, []);

  const saveBudgets = (newBudgets: Budget[]) => {
    setBudgets(newBudgets);
    localStorage.setItem('budgets', JSON.stringify(newBudgets));
  };

  const createBudget = (name: string): Budget => {
    const newBudget: Budget = {
      id: Date.now().toString(),
      name,
      items: [],
      total: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    const newBudgets = [...budgets, newBudget];
    saveBudgets(newBudgets);
    setCurrentBudget(newBudget);
    
    toast({
      title: "Orçamento criado",
      description: `O orçamento "${name}" foi criado com sucesso.`,
    });
    
    return newBudget;
  };

  const updateBudget = (budgetId: string, updates: Partial<Budget>) => {
    const newBudgets = budgets.map(budget =>
      budget.id === budgetId
        ? { ...budget, ...updates, updatedAt: new Date() }
        : budget
    );
    saveBudgets(newBudgets);
    
    if (currentBudget?.id === budgetId) {
      setCurrentBudget({ ...currentBudget, ...updates, updatedAt: new Date() });
    }
  };

  const deleteBudget = (budgetId: string) => {
    const budget = budgets.find(b => b.id === budgetId);
    const newBudgets = budgets.filter(b => b.id !== budgetId);
    saveBudgets(newBudgets);
    
    if (currentBudget?.id === budgetId) {
      setCurrentBudget(null);
    }
    
    toast({
      title: "Orçamento excluído",
      description: `O orçamento "${budget?.name}" foi excluído.`,
    });
  };

  const addItemToBudget = (budgetId: string, item: Omit<BudgetItem, 'id'>) => {
    const newItem: BudgetItem = {
      ...item,
      id: Date.now().toString(),
    };
    
    const budget = budgets.find(b => b.id === budgetId);
    if (budget) {
      const newItems = [...budget.items, newItem];
      const newTotal = newItems.reduce((sum, item) => sum + item.price, 0);
      updateBudget(budgetId, { items: newItems, total: newTotal });
    }
  };

  const exportToPDF = async (budget: Budget) => {
    // Simulação de exportação - em um projeto real, você usaria uma biblioteca como jsPDF
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
    
    toast({
      title: "Orçamento exportado",
      description: "O arquivo foi baixado com sucesso.",
    });
  };

  return {
    budgets,
    currentBudget,
    setCurrentBudget,
    createBudget,
    updateBudget,
    deleteBudget,
    addItemToBudget,
    exportToPDF,
  };
};
