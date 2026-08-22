import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import Avatar from '../ui/Avatar';
import StatusIndicator from './StatusIndicator';

export default function EmployeeCard({ employee }) {
  return (
    <Link
      to={`/employees/${employee.id}`}
      className="group relative flex flex-col rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white p-4 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-primary)]/35 hover:shadow-[var(--shadow-card-hover)] focus-visible:-translate-y-0.5"
    >
      <div className="flex items-start justify-between">
        <Avatar name={employee.name} src={employee.avatar} size="lg" />
        <StatusIndicator status={employee.status} />
      </div>

      <div className="mt-3.5 space-y-0.5">
        <h3 className="truncate font-display text-[17px] font-semibold leading-snug text-[var(--color-ink)]">
          {employee.name}
        </h3>
        <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-[var(--color-accent-dark)]">
          {employee.id}
        </p>
      </div>

      <div className="mt-3 space-y-1 border-t border-[var(--color-line)] pt-3">
        <p className="truncate text-sm text-[var(--color-ink)]">{employee.designation}</p>
        <p className="truncate text-[13px] text-[var(--color-ink-soft)]">{employee.department}</p>
        <p className="mt-1.5 flex items-center gap-1.5 truncate text-xs text-[var(--color-ink-faint)]">
          <Mail size={12} className="shrink-0" />
          {employee.email}
        </p>
      </div>
    </Link>
  );
}
