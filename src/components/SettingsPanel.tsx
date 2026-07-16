
import React, { useState, useMemo } from 'react';
import { PricingConfig } from '../types/pricing';
import { Info } from 'lucide-react';
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

const GERAL = '__geral__';

// Agrupamento das seções para a navegação lateral
// Todos os produtos e taxas são precificados pelo motor da skill (Edge Functions).
// Não há mais configuração de preço editável no app — resta apenas "Geral"
// (status do banco + observações de orçamento).
const SECTION_GROUPS: { label: string; sections: string[] }[] = [
  { label: 'Geral', sections: [GERAL] },
];

const PRODUTO_SECTIONS: string[] = [];

const SettingsPanel: React.FC<Props> = ({ config, onSave, onClose }) => {
  const [editConfig, setEditConfig] = useState(convertConfigToCurrency(config));
  const [search, setSearch] = useState('');
  const [activeSection, setActiveSection] = useState(GERAL);

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

  // Título de cada seção (a partir do settingsConfig; "Geral" é especial)
  const titleFor = (section: string) =>
    section === GERAL ? 'Geral' : (settingsConfig.find(s => s.section === section)?.title || section);

  const normalizedSearch = search.trim().toLowerCase();

  // Grupos filtrados pela busca (mantém apenas seções cujo título casa)
  const filteredGroups = useMemo(() => {
    return SECTION_GROUPS
      .map(group => ({
        ...group,
        sections: group.sections.filter(s =>
          normalizedSearch === '' || titleFor(s).toLowerCase().includes(normalizedSearch)
        ),
      }))
      .filter(group => group.sections.length > 0);
  }, [normalizedSearch]);

  const visibleSections = filteredGroups.flatMap(g => g.sections);
  // Se a seção ativa sumiu do filtro, cai para a primeira visível
  const effectiveActive = visibleSections.includes(activeSection)
    ? activeSection
    : (visibleSections[0] ?? '');

  const isProduct = PRODUTO_SECTIONS.includes(effectiveActive);
  const activeConfig = settingsConfig.find(s => s.section === effectiveActive);

  const navButtonClass = (section: string) =>
    `w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
      effectiveActive === section
        ? 'bg-blue-50 text-blue-700 font-semibold border border-blue-200'
        : 'text-gray-700 hover:bg-gray-100 border border-transparent'
    }`;

  const renderContent = () => {
    if (visibleSections.length === 0) {
      return (
        <div className="text-center py-16 text-gray-500">
          Nenhuma seção encontrada para "{search}".
        </div>
      );
    }

    if (effectiveActive === GERAL) {
      return (
        <div className="space-y-6">
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

          <BudgetObservationsSettings />
        </div>
      );
    }

    if (!activeConfig) return null;

    return (
      <div className="space-y-4">
        {isProduct && (
          <div className="flex items-start gap-2 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
            <Info className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Use <strong>Adicionar</strong>, o lápis (editar) ou a lixeira (excluir) para gerenciar as
              opções deste produto. Produtos por m² têm mínimo de R$ 20,00.
            </span>
          </div>
        )}
        <ConfigSection
          key={activeConfig.section}
          title={activeConfig.title}
          section={activeConfig.section}
          fields={activeConfig.fields}
          editConfig={editConfig}
          updateConfig={updateConfig}
        />
      </div>
    );
  };

  return (
    <SettingsLayout>
      <SettingsHeader onSave={handleSave} onClose={onClose} search={search} onSearchChange={setSearch} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Seletor de seção (mobile) */}
        <div className="md:hidden mb-4">
          <select
            value={effectiveActive}
            onChange={(e) => setActiveSection(e.target.value)}
            aria-label="Selecionar seção"
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground input-enhanced"
          >
            {filteredGroups.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.sections.map(section => (
                  <option key={section} value={section}>{titleFor(section)}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        <div className="flex flex-col md:flex-row gap-6">
          {/* Navegação lateral (desktop) */}
          <nav aria-label="Seções de configuração" className="hidden md:block md:w-56 md:shrink-0 md:sticky md:top-24 self-start space-y-4">
            {filteredGroups.map(group => (
              <div key={group.label}>
                <div className="px-3 mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {group.label}
                </div>
                <div className="space-y-1">
                  {group.sections.map(section => (
                    <button
                      key={section}
                      type="button"
                      onClick={() => setActiveSection(section)}
                      className={navButtonClass(section)}
                    >
                      {titleFor(section)}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>

          {/* Conteúdo da seção selecionada */}
          <div className="flex-1 min-w-0">
            {renderContent()}
          </div>
        </div>
      </div>
    </SettingsLayout>
  );
};

export default SettingsPanel;
