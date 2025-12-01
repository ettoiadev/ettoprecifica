
import { useState, useEffect } from 'react';
import { FachadaConfig, calculateMinimumCharge } from '../../../types/pricing';

export const useFachadaCalculations = (config: FachadaConfig) => {
  const [larguraLona, setLarguraLona] = useState<number>(0);
  const [alturaLona, setAlturaLona] = useState<number>(0);
  const [quantidadeLona, setQuantidadeLona] = useState<number>(1);
  
  const [larguraEstrutura, setLarguraEstrutura] = useState<number>(0);
  const [alturaEstrutura, setAlturaEstrutura] = useState<number>(0);
  const [travasHorizontais, setTravasHorizontais] = useState<number>(0);
  const [travasVerticais, setTravasVerticais] = useState<number>(0);
  
  const [quantities, setQuantities] = useState({
    acm122: 0,
    acm150: 0,
    cantoneira: 0,
  });
  
  const [total, setTotal] = useState<number>(0);

  const areaLona = larguraLona * alturaLona;
  const areaLonaTotal = areaLona * quantidadeLona;
  const areaEstrutura = larguraEstrutura * alturaEstrutura;

  const calcularEstruturaMetalica = () => {
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
    
    // Usar preço configurável por barra
    const custoTotal = barrasInteiras * config.estruturaMetalica.precoPorBarra;
    
    // Custo por m² é informativo: total dividido pela área
    const custoPorM2 = areaEstrutura > 0 ? custoTotal / areaEstrutura : 0;

    return {
      metrosLineares,
      barrasNecessarias,
      barrasInteiras,
      custoTotal,
      custoPorM2
    };
  };

  const estruturaCalc = calcularEstruturaMetalica();

  const items = [
    { id: 'cantoneira', label: 'Cantoneira 3/4', price: config.cantoneira, unit: 'unid' },
    { id: 'acm122', label: 'ACM 1.22m', price: config.acm122, unit: 'unid' },
    { id: 'acm150', label: 'ACM 1.50m', price: config.acm150, unit: 'unid' },
  ];

  useEffect(() => {
    let totalValue = 0;
    
    if (areaLona > 0 && quantidadeLona > 0) {
      const unitLonaTotal = calculateMinimumCharge(areaLona * config.lona);
      totalValue += unitLonaTotal * quantidadeLona;
    }
    
    Object.entries(quantities).forEach(([key, quantity]) => {
      if (quantity > 0) {
        const item = items.find(item => item.id === key);
        if (item) {
          totalValue += quantity * item.price;
        }
      }
    });
    
    totalValue += estruturaCalc.custoTotal;
    
    setTotal(totalValue);
  }, [larguraLona, alturaLona, quantidadeLona, quantities, config, estruturaCalc.custoTotal]);

  const handleQuantityChange = (itemId: string, value: number) => {
    setQuantities(prev => ({
      ...prev,
      [itemId]: value
    }));
  };

  return {
    // Lona state
    larguraLona,
    alturaLona,
    quantidadeLona,
    areaLona,
    areaLonaTotal,
    setLarguraLona,
    setAlturaLona,
    setQuantidadeLona,
    
    // Estrutura state
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
    
    // Materials state
    quantities,
    items,
    handleQuantityChange,
    
    // Total
    total,
  };
};
