
import React from 'react';
import { Settings, Save, X, Search } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface SettingsHeaderProps {
  onSave: () => void;
  onClose: () => void;
  search: string;
  onSearchChange: (value: string) => void;
}

const SettingsHeader: React.FC<SettingsHeaderProps> = ({ onSave, onClose, search, onSearchChange }) => {
  return (
    <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
              Configurações
            </h1>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Buscar seção..."
                aria-label="Buscar seção"
                className="pl-9 bg-background/70"
              />
            </div>
            <Button variant="outline" onClick={onClose} aria-label="Cancelar" className="shrink-0">
              <X className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Cancelar</span>
            </Button>
            <Button
              onClick={onSave}
              aria-label="Salvar configurações"
              className="shrink-0 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl"
            >
              <Save className="w-4 h-4 md:mr-2" />
              <span className="hidden md:inline">Salvar</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsHeader;
