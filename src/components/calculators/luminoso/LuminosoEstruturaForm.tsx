
import React from 'react';
import { LuminosoConfig, formatCurrency } from '../../../types/pricing';

interface EstruturaCalc {
  metrosLineares: number;
  barrasNecessarias: number;
  barrasInteiras: number;
  custoTotal: number;
  custoPorM2: number;
}

interface Props {
  larguraEstrutura: number;
  alturaEstrutura: number;
  travasHorizontais: number;
  travasVerticais: number;
  estruturaCalc: EstruturaCalc;
  estruturaConfig: LuminosoConfig['estruturaMetalica'];
  onLarguraChange: (value: number) => void;
  onAlturaChange: (value: number) => void;
  onTravasHorizontaisChange: (value: number) => void;
  onTravasVerticaisChange: (value: number) => void;
}

const LuminosoEstruturaForm: React.FC<Props> = ({
  larguraEstrutura,
  alturaEstrutura,
  travasHorizontais,
  travasVerticais,
  estruturaCalc,
  estruturaConfig,
  onLarguraChange,
  onAlturaChange,
  onTravasHorizontaisChange,
  onTravasVerticaisChange,
}) => {
  const areaEstrutura = larguraEstrutura * alturaEstrutura;

  const handleLarguraChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onLarguraChange(Math.max(0, value));
  };

  const handleAlturaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    onAlturaChange(Math.max(0, value));
  };

  const handleTravasHorizontaisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onTravasHorizontaisChange(Math.max(0, value));
  };

  const handleTravasVerticaisChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    onTravasVerticaisChange(Math.max(0, value));
  };

  return (
    <div className="space-y-4">
      <label className="block text-sm font-medium text-gray-700 mb-4">
        Estrutura Metálica (Opcional)
      </label>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Largura da estrutura (m)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={larguraEstrutura || ''}
            onChange={handleLarguraChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Altura da estrutura (m)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={alturaEstrutura || ''}
            onChange={handleAlturaChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Travas horizontais</label>
          <input
            type="number"
            min="0"
            value={travasHorizontais || ''}
            onChange={handleTravasHorizontaisChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Travas verticais</label>
          <input
            type="number"
            min="0"
            value={travasVerticais || ''}
            onChange={handleTravasVerticaisChange}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
      </div>

      {areaEstrutura > 0 && (
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <p className="text-sm text-gray-600">
            <strong>Área da estrutura:</strong> {areaEstrutura.toFixed(2)} m²
          </p>
          <p className="text-sm text-gray-600">
            <strong>Metros lineares:</strong> {estruturaCalc.metrosLineares.toFixed(2)} m
          </p>
          <p className="text-sm text-gray-600">
            <strong>Barras necessárias:</strong> {estruturaCalc.barrasNecessarias.toFixed(2)} barras
          </p>
          <p className="text-sm text-gray-600">
            <strong>Barras a pagar:</strong> {estruturaCalc.barrasInteiras} barras
          </p>
          <p className="text-sm text-gray-600">
            <strong>Custo total:</strong> {formatCurrency(estruturaCalc.custoTotal)}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Custo por m²:</strong> {formatCurrency(estruturaCalc.custoPorM2)}
          </p>
          <p className="text-xs text-gray-500">
            Barra de {estruturaConfig.comprimentoBarra}m - {formatCurrency(estruturaConfig.precoPorBarra)}/unid
          </p>
        </div>
      )}
    </div>
  );
};

export default LuminosoEstruturaForm;
