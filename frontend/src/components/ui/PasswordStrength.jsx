import { Check, X } from 'lucide-react';
import { cn, passwordRules, passwordStrength } from '@/lib/utils';
import { Progress } from './Skeleton';

/**
 * Strength meter + live rule checklist. The rules come from `passwordRules`,
 * which mirrors the backend password validator, so what's shown green here is
 * exactly what the API will accept.
 */
export function PasswordStrength({ value = '', className, showRules = true }) {
  const { label, percent, score, valid } = passwordStrength(value);

  const barColor =
    score <= 2
      ? 'bg-destructive'
      : score === 3
        ? 'bg-chart-4'
        : score === 4
          ? 'bg-chart-5'
          : 'bg-chart-3';

  if (!value) {
    return showRules ? (
      <ul className={cn('grid gap-1.5 sm:grid-cols-2', className)}>
        {passwordRules.map((rule) => (
          <RuleRow key={rule.id} label={rule.label} state="idle" />
        ))}
      </ul>
    ) : null;
  }

  return (
    <div className={cn('space-y-2.5', className)}>
      <div className="space-y-1.5">
        <Progress value={percent} indicatorClassName={barColor} />
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Password strength</span>
          <span
            className={cn(
              'font-medium',
              valid ? 'text-[color-mix(in_oklab,var(--chart-3)_78%,var(--foreground))]' : 'text-muted-foreground'
            )}
          >
            {label}
          </span>
        </div>
      </div>

      {showRules && (
        <ul className="grid gap-1.5 sm:grid-cols-2">
          {passwordRules.map((rule) => (
            <RuleRow
              key={rule.id}
              label={rule.label}
              state={rule.test(value) ? 'pass' : 'fail'}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function RuleRow({ label, state }) {
  return (
    <li
      className={cn(
        'flex items-center gap-1.5 text-xs transition-colors',
        state === 'pass'
          ? 'text-[color-mix(in_oklab,var(--chart-3)_78%,var(--foreground))]'
          : state === 'fail'
            ? 'text-muted-foreground'
            : 'text-muted-foreground/70'
      )}
    >
      <span
        className={cn(
          'grid size-3.5 shrink-0 place-items-center rounded-full transition-colors',
          state === 'pass' ? 'bg-chart-3/25' : 'bg-muted'
        )}
        aria-hidden="true"
      >
        {state === 'pass' ? <Check className="size-2.5" /> : state === 'fail' ? <X className="size-2.5" /> : null}
      </span>
      {label}
    </li>
  );
}
