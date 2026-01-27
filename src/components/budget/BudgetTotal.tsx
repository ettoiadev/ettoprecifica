
import React from 'react';
import { Separator } from '../ui/separator';
import { formatCurrency } from '../../types/pricing';

interface BudgetTotalProps {
  finalTotal: number;
  quantity?: string | number;
}

const BudgetTotal: React.FC<BudgetTotalProps> = ({ finalTotal, quantity }) => {
  const quantityNumber = typeof quantity === 'number' ? quantity : parseFloat(quantity || '');
  const hasValidQuantity = Number.isFinite(quantityNumber) && quantityNumber > 0;
  const unitValue = hasValidQuantity ? finalTotal / quantityNumber : 0;

  return (
    <>
      <Separator className="separator-enhanced" />
      {hasValidQuantity && (
        <div className="flex justify-between text-body text-sm">
          <span>Valor unitário:</span>
          <span className="currency-value">{formatCurrency(unitValue)}</span>
        </div>
      )}
      <div className="flex justify-between text-lg font-bold">
        <span className="text-title">Total:</span>
        <span className="currency-value text-lg">{formatCurrency(finalTotal)}</span>
      </div>
    </>
  );
};

export default BudgetTotal;
