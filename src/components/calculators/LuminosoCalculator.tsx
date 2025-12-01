
import React from 'react';
import { LuminosoConfig, PricingConfig, formatCurrency, calculateMinimumCharge } from '../../types/pricing';
import LuminosoDimensionsForm from './luminoso/LuminosoDimensionsForm';
import LuminosoEstruturaForm from './luminoso/LuminosoEstruturaForm';
import LuminosoMaterialsForm from './luminoso/LuminosoMaterialsForm';
import BudgetSummaryExtended from '../BudgetSummaryExtended';
import { useLuminosoCalculations } from '../../hooks/useLuminosoCalculations';
import { luminosoMaterials } from '../../utils/luminosoMaterials';

interface Props {
  config: LuminosoConfig;
  fullConfig: PricingConfig;
}

const LuminosoCalculator: React.FC<Props> = ({ config, fullConfig }) => {
  const {
    larguraLona,
    alturaLona,
    quantidadeLona,
    areaLona,
    setLarguraLona,
    setAlturaLona,
    setQuantidadeLona,
    larguraEstrutura,
    alturaEstrutura,
    travasHorizontais,
    travasVerticais,
    areaEstrutura,
    estruturaCalc,
    setLarguraEstrutura,
    setAlturaEstrutura,
    setTravasHorizontais,
    setTravasVerticais,
    quantities,
    handleQuantityChange,
    total,
  } = useLuminosoCalculations(config);

  const hasValidData = total > 0;

  const productDetails = (
    <>
      {areaLona > 0 && quantidadeLona > 0 && (
        <>
          <div className="flex justify-between text-sm">
            <span>Dimensões da Lona:</span>
            <span>{larguraLona.toFixed(2)} x {alturaLona.toFixed(2)} m</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Quantidade de Lonas:</span>
            <span>{quantidadeLona} unidade(s)</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Área unitária:</span>
            <span>{areaLona.toFixed(2)} m²</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Área total:</span>
            <span>{(areaLona * quantidadeLona).toFixed(2)} m²</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Custo da Lona:</span>
            <span>{formatCurrency(calculateMinimumCharge(areaLona * config.lona) * quantidadeLona)}</span>
          </div>
        </>
      )}

      {estruturaCalc.custoTotal > 0 && (
        <>
          <div className="flex justify-between text-sm">
            <span>Dimensões da Estrutura:</span>
            <span>{larguraEstrutura.toFixed(2)} x {alturaEstrutura.toFixed(2)} m</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Área da Estrutura:</span>
            <span>{areaEstrutura.toFixed(2)} m²</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Metros Lineares:</span>
            <span>{estruturaCalc.metrosLineares.toFixed(2)} m</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Barras Necessárias:</span>
            <span>{estruturaCalc.barrasNecessarias.toFixed(2)} barras</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Barras a Pagar:</span>
            <span>{estruturaCalc.barrasInteiras} barras</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Custo da Estrutura:</span>
            <span>{formatCurrency(estruturaCalc.custoTotal)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Custo por m²:</span>
            <span>{formatCurrency(estruturaCalc.custoPorM2)}</span>
          </div>
        </>
      )}
      
      {luminosoMaterials.map(material => {
        const quantity = quantities[material.id] || 0;
        if (quantity > 0) {
          const materialPrice = config[material.id] as number;
          return (
            <div key={material.id} className="flex justify-between text-sm">
              <span>{material.label} ({quantity}x):</span>
              <span>{formatCurrency(quantity * materialPrice)}</span>
            </div>
          );
        }
        return null;
      })}
    </>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Luminoso</h2>
        <p className="text-gray-600">Configure as dimensões da lona backlight, estrutura metálica e as quantidades dos materiais necessários.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <LuminosoDimensionsForm
            larguraLona={larguraLona}
            alturaLona={alturaLona}
            quantidadeLona={quantidadeLona}
            config={config}
            onLarguraChange={setLarguraLona}
            onAlturaChange={setAlturaLona}
            onQuantidadeChange={setQuantidadeLona}
          />

          <LuminosoEstruturaForm
            larguraEstrutura={larguraEstrutura}
            alturaEstrutura={alturaEstrutura}
            travasHorizontais={travasHorizontais}
            travasVerticais={travasVerticais}
            estruturaCalc={estruturaCalc}
            estruturaConfig={config.estruturaMetalica}
            onLarguraChange={setLarguraEstrutura}
            onAlturaChange={setAlturaEstrutura}
            onTravasHorizontaisChange={setTravasHorizontais}
            onTravasVerticaisChange={setTravasVerticais}
          />

          <LuminosoMaterialsForm
            config={config}
            quantities={quantities}
            onQuantityChange={handleQuantityChange}
          />
        </div>

        <BudgetSummaryExtended
          baseTotal={total}
          config={fullConfig}
          productDetails={productDetails}
          hasValidData={hasValidData}
          emptyMessage="Configure as dimensões da lona, estrutura metálica ou as quantidades dos materiais para ver o orçamento"
        />
      </div>
    </div>
  );
};

export default LuminosoCalculator;
