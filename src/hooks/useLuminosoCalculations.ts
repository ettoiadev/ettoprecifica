
import { useState, useEffect, useMemo, useCallback } from 'react';
import { LuminosoConfig, calculateMinimumCharge } from '../types/pricing';
import { getInitialQuantities, luminosoMaterials } from '../utils/luminosoMaterials';

export const useLuminosoCalculations = (config: LuminosoConfig) => {
  const [larguraLona, setLarguraLona] = useState<number>(0);
  const [alturaLona, setAlturaLona] = useState<number>(0);
  const [quantidadeLona, setQuantidadeLona] = useState<number>(1);
  
  const [larguraEstrutura, setLarguraEstrutura] = useState<number>(0);
  const [alturaEstrutura, setAlturaEstrutura] = useState<number>(0);
  const [travasHorizontais, setTravasHorizontais] = useState<number>(0);
  const [travasVerticais, setTravasVerticais] = useState<number>(0);
  
  const [quantities, setQuantities] = useState(getInitialQuantities());
  const [total, setTotal] = useState<number>(0);

  const areaLona = useMemo(() => larguraLona * alturaLona, [larguraLona, alturaLona]);
  const areaEstrutura = useMemo(() => larguraEstrutura * alturaEstrutura, [larguraEstrutura, alturaEstrutura]);

  const calcularEstruturaMetalica = useMemo(() => {
    if (larguraEstrutura <= 0 || alturaEstrutura <= 0) {
      return {
        metrosLineares: 0,
        barrasNecessarias: 0,
        barrasInteiras: 0,
        custoTotal: 0,
        custoPorM2: 0
      };
    }

    const perimetro = 2 * (larguraEstrutura + alturaEstrutura);
    const metrosTravasHorizontais = travasHorizontais * larguraEstrutura;
    const metrosTravasVerticais = travasVerticais * alturaEstrutura;
    const metrosLineares = perimetro + metrosTravasHorizontais + metrosTravasVerticais;
    
    const comprimentoBarra = config.estruturaMetalica.comprimentoBarra;
    const barrasNecessarias = metrosLineares / comprimentoBarra;
    const barrasInteiras = Math.ceil(barrasNecessarias);
    
    const precoPorBarra = config.estruturaMetalica.precoPorBarra;
    const custoTotal = barrasInteiras * precoPorBarra;
    
    const custoPorM2 = areaEstrutura > 0 ? custoTotal / areaEstrutura : 0;

    return {
      metrosLineares,
      barrasNecessarias,
      barrasInteiras,
      custoTotal,
      custoPorM2
    };
  }, [larguraEstrutura, alturaEstrutura, travasHorizontais, travasVerticais, config.estruturaMetalica, areaEstrutura]);

  const handleQuantityChange = useCallback((itemId: string, value: number) => {
    const validValue = Math.max(0, value || 0);
    setQuantities(prev => ({
      ...prev,
      [itemId]: validValue
    }));
  }, []);

  useEffect(() => {
    let totalValue = 0;
    
    // Calculate lona cost
    if (areaLona > 0 && quantidadeLona > 0) {
      const unitLonaTotal = calculateMinimumCharge(areaLona * config.lona);
      totalValue += unitLonaTotal * quantidadeLona;
    }
    
    // Calculate unit items cost using centralized materials
    luminosoMaterials.forEach(material => {
      const quantity = quantities[material.id] || 0;
      if (quantity > 0) {
        const materialPrice = config[material.id] as number;
        totalValue += quantity * materialPrice;
      }
    });
    
    // Add estrutura metalica cost
    totalValue += calcularEstruturaMetalica.custoTotal;
    
    setTotal(totalValue);
  }, [areaLona, quantidadeLona, quantities, config, calcularEstruturaMetalica.custoTotal]);

  return {
    // Lona state
    larguraLona,
    alturaLona,
    quantidadeLona,
    areaLona,
    setLarguraLona,
    setAlturaLona,
    setQuantidadeLona,
    
    // Estrutura state
    larguraEstrutura,
    alturaEstrutura,
    travasHorizontais,
    travasVerticais,
    areaEstrutura,
    estruturaCalc: calcularEstruturaMetalica,
    setLarguraEstrutura,
    setAlturaEstrutura,
    setTravasHorizontais,
    setTravasVerticais,
    
    // Materials state
    quantities,
    handleQuantityChange,
    
    // Total
    total,
  };
};
