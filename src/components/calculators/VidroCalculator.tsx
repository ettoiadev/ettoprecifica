import React, { useState, useEffect } from 'react';
import { VidroConfig, formatCurrency, calculateMinimumCharge, PricingConfig } from '../../types/pricing';
import BudgetSummaryExtended from '../BudgetSummaryExtended';

interface Props {
  config: VidroConfig;
  fullConfig: PricingConfig;
}

const VidroCalculator: React.FC<Props> = ({ config, fullConfig }) => {
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [espessura, setEspessura] = useState<string>('');
  const [prolongadores, setProlongadores] = useState<number>(0);
  const [total, setTotal] = useState<number>(0);

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const area = larguraNum * alturaNum;
  const areaTotal = area * quantidade;

  const espessuraOptions = [
    { id: '6mm', label: '6mm', price: config.espessura6mm },
    { id: '8mm', label: '8mm', price: config.espessura8mm },
  ];

  useEffect(() => {
    if (area > 0 && espessura && quantidade > 0) {
      const espessuraOption = espessuraOptions.find(opt => opt.id === espessura);
      if (!espessuraOption) {
        setTotal(0);
        return;
      }
      const vidroSubtotal = area * espessuraOption.price * quantidade;
      const vidroTotal = calculateMinimumCharge(vidroSubtotal);
      const prolongadoresTotal = prolongadores * config.prolongadores;

      // Aplicar preço mínimo ao total final incluindo prolongadores
      setTotal(vidroTotal + prolongadoresTotal);
    } else {
      setTotal(0);
    }
  }, [largura, altura, quantidade, espessura, prolongadores, config]);

  const hasValidData = area > 0 && espessura && quantidade > 0;

  // Gerar nome do produto
  const productName = espessura
    ? `Vidro Temperado ${espessuraOptions.find(opt => opt.id === espessura)?.label}`
    : '';

  const productDetails = (
    <>
      <div className="flex justify-between text-sm">
        <span>Dimensões:</span>
        <span>{larguraNum.toFixed(2)} x {alturaNum.toFixed(2)} m</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Quantidade:</span>
        <span>{quantidade} unidade(s)</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Área unitária:</span>
        <span>{area.toFixed(2)} m²</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Área total:</span>
        <span>{areaTotal.toFixed(2)} m²</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Espessura:</span>
        <span>{espessura}</span>
      </div>
      <div className="flex justify-between text-sm">
        <span>Vidro:</span>
        <span>
          {formatCurrency(
            calculateMinimumCharge(area * (espessuraOptions.find(opt => opt.id === espessura)?.price || 0)) * quantidade
          )}
        </span>
      </div>
      {prolongadores > 0 && (
        <div className="flex justify-between text-sm">
          <span>Prolongadores ({prolongadores}x):</span>
          <span>{formatCurrency(prolongadores * config.prolongadores)}</span>
        </div>
      )}
    </>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Vidro Temperado</h2>
        <p className="text-gray-600">Configure a espessura do vidro e quantidade de prolongadores necessários.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Dimensões
            </label>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Largura (m)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={largura}
                  onChange={(e) => setLargura(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Altura (m)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={altura}
                  onChange={(e) => setAltura(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Quantidade</label>
                <input
                  type="number"
                  min="1"
                  value={quantidade || ''}
                  onChange={(e) => setQuantidade(parseInt(e.target.value) || 1)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="1"
                />
              </div>
            </div>
            {area > 0 && (
              <p className="text-sm text-gray-600 mt-2">
                Área unitária: {area.toFixed(2)} m² | Área total: {areaTotal.toFixed(2)} m²
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Espessura
            </label>
            <div className="space-y-2">
              {espessuraOptions.map((option) => (
                <div key={option.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={option.id}
                      name="espessura"
                      value={option.id}
                      checked={espessura === option.id}
                      onChange={(e) => setEspessura(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor={option.id} className="ml-3 text-sm font-medium text-gray-700">
                      {option.label}
                    </label>
                  </div>
                  <span className="text-sm text-gray-500">
                    {formatCurrency(option.price)}/m²
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prolongadores (quantidade)
            </label>
            <input
              type="number"
              min="0"
              value={prolongadores || ''}
              onChange={(e) => setProlongadores(parseInt(e.target.value) || 0)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="0"
            />
            <p className="text-xs text-gray-500 mt-1">
              Preço: {formatCurrency(config.prolongadores)}/unidade
            </p>
          </div>
        </div>

        <BudgetSummaryExtended
          baseTotal={total}
          config={fullConfig}
          productDetails={productDetails}
          hasValidData={hasValidData}
          emptyMessage="Preencha todos os campos para ver o orçamento"
          productName={productName}
          quantity={quantidade}
        />
      </div>
    </div>
  );
};

export default VidroCalculator;
