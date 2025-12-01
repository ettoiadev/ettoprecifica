
import React from 'react';
import { LuminosoConfig, formatCurrency, calculateMinimumCharge } from '../../../types/pricing';
import { luminosoMaterials } from '../../../utils/luminosoMaterials';
import { Button } from '../../ui/button';
import { Copy } from 'lucide-react';
import { useBudgetSettings } from '../../../hooks/useBudgetSettings';
import { useToast } from '../../../hooks/use-toast';

interface Props {
  larguraLona: number;
  alturaLona: number;
  quantidadeLona: number;
  quantities: Record<string, number>;
  config: LuminosoConfig;
  total: number;
}

const LuminosoSummary: React.FC<Props> = ({
  larguraLona,
  alturaLona,
  quantidadeLona,
  quantities,
  config,
  total,
}) => {
  const areaLona = larguraLona * alturaLona;
  const areaLonaTotal = areaLona * quantidadeLona;
  const { formatBudgetText } = useBudgetSettings();
  const { toast } = useToast();

  const handleCopyBudget = async () => {
    // Calcular quantidade total considerando lonas e materiais
    const totalQuantity = quantidadeLona + Object.values(quantities).reduce((sum, qty) => sum + qty, 0);
    const budgetText = formatBudgetText(totalQuantity, total, '7');
    
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

  return (
    <div className="bg-gray-50 rounded-lg p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Resumo do Orçamento</h3>
        {total > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyBudget}
            className="flex items-center gap-2"
          >
            <Copy className="w-4 h-4" />
            Copiar
          </Button>
        )}
      </div>
      
      <div className="space-y-3">
        {areaLona > 0 && quantidadeLona > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span>Dimensões da Lona Backlight:</span>
              <span>{larguraLona.toFixed(2)} x {alturaLona.toFixed(2)} m</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Quantidade de Lonas Backlight:</span>
              <span>{quantidadeLona} unidade(s)</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Área unitária backlight:</span>
              <span>{areaLona.toFixed(2)} m²</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Área total backlight:</span>
              <span>{areaLonaTotal.toFixed(2)} m²</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Custo da Lona Backlight:</span>
              <span>{formatCurrency(calculateMinimumCharge(areaLona * config.lona) * quantidadeLona)}</span>
            </div>
          </>
        )}
        
        {luminosoMaterials.map((material) => {
          const quantity = quantities[material.id];
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
        
        {total > 0 && (
          <>
            <hr className="my-3" />
            <div className="flex justify-between text-lg font-bold budget-price">
              <span>Total:</span>
              <span>{formatCurrency(total)}</span>
            </div>
          </>
        )}
      </div>

      {total === 0 && (
        <p className="text-gray-500 text-center py-8">
          Preencha as dimensões da lona backlight ou as quantidades dos materiais para ver o orçamento
        </p>
      )}
    </div>
  );
};

export default LuminosoSummary;
