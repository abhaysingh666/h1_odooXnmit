import { useEffect, useMemo, useState } from 'react';
import { CalendarX2, Clock4 } from 'lucide-react';
import EmptyState from '../../components/ui/EmptyState';
import ErrorState from '../../components/ui/ErrorState';
import { formatDateShort, hoursBetween } from '../../utils/formatters';
import { ATTENDANCE_STATUS_LABEL } from '../../utils/constants';
import { useAuth } from '../../hooks/useAuth';
import * as attendanceService from '../../services/attendanceService';

const STATUS_BADGE = {
  present: 'bg-[var(--color-status-present-soft)] text-[var(--color-status-present)]',
  leave: 'bg-[var(--color-status-leave-soft)] text-[var(--color-status-leave)]',
  absent: 'bg-[var(--color-status-absent-soft)] text-[var(--color-status-absent)]',
};

function TimeCell(props) {
  const { hhmm } = props;
  if (!hhmm) return <span className="text-[var(--color-ink-faint)]">—</span>;
  const [h, m] = hhmm.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return <span className="font-mono">{d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}</span>;
}

export default function AttendancePage() {
  const { user } = useAuth();
  const [records, setRecords] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    setIsLoading(true);
    attendanceService
      .getAttendance({ employeeId: user.id })
      .then((data) => mounted && setRecords(data))
      .catch(() => mounted && setError('We ran into a problem loading your attendance history.'))
      .finally(() => mounted && setIsLoading(false));
    return () => {
      mounted = false;
    };
  }, [user]);

  const filtered = useMemo(
    () =>
      records.filter((r) => {
        const matchesDate = !dateFilter || r.date === dateFilter;
        const matchesStatus = !statusFilter || r.status === statusFilter;
        return matchesDate && matchesStatus;
      }),
    [records, dateFilter, statusFilter]
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-semibold text-[var(--color-ink)] sm:text-[28px]">Attendance</h1>
        <p className="mt-0.5 text-sm text-[var(--color-ink-soft)]">Your check-in and check-out history.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
          <span className="whitespace-nowrap text-[13px] font-medium">Date</span>
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="h-10 rounded-[var(--radius-control)] border border-[var(--color-line-strong)] bg-white px-3 text-sm focus:border-[var(--color-primary)]"
          />
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--color-ink-soft)]">
          <span className="whitespace-nowrap text-[13px] font-medium">Status</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 rounded-[var(--radius-control)] border border-[var(--color-line-strong)] bg-white px-3 text-sm focus:border-[var(--color-primary)]"
          >
            <option value="">All statuses</option>
            {Object.entries(ATTENDANCE_STATUS_LABEL).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {(dateFilter || statusFilter) && (
          <button
            type="button"
            onClick={() => {
              setDateFilter('');
              setStatusFilter('');
            }}
            className="text-sm font-medium text-[var(--color-primary)] hover:underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {error ? (
        <ErrorState description={error} />
      ) : isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton h-14 w-full rounded-[var(--radius-card)]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState icon={CalendarX2} title="No attendance records found." />
      ) : (
        <div className="overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-line)] bg-white">
          <div className="hidden grid-cols-[1.2fr_1fr_1fr_1fr_1fr] gap-2 border-b border-[var(--color-line)] bg-[var(--color-surface-2)] px-5 py-3 text-xs font-medium uppercase tracking-wide text-[var(--color-ink-faint)] sm:grid">
            <span>Date</span>
            <span>Check-in</span>
            <span>Check-out</span>
            <span>Hours</span>
            <span>Status</span>
          </div>
          <ul>
            {filtered.map((r, i) => (
              <li
                key={`${r.employeeId}-${r.date}`}
                className={`grid grid-cols-2 gap-2 px-5 py-3.5 text-sm sm:grid-cols-[1.2fr_1fr_1fr_1fr_1fr] sm:items-center ${
                  i !== filtered.length - 1 ? 'border-b border-[var(--color-line)]' : ''
                }`}
              >
                <span className="col-span-2 flex items-center gap-2 font-medium text-[var(--color-ink)] sm:col-span-1">
                  <Clock4 size={13} className="text-[var(--color-ink-faint)] sm:hidden" />
                  {formatDateShort(r.date)}
                </span>
                <span>
                  <span className="mr-1 text-xs text-[var(--color-ink-faint)] sm:hidden">In: </span>
                  <TimeCell hhmm={r.checkIn} />
                </span>
                <span>
                  <span className="mr-1 text-xs text-[var(--color-ink-faint)] sm:hidden">Out: </span>
                  <TimeCell hhmm={r.checkOut} />
                </span>
                <span className="text-[var(--color-ink-soft)]">{hoursBetween(r.checkIn, r.checkOut) || '—'}</span>
                <span>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_BADGE[r.status]}`}>
                    {ATTENDANCE_STATUS_LABEL[r.status]}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
