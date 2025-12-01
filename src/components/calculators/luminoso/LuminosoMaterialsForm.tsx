
import React from 'react';
import { LuminosoConfig, formatCurrency } from '../../../types/pricing';
import { luminosoMaterials } from '../../../utils/luminosoMaterials';

interface Props {
  config: LuminosoConfig;
  quantities: Record<string, number>;
  onQuantityChange: (itemId: string, value: number) => void;
}

const LuminosoMaterialsForm: React.FC<Props> = ({
  config,
  quantities,
  onQuantityChange,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-4">
        Materiais Adicionais
      </label>
      <div className="space-y-4">
        {luminosoMaterials.map((material) => {
          const materialPrice = config[material.id] as number;
          return (
            <div key={material.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700">
                  {material.label}
                </label>
                <p className="text-xs text-gray-500">
                  {formatCurrency(materialPrice)}/{material.unit}
                </p>
              </div>
              <div className="w-24">
                <input
                  type="number"
                  min="0"
                  value={quantities[material.id] || ''}
                  onChange={(e) => onQuantityChange(material.id, parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center"
                  placeholder="0"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LuminosoMaterialsForm;
