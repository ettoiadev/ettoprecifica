
import React from 'react';
import { Calculator, Settings, Download, BookOpen } from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { useBudgets } from '../hooks/useBudgets';
import { envLabel, isProduction, versionLabel } from '../lib/version';

interface ModernHeaderProps {
  onSettingsClick: () => void;
  onGuiaClick: () => void;
}

const ModernHeader: React.FC<ModernHeaderProps> = ({ onSettingsClick, onGuiaClick }) => {
  const { currentBudget, exportToPDF } = useBudgets();

  const handleExport = () => {
    if (currentBudget) {
      exportToPDF(currentBudget);
    }
  };

  return (
    <div className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/*
          * `min-w-0` nos contêineres do título e `shrink-0` nos botões: sem
          * isso o bloco do título não encolhe abaixo do próprio conteúdo e
          * empurra os botões para fora da tela. No celular a página inteira
          * rolava 22px de lado — exatamente a largura do selo de ambiente, que
          * aparece fora de produção. Era invisível no site publicado e
          * atrapalhava justamente quem confere um Preview Deploy.
          */}
        <div className="flex justify-between items-center gap-2 py-4">
          <div className="flex items-center space-x-4 min-w-0">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 rounded-lg bg-primary shrink-0">
                <Calculator className="w-6 h-6 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Precificação CV
                  </h1>
                  <span className="text-xs text-muted-foreground">{versionLabel()}</span>
                  {!isProduction && (
                    <Badge variant="secondary" className="font-medium">
                      {envLabel()}
                    </Badge>
                  )}
                </div>
                {currentBudget && (
                  <p className="text-muted-foreground text-sm">
                    Orçamento: {currentBudget.name}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            {currentBudget && (
              <Button variant="outline" size="sm" onClick={handleExport} className="hover:bg-accent/50">
                <Download className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Exportar</span>
              </Button>
            )}

            <Button variant="outline" size="sm" onClick={onGuiaClick} className="hover:bg-accent/50">
              <BookOpen className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">Guia</span>
            </Button>

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
