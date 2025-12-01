
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { sql } from 'drizzle-orm';
import * as schema from './schema';

export const runMigrations = async () => {
  // Get database URL from localStorage first, then environment
  const localConfig = localStorage.getItem('databaseConnectionString');
  const databaseUrl = localConfig || import.meta.env.VITE_DATABASE_URL;
  
  if (!databaseUrl) {
    throw new Error('Database connection not available. Please configure the connection string in settings.');
  }

  try {
    const sqlConnection = neon(databaseUrl);
    const db = drizzle(sqlConnection, { schema });

    // Create extension for UUID generation
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    
    // Create users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create pricing_configs table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS pricing_configs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        config_data JSONB NOT NULL,
        is_default BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create budget_settings table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS budget_settings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        payment_method TEXT,
        delivery_time TEXT,
        warranty TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create budgets table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS budgets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        total DECIMAL(10,2) DEFAULT 0,
        status VARCHAR(50) DEFAULT 'draft',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create budget_items table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS budget_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        dimensions JSONB,
        options JSONB,
        price DECIMAL(10,2) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create budget_calculations table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS budget_calculations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        budget_id UUID REFERENCES budgets(id) ON DELETE CASCADE,
        installation_location VARCHAR(100),
        installation_cost DECIMAL(10,2) DEFAULT 0,
        credit_card_option VARCHAR(50),
        credit_card_fee DECIMAL(5,2) DEFAULT 0,
        invoice_fee DECIMAL(5,2) DEFAULT 0,
        delivery_days INTEGER,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);

    // Create indexes for performance
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON budgets(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_budget_items_budget_id ON budget_items(budget_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_pricing_configs_user_id ON pricing_configs(user_id)`);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_budget_settings_user_id ON budget_settings(user_id)`);

    console.log('Database migrations completed successfully');
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
};
