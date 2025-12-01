
import React from 'react';
import { Button } from '../ui/button';
import { Copy } from 'lucide-react';

interface BudgetHeaderProps {
  onCopyBudget: () => void;
}

const BudgetHeader: React.FC<BudgetHeaderProps> = ({ onCopyBudget }) => {
  return (
    <div className="flex justify-between items-center mb-4">
      <h3 className="section-header mb-0">Resumo do Orçamento</h3>
      <Button
        variant="outline"
        size="sm"
        onClick={onCopyBudget}
        className="flex items-center gap-2"
      >
        <Copy className="w-4 h-4" />
        Copiar
      </Button>
    </div>
  );
};

export default BudgetHeader;
