
import * as React from "react"
import { cn } from "@/lib/utils"

export interface PercentageInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  value?: string
  onChange?: (value: string) => void
}

const PercentageInput = React.forwardRef<HTMLInputElement, PercentageInputProps>(
  ({ className, value = '', onChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const inputValue = e.target.value;
      // Remove any non-numeric characters except decimal point
      const numericValue = inputValue.replace(/[^\d.,]/g, '').replace(',', '.');
      
      // Limit to reasonable percentage values (0-999.99)
      const numValue = parseFloat(numericValue);
      if (numericValue === '' || (!isNaN(numValue) && numValue >= 0 && numValue <= 999.99)) {
        onChange?.(numericValue);
      }
    };

    const displayValue = value ? `${value}%` : '';

    return (
      <div className="relative">
        <input
          type="text"
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm pr-6",
            className
          )}
          ref={ref}
          value={displayValue}
          onChange={handleChange}
          placeholder="0%"
          {...props}
        />
      </div>
    )
  }
)
PercentageInput.displayName = "PercentageInput"

export { PercentageInput }
