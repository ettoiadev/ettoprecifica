import React, { useState } from 'react';
import AdesivoImpressoCalculator from './AdesivoImpressoCalculator';
import AdesivoRecorteCalculator from './AdesivoRecorteCalculator';
import EtiquetasCalculator from './EtiquetasCalculator';

// Aba unificada "Adesivos": agrupa Adesivo Impresso, Adesivo de Recorte e
// Etiquetas/Rótulos sob um único menu, com um seletor de tipo no topo. Cada
// opção continua sendo o componente original, intacto (chama
// calc-adesivo-impresso, calc-adesivo-recorte ou calc-etiquetas como
// sempre) — este componente só decide qual dos três renderizar. Mesmo
// padrão do PlacasCalculator.
type TipoAdesivo = 'impresso' | 'recorte' | 'etiquetas';

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
        <div className="grid grid-cols-3 gap-3 max-w-lg">
          <button type="button" onClick={() => setTipoAdesivo('impresso')} className={btn(tipoAdesivo === 'impresso')}>
            Impresso
          </button>
          <button type="button" onClick={() => setTipoAdesivo('recorte')} className={btn(tipoAdesivo === 'recorte')}>
            Recorte
          </button>
          <button type="button" onClick={() => setTipoAdesivo('etiquetas')} className={btn(tipoAdesivo === 'etiquetas')}>
            Etiquetas
          </button>
        </div>
      </div>

      {tipoAdesivo === 'impresso' && <AdesivoImpressoCalculator />}
      {tipoAdesivo === 'recorte' && <AdesivoRecorteCalculator />}
      {tipoAdesivo === 'etiquetas' && <EtiquetasCalculator />}
    </div>
  );
};

export default AdesivosCalculator;
