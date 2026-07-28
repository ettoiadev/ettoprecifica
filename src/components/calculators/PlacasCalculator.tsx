import React, { useState } from 'react';
import PlacaPSCalculator from './PlacaPSCalculator';
import PlacaACMCalculator from './PlacaACMCalculator';

// Aba unificada "Placas": agrupa Placa PS e Placa ACM sob um único menu, com
// um seletor de tipo no topo. Cada opção continua sendo o componente
// original, intacto (chama calc-ps ou calc-placa-acm como sempre) — este
// componente só decide qual dos dois renderizar.
type TipoPlaca = 'ps' | 'acm';

const btn = (active: boolean) =>
  `px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-50 border-blue-300 text-blue-700'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
  }`;

const PlacasCalculator: React.FC = () => {
  const [tipoPlaca, setTipoPlaca] = useState<TipoPlaca>('ps');

  return (
    <div>
      <div className="px-6 pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de placa</label>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button type="button" onClick={() => setTipoPlaca('ps')} className={btn(tipoPlaca === 'ps')}>
            Placa PS
          </button>
          <button type="button" onClick={() => setTipoPlaca('acm')} className={btn(tipoPlaca === 'acm')}>
            Placa ACM
          </button>
        </div>
      </div>

      {tipoPlaca === 'ps' ? <PlacaPSCalculator /> : <PlacaACMCalculator />}
    </div>
  );
};

export default PlacasCalculator;
