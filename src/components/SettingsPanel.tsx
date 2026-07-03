
import React, { useState, useMemo } from 'react';
import { PricingConfig } from '../types/pricing';
import { Package, Percent, SlidersHorizontal, Info } from 'lucide-react';
import SettingsLayout from './settings/SettingsLayout';
import SettingsHeader from './settings/SettingsHeader';
import ConfigSection from './settings/ConfigSection';
import BudgetObservationsSettings from './settings/BudgetObservationsSettings';
import { settingsConfig } from './settings/settingsConfig';
import { convertConfigToCurrency, convertCurrencyToNumbers } from './settings/configUtils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Badge } from './ui/badge';

interface Props {
  config: PricingConfig;
  onSave: (config: PricingConfig) => void;
  onClose: () => void;
}

// Agrupamento das seções para navegação por abas
const PRODUTO_SECTIONS = ['adesivo', 'lona', 'placaPS', 'placaACM', 'fachada', 'letraCaixa', 'vidro', 'luminoso', 'laser'];
const TAXA_SECTIONS = ['notaFiscal', 'arteFinal', 'cartaoCredito', 'instalacao'];

const SettingsPanel: React.FC<Props> = ({ config, onSave, onClose }) => {
  const [editConfig, setEditConfig] = useState(convertConfigToCurrency(config));
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('produtos');

  const handleSave = () => {
    const numericConfig = convertCurrencyToNumbers(editConfig);
    onSave(numericConfig);
    onClose();
  };

  const updateConfig = (section: string, field: string, value: string | object) => {
    setEditConfig(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const normalizedSearch = search.trim().toLowerCase();
  const matchesSearch = (title: string) =>
    normalizedSearch === '' || title.toLowerCase().includes(normalizedSearch);

  const produtoSections = useMemo(
    () => settingsConfig.filter(s => PRODUTO_SECTIONS.includes(s.section) && matchesSearch(s.title)),
    [normalizedSearch]
  );
  const taxaSections = useMemo(
    () => settingsConfig.filter(s => TAXA_SECTIONS.includes(s.section) && matchesSearch(s.title)),
    [normalizedSearch]
  );

  const renderSections = (sections: typeof settingsConfig) => {
    if (sections.length === 0) {
      return (
        <div className="text-center py-16 text-gray-500">
          Nenhuma seção encontrada para "{search}".
        </div>
      );
    }
    return (
      <div className="space-y-6">
        {sections.map((sectionConfig) => (
          <ConfigSection
            key={sectionConfig.section}
            title={sectionConfig.title}
            section={sectionConfig.section}
            fields={sectionConfig.fields}
            editConfig={editConfig}
            updateConfig={updateConfig}
          />
        ))}
      </div>
    );
  };

  return (
    <SettingsLayout>
      <SettingsHeader onSave={handleSave} onClose={onClose} search={search} onSearchChange={setSearch} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full max-w-xl grid-cols-3 mb-6">
            <TabsTrigger value="produtos" className="gap-2">
              <Package className="w-4 h-4" />
              Produtos
              {normalizedSearch !== '' && (
                <Badge variant="secondary" className="ml-1">{produtoSections.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="taxas" className="gap-2">
              <Percent className="w-4 h-4" />
              Taxas &amp; Serviços
              {normalizedSearch !== '' && (
                <Badge variant="secondary" className="ml-1">{taxaSections.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="geral" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Geral
            </TabsTrigger>
          </TabsList>

          <TabsContent value="produtos">
            <div className="mb-4 flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
              <Info className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Cada produto lista suas opções. Use <strong>Adicionar</strong>, o lápis (editar) ou a
                lixeira (excluir) para gerenciar preços e materiais. Produtos por m² têm mínimo de R$ 20,00.
              </span>
            </div>
            {renderSections(produtoSections)}
          </TabsContent>

          <TabsContent value="taxas">
            {renderSections(taxaSections)}
          </TabsContent>

          <TabsContent value="geral">
            <div className="space-y-6">
              {/* Status da Conexão com Supabase */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Status do Banco de Dados
                </h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Conectado
                    </span>
                    <span className="text-gray-600">Supabase - Banco de dados em nuvem</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    Suas configurações e orçamentos são salvos automaticamente e sincronizados na nuvem.
                  </p>
                </div>
              </div>

              {/* Configurações das Observações do Orçamento */}
              <BudgetObservationsSettings />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </SettingsLayout>
  );
};

export default SettingsPanel;
