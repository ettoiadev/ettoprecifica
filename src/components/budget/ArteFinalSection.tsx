
import React from 'react';
import { Label } from '../ui/label';
import { formatCurrency, PricingConfig } from '../../types/pricing';

interface ArteFinalSectionProps {
  arteFinalId: string;
  onArteFinalChange: (id: string) => void;
  config: PricingConfig;
}

const ArteFinalSection: React.FC<ArteFinalSectionProps> = ({
  arteFinalId,
  onArteFinalChange,
  config
}) => {
  const options = config?.arteFinal?.customVariations || [];

  if (options.length === 0) {
    return null;
  }

  // Clicar na opção já selecionada desmarca (Arte Final é opcional)
  const handleSelect = (id: string) => {
    onArteFinalChange(arteFinalId === id ? '' : id);
  };

  const selected = options.find((o) => o.id === arteFinalId);

  return (
    <div className="space-y-3 pt-4 border-t border-border/60">
      <Label className="form-label">Arte Final:</Label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const isSelected = option.id === arteFinalId;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              className={`flex-1 min-w-[130px] px-3 py-2 rounded-md border text-left transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${
                isSelected
                  ? 'border-primary bg-primary/10 ring-2 ring-primary/30'
                  : 'border-border bg-background hover:bg-accent'
              }`}
            >
              <div className="text-sm font-medium text-foreground">{option.label}</div>
              <div className="text-xs text-muted-foreground">{formatCurrency(option.price)}</div>
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="flex justify-between text-sm text-primary">
          <span>Arte Final ({selected.label}):</span>
          <span className="currency-value">+{formatCurrency(selected.price)}</span>
        </div>
      )}
    </div>
  );
};

export default ArteFinalSection;
