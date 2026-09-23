import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '../../types/pricing';
import { CalcCheckbox } from './CalcControls';
import { Input } from '../ui/input';
import type { UseDeslocamentoCepReturn } from '../../hooks/useDeslocamentoCep';

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
      <CalcCheckbox checked={incluirDeslocamento} onCheckedChange={setIncluirDeslocamento}>
            Incluir deslocamento
          </CalcCheckbox>

      {incluirDeslocamento && (
        <div className="mt-3 space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">CEP do cliente</label>
              <Input
                type="text"
                inputMode="numeric"
                value={cepDestino}
                onChange={(e) => setCepDestino(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Tempo estimado de instalação (h)</label>
              <Input
                type="number"
                min="0"
                step="0.5"
                value={tempoInstalacaoHoras}
                onChange={(e) => setTempoInstalacaoHoras(e.target.value)}
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
              Distância estimada: {infoCep.distanciaIdaKm.toFixed(2)} km ({infoCep.trecho})
              {infoCep.pisoCidadeAplicado != null && (
                <> — piso mínimo de {formatCurrency(infoCep.pisoCidadeAplicado)} aplicado para {infoCep.cidadeDestino}</>
              )}
              {' '}— valor pré-preenchido, revise antes de confirmar.
            </p>
          )}

          <div>
            <label className="block text-xs text-gray-500 mb-1">Valor do deslocamento (R$)</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={custoDeslocamento}
              onChange={(e) => setCustoDeslocamento(e.target.value)}
              placeholder="0.00"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default DeslocamentoField;
