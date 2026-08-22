import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const ToastContext = createContext(null);

const tones = {
  success: { icon: CheckCircle2, accent: 'bg-chart-3', iconClass: 'text-[color-mix(in_oklab,var(--chart-3)_78%,var(--foreground))]' },
  error: { icon: AlertCircle, accent: 'bg-destructive', iconClass: 'text-destructive' },
  warning: { icon: TriangleAlert, accent: 'bg-chart-4', iconClass: 'text-[color-mix(in_oklab,var(--chart-4)_75%,var(--foreground))]' },
  info: { icon: Info, accent: 'bg-primary', iconClass: 'text-primary' },
};

let nextId = 0;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const timers = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((current) => current.filter((t) => t.id !== id));
    const timer = timers.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const push = useCallback(
    ({ title, description, tone = 'info', duration = 4500 }) => {
      const id = ++nextId;
      setToasts((current) => [...current, { id, title, description, tone }]);

      if (duration > 0) {
        timers.current.set(
          id,
          setTimeout(() => dismiss(id), duration)
        );
      }
      return id;
    },
    [dismiss]
  );

  // Clear pending timers if the provider ever unmounts.
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach(clearTimeout);
      map.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      toast: push,
      dismiss,
      success: (title, description) => push({ title, description, tone: 'success' }),
      error: (title, description) => push({ title, description, tone: 'error', duration: 6000 }),
      warning: (title, description) => push({ title, description, tone: 'warning' }),
      info: (title, description) => push({ title, description, tone: 'info' }),
    }),
    [push, dismiss]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Toaster toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function Toaster({ toasts, onDismiss }) {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-0 sm:top-0 sm:items-end"
    >
      {toasts.map((toast) => {
        const config = tones[toast.tone] ?? tones.info;
        const Icon = config.icon;

        return (
          <div
            key={toast.id}
            role={toast.tone === 'error' ? 'alert' : 'status'}
            className={cn(
              'pointer-events-auto relative flex w-full max-w-sm animate-slide-in-right items-start gap-3',
              'overflow-hidden rounded-lg border border-border bg-popover p-3.5 pl-4 text-popover-foreground shadow-xl'
            )}
          >
            <span className={cn('absolute inset-y-0 left-0 w-1', config.accent)} aria-hidden="true" />
            <Icon className={cn('mt-0.5 size-4 shrink-0', config.iconClass)} aria-hidden="true" />
            <div className="min-w-0 flex-1 space-y-0.5">
              {toast.title && <p className="text-sm font-medium leading-snug">{toast.title}</p>}
              {toast.description && (
                <p className="text-xs leading-relaxed text-muted-foreground">{toast.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              className="-m-1 rounded p-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-3.5" />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}
