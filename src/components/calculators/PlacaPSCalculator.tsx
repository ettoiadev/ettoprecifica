import React, { useState, useEffect } from 'react';
import { PlacaPSConfig, formatCurrency, calculateMinimumCharge, PricingConfig } from '../../types/pricing';
import { getProductOptions } from '../../utils/productOptions';
import BudgetSummaryExtended from '../BudgetSummaryExtended';

interface Props {
  config: PlacaPSConfig;
  fullConfig: PricingConfig;
}

const PlacaPSCalculator: React.FC<Props> = ({ config, fullConfig }) => {
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [tipoSelecionado, setTipoSelecionado] = useState<string>('');
  const [customSelecionadas, setCustomSelecionadas] = useState<string[]>([]);
  const [total, setTotal] = useState<number>(0);

  // Espessuras (radio) vêm do modelo unificado (editável via Configurações)
  const baseOptions = getProductOptions('placaPS', fullConfig);

  const customOptions = (config.customVariations || []).map((variation) => ({
    id: variation.id,
    label: variation.label,
    price: variation.price,
  }));

  const baseOptionsById = new Map(baseOptions.map((o) => [o.id, o] as const));
  const customOptionsById = new Map(customOptions.map((o) => [o.id, o] as const));

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const area = larguraNum * alturaNum;
  const areaTotal = area * quantidade;

  useEffect(() => {
    if (area > 0 && tipoSelecionado && quantidade > 0) {
      const basePrice = baseOptionsById.get(tipoSelecionado)?.price || 0;
      const extrasPrice = customSelecionadas.reduce((sum, id) => {
        return sum + (customOptionsById.get(id)?.price || 0);
      }, 0);

      const pricePerM2 = basePrice + extrasPrice;
      const subtotal = area * pricePerM2 * quantidade;
      // Aplicar preço mínimo ao total final, não por unidade
      setTotal(calculateMinimumCharge(subtotal));
    } else {
      setTotal(0);
    }
  }, [largura, altura, quantidade, tipoSelecionado, customSelecionadas, config, baseOptionsById, customOptionsById]);

  const hasValidData = area > 0 && tipoSelecionado && quantidade > 0;

  // Gerar nome do produto
  const selectedLabel = tipoSelecionado ? baseOptionsById.get(tipoSelecionado)?.label : undefined;
  const selectedCustomLabels = customSelecionadas
    .map((id) => customOptionsById.get(id)?.label)
    .filter((v): v is string => Boolean(v));

  const productName = selectedLabel
    ? `Placa PS ${selectedLabel}${selectedCustomLabels.length > 0 ? ` + ${selectedCustomLabels.join(' + ')}` : ''}`
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
        <span>Tipo:</span>
        <span>
          {selectedLabel || 'Nenhum'}
          {selectedCustomLabels.length > 0 ? ` + ${selectedCustomLabels.join(' + ')}` : ''}
        </span>
      </div>
    </>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Placa em PS</h2>
        <p className="text-gray-600">Configure a espessura da placa e informe as dimensões.</p>
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
              {baseOptions.map((option) => (
                <div
                  key={option.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-center">
                    <input
                      type="radio"
                      id={option.id}
                      name="tipo"
                      value={option.id}
                      checked={tipoSelecionado === option.id}
                      onChange={(e) => setTipoSelecionado(e.target.value)}
                      className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                    />
                    <label htmlFor={option.id} className="ml-3 text-sm font-medium text-gray-700">
                      {option.label}
                    </label>
                  </div>
                  <span className="text-sm text-gray-500">{formatCurrency(option.price)}/m²</span>
                </div>
              ))}
            </div>
          </div>

          {customOptions.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-4">
                Variações
              </label>
              <div className="space-y-2">
                {customOptions.map((option) => {
                  const checked = customSelecionadas.includes(option.id);
                  return (
                    <div
                      key={option.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id={`custom_${option.id}`}
                          checked={checked}
                          onChange={(e) => {
                            const isChecked = e.target.checked;
                            setCustomSelecionadas((prev) =>
                              isChecked
                                ? [...prev, option.id]
                                : prev.filter((id) => id !== option.id)
                            );
                          }}
                          className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                        <label
                          htmlFor={`custom_${option.id}`}
                          className="ml-3 text-sm font-medium text-gray-700"
                        >
                          {option.label}
                        </label>
                      </div>
                      <span className="text-sm text-gray-500">{formatCurrency(option.price)}/m²</span>
                    </div>
                  );
                })}
              </div>
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

export default PlacaPSCalculator;
