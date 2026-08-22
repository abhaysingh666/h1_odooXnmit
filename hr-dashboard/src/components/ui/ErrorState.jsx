import { AlertTriangle } from 'lucide-react';
import Button from './Button';

export default function ErrorState({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-[var(--color-danger)]/20 bg-[var(--color-danger-soft)]/40 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[var(--color-danger)]">
        <AlertTriangle size={22} />
      </div>
      <div className="space-y-1">
        <p className="font-display text-lg font-semibold text-[var(--color-ink)]">{title}</p>
        {description && <p className="max-w-sm text-sm text-[var(--color-ink-soft)]">{description}</p>}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}
