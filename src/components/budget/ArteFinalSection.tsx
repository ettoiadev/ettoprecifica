
import React from 'react';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { formatCurrency, PricingConfig } from '../../types/pricing';

interface ArteFinalSectionProps {
  arteFinal: boolean;
  onArteFinalChange: (checked: boolean | "indeterminate") => void;
  config: PricingConfig;
}

const ArteFinalSection: React.FC<ArteFinalSectionProps> = ({
  arteFinal,
  onArteFinalChange,
  config
}) => {
  if (!config?.arteFinal) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <Checkbox
          id="arteFinal"
          checked={arteFinal}
          onCheckedChange={onArteFinalChange}
          className="checkbox-enhanced"
        />
        <Label htmlFor="arteFinal" className="form-label">
          Arte Final (+{formatCurrency(config.arteFinal.valor)})
        </Label>
      </div>
      {arteFinal && (
        <div className="flex justify-between text-sm text-primary ml-6">
          <span>Arte Final:</span>
          <span className="currency-value">+{formatCurrency(config.arteFinal.valor)}</span>
        </div>
      )}
    </div>
  );
};

export default ArteFinalSection;
