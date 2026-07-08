import React, { useState, useEffect } from 'react';
import { PlacaACMConfig, formatCurrency, applyItemMinimumCharge, PricingConfig } from '../../types/pricing';
import { getProductOptions } from '../../utils/productOptions';
import BudgetSummaryExtended from '../BudgetSummaryExtended';

interface Props {
  config: PlacaACMConfig;
  fullConfig: PricingConfig;
}

const PlacaACMCalculator: React.FC<Props> = ({ config, fullConfig }) => {
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [selectedId, setSelectedId] = useState<string>('');
  const [total, setTotal] = useState<number>(0);

  // Tipos de ACM vêm do modelo unificado (editável via Configurações)
  const options = getProductOptions('placaACM', fullConfig);
  const effectiveId = selectedId || options[0]?.id || '';
  const selected = options.find((o) => o.id === effectiveId);
  const preco = selected?.price ?? 0;
  const hasMultiple = options.length > 1;

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const area = larguraNum * alturaNum;
  const areaTotal = area * quantidade;

  useEffect(() => {
    if (area > 0 && quantidade > 0 && selected) {
      const subtotal = area * preco * quantidade;
      // Aplicar o valor mínimo do item ao total da linha (não por unidade)
      setTotal(applyItemMinimumCharge(subtotal, selected.minPrice));
    } else {
      setTotal(0);
    }
  }, [largura, altura, quantidade, effectiveId, fullConfig]);

  const hasValidData = area > 0 && quantidade > 0 && !!selected;

  // Gerar nome do produto
  const productName = hasMultiple && selected ? `Placa ACM ${selected.label}` : 'Placa ACM';

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
      {hasMultiple && selected && (
        <div className="flex justify-between text-sm">
          <span>Tipo:</span>
          <span>{selected.label}</span>
        </div>
      )}
      <div className="flex justify-between text-sm">
        <span>Preço/m²:</span>
        <span>{formatCurrency(preco)}</span>
      </div>
    </>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Placa em ACM</h2>
        <p className="text-gray-600">Informe as dimensões para calcular o preço.</p>
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

          {hasMultiple ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Tipo de ACM
              </label>
              <div className="space-y-2">
                {options.map((option) => (
                  <div key={option.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        id={option.id}
                        name="acmType"
                        value={option.id}
                        checked={effectiveId === option.id}
                        onChange={(e) => setSelectedId(e.target.value)}
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
          ) : (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Preço Atual</h4>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(preco)}/m²
              </p>
              <p className="text-sm text-blue-700 mt-1">
                Valor configurável nas configurações do sistema
              </p>
            </div>
          )}
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

export default PlacaACMCalculator;
