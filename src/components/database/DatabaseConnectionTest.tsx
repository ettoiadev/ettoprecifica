
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '../../hooks/use-toast';
import { db } from '../../lib/db/connection';
import { sql } from 'drizzle-orm';

interface Props {
  isDatabaseAvailable: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setTestResult: (result: string) => void;
}

const DatabaseConnectionTest: React.FC<Props> = ({
  isDatabaseAvailable,
  isLoading,
  setIsLoading,
  setTestResult
}) => {
  const { toast } = useToast();

  const testDatabaseConnection = async () => {
    if (!isDatabaseAvailable) {
      setTestResult('❌ Banco de dados não disponível. Configure VITE_DATABASE_URL.');
      return;
    }

    setIsLoading(true);
    setTestResult('');
    
    try {
      const result = await db.execute(sql`SELECT NOW() as current_time`);
      setTestResult(`✅ Conexão testada com sucesso! Hora do servidor: ${new Date().toLocaleString()}`);
      toast({
        title: "Sucesso",
        description: "Conexão com banco testada com sucesso.",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setTestResult(`❌ Erro na conexão: ${errorMsg}`);
      toast({
        title: "Erro",
        description: "Falha ao testar conexão com banco.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={testDatabaseConnection} 
      disabled={isLoading}
      className="w-full"
    >
      {isLoading ? 'Testando...' : 'Testar Conexão'}
    </Button>
  );
};

export default DatabaseConnectionTest;
