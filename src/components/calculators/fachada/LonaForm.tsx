
import React from 'react';
import { formatCurrency } from '../../../types/pricing';

interface LonaFormProps {
  larguraLona: number;
  alturaLona: number;
  quantidadeLona: number;
  lonaPrice: number;
  onLarguraChange: (value: number) => void;
  onAlturaChange: (value: number) => void;
  onQuantidadeChange: (value: number) => void;
}

const LonaForm: React.FC<LonaFormProps> = ({
  larguraLona,
  alturaLona,
  quantidadeLona,
  lonaPrice,
  onLarguraChange,
  onAlturaChange,
  onQuantidadeChange,
}) => {
  const areaLona = larguraLona * alturaLona;
  const areaLonaTotal = areaLona * quantidadeLona;

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-4">
        Dimensões da Lona
      </label>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Largura (m)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={larguraLona || ''}
            onChange={(e) => onLarguraChange(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Altura (m)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={alturaLona || ''}
            onChange={(e) => onAlturaChange(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Quantidade</label>
          <input
            type="number"
            min="1"
            value={quantidadeLona || ''}
            onChange={(e) => onQuantidadeChange(parseInt(e.target.value) || 1)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1"
          />
        </div>
      </div>
      {areaLona > 0 && (
        <p className="text-sm text-gray-600 mt-2">
          Área unitária: {areaLona.toFixed(2)} m² | Área total: {areaLonaTotal.toFixed(2)} m² - Preço: {formatCurrency(lonaPrice)}/m²
        </p>
      )}
    </div>
  );
};

export default LonaForm;
