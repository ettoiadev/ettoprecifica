/*
 * Coluna da esquerda da precificação por arquivo: escolher o vetor, dizer o
 * tamanho real e a chapa. A visualização e o botão de organizar ficam na
 * coluna da direita (`EncaixeVisual`), sobre o mesmo estado (`useEncaixeSvg`).
 */
import React, { useRef } from 'react';
import { Upload, AlertTriangle, FileWarning } from 'lucide-react';
import { EXTENSOES_ACEITAS } from '../../lib/nesting/lerArquivo';
import { BASE_AJUDA, BASE_LABEL, type BaseCobranca, type EncaixeSvg } from '../../hooks/useEncaixeSvg';
import { OptionChip } from './CalcControls';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const fmt = (v: number) =>
  v.toLocaleString('pt-BR', { minimumFractionDigits: 3, maximumFractionDigits: 3 });

const EncaixeControles: React.FC<{ enc: EncaixeSvg }> = ({ enc }) => {
  const inputArquivo = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Arquivo vetorial</label>
        <input
          ref={inputArquivo}
          type="file"
          accept={EXTENSOES_ACEITAS}
          className="sr-only"
          onChange={(e) => {
            void enc.trocarArquivo(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full justify-start"
          onClick={() => inputArquivo.current?.click()}
        >
          <Upload className="w-4 h-4" />
          {enc.nomeArquivo || 'Escolher arquivo SVG ou DXF…'}
        </Button>
        <p className="text-xs text-gray-500 mt-2">
          Exporte do Corel com o texto convertido em curvas. Cada letra vira uma peça.
        </p>

        {enc.erroLeitura && (
          <div className="mt-3 flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            <FileWarning className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{enc.erroLeitura}</span>
          </div>
        )}

        {enc.leitura?.avisos.map((a) => (
          <div
            key={a}
            className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800"
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{a}</span>
          </div>
        ))}
      </div>

      {enc.leitura && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="altura-real" className="block text-sm font-medium text-gray-700 mb-3">
                Altura real do conjunto (cm)
              </label>
              <Input
                id="altura-real"
                type="number"
                min="0"
                step="0.1"
                value={enc.alturaRealCm}
                onChange={(e) => enc.setAlturaRealCm(e.target.value)}
              />
            </div>
            <div>
              <label htmlFor="qtd-jogos" className="block text-sm font-medium text-gray-700 mb-3">
                Quantidade de jogos
              </label>
              <Input
                id="qtd-jogos"
                type="number"
                min="1"
                step="1"
                value={enc.quantidade}
                onChange={(e) => enc.setQuantidade(e.target.value)}
              />
            </div>
          </div>

          {enc.maiorPeca.largura > 0 && (
            <p className="-mt-3 text-xs text-gray-500">
              Conjunto: {enc.conjunto.largura.toFixed(0)} × {enc.conjunto.altura.toFixed(0)} mm ·
              maior peça {enc.maiorPeca.largura.toFixed(0)} × {enc.maiorPeca.altura.toFixed(0)} mm ·{' '}
              {enc.totalPecas} peças
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Chapa e corte</label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label htmlFor="chapa-largura" className="block text-xs text-gray-500 mb-1">
                  Largura útil (mm)
                </label>
                <Input
                  id="chapa-largura"
                  type="number"
                  min="0"
                  step="10"
                  value={enc.chapaLargura}
                  onChange={(e) => enc.setChapaLargura(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="chapa-comprimento" className="block text-xs text-gray-500 mb-1">
                  Comprimento (mm)
                </label>
                <Input
                  id="chapa-comprimento"
                  type="number"
                  min="0"
                  step="10"
                  value={enc.chapaComprimento}
                  onChange={(e) => enc.setChapaComprimento(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="chapa-vao" className="block text-xs text-gray-500 mb-1">
                  Vão entre peças (mm)
                </label>
                <Input
                  id="chapa-vao"
                  type="number"
                  min="0"
                  step="1"
                  value={enc.espacamento}
                  onChange={(e) => enc.setEspacamento(e.target.value)}
                />
              </div>
            </div>
          </div>

          {enc.pecaNaoCabe && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                A maior peça não cabe nessa chapa em nenhuma orientação. Reduza a altura do conjunto
                ou use uma chapa maior.
              </span>
            </div>
          )}

          {enc.areas && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                O que entra no preço
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {(['contorno', 'faixa', 'chapa'] as BaseCobranca[]).map((b) => (
                  <OptionChip
                    key={b}
                    onClick={() => enc.setBase(b)}
                    active={enc.base === b}
                    variant="indigo"
                  >
                    <span className="block font-medium">{BASE_LABEL[b]}</span>
                    <span className="block text-xs opacity-80">{fmt(enc.areas![b])} m²</span>
                  </OptionChip>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">{BASE_AJUDA[enc.base]}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EncaixeControles;
