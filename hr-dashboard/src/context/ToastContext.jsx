import { createContext, useCallback, useMemo, useRef, useState } from 'react';
import { CheckCircle2, XCircle, Info, X } from 'lucide-react';

export const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message, type = 'info') => {
      const id = ++idRef.current;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => dismiss(id), 4200);
      return id;
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({
      notify,
      success: (msg) => notify(msg, 'success'),
      error: (msg) => notify(msg, 'error'),
      info: (msg) => notify(msg, 'info'),
    }),
    [notify]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="fixed bottom-5 right-5 z-[100] flex w-[min(360px,calc(100vw-2.5rem))] flex-col gap-2"
        role="region"
        aria-live="polite"
        aria-label="Notifications"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.type] || Info;
          return (
            <div
              key={t.id}
              role="status"
              className={`animate-pop-in flex items-start gap-2.5 rounded-[var(--radius-control)] border px-3.5 py-3 shadow-[var(--shadow-pop)] ${
                t.type === 'success'
                  ? 'bg-white border-[var(--color-status-present)]/25'
                  : t.type === 'error'
                  ? 'bg-white border-[var(--color-danger)]/25'
                  : 'bg-white border-[var(--color-line)]'
              }`}
            >
              <Icon
                size={18}
                className={`mt-0.5 shrink-0 ${
                  t.type === 'success'
                    ? 'text-[var(--color-status-present)]'
                    : t.type === 'error'
                    ? 'text-[var(--color-danger)]'
                    : 'text-[var(--color-primary)]'
                }`}
              />
              <p className="flex-1 text-sm leading-snug text-[var(--color-ink)]">{t.message}</p>
              <button
                type="button"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
                className="rounded p-0.5 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
              >
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
