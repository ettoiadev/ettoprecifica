import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import type { FaixaAlturaLetra, MaterialLetraCaixa } from '../../types/pricing';

/*
 * Editor das faixas de altura da Letra Caixa.
 *
 * Existe em vez de reaproveitar o `CustomVariationsManager` porque uma faixa
 * tem DOIS números com significados diferentes (até quantos cm ela vale, e o
 * R$ por cm), e o manager genérico só tem um campo de preço. Encaixar o "até
 * cm" no `minPrice` funcionaria e deixaria o arquivo mentindo sobre o que
 * guarda — custo alto para quem vier depois.
 *
 * A faixa de MAIOR "até" também cobre tudo acima dela (ver `faixaParaAltura`),
 * senão uma letra de 2m ficaria sem preço justamente no orçamento grande.
 */

interface Props {
  materiais: MaterialLetraCaixa[];
  onChange: (materiais: MaterialLetraCaixa[]) => void;
}

const novaFaixa = (): FaixaAlturaLetra => ({
  id: `f${Date.now()}${Math.floor(Math.random() * 1000)}`,
  ateCm: 0,
  precoCm: 0,
});

const numeroBr = (v: number): string => (v === 0 ? '' : String(v).replace('.', ','));
const paraNumero = (v: string): number => parseFloat(v.replace(',', '.')) || 0;

const Tabela: React.FC<{
  titulo: string;
  ajuda: string;
  faixas: FaixaAlturaLetra[];
  onChange: (f: FaixaAlturaLetra[]) => void;
}> = ({ titulo, ajuda, faixas, onChange }) => {
  const mudar = (id: string, campo: 'ateCm' | 'precoCm', valor: string) =>
    onChange(faixas.map((f) => (f.id === id ? { ...f, [campo]: paraNumero(valor) } : f)));

  const ordenadas = [...faixas].sort((a, b) => a.ateCm - b.ateCm);
  const maior = ordenadas[ordenadas.length - 1];

  return (
    <div className="space-y-2">
      <div>
        <div className="text-sm font-medium text-gray-700">{titulo}</div>
        <div className="text-xs text-gray-500">{ajuda}</div>
      </div>

      {faixas.length === 0 ? (
        <div className="text-xs text-amber-600">
          Sem faixa nenhuma: este material continua sendo calculado pelo motor.
        </div>
      ) : (
        <div className="space-y-2">
          {faixas.map((f) => (
            <div key={f.id} className="flex items-end gap-2">
              <div className="flex-1">
                <label htmlFor={`ate-${f.id}`} className="block text-xs text-gray-500 mb-1">
                  Letras até (cm)
                </label>
                <Input
                  id={`ate-${f.id}`}
                  inputMode="decimal"
                  value={numeroBr(f.ateCm)}
                  onChange={(e) => mudar(f.id, 'ateCm', e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="flex-1">
                <label htmlFor={`cm-${f.id}`} className="block text-xs text-gray-500 mb-1">
                  R$ por cm de altura
                </label>
                <Input
                  id={`cm-${f.id}`}
                  inputMode="decimal"
                  value={numeroBr(f.precoCm)}
                  onChange={(e) => mudar(f.id, 'precoCm', e.target.value)}
                  placeholder="0,00"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={`Excluir faixa até ${f.ateCm} cm`}
                onClick={() => onChange(faixas.filter((x) => x.id !== f.id))}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {maior && maior.ateCm > 0 && (
            <div className="text-xs text-gray-500">
              Letras acima de {numeroBr(maior.ateCm)} cm usam o preço da última faixa.
            </div>
          )}
        </div>
      )}

      <Button type="button" variant="outline" onClick={() => onChange([...faixas, novaFaixa()])}>
        <Plus className="w-4 h-4" /> Adicionar faixa
      </Button>
    </div>
  );
};

const FaixasAlturaManager: React.FC<Props> = ({ materiais, onChange }) => {
  const mudarMaterial = (id: string, campos: Partial<MaterialLetraCaixa>) =>
    onChange(materiais.map((m) => (m.id === id ? { ...m, ...campos } : m)));

  return (
    <div className="mt-6 space-y-6">
      <div>
        <div className="text-base font-semibold text-gray-900">Preço por altura da letra</div>
        <div className="text-xs text-gray-500">
          Vale para ACM, galvanizado, inox e impressão 3D. O preço de uma letra é{' '}
          <strong>R$ por cm × altura × nº de caracteres</strong>. Material sem faixa preenchida
          continua sendo calculado pelo motor.
        </div>
      </div>

      {materiais.map((m) => (
        <div key={m.id} className="rounded-lg border border-gray-200 p-4 space-y-4">
          <div className="text-sm font-semibold text-gray-900">{m.label}</div>
          <Tabela
            titulo="Preço padrão"
            ajuda="Sem iluminação. A retroiluminada soma o percentual configurado acima."
            faixas={m.faixas}
            onChange={(faixas) => mudarMaterial(m.id, { faixas })}
          />
          <Tabela
            titulo="Frontal acrílico"
            ajuda="Tabela própria, com o LED já no preço — não soma o percentual da retro. Em branco, este material não oferece frontal."
            faixas={m.faixasFrontal ?? []}
            onChange={(faixasFrontal) => mudarMaterial(m.id, { faixasFrontal })}
          />
        </div>
      ))}
    </div>
  );
};

export default FaixasAlturaManager;
