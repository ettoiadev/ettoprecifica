import React, { useState } from 'react';
import { PlacaPSConfig, PlacaACMConfig } from '../../types/pricing';
import PlacaPSManualCalculator from './PlacaPSManualCalculator';
import { OptionChip } from './CalcControls';
import PlacaACMManualCalculator from './PlacaACMManualCalculator';

// Aba unificada "Placas": um seletor de tipo no topo escolhe entre Placa PS e
// Placa ACM, ambas com preço MANUAL definido em Configurações (não mais pelo
// motor da skill). calc-ps/calc-placa-acm ficam intactos, só não são chamados.
type TipoPlaca = 'ps' | 'acm';

interface Props {
  configPS: PlacaPSConfig;
  configACM: PlacaACMConfig;
}

const PlacasCalculator: React.FC<Props> = ({ configPS, configACM }) => {
  const [tipoPlaca, setTipoPlaca] = useState<TipoPlaca>('ps');

  return (
    <div>
      <div className="px-6 pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de placa</label>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <OptionChip onClick={() => setTipoPlaca('ps')} active={tipoPlaca === 'ps'} variant="neutral">
            Placa PS
          </OptionChip>
          <OptionChip onClick={() => setTipoPlaca('acm')} active={tipoPlaca === 'acm'} variant="neutral">
            Placa ACM
          </OptionChip>
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
