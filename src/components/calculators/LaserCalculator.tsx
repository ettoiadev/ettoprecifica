import React, { useState, useEffect } from 'react';
import { LaserConfig, formatCurrency, applyItemMinimumCharge, PricingConfig, ProductVariation } from '../../types/pricing';
import { getProductOptions } from '../../utils/productOptions';
import BudgetSummaryExtended from '../BudgetSummaryExtended';

interface Props {
  config: LaserConfig;
  fullConfig: PricingConfig;
}

const LaserCalculator: React.FC<Props> = ({ config, fullConfig }) => {
  const [largura, setLargura] = useState<string>('');
  const [altura, setAltura] = useState<string>('');
  const [quantidade, setQuantidade] = useState<number>(1);
  const [materialSelecionado, setMaterialSelecionado] = useState<string>('');
  const [total, setTotal] = useState<number>(0);

  // Materiais vêm do modelo unificado (editável via Configurações)
  const materiais = getProductOptions('laser', fullConfig);

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const area = larguraNum * alturaNum;
  const areaTotal = area * quantidade;

  const selected = materiais.find((m) => m.id === materialSelecionado);

  useEffect(() => {
    if (area > 0 && selected && quantidade > 0) {
      const subtotal = area * selected.price * quantidade;
      setTotal(applyItemMinimumCharge(subtotal, selected.minPrice));
    } else {
      setTotal(0);
    }
  }, [largura, altura, quantidade, materialSelecionado, fullConfig]);

  // Verificação de segurança após os hooks
  if (!config) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          Carregando configurações...
        </div>
      </div>
    );
  }

  const hasValidData = area > 0 && !!selected && quantidade > 0;

  const productName = selected ? `Laser ${selected.label}` : '';

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
      {selected && (
        <div className="flex justify-between text-sm">
          <span>Material:</span>
          <span>{selected.label}</span>
        </div>
      )}
    </>
  );

  // Agrupar materiais por categoria, preservando a ordem de inserção
  const categorias: { titulo: string; itens: ProductVariation[] }[] = [];
  const indexByTitulo = new Map<string, number>();
  materiais.forEach((m) => {
    const titulo = m.category || 'Outros Materiais';
    if (!indexByTitulo.has(titulo)) {
      indexByTitulo.set(titulo, categorias.length);
      categorias.push({ titulo, itens: [] });
    }
    categorias[indexByTitulo.get(titulo)!].itens.push(m);
  });

  // Exibe rótulo curto quando começa com o nome da categoria (ex.: "Acrílico Cristal 2mm" -> "2mm")
  const displayLabel = (m: ProductVariation) =>
    m.category && m.label.startsWith(`${m.category} `) ? m.label.slice(m.category.length + 1) : m.label;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Laser</h2>
        <p className="text-gray-600">Selecione o material e informe as dimensões.</p>
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
              Material
            </label>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {categorias.map((categoria) => (
                <div key={categoria.titulo} className="border border-gray-200 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">{categoria.titulo}</h3>
                  <div className="space-y-2">
                    {categoria.itens.map((material) => (
                      <div
                        key={material.id}
                        className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id={material.id}
                            name="material"
                            value={material.id}
                            checked={materialSelecionado === material.id}
                            onChange={(e) => setMaterialSelecionado(e.target.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <label htmlFor={material.id} className="ml-3 text-sm font-medium text-gray-700">
                            {displayLabel(material)}
                          </label>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatCurrency(material.price)}/m²
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
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

export default LaserCalculator;
