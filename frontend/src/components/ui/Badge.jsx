import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-medium transition-colors [&_svg]:size-3',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-transparent bg-secondary text-secondary-foreground',
        outline: 'border-border text-foreground',
        subtle: 'border-primary/20 bg-primary/10 text-primary',
        success:
          'border-transparent bg-chart-3/20 text-[color-mix(in_oklab,var(--chart-3)_72%,var(--foreground))]',
        warning:
          'border-transparent bg-chart-4/25 text-[color-mix(in_oklab,var(--chart-4)_68%,var(--foreground))]',
        destructive: 'border-transparent bg-destructive/15 text-destructive',
        accent: 'border-transparent bg-accent text-accent-foreground',
      },
    },
    defaultVariants: { variant: 'default' },
  }
);

export function Badge({ className, variant, children, ...props }) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </span>
  );
}

/** Small pulsing status dot, e.g. "Verified" / "Pending". */
export function StatusDot({ tone = 'success', pulse = false, className }) {
  const tones = {
    success: 'bg-chart-3',
    warning: 'bg-chart-4',
    destructive: 'bg-destructive',
    muted: 'bg-muted-foreground',
    primary: 'bg-primary',
  };
  return (
    <span className={cn('relative flex size-2', className)} aria-hidden="true">
      {pulse && (
        <span
          className={cn('absolute inline-flex size-full animate-ping rounded-full opacity-60', tones[tone])}
        />
      )}
      <span className={cn('relative inline-flex size-2 rounded-full', tones[tone])} />
    </span>
  );
}

export { badgeVariants };
