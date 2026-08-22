import { cn } from '@/lib/utils';
import { presence } from '@/lib/hrms';
import { Badge } from './ui/Badge';

/**
 * The spec's at-a-glance presence language, in one place:
 *
 *   green dot     present in office
 *   airplane      on approved time off
 *   yellow dot    absent with no approved request
 */
export function PresenceDot({ status, className, pulse = true, title }) {
  const meta = presence(status);
  const Icon = meta.icon;

  if (Icon) {
    return (
      <span
        title={title ?? meta.label}
        aria-label={meta.label}
        className={cn(
          'grid size-5 place-items-center rounded-full bg-primary/12 text-primary',
          className
        )}
      >
        <Icon className="size-3" aria-hidden="true" />
      </span>
    );
  }

  const live = pulse && status === 'present';

  return (
    <span
      title={title ?? meta.label}
      aria-label={meta.label}
      className={cn('relative grid size-5 place-items-center', className)}
    >
      {live && (
        <span className={cn('absolute size-2.5 animate-ping rounded-full opacity-70', meta.dot)} />
      )}
      <span className={cn('relative size-2.5 rounded-full', meta.dot)} />
    </span>
  );
}

export function PresenceBadge({ status, className, withDot = true }) {
  const meta = presence(status);
  const Icon = meta.icon;

  return (
    <Badge variant={meta.badge} className={cn('gap-1.5', className)}>
      {Icon ? (
        <Icon className="size-3" aria-hidden="true" />
      ) : (
        withDot && <span className={cn('size-1.5 rounded-full', meta.dot)} aria-hidden="true" />
      )}
      {meta.label}
    </Badge>
  );
}

/** The legend under the directory grid, so the dots need no explanation. */
export function PresenceLegend({ className }) {
  const keys = ['present', 'leave', 'absent'];

  return (
    <div className={cn('flex flex-wrap items-center gap-x-5 gap-y-2', className)}>
      {keys.map((key) => {
        const meta = presence(key);
        return (
          <span key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <PresenceDot status={key} pulse={false} className="size-4" />
            <span className="font-medium text-foreground">{meta.label}</span>
            <span className="hidden sm:inline">— {meta.hint}</span>
          </span>
        );
      })}
    </div>
  );
}
