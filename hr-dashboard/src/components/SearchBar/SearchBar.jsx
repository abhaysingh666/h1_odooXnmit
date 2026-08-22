import { Search, X, SlidersHorizontal } from 'lucide-react';
import { DEPARTMENTS, ATTENDANCE_STATUS_LABEL } from '../../utils/constants';

export default function SearchBar({
  value,
  onChange,
  department,
  onDepartmentChange,
  status,
  onStatusChange,
  resultCount,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1">
        <Search
          size={17}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-ink-faint)]"
        />
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search by name, employee ID, department, or email"
          aria-label="Search employees"
          className="h-11 w-full rounded-[var(--radius-control)] border border-[var(--color-line-strong)] bg-white pl-10 pr-9 text-sm text-[var(--color-ink)] placeholder:text-[var(--color-ink-faint)] transition-colors focus:border-[var(--color-primary)]"
        />
        {value && (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--color-ink-faint)] hover:text-[var(--color-ink)]"
          >
            <X size={15} />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-1.5 text-[var(--color-ink-faint)] sm:flex">
          <SlidersHorizontal size={15} />
        </div>
        <select
          value={department}
          onChange={(e) => onDepartmentChange(e.target.value)}
          aria-label="Filter by department"
          className="h-11 rounded-[var(--radius-control)] border border-[var(--color-line-strong)] bg-white px-3 text-sm text-[var(--color-ink)] transition-colors focus:border-[var(--color-primary)]"
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((dep) => (
            <option key={dep} value={dep}>
              {dep}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value)}
          aria-label="Filter by attendance status"
          className="h-11 rounded-[var(--radius-control)] border border-[var(--color-line-strong)] bg-white px-3 text-sm text-[var(--color-ink)] transition-colors focus:border-[var(--color-primary)]"
        >
          <option value="">All statuses</option>
          {Object.entries(ATTENDANCE_STATUS_LABEL).map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      {typeof resultCount === 'number' && (
        <span className="whitespace-nowrap text-xs text-[var(--color-ink-faint)] sm:pl-1">
          {resultCount} {resultCount === 1 ? 'employee' : 'employees'}
        </span>
      )}
    </div>
  );
}
