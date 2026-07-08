
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CurrencyInput } from '../ui/currency-input';
import { PercentageInput } from '../ui/percentage-input';
import { NumberInput } from '../ui/number-input';
import CustomVariationsManager from './CustomVariationsManager';

interface ListManagerDef {
  key: string;
  label: string;
  addLabel: string;
  unitDefault?: string;
  showCategory?: boolean;
  showMinPrice?: boolean;
}

// Seções com listas editáveis (CRUD) e a quais chaves da config elas apontam.
// showMinPrice: habilita o "Valor mínimo (R$)" por item nas calculadoras de lista
// que aplicam piso ao total (Adesivo, Placa PS, Placa ACM, Letra PVC, Vidro, Laser).
const LIST_MANAGERS: Record<string, ListManagerDef[]> = {
  adesivo: [{ key: 'variations', label: 'Opções de Adesivo', addLabel: 'Adicionar Opção', showMinPrice: true }],
  lona: [{ key: 'variations', label: 'Tipos de Lona', addLabel: 'Adicionar Tipo' }],
  placaPS: [
    { key: 'variations', label: 'Espessuras', addLabel: 'Adicionar Espessura', showMinPrice: true },
    { key: 'customVariations', label: 'Variações Adicionais (somam ao m²)', addLabel: 'Adicionar Variação' },
  ],
  placaACM: [{ key: 'variations', label: 'Tipos de ACM', addLabel: 'Adicionar Tipo', showMinPrice: true }],
  letraCaixa: [{ key: 'variations', label: 'Espessuras', addLabel: 'Adicionar Espessura', showMinPrice: true }],
  vidro: [{ key: 'variations', label: 'Espessuras', addLabel: 'Adicionar Espessura', showMinPrice: true }],
  laser: [{ key: 'variations', label: 'Materiais', addLabel: 'Adicionar Material', showCategory: true, showMinPrice: true }],
  arteFinal: [
    { key: 'customVariations', label: 'Opções de Arte Final', addLabel: 'Adicionar Opção', unitDefault: 'serviço' },
  ],
  instalacao: [
    { key: 'variations', label: 'Localidades', addLabel: 'Adicionar Localidade', unitDefault: 'serviço' },
  ],
};

interface ConfigSectionProps {
  title: string;
  section: string;
  fields: Array<{key: string, label: string, unit?: string}>;
  editConfig: any;
  updateConfig: (section: string, field: string, value: any) => void;
}

const ConfigSection = React.memo<ConfigSectionProps>(({ title, section, fields, editConfig, updateConfig }) => {
  const getFieldValue = (field: string) => {
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      return editConfig[section]?.[parentField]?.[childField] || '';
    }
    return editConfig[section]?.[field] || '';
  };

  const handleFieldChange = (field: string, value: string) => {
    if (field.includes('.')) {
      const [parentField, childField] = field.split('.');
      // Create nested object update
      const currentParent = editConfig[section]?.[parentField] || {};
      const updatedParent = { ...currentParent, [childField]: value };
      updateConfig(section, parentField, updatedParent);
    } else {
      updateConfig(section, field, value);
    }
  };

  const isPercentageField = (sectionName: string, fieldKey: string) => {
    // Nota Fiscal
    if (sectionName === 'notaFiscal' && fieldKey === 'percentual') {
      return true;
    }
    
    // Todos os campos de Cartão de Crédito
    if (sectionName === 'cartaoCredito') {
      return true;
    }
    
    return false;
  };

  const isMeasurementField = (sectionName: string, fieldKey: string) => {
    // Campos de comprimento da estrutura metálica em Fachada e Luminoso
    if ((sectionName === 'fachada' || sectionName === 'luminoso') && 
        fieldKey.includes('comprimentoBarra')) {
      return true;
    }
    return false;
  };

  // Gerenciadores de lista (CRUD) por seção. Cada item aponta para uma lista
  // ProductVariation[] dentro da config da seção.
  const sectionListManagers = LIST_MANAGERS[section] || [];

  return (
    <Card className="bg-card/80 backdrop-blur-xl border-border/50 shadow-lg hover:shadow-xl transition-all duration-300">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {fields.map(field => (
            <label key={`${section}-${field.key}`} className="space-y-2 block">
              <span className="block text-sm font-medium text-foreground">
                {field.label} {field.unit && `(${field.unit})`}
              </span>
              {isPercentageField(section, field.key) ? (
                <PercentageInput
                  value={getFieldValue(field.key)}
                  onChange={(value) => handleFieldChange(field.key, value)}
                  className="hover:bg-background/70"
                />
              ) : isMeasurementField(section, field.key) ? (
                <NumberInput
                  value={getFieldValue(field.key)}
                  onChange={(value) => handleFieldChange(field.key, value)}
                  placeholder="0,00"
                  className="hover:bg-background/70"
                />
              ) : (
                <CurrencyInput
                  value={getFieldValue(field.key)}
                  onChange={(value) => handleFieldChange(field.key, value)}
                  placeholder="R$ 0,00"
                  className="hover:bg-background/70"
                />
              )}
            </label>
          ))}
        </div>
        
        {sectionListManagers.map((mgr) => (
          <CustomVariationsManager
            key={mgr.key}
            variations={editConfig[section]?.[mgr.key] || []}
            sectionName={title}
            onChange={(list) => updateConfig(section, mgr.key, list)}
            label={mgr.label}
            addLabel={mgr.addLabel}
            unitDefault={mgr.unitDefault}
            showCategory={mgr.showCategory}
            showMinPrice={mgr.showMinPrice}
          />
        ))}
      </CardContent>
    </Card>
  );
});

ConfigSection.displayName = 'ConfigSection';

export default ConfigSection;
