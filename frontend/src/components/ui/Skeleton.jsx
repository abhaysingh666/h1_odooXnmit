import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'rounded-md bg-gradient-to-r from-muted via-muted/50 to-muted bg-[length:200%_100%]',
        'animate-shimmer',
        className
      )}
      {...props}
    />
  );
}

export function Separator({ className, orientation = 'horizontal', ...props }) {
  return (
    <div
      role="separator"
      aria-orientation={orientation}
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      {...props}
    />
  );
}

export function Progress({ value = 0, className, indicatorClassName, ...props }) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn('h-1.5 w-full overflow-hidden rounded-full bg-muted', className)}
      {...props}
    >
      <div
        className={cn('h-full rounded-full bg-primary transition-[width,background-color] duration-500', indicatorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
