import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { cn, copyText } from '@/lib/utils';
import { Button } from './Button';

/** Copy-to-clipboard button that flips to a check for a moment. */
export function CopyButton({ value, label = 'Copy', size = 'icon-sm', variant = 'ghost', className, onCopied }) {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1600);
    return () => clearTimeout(timer);
  }, [copied]);

  const handleCopy = async () => {
    const ok = await copyText(value);
    if (ok) {
      setCopied(true);
      onCopied?.();
    }
  };

  const iconOnly = size === 'icon' || size === 'icon-sm';

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleCopy}
      aria-label={copied ? 'Copied' : label}
      className={cn(copied && 'text-[color-mix(in_oklab,var(--chart-3)_78%,var(--foreground))]', className)}
    >
      {copied ? <Check /> : <Copy />}
      {!iconOnly && (copied ? 'Copied' : label)}
    </Button>
  );
}

/**
 * Read-only value in a mono box with a copy affordance — used to hand generated
 * Login IDs, temporary passwords and registration links to the admin.
 */
export function CopyField({ label, value, mono = true, truncate = true, className, hint, onCopied }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {label}
          </span>
          {hint && <span className="text-xs text-muted-foreground/80">{hint}</span>}
        </div>
      )}
      <div className="flex items-center gap-2 rounded-md border border-border bg-muted/40 py-1 pl-3 pr-1">
        <code
          className={cn(
            'min-w-0 flex-1 text-sm text-foreground',
            mono && 'font-mono',
            truncate ? 'truncate' : 'break-all'
          )}
          title={value}
        >
          {value}
        </code>
        <CopyButton value={value} onCopied={onCopied} className="shrink-0" />
      </div>
    </div>
  );
}
