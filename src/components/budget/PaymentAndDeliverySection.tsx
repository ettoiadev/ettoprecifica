
import React, { useMemo } from 'react';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { formatCurrency, PricingConfig } from '../../types/pricing';

interface PaymentAndDeliverySectionProps {
  cartaoCredito: string;
  setCartaoCredito: (value: string) => void;
  prazoEntrega: string;
  setPrazoEntrega: (value: string) => void;
  config: PricingConfig;
  baseTotal: number;
}

const PaymentAndDeliverySection: React.FC<PaymentAndDeliverySectionProps> = ({
  cartaoCredito,
  setCartaoCredito,
  prazoEntrega,
  setPrazoEntrega,
  config,
  baseTotal
}) => {
  const cartaoOptions = useMemo(() => [
    { value: 'none', label: 'Não aplicar', taxa: 0 },
    { value: 'vista', label: 'Crédito à vista', taxa: config?.cartaoCredito?.creditoVista || 0 },
    { value: '2x', label: '2x', taxa: config?.cartaoCredito?.taxa2x || 0 },
    { value: '3x', label: '3x', taxa: config?.cartaoCredito?.taxa3x || 0 },
    { value: '4x', label: '4x', taxa: config?.cartaoCredito?.taxa4x || 0 },
    { value: '5x', label: '5x', taxa: config?.cartaoCredito?.taxa5x || 0 },
    { value: '6x', label: '6x', taxa: config?.cartaoCredito?.taxa6x || 0 },
    { value: '7x', label: '7x', taxa: config?.cartaoCredito?.taxa7x || 0 },
    { value: '8x', label: '8x', taxa: config?.cartaoCredito?.taxa8x || 0 },
    { value: '9x', label: '9x', taxa: config?.cartaoCredito?.taxa9x || 0 },
    { value: '10x', label: '10x', taxa: config?.cartaoCredito?.taxa10x || 0 },
    { value: '11x', label: '11x', taxa: config?.cartaoCredito?.taxa11x || 0 },
    { value: '12x', label: '12x', taxa: config?.cartaoCredito?.taxa12x || 0 },
  ], [config?.cartaoCredito]);

  const prazoOptions = useMemo(() => [
    { value: '3', label: '3 dias úteis' },
    { value: '7', label: '7 dias úteis' },
    { value: '15', label: '15 dias úteis' },
    { value: '30', label: '30 dias úteis' },
  ], []);

  const selectedCartaoOption = cartaoOptions.find(o => o.value === cartaoCredito);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Cartão de Crédito */}
      <div className="space-y-3">
        <Label className="form-label">
          Custos Cartão de Crédito:
        </Label>
        <Select value={cartaoCredito} onValueChange={setCartaoCredito}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o parcelamento" />
          </SelectTrigger>
          <SelectContent>
            {cartaoOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="cursor-pointer"
              >
                <div className="flex items-center justify-between w-full">
                  <span>{option.label}</span>
                  {option.taxa > 0 && (
                    <span className="ml-4 text-xs text-muted-foreground">
                      +{option.taxa.toFixed(2)}%
                    </span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {cartaoCredito && selectedCartaoOption && selectedCartaoOption.taxa > 0 && (
          <div className="flex justify-between text-sm text-primary px-1">
            <span>Taxa Cartão:</span>
            <span className="currency-value font-medium">
              +{formatCurrency((baseTotal * selectedCartaoOption.taxa) / 100)}
            </span>
          </div>
        )}
      </div>

      {/* Prazo de Entrega */}
      <div className="space-y-3">
        <Label className="form-label">
          Prazo de Entrega:
        </Label>
        <Select value={prazoEntrega} onValueChange={setPrazoEntrega}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Selecione o prazo" />
          </SelectTrigger>
          <SelectContent>
            {prazoOptions.map((option) => (
              <SelectItem 
                key={option.value} 
                value={option.value}
                className="cursor-pointer"
              >
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default PaymentAndDeliverySection;
