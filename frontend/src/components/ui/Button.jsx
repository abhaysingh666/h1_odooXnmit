import { forwardRef } from 'react';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary:
    'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-dark)] shadow-[var(--shadow-card)] disabled:hover:bg-[var(--color-accent)]',
  secondary:
    'bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dark)] shadow-[var(--shadow-card)] disabled:hover:bg-[var(--color-primary)]',
  outline:
    'bg-white text-[var(--color-ink)] border border-[var(--color-line-strong)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]',
  ghost: 'bg-transparent text-[var(--color-ink-soft)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-ink)]',
  danger: 'bg-white text-[var(--color-danger)] border border-[var(--color-danger)]/30 hover:bg-[var(--color-danger-soft)]',
};

const SIZES = {
  sm: 'h-8 px-3 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-[15px] gap-2',
};

const Button = forwardRef(
  ({ variant = 'primary', size = 'md', isLoading = false, className = '', children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex select-none items-center justify-center whitespace-nowrap rounded-[var(--radius-control)] font-medium transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98] ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
        {...props}
      >
        {isLoading && <Loader2 size={size === 'sm' ? 14 : 16} className="animate-spin" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
export default Button;
