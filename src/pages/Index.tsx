
import React, { useState, useEffect } from 'react';
import AdesivosCalculator from '../components/calculators/AdesivosCalculator';
import LonaCalculator from '../components/calculators/LonaCalculator';
import PlacasCalculator from '../components/calculators/PlacasCalculator';
import FachadaCalculator from '../components/calculators/FachadaCalculator';
import LetraCaixaCalculator from '../components/calculators/LetraCaixaCalculator';
import VidroCalculator from '../components/calculators/VidroCalculator';
import LuminosoCalculator from '../components/calculators/LuminosoCalculator';
import LaserCalculator from '../components/calculators/LaserCalculator';
import DtfCalculator from '../components/calculators/DtfCalculator';
import CavaletesCalculator from '../components/calculators/CavaletesCalculator';
import SettingsPanel from '../components/SettingsPanel';
import ModernHeader from '../components/ModernHeader';
import ModernTabs from '../components/ModernTabs';
import ModernCalculatorWrapper from '../components/ModernCalculatorWrapper';
import CotacaoBar from '../components/CotacaoBar';
import { PricingConfig, defaultConfig } from '../types/pricing';
import { migrateConfig } from '../utils/productOptions';
import { useAuth } from '../contexts/AuthContext';
import { configService } from '../services/supabase/configService';
import { toast } from 'sonner';

const Index = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('adesivos');
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<PricingConfig>(migrateConfig(defaultConfig));

  useEffect(() => {
    const loadConfig = async () => {
      if (!user) return;

      // Função para fazer deep merge de configurações
      const deepMergeConfig = (
        defaultCfg: PricingConfig,
        loadedCfg: Record<string, unknown>
      ): PricingConfig => {
        const merged = { ...defaultCfg };

        // Para cada seção, fazer merge profundo
        (Object.keys(defaultCfg) as (keyof PricingConfig)[]).forEach((key) => {
          const loadedValue = loadedCfg[key];
          if (loadedValue && typeof loadedValue === 'object' && !Array.isArray(loadedValue)) {
            merged[key] = {
              ...defaultCfg[key],
              ...(loadedValue as object),
            } as PricingConfig[typeof key];
          } else if (loadedValue !== undefined) {
            merged[key] = loadedValue as PricingConfig[typeof key];
          }
        });

        return merged;
      };

      try {
        const supabaseConfig = await configService.getPricingConfig(user.id);

        if (supabaseConfig) {
          // Deep merge com defaultConfig para garantir que novos campos sejam incluídos
          const mergedConfig = migrateConfig(deepMergeConfig(defaultConfig, supabaseConfig));
          setConfig(mergedConfig);
        } else {
          const savedConfig = localStorage.getItem('pricingConfig');
          if (savedConfig) {
            const localConfig = JSON.parse(savedConfig);
            // Deep merge com defaultConfig para garantir que novos campos sejam incluídos
            const mergedConfig = migrateConfig(deepMergeConfig(defaultConfig, localConfig));
            setConfig(mergedConfig);
            await configService.savePricingConfig(user.id, mergedConfig);
          }
        }
      } catch (error) {
        console.error('Erro ao carregar configurações:', error);
        const savedConfig = localStorage.getItem('pricingConfig');
        if (savedConfig) {
          const localConfig = JSON.parse(savedConfig);
          // Deep merge com defaultConfig para garantir que novos campos sejam incluídos
          const mergedConfig = migrateConfig(deepMergeConfig(defaultConfig, localConfig));
          setConfig(mergedConfig);
        }
      }
    };

    loadConfig();
  }, [user]);

  const saveConfig = async (newConfig: PricingConfig) => {
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    try {
      await configService.savePricingConfig(user.id, newConfig);
      setConfig(newConfig);
      localStorage.setItem('pricingConfig', JSON.stringify(newConfig));
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar configurações');
    }
  };

  const getTabTitle = () => {
    const titles: Record<string, string> = {
      'adesivos': 'Calculadora de Adesivos',
      'lona': 'Calculadora de Lona',
      'placas': 'Calculadora de Placas',
      'fachada': 'Calculadora de Fachada Simples',
      'letra-caixa': 'Calculadora de Letra Caixa',
      'vidro': 'Calculadora de Vidro Temperado',
      'luminoso': 'Calculadora de Luminoso',
      'laser': 'Calculadora de Laser',
      'dtf': 'Calculadora de DTF',
      'cavaletes': 'Calculadora de Cavaletes',
    };
    return titles[activeTab];
  };

  const renderCalculator = () => {
    switch (activeTab) {
      case 'adesivos':
        return <AdesivosCalculator />;
      case 'lona':
        return <LonaCalculator />;
      case 'placas':
        return <PlacasCalculator />;
      case 'fachada':
        return <FachadaCalculator config={config.fachada} fullConfig={config} />;
      case 'letra-caixa':
        return <LetraCaixaCalculator />;
      case 'vidro':
        return <VidroCalculator />;
      case 'luminoso':
        return <LuminosoCalculator config={config.luminoso} fullConfig={config} />;
      case 'laser':
        return <LaserCalculator config={config.laser} fullConfig={config} />;
      case 'dtf':
        return <DtfCalculator />;
      case 'cavaletes':
        return <CavaletesCalculator />;
      default:
        return <AdesivosCalculator />;
    }
  };

  if (showSettings) {
    return (
      <SettingsPanel 
        config={config} 
        onSave={saveConfig}
        onClose={() => setShowSettings(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      {/* Header */}
      <ModernHeader onSettingsClick={() => setShowSettings(true)} />

      {/* Tab Navigation */}
      <ModernTabs activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Calculator Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ModernCalculatorWrapper title={getTabTitle()}>
          {renderCalculator()}
        </ModernCalculatorWrapper>
      </div>

      {/* Carrinho de cotação (acumula itens de qualquer aba) */}
      <CotacaoBar />

      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
    </div>
  );
};

export default Index;
