import { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

const MenuContext = createContext(null);

/**
 * Minimal dropdown menu: click to toggle, closes on outside click, Escape, or
 * item activation. Keyboard arrows move between items.
 */
export function DropdownMenu({ children, className }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const id = useId();

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event) => {
      if (!rootRef.current?.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('touchstart', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('touchstart', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  return (
    <MenuContext.Provider value={{ open, setOpen, id }}>
      <div ref={rootRef} className={cn('relative', className)}>
        {children}
      </div>
    </MenuContext.Provider>
  );
}

export function DropdownMenuTrigger({ children, className, asChild = false, ...props }) {
  const ctx = useContext(MenuContext);
  const trigger = {
    'aria-haspopup': 'menu',
    'aria-expanded': ctx.open,
    'aria-controls': ctx.id,
    onClick: (event) => {
      event.preventDefault();
      ctx.setOpen((v) => !v);
    },
  };

  if (asChild && children) {
    return <span {...trigger}>{children}</span>;
  }

  return (
    <button type="button" className={className} {...trigger} {...props}>
      {children}
    </button>
  );
}

export function DropdownMenuContent({ children, align = 'end', className, width = 'w-56' }) {
  const ctx = useContext(MenuContext);
  const listRef = useRef(null);

  const onKeyDown = (event) => {
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();

    const items = Array.from(
      listRef.current?.querySelectorAll('[role="menuitem"]:not([disabled])') ?? []
    );
    if (items.length === 0) return;

    const index = items.indexOf(document.activeElement);
    const next =
      event.key === 'ArrowDown'
        ? items[(index + 1) % items.length]
        : items[(index - 1 + items.length) % items.length];
    next?.focus();
  };

  if (!ctx.open) return null;

  return (
    <div
      ref={listRef}
      id={ctx.id}
      role="menu"
      onKeyDown={onKeyDown}
      className={cn(
        'absolute top-[calc(100%+0.5rem)] z-40 animate-scale-in origin-top overflow-hidden rounded-md',
        'border border-border bg-popover p-1 text-popover-foreground shadow-lg',
        align === 'end' ? 'right-0' : 'left-0',
        width,
        className
      )}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  children,
  onSelect,
  icon: Icon,
  destructive = false,
  disabled = false,
  className,
  ...props
}) {
  const ctx = useContext(MenuContext);

  return (
    <button
      type="button"
      role="menuitem"
      disabled={disabled}
      onClick={() => {
        ctx.setOpen(false);
        onSelect?.();
      }}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-sm px-2.5 py-2 text-left text-sm outline-none transition-colors',
        'focus-visible:bg-accent/50 hover:bg-accent/50',
        destructive
          ? 'text-destructive hover:bg-destructive/10 focus-visible:bg-destructive/10'
          : 'text-popover-foreground',
        disabled && 'pointer-events-none opacity-50',
        className
      )}
      {...props}
    >
      {Icon && <Icon className="size-4 shrink-0" aria-hidden="true" />}
      <span className="truncate">{children}</span>
    </button>
  );
}

export function DropdownMenuLabel({ children, className }) {
  return (
    <div className={cn('px-2.5 py-2', className)}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator({ className }) {
  return <div role="separator" className={cn('-mx-1 my-1 h-px bg-border', className)} />;
}
