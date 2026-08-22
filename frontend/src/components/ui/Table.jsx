import { cn } from '@/lib/utils';

export function Table({ children, className, containerClassName }) {
  return (
    <div className={cn('w-full overflow-x-auto', containerClassName)}>
      <table className={cn('w-full caption-bottom text-sm', className)}>{children}</table>
    </div>
  );
}

export function TableHeader({ children, className }) {
  return (
    <thead className={cn('[&_tr]:border-b [&_tr]:border-border', className)}>{children}</thead>
  );
}

export function TableBody({ children, className }) {
  return (
    <tbody className={cn('[&_tr:last-child]:border-0', className)}>{children}</tbody>
  );
}

export function TableRow({ children, className, ...props }) {
  return (
    <tr
      className={cn(
        'border-b border-border transition-colors hover:bg-accent/25 data-[state=selected]:bg-accent/30',
        className
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className, ...props }) {
  return (
    <th
      scope="col"
      className={cn(
        'h-10 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground',
        className
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function TableCell({ children, className, ...props }) {
  return (
    <td className={cn('px-4 py-3 align-middle', className)} {...props}>
      {children}
    </td>
  );
}
