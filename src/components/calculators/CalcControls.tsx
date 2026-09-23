import * as React from 'react';
import { Checkbox } from '../ui/checkbox';
import { cn } from '../../lib/utils';

// Controles compartilhados das calculadoras. Antes disto, cada calculadora
// repetia localmente a mesma const `inputClass` (22 cópias idênticas), a mesma
// função `btn(active)` (15 cópias, 2 variantes de cor) e o mesmo `<input
// type="checkbox">` cru (20 cópias) — ver docs/UI_COMPONENT_INVENTORY.md §3.
// Campos de texto/número usam o `Input` do shadcn direto (mesma altura dos
// campos de Configurações); aqui ficam só os controles que o shadcn não cobre
// de forma pronta.

/**
 * Classe para `<select>` nativo — espelha exatamente o `Input` do shadcn
 * (altura, borda, foco), para select e input ficarem alinhados na mesma linha.
 * `<select>` nativo foi mantido de propósito: migrar para o `Select` do shadcn
 * (Radix) muda a API e o comportamento do dropdown, é uma etapa separada.
 */
export const selectClass =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm';

type ChipVariant = 'indigo' | 'neutral';

const CHIP_BASE = 'px-4 py-3 rounded-lg border text-sm font-medium transition-colors';

const CHIP_VARIANTS: Record<ChipVariant, { base: string; active: string; idle: string }> = {
  // Lista de produto/material (Adesivos, Placas, Fachada, Laser, DTF, Lona…):
  // caixa pastel com nome + preço, alinhada à esquerda.
  indigo: {
    base: 'text-left',
    active: 'bg-indigo-100 border-indigo-400 text-indigo-800 shadow-sm',
    idle: 'bg-indigo-50/60 border-indigo-200 text-gray-700 hover:bg-indigo-100/70',
  },
  // Seletor de modo/tipo (ACM x Lona, PS x ACM, forma, faces…): rótulo curto.
  neutral: {
    base: '',
    active: 'bg-blue-50 border-blue-300 text-blue-700',
    idle: 'border-gray-300 text-gray-700 hover:bg-gray-50',
  },
};

interface OptionChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'type'> {
  active: boolean;
  variant?: ChipVariant;
}

/** Botão de seleção (tipo/material/modo) — o antigo `btn(active)` local. */
export const OptionChip: React.FC<OptionChipProps> = ({
  active,
  variant = 'neutral',
  className,
  ...props
}) => {
  const v = CHIP_VARIANTS[variant];
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(CHIP_BASE, v.base, active ? v.active : v.idle, className)}
      {...props}
    />
  );
};

interface CalcCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  children: React.ReactNode;
  /** Linha secundária de explicação abaixo do rótulo. */
  description?: React.ReactNode;
  className?: string;
}

/**
 * Caixa de opção das calculadoras ("Emitir com nota fiscal", "Incluir
 * deslocamento"…). Mantém a UX atual (a caixa inteira é clicável) usando o
 * `Checkbox` do shadcn/Radix no lugar do `<input type="checkbox">` cru.
 */
export const CalcCheckbox: React.FC<CalcCheckboxProps> = ({
  checked,
  onCheckedChange,
  children,
  description,
  className,
}) => (
  <label
    className={cn(
      'flex gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer',
      description ? 'items-start' : 'items-center',
      className
    )}
  >
    <Checkbox
      checked={checked}
      onCheckedChange={(v) => onCheckedChange(v === true)}
      className={description ? 'mt-0.5' : undefined}
    />
    <span>
      <span className="block text-sm font-medium text-gray-700">{children}</span>
      {description && <span className="block text-xs text-gray-500">{description}</span>}
    </span>
  </label>
);
