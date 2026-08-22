export default function FormField({ label, htmlFor, error, required, children, hint }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={htmlFor} className="text-[13px] font-medium text-[var(--color-ink-soft)]">
        {label}
        {required && <span className="text-[var(--color-danger)]"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-[var(--color-ink-faint)]">{hint}</p>}
      {error && (
        <p role="alert" className="text-xs font-medium text-[var(--color-danger)]">
          {error}
        </p>
      )}
    </div>
  );
}

export const inputClasses = (hasError) =>
  `h-10 w-full rounded-[var(--radius-control)] border bg-white px-3 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] transition-colors focus:border-[var(--color-primary)] ${
    hasError ? 'border-[var(--color-danger)]' : 'border-[var(--color-line-strong)]'
  }`;
