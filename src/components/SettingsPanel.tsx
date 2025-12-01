
import React, { useState } from 'react';
import { PricingConfig } from '../types/pricing';
import SettingsLayout from './settings/SettingsLayout';
import SettingsHeader from './settings/SettingsHeader';
import ConfigSection from './settings/ConfigSection';
import BudgetObservationsSettings from './settings/BudgetObservationsSettings';
import { settingsConfig } from './settings/settingsConfig';
import { convertConfigToCurrency, convertCurrencyToNumbers } from './settings/configUtils';

interface Props {
  config: PricingConfig;
  onSave: (config: PricingConfig) => void;
  onClose: () => void;
}

const SettingsPanel: React.FC<Props> = ({ config, onSave, onClose }) => {
  const [editConfig, setEditConfig] = useState(convertConfigToCurrency(config));

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

  return (
    <SettingsLayout>
      <SettingsHeader onSave={handleSave} onClose={onClose} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg backdrop-blur-sm">
          <p className="text-blue-800">
            <strong>Importante:</strong> Todos os produtos que utilizam cálculo por m² têm um valor mínimo de R$ 20,00 automaticamente aplicado.
          </p>
        </div>

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

          {/* Configurações de Preços */}
          {settingsConfig.map((sectionConfig) => (
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
      </div>
    </SettingsLayout>
  );
};

export default SettingsPanel;
