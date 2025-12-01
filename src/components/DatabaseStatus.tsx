
import React from 'react';
import { useDatabase } from '../hooks/useDatabase';
import { Alert, AlertDescription } from './ui/alert';
import { Skeleton } from './ui/skeleton';
import { Database, Loader, CheckCircle, XCircle } from 'lucide-react';

const DatabaseStatus: React.FC = () => {
  const { isInitialized, isInitializing, error } = useDatabase();

  if (isInitializing) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <Loader className="h-4 w-4 animate-spin text-blue-600" />
        <span className="text-sm text-blue-800">Conectando ao banco de dados...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4">
        <XCircle className="h-4 w-4" />
        <AlertDescription className="ml-2">
          <strong>Erro na conexão:</strong> {error}
          <br />
          <span className="text-xs mt-1 block">
            Verifique se a variável VITE_DATABASE_URL está configurada corretamente.
          </span>
        </AlertDescription>
      </Alert>
    );
  }

  if (isInitialized) {
    return (
      <div className="flex items-center space-x-2 p-3 bg-green-50 rounded-lg border border-green-200">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <span className="text-sm text-green-800">Conectado ao Neon Database</span>
        <Database className="h-4 w-4 text-green-600" />
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
      <Database className="h-4 w-4 text-gray-600" />
      <span className="text-sm text-gray-600">Status do banco: Desconectado</span>
    </div>
  );
};

export default DatabaseStatus;
