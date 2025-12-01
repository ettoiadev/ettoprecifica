import React, { useState, useEffect } from 'react';
import { LaserConfig, formatCurrency, calculateMinimumCharge, PricingConfig } from '../../types/pricing';
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

  const larguraNum = parseFloat(largura) || 0;
  const alturaNum = parseFloat(altura) || 0;
  const area = larguraNum * alturaNum;
  const areaTotal = area * quantidade;

  useEffect(() => {
    if (config && area > 0 && materialSelecionado && quantidade > 0) {
      const precoM2 = config[materialSelecionado as keyof LaserConfig];
      const subtotal = area * precoM2 * quantidade;
      setTotal(calculateMinimumCharge(subtotal));
    } else {
      setTotal(0);
    }
  }, [largura, altura, quantidade, materialSelecionado, config]);

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

  const hasValidData = area > 0 && materialSelecionado && quantidade > 0;

  // Mapear nomes dos materiais
  const materialNames: Record<string, string> = {
    'acrilicoCristal2mm': 'Acrílico Cristal 2mm',
    'acrilicoCristal3mm': 'Acrílico Cristal 3mm',
    'acrilicoCristal5mm': 'Acrílico Cristal 5mm',
    'acrilicoCristal8mm': 'Acrílico Cristal 8mm',
    'acrilicoCristal10mm': 'Acrílico Cristal 10mm',
    'acrilicoColorido3mm': 'Acrílico Colorido 3mm',
    'acrilicoColorido5mm': 'Acrílico Colorido 5mm',
    'acrilicoColorido8mm': 'Acrílico Colorido 8mm',
    'acrilicoColorido10mm': 'Acrílico Colorido 10mm',
    'acrilicoPretoFume3mm': 'Acrílico Preto/Fumê 3mm',
    'acrilicoPretoFume5mm': 'Acrílico Preto/Fumê 5mm',
    'acrilicoPretoFume8mm': 'Acrílico Preto/Fumê 8mm',
    'psCristal1mm': 'PS Cristal 1mm',
    'psCristal2mm': 'PS Cristal 2mm',
    'psCristal3mm': 'PS Cristal 3mm',
    'psaiBranco1mm': 'PSAI Branco 1mm/0mm',
    'psaiBranco2mm': 'PSAI Branco 2mm',
    'psaiBranco3mm': 'PSAI Branco 3mm',
    'psaiColorido2mm': 'PSAI Colorido 2mm',
    'mdf3mm': 'MDF 3mm',
    'mdf6mm': 'MDF 6mm',
    'mdf9mm': 'MDF 9mm',
    'pe3mm': 'PE 3mm',
    'petg3mm': 'PETG 3mm',
    'espelhadoPrata2mm': 'Espelhado Prata 2mm',
    'espelhadoPrataDourado3mm': 'Espelhado Prata/Dourado 3mm',
  };

  const productName = materialSelecionado ? `Laser ${materialNames[materialSelecionado]}` : '';

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
      {materialSelecionado && (
        <div className="flex justify-between text-sm">
          <span>Material:</span>
          <span>{materialNames[materialSelecionado]}</span>
        </div>
      )}
    </>
  );

  // Organizar materiais por categoria
  const materiaisPorCategoria = [
    {
      titulo: 'Acrílico Cristal',
      materiais: [
        { key: 'acrilicoCristal2mm', label: '2mm' },
        { key: 'acrilicoCristal3mm', label: '3mm' },
        { key: 'acrilicoCristal5mm', label: '5mm' },
        { key: 'acrilicoCristal8mm', label: '8mm' },
        { key: 'acrilicoCristal10mm', label: '10mm' },
      ]
    },
    {
      titulo: 'Acrílico Colorido',
      materiais: [
        { key: 'acrilicoColorido3mm', label: '3mm' },
        { key: 'acrilicoColorido5mm', label: '5mm' },
        { key: 'acrilicoColorido8mm', label: '8mm' },
        { key: 'acrilicoColorido10mm', label: '10mm' },
      ]
    },
    {
      titulo: 'Acrílico Preto/Fumê',
      materiais: [
        { key: 'acrilicoPretoFume3mm', label: '3mm' },
        { key: 'acrilicoPretoFume5mm', label: '5mm' },
        { key: 'acrilicoPretoFume8mm', label: '8mm' },
      ]
    },
    {
      titulo: 'PS Cristal',
      materiais: [
        { key: 'psCristal1mm', label: '1mm' },
        { key: 'psCristal2mm', label: '2mm' },
        { key: 'psCristal3mm', label: '3mm' },
      ]
    },
    {
      titulo: 'PSAI Branco',
      materiais: [
        { key: 'psaiBranco1mm', label: '1mm/0mm' },
        { key: 'psaiBranco2mm', label: '2mm' },
        { key: 'psaiBranco3mm', label: '3mm' },
      ]
    },
    {
      titulo: 'PSAI Colorido',
      materiais: [
        { key: 'psaiColorido2mm', label: '2mm' },
      ]
    },
    {
      titulo: 'MDF',
      materiais: [
        { key: 'mdf3mm', label: '3mm' },
        { key: 'mdf6mm', label: '6mm' },
        { key: 'mdf9mm', label: '9mm' },
      ]
    },
    {
      titulo: 'Outros Materiais',
      materiais: [
        { key: 'pe3mm', label: 'PE 3mm' },
        { key: 'petg3mm', label: 'PETG 3mm' },
        { key: 'espelhadoPrata2mm', label: 'Espelhado Prata 2mm' },
        { key: 'espelhadoPrataDourado3mm', label: 'Espelhado Prata/Dourado 3mm' },
      ]
    },
  ];

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
              {materiaisPorCategoria.map((categoria) => (
                <div key={categoria.titulo} className="border border-gray-200 rounded-lg p-3">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">{categoria.titulo}</h3>
                  <div className="space-y-2">
                    {categoria.materiais.map((material) => (
                      <div
                        key={material.key}
                        className="flex items-center justify-between p-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            id={material.key}
                            name="material"
                            value={material.key}
                            checked={materialSelecionado === material.key}
                            onChange={(e) => setMaterialSelecionado(e.target.value)}
                            className="w-4 h-4 text-blue-600 border-gray-300 focus:ring-blue-500"
                          />
                          <label htmlFor={material.key} className="ml-3 text-sm font-medium text-gray-700">
                            {material.label}
                          </label>
                        </div>
                        <span className="text-sm text-gray-500">
                          {formatCurrency(config[material.key as keyof LaserConfig])}/m²
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
