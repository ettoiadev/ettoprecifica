/*
 * Coluna da esquerda da precificação por arquivo: escolher o vetor, dizer o
 * tamanho real e a chapa. A visualização e o botão de organizar ficam na
 * coluna da direita (`EncaixeVisual`), sobre o mesmo estado (`useEncaixeSvg`).
 */
import React, { useRef } from 'react';
import { Upload, AlertTriangle, FileWarning } from 'lucide-react';
import { EXTENSOES_ACEITAS } from '../../lib/nesting/lerArquivo';
import {
  GIRO_LABEL,
  MARGEM_MINIMA_MM,
  VAO_MINIMO_MM,
  type Giro,
  type EncaixeSvg,
} from '../../hooks/useEncaixeSvg';
import { selectClass } from './CalcControls';
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
              {enc.totalPecas} peças em {enc.totalFormas}{' '}
              {enc.totalFormas === 1 ? 'forma' : 'formas distintas'}
            </p>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">Chapa e corte</label>
            <div className="grid grid-cols-2 gap-4">
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
                  min={VAO_MINIMO_MM}
                  step="1"
                  value={enc.espacamento}
                  onChange={(e) => enc.setEspacamento(e.target.value)}
                />
              </div>
              <div>
                <label htmlFor="chapa-margem" className="block text-xs text-gray-500 mb-1">
                  Margem da borda (mm)
                </label>
                <Input
                  id="chapa-margem"
                  type="number"
                  min={MARGEM_MINIMA_MM}
                  step="1"
                  value={enc.margem}
                  onChange={(e) => enc.setMargem(e.target.value)}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Mínimos de produção: {VAO_MINIMO_MM} mm entre letras e {MARGEM_MINIMA_MM} mm da borda
              da chapa.
            </p>

            <div className="mt-4">
              <label htmlFor="chapa-giro" className="block text-xs text-gray-500 mb-1">
                Giro das peças
              </label>
              <select
                id="chapa-giro"
                value={enc.giro}
                onChange={(e) => enc.setGiro(e.target.value as Giro)}
                className={selectClass}
              >
                {(['sem', 'meia', 'quarto', 'oitavo'] as Giro[]).map((g) => (
                  <option key={g} value={g}>
                    {GIRO_LABEL[g]}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-2">
                Girar costuma economizar material quando as peças são grandes perto da chapa, e
                não muda nada quando são pequenas — só demora mais. Compare a área e o tempo que
                aparecem depois de organizar.
              </p>
            </div>
          </div>

          {enc.abaixoDoMinimo && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-800">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                Valor abaixo do mínimo de produção. Calculei com {VAO_MINIMO_MM} mm entre letras e{' '}
                {MARGEM_MINIMA_MM} mm de borda.
              </span>
            </div>
          )}

          {enc.pecaNaoCabe && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                A maior peça não cabe nessa chapa em nenhuma orientação. Reduza a altura do conjunto
                ou use uma chapa maior.
              </span>
            </div>
          )}

          {enc.areaOcupada && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Material consumido
              </label>
              <div className="rounded-lg border border-indigo-200 bg-indigo-50/60 p-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-indigo-900">Área ocupada</span>
                  <span className="text-xl font-bold text-indigo-900">
                    {fmt(enc.areaOcupada.areaM2)} m²
                  </span>
                </div>
                <p className="text-xs text-indigo-800/80 mt-1">
                  É o que entra no preço: a faixa de chapa que o corte consome.
                </p>
              </div>
              <div className="mt-2 space-y-1">
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Contorno das letras</span>
                  <span>
                    {fmt(enc.areaOcupada.areaContornoM2)} m² ·{' '}
                    {(enc.areaOcupada.aproveitamento * 100).toFixed(1)}% de aproveitamento
                  </span>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Chapas abertas</span>
                  <span>
                    {enc.areaOcupada.totalFolhas} · {fmt(enc.areaOcupada.areaChapasM2)} m² (não
                    cobrados)
                  </span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EncaixeControles;
