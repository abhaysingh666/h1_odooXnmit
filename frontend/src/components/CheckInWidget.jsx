import { CalendarOff, Clock, LogIn, LogOut, Plane, TimerReset } from 'lucide-react';

import { cn } from '@/lib/utils';
import { clockTime, leaveType, presence } from '@/lib/hrms';
import { formatStopwatch, useAttendanceToday, useLiveSeconds } from '@/hooks/useAttendanceToday';
import { Button } from './ui/Button';
import { Card, CardContent } from './ui/Card';
import { Skeleton } from './ui/Skeleton';
import { useToast } from './ui/Toast';

/**
 * The check-in / check-out widget.
 *
 * Checking in flips the employee's directory dot from yellow to green; while the
 * clock runs it counts elapsed working time to the second, and after check-out it
 * settles into the day's totals.
 */
export function CheckInWidget({ className, compact = false, onChange }) {
  const { today, loading, error, busy, anchor, checkIn, checkOut } = useAttendanceToday();
  const { success, error: notifyError } = useToast();

  const running = Boolean(today?.checked_in && !today?.checked_out);
  const seconds = useLiveSeconds(anchor, running);

  async function handleCheckIn() {
    try {
      await checkIn();
      success('Checked in', 'Have a good day at work.');
      onChange?.();
    } catch {
      notifyError('Check-in failed', 'Please try again in a moment.');
    }
  }

  async function handleCheckOut() {
    try {
      const data = await checkOut();
      success('Checked out', `You worked ${data?.work_hours ?? '00:00'} today.`);
      onChange?.();
    } catch {
      notifyError('Check-out failed', 'Please try again in a moment.');
    }
  }

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex items-center gap-4 p-5">
          <Skeleton className="size-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-36" />
          </div>
          <Skeleton className="h-10 w-32 rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  const meta = presence(today?.status ?? 'absent');
  const onLeave = Boolean(today?.on_leave) && !today?.checked_in;
  const restDay = !today?.is_working_day && !today?.checked_in && !onLeave;

  const Icon = running ? TimerReset : onLeave ? Plane : restDay ? CalendarOff : Clock;
  const extra = today?.extra_hours && today.extra_hours !== '00:00' ? today.extra_hours : null;

  return (
    <Card
      className={cn(
        'relative overflow-hidden border-border/70',
        running && 'ring-1 ring-chart-3/40',
        className
      )}
    >
      {/* A soft wash keeps the widget feeling live without shouting. */}
      <span
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute inset-0',
          running
            ? 'bg-[radial-gradient(130%_150%_at_0%_0%,color-mix(in_oklab,var(--chart-3)_18%,transparent),transparent_62%)]'
            : 'bg-[radial-gradient(130%_150%_at_0%_0%,color-mix(in_oklab,var(--primary)_13%,transparent),transparent_62%)]'
        )}
      />

      <CardContent
        className={cn(
          'relative flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between',
          compact && 'p-4'
        )}
      >
        <div className="flex min-w-0 items-center gap-4">
          <span
            className={cn(
              'grid size-12 shrink-0 place-items-center rounded-xl',
              running
                ? 'bg-chart-3/20 text-[color-mix(in_oklab,var(--chart-3)_72%,var(--foreground))]'
                : 'bg-primary/12 text-primary'
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>

          <div className="min-w-0">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {running
                ? `Working since ${clockTime(today?.check_in)}`
                : today?.checked_out
                  ? 'Day complete'
                  : onLeave
                    ? leaveType(today?.leave_type).label
                    : restDay
                      ? 'Non-working day'
                      : 'Not checked in yet'}
            </p>

            <p className="font-mono text-2xl font-semibold tracking-tight tabular-nums">
              {running ? formatStopwatch(seconds) : (today?.work_hours ?? '00:00')}
            </p>

            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {running
                ? 'Counting live — break time already deducted'
                : today?.checked_out
                  ? `${clockTime(today?.check_in)} → ${clockTime(today?.check_out)}${extra ? ` · ${extra} extra` : ''}`
                  : onLeave
                    ? 'Approved time off — check in anyway if you drop by'
                    : restDay
                      ? 'Outside your working week'
                      : meta.hint}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {today?.can_check_out ? (
            <Button variant="destructive" loading={busy} onClick={handleCheckOut}>
              <LogOut className="size-4" aria-hidden="true" />
              Check Out
            </Button>
          ) : today?.can_check_in ? (
            <Button loading={busy} onClick={handleCheckIn}>
              <LogIn className="size-4" aria-hidden="true" />
              Check IN
              <span aria-hidden="true">→</span>
            </Button>
          ) : (
            <Button variant="outline" disabled>
              Checked out
            </Button>
          )}
        </div>
      </CardContent>

      {error && (
        <p className="relative border-t border-border/60 px-5 py-2 text-xs text-destructive">
          {error}
        </p>
      )}
    </Card>
  );
}
