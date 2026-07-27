import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import type { UseDeslocamentoCepReturn } from '../../hooks/useDeslocamentoCep';

const inputClass =
  'w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent';

// Bloco de deslocamento compartilhado pelas 12 calculadoras migradas: CEP do
// cliente + tempo estimado de instalação pré-preenchem o valor em R$ via
// calc-deslocamento-cep; o vendedor pode revisar/ajustar antes de confirmar.
const DeslocamentoField: React.FC<UseDeslocamentoCepReturn> = ({
  incluirDeslocamento,
  setIncluirDeslocamento,
  cepDestino,
  setCepDestino,
  tempoInstalacaoHoras,
  setTempoInstalacaoHoras,
  custoDeslocamento,
  setCustoDeslocamento,
  buscandoCep,
  erroCep,
  infoCep,
}) => {
  return (
    <div>
      <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
        <input
          type="checkbox"
          checked={incluirDeslocamento}
          onChange={(e) => setIncluirDeslocamento(e.target.checked)}
          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        />
        <span className="text-sm font-medium text-gray-700">Incluir deslocamento</span>
      </label>

      {incluirDeslocamento && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">CEP do cliente</label>
              <input
                type="text"
                inputMode="numeric"
                value={cepDestino}
                onChange={(e) => setCepDestino(e.target.value)}
                className={inputClass}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tempo estimado de instalação (h)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={tempoInstalacaoHoras}
                onChange={(e) => setTempoInstalacaoHoras(e.target.value)}
                className={inputClass}
                placeholder="0"
              />
            </div>
          </div>

          {buscandoCep && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Calculando distância…
            </div>
          )}
          {erroCep && (
            <div className="flex items-start gap-2 text-xs text-red-600">
              <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
              <span>{erroCep} — informe o valor manualmente abaixo.</span>
            </div>
          )}
          {infoCep && !buscandoCep && !erroCep && (
            <p className="text-xs text-gray-500">
              Distância estimada: {infoCep.distanciaIdaKm.toFixed(2)} km ({infoCep.trecho}) — valor pré-preenchido, revise antes de confirmar.
            </p>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Valor do deslocamento (R$)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={custoDeslocamento}
              onChange={(e) => setCustoDeslocamento(e.target.value)}
              className={inputClass}
              placeholder="0.00"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DeslocamentoField;
