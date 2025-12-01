
import React from 'react';
import { Calculator, Settings, Download } from 'lucide-react';
import { Button } from './ui/button';
import { useBudgets } from '../hooks/useBudgets';

interface ModernHeaderProps {
  onSettingsClick: () => void;
}

const ModernHeader: React.FC<ModernHeaderProps> = ({ onSettingsClick }) => {
  const { currentBudget, exportToPDF } = useBudgets();

  const handleExport = () => {
    if (currentBudget) {
      exportToPDF(currentBudget);
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg">
                <Calculator className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Precificação CV
                </h1>
                {currentBudget && (
                  <p className="text-muted-foreground text-sm">
                    Orçamento: {currentBudget.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            {currentBudget && (
              <Button variant="outline" size="sm" onClick={handleExport} className="hover:bg-accent/50">
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={onSettingsClick} className="hover:bg-accent/50">
              <Settings className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Configurações</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModernHeader;
