
import React from 'react';
import { Input } from './input';
import { cn } from '@/lib/utils';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  placeholder = "R$ 0,00",
  className,
  disabled = false,
}) => {
  const formatCurrency = (inputValue: string): string => {
    // Remove tudo exceto números
    let numbers = inputValue.replace(/\D/g, '');
    
    if (!numbers) return '';
    
    // Converte para número e formata
    const numeric = parseFloat(numbers) / 100;
    
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numeric);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    onChange(formatted);
  };

  return (
    <Input
      type="text"
      value={value}
      onChange={handleInputChange}
      placeholder={placeholder}
      className={cn("text-right", className)}
      disabled={disabled}
    />
  );
};
