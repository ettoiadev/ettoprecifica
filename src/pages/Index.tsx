
import React, { useState, useEffect } from 'react';
import AdesivoCalculator from '../components/calculators/AdesivoCalculator';
import LonaCalculator from '../components/calculators/LonaCalculator';
import PlacaPSCalculator from '../components/calculators/PlacaPSCalculator';
import PlacaACMCalculator from '../components/calculators/PlacaACMCalculator';
import FachadaCalculator from '../components/calculators/FachadaCalculator';
import LetraCaixaCalculator from '../components/calculators/LetraCaixaCalculator';
import VidroCalculator from '../components/calculators/VidroCalculator';
import LuminosoCalculator from '../components/calculators/LuminosoCalculator';
import LaserCalculator from '../components/calculators/LaserCalculator';
import SettingsPanel from '../components/SettingsPanel';
import ModernHeader from '../components/ModernHeader';
import ModernTabs from '../components/ModernTabs';
import ModernCalculatorWrapper from '../components/ModernCalculatorWrapper';
import { PricingConfig, defaultConfig } from '../types/pricing';
import { useAuth } from '../contexts/AuthContext';
import { configService } from '../services/supabase/configService';
import { toast } from 'sonner';

const Index = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('adesivo');
  const [showSettings, setShowSettings] = useState(false);
  const [config, setConfig] = useState<PricingConfig>(defaultConfig);

  useEffect(() => {
    const loadConfig = async () => {
      if (!user) return;

      // Função para fazer deep merge de configurações
      const deepMergeConfig = (defaultCfg: PricingConfig, loadedCfg: any): PricingConfig => {
        const merged = { ...defaultCfg };
        
        // Para cada seção, fazer merge profundo
        Object.keys(defaultCfg).forEach((key) => {
          if (loadedCfg[key] && typeof loadedCfg[key] === 'object') {
            merged[key as keyof PricingConfig] = {
              ...defaultCfg[key as keyof PricingConfig],
              ...loadedCfg[key]
            } as any;
          } else if (loadedCfg[key] !== undefined) {
            merged[key as keyof PricingConfig] = loadedCfg[key];
          }
        });
        
        return merged;
      };

      try {
        const supabaseConfig = await configService.getPricingConfig(user.id);
        
        if (supabaseConfig) {
          // Deep merge com defaultConfig para garantir que novos campos sejam incluídos
          const mergedConfig = deepMergeConfig(defaultConfig, supabaseConfig);
          setConfig(mergedConfig);
        } else {
          const savedConfig = localStorage.getItem('pricingConfig');
          if (savedConfig) {
            const localConfig = JSON.parse(savedConfig);
            // Deep merge com defaultConfig para garantir que novos campos sejam incluídos
            const mergedConfig = deepMergeConfig(defaultConfig, localConfig);
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
          const mergedConfig = deepMergeConfig(defaultConfig, localConfig);
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
      'adesivo': 'Calculadora de Adesivo',
      'lona': 'Calculadora de Lona',
      'placa-ps': 'Calculadora de Placa em PS',
      'placa-acm': 'Calculadora de Placa em ACM',
      'fachada': 'Calculadora de Fachada Simples',
      'letra-caixa': 'Calculadora de Letra Caixa em PVC',
      'vidro': 'Calculadora de Vidro Temperado',
      'luminoso': 'Calculadora de Luminoso',
      'laser': 'Calculadora de Laser',
    };
    return titles[activeTab];
  };

  const renderCalculator = () => {
    switch (activeTab) {
      case 'adesivo':
        return <AdesivoCalculator config={config.adesivo} fullConfig={config} />;
      case 'lona':
        return <LonaCalculator config={config.lona} fullConfig={config} />;
      case 'placa-ps':
        return <PlacaPSCalculator config={config.placaPS} fullConfig={config} />;
      case 'placa-acm':
        return <PlacaACMCalculator config={config.placaACM} fullConfig={config} />;
      case 'fachada':
        return <FachadaCalculator config={config.fachada} fullConfig={config} />;
      case 'letra-caixa':
        return <LetraCaixaCalculator config={config.letraCaixa} fullConfig={config} />;
      case 'vidro':
        return <VidroCalculator config={config.vidro} fullConfig={config} />;
      case 'luminoso':
        return <LuminosoCalculator config={config.luminoso} fullConfig={config} />;
      case 'laser':
        return <LaserCalculator config={config.laser} fullConfig={config} />;
      default:
        return <AdesivoCalculator config={config.adesivo} fullConfig={config} />;
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

      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>
    </div>
  );
};

export default Index;
