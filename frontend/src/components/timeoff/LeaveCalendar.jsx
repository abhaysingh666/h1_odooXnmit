import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCw } from 'lucide-react';

import { leaveAPI } from '@/services/api';
import { cn, errorMessage } from '@/lib/utils';
import {
  LEAVE_TYPES,
  WEEKDAY_HEADERS,
  leaveType,
  monthGrid,
  monthLabel,
  shiftMonth,
  toISODate,
} from '@/lib/hrms';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Skeleton } from '@/components/ui/Skeleton';

/**
 * The employee time-off view from the wireframe: a month grid with a coloured
 * marker on every day the employee is off, plus a legend for the three types.
 * Pending days are outlined rather than filled so they read as "not yet yours".
 */
export function LeaveCalendar({ employeeId, refreshKey }) {
  const now = new Date();
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await leaveAPI.calendar({
        ...period,
        employee_id: employeeId || undefined,
      });
      setDays(data?.days ?? []);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load the calendar.'));
    } finally {
      setLoading(false);
    }
  }, [period, employeeId]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  /** iso date -> the marked-up day, so the grid is a pure lookup. */
  const marks = useMemo(() => {
    const map = new Map();
    for (const entry of days) {
      map.set(toISODate(entry.day), entry);
    }
    return map;
  }, [days]);

  const grid = useMemo(() => monthGrid(period.year, period.month), [period]);
  const todayISO = toISODate(new Date());

  return (
    <Card>
      <CardHeader className="gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
        <CardTitle className="text-base">{monthLabel(period.year, period.month)}</CardTitle>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => setPeriod((p) => shiftMonth(p.year, p.month, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => setPeriod((p) => shiftMonth(p.year, p.month, 1))}
          >
            <ChevronRight />
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={load} aria-label="Refresh">
            <RotateCw />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && <Alert tone="error">{error}</Alert>}

        <div className="grid grid-cols-7 gap-1.5 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {WEEKDAY_HEADERS.map((label) => (
            <span key={label} className="py-1">
              {label}
            </span>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-7 gap-1.5">
            {Array.from({ length: 42 }).map((_, index) => (
              <Skeleton key={index} className="aspect-square rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-1.5">
            {grid.map((cell) => {
              const mark = marks.get(cell.iso);
              const meta = mark ? leaveType(mark.leave_type) : null;
              const pending = mark?.status === 'pending';

              return (
                <div
                  key={cell.iso}
                  title={
                    mark
                      ? `${meta.label} — ${pending ? 'awaiting approval' : 'approved'}`
                      : undefined
                  }
                  className={cn(
                    'relative flex aspect-square flex-col items-center justify-center rounded-lg border text-sm transition-colors',
                    cell.outside
                      ? 'border-transparent text-muted-foreground/40'
                      : 'border-border/60',
                    !cell.outside && cell.isWeekend && !mark && 'bg-muted/40 text-muted-foreground',
                    cell.iso === todayISO && 'ring-2 ring-primary/40',
                    mark && !pending && 'border-transparent text-primary-foreground',
                    mark && pending && 'border-dashed'
                  )}
                >
                  {mark && !pending && (
                    <span
                      className={cn('absolute inset-0 rounded-lg opacity-90', meta.swatch)}
                      aria-hidden="true"
                    />
                  )}
                  <span className={cn('relative font-medium tabular-nums', mark && !pending && 'text-white')}>
                    {cell.day}
                  </span>
                  {mark && (
                    <span
                      className={cn(
                        'relative mt-0.5 text-[0.625rem] font-semibold uppercase',
                        pending ? 'text-muted-foreground' : 'text-white/90'
                      )}
                    >
                      {pending ? 'pending' : meta.short}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border/60 pt-3">
          {Object.entries(LEAVE_TYPES).map(([key, meta]) => (
            <span key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className={cn('size-2.5 rounded-full', meta.swatch)} aria-hidden="true" />
              {meta.label}
            </span>
          ))}
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span
              className="size-2.5 rounded-full border border-dashed border-muted-foreground"
              aria-hidden="true"
            />
            Awaiting approval
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
