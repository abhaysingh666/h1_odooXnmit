import { createContext, useContext, useId, useState } from 'react';
import { cn } from '@/lib/utils';

const TabsContext = createContext(null);

export function Tabs({ defaultValue, value: controlled, onValueChange, children, className }) {
  const [uncontrolled, setUncontrolled] = useState(defaultValue);
  const value = controlled ?? uncontrolled;
  const id = useId();

  const setValue = (next) => {
    if (controlled === undefined) setUncontrolled(next);
    onValueChange?.(next);
  };

  return (
    <TabsContext.Provider value={{ value, setValue, id }}>
      <div className={cn('space-y-4', className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ children, className }) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1',
        className
      )}
    >
      {children}
    </div>
  );
}

export function TabsTrigger({ value, children, icon: Icon, className }) {
  const ctx = useContext(TabsContext);
  const active = ctx.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      aria-controls={`${ctx.id}-${value}`}
      onClick={() => ctx.setValue(value)}
      className={cn(
        'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'bg-card text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground',
        className
      )}
    >
      {Icon && <Icon className="size-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

export function TabsContent({ value, children, className }) {
  const ctx = useContext(TabsContext);
  if (ctx.value !== value) return null;

  return (
    <div
      role="tabpanel"
      id={`${ctx.id}-${value}`}
      className={cn('animate-fade-in', className)}
    >
      {children}
    </div>
  );
}
