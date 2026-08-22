import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const tones = {
  info: {
    icon: Info,
    wrap: 'border-primary/25 bg-primary/8 text-foreground',
    icons: 'text-primary',
  },
  success: {
    icon: CheckCircle2,
    wrap: 'border-chart-3/35 bg-chart-3/10 text-foreground',
    icons: 'text-[color-mix(in_oklab,var(--chart-3)_78%,var(--foreground))]',
  },
  warning: {
    icon: AlertTriangle,
    wrap: 'border-chart-4/45 bg-chart-4/12 text-foreground',
    icons: 'text-[color-mix(in_oklab,var(--chart-4)_72%,var(--foreground))]',
  },
  error: {
    icon: AlertCircle,
    wrap: 'border-destructive/35 bg-destructive/10 text-foreground',
    icons: 'text-destructive',
  },
};

export function Alert({ tone = 'info', title, children, className, onDismiss, icon }) {
  const config = tones[tone] ?? tones.info;
  const Icon = icon ?? config.icon;

  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn(
        'flex animate-fade-in items-start gap-3 rounded-md border p-3 text-sm',
        config.wrap,
        className
      )}
    >
      <Icon className={cn('mt-0.5 size-4 shrink-0', config.icons)} aria-hidden="true" />
      <div className="min-w-0 flex-1 space-y-0.5">
        {title && <p className="font-medium leading-snug">{title}</p>}
        {children && (
          <div className={cn('leading-relaxed', title && 'text-muted-foreground')}>{children}</div>
        )}
      </div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-m-1 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}
