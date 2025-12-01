
import { useState, useEffect } from 'react';
import { runMigrations } from '../lib/db/migrations';
import { useToast } from './use-toast';

export const useDatabase = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const initializeDatabase = async () => {
    if (isInitializing || isInitialized) return;

    // Check for database URL from localStorage first, then environment
    const localConfig = localStorage.getItem('databaseConnectionString');
    const databaseUrl = localConfig || import.meta.env.VITE_DATABASE_URL;
    
    if (!databaseUrl) {
      setError('Banco de dados não configurado. Configure a string de conexão nas configurações.');
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      await runMigrations();
      setIsInitialized(true);
      toast({
        title: "Banco de dados conectado",
        description: "Conexão com Neon Database estabelecida com sucesso.",
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      toast({
        title: "Erro na conexão",
        description: "Falha ao conectar com o banco de dados. Verifique a string de conexão.",
        variant: "destructive",
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // Migrate data from localStorage to database
  const migrateLocalStorageData = async () => {
    if (!isInitialized) return;

    try {
      // This would be implemented when user authentication is added
      console.log('Migration from localStorage will be implemented with user authentication');
    } catch (err) {
      console.error('Migration failed:', err);
    }
  };

  useEffect(() => {
    const localConfig = localStorage.getItem('databaseConnectionString');
    const databaseUrl = localConfig || import.meta.env.VITE_DATABASE_URL;
    
    if (databaseUrl) {
      initializeDatabase();
    } else {
      setError('Banco de dados não configurado. Configure a string de conexão nas configurações.');
    }
  }, []);

  return {
    isInitialized,
    isInitializing,
    error,
    initializeDatabase,
    migrateLocalStorageData,
  };
};
