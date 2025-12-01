
import React from 'react';
import { formatCurrency } from '../../../types/pricing';

interface Material {
  id: string;
  label: string;
  price: number;
  unit: string;
}

interface MateriaisAdicionaisFormProps {
  items: Material[];
  quantities: Record<string, number>;
  onQuantityChange: (itemId: string, value: number) => void;
}

const MateriaisAdicionaisForm: React.FC<MateriaisAdicionaisFormProps> = ({
  items,
  quantities,
  onQuantityChange,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-4">
        Materiais Adicionais
      </label>
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700">
                {item.label}
              </label>
              <p className="text-xs text-gray-500">
                {formatCurrency(item.price)}/{item.unit}
              </p>
            </div>
            <div className="w-24">
              <input
                type="number"
                min="0"
                value={quantities[item.id] || ''}
                onChange={(e) => onQuantityChange(item.id, parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                placeholder="0"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MateriaisAdicionaisForm;
