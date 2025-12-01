
import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { useToast } from '../../hooks/use-toast';
import { neon } from '@neondatabase/serverless';
import { Database, Eye, EyeOff, Save, TestTube } from 'lucide-react';

const DatabaseConnectionConfig: React.FC = () => {
  const [connectionString, setConnectionString] = useState('');
  const [showConnectionString, setShowConnectionString] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [testResult, setTestResult] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('databaseConnectionString');
    if (saved) {
      setConnectionString(saved);
    }
  }, []);

  const saveConnectionString = () => {
    if (!connectionString.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma string de conexão válida.",
        variant: "destructive",
      });
      return;
    }

    localStorage.setItem('databaseConnectionString', connectionString);
    // Trigger a page reload to reinitialize the database connection
    window.location.reload();
    
    toast({
      title: "Sucesso",
      description: "String de conexão salva. A página será recarregada para aplicar as mudanças.",
    });
  };

  const testConnection = async () => {
    if (!connectionString.trim()) {
      setTestResult('❌ Por favor, insira uma string de conexão');
      return;
    }

    setIsLoading(true);
    setTestResult('');

    try {
      const sql = neon(connectionString);
      const result = await sql`SELECT NOW() as current_time`;
      setTestResult('✅ Conexão testada com sucesso!');
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

  const clearConnection = () => {
    localStorage.removeItem('databaseConnectionString');
    setConnectionString('');
    setTestResult('');
    toast({
      title: "Conexão removida",
      description: "String de conexão removida. Recarregue a página para aplicar as mudanças.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-2">
        <Database className="h-5 w-5 text-blue-600" />
        <h3 className="text-lg font-medium">Configuração da Conexão com Banco de Dados</h3>
      </div>

      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-blue-800">
          <strong>Como obter a string de conexão:</strong>
          <br />
          1. Acesse <a href="https://neon.tech" target="_blank" rel="noopener noreferrer" className="underline">neon.tech</a> e crie uma conta
          <br />
          2. Crie um novo projeto
          <br />
          3. Vá em "Connection Details" e copie a connection string
          <br />
          4. Cole aqui e salve para configurar a conexão
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div>
          <Label htmlFor="connection-string">String de Conexão do Neon Database</Label>
          <div className="relative">
            <Input
              id="connection-string"
              type={showConnectionString ? "text" : "password"}
              value={connectionString}
              onChange={(e) => setConnectionString(e.target.value)}
              placeholder="postgresql://user:password@host/database?sslmode=require"
              className="pr-10"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
              onClick={() => setShowConnectionString(!showConnectionString)}
            >
              {showConnectionString ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button 
            onClick={testConnection} 
            disabled={isLoading || !connectionString.trim()}
            variant="outline"
          >
            <TestTube className="h-4 w-4 mr-2" />
            {isLoading ? 'Testando...' : 'Testar Conexão'}
          </Button>

          <Button 
            onClick={saveConnectionString} 
            disabled={!connectionString.trim()}
          >
            <Save className="h-4 w-4 mr-2" />
            Salvar Configuração
          </Button>

          {connectionString && (
            <Button 
              onClick={clearConnection} 
              variant="destructive"
            >
              Remover Conexão
            </Button>
          )}
        </div>

        {testResult && (
          <Alert className={testResult.includes('❌') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
            <AlertDescription>
              {testResult}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default DatabaseConnectionConfig;
