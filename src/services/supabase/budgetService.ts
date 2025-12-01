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
