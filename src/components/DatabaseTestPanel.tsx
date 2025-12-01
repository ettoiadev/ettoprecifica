
import React, { useState } from 'react';
import { Alert, AlertDescription } from './ui/alert';
import DatabaseConnectionTest from './database/DatabaseConnectionTest';
import DatabaseMigrationTest from './database/DatabaseMigrationTest';
import DatabaseTableList from './database/DatabaseTableList';
import DatabaseUserTest from './database/DatabaseUserTest';
import { db } from '../lib/db/connection';

const DatabaseTestPanel: React.FC = () => {
  const [testResult, setTestResult] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const isDatabaseAvailable = !!db && !!import.meta.env.VITE_DATABASE_URL;

  if (!isDatabaseAvailable) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          <strong>Banco de dados não configurado</strong>
          <br />
          Configure a variável VITE_DATABASE_URL para usar as funcionalidades do banco de dados.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DatabaseConnectionTest
          isDatabaseAvailable={isDatabaseAvailable}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setTestResult={setTestResult}
        />
        
        <DatabaseMigrationTest
          isDatabaseAvailable={isDatabaseAvailable}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setTestResult={setTestResult}
        />
        
        <DatabaseTableList
          isDatabaseAvailable={isDatabaseAvailable}
          isLoading={isLoading}
          setIsLoading={setIsLoading}
          setTestResult={setTestResult}
        />
      </div>

      <DatabaseUserTest
        isDatabaseAvailable={isDatabaseAvailable}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        setTestResult={setTestResult}
      />

      {testResult && (
        <Alert className={testResult.includes('❌') ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          <AlertDescription>
            <pre className="whitespace-pre-wrap text-sm">{testResult}</pre>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default DatabaseTestPanel;
