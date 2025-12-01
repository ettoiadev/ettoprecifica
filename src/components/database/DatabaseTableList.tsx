
import React from 'react';
import { Button } from '../ui/button';
import { db } from '../../lib/db/connection';
import { sql } from 'drizzle-orm';

interface Props {
  isDatabaseAvailable: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setTestResult: (result: string) => void;
}

const DatabaseTableList: React.FC<Props> = ({
  isDatabaseAvailable,
  isLoading,
  setIsLoading,
  setTestResult
}) => {
  const listTables = async () => {
    if (!isDatabaseAvailable) {
      setTestResult('❌ Banco de dados não disponível. Configure VITE_DATABASE_URL.');
      return;
    }

    setIsLoading(true);
    setTestResult('');
    
    try {
      const tables = await db.execute(sql`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
        ORDER BY table_name
      `);
      
      const tableNames = tables.rows?.map((table: any) => table.table_name).join(', ') || 'Nenhuma tabela encontrada';
      setTestResult(`✅ Tabelas encontradas: ${tableNames}`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setTestResult(`❌ Erro ao listar tabelas: ${errorMsg}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={listTables} 
      disabled={isLoading}
      variant="outline"
      className="w-full"
    >
      {isLoading ? 'Listando...' : 'Listar Tabelas'}
    </Button>
  );
};

export default DatabaseTableList;
