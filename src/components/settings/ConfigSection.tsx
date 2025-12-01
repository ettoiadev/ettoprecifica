
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { CurrencyInput } from '../ui/currency-input';
import { PercentageInput } from '../ui/percentage-input';
import { NumberInput } from '../ui/number-input';
import CustomVariationsManager from './CustomVariationsManager';
import { ProductVariation } from '../../types/pricing';

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

  // Verifica se a seção suporta variações customizadas
  const supportsCustomVariations = (sectionName: string) => {
    // Seções que podem ter variações customizadas
    const supportedSections = ['adesivo', 'lona', 'placaPS', 'letraCaixa', 'vidro'];
    return supportedSections.includes(sectionName);
  };

  // Handler para mudanças nas variações customizadas
  const handleCustomVariationsChange = (variations: ProductVariation[]) => {
    updateConfig(section, 'customVariations', variations);
  };

  // Obter variações customizadas atuais
  const currentCustomVariations = editConfig[section]?.customVariations || [];

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
            <div key={`${section}-${field.key}`} className="space-y-2">
              <label className="block text-sm font-medium text-foreground">
                {field.label} {field.unit && `(${field.unit})`}
              </label>
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
            </div>
          ))}
        </div>
        
        {supportsCustomVariations(section) && (
          <CustomVariationsManager
            variations={currentCustomVariations}
            sectionName={title}
            onChange={handleCustomVariationsChange}
          />
        )}
      </CardContent>
    </Card>
  );
});

ConfigSection.displayName = 'ConfigSection';

export default ConfigSection;
