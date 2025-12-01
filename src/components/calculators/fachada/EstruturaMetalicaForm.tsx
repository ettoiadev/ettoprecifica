
import React from 'react';
import { formatCurrency } from '../../../types/pricing';

interface EstruturaMetalicaFormProps {
  larguraEstrutura: number;
  alturaEstrutura: number;
  travasHorizontais: number;
  travasVerticais: number;
  estruturaCalc: {
    metrosLineares: number;
    barrasNecessarias: number;
    barrasInteiras: number;
    custoTotal: number;
    custoPorM2: number;
  };
  estruturaConfig: {
    precoPorBarra: number;
    comprimentoBarra: number;
  };
  onLarguraChange: (value: number) => void;
  onAlturaChange: (value: number) => void;
  onTravasHorizontaisChange: (value: number) => void;
  onTravasVerticaisChange: (value: number) => void;
}

const EstruturaMetalicaForm: React.FC<EstruturaMetalicaFormProps> = ({
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
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-4">
        Estrutura Metálica
      </label>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Largura (m)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={larguraEstrutura || ''}
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
            value={alturaEstrutura || ''}
            onChange={(e) => onAlturaChange(parseFloat(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Travas Horizontais</label>
          <input
            type="number"
            min="0"
            value={travasHorizontais || ''}
            onChange={(e) => onTravasHorizontaisChange(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Travas Verticais</label>
          <input
            type="number"
            min="0"
            value={travasVerticais || ''}
            onChange={(e) => onTravasVerticaisChange(parseInt(e.target.value) || 0)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0"
          />
        </div>
      </div>
      {estruturaCalc.metrosLineares > 0 && (
        <div className="text-sm text-gray-600 mt-2 space-y-1">
          <p>Metros lineares: {estruturaCalc.metrosLineares.toFixed(2)} m</p>
          <p>Barras necessárias: {estruturaCalc.barrasNecessarias.toFixed(2)} ({estruturaCalc.barrasInteiras} a pagar)</p>
          <p>Preço: {formatCurrency(estruturaConfig.precoPorBarra)}/barra de {estruturaConfig.comprimentoBarra}m</p>
          <p>Custo por m² (informativo): {formatCurrency(estruturaCalc.custoPorM2)}</p>
        </div>
      )}
    </div>
  );
};

export default EstruturaMetalicaForm;
