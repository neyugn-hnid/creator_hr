import React from 'react';
import { cn } from '~/lib/utils';
import { Loader2 } from 'lucide-react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {
    const variants = {
      primary:
        'bg-primary-600 text-white hover:bg-primary-500 shadow-primary border border-primary-700/20 hover:shadow-primary active:scale-[0.97]',
      secondary:
        'bg-primary-50 text-primary-700 hover:bg-primary-100 border border-primary-200/60 active:scale-[0.97]',
      outline:
        'bg-white text-surface-700 hover:bg-surface-50 border border-surface-200 shadow-warm active:scale-[0.97]',
      ghost:
        'bg-transparent text-surface-600 hover:bg-surface-100 hover:text-surface-900 border border-transparent',
      danger:
        'bg-rose-500 text-white hover:bg-rose-600 shadow-sm border border-rose-700/10 active:scale-[0.97]',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-[12px] font-medium rounded-lg gap-1.5',
      md: 'px-4 py-2 text-[13px] font-semibold rounded-lg gap-2',
      lg: 'px-5 py-2.5 text-sm font-semibold rounded-xl gap-2',
    };

    return (
      <button
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-150 focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
