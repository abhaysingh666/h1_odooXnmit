import { Loader2 } from 'lucide-react';

export default function PageSpinner({ label = 'Loading…' }) {
  return (
    <div className="flex h-full min-h-[50vh] w-full flex-col items-center justify-center gap-3 text-[var(--color-ink-soft)]">
      <Loader2 size={26} className="animate-spin text-[var(--color-primary)]" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
