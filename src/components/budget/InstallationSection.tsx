
import React from 'react';
import { Label } from '../ui/label';
import { formatCurrency, PricingConfig } from '../../types/pricing';
import { getProductOptions } from '../../utils/productOptions';

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
      <div className="space-y-3 pt-4 border-t border-border/60">
        <Label htmlFor="instalacao" className="form-label">
          Custo de Instalação:
        </Label>
        <p className="text-red-500">Configuração de instalação não encontrada</p>
      </div>
    );
  }

  // Localidades vêm do modelo unificado (editável via Configurações)
  const instalacaoOptions = getProductOptions('instalacao', config);
  const selectedOption = instalacaoOptions.find((o) => o.id === instalacao);

  return (
    <div className="space-y-3 pt-4 border-t border-border/60">
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
          <option key={option.id} value={option.id}>
            {option.label} - {formatCurrency(option.price)}
          </option>
        ))}
      </select>
      {instalacao && selectedOption && (
        <div className="flex justify-between text-sm text-primary">
          <span>Instalação:</span>
          <span className="currency-value">+{formatCurrency(selectedOption.price)}</span>
        </div>
      )}
    </div>
  );
};

export default InstallationSection;
