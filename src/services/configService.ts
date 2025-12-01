
import { db } from '../lib/db/connection';
import { pricingConfigs, budgetSettings } from '../lib/db/schema';
import { eq } from 'drizzle-orm';
import { PricingConfig } from '../types/pricing';
import { BudgetObservations } from '../hooks/useBudgetSettings';

export const configService = {
  async getPricingConfig(userId: string): Promise<PricingConfig | null> {
    const result = await db
      .select()
      .from(pricingConfigs)
      .where(eq(pricingConfigs.userId, userId))
      .limit(1);

    if (result.length === 0) return null;

    return result[0].configData as PricingConfig;
  },

  async savePricingConfig(userId: string, config: PricingConfig): Promise<void> {
    const existing = await db
      .select()
      .from(pricingConfigs)
      .where(eq(pricingConfigs.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(pricingConfigs)
        .set({
          configData: config,
          updatedAt: new Date(),
        })
        .where(eq(pricingConfigs.userId, userId));
    } else {
      await db.insert(pricingConfigs).values({
        userId,
        configData: config,
        isDefault: true,
      });
    }
  },

  async getBudgetSettings(userId: string): Promise<BudgetObservations | null> {
    const result = await db
      .select()
      .from(budgetSettings)
      .where(eq(budgetSettings.userId, userId))
      .limit(1);

    if (result.length === 0) return null;

    return {
      paymentMethod: result[0].paymentMethod || '',
      deliveryTime: result[0].deliveryTime || '',
      warranty: result[0].warranty || '',
    };
  },

  async saveBudgetSettings(userId: string, settings: BudgetObservations): Promise<void> {
    const existing = await db
      .select()
      .from(budgetSettings)
      .where(eq(budgetSettings.userId, userId))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(budgetSettings)
        .set({
          paymentMethod: settings.paymentMethod,
          deliveryTime: settings.deliveryTime,
          warranty: settings.warranty,
          updatedAt: new Date(),
        })
        .where(eq(budgetSettings.userId, userId));
    } else {
      await db.insert(budgetSettings).values({
        userId,
        paymentMethod: settings.paymentMethod,
        deliveryTime: settings.deliveryTime,
        warranty: settings.warranty,
      });
    }
  },
};
