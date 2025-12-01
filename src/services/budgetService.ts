
import { db } from '../lib/db/connection';
import { budgets, budgetItems, budgetCalculations } from '../lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Budget, BudgetItem } from '../hooks/useBudgets';

export const budgetService = {
  async getAllBudgets(userId: string): Promise<Budget[]> {
    const result = await db
      .select()
      .from(budgets)
      .where(eq(budgets.userId, userId))
      .orderBy(desc(budgets.updatedAt));

    const budgetsWithItems = await Promise.all(
      result.map(async (budget) => {
        const items = await db
          .select()
          .from(budgetItems)
          .where(eq(budgetItems.budgetId, budget.id));

        return {
          id: budget.id,
          name: budget.name,
          items: items.map(item => ({
            id: item.id,
            name: item.name,
            type: item.type,
            dimensions: item.dimensions as { width: number; height: number } | undefined,
            options: item.options as Record<string, any> | undefined,
            price: Number(item.price),
            createdAt: item.createdAt!,
          })),
          total: Number(budget.total),
          createdAt: budget.createdAt!,
          updatedAt: budget.updatedAt!,
        };
      })
    );

    return budgetsWithItems;
  },

  async createBudget(userId: string, name: string): Promise<Budget> {
    const [newBudget] = await db
      .insert(budgets)
      .values({
        userId,
        name,
        total: '0',
        status: 'draft',
      })
      .returning();

    return {
      id: newBudget.id,
      name: newBudget.name,
      items: [],
      total: 0,
      createdAt: newBudget.createdAt!,
      updatedAt: newBudget.updatedAt!,
    };
  },

  async updateBudget(budgetId: string, updates: Partial<Budget>): Promise<void> {
    await db
      .update(budgets)
      .set({
        name: updates.name,
        total: updates.total?.toString(),
        updatedAt: new Date(),
      })
      .where(eq(budgets.id, budgetId));
  },

  async deleteBudget(budgetId: string): Promise<void> {
    await db.delete(budgets).where(eq(budgets.id, budgetId));
  },

  async addItemToBudget(budgetId: string, item: Omit<BudgetItem, 'id'>): Promise<void> {
    await db.insert(budgetItems).values({
      budgetId,
      name: item.name,
      type: item.type,
      dimensions: item.dimensions,
      options: item.options,
      price: item.price.toString(),
    });

    // Update budget total
    const items = await db
      .select()
      .from(budgetItems)
      .where(eq(budgetItems.budgetId, budgetId));

    const total = items.reduce((sum, item) => sum + Number(item.price), 0);

    await db
      .update(budgets)
      .set({ total: total.toString(), updatedAt: new Date() })
      .where(eq(budgets.id, budgetId));
  },
};
