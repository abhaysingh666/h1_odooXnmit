import { cn } from '@/lib/utils';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';

/** Page title + description + optional actions row. */
export function PageHeader({ title, description, actions, icon: Icon, className }) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between',
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3.5">
        {Icon && (
          <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">{description}</p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Metric tile for the dashboards. */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'primary',
  className,
  style,
}) {
  const tones = {
    primary: 'bg-primary/10 text-primary',
    accent: 'bg-accent/60 text-accent-foreground',
    success: 'bg-chart-3/18 text-[color-mix(in_oklab,var(--chart-3)_78%,var(--foreground))]',
    warning: 'bg-chart-4/25 text-[color-mix(in_oklab,var(--chart-4)_72%,var(--foreground))]',
    muted: 'bg-muted text-muted-foreground',
  };

  return (
    <Card
      hoverable
      className={cn('animate-fade-up stagger overflow-hidden', className)}
      style={style}
    >
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0 space-y-1">
          <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </p>
          <p className="text-2xl font-semibold tracking-tight tabular-nums">{value}</p>
          {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
        </div>
        {Icon && (
          <span className={cn('grid size-10 shrink-0 place-items-center rounded-lg', tones[tone])}>
            <Icon className="size-5" aria-hidden="true" />
          </span>
        )}
      </CardContent>
    </Card>
  );
}

/** Placeholder for lists with nothing in them yet. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  className,
  children,
}) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 py-12 text-center', className)}>
      {Icon && (
        <span className="mb-4 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
          <Icon className="size-6" aria-hidden="true" />
        </span>
      )}
      <p className="text-sm font-semibold">{title}</p>
      {description && (
        <p className="mt-1.5 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
      )}
      {actionLabel && onAction && (
        <Button onClick={onAction} className="mt-5" size="sm">
          {actionLabel}
        </Button>
      )}
      {children}
    </div>
  );
}

/** Label/value row used by the profile and employee detail panels. */
export function DetailRow({ label, value, icon: Icon, mono = false, children, className }) {
  return (
    <div className={cn('flex items-start justify-between gap-4 py-2.5', className)}>
      <span className="flex shrink-0 items-center gap-2 text-sm text-muted-foreground">
        {Icon && <Icon className="size-4" aria-hidden="true" />}
        {label}
      </span>
      {children ?? (
        <span
          className={cn(
            'min-w-0 break-words text-right text-sm font-medium',
            mono && 'font-mono text-[0.8125rem]'
          )}
        >
          {value ?? '—'}
        </span>
      )}
    </div>
  );
}
