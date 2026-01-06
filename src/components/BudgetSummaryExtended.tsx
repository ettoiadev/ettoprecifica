
import React, { useState, useEffect, useMemo } from 'react';
import { formatCurrency, PricingConfig } from '../types/pricing';
import { useBudgetSettings } from '../hooks/useBudgetSettings';
import { useToast } from '../hooks/use-toast';
import BudgetHeader from './budget/BudgetHeader';
import ProductDetails from './budget/ProductDetails';
import NotaFiscalSection from './budget/NotaFiscalSection';
import PaymentAndDeliverySection from './budget/PaymentAndDeliverySection';
import InstallationSection from './budget/InstallationSection';
import BudgetTotal from './budget/BudgetTotal';

interface BudgetSummaryExtendedProps {
  baseTotal: number;
  config: PricingConfig;
  productDetails: React.ReactNode;
  hasValidData: boolean;
  emptyMessage?: string;
  quantity?: string | number;
  productName?: string;
}

const BudgetSummaryExtended: React.FC<BudgetSummaryExtendedProps> = ({
  baseTotal,
  config,
  productDetails,
  hasValidData,
  emptyMessage = "Preencha os dados para ver o orçamento",
  quantity = "1",
  productName
}) => {
  const [notaFiscal, setNotaFiscal] = useState<boolean>(true);
  const [cartaoCredito, setCartaoCredito] = useState<string>('none');
  const [instalacao, setInstalacao] = useState<string>('');
  const [prazoEntrega, setPrazoEntrega] = useState<string>('7');
  const [finalTotal, setFinalTotal] = useState<number>(0);
  const { formatBudgetText } = useBudgetSettings();
  const { toast } = useToast();

  // Safety checks for config properties
  const instalacaoOptions = useMemo(() => [
    { value: 'jacarei', label: 'Jacareí', price: config?.instalacao?.jacarei || 0 },
    { value: 'sjCampos', label: 'S.J.Campos', price: config?.instalacao?.sjCampos || 0 },
    { value: 'cacapavaTaubate', label: 'Caçapava/Taubaté', price: config?.instalacao?.cacapavaTaubate || 0 },
    { value: 'litoral', label: 'Litoral', price: config?.instalacao?.litoral || 0 },
    { value: 'guararemaSantaIsabel', label: 'Guararema/Sta Isabel', price: config?.instalacao?.guararemaSantaIsabel || 0 },
    { value: 'santaBranca', label: 'Sta Branca', price: config?.instalacao?.santaBranca || 0 },
    { value: 'saoPaulo', label: 'São Paulo', price: config?.instalacao?.saoPaulo || 0 },
  ], [config?.instalacao]);

  const cartaoOptions = useMemo(() => [
    { value: 'none', label: 'Não aplicar', taxa: 0 },
    { value: 'vista', label: 'Crédito à vista', taxa: config?.cartaoCredito?.creditoVista || 0 },
    { value: '2x', label: '2x', taxa: config?.cartaoCredito?.taxa2x || 0 },
    { value: '3x', label: '3x', taxa: config?.cartaoCredito?.taxa3x || 0 },
    { value: '4x', label: '4x', taxa: config?.cartaoCredito?.taxa4x || 0 },
    { value: '5x', label: '5x', taxa: config?.cartaoCredito?.taxa5x || 0 },
    { value: '6x', label: '6x', taxa: config?.cartaoCredito?.taxa6x || 0 },
    { value: '7x', label: '7x', taxa: config?.cartaoCredito?.taxa7x || 0 },
    { value: '8x', label: '8x', taxa: config?.cartaoCredito?.taxa8x || 0 },
    { value: '9x', label: '9x', taxa: config?.cartaoCredito?.taxa9x || 0 },
    { value: '10x', label: '10x', taxa: config?.cartaoCredito?.taxa10x || 0 },
    { value: '11x', label: '11x', taxa: config?.cartaoCredito?.taxa11x || 0 },
    { value: '12x', label: '12x', taxa: config?.cartaoCredito?.taxa12x || 0 },
  ], [config?.cartaoCredito]);

  useEffect(() => {
    let total = baseTotal;

    // Adicionar taxa de nota fiscal
    if (notaFiscal && config?.notaFiscal?.percentual) {
      total += (baseTotal * config.notaFiscal.percentual) / 100;
    }

    // Adicionar taxa de cartão de crédito
    if (cartaoCredito && cartaoCredito !== 'none' && config?.cartaoCredito) {
      const selectedTaxa = cartaoCredito === 'vista' ? config.cartaoCredito.creditoVista :
                          cartaoCredito === '2x' ? config.cartaoCredito.taxa2x :
                          cartaoCredito === '3x' ? config.cartaoCredito.taxa3x :
                          cartaoCredito === '4x' ? config.cartaoCredito.taxa4x :
                          cartaoCredito === '5x' ? config.cartaoCredito.taxa5x :
                          cartaoCredito === '6x' ? config.cartaoCredito.taxa6x :
                          cartaoCredito === '7x' ? config.cartaoCredito.taxa7x :
                          cartaoCredito === '8x' ? config.cartaoCredito.taxa8x :
                          cartaoCredito === '9x' ? config.cartaoCredito.taxa9x :
                          cartaoCredito === '10x' ? config.cartaoCredito.taxa10x :
                          cartaoCredito === '11x' ? config.cartaoCredito.taxa11x :
                          cartaoCredito === '12x' ? config.cartaoCredito.taxa12x : 0;
      
      if (selectedTaxa) {
        total += (baseTotal * selectedTaxa) / 100;
      }
    }

    // Adicionar custo de instalação
    if (instalacao && config?.instalacao) {
      const instalacaoPrice = instalacao === 'jacarei' ? config.instalacao.jacarei :
                              instalacao === 'sjCampos' ? config.instalacao.sjCampos :
                              instalacao === 'cacapavaTaubate' ? config.instalacao.cacapavaTaubate :
                              instalacao === 'litoral' ? config.instalacao.litoral :
                              instalacao === 'guararemaSantaIsabel' ? config.instalacao.guararemaSantaIsabel :
                              instalacao === 'santaBranca' ? config.instalacao.santaBranca :
                              instalacao === 'saoPaulo' ? config.instalacao.saoPaulo : 0;
      
      if (instalacaoPrice) {
        total += instalacaoPrice;
      }
    }

    setFinalTotal(total);
  }, [baseTotal, notaFiscal, cartaoCredito, instalacao, config]);

  const handleNotaFiscalChange = (checked: boolean | "indeterminate") => {
    setNotaFiscal(checked === true);
  };

  const handleCopyBudget = async () => {
    // Preparar informações de parcelamento se cartão estiver selecionado
    let paymentInstallments = null;
    if (cartaoCredito && cartaoCredito !== 'none') {
      const selectedCartao = cartaoOptions.find(option => option.value === cartaoCredito);
      if (selectedCartao) {
        paymentInstallments = {
          label: selectedCartao.label,
          percentage: selectedCartao.taxa
        };
      }
    }

    const budgetText = formatBudgetText(quantity, finalTotal, prazoEntrega, productName, paymentInstallments);
    
    try {
      await navigator.clipboard.writeText(budgetText);
      const toastInstance = toast({
        title: "Orçamento copiado",
        description: "O orçamento foi copiado para a área de transferência.",
      });
      
      // Fechar automaticamente após 3 segundos
      setTimeout(() => {
        toastInstance.dismiss();
      }, 3000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Erro ao copiar",
        description: "Não foi possível copiar o orçamento.",
        variant: "destructive",
      });
    }
  };

  if (!hasValidData) {
    return (
      <div className="summary-box">
        <h3 className="section-header">Resumo do Orçamento</h3>
        <p className="text-caption text-center py-8">{emptyMessage}</p>
      </div>
    );
  }

  // Add safety check for config
  if (!config) {
    return (
      <div className="summary-box">
        <h3 className="section-header">Resumo do Orçamento</h3>
        <p className="text-caption text-center py-8">Configuração não carregada</p>
      </div>
    );
  }

  return (
    <div className="summary-box">
      <BudgetHeader onCopyBudget={handleCopyBudget} />
      
      <div className="space-y-4">
        <ProductDetails productDetails={productDetails} baseTotal={baseTotal} />
        
        <NotaFiscalSection
          notaFiscal={notaFiscal}
          onNotaFiscalChange={handleNotaFiscalChange}
          config={config}
          baseTotal={baseTotal}
        />

        <PaymentAndDeliverySection
          cartaoCredito={cartaoCredito}
          setCartaoCredito={setCartaoCredito}
          prazoEntrega={prazoEntrega}
          setPrazoEntrega={setPrazoEntrega}
          config={config}
          baseTotal={baseTotal}
        />

        <InstallationSection
          instalacao={instalacao}
          setInstalacao={setInstalacao}
          config={config}
        />
        
        <BudgetTotal finalTotal={finalTotal} />
      </div>
    </div>
  );
};

export default BudgetSummaryExtended;
