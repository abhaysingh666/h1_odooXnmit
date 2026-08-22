import { cn } from '@/lib/utils';

/** The Dayflow "D" mark — a gradient tile in the primary/accent pair. */
export function LogoMark({ className, size = 'default' }) {
  const sizes = {
    sm: 'size-7 rounded-md',
    default: 'size-9 rounded-lg',
    lg: 'size-11 rounded-xl',
    xl: 'size-14 rounded-2xl',
  };

  return (
    <span
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden',
        'bg-gradient-to-br from-primary to-accent shadow-md shadow-primary/20',
        sizes[size],
        className
      )}
      aria-hidden="true"
    >
      <svg viewBox="0 0 32 32" className="size-[62%]" fill="none">
        <path
          d="M10 9.5h5.5a6.5 6.5 0 0 1 0 13H10z"
          stroke="var(--primary-foreground)"
          strokeWidth="2.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="21.6" cy="16" r="1.7" fill="var(--primary-foreground)" />
      </svg>
    </span>
  );
}

/** Logo mark + wordmark + tagline. */
export function Logo({ className, size = 'default', showTagline = false, tagline }) {
  const text = {
    sm: 'text-sm',
    default: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl',
  };

  return (
    <span className={cn('flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      <span className="flex min-w-0 flex-col">
        <span className={cn('truncate font-semibold leading-tight tracking-tight', text[size])}>
          Dayflow <span className="text-primary">HRMS</span>
        </span>
        {showTagline && (
          <span className="truncate text-xs leading-tight text-muted-foreground">
            {tagline ?? 'Every workday, perfectly aligned'}
          </span>
        )}
      </span>
    </span>
  );
}
