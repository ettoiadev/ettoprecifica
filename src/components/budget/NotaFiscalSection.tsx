
import React from 'react';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { formatCurrency, PricingConfig } from '../../types/pricing';

interface NotaFiscalSectionProps {
  notaFiscal: boolean;
  onNotaFiscalChange: (checked: boolean | "indeterminate") => void;
  config: PricingConfig;
  baseTotal: number;
}

const NotaFiscalSection: React.FC<NotaFiscalSectionProps> = ({
  notaFiscal,
  onNotaFiscalChange,
  config,
  baseTotal
}) => {
  if (!config?.notaFiscal) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center space-x-3">
        <Checkbox
          id="notaFiscal"
          checked={notaFiscal}
          onCheckedChange={onNotaFiscalChange}
          className="checkbox-enhanced"
        />
        <Label htmlFor="notaFiscal" className="form-label">
          Nota Fiscal (+{config.notaFiscal.percentual}%)
        </Label>
      </div>
      {notaFiscal && (
        <div className="flex justify-between text-sm text-primary ml-6">
          <span>Taxa Nota Fiscal:</span>
          <span className="currency-value">+{formatCurrency((baseTotal * config.notaFiscal.percentual) / 100)}</span>
        </div>
      )}
    </div>
  );
};

export default NotaFiscalSection;
