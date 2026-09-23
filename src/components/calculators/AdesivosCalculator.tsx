import React, { useState } from 'react';
import { AdesivoConfig, EtiquetasConfig } from '../../types/pricing';
import AdesivoManualCalculator from './AdesivoManualCalculator';
import { OptionChip } from './CalcControls';
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
  etiquetasConfig: EtiquetasConfig;
}

const AdesivosCalculator: React.FC<Props> = ({ config, etiquetasConfig }) => {
  const [tipoAdesivo, setTipoAdesivo] = useState<TipoAdesivo>('adesivo');

  return (
    <div>
      <div className="px-6 pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Tipo</label>
        <div className="grid grid-cols-2 gap-3 max-w-sm">
          <OptionChip onClick={() => setTipoAdesivo('adesivo')} active={tipoAdesivo === 'adesivo'} variant="neutral">
            Adesivos
          </OptionChip>
          <OptionChip onClick={() => setTipoAdesivo('etiquetas')} active={tipoAdesivo === 'etiquetas'} variant="neutral">
            Etiquetas
          </OptionChip>
        </div>
      </div>

      {tipoAdesivo === 'adesivo' && <AdesivoManualCalculator config={config} />}
      {tipoAdesivo === 'etiquetas' && <EtiquetasCalculator config={etiquetasConfig} />}
    </div>
  );
};

export default AdesivosCalculator;
