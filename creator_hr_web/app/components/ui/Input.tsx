import React from 'react';
import { cn } from '~/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).substring(7)}`;
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-[12px] font-semibold text-surface-700 mb-1.5 tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={cn(
            'flex w-full rounded-lg border bg-white px-3 py-2 text-[13px] text-surface-900',
            'placeholder:text-surface-400 font-medium',
            'border-surface-200 hover:border-surface-300',
            'focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-400',
            'disabled:cursor-not-allowed disabled:bg-surface-50 disabled:text-surface-400',
            'transition-all duration-150',
            error && 'border-rose-400 focus:ring-rose-400/30 focus:border-rose-400',
            className
          )}
          {...props}
        />
        {hint && !error && (
          <p className="mt-1 text-[11px] text-surface-400">{hint}</p>
        )}
        {error && (
          <p className="mt-1 text-[11px] text-rose-500 font-medium">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
