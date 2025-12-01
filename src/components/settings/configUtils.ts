
import { PricingConfig } from '../../types/pricing';

const isPercentageField = (section: string, field: string) => {
  // Nota Fiscal
  if (section === 'notaFiscal' && field === 'percentual') {
    return true;
  }
  
  // Todos os campos de Cartão de Crédito são porcentagens
  if (section === 'cartaoCredito') {
    return true;
  }
  
  return false;
};

// Identifica campos que são medidas físicas (metros, kg, etc.) e não devem ser formatados como moeda
const isMeasurementField = (section: string, field: string) => {
  // Campos de comprimento da estrutura metálica em Fachada e Luminoso
  if ((section === 'fachada' || section === 'luminoso') && 
      field.includes('comprimentoBarra')) {
    return true;
  }
  return false;
};

export const convertConfigToCurrency = (config: PricingConfig) => {
  const result: any = {};
  Object.keys(config).forEach(section => {
    result[section] = {};
    const sectionData = config[section as keyof PricingConfig] as any;
    Object.keys(sectionData).forEach(field => {
      const value = sectionData[field];
      
      // Preservar arrays (customVariations) sem conversão
      if (Array.isArray(value)) {
        result[section][field] = value;
        return;
      }
      
      if (typeof value === 'object' && value !== null) {
        // Handle nested objects like estruturaMetalica
        result[section][field] = {};
        Object.keys(value).forEach(nestedField => {
          const nestedValue = value[nestedField];
          const fullFieldPath = `${field}.${nestedField}`;
          
          if (isPercentageField(section, fullFieldPath)) {
            result[section][field][nestedField] = nestedValue.toString();
          } else if (isMeasurementField(section, fullFieldPath)) {
            // Formatar como número simples (não como moeda)
            result[section][field][nestedField] = nestedValue.toFixed(2).replace('.', ',');
          } else {
            result[section][field][nestedField] = new Intl.NumberFormat('pt-BR', {
              style: 'currency',
              currency: 'BRL',
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(nestedValue);
          }
        });
      } else {
        if (isPercentageField(section, field)) {
          result[section][field] = value.toString();
        } else if (isMeasurementField(section, field)) {
          // Formatar como número simples (não como moeda)
          result[section][field] = value.toFixed(2).replace('.', ',');
        } else {
          result[section][field] = new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(value);
        }
      }
    });
  });
  return result;
};

export const convertCurrencyToNumbers = (currencyConfig: any): PricingConfig => {
  const result: any = {};
  Object.keys(currencyConfig).forEach(section => {
    result[section] = {};
    Object.keys(currencyConfig[section]).forEach(field => {
      const fieldValue = currencyConfig[section][field];
      
      // Preservar arrays (customVariations) sem conversão
      if (Array.isArray(fieldValue)) {
        result[section][field] = fieldValue;
        return;
      }
      
      if (typeof fieldValue === 'object' && fieldValue !== null) {
        // Handle nested objects like estruturaMetalica
        result[section][field] = {};
        Object.keys(fieldValue).forEach(nestedField => {
          const value = fieldValue[nestedField];
          const fullFieldPath = `${field}.${nestedField}`;
          
          if (isPercentageField(section, fullFieldPath)) {
            const numericValue = parseFloat(value) || 0;
            result[section][field][nestedField] = numericValue;
          } else if (isMeasurementField(section, fullFieldPath)) {
            // Campos de medida: apenas substituir vírgula por ponto
            const cleanValue = value.toString().replace(',', '.');
            const numericValue = parseFloat(cleanValue) || 0;
            result[section][field][nestedField] = numericValue;
          } else {
            const cleanValue = value.replace(/[R$\s.]/g, '').replace(',', '.');
            const numericValue = parseFloat(cleanValue) || 0;
            result[section][field][nestedField] = numericValue;
          }
        });
      } else {
        if (isPercentageField(section, field)) {
          const numericValue = parseFloat(fieldValue) || 0;
          result[section][field] = numericValue;
        } else if (isMeasurementField(section, field)) {
          // Campos de medida: apenas substituir vírgula por ponto
          const cleanValue = fieldValue.toString().replace(',', '.');
          const numericValue = parseFloat(cleanValue) || 0;
          result[section][field] = numericValue;
        } else {
          const cleanValue = fieldValue.replace(/[R$\s.]/g, '').replace(',', '.');
          const numericValue = parseFloat(cleanValue) || 0;
          result[section][field] = numericValue;
        }
      }
    });
  });
  return result as PricingConfig;
};
