export function InfoSection({ title, children }) {
  return (
    <section className="rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-5">
      <h2 className="font-display text-[15px] font-semibold text-[var(--color-ink)]">{title}</h2>
      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">{children}</dl>
    </section>
  );
}

export function InfoItem({ label, value, mono }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)]">{label}</dt>
      <dd className={`mt-1 text-sm text-[var(--color-ink)] ${mono ? 'font-mono' : ''}`}>{value || '—'}</dd>
    </div>
  );
}
