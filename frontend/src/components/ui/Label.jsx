import { cn } from '@/lib/utils';

export function Label({ className, children, required = false, hint, htmlFor, ...props }) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <label
        htmlFor={htmlFor}
        className={cn(
          'text-sm font-medium leading-none text-foreground',
          'peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
          className
        )}
        {...props}
      >
        {children}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

/** Small helper / validation text rendered under a field. */
export function FieldHint({ children, error = false, className }) {
  if (!children) return null;
  return (
    <p
      className={cn(
        'text-xs',
        error ? 'text-destructive' : 'text-muted-foreground',
        className
      )}
    >
      {children}
    </p>
  );
}

/** Label + control + hint, with consistent spacing. */
export function Field({ label, htmlFor, required, hint, error, children, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {label && (
        <Label htmlFor={htmlFor} required={required} hint={hint}>
          {label}
        </Label>
      )}
      {children}
      <FieldHint error={!!error}>{error}</FieldHint>
    </div>
  );
}
