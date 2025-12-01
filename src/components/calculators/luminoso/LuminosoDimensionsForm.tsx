
import React from 'react';
import { LuminosoConfig, formatCurrency } from '../../../types/pricing';

interface Props {
  larguraLona: number;
  alturaLona: number;
  quantidadeLona: number;
  config: LuminosoConfig;
  onLarguraChange: (value: number) => void;
  onAlturaChange: (value: number) => void;
  onQuantidadeChange: (value: number) => void;
}

const LuminosoDimensionsForm: React.FC<Props> = ({
  larguraLona,
  alturaLona,
  quantidadeLona,
  config,
  onLarguraChange,
  onAlturaChange,
  onQuantidadeChange,
}) => {
  const areaLona = larguraLona * alturaLona;
  const areaLonaTotal = areaLona * quantidadeLona;

  const handleLarguraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onLarguraChange(Math.max(0, value)); // Validação para não aceitar valores negativos
  };

  const handleAlturaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onAlturaChange(Math.max(0, value)); // Validação para não aceitar valores negativos
  };

  const handleQuantidadeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 1;
    onQuantidadeChange(Math.max(1, value)); // Mínimo 1 unidade
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-4">
        Dimensões da Lona Backlight
      </label>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Largura backlight (m)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={larguraLona || ''}
            onChange={handleLarguraChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Altura backlight (m)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={alturaLona || ''}
            onChange={handleAlturaChange}
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
            onChange={handleQuantidadeChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="1"
          />
        </div>
      </div>
      {areaLona > 0 && (
        <p className="text-sm text-gray-600 mt-2">
          Área unitária backlight: {areaLona.toFixed(2)} m² | Área total backlight: {areaLonaTotal.toFixed(2)} m² - Preço: {formatCurrency(config.lona)}/m²
        </p>
      )}
    </div>
  );
};

export default LuminosoDimensionsForm;
