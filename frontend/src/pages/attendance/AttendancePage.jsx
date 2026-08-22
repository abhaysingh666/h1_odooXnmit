import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  ChevronLeft,
  ChevronRight,
  Clock,
  Plane,
  RotateCw,
  Search,
  TimerReset,
  UserRound,
  Users,
} from 'lucide-react';

import { attendanceAPI } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { errorMessage } from '@/lib/utils';
import {
  clockTime,
  dayName,
  longDate,
  monthLabel,
  plainDate,
  recentMonths,
  shiftDate,
  shiftMonth,
  shortDay,
  toISODate,
} from '@/lib/hrms';
import { Alert } from '@/components/ui/Alert';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input, Select } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { EmptyState, PageHeader, StatCard } from '@/components/PageHeader';
import { PresenceBadge } from '@/components/PresenceIndicator';
import { CheckInWidget } from '@/components/CheckInWidget';
import { ManualAttendanceDialog } from '@/components/attendance/ManualAttendanceDialog';

/**
 * Attendance.
 *
 * Everyone sees their own month, day by day, for the ongoing month by default.
 * HR additionally gets the day board — every active employee and what they did
 * on a given date — which is also where missed punches get corrected. Those
 * records are what payroll pro-rates the payslip against.
 */
export default function AttendancePage() {
  const { isAdmin } = useAuth();
  const [bumped, setBumped] = useState(0);

  return (
    <>
      <PageHeader
        title="Attendance"
        description={
          isAdmin
            ? 'Your own month, plus the whole company day by day. Work hours come from the check-in window minus breaks.'
            : 'Your working days this month, derived from your check-in and check-out times minus breaks.'
        }
        icon={CalendarClock}
      />

      <CheckInWidget onChange={() => setBumped((n) => n + 1)} />

      {isAdmin ? (
        <Tabs defaultValue="everyone">
          <TabsList>
            <TabsTrigger value="everyone" icon={Users}>
              Everyone
            </TabsTrigger>
            <TabsTrigger value="mine" icon={UserRound}>
              My attendance
            </TabsTrigger>
          </TabsList>
          <TabsContent value="everyone">
            <DayBoard refreshKey={bumped} />
          </TabsContent>
          <TabsContent value="mine">
            <MyMonth refreshKey={bumped} />
          </TabsContent>
        </Tabs>
      ) : (
        <MyMonth refreshKey={bumped} />
      )}
    </>
  );
}

/* ── Employee month view ─────────────────────────────────────────────────── */

function MyMonth({ refreshKey }) {
  const now = new Date();
  const [period, setPeriod] = useState({ year: now.getFullYear(), month: now.getMonth() + 1 });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const months = useMemo(() => recentMonths(12), []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: payload } = await attendanceAPI.mine(period);
      setData(payload);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load your attendance.'));
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const summary = data?.summary;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous month"
            onClick={() => setPeriod((p) => shiftMonth(p.year, p.month, -1))}
          >
            <ChevronLeft />
          </Button>
          <span className="min-w-40 text-center text-sm font-semibold">
            {monthLabel(period.year, period.month)}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next month"
            onClick={() => setPeriod((p) => shiftMonth(p.year, p.month, 1))}
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={`${period.year}-${period.month}`}
            onChange={(event) => {
              const [year, month] = event.target.value.split('-');
              setPeriod({ year: Number(year), month: Number(month) });
            }}
            className="w-48"
            aria-label="Jump to month"
          >
            {months.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </Select>
          <Button variant="outline" size="icon" onClick={load} aria-label="Refresh">
            <RotateCw />
          </Button>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Count of days present"
          value={loading ? '—' : summary?.days_present ?? 0}
          hint={summary?.half_days ? `${summary.half_days} half day(s)` : 'Full days worked'}
          icon={CalendarDays}
          tone="success"
        />
        <StatCard
          label="Leaves count"
          value={loading ? '—' : summary?.leave_days ?? 0}
          hint={
            summary?.unpaid_leave_days
              ? `${summary.unpaid_leave_days} unpaid — reduces payable days`
              : 'Approved time off'
          }
          icon={Plane}
          tone="accent"
        />
        <StatCard
          label="Total working days"
          value={loading ? '—' : summary?.total_working_days ?? 0}
          hint={`Payable: ${summary?.payable_days ?? 0}`}
          icon={CalendarClock}
          tone="primary"
        />
        <StatCard
          label="Hours worked"
          value={loading ? '—' : summary?.total_work_hours ?? '00:00'}
          hint={`Average ${summary?.average_work_hours ?? '00:00'} · ${
            summary?.total_extra_hours ?? '00:00'
          } extra`}
          icon={Clock}
          tone="muted"
        />
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3 space-y-0">
          <CardTitle className="text-base">Day-wise attendance</CardTitle>
          {summary?.days_absent ? (
            <Badge variant="warning">{summary.days_absent} absent</Badge>
          ) : null}
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead className="text-right">Work Hours</TableHead>
                <TableHead className="text-right">Extra hours</TableHead>
                <TableHead className="text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <SkeletonRows columns={6} />
              ) : !data?.records?.length ? (
                <TableRow>
                  <TableCell colSpan={6} className="p-0">
                    <EmptyState
                      icon={CalendarDays}
                      title="Nothing recorded yet"
                      description="Days appear here as soon as you check in, or when HR records them for you."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data.records.map((record) => (
                  <TableRow
                    key={record.day}
                    className={record.is_working_day ? undefined : 'bg-muted/25'}
                  >
                    <TableCell className="whitespace-nowrap font-medium">
                      <span className="tabular-nums">{shortDay(record.day)}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {dayName(record.day)}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums">{clockTime(record.check_in)}</TableCell>
                    <TableCell className="tabular-nums">{clockTime(record.check_out)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {record.work_hours}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {record.extra_minutes > 0 ? (
                        <span className="text-[color-mix(in_oklab,var(--chart-3)_72%,var(--foreground))]">
                          {record.extra_hours}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">{record.extra_hours}</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <PresenceBadge status={record.status} />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ── Admin day board ─────────────────────────────────────────────────────── */

function DayBoard({ refreshKey }) {
  const todayISO = toISODate(new Date());
  const [date, setDate] = useState(todayISO);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => setQuery(search.trim()), 300);
    return () => clearTimeout(timer);
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: payload } = await attendanceAPI.day({ date, q: query || undefined });
      setData(payload);
      setError('');
    } catch (err) {
      setError(errorMessage(err, 'Could not load the day.'));
    } finally {
      setLoading(false);
    }
  }, [date, query]);

  useEffect(() => {
    load();
  }, [load, refreshKey]);

  const isFuture = date > todayISO;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Previous day"
            onClick={() => setDate((current) => shiftDate(current, -1))}
          >
            <ChevronLeft />
          </Button>
          <Button
            variant="outline"
            size="icon-sm"
            aria-label="Next day"
            onClick={() => setDate((current) => shiftDate(current, 1))}
            disabled={date >= todayISO}
          >
            <ChevronRight />
          </Button>

          {/* The wireframe's Date / Day pair. */}
          <div className="ml-1 flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
            <span className="rounded-md bg-card px-2.5 py-1 text-sm font-semibold shadow-sm">
              {plainDate(date)}
            </span>
            <span className="px-2 py-1 text-sm text-muted-foreground">{dayName(date)}</span>
          </div>

          {date !== todayISO && (
            <Button variant="ghost" size="sm" onClick={() => setDate(todayISO)}>
              Today
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Input
            type="date"
            value={date}
            max={todayISO}
            onChange={(event) => event.target.value && setDate(event.target.value)}
            className="w-40"
            aria-label="Pick a date"
          />
          <Button variant="outline" size="icon" onClick={load} aria-label="Refresh">
            <RotateCw />
          </Button>
          <Button onClick={() => setEditing({ employee_id: '', day: date })}>
            <CalendarPlus />
            Record
          </Button>
        </div>
      </div>

      {error && <Alert tone="error">{error}</Alert>}
      {isFuture && <Alert tone="warning">Attendance cannot be recorded for a future date.</Alert>}
      {data && !data.is_working_day && (
        <Alert tone="info" title="Non-working day">
          {longDate(date)} falls outside the standard working week, so absences here are not counted
          against anyone.
        </Alert>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Employees"
          value={loading ? '—' : data?.total_employees ?? 0}
          hint="Active headcount"
          icon={Users}
          tone="primary"
        />
        <StatCard
          label="Present"
          value={loading ? '—' : data?.present ?? 0}
          hint="Checked in on this date"
          icon={TimerReset}
          tone="success"
        />
        <StatCard
          label="On time off"
          value={loading ? '—' : data?.on_leave ?? 0}
          hint="Approved leave"
          icon={Plane}
          tone="accent"
        />
        <StatCard
          label="Absent"
          value={loading ? '—' : data?.absent ?? 0}
          hint="No check-in, no request"
          icon={CalendarDays}
          tone="warning"
        />
      </div>

      <Card>
        <CardHeader className="gap-3 space-y-0 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-base">Attendance on {plainDate(date)}</CardTitle>
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name or Login ID"
            icon={Search}
            className="sm:w-64"
            aria-label="Search employees"
          />
        </CardHeader>
        <CardContent className="px-0 pb-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Emp</TableHead>
                <TableHead>Check In</TableHead>
                <TableHead>Check Out</TableHead>
                <TableHead className="text-right">Work Hours</TableHead>
                <TableHead className="text-right">Extra hours</TableHead>
                <TableHead className="text-right">Status</TableHead>
                <TableHead className="w-px" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <SkeletonRows columns={7} />
              ) : !data?.records?.length ? (
                <TableRow>
                  <TableCell colSpan={7} className="p-0">
                    <EmptyState
                      icon={Users}
                      title="No employees match"
                      description={
                        query
                          ? 'Try a different name or Login ID.'
                          : 'Add employees to see their attendance here.'
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                data.records.map((record) => (
                  <TableRow key={record.employee_id}>
                    <TableCell>
                      <Link
                        to={`/employees/${record.employee_id}`}
                        className="flex items-center gap-3 hover:text-primary"
                      >
                        <Avatar
                          src={record.employee_avatar_url}
                          name={record.employee_name}
                          size="sm"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium">
                            {record.employee_name}
                          </span>
                          <span className="block truncate font-mono text-xs text-muted-foreground">
                            {record.employee_login_id}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="tabular-nums">{clockTime(record.check_in)}</TableCell>
                    <TableCell className="tabular-nums">{clockTime(record.check_out)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {record.work_hours}
                    </TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {record.extra_hours}
                    </TableCell>
                    <TableCell className="text-right">
                      <PresenceBadge status={record.status} />
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setEditing({
                            employee_id: record.employee_id,
                            employee_name: record.employee_name,
                            day: toISODate(record.day),
                            record,
                          })
                        }
                      >
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs leading-relaxed text-muted-foreground">
        These records are the basis for payslip generation — unpaid leave and days with no
        attendance reduce the payable days on the payslip for that month.
      </p>

      <ManualAttendanceDialog
        open={Boolean(editing)}
        initial={editing}
        maxDate={todayISO}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          load();
        }}
      />
    </div>
  );
}

function SkeletonRows({ columns, rows = 6 }) {
  return Array.from({ length: rows }).map((_, rowIndex) => (
    <TableRow key={rowIndex}>
      {Array.from({ length: columns }).map((__, cellIndex) => (
        <TableCell key={cellIndex}>
          <Skeleton className="h-4 w-full" />
        </TableCell>
      ))}
    </TableRow>
  ));
}
