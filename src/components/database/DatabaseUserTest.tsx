
import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useToast } from '../../hooks/use-toast';
import { db } from '../../lib/db/connection';
import { sql } from 'drizzle-orm';

interface Props {
  isDatabaseAvailable: boolean;
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
  setTestResult: (result: string) => void;
}

const DatabaseUserTest: React.FC<Props> = ({
  isDatabaseAvailable,
  isLoading,
  setIsLoading,
  setTestResult
}) => {
  const [testEmail, setTestEmail] = useState('teste@exemplo.com');
  const [testName, setTestName] = useState('Usuário Teste');
  const { toast } = useToast();

  const testUserCreation = async () => {
    if (!isDatabaseAvailable) {
      setTestResult('❌ Banco de dados não disponível. Configure VITE_DATABASE_URL.');
      return;
    }

    setIsLoading(true);
    setTestResult('');
    
    try {
      await db.execute(sql`
        INSERT INTO users (email, name) 
        VALUES (${testEmail}, ${testName}) 
        ON CONFLICT (email) DO UPDATE SET name = ${testName}
      `);
      
      const users = await db.execute(sql`SELECT COUNT(*) as count FROM users WHERE email = ${testEmail}`);
      const userCount = users.rows?.[0]?.count || 0;
      setTestResult(`✅ Usuário criado/atualizado com sucesso! Usuário encontrado: ${userCount > 0 ? 'Sim' : 'Não'}`);
      toast({
        title: "Sucesso",
        description: "Usuário de teste criado com sucesso.",
      });
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Erro desconhecido';
      setTestResult(`❌ Erro ao criar usuário: ${errorMsg}`);
      toast({
        title: "Erro",
        description: "Falha ao criar usuário de teste.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <h4 className="font-medium">Teste de Criação de Usuário</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="test-email">Email de Teste</Label>
          <Input
            id="test-email"
            value={testEmail}
            onChange={(e) => setTestEmail(e.target.value)}
            placeholder="email@teste.com"
          />
        </div>
        <div>
          <Label htmlFor="test-name">Nome de Teste</Label>
          <Input
            id="test-name"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="Nome do usuário"
          />
        </div>
      </div>
      <Button 
        onClick={testUserCreation} 
        disabled={isLoading || !testEmail || !testName}
        className="w-full"
      >
        {isLoading ? 'Criando...' : 'Criar Usuário Teste'}
      </Button>
    </div>
  );
};

export default DatabaseUserTest;
