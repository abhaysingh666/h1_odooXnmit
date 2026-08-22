import { useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from './Button';

/**
 * Lightweight modal — portal + overlay + Escape/click-outside close, focus moved
 * into the panel on open and restored on close. Deliberately dependency-free so
 * the app doesn't need the Radix runtime.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'default',
  dismissible = true,
  className,
}) {
  const panelRef = useRef(null);
  const restoreFocusRef = useRef(null);

  const handleClose = useCallback(() => {
    if (dismissible) onClose?.();
  }, [dismissible, onClose]);

  useEffect(() => {
    if (!open) return;

    restoreFocusRef.current = document.activeElement;

    const onKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        handleClose();
        return;
      }

      // Keep Tab inside the panel while the dialog is open.
      if (event.key === 'Tab' && panelRef.current) {
        const focusable = panelRef.current.querySelectorAll(
          'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKeyDown, true);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus the panel itself rather than the first control, so the close button
    // isn't pre-selected on dialogs that reveal credentials.
    const raf = requestAnimationFrame(() => panelRef.current?.focus());

    return () => {
      document.removeEventListener('keydown', onKeyDown, true);
      document.body.style.overflow = previousOverflow;
      cancelAnimationFrame(raf);
      restoreFocusRef.current?.focus?.();
    };
  }, [open, handleClose]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-sm',
    default: 'max-w-lg',
    lg: 'max-w-2xl',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div
        className="absolute inset-0 animate-fade-in bg-foreground/35 backdrop-blur-[3px]"
        onClick={handleClose}
        aria-hidden="true"
      />

      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        tabIndex={-1}
        className={cn(
          'relative z-10 w-full animate-scale-in rounded-t-xl border border-border bg-card shadow-2xl',
          'max-h-[92dvh] overflow-y-auto outline-none sm:rounded-lg',
          sizes[size],
          className
        )}
      >
        {(title || dismissible) && (
          <div className="flex items-start justify-between gap-4 border-b border-border p-5">
            <div className="min-w-0 space-y-1">
              {title && (
                <h2 className="text-base font-semibold leading-snug tracking-tight">{title}</h2>
              )}
              {description && (
                <p className="text-sm leading-relaxed text-muted-foreground">{description}</p>
              )}
            </div>
            {dismissible && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onClose}
                aria-label="Close dialog"
                className="-mr-1 -mt-1 shrink-0 text-muted-foreground"
              >
                <X />
              </Button>
            )}
          </div>
        )}

        {children && <div className="p-5">{children}</div>}

        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-border bg-muted/25 p-4 sm:flex-row sm:justify-end">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/** Confirm-destructive-action dialog used by the profile danger zone. */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  tone = 'destructive',
}) {
  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      dismissible={!loading}
      size="sm"
      title={title}
      description={description}
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    />
  );
}
