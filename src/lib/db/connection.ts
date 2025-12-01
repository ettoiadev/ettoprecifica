
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema';

// Check if database URL is available from environment or localStorage
const getDatabaseUrl = () => {
  // First try localStorage (user configuration)
  const localConfig = localStorage.getItem('databaseConnectionString');
  if (localConfig) {
    return localConfig;
  }
  
  // Fallback to environment variable
  return import.meta.env.VITE_DATABASE_URL;
};

const databaseUrl = getDatabaseUrl();

// Only create connection if URL is provided
let sql: any = null;
let db: any = null;

if (databaseUrl) {
  try {
    sql = neon(databaseUrl);
    db = drizzle(sql, { schema });
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
  }
}

export { db, sql };
export type Database = typeof db;
