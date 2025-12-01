
import React from 'react';
import { FachadaConfig, formatCurrency, calculateMinimumCharge, PricingConfig } from '../../types/pricing';
import BudgetSummaryExtended from '../BudgetSummaryExtended';
import LonaForm from './fachada/LonaForm';
import EstruturaMetalicaForm from './fachada/EstruturaMetalicaForm';
import MateriaisAdicionaisForm from './fachada/MateriaisAdicionaisForm';
import { useFachadaCalculations } from './fachada/useFachadaCalculations';

interface Props {
  config: FachadaConfig;
  fullConfig: PricingConfig;
}

const FachadaCalculator: React.FC<Props> = ({ config, fullConfig }) => {
  const {
    larguraLona,
    alturaLona,
    quantidadeLona,
    areaLona,
    areaLonaTotal,
    setLarguraLona,
    setAlturaLona,
    setQuantidadeLona,
    larguraEstrutura,
    alturaEstrutura,
    travasHorizontais,
    travasVerticais,
    estruturaCalc,
    setLarguraEstrutura,
    setAlturaEstrutura,
    setTravasHorizontais,
    setTravasVerticais,
    quantities,
    items,
    handleQuantityChange,
    total,
  } = useFachadaCalculations(config);

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
            <span>{areaLonaTotal.toFixed(2)} m²</span>
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
            <span>{(larguraEstrutura * alturaEstrutura).toFixed(2)} m²</span>
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
      
      {Object.entries(quantities).map(([key, quantity]) => {
        if (quantity > 0) {
          const item = items.find(item => item.id === key);
          if (item) {
            return (
              <div key={key} className="flex justify-between text-sm">
                <span>{item.label} ({quantity}x):</span>
                <span>{formatCurrency(quantity * item.price)}</span>
              </div>
            );
          }
        }
        return null;
      })}
    </>
  );

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Calculadora de Fachada Simples</h2>
        <p className="text-gray-600">Configure as dimensões da lona, estrutura metálica e as quantidades dos materiais necessários.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <LonaForm
            larguraLona={larguraLona}
            alturaLona={alturaLona}
            quantidadeLona={quantidadeLona}
            lonaPrice={config.lona}
            onLarguraChange={setLarguraLona}
            onAlturaChange={setAlturaLona}
            onQuantidadeChange={setQuantidadeLona}
          />

          <EstruturaMetalicaForm
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

          <MateriaisAdicionaisForm
            items={items}
            quantities={quantities}
            onQuantityChange={handleQuantityChange}
          />
        </div>

        <BudgetSummaryExtended
          baseTotal={total}
          config={fullConfig}
          productDetails={productDetails}
          hasValidData={hasValidData}
          emptyMessage="Preencha as dimensões da lona ou estrutura metálica para ver o orçamento"
        />
      </div>
    </div>
  );
};

export default FachadaCalculator;
