export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-[var(--radius-card)] border border-dashed border-[var(--color-line-strong)] bg-white/60 px-6 py-16 text-center">
      {Icon && (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-surface-2)] text-[var(--color-ink-faint)]">
          <Icon size={22} />
        </div>
      )}
      <div className="space-y-1">
        <p className="font-display text-lg font-semibold text-[var(--color-ink)]">{title}</p>
        {description && <p className="max-w-sm text-sm text-[var(--color-ink-soft)]">{description}</p>}
      </div>
      {action}
    </div>
  );
}
