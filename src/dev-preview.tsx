// Entry APENAS de desenvolvimento (gitignorado, fora do bundle de produção):
// renderiza as calculadoras sem passar pelo login/ProtectedRoute, para conferir
// visualmente mudanças de UI. Acessar em /dev-preview.html?tab=placas
// Não importado por nada em produção — `index.html` continua sendo o entry real.
import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { AuthProvider } from './contexts/AuthContext';
import { CotacaoProvider } from './contexts/CotacaoContext';
import { Toaster as Sonner } from './components/ui/sonner';
import { PricingConfig, defaultConfig } from './types/pricing';
import { migrateConfig } from './utils/productOptions';
import ModernHeader from './components/ModernHeader';
import ModernTabs from './components/ModernTabs';
import ModernCalculatorWrapper from './components/ModernCalculatorWrapper';
import CotacaoBar from './components/CotacaoBar';
import SettingsPanel from './components/SettingsPanel';
import GuiaPanel from './components/guia/GuiaPanel';
import AdesivosCalculator from './components/calculators/AdesivosCalculator';
import LonaCalculator from './components/calculators/LonaCalculator';
import PlacasCalculator from './components/calculators/PlacasCalculator';
import FachadaManualCalculator from './components/calculators/FachadaManualCalculator';
import ToldoCalculator from './components/calculators/ToldoCalculator';
import LetraCaixaCalculator from './components/calculators/LetraCaixaCalculator';
import VidroCalculator from './components/calculators/VidroCalculator';
import LuminosoCalculator from './components/calculators/LuminosoCalculator';
import LaserManualCalculator from './components/calculators/LaserManualCalculator';
import DtfManualCalculator from './components/calculators/DtfManualCalculator';
import CavaletesCalculator from './components/calculators/CavaletesCalculator';

const TITLES: Record<string, string> = {
  adesivos: 'Calculadora de Adesivos',
  lona: 'Calculadora de Lona',
  placas: 'Calculadora de Placas',
  fachada: 'Calculadora de Fachada Simples',
  toldo: 'Calculadora de Toldo',
  'letra-caixa': 'Calculadora de Letra Caixa',
  vidro: 'Calculadora de Vidro Temperado',
  luminoso: 'Calculadora de Luminoso',
  laser: 'Calculadora de Laser',
  dtf: 'Calculadora de DTF',
  cavaletes: 'Calculadora de Cavaletes',
};

const Preview: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const [activeTab, setActiveTab] = useState(params.get('tab') || 'placas');
  const [showSettings, setShowSettings] = useState(params.get('settings') === '1');
  const [showGuia, setShowGuia] = useState(params.get('guia') === '1');
  const [config, setConfig] = useState<PricingConfig>(migrateConfig(defaultConfig));

  const render = () => {
    switch (activeTab) {
      case 'adesivos':
        return <AdesivosCalculator config={config.adesivo} etiquetasConfig={config.etiquetas} />;
      case 'lona':
        return <LonaCalculator config={config.lona} />;
      case 'placas':
        return <PlacasCalculator configPS={config.placaPS} configACM={config.placaACM} />;
      case 'fachada':
        return <FachadaManualCalculator config={config.fachada} />;
      case 'toldo':
        return <ToldoCalculator config={config.toldo} />;
      case 'letra-caixa':
        return <LetraCaixaCalculator />;
      case 'vidro':
        return <VidroCalculator />;
      case 'luminoso':
        return <LuminosoCalculator config={config.luminoso} fullConfig={config} />;
      case 'laser':
        return <LaserManualCalculator config={config.laser} />;
      case 'dtf':
        return <DtfManualCalculator config={config.dtf} />;
      case 'cavaletes':
        return <CavaletesCalculator />;
      default:
        return <AdesivosCalculator config={config.adesivo} etiquetasConfig={config.etiquetas} />;
    }
  };

  if (showGuia) {
    return <GuiaPanel onClose={() => setShowGuia(false)} />;
  }

  if (showSettings) {
    return (
      <SettingsPanel
        config={config}
        onSave={(c) => { setConfig(c); setShowSettings(false); }}
        onClose={() => setShowSettings(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <ModernHeader
        onSettingsClick={() => setShowSettings(true)}
        onGuiaClick={() => setShowGuia(true)}
      />
      <ModernTabs activeTab={activeTab} onTabChange={setActiveTab} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ModernCalculatorWrapper title={TITLES[activeTab]}>{render()}</ModernCalculatorWrapper>
      </div>
      <CotacaoBar />
    </div>
  );
};

createRoot(document.getElementById('root')!).render(
  <AuthProvider>
    <CotacaoProvider>
      <Sonner />
      <Preview />
    </CotacaoProvider>
  </AuthProvider>
);
