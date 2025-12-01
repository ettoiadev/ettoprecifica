
import React from 'react';
import { Label } from '../ui/label';
import { formatCurrency, PricingConfig } from '../../types/pricing';

interface InstallationSectionProps {
  instalacao: string;
  setInstalacao: (value: string) => void;
  config: PricingConfig;
}

const InstallationSection: React.FC<InstallationSectionProps> = ({
  instalacao,
  setInstalacao,
  config
}) => {
  // Safety check for instalacao config
  if (!config?.instalacao) {
    console.error('Installation config is missing:', config);
    return (
      <div className="space-y-3">
        <Label htmlFor="instalacao" className="form-label">
          Custo de Instalação:
        </Label>
        <p className="text-red-500">Configuração de instalação não encontrada</p>
      </div>
    );
  }

  const instalacaoOptions = [
    { value: 'jacarei', label: 'Jacareí', price: config.instalacao.jacarei || 0 },
    { value: 'sjCampos', label: 'S.J.Campos', price: config.instalacao.sjCampos || 0 },
    { value: 'cacapavaTaubate', label: 'Caçapava/Taubaté', price: config.instalacao.cacapavaTaubate || 0 },
    { value: 'litoral', label: 'Litoral', price: config.instalacao.litoral || 0 },
    { value: 'guararemaSantaIsabel', label: 'Guararema/Sta Isabel', price: config.instalacao.guararemaSantaIsabel || 0 },
    { value: 'santaBranca', label: 'Sta Branca', price: config.instalacao.santaBranca || 0 },
    { value: 'saoPaulo', label: 'São Paulo', price: config.instalacao.saoPaulo || 0 },
  ];

  return (
    <div className="space-y-3">
      <Label htmlFor="instalacao" className="form-label">
        Custo de Instalação:
      </Label>
      <select
        id="instalacao"
        value={instalacao}
        onChange={(e) => setInstalacao(e.target.value)}
        className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-transparent input-enhanced"
      >
        <option value="">Selecione a localidade</option>
        {instalacaoOptions.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label} - {formatCurrency(option.price)}
          </option>
        ))}
      </select>
      {instalacao && (
        <div className="flex justify-between text-sm text-primary">
          <span>Instalação:</span>
          <span className="currency-value">+{formatCurrency(instalacaoOptions.find(o => o.value === instalacao)?.price || 0)}</span>
        </div>
      )}
    </div>
  );
};

export default InstallationSection;
