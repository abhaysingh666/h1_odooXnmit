import { cn } from '@/lib/utils';

export function Card({ className, hoverable = false, children, ...props }) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card text-card-foreground shadow-sm',
        hoverable &&
          'transition-[box-shadow,transform,border-color] duration-300 hover:-translate-y-0.5 hover:shadow-lg hover:border-primary/30',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div className={cn('flex flex-col space-y-1.5 p-6', className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({ className, children, as: Tag = 'h3', ...props }) {
  return (
    <Tag
      className={cn('text-lg font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </Tag>
  );
}

export function CardDescription({ className, children, ...props }) {
  return (
    <p className={cn('text-sm leading-relaxed text-muted-foreground', className)} {...props}>
      {children}
    </p>
  );
}

export function CardContent({ className, children, ...props }) {
  return (
    <div className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div className={cn('flex items-center gap-3 p-6 pt-0', className)} {...props}>
      {children}
    </div>
  );
}
