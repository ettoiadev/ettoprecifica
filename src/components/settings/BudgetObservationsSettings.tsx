
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { useBudgetSettings } from '../../hooks/useBudgetSettings';
import { useToast } from '../../hooks/use-toast';

const BudgetObservationsSettings: React.FC = () => {
  const { observations, saveObservations } = useBudgetSettings();
  const [editObservations, setEditObservations] = useState(observations);
  const { toast } = useToast();

  const handleSave = () => {
    saveObservations(editObservations);
    toast({
      title: "Configurações salvas",
      description: "As observações do orçamento foram atualizadas.",
    });
  };

  const handleReset = () => {
    const defaultObservations = {
      paymentMethod: "- Entrada de 50% do valor e restante na retirada.\n- Parcelado no cartão a combinar.",
      deliveryTime: "- Entrega do pedido em 7 úteis após a aprovação de arte e pagamento.",
      warranty: "*GARANTIA DE 3 MESES PARA O SERVIÇO ENTREGUE CONFORME A LEI Nº 8.078, DE 11 DE SETEMBRO DE 1990. Art. 26."
    };
    setEditObservations(defaultObservations);
  };

  return (
    <Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          Observações do Orçamento
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Configure as observações que serão incluídas quando o orçamento for copiado
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label className="form-label">Forma de Pagamento</Label>
          <textarea
            value={editObservations.paymentMethod}
            onChange={(e) => setEditObservations(prev => ({ ...prev, paymentMethod: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-transparent input-enhanced resize-none"
            rows={3}
            placeholder="Digite as informações sobre forma de pagamento..."
          />
        </div>

        <div className="space-y-2">
          <Label className="form-label">Prazo de Entrega</Label>
          <textarea
            value={editObservations.deliveryTime}
            onChange={(e) => setEditObservations(prev => ({ ...prev, deliveryTime: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-transparent input-enhanced resize-none"
            rows={2}
            placeholder="Digite as informações sobre prazo de entrega..."
          />
        </div>

        <div className="space-y-2">
          <Label className="form-label">Garantia</Label>
          <textarea
            value={editObservations.warranty}
            onChange={(e) => setEditObservations(prev => ({ ...prev, warranty: e.target.value }))}
            className="w-full px-3 py-2 border border-border rounded-md bg-background text-foreground focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:border-transparent input-enhanced resize-none"
            rows={2}
            placeholder="Digite as informações sobre garantia..."
          />
        </div>

        <div className="flex gap-3">
          <Button onClick={handleSave} className="flex-1">
            Salvar Alterações
          </Button>
          <Button variant="outline" onClick={handleReset}>
            Restaurar Padrão
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default BudgetObservationsSettings;
