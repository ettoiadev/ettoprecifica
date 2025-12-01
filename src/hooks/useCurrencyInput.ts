
import { useState, useCallback } from 'react';

export const useCurrencyInput = (initialValue: number = 0) => {
  const [displayValue, setDisplayValue] = useState(() => formatCurrency(initialValue));
  const [numericValue, setNumericValue] = useState(initialValue);

  const formatCurrency = useCallback((value: number): string => {
    if (value === 0) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  }, []);

  const parseCurrency = useCallback((value: string): number => {
    // Remove tudo exceto números
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return 0;
    // Converte para número dividindo por 100 (centavos)
    return parseFloat(numbers) / 100;
  }, []);

  const handleChange = useCallback((value: string) => {
    const numeric = parseCurrency(value);
    setNumericValue(numeric);
    setDisplayValue(formatCurrency(numeric));
  }, [parseCurrency, formatCurrency]);

  const setValue = useCallback((value: number) => {
    setNumericValue(value);
    setDisplayValue(formatCurrency(value));
  }, [formatCurrency]);

  return {
    displayValue,
    numericValue,
    handleChange,
    setValue,
  };
};
