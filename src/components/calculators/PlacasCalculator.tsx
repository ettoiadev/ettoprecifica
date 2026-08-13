import React, { useState } from 'react';
import { PlacaPSConfig, PlacaACMConfig } from '../../types/pricing';
import PlacaPSManualCalculator from './PlacaPSManualCalculator';
import PlacaACMManualCalculator from './PlacaACMManualCalculator';

// Aba unificada "Placas": um seletor de tipo no topo escolhe entre Placa PS e
// Placa ACM, ambas com preço MANUAL definido em Configurações (não mais pelo
// motor da skill). calc-ps/calc-placa-acm ficam intactos, só não são chamados.
type TipoPlaca = 'ps' | 'acm';

interface Props {
  configPS: PlacaPSConfig;
  configACM: PlacaACMConfig;
}

const btn = (active: boolean) =>
  `px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-50 border-blue-300 text-blue-700'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
  }`;

const PlacasCalculator: React.FC<Props> = ({ configPS, configACM }) => {
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

      {tipoPlaca === 'ps' ? (
        <PlacaPSManualCalculator config={configPS} />
      ) : (
        <PlacaACMManualCalculator config={configACM} />
      )}
    </div>
  );
};

export default PlacasCalculator;
