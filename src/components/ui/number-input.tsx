import React, { forwardRef } from 'react';
import { Input } from './input';

interface NumberInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value: string | number;
  onChange: (value: string) => void;
  decimals?: number;
}

export const NumberInput = forwardRef<HTMLInputElement, NumberInputProps>(
  ({ value, onChange, decimals = 2, className, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let inputValue = e.target.value;
      
      // Remove tudo exceto números, vírgula e ponto
      inputValue = inputValue.replace(/[^\d,.-]/g, '');
      
      // Substitui vírgula por ponto para processamento
      inputValue = inputValue.replace(',', '.');
      
      // Valida se é um número válido
      if (inputValue === '' || inputValue === '-' || !isNaN(parseFloat(inputValue))) {
        onChange(inputValue);
      }
    };

    const handleBlur = () => {
      // Ao sair do campo, formata o número
      if (value) {
        const numValue = parseFloat(value.toString().replace(',', '.'));
        if (!isNaN(numValue)) {
          onChange(numValue.toFixed(decimals).replace('.', ','));
        }
      }
    };

    return (
      <Input
        ref={ref}
        type="text"
        value={value}
        onChange={handleChange}
        onBlur={handleBlur}
        className={className}
        {...props}
      />
    );
  }
);

NumberInput.displayName = 'NumberInput';
