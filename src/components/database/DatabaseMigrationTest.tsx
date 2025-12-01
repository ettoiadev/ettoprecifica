
import React from 'react';
import { Button } from '../ui/button';
import { useToast } from '../../hooks/use-toast';
import { runMigrations } from '../../lib/db/migrations';

interface Props {
  isDatabaseAvailable: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setTestResult: (result: string) => void;
}

const DatabaseMigrationTest: React.FC<Props> = ({
  isDatabaseAvailable,
  isLoading,
  setIsLoading,
  setTestResult
}) => {
  const { toast } = useToast();

  const runMigrationsTest = async () => {
    if (!isDatabaseAvailable) {
      setTestResult('❌ Banco de dados não disponível. Configure VITE_DATABASE_URL.');
      return;
    }

    setIsLoading(true);
    setTestResult('');
    
    try {
      await runMigrations();
      setTestResult('✅ Migrações executadas com sucesso!');
      toast({
        title: "Sucesso",
        description: "Migrações do banco executadas com sucesso.",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setTestResult(`❌ Erro nas migrações: ${errorMsg}`);
      toast({
        title: "Erro",
        description: "Falha ao executar migrações.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={runMigrationsTest} 
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      {isLoading ? 'Executando...' : 'Executar Migrações'}
    </Button>
  );
};

export default DatabaseMigrationTest;
