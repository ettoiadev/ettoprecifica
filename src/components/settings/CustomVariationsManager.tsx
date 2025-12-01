import React, { useState } from 'react';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { ProductVariation } from '../../types/pricing';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';

interface CustomVariationsManagerProps {
  variations: ProductVariation[];
  sectionName: string;
  onChange: (variations: ProductVariation[]) => void;
}

const CustomVariationsManager: React.FC<CustomVariationsManagerProps> = ({
  variations = [],
  sectionName,
  onChange,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVariation, setEditingVariation] = useState<ProductVariation | null>(null);
  const [formData, setFormData] = useState({ label: '', price: '', unit: 'm²' });

  const handleOpenDialog = (variation?: ProductVariation) => {
    if (variation) {
      setEditingVariation(variation);
      setFormData({
        label: variation.label,
        price: variation.price.toString(),
        unit: variation.unit || 'm²',
      });
    } else {
      setEditingVariation(null);
      setFormData({ label: '', price: '', unit: 'm²' });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingVariation(null);
    setFormData({ label: '', price: '', unit: 'm²' });
  };

  const handleSave = () => {
    if (!formData.label || !formData.price) {
      return;
    }

    const newVariation: ProductVariation = {
      id: editingVariation?.id || `custom_${Date.now()}`,
      label: formData.label,
      price: parseFloat(formData.price),
      unit: formData.unit,
    };

    let updatedVariations: ProductVariation[];
    if (editingVariation) {
      // Editar variação existente
      updatedVariations = variations.map((v) =>
        v.id === editingVariation.id ? newVariation : v
      );
    } else {
      // Adicionar nova variação
      updatedVariations = [...variations, newVariation];
    }

    onChange(updatedVariations);
    handleCloseDialog();
  };

  const handleDelete = (id: string) => {
    const updatedVariations = variations.filter((v) => v.id !== id);
    onChange(updatedVariations);
  };

  return (
    <div className="mt-4 pt-4 border-t border-gray-200">
      <div className="flex items-center justify-between mb-3">
        <Label className="text-sm font-semibold text-gray-700">
          Variações Customizadas
        </Label>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => handleOpenDialog()}
          className="h-8 gap-1"
        >
          <Plus className="w-4 h-4" />
          Adicionar Variação
        </Button>
      </div>

      {variations.length > 0 && (
        <div className="space-y-2">
          {variations.map((variation) => (
            <div
              key={variation.id}
              className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
            >
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-900">
                  {variation.label}
                </div>
                <div className="text-xs text-gray-500">
                  R$ {variation.price.toFixed(2)} / {variation.unit || 'm²'}
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenDialog(variation)}
                  className="h-8 w-8 p-0"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => handleDelete(variation.id)}
                  className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingVariation ? 'Editar Variação' : 'Nova Variação'}
            </DialogTitle>
            <DialogDescription>
              {editingVariation
                ? 'Edite os dados da variação de produto.'
                : 'Adicione uma nova variação customizada para ' + sectionName + '.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="label">Nome da Variação</Label>
              <Input
                id="label"
                placeholder="Ex: Refletivo"
                value={formData.label}
                onChange={(e) =>
                  setFormData({ ...formData, label: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="price">Preço</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="unit">Unidade</Label>
              <Input
                id="unit"
                placeholder="m², unid, etc"
                value={formData.unit}
                onChange={(e) =>
                  setFormData({ ...formData, unit: e.target.value })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseDialog}
            >
              Cancelar
            </Button>
            <Button type="button" onClick={handleSave}>
              {editingVariation ? 'Salvar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomVariationsManager;
