
import React from 'react';
import { Separator } from '../ui/separator';
import { formatCurrency } from '../../types/pricing';

interface BudgetTotalProps {
  finalTotal: number;
}

const BudgetTotal: React.FC<BudgetTotalProps> = ({ finalTotal }) => {
  return (
    <>
      <Separator className="separator-enhanced" />
      <div className="flex justify-between text-lg font-bold">
        <span className="text-title">Total:</span>
        <span className="currency-value text-lg">{formatCurrency(finalTotal)}</span>
      </div>
    </>
  );
};

export default BudgetTotal;
