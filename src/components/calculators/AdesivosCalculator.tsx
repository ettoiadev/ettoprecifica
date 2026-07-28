import React, { useState } from 'react';
import AdesivoImpressoCalculator from './AdesivoImpressoCalculator';
import AdesivoRecorteCalculator from './AdesivoRecorteCalculator';

// Aba unificada "Adesivos": agrupa Adesivo Impresso e Adesivo de Recorte sob
// um único menu, com um seletor de tipo no topo. Cada opção continua sendo o
// componente original, intacto (chama calc-adesivo-impresso ou
// calc-adesivo-recorte como sempre) — este componente só decide qual dos
// dois renderizar. Mesmo padrão do PlacasCalculator.
type TipoAdesivo = 'impresso' | 'recorte';

const btn = (active: boolean) =>
  `px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${
    active
      ? 'bg-blue-50 border-blue-300 text-blue-700'
      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
  }`;

const AdesivosCalculator: React.FC = () => {
  const [tipoAdesivo, setTipoAdesivo] = useState<TipoAdesivo>('impresso');

  return (
    <div>
      <div className="px-6 pt-6">
        <label className="block text-sm font-medium text-gray-700 mb-3">Tipo de adesivo</label>
        <div className="grid grid-cols-2 gap-3 max-w-md">
          <button type="button" onClick={() => setTipoAdesivo('impresso')} className={btn(tipoAdesivo === 'impresso')}>
            Impresso
          </button>
          <button type="button" onClick={() => setTipoAdesivo('recorte')} className={btn(tipoAdesivo === 'recorte')}>
            Recorte
          </button>
        </div>
      </div>

      {tipoAdesivo === 'impresso' ? <AdesivoImpressoCalculator /> : <AdesivoRecorteCalculator />}
    </div>
  );
};

export default AdesivosCalculator;
