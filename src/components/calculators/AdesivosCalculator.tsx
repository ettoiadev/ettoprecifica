import React, { useState } from 'react';
import { AdesivoConfig } from '../../types/pricing';
import AdesivoManualCalculator from './AdesivoManualCalculator';
import EtiquetasCalculator from './EtiquetasCalculator';

// Aba unificada "Adesivos": um seletor de tipo no topo escolhe entre
// "Adesivos" (impresso + recorte, com preço MANUAL definido em Configurações —
// AdesivoManualCalculator) e "Etiquetas/Rótulos" (que continua no motor da skill,
// via calc-etiquetas, intacto). Antes eram três sub-abas (Impresso/Recorte/
// Etiquetas, todas pelo motor); Impresso e Recorte foram fundidos numa única
// lista manual a pedido do Étto. Mesmo padrão do PlacasCalculator.
type TipoAdesivo = 'adesivo' | 'etiquetas';

interface Props {
  config: AdesivoConfig;
}

const btn = (active: boolean) =>
  `px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-50 border-blue-300 text-blue-700'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
  }`;

const AdesivosCalculator: React.FC<Props> = ({ config }) => {
  const [tipoAdesivo, setTipoAdesivo] = useState<TipoAdesivo>('adesivo');

  return (
    <div>
      <div className="px-6 pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Tipo</label>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <button type="button" onClick={() => setTipoAdesivo('adesivo')} className={btn(tipoAdesivo === 'adesivo')}>
            Adesivos
          </button>
          <button type="button" onClick={() => setTipoAdesivo('etiquetas')} className={btn(tipoAdesivo === 'etiquetas')}>
            Etiquetas
          </button>
        </div>
      </div>

      {tipoAdesivo === 'adesivo' && <AdesivoManualCalculator config={config} />}
      {tipoAdesivo === 'etiquetas' && <EtiquetasCalculator />}
    </div>
  );
};

export default AdesivosCalculator;
