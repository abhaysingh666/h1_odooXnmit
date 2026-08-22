import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Text input. Pass `icon` for a leading glyph and `invalid` to switch the ring
 * and border to the destructive colour.
 */
export const Input = forwardRef(function Input(
  { className, type = 'text', icon: Icon, invalid = false, trailing, ...props },
  ref
) {
  const field = (
    <input
      ref={ref}
      type={type}
      aria-invalid={invalid || undefined}
      className={cn(
        'flex h-10 w-full rounded-md border bg-card px-3 py-2 text-sm text-foreground shadow-2xs',
        'transition-[border-color,box-shadow,background-color] duration-200',
        'placeholder:text-muted-foreground/70',
        'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:border-ring',
        'disabled:cursor-not-allowed disabled:opacity-60 disabled:bg-muted/40',
        invalid ? 'border-destructive focus-visible:ring-destructive/50' : 'border-border',
        Icon && 'pl-10',
        trailing && 'pr-10',
        className
      )}
      {...props}
    />
  );

  if (!Icon && !trailing) return field;

  return (
    <div className="relative">
      {Icon && (
        <Icon
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      )}
      {field}
      {trailing && (
        <div className="absolute right-1 top-1/2 -translate-y-1/2">{trailing}</div>
      )}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea({ className, invalid, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'flex min-h-20 w-full rounded-md border bg-card px-3 py-2 text-sm shadow-2xs',
        'placeholder:text-muted-foreground/70 transition-[border-color,box-shadow]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:border-ring',
        'disabled:cursor-not-allowed disabled:opacity-60',
        invalid ? 'border-destructive' : 'border-border',
        className
      )}
      {...props}
    />
  );
});

export const Select = forwardRef(function Select({ className, children, invalid, ...props }, ref) {
  return (
    <div className="relative">
      <select
        ref={ref}
        aria-invalid={invalid || undefined}
        className={cn(
          'flex h-10 w-full appearance-none rounded-md border bg-card px-3 pr-9 text-sm shadow-2xs',
          'transition-[border-color,box-shadow] cursor-pointer',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:border-ring',
          'disabled:cursor-not-allowed disabled:opacity-60',
          invalid ? 'border-destructive' : 'border-border',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <svg
        className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        aria-hidden="true"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
});
