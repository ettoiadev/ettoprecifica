
import { pgTable, uuid, varchar, text, decimal, boolean, timestamp, jsonb, integer } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).unique().notNull(),
  name: varchar('name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const pricingConfigs = pgTable('pricing_configs', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  configData: jsonb('config_data').notNull(),
  isDefault: boolean('is_default').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const budgetSettings = pgTable('budget_settings', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  paymentMethod: text('payment_method'),
  deliveryTime: text('delivery_time'),
  warranty: text('warranty'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const budgets = pgTable('budgets', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  total: decimal('total', { precision: 10, scale: 2 }).default('0'),
  status: varchar('status', { length: 50 }).default('draft'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const budgetItems = pgTable('budget_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  budgetId: uuid('budget_id').references(() => budgets.id, { onDelete: 'cascade' }),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 100 }).notNull(),
  dimensions: jsonb('dimensions'),
  options: jsonb('options'),
  price: decimal('price', { precision: 10, scale: 2 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const budgetCalculations = pgTable('budget_calculations', {
  id: uuid('id').primaryKey().defaultRandom(),
  budgetId: uuid('budget_id').references(() => budgets.id, { onDelete: 'cascade' }),
  installationLocation: varchar('installation_location', { length: 100 }),
  installationCost: decimal('installation_cost', { precision: 10, scale: 2 }).default('0'),
  creditCardOption: varchar('credit_card_option', { length: 50 }),
  creditCardFee: decimal('credit_card_fee', { precision: 5, scale: 2 }).default('0'),
  invoiceFee: decimal('invoice_fee', { precision: 5, scale: 2 }).default('0'),
  deliveryDays: integer('delivery_days'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  budgets: many(budgets),
  pricingConfigs: many(pricingConfigs),
  budgetSettings: many(budgetSettings),
}));

export const budgetsRelations = relations(budgets, ({ one, many }) => ({
  user: one(users, {
    fields: [budgets.userId],
    references: [users.id],
  }),
  items: many(budgetItems),
  calculations: many(budgetCalculations),
}));

export const budgetItemsRelations = relations(budgetItems, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetItems.budgetId],
    references: [budgets.id],
  }),
}));

export const budgetCalculationsRelations = relations(budgetCalculations, ({ one }) => ({
  budget: one(budgets, {
    fields: [budgetCalculations.budgetId],
    references: [budgets.id],
  }),
}));
